#!/usr/bin/env node

import express from 'express';
import bodyParser from 'body-parser';
import { OAuth2Client } from 'google-auth-library';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/peaple'
});

// Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Token function
const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Helper function
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Google Auth Handler
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    console.log('🔍 Verifying Google token...');
    
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
    console.log('✅ Google token verified for:', email);

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
      console.log('📝 Existing user found:', user.username);
    } else {
      // Create new user
      const id = generateId();
      const username = email?.split('@')[0] || `user_${id}`;
      const result = await pool.query(
        'INSERT INTO users (id, username, email, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, avatar_url',
        [id, username, email, googleId, picture]
      );
      user = result.rows[0];
      console.log('👤 New user created:', user.username);
    }

    // Generate JWT token
    const jwtToken = signToken({ 
      userId: user.id, 
      username: user.username, 
      email: user.email 
    });

    console.log('🎉 Google authentication successful!');

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
    console.error('❌ Google auth error:', error);
    res.status(401).json({ message: 'Google OAuth authentication failed' });
  }
};

// Create test server
const app = express();
const PORT = 4001;

app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.send('Test Auth Service is running');
});

// Google OAuth endpoint
app.post('/google', googleAuth);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Auth Service listening on port ${PORT}`);
  console.log(`📍 Google OAuth endpoint: http://localhost:${PORT}/google`);
  console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
});
