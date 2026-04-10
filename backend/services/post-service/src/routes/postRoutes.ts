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

console.log('[POST ROUTES] LOADED at', new Date().toISOString());

// Debug route - verify deployment
router.get('/test', (req, res) => res.json({ 
  message: 'ok', 
  version: '2.0',
  timestamp: new Date().toISOString(),
  routes: ['/:postId/is-saved', '/:postId/save', '/:postId']
}));

// Debug all incoming requests
router.use((req, res, next) => {
  console.log(`[POST ROUTES] ${req.method} ${req.path} received`);
  next();
});

// Static routes first
router.post('/upload-url', authenticate, generateUploadUrl);
router.get('/saved', authenticate, getSavedPosts);        // GET /api/posts/saved
router.get('/', listPosts);
router.post('/', authenticate, createPost);

// Specific parameterized routes (MUST come before generic :postId routes)
router.get('/:postId/is-saved', authenticate, (req, res, next) => {
  console.log('[POST ROUTES] IS SAVED ROUTE HIT for postId:', req.params.postId);
  next();
}, checkIsSaved);   // GET /api/posts/:postId/is-saved

router.post('/:postId/save', authenticate, (req, res, next) => {
  console.log('[POST ROUTES] SAVE ROUTE HIT for postId:', req.params.postId);
  next();
}, toggleSave);        // POST /api/posts/:postId/save

// Generic parameterized routes (these should be LAST)
router.get('/:postId', getPost);
router.delete('/:postId', authenticate, deletePost);

export default router;