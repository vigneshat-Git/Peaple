import { Request, Response } from 'express';
import pool from '../shared/database/db';
import { generateSignedUploadUrl } from '../shared/utils/r2';

// TODO: Upload to Cloudflare R2; we'll require credentials via env

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
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
    const result = await pool.query(
      `INSERT INTO posts (title, content, author_id, community_id, score, created_at)
       VALUES ($1,$2,$3,$4,0,NOW()) RETURNING *`,
      [title, content || '', user.userId, communityId]
    );

    const post = result.rows[0];
    const postId = post.id;

    if (media && Array.isArray(media)) {
      for (const item of media) {
        await pool.query(
          `INSERT INTO media (post_id, url, type, file_name)
           VALUES ($1, $2, $3, $4)`,
          [postId, item.url, item.type, item.fileName || null]
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

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export const toggleSavePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = (req as any).user;

  if (!user || !user.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if already saved
    const existing = await pool.query(
      'SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2',
      [user.userId, postId]
    );

    let saved = false;

    if (existing.rows.length > 0) {
      // Remove save
      await pool.query(
        'DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2',
        [user.userId, postId]
      );
      saved = false;
    } else {
      // Add save
      await pool.query(
        'INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)',
        [user.userId, postId]
      );
      saved = true;
    }

    res.json({
      success: true,
      saved
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const isPostSaved = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = (req as any).user;

  if (!user || !user.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2',
      [user.userId, postId]
    );

    res.json({
      saved: result.rows.length > 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
