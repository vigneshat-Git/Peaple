-- Migration: Add saved posts feature
-- Creates a table to track which posts users have saved

-- Saved posts table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS saved_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)  -- Prevent duplicate saves
);

-- Index for fast lookup of user's saved posts
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id, created_at DESC);

-- Index for fast lookup of post saves
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);

-- Add save count to posts table for quick access
ALTER TABLE posts ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;
