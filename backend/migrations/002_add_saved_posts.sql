-- Migration: Add saved posts feature
-- Creates a saved_posts table to track which posts users have saved

-- Create saved_posts table
CREATE TABLE IF NOT EXISTS saved_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- Prevent duplicate saves
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_created ON saved_posts(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE saved_posts IS 'Stores which posts users have saved for later viewing';
