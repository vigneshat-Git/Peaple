import { Router, Request, Response } from 'express';
import multer from 'multer';
import { postService } from './post.service.js';
import { verifyToken, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, sendPaginationResponse } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';
import { uploadToR2, deleteFromR2 } from '../../config/storage.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
});

// Create post
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { title, content, community_id, media_url } = validate(
      req.body,
      validationSchemas.createPost
    );

    const post = await postService.createPost(
      title,
      content,
      req.user.userId,
      community_id,
      media_url
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
