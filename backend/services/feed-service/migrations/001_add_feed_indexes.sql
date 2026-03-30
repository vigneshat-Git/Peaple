-- Performance indexes for feed ranking system
-- Run this migration to optimize feed queries

-- Index for posts sorting by creation date (used in 'new' filter)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Index for posts by community with date (used in community feeds)
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC);

-- Index for posts by upvotes (used in 'top' filter)
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC, created_at DESC);

-- Index for votes lookup by post (used in score calculation)
CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id) WHERE value = 1;

-- Index for votes lookup by user (used in personalization)
CREATE INDEX IF NOT EXISTS idx_votes_user_post ON votes(user_id, post_id);

-- Index for community members (used in personalization scoring)
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);

-- Index for media lookup by post
CREATE INDEX IF NOT EXISTS idx_media_post ON media(post_id);

-- Composite index for hot feed calculation (upvotes - downvotes with time)
CREATE INDEX IF NOT EXISTS idx_posts_score_time ON posts((upvotes - downvotes) DESC, created_at DESC);

-- Partial index for recent posts (last 7 days) - commonly queried for hot/trending
CREATE INDEX IF NOT EXISTS idx_posts_recent ON posts(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Index for community-specific recent posts
CREATE INDEX IF NOT EXISTS idx_posts_community_recent ON posts(community_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '7 days';
