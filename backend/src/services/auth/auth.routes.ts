import { Router, Request, Response } from 'express';
import { authService } from './auth.service.js';
import { verifyToken, generateAccessToken, generateRefreshToken, AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError, AppError } from '../../utils/response.js';
import { validate, validationSchemas } from '../../utils/validation.js';
import { env } from '../../config/env.js';
import { OAuth2Client } from 'google-auth-library';

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

// Google OAuth - Initiate OAuth flow
router.get('/google', async (req: Request, res: Response) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return sendError(res, 'Google OAuth not configured', 500);
    }

    const redirectUri = env.GOOGLE_REDIRECT_URI || `${env.API_BASE_URL}/api/auth/google/callback`;
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth init error:', error);
    sendError(res, error.message || 'Failed to initiate Google OAuth', 500);
  }
});

// Google OAuth - Handle callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(String(error))}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=No authorization code received`);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=Google OAuth not configured`);
    }

    const redirectUri = env.GOOGLE_REDIRECT_URI || `${env.API_BASE_URL}/api/auth/google/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json() as { error_description?: string };
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json() as { id_token?: string };
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Authenticate with the ID token
    const result = await authService.authenticateWithGoogle(idToken);
    
    // Redirect to frontend with token
    const userJson = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${result.access_token}&user=${userJson}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(error.message || 'Google authentication failed')}`);
  }
});

// Get user by ID - must be after specific routes
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

// Google OAuth - Initiate OAuth flow
router.get('/google', async (req: Request, res: Response) => {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return sendError(res, 'Google OAuth not configured', 500);
    }

    const redirectUri = env.GOOGLE_REDIRECT_URI || `${env.API_BASE_URL}/api/auth/google/callback`;
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth init error:', error);
    sendError(res, error.message || 'Failed to initiate Google OAuth', 500);
  }
});

// Google OAuth - Handle callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(String(error))}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=No authorization code received`);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=Google OAuth not configured`);
    }

    const redirectUri = env.GOOGLE_REDIRECT_URI || `${env.API_BASE_URL}/api/auth/google/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json() as { error_description?: string };
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json() as { id_token?: string };
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Authenticate with the ID token
    const result = await authService.authenticateWithGoogle(idToken);
    
    // Redirect to frontend with token
    const userJson = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${result.access_token}&user=${userJson}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(error.message || 'Google authentication failed')}`);
  }
});

// Google OAuth (legacy - for frontend token verification)
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 'Google token is required', 400);
    }

    const result = await authService.authenticateWithGoogle(token);

    sendSuccess(
      res,
      {
        user: result.user,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
      'Google authentication successful'
    );
  } catch (error: any) {
    console.error('Google auth error:', error);
    sendError(res, error.message || 'Google authentication failed', 401);
  }
});

export default router;
