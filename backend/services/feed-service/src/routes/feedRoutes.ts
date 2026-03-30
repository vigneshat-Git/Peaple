import { Router } from 'express';
import {
  getFeed,
  getTrending,
  getCommunityFeed,
} from '../controllers/feedController';

const router = Router();

// Main feed endpoints
router.get('/', getFeed);                    // GET /api/posts/feed
router.get('/trending', getTrending);        // GET /api/posts/trending
router.get('/community/:communityId', getCommunityFeed);  // GET /api/posts/community/:communityId

export default router;