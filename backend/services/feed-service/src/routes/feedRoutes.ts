import { Router } from 'express';
import {
  getFeed,
  getTrending,
  getCommunityFeed,
} from '../controllers/feedController';

const router = Router();

router.get('/', getFeed);
router.get('/trending', getTrending);
router.get('/community/:id', getCommunityFeed);

export default router;