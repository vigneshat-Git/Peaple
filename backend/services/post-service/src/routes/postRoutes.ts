import { Router } from 'express';
import {
  createPost,
  listPosts,
  getPost,
  deletePost,
  generateUploadUrl,
  toggleSavePost,
  checkSavedPost,
  getSavedPosts,
} from '../controllers/postController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

router.get('/test', (req, res) => res.send('Posts route working'));
router.post('/upload-url', authenticate, generateUploadUrl);
router.post('/', authenticate, createPost);
router.get('/', listPosts);

// Save/Unsave routes - MUST be before /:id to avoid being caught by it
router.get('/saved-posts/all', authenticate, getSavedPosts);
router.get('/:postId/saved', authenticate, checkSavedPost);
router.post('/:postId/save', authenticate, toggleSavePost);

// Generic routes - keep at end
router.get('/:id', getPost);
router.delete('/:id', authenticate, deletePost);

export default router;