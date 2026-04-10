import { Router } from 'express';
import {
  createPost,
  listPosts,
  getPost,
  deletePost,
  generateUploadUrl,
  toggleSave,
  getSavedPosts,
  checkIsSaved,
} from '../controllers/postController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.get('/test', (req, res) => res.send('Posts route working'));
router.post('/upload-url', authenticate, generateUploadUrl);
router.post('/', authenticate, createPost);
router.get('/', listPosts);
router.get('/saved', authenticate, getSavedPosts);        // GET /api/posts/saved
router.get('/:id', getPost);
router.get('/:id/is-saved', authenticate, checkIsSaved);   // GET /api/posts/:id/is-saved
router.post('/:id/save', authenticate, toggleSave);        // POST /api/posts/:id/save
router.delete('/:id', authenticate, deletePost);

export default router;