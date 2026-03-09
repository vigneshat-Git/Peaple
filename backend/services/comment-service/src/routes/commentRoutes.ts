import { Router } from 'express';
import {
  createComment,
  getCommentsForPost,
  deleteComment,
} from '../controllers/commentController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/comments', authenticate, createComment);
router.get('/posts/:id/comments', getCommentsForPost);
router.delete('/comments/:id', authenticate, deleteComment);

export default router;