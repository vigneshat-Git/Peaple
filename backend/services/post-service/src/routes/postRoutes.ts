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
import { authenticate } from '../../../../shared/middleware/auth';

const router = Router();

console.log('POST ROUTES LOADED');

// Debug route
router.get('/test', (req, res) => res.json({ message: 'ok', timestamp: new Date().toISOString() }));

// Static routes first
router.post('/upload-url', authenticate, generateUploadUrl);
router.get('/saved', authenticate, getSavedPosts);        // GET /api/posts/saved
router.get('/', listPosts);
router.post('/', authenticate, createPost);

// Specific parameterized routes (MUST come before generic :postId routes)
router.get('/:postId/is-saved', authenticate, (req, res, next) => {
  console.log('IS SAVED ROUTE HIT');
  next();
}, checkIsSaved);   // GET /api/posts/:postId/is-saved

router.post('/:postId/save', authenticate, (req, res, next) => {
  console.log('SAVE ROUTE HIT');
  next();
}, toggleSave);        // POST /api/posts/:postId/save

// Generic parameterized routes (these should be LAST)
router.get('/:postId', getPost);
router.delete('/:postId', authenticate, deletePost);

export default router;