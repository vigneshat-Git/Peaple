import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../../../shared/database/db';
import { signToken } from '../../../shared/utils/token';

// TODO: Add proper type definitions for User and payload

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    // check existing
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = generateId();
    const result = await pool.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, username, email',
      [id, username, email, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, username: user.username, email: user.email });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleAuth = (req: Request, res: Response) => {
  // TODO: implement Google OAuth login/registration using google_id and avatar_url
  res.status(501).json({ message: 'Not implemented' });
};

export const getCurrentUser = (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json(user);
};

export const logout = (req: Request, res: Response) => {
  // For stateless JWT, logout can be handled on frontend by removing token.
  res.json({ message: 'Logged out' });
};

// helper
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
