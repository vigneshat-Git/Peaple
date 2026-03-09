import { Router, Request, Response } from 'express';
import { voteService } from './vote.service.js';
import { verifyToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

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
