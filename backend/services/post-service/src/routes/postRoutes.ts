import { Router } from 'express';
import {
  createPost,
  listPosts,
  getPost,
  deletePost,
} from '../controllers/postController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.post('/', authenticate, createPost);
router.get('/', listPosts);
router.get('/:id', getPost);
router.delete('/:id', authenticate, deletePost);

export default router;