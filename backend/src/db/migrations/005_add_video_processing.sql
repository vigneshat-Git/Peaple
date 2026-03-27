-- Add video_status column to posts table for tracking video processing state
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_status VARCHAR(20) DEFAULT NULL;

-- Add metadata column to media table for storing video metadata (thumbnail, duration, etc.)
ALTER TABLE media ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create index for video status lookups
CREATE INDEX IF NOT EXISTS idx_posts_video_status ON posts(video_status) WHERE video_status IS NOT NULL;
