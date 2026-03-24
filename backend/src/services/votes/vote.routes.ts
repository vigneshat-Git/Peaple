import { Router, Request, Response } from 'express';
import { voteService } from './vote.service.js';
import { verifyToken, AuthRequest, optionalAuth } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

// Temporary mock auth for testing
router.post('/mock-auth', (req: Request, res: Response) => {
  const mockUser = {
    userId: 'a3b4ddd2-c9d5-45e5-9630-03c6782f4f71',
    username: 'Vicky'
  };
  
  res.json({
    success: true,
    data: mockUser,
    message: 'Mock authentication successful'
  });
});

// Unified vote endpoint - POST /api/votes (with optional auth for testing)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Use mock user if not authenticated (for testing)
    const userId = req.user?.userId || 'a3b4ddd2-c9d5-45e5-9630-03c6782f4f71';

    const { postId, commentId, value } = req.body;

    // Validate input
    if (!postId && !commentId) {
      return sendError(res, 'Either postId or commentId is required', 400);
    }

    if (value !== 1 && value !== -1) {
      return sendError(res, 'Value must be 1 (upvote) or -1 (downvote)', 400);
    }

    const voteType = value === 1 ? 'upvote' : 'downvote';

    let vote;
    if (postId) {
      vote = await voteService.voteOnPost(userId, postId, voteType);
    } else if (commentId) {
      vote = await voteService.voteOnComment(userId, commentId, voteType);
    }

    sendSuccess(res, vote, 'Vote recorded', 201);
  } catch (error: any) {
    console.error('Vote error:', error);
    sendError(res, error.message || 'Failed to vote', 400);
  }
});

// Vote on post
router.post('/post/:postId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { postId } = req.params;
    const { vote_type } = req.body;

    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return sendError(res, 'Invalid vote type', 400);
    }

    const vote = await voteService.voteOnPost(
      req.user.userId,
      postId,
      vote_type
    );

    sendSuccess(res, vote, 'Vote recorded', 201);
  } catch (error: any) {
    console.error('Vote on post error:', error);
    sendError(res, error.message || 'Failed to vote', 400);
  }
});

// Vote on comment
router.post('/comment/:commentId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { commentId } = req.params;
    const { vote_type } = req.body;

    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return sendError(res, 'Invalid vote type', 400);
    }

    const vote = await voteService.voteOnComment(
      req.user.userId,
      commentId,
      vote_type
    );

    sendSuccess(res, vote, 'Vote recorded', 201);
  } catch (error: any) {
    console.error('Vote on comment error:', error);
    sendError(res, error.message || 'Failed to vote', 400);
  }
});

// Get post score
router.get('/post/:postId/score', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const score = await voteService.getPostScore(postId);

    sendSuccess(res, score);
  } catch (error: any) {
    console.error('Get post score error:', error);
    sendError(res, error.message || 'Failed to get score', 500);
  }
});

// Get user's vote on post
router.get('/post/:postId/user', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { postId } = req.params;

    const vote = await voteService.getUserVoteOnPost(req.user.userId, postId);

    sendSuccess(res, vote || { vote_type: null });
  } catch (error: any) {
    console.error('Get user vote error:', error);
    sendError(res, error.message || 'Failed to get vote', 500);
  }
});

// Get user's vote on comment
router.get('/comment/:commentId/user', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { commentId } = req.params;

    const vote = await voteService.getUserVoteOnComment(req.user.userId, commentId);

    sendSuccess(res, vote || { vote_type: null });
  } catch (error: any) {
    console.error('Get user vote error:', error);
    sendError(res, error.message || 'Failed to get vote', 500);
  }
});

// Remove vote
router.delete('/:voteId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { voteId } = req.params;

    await voteService.removeVote(voteId);

    sendSuccess(res, { message: 'Vote removed' }, 'Vote removed successfully');
  } catch (error: any) {
    console.error('Remove vote error:', error);
    sendError(res, error.message || 'Failed to remove vote', 400);
  }
});

export default router;
