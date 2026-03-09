import { Router, Request, Response } from 'express';
import { feedService } from './feed.service.js';
import { verifyToken, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, sendPaginationResponse } from '../../utils/response.js';

const router = Router();

// Get personalized user feed
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as 'new' | 'trending' | 'hot') || 'trending';

    const result = await feedService.generateUserFeed(
      req.user.userId,
      page,
      limit,
      sort
    );

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get personalized feed error:', error);
    sendError(res, error.message || 'Failed to get feed', 500);
  }
});

// Get trending posts
router.get('/trending', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getTrendingFeed(page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get trending feed error:', error);
    sendError(res, error.message || 'Failed to get trending posts', 500);
  }
});

// Get new posts
router.get('/new', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getNewFeed(page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get new feed error:', error);
    sendError(res, error.message || 'Failed to get new posts', 500);
  }
});

// Get hot posts (24 hours)
router.get('/hot', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getHotPosts(page, limit);

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get hot feed error:', error);
    sendError(res, error.message || 'Failed to get hot posts', 500);
  }
});

// Get community feed
router.get('/community/:communityId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as 'new' | 'trending' | 'hot') || 'trending';

    const result = await feedService.getCommunityFeed(
      communityId,
      page,
      limit,
      sort
    );

    sendPaginationResponse(res, result.posts, result.total, page, limit);
  } catch (error: any) {
    console.error('Get community feed error:', error);
    sendError(res, error.message || 'Failed to get community feed', 500);
  }
});

// Admin endpoint: Recalculate all scores
router.post('/admin/recalculate-scores', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    // In production, add role-based authorization here
    // For now, only allow this for development

    await feedService.recalculateAllPostScores();

    sendSuccess(res, { message: 'Scores recalculated' }, 'Post scores updated');
  } catch (error: any) {
    console.error('Recalculate scores error:', error);
    sendError(res, error.message || 'Failed to recalculate scores', 500);
  }
});

export default router;
