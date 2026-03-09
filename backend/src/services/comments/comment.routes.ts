import { Router, Request, Response } from 'express';
import { commentService } from './comment.service.js';
import { verifyToken, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, sendPaginationResponse } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';

const router = Router();

// Create comment
router.post('/:postId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { postId } = req.params;
    const { content, parent_comment_id } = validate(
      req.body,
      validationSchemas.createComment
    );

    const comment = await commentService.createComment(
      postId,
      req.user.userId,
      content,
      parent_comment_id
    );

    sendSuccess(res, comment, 'Comment created', 201);
  } catch (error: any) {
    console.error('Create comment error:', error);
    sendError(res, error.message || 'Failed to create comment', 400);
  }
});

// Get comment by ID
router.get('/comment/:commentId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const comment = await commentService.getCommentById(commentId);

    if (!comment) {
      return sendError(res, 'Comment not found', 404);
    }

    sendSuccess(res, comment);
  } catch (error: any) {
    console.error('Get comment error:', error);
    sendError(res, error.message || 'Failed to get comment', 500);
  }
});

// Get post comments
router.get('/post/:postId/comments', optionalAuth, async (req: Request, res: Response) => {
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

// Get comment replies
router.get('/comment/:commentId/replies', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await commentService.getCommentReplies(commentId, page, limit);

    sendPaginationResponse(res, result.comments, result.total, page, limit);
  } catch (error: any) {
    console.error('Get replies error:', error);
    sendError(res, error.message || 'Failed to get replies', 500);
  }
});

// Get comment thread
router.get('/thread/:rootCommentId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { rootCommentId } = req.params;

    const comments = await commentService.getCommentThread(rootCommentId);

    sendSuccess(res, { comments });
  } catch (error: any) {
    console.error('Get comment thread error:', error);
    sendError(res, error.message || 'Failed to get comment thread', 500);
  }
});

// Get user comments
router.get('/user/:userId/comments', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await commentService.getUserComments(userId, page, limit);

    sendPaginationResponse(res, result.comments, result.total, page, limit);
  } catch (error: any) {
    console.error('Get user comments error:', error);
    sendError(res, error.message || 'Failed to get user comments', 500);
  }
});

// Update comment
router.patch('/:commentId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return sendError(res, 'Content is required', 400);
    }

    const comment = await commentService.updateComment(
      commentId,
      req.user.userId,
      content
    );

    sendSuccess(res, comment, 'Comment updated');
  } catch (error: any) {
    console.error('Update comment error:', error);
    if (error.message === 'Unauthorized') {
      return sendError(res, error.message, 403);
    }
    sendError(res, error.message || 'Failed to update comment', 400);
  }
});

// Delete comment
router.delete('/:commentId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { commentId } = req.params;

    await commentService.deleteComment(commentId, req.user.userId);

    sendSuccess(res, { message: 'Comment deleted' }, 'Comment deleted successfully');
  } catch (error: any) {
    console.error('Delete comment error:', error);
    if (error.message === 'Unauthorized') {
      return sendError(res, error.message, 403);
    }
    sendError(res, error.message || 'Failed to delete comment', 400);
  }
});

export default router;
