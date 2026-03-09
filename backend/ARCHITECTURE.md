# Peaple Backend Architecture

## System Overview

Peaple is a Reddit-style community platform with a modular microservice architecture. Each service is independently deployable and scalable.

```
┌─────────────────────────────────────────────────┐
│           Frontend (Vercel - Next.js)           │
└──────────────┬──────────────────────────────────┘
               │ REST API (Axios/Fetch)
               ▼
┌─────────────────────────────────────────────────┐
│         API Gateway / Load Balancer             │
│              (Railway/Nginx)                    │
└──────────────┬──────────────────────────────────┘
        ┌──────┴──────┐
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│   Auth       │ │   Posts      │
│   Service    │ │   Service    │
└──────────────┘ └──────────────┘
        │              │
        ├──────────┬───┤
        │          │   │
    ┌───▼────┐ ┌──▼───────┐
    │ Comments│ │   Feed   │
    │ Service │ │ Service  │
    └────┬────┘ └──┬───────┘
         │         │
         ├─────┬───┴──┬──────────┐
         │     │      │          │
    ┌────▼─────▼──┐  ▼        ▼
    │ Vote Service│ Redis   PostgreSQL
    │             │ Cache   Database
    └─────────────┘ │
                    │
            Cloudflare R2
             (Media Storage)
```

## Microservices

### 1. Authentication Service (`/services/auth`)
**Responsibility:** User identity and access management

**Features:**
- User registration with validation
- Login with password hashing (bcryptjs)
- JWT access token generation
- Refresh token mechanism
- Password security (salted hashing)
- User profile management

**Database Tables:**
- `users`

**API Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
PATCH  /api/auth/me
GET    /api/auth/:userId
```

### 2. Communities Service (`/services/communities`)
**Responsibility:** Community CRUD and membership management

**Features:**
- Create and manage communities
- Join/leave communities
- Track community membership
- List community members
- Community discovery

**Database Tables:**
- `communities`
- `community_members`

**API Endpoints:**
```
POST   /api/communities
GET    /api/communities
GET    /api/communities/:communityId
PATCH  /api/communities/:communityId
POST   /api/communities/:communityId/join
POST   /api/communities/:communityId/leave
GET    /api/communities/:communityId/members
GET    /api/communities/:userId/communities
```

### 3. Posts Service (`/services/posts`)
**Responsibility:** Post creation, retrieval, and management

**Features:**
- Create posts with media URLs (from Cloudflare R2)
- Edit/delete posts (author only)
- Retrieve posts by various filters
- Search posts by keyword
- Track post metadata (votes, comments)
- Media file upload handling

**Database Tables:**
- `posts`

**API Endpoints:**
```
POST   /api/posts
GET    /api/posts/:postId
PATCH  /api/posts/:postId
DELETE /api/posts/:postId
GET    /api/posts/author/:authorId
GET    /api/posts/community/:communityId
GET    /api/posts/search/keyword/:keyword
GET    /api/posts/trending/top/:timeframe
POST   /api/posts/media/upload
```

### 4. Comments Service (`/services/comments`)
**Responsibility:** Comment management with nested comment support

**Features:**
- Create comments and nested replies
- Edit/delete comments (author only)
- Recursive comment threading
- Pagination for comments
- Comment count tracking
- Parent-child comment relationships

**Database Tables:**
- `comments`

**API Endpoints:**
```
POST   /api/comments/:postId
GET    /api/comments/comment/:commentId
GET    /api/comments/post/:postId/comments
GET    /api/comments/comment/:commentId/replies
GET    /api/comments/thread/:rootCommentId
GET    /api/comments/user/:userId/comments
PATCH  /api/comments/:commentId
DELETE /api/comments/:commentId
```

### 5. Vote Service (`/services/votes`)
**Responsibility:** Upvoting/downvoting on posts and comments

**Features:**
- Upvote/downvote posts and comments
- Toggle votes (vote again to remove)
- Change vote type
- Calculate post scores
- Track user votes
- Vote count management

**Database Tables:**
- `votes`

**API Endpoints:**
```
POST   /api/votes/post/:postId
POST   /api/votes/comment/:commentId
GET    /api/votes/post/:postId/score
GET    /api/votes/post/:postId/user
GET    /api/votes/comment/:commentId/user
DELETE /api/votes/:voteId
```

### 6. Feed Service (`/services/feed`)
**Responsibility:** Feed generation with ranking algorithm

**Features:**
- Personalized user feed based on community membership
- Trending posts (7-day horizon)
- New posts (chronological)
- Hot posts (24-hour horizon)
- Community-specific feeds
- Advanced ranking algorithm
- Redis caching (5-minute TTL)

**Ranking Algorithm:**
```
score = (upvotes - downvotes) / (hours_since_post + 2)^1.5
```

**Caching Strategy:**
- Feed pages cached for 5 minutes
- Invalidates on new votes/posts
- User-specific feeds optimized

**API Endpoints:**
```
GET    /api/feed/me
GET    /api/feed/trending
GET    /api/feed/new
GET    /api/feed/hot
GET    /api/feed/community/:communityId
POST   /api/feed/admin/recalculate-scores
```

## Technology Stack

### Backend Framework
- **Express.js** - RESTful API framework
- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment

### Database
- **PostgreSQL** - Primary relational database
  - UUID primary keys
  - JSONB support (for future enhancements)
  - Full-text search capabilities
  - Indexes for performance optimization

### Cache Layer
- **Redis** - In-memory caching
  - Feed caching (5-minute TTL)
  - Cache invalidation patterns
  - Session support (future)

### Storage
- **Cloudflare R2** - Media upload storage
  - S3-compatible API
  - Signed URLs for uploads
  - Cost-effective alternative to AWS S3

### Security
- **JWT** - Authentication tokens
  - Access tokens (7 days)
  - Refresh tokens (30 days)
- **bcryptjs** - Password hashing (10 rounds)
- **Helmet** - Security headers
- **CORS** - Cross-origin request handling
- **Rate Limiting** - DDoS protection

### Validation
- **Joi** - Request validation schemas
- **Custom validators** - Business logic validation

## Database Schema

### Core Tables

**users**
```sql
id UUID PRIMARY KEY
username VARCHAR(50) UNIQUE NOT NULL
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
profile_image VARCHAR(500)
bio TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**communities**
```sql
id UUID PRIMARY KEY
name VARCHAR(100) UNIQUE NOT NULL
description TEXT NOT NULL
icon_url VARCHAR(500)
banner_url VARCHAR(500)
created_by UUID (FK: users.id)
member_count INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**posts**
```sql
id UUID PRIMARY KEY
title VARCHAR(300) NOT NULL
content TEXT NOT NULL
author_id UUID (FK: users.id)
community_id UUID (FK: communities.id)
media_url VARCHAR(500)
score NUMERIC(10,3)
upvotes INTEGER
downvotes INTEGER
comment_count INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**comments**
```sql
id UUID PRIMARY KEY
post_id UUID (FK: posts.id)
author_id UUID (FK: users.id)
parent_comment_id UUID (FK: comments.id)
content TEXT NOT NULL
score INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

**votes**
```sql
id UUID PRIMARY KEY
user_id UUID (FK: users.id)
post_id UUID (FK: posts.id) [nullable]
comment_id UUID (FK: comments.id) [nullable]
vote_type VARCHAR(10) ['upvote'|'downvote']
created_at TIMESTAMP
UNIQUE(user_id, post_id, comment_id)
```

**community_members**
```sql
id UUID PRIMARY KEY
user_id UUID (FK: users.id)
community_id UUID (FK: communities.id)
joined_at TIMESTAMP
UNIQUE(user_id, community_id)
```

## Middleware & Security

### Request Middleware
1. **Helmet** - Security headers (XSS, clickjacking, etc.)
2. **CORS** - Cross-origin configuration
3. **Body Parser** - JSON parsing (10MB limit)
4. **Logging** - Request logging with timestamps

### Authentication Middleware
- **verifyToken** - JWT validation for protected routes
- **optionalAuth** - Optional token validation
- **AuthRequest** - Type-safe authenticated requests

### Rate Limiting
- **Global**: 100 requests per 15 minutes
- **Auth**: 5 login attempts per 15 minutes
- Uses `express-rate-limit` with Redis backend (optional)

## Error Handling

**Centralized error handling:**
```javascript
ErrorHandler middleware catches all errors and returns standardized responses
```

**Error response format:**
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "stack": "... (development only)"
}
```

## Deployment Architecture

### Railway Deployment

**Service Configuration:**
- Each service in separate Railway apps
- One shared PostgreSQL database
- Shared Redis instance
- Environment variables per service

**Environment Variables:**
```env
DATABASE_URL          # PostgreSQL connection string
REDIS_URL             # Redis connection string
JWT_SECRET            # JWT signing key
JWT_REFRESH_SECRET    # Refresh token key
R2_ACCOUNT_ID         # Cloudflare account
R2_ACCESS_KEY_ID      # AWS credentials
R2_SECRET_ACCESS_KEY  # AWS credentials
```

### Scaling Strategy

1. **Database:** PostgreSQL with connection pooling (20 max connections)
2. **Cache:** Redis for feed caching reduces database load
3. **API Servers:** Stateless design for horizontal scaling
4. **Load Balancing:** Railway auto-scaling based on CPU/memory
5. **CDN:** Cloudflare for static assets

## Development Workflow

### Local Setup
```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Run database migrations
npm run db:migrate

# Run seeds (optional)
npm run db:seed

# Start dev server
npm run dev
```

### Production Deployment
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Success message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Future Enhancements

1. **Message Queue** - Bull/RabbitMQ for async tasks
2. **Real-time** - WebSocket support using Socket.io
3. **Notifications** - Event-driven notifications
4. **Moderation** - Content moderation system
5. **Analytics** - User engagement tracking
6. **Search** - Elasticsearch for full-text search
7. **Admin Panel** - User and content management
8. **Reporting** - Post/comment reporting system
9. **Reputation** - User reputation/karma system
10. **Recommendations** - ML-based recommendations

## Performance Optimization

- **Database Indexes**: Indexed on frequently queried columns
- **Pagination**: Limited to 100 items per page
- **Caching**: Redis caching for feeds (5-min TTL)
- **Query Optimization**: Selective field retrieval
- **Connection Pooling**: PostgreSQL connection pool
- **Gzip Compression**: Response compression middleware

## Monitoring & Logging

**Logs Captured:**
- Request/response logs
- Error stack traces
- Database query warnings
- Cache operations

**Metrics to Track:**
- API response times
- Database query performance
- Cache hit rates
- Error rates
- User activity
