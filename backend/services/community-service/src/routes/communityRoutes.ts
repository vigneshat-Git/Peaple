import { Router } from 'express';
import {
  createCommunity,
  listCommunities,
  getCommunity,
  joinCommunity,
} from '../controllers/communityController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/', authenticate, createCommunity);
router.get('/', listCommunities);
router.get('/:id', getCommunity);
router.post('/:id/join', authenticate, joinCommunity);

export default router;