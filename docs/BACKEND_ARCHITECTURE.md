# Peaple Backend Architecture

## Overview

Microservice architecture on **Railway** with **PostgreSQL** and **Redis**. Media stored on **Cloudflare R2**.

```
┌──────────┐     ┌──────────────────────────────────────────────┐
│  Vercel  │     │              Railway                         │
│ (Next.js)│────▶│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌──────┐   │
│ Frontend │     │  │Auth Svc │ │Post  │ │Comment│ │Vote  │   │
│          │     │  │:3001    │ │:3002 │ │:3003  │ │:3004 │   │
│          │     │  └────┬────┘ └──┬───┘ └───┬───┘ └──┬───┘   │
│          │     │       │         │         │        │        │
│          │     │  ┌────┴─────────┴─────────┴────────┴───┐   │
│          │     │  │           PostgreSQL                  │   │
│          │     │  └──────────────────────────────────────┘   │
│          │     │  ┌──────┐  ┌──────────┐                    │
│          │     │  │Redis │  │Feed Svc  │                    │
│          │     │  │Cache │  │:3005     │                    │
│          │     │  └──────┘  └──────────┘                    │
└──────────┘     └──────────────────────────────────────────────┘
         │
         └──────▶  Cloudflare R2 (media uploads)
```

## API Gateway (optional)

Use an **API Gateway** (e.g., Kong, Express gateway) or a single **Express router** to proxy all `/api/*` routes to individual services. For simplicity, start with a single Express app with modular routers, then split into separate services as traffic grows.

---

## Database Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  reputation INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Communities
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  banner_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_communities_name ON communities(name);

-- Community Members
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'member' | 'moderator' | 'admin'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  media_url TEXT,
  score INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_score ON posts(score DESC);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
CREATE INDEX idx_votes_post ON votes(post_id);
```

---

## Service Specifications

### 1. Auth Service (`:3001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (username, email, password) → returns JWT |
| POST | `/api/auth/login` | Login (email, password) → returns JWT |
| POST | `/api/auth/refresh` | Refresh token → new access + refresh token |
| GET | `/api/auth/me` | Get current user from JWT |

**Tech:** bcrypt for password hashing, jsonwebtoken for JWT (15min access, 7d refresh).

```js
// Middleware: verifyToken
const jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
```

### 2. Post Service (`:3002`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (auth required) |
| GET | `/api/posts/:id` | Get post by ID |
| DELETE | `/api/posts/:id` | Delete post (author only) |
| GET | `/api/communities/:name/posts` | Get community posts (`?sort=hot|new|top&page=1`) |

### 3. Vote Service (`:3004`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/votes` | Cast vote `{ post_id, vote_type }` |
| DELETE | `/api/votes/:postId` | Remove vote |

On vote change, update `posts.score`, `posts.upvotes`, `posts.downvotes`.

### 4. Comment Service (`:3003`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments` | Create comment `{ post_id, content, parent_comment_id? }` |
| GET | `/api/posts/:id/comments` | Get nested comments for post |
| DELETE | `/api/comments/:id` | Delete comment (author only) |

**Nested comments query:**
```sql
WITH RECURSIVE comment_tree AS (
  SELECT *, 0 AS depth FROM comments WHERE post_id = $1 AND parent_comment_id IS NULL
  UNION ALL
  SELECT c.*, ct.depth + 1 FROM comments c
  JOIN comment_tree ct ON c.parent_comment_id = ct.id
)
SELECT * FROM comment_tree ORDER BY depth, created_at;
```

### 5. Feed Service (`:3005`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed` | User feed (`?sort=hot|new|top&page=1`) |
| GET | `/api/feed/trending` | Top 10 trending posts |

**Ranking algorithm (hot sort):**
```js
function hotScore(upvotes, downvotes, createdAt) {
  const hoursSincePost = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return (upvotes - downvotes) / Math.pow(hoursSincePost + 2, 1.5);
}
```

### 6. Community Service (`:3006`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/communities` | List all communities |
| GET | `/api/communities/:name` | Get community details |
| POST | `/api/communities` | Create community (auth required) |
| POST | `/api/communities/:id/join` | Join community |
| DELETE | `/api/communities/:id/join` | Leave community |

---

## Cloudflare R2 Integration

Upload flow:
1. Frontend requests a **presigned upload URL** from backend: `POST /api/uploads/presign`
2. Frontend uploads file directly to R2 using the presigned URL
3. Frontend sends the resulting R2 URL in the post creation payload

```js
// Backend: generate presigned URL
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

app.post('/api/uploads/presign', verifyToken, async (req, res) => {
  const key = `uploads/${req.user.id}/${Date.now()}-${req.body.filename}`;
  const url = await getSignedUrl(r2, new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: req.body.content_type,
  }), { expiresIn: 300 });
  res.json({ upload_url: url, file_url: `${process.env.R2_PUBLIC_URL}/${key}` });
});
```

---

## Redis Caching Strategy

| Key Pattern | TTL | Use |
|-------------|-----|-----|
| `feed:hot:page:{n}` | 60s | Hot feed pages |
| `feed:trending` | 120s | Trending posts |
| `post:{id}` | 300s | Individual post cache |
| `community:{name}` | 600s | Community details |

Invalidate on write operations (post create/delete, vote).

---

## Rate Limiting

```js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for auth
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

---

## Environment Variables (per service)

```env
DATABASE_URL=postgresql://user:pass@host:5432/peaple
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_URL=redis://host:6379
R2_ENDPOINT=https://account.r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=peaple-media
R2_PUBLIC_URL=https://media.peaple.app
```

---

## Project Structure (monorepo recommended)

```
peaple-backend/
├── packages/
│   ├── shared/          # Shared types, utils, DB client
│   │   ├── db.ts        # Knex/Prisma config
│   │   ├── types.ts
│   │   └── middleware.ts # verifyToken, rateLimit
│   ├── auth-service/
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── post-service/
│   ├── vote-service/
│   ├── comment-service/
│   ├── feed-service/
│   └── community-service/
├── docker-compose.yml
├── package.json
└── README.md
```

## Scaling Notes

- Start as a **modular monolith** (single Express app, separate routers), split into microservices when needed
- Use **connection pooling** (pg-pool) for PostgreSQL
- Add **Bull/BullMQ** for async tasks (feed recalculation, notification dispatch)
- Consider **materialized views** for feed ranking at scale
- Add **full-text search** with PostgreSQL `tsvector` or Elasticsearch later
