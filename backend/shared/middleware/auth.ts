import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not set');
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    // attach user info to request - ensure both id and userId are available
    (req as any).user = {
      ...payload,
      id: payload.userId, // Add id alias for compatibility
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
