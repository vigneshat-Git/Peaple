# PostgreSQL Schema for Peaple Backend

```sql
-- users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- communities
CREATE TABLE communities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- community_members
CREATE TABLE community_members (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  community_id TEXT REFERENCES communities(id)
);

-- posts
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author_id TEXT REFERENCES users(id),
  community_id TEXT REFERENCES communities(id),
  media_url TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- media
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  file_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- comments
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  author_id TEXT REFERENCES comments(id),
  parent_comment_id TEXT REFERENCES comments(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- votes
CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  post_id TEXT REFERENCES posts(id),
  vote_type TEXT CHECK (vote_type IN ('upvote','downvote'))
);

-- saved_posts
CREATE TABLE saved_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  post_id TEXT REFERENCES posts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```
