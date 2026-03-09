# API Routes Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Service (`/auth`)
All authentication endpoints handle user registration, login, and token management.

### POST /auth/register
Register a new user.
```json
{
  "username": "string",
  "email": "string",
  "password": "string (min 8 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "username", "email", "created_at" },
    "access_token": "string",
    "refresh_token": "string"
  }
}
```

### POST /auth/login
Login with email and password.
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /auth/refresh
Refresh expired access token.
```json
{
  "refresh_token": "string"
}
```

### GET /auth/me
Get current logged-in user. Requires `Authorization: Bearer <token>`

### PATCH /auth/me
Update current user profile.
```json
{
  "username": "string (optional)",
  "profile_image": "string (optional)",
  "bio": "string (optional)"
}
```

### GET /auth/:userId
Get user profile by ID.

---

## Communities Service (`/communities`)

### POST /communities
Create a new community. Requires authentication.
```json
{
  "name": "string",
  "description": "string",
  "icon_url": "string (optional)",
  "banner_url": "string (optional)"
}
```

### GET /communities
Get all communities with pagination.
```
?page=1&limit=20
```

### GET /communities/:communityId
Get community details.

### PATCH /communities/:communityId
Update community (only creator). Requires authentication.

### POST /communities/:communityId/join
Join a community. Requires authentication.

### POST /communities/:communityId/leave
Leave a community. Requires authentication.

### GET /communities/:communityId/members
Get community members with pagination.
```
?page=1&limit=20
```

### GET /communities/:userId/communities
Get user's communities.
```
?page=1&limit=20
```

---

## Posts Service (`/posts`)

### POST /posts
Create a new post. Requires authentication.
```json
{
  "title": "string",
  "content": "string",
  "community_id": "uuid",
  "media_url": "string (optional)"
}
```

### GET /posts/:postId
Get post by ID.

### PATCH /posts/:postId
Update post (only author). Requires authentication.

### DELETE /posts/:postId
Delete post (only author). Requires authentication.

### GET /posts/author/:authorId
Get posts by specific author.
```
?page=1&limit=20
```

### GET /posts/community/:communityId
Get community posts with sorting.
```
?page=1&limit=20&sort=new|trending|hot
```

### GET /posts/search/keyword/:keyword
Search posts by keyword.
```
?page=1&limit=20
```

### GET /posts/trending/top/:timeframe
Get trending posts.
```
?page=1&limit=20
```

### POST /posts/media/upload
Upload media file. Requires authentication.
Multipart form-data with file.

---

## Comments Service (`/comments`)

### POST /comments/:postId
Create a comment on post. Requires authentication.
```json
{
  "content": "string",
  "parent_comment_id": "uuid (optional for replies)"
}
```

### GET /comments/comment/:commentId
Get comment by ID.

### GET /comments/post/:postId/comments
Get post's top-level comments with pagination.
```
?page=1&limit=20
```

### GET /comments/comment/:commentId/replies
Get replies to a comment.
```
?page=1&limit=20
```

### GET /comments/thread/:rootCommentId
Get entire comment thread (nested).

### GET /comments/user/:userId/comments
Get user's comments.
```
?page=1&limit=20
```

### PATCH /comments/:commentId
Update comment (only author). Requires authentication.
```json
{
  "content": "string"
}
```

### DELETE /comments/:commentId
Delete comment (only author). Requires authentication.

---

## Votes Service (`/votes`)

### POST /votes/post/:postId
Vote on a post. Requires authentication.
```json
{
  "vote_type": "upvote|downvote"
}
```

### POST /votes/comment/:commentId
Vote on a comment. Requires authentication.
```json
{
  "vote_type": "upvote|downvote"
}
```

### GET /votes/post/:postId/score
Get post vote score.

### GET /votes/post/:postId/user
Get current user's vote on post. Requires authentication.

### GET /votes/comment/:commentId/user
Get current user's vote on comment. Requires authentication.

### DELETE /votes/:voteId
Remove a vote. Requires authentication.

---

## Feed Service (`/feed`)

### GET /feed/me
Get personalized feed. Requires authentication.
```
?page=1&limit=20&sort=trending|new|hot
```

### GET /feed/trending
Get trending posts across all communities.
```
?page=1&limit=20
```

### GET /feed/new
Get newest posts.
```
?page=1&limit=20
```

### GET /feed/hot
Get hot posts (last 24 hours).
```
?page=1&limit=20
```

### GET /feed/community/:communityId
Get community-specific feed.
```
?page=1&limit=20&sort=trending|new|hot
```

---

## Scoring Algorithm

Posts are ranked using this formula:
```
score = (upvotes - downvotes) / (hours_since_post + 2)^1.5
```

This ensures:
- **Newer posts** get higher scores
- **More votes** increase ranking
- **Older posts** naturally decay in ranking
- Posts stay relevant for about 7 days

---

## Error Responses

All failed requests return:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limited
- `500` - Server error

---

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

Rate limits:
- General API: 100 requests per 15 minutes
- Login/Register: 5 attempts per 15 minutes
