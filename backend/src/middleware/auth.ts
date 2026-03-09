import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        statusCode: 401,
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    req.token = token;

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        statusCode: 401,
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        statusCode: 401,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token verification failed',
      statusCode: 500,
    });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  verifyToken(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      });
    }
    
    next();
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    console.warn('Optional auth failed:', error);
    next();
  }
}

export function generateAccessToken(payload: JWTPayload): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as any,
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
}

export function verifyRefreshToken(token: string): JWTPayload {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
}
