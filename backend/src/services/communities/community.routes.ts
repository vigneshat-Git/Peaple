import { Router, Request, Response } from 'express';
import { communityService } from './community.service.js';
import { verifyToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, sendPaginationResponse } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';

const router = Router();

// Create community
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { name, description, icon_url, banner_url } = validate(
      req.body,
      validationSchemas.createCommunity
    );

    const community = await communityService.createCommunity(
      name,
      description,
      req.user.userId,
      icon_url,
      banner_url
    );

    sendSuccess(res, community, 'Community created', 201);
  } catch (error: any) {
    console.error('Create community error:', error);
    sendError(res, error.message || 'Failed to create community', 400);
  }
});

// Get all communities
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await communityService.getAllCommunities(page, limit);

    sendPaginationResponse(res, result.communities, result.total, page, limit);
  } catch (error: any) {
    console.error('Get communities error:', error);
    sendError(res, error.message || 'Failed to get communities', 500);
  }
});

// Get community by ID
router.get('/:communityId', async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;

    const community = await communityService.getCommunityById(communityId);

    if (!community) {
      return sendError(res, 'Community not found', 404);
    }

    sendSuccess(res, community);
  } catch (error: any) {
    console.error('Get community error:', error);
    sendError(res, error.message || 'Failed to get community', 500);
  }
});

// Update community
router.patch('/:communityId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { communityId } = req.params;

    const community = await communityService.updateCommunity(
      communityId,
      req.user.userId,
      req.body
    );

    sendSuccess(res, community, 'Community updated');
  } catch (error: any) {
    console.error('Update community error:', error);
    if (error.message === 'Unauthorized') {
      return sendError(res, error.message, 403);
    }
    sendError(res, error.message || 'Failed to update community', 400);
  }
});

// Join community
router.post('/:communityId/join', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { communityId } = req.params;

    const community = await communityService.getCommunityById(communityId);
    if (!community) {
      return sendError(res, 'Community not found', 404);
    }

    await communityService.joinCommunity(req.user.userId, communityId);

    sendSuccess(res, { message: 'Joined community' }, 'Community joined', 201);
  } catch (error: any) {
    console.error('Join community error:', error);
    sendError(res, error.message || 'Failed to join community', 400);
  }
});

// Leave community
router.post('/:communityId/leave', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { communityId } = req.params;

    await communityService.leaveCommunity(req.user.userId, communityId);

    sendSuccess(res, { message: 'Left community' }, 'Community left');
  } catch (error: any) {
    console.error('Leave community error:', error);
    sendError(res, error.message || 'Failed to leave community', 400);
  }
});

// Get user's communities
router.get('/:userId/communities', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await communityService.getUserCommunities(userId, page, limit);

    sendPaginationResponse(res, result.communities, result.total, page, limit);
  } catch (error: any) {
    console.error('Get user communities error:', error);
    sendError(res, error.message || 'Failed to get user communities', 500);
  }
});

// Get community members
router.get('/:communityId/members', async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await communityService.getCommunityMembers(communityId, page, limit);

    sendPaginationResponse(res, result.members, result.total, page, limit);
  } catch (error: any) {
    console.error('Get community members error:', error);
    sendError(res, error.message || 'Failed to get community members', 500);
  }
});

export default router;
