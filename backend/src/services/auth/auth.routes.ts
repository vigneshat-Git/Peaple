import { Router, Request, Response } from 'express';
import { authService } from './auth.service.js';
import { verifyToken, generateAccessToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, AppError } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = validate(req.body, validationSchemas.register);

    const user = await authService.register(username, email, password);

    // Generate tokens
    const tokens = await authService.login(email, password);

    sendSuccess(
      res,
      {
        user: tokens.user,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
      'Registration successful',
      201
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    sendError(
      res,
      error.message || 'Registration failed',
      error.statusCode || 400
    );
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = validate(req.body, validationSchemas.login);

    const result = await authService.login(email, password);

    sendSuccess(
      res,
      {
        user: result.user,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
      'Login successful'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, error.message || 'Login failed', 401);
  }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return sendError(res, 'Refresh token required', 400);
    }

    const result = await authService.refreshToken(refresh_token);

    sendSuccess(
      res,
      {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
      'Token refreshed'
    );
  } catch (error: any) {
    console.error('Refresh error:', error);
    sendError(res, error.message || 'Token refresh failed', 401);
  }
});

// Get current user
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'User not found', 404);
    }

    const user = await authService.getCurrentUser(req.user.userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user, 'Current user retrieved');
  } catch (error: any) {
    console.error('Get current user error:', error);
    sendError(res, error.message || 'Failed to get user', 500);
  }
});

// Update current user
router.patch('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'User not found', 404);
    }

    const user = await authService.updateUser(req.user.userId, req.body);

    sendSuccess(res, user, 'User updated successfully');
  } catch (error: any) {
    console.error('Update user error:', error);
    sendError(res, error.message || 'Failed to update user', 400);
  }
});

// Get user by ID
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await authService.getUserById(userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, user);
  } catch (error: any) {
    console.error('Get user error:', error);
    sendError(res, error.message || 'Failed to get user', 500);
  }
});

export default router;
