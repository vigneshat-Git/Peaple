import { Router, Request, Response } from 'express';
import multer from 'multer';
import { postService } from './post.service.js';
import { commentService } from '../comments/comment.service.js';
import { verifyToken, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, sendPaginationResponse } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';
import { uploadToR2, deleteFromR2, getSignedUploadUrl } from '../../config/storage.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Test route
router.get('/test', (req: Request, res: Response) => {
  console.log('Posts route working');
  res.send('Posts route working');
});

// Generate signed upload URL for direct R2 upload
router.post('/upload-url', verifyToken, async (req: AuthRequest, res: Response) => {
  console.log('Upload URL route hit');
  
  try {
    const { fileType } = req.body;
    
    // Validate fileType
    if (!fileType) {
      return sendError(res, 'fileType is required', 400);
    }
    
    if (!ALLOWED_TYPES.includes(fileType)) {
      return sendError(res, 'Invalid file type. Allowed: image/jpeg, image/png, video/mp4', 400);
    }
    
    // Generate unique file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileType.split('/')[1];
    const key = `posts/${timestamp}-${random}.${extension}`;
    
    // Determine max size
    const isVideo = fileType === 'video/mp4';
    const maxSize = isVideo ? MAX_VIDEO_SIZE : undefined;
    
    // Generate signed PUT URL
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { s3Client } = await import('../../config/storage.js');
    const { env } = await import('../../config/env.js');
    
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Validate signed URL was generated
    if (!signedUrl) {
      console.error('Failed to generate signed URL - result was empty');
      return res.status(500).json({ error: 'Failed to generate upload URL' });
    }
    
    // Construct public URL using R2_PUBLIC_URL
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
    
    console.log('Returning public URL:', publicUrl);
    
    console.log('Generated signed URL for key:', key);
    console.log('Sending uploadUrl:', signedUrl);
    console.log('Sending fileUrl:', publicUrl);
    
    sendSuccess(res, {
      uploadUrl: signedUrl,
      fileUrl: publicUrl,
      key,
      maxSize,
    }, 'Upload URL generated');
  } catch (error: any) {
    console.error('Failed to generate upload URL:', error);
    sendError(res, error.message || 'Failed to generate upload URL', 500);
  }
});

// Create post
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    console.log('Incoming media:', req.body.media);
    console.log('Incoming body:', req.body);

    const { title, content, community_id, media_url, media } = validate(
      req.body,
      validationSchemas.createPost
    );

    console.log('Validated media:', media);

    const post = await postService.createPost(
      title,
      content,
      req.user.userId,
      community_id,
      media_url,
      media
    );

    sendSuccess(res, post, 'Post created', 201);
  } catch (error: any) {
    console.error('Create post error:', error);
    sendError(res, error.message || 'Failed to create post', 400);
  }
});

// Get all posts
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as 'new' | 'trending' | 'hot') || 'new';

    const result = await postService.getPosts(page, limit, sort);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get posts error:', error);
    sendError(res, error.message || 'Failed to get posts', 500);
  }
});

// Get trending posts
router.get('/trending', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getTrendingPosts(page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get trending posts error:', error);
    sendError(res, error.message || 'Failed to get trending posts', 500);
  }
});

// Get post by ID
router.get('/:postId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await postService.getPostById(postId);

    if (!post) {
      return sendError(res, 'Post not found', 404);
    }

    sendSuccess(res, post);
  } catch (error: any) {
    console.error('Get post error:', error);
    sendError(res, error.message || 'Failed to get post', 500);
  }
});

// Get comments for a post - GET /api/posts/:postId/comments (frontend expects this)
router.get('/:postId/comments', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await commentService.getPostComments(postId, page, limit);

    sendPaginationResponse(res, result.comments, result.total, page, limit);
  } catch (error: any) {
    console.error('Get post comments error:', error);
    sendError(res, error.message || 'Failed to get comments', 500);
  }
});

// Create comment on post - POST /api/posts/:postId/comments (alternative frontend route)
router.post('/:postId/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Use mock user if not authenticated (for testing)
    const userId = req.user?.userId || 'a3b4ddd2-c9d5-45e5-9630-03c6782f4f71';
    
    const { postId } = req.params;
    const { content, parentId, parent_comment_id } = req.body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return sendError(res, 'Content is required', 400);
    }

    // Support both parentId (frontend) and parent_comment_id (backend)
    const parentCommentId = parentId || parent_comment_id;

    const comment = await commentService.createComment(
      postId,
      userId,
      content.trim(),
      parentCommentId
    );

    sendSuccess(res, comment, 'Comment created', 201);
  } catch (error: any) {
    console.error('Create comment error:', error);
    sendError(res, error.message || 'Failed to create comment', 400);
  }
});

// Update post
router.patch('/:postId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { postId } = req.params;

    const post = await postService.updatePost(postId, req.user.userId, req.body);

    sendSuccess(res, post, 'Post updated');
  } catch (error: any) {
    console.error('Update post error:', error);
    if (error.message === 'Unauthorized') {
      return sendError(res, error.message, 403);
    }
    sendError(res, error.message || 'Failed to update post', 400);
  }
});

// Delete post
router.delete('/:postId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { postId } = req.params;

    await postService.deletePost(postId, req.user.userId);

    sendSuccess(res, { message: 'Post deleted' }, 'Post deleted successfully');
  } catch (error: any) {
    console.error('Delete post error:', error);
    if (error.message === 'Unauthorized') {
      return sendError(res, error.message, 403);
    }
    sendError(res, error.message || 'Failed to delete post', 400);
  }
});

// Get posts by author
router.get('/author/:authorId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getPostsByAuthor(authorId, page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get author posts error:', error);
    sendError(res, error.message || 'Failed to get posts', 500);
  }
});

// Get community posts
router.get('/community/:communityId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as 'new' | 'trending' | 'hot') || 'new';

    const result = await postService.getCommunityPosts(communityId, page, limit, sort);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get community posts error:', error);
    sendError(res, error.message || 'Failed to get community posts', 500);
  }
});

// Search posts
router.get('/search/keyword/:keyword', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params as { keyword: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getPostsByKeyword(keyword, page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Search posts error:', error);
    sendError(res, error.message || 'Failed to search posts', 500);
  }
});

// Get trending posts
router.get('/trending/top/:timeframe', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await postService.getTrendingPosts(page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get trending posts error:', error);
    sendError(res, error.message || 'Failed to get trending posts', 500);
  }
});

// Upload media endpoint
router.post('/media/upload', verifyToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const url = await uploadToR2(req.file.buffer, req.file.originalname, {
      contentType: req.file.mimetype,
    });

    sendSuccess(res, { url }, 'File uploaded successfully', 201);
  } catch (error: any) {
    console.error('Upload media error:', error);
    sendError(res, error.message || 'File upload failed', 500);
  }
});

export default router;
