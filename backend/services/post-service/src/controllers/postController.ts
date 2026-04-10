import { Request, Response } from 'express';
import pool from '../../../shared/database/db';
import { generateSignedUploadUrl } from '../../../shared/utils/r2';

// TODO: Upload to Cloudflare R2; we'll require credentials via env

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif', 'video/mp4'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const generateUploadUrl = async (req: Request, res: Response) => {
  console.log("Upload URL route hit");
  console.log("Request body:", req.body);

  const { fileType, fileName } = req.body;

  if (!fileType) {
    console.log("Missing fileType");
    return res.status(400).json({ message: 'fileType is required' });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    console.log("Invalid fileType:", fileType);
    return res.status(400).json({ message: 'Invalid file type' });
  }

  const isVideo = fileType === 'video/mp4';
  const maxSize = isVideo ? MAX_VIDEO_SIZE : undefined;

  try {
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileType.split('/')[1]}`;
    console.log("Generating signed URL for key:", key);
    const { signedUrl, publicUrl } = await generateSignedUploadUrl(key, fileType, maxSize);

    console.log("Signed URL generated successfully");
    res.json({
      uploadUrl: signedUrl,
      fileUrl: publicUrl, // Changed to fileUrl as per user request
      key,
      maxSize,
    });
  } catch (err) {
    console.error('Failed to generate upload URL:', err);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, communityId, media } = req.body;
  const user = (req as any).user;

  if (!title || !communityId) {
    return res.status(400).json({ message: 'Title and communityId are required' });
  }

  try {
    const id = generateId();
    const result = await pool.query(
      `INSERT INTO posts (id, title, content, author_id, community_id, score, created_at)
       VALUES ($1,$2,$3,$4,$5,0,NOW()) RETURNING *`,
      [id, title, content || '', user.userId, communityId]
    );

    const post = result.rows[0];

    if (media && Array.isArray(media)) {
      for (const item of media) {
        await pool.query(
          `INSERT INTO media (post_id, url, type, file_name)
           VALUES ($1, $2, $3, $4)`,
          [id, item.url, item.type, item.fileName || null]
        );
      }
    }

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listPosts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as media
      FROM posts p
      LEFT JOIN media m ON p.id = m.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const postResult = await pool.query('SELECT * FROM posts WHERE id=$1', [id]);
    if (postResult.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const mediaResult = await pool.query('SELECT * FROM media WHERE post_id=$1 ORDER BY created_at', [id]);

    const post = postResult.rows[0];
    post.media = mediaResult.rows.filter((m: any) => m.id !== null);

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const result = await pool.query('DELETE FROM posts WHERE id=$1 AND author_id=$2 RETURNING *', [id, user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Toggle save/unsave a post
 * POST /api/posts/:postId/save
 */
export const toggleSavePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = (req as any).user;
  
  if (!user?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Check if post exists
    const postResult = await pool.query('SELECT id FROM posts WHERE id=$1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already saved
    const savedResult = await pool.query(
      'SELECT id FROM saved_posts WHERE user_id=$1 AND post_id=$2',
      [user.userId, postId]
    );

    const isSaved = savedResult.rows.length > 0;

    if (isSaved) {
      // Unsave: Remove from saved_posts
      await pool.query(
        'DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2',
        [user.userId, postId]
      );
      // Decrement save count
      await pool.query(
        'UPDATE posts SET save_count = GREATEST(0, save_count - 1) WHERE id=$1',
        [postId]
      );
    } else {
      // Save: Add to saved_posts
      const saveId = generateId();
      await pool.query(
        'INSERT INTO saved_posts (id, user_id, post_id) VALUES ($1, $2, $3)',
        [saveId, user.userId, postId]
      );
      // Increment save count
      await pool.query(
        'UPDATE posts SET save_count = save_count + 1 WHERE id=$1',
        [postId]
      );
    }

    res.json({ saved: !isSaved });
  } catch (err) {
    console.error('Toggle save error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Check if user has saved a post
 * GET /api/posts/:postId/saved
 */
export const checkSavedPost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = (req as any).user;
  
  if (!user?.userId) {
    return res.json({ saved: false });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM saved_posts WHERE user_id=$1 AND post_id=$2',
      [user.userId, postId]
    );
    res.json({ saved: result.rows.length > 0 });
  } catch (err) {
    console.error('Check saved error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get user's saved posts
 * GET /api/users/saved-posts
 */
export const getSavedPosts = async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    // Get saved posts with full post data
    const result = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.author_id,
        p.community_id,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.save_count,
        p.created_at,
        p.updated_at,
        c.name as community_name,
        u.username as author_username,
        u.profile_image as author_avatar,
        sp.created_at as saved_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'url', m.url,
              'type', m.type,
              'file_name', m.file_name
            ) ORDER BY m.created_at
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN media m ON p.id = m.post_id
      WHERE sp.user_id = $1
      GROUP BY p.id, c.name, u.username, u.profile_image, sp.created_at
      ORDER BY sp.created_at DESC
      LIMIT $2 OFFSET $3`,
      [user.userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM saved_posts WHERE user_id=$1',
      [user.userId]
    );
    const total = parseInt(countResult.rows[0].total);

    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author_id,
        username: post.author_username,
        avatar: post.author_avatar
      },
      community: {
        id: post.community_id,
        name: post.community_name
      },
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      saveCount: post.save_count,
      media: post.media,
      createdAt: post.created_at,
      savedAt: post.saved_at,
      isSaved: true
    }));

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total
      }
    });
  } catch (err) {
    console.error('Get saved posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
