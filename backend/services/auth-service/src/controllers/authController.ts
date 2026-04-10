import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Direct database connection
const pool = new Pool({
  //connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/peaple'
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ByOiarfBLYvjjevBrVuMqTQKzCVjeoFQ@ballast.proxy.rlwy.net:58471/railway'
});

// Direct token function
const signToken = (payload: object, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: expiresIn });
};

// TODO: Add proper type definitions for User and payload

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

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

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists by email or google_id
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, googleId]
    );

    let user;
    if (existingUser.rows.length > 0) {
      // User exists, update google_id if not set
      user = existingUser.rows[0];
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
          [googleId, picture, user.id]
        );
        user.google_id = googleId;
        user.avatar_url = picture;
      }
    } else {
      // Create new user
      const id = generateId();
      const username = email?.split('@')[0] || `user_${id}`;
      const result = await pool.query(
        'INSERT INTO users (id, username, email, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, avatar_url',
        [id, username, email, googleId, picture]
      );
      user = result.rows[0];
    }

    // Generate JWT token
    const jwtToken = signToken({ 
      userId: user.id, 
      username: user.username, 
      email: user.email 
    });

    res.json({
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url
        },
        access_token: jwtToken
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google OAuth authentication failed' });
  }
};

export const getCurrentUser = (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json(user);
};

export const logout = (req: Request, res: Response) => {
  // For stateless JWT, logout can be handled on frontend by removing token.
  res.json({ message: 'Logged out' });
};

export const getSavedPosts = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user || !user.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Get saved post IDs
    const savedPostsResult = await pool.query(
      'SELECT post_id FROM saved_posts WHERE user_id = $1 ORDER BY created_at DESC',
      [user.userId]
    );

    if (savedPostsResult.rows.length === 0) {
      return res.json([]);
    }

    const postIds = savedPostsResult.rows.map(row => row.post_id);

    // Get posts with media
    const postsResult = await pool.query(`
      SELECT p.*,
             json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as media,
             json_build_object('id', u.id, 'username', u.username) as author,
             json_build_object('id', c.id, 'name', c.name) as community
      FROM posts p
      LEFT JOIN media m ON p.id = m.post_id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.id = ANY($1)
      GROUP BY p.id, u.id, u.username, c.id, c.name
      ORDER BY array_position($1, p.id)
    `, [postIds]);

    res.json(postsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// helper
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
