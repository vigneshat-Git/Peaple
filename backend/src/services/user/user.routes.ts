import { Router, Request, Response } from 'express';
import { communityService } from '../communities/community.service.js';
import { verifyToken, AuthRequest } from '../../middleware/auth.js';
import { sendError, sendPaginationResponse } from '../../utils/response.js';

const router = Router();

// Get current user's communities
router.get('/communities', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await communityService.getUserCommunities(req.user.userId, page, limit);

    sendPaginationResponse(res, result.communities, result.total, page, limit);
  } catch (error: any) {
    console.error('Get user communities error:', error);
    sendError(res, error.message || 'Failed to get user communities', 500);
  }
});

export default router;
