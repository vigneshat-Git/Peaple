# Getting Started with Peaple Backend

## 🎯 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env
```

### Step 3: Start Local Stack
```bash
# Using Docker (easiest)
docker-compose up

# Or manually start PostgreSQL + Redis and then:
npm run dev
```

### Step 4: Test the API
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── services/          # 6 microservices
│   │   ├── auth/
│   │   ├── communities/
│   │   ├── posts/
│   │   ├── comments/
│   │   ├── votes/
│   │   └── feed/
│   ├── middleware/        # Auth, security, error handling
│   ├── config/           # Database, Redis, Storage
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helpers, validation
│   ├── db/               # Migrations, seeds
│   └── index.ts          # Express app
├── README.md             # Setup & overview
├── API_DOCUMENTATION.md  # API reference
├── ARCHITECTURE.md       # System design
├── DEPLOYMENT.md         # Railway guide
└── FRONTEND_INTEGRATION.md # Frontend setup
```

## 🔑 Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Authentication | ✅ | JWT, refresh tokens, password hashing |
| Communities | ✅ | Create, join, browse with membership |
| Posts | ✅ | Create, edit, delete with media URLs |
| Comments | ✅ | Nested comments with threading |
| Voting | ✅ | Upvote/downvote with score calculation |
| Feed | ✅ | Trending, new, hot with ranking algorithm |
| Caching | ✅ | Redis with 5-min TTL |
| Storage | ✅ | Cloudflare R2 integration |

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - All 35+ endpoints with examples
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and database schema
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway deployment guide
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Frontend integration examples

## 💻 Common Commands

```bash
# Development
npm run dev                # Start dev server with auto-reload
npm run lint              # Run ESLint
npm run test              # Run tests

# Database
npm run db:migrate        # Run migrations
npm run db:seed          # Seed demo data

# Production
npm run build             # TypeScript compilation
npm start                 # Start production server

# Docker
docker-compose up         # Start full stack locally
docker-compose down       # Stop containers
```

## 🔌 Example: Create a Community

```bash
# 1. Register & login to get token
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com", 
    "password": "Password123"
  }'

# 2. Save the access_token from response

# 3. Create community
curl -X POST http://localhost:5000/api/communities \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Development",
    "description": "Discuss web frameworks and best practices"
  }'
```

## 🔐 Security

- 🔒 JWT authentication with 7-day access tokens
- 🔐 bcryptjs password hashing (10 rounds)
- ⏱️ Rate limiting (100 req/15min general, 5 req/15min auth)
- 🛡️ Helmet security headers
- ✅ Input validation with Joi
- 🔄 CORS restricted to frontend domain

## 📊 Database

**6 Tables:**
- `users` - User accounts
- `communities` - Community metadata
- `posts` - Posts with scores
- `comments` - Nested comments
- `votes` - Vote records
- `community_members` - Membership tracking

**15+ Indexes** for performance optimization

## 🚀 Deployment

Deploy to Railway in 5 minutes:

1. Create Railway project
2. Add PostgreSQL + Redis
3. Link GitHub repository 
4. Set environment variables
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.

## 🎓 API Examples

### Register User
```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Create Post
```bash
POST /api/posts
Authorization: Bearer <token>
{
  "title": "Getting Started with React",
  "content": "React is great for building UIs...",
  "community_id": "uuid-here"
}
```

### Vote on Post
```bash
POST /api/votes/post/:postId
Authorization: Bearer <token>
{
  "vote_type": "upvote"
}
```

### Get Feed
```bash
GET /api/feed/me?page=1&limit=20&sort=trending
Authorization: Bearer <token>
```

## 🔄 Ranking Algorithm

Posts are ranked using:
```
score = (upvotes - downvotes) / (hours_since_post + 2)^1.5
```

This ensures fresh content gets visibility while older posts naturally decay.

## 🐛 Troubleshooting

**Port 5000 already in use?**
```bash
kill -9 $(lsof -t -i:5000)
```

**Database connection failed?**
```bash
# Verify PostgreSQL is running
psql -U postgres

# Check DATABASE_URL in .env
```

**Redis connection failed?**
```bash
# Verify Redis is running
redis-cli ping

# Check REDIS_URL in .env
```

## 📞 Need Help?

- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues

## ✨ Features

- ✅ Full authentication system
- ✅ 6 independent microservices
- ✅ Advanced feed ranking
- ✅ Nested comments support
- ✅ Vote tracking
- ✅ Community management
- ✅ Media storage integration
- ✅ Redis caching
- ✅ Rate limiting
- ✅ Production-ready

---

**Ready to build Peaple? Let's go! 🚀**
