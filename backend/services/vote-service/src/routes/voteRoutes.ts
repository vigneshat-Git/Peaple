import { Router } from 'express';
import { castVote } from '../controllers/voteController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/votes', authenticate, castVote);

export default router;