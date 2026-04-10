import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getCurrentUser,
  logout,
  getSavedPosts,
} from '../controllers/authController';
import { authenticate } from '../shared/middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticate, getCurrentUser);
router.get('/saved-posts', authenticate, getSavedPosts);
router.post('/logout', logout);

export default router;
