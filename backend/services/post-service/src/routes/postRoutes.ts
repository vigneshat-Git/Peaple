import { Router } from 'express';
import {
  createPost,
  listPosts,
  getPost,
  deletePost,
  generateUploadUrl,
  toggleSavePost,
  isPostSaved,
} from '../controllers/postController';
import { authenticate } from '../shared/middleware/auth';

const router = Router();

router.get('/test', (req, res) => res.send('Posts route working'));
router.post('/upload-url', authenticate, generateUploadUrl);
router.post('/', authenticate, createPost);
router.get('/', listPosts);

// 🔥 MUST be BEFORE generic routes
router.post('/:postId/save', authenticate, toggleSavePost);
router.get('/:postId/is-saved', authenticate, isPostSaved);

router.get('/:id', getPost);
router.delete('/:id', authenticate, deletePost);

export default router;