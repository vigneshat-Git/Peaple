# Peaple Backend - Redis-Style Community Platform

A high-performance, scalable backend architecture for Peaple, a Reddit-style social community platform.

## 🎯 Project Overview

Peaple is a modern community platform built with a **microservices architecture** enabling independent scaling of different services. The backend is designed to handle millions of posts and support millions of users.

### Key Features
- ✅ User authentication with JWT and refresh tokens
- ✅ Community management with membership tracking
- ✅ Post creation with media storage (Cloudflare R2)
- ✅ Nested comments with recursive threading
- ✅ Voting system (upvote/downvote) with score calculation
- ✅ Advanced feed generation with ranking algorithm
- ✅ Redis caching for performance optimization
- ✅ Rate limiting and security middleware
- ✅ PostgreSQL with optimized indexes
- ✅ Fully typed TypeScript codebase

## 🏗️ Architecture

### Microservices
1. **Authentication Service** - User registration, login, JWT tokens
2. **Communities Service** - Community CRUD and membership
3. **Posts Service** - Post management with media support
4. **Comments Service** - Nested comments with threading
5. **Votes Service** - Upvoting/downvoting posts and comments
6. **Feed Service** - Personalized feeds with ranking algorithm

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis with TTL-based invalidation
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Joi schemas

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 12+
- Redis 6+
- Cloudflare R2 account (for media uploads)
- Environment variables configured

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

```bash
# Run migrations to create tables
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/peaple
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=peaple
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=peaple-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API reference.

### Quick API Examples

**Create Account**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Create Community**
```bash
curl -X POST http://localhost:5000/api/communities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Development",
    "description": "Discussion about web frameworks and best practices"
  }'
```

**Create Post**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with React",
    "content": "React is a great library for building UI...",
    "community_id": "uuid-here"
  }'
```

**Vote on Post**
```bash
curl -X POST http://localhost:5000/api/votes/post/post-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vote_type": "upvote"}'
```

**Get Feed**
```bash
curl http://localhost:5000/api/feed/trending?page=1&limit=20
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and profiles
- **communities** - Community metadata and settings
- **posts** - User-generated posts
- **comments** - Comments with nested support
- **votes** - Voting records (on posts and comments)
- **community_members** - Community membership tracking

See [ARCHITECTURE.md](./ARCHITECTURE.md#database-schema) for full schema details.

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with 10 salt rounds
- **CORS Security** - Restricted to frontend domain
- **Rate Limiting** - 100 req/15min general, 5 req/15min for auth
- **Helmet Middleware** - HTTP security headers
- **Input Validation** - Joi schemas on all endpoints
- **SQL Injection Prevention** - Parameterized queries

## 📊 Feed Ranking Algorithm

The feed uses an advanced ranking algorithm to show the most relevant posts:

```
score = (upvotes - downvotes) / (hours_since_post + 2)^1.5
```

This ensures:
- **Recent posts** score higher initially
- **Popular posts** maintain visibility longer
- **Older posts** naturally decay
- Posts stay relevant for ~7 days

## ⚡ Performance Optimizations

1. **Database**
   - Connection pooling (20 max connections)
   - Strategic indexes on frequently queried columns
   - Optimized queries with EXPLAIN ANALYZE

2. **Caching**
   - Redis caching for feed pages (5-min TTL)
   - Cache invalidation on mutations
   - User-specific feeds cached separately

3. **API**
   - Pagination limited to 100 items
   - Selective field retrieval
   - Gzip compression middleware

## 📦 Project Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── auth/         # Authentication service
│   │   ├── posts/        # Posts service
│   │   ├── comments/     # Comments service
│   │   ├── votes/        # Votes service
│   │   ├── communities/  # Communities service
│   │   └── feed/         # Feed generation service
│   ├── middleware/       # Auth, security, error handling
│   ├── config/          # Database, Redis, storage configs
│   ├── utils/           # Helpers, validation, response formatting
│   ├── types/           # TypeScript type definitions
│   ├── db/              # Database migrations and seeds
│   └── index.ts         # Express application setup
├── package.json
├── tsconfig.json
├── .env.example
├── ARCHITECTURE.md      # Detailed architecture documentation
├── API_DOCUMENTATION.md # Complete API reference
└── DEPLOYMENT.md        # Railway deployment guide
```

## 🔄 Development Workflow

```bash
# Install dependencies
npm install

# Configure .env
cp .env.example .env
# Edit .env with your values

# Run migrations
npm run db:migrate

# Start dev server with auto-reload
npm run dev

# Lint code
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Railway (Recommended)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Railway deployment guide.

**Quick deployment:**
1. Create Railway account
2. Link GitHub repository
3. Configure PostgreSQL and Redis plugins
4. Set environment variables
5. Deploy with GitHub Actions

### Docker deployment
```bash
# Build Docker image
docker build -t peaple-backend .

# Run container
docker run -p 5000:5000 --env-file .env peaple-backend
```

## 📈 Scaling Strategy

1. **Horizontal Scaling**
   - Stateless API servers scale independently
   - Railway auto-scaling based on CPU/memory
   - Load balancer distributes requests

2. **Database Scaling**
   - Connection pooling with PgBouncer (optional)
   - Read replicas for scaling reads
   - Sharding for very large datasets

3. **Cache Layer**
   - Redis cluster for high throughput
   - Cache-aside pattern for optimization
   - Cache invalidation strategies

## 🧪 Testing

```bash
# Run test suite
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📖 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/communities` | List communities |
| POST | `/api/communities` | Create community |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:postId` | Get post details |
| POST | `/api/comments/:postId` | Create comment |
| POST | `/api/votes/post/:postId` | Vote on post |
| GET | `/api/feed/me` | Get user feed |
| GET | `/api/feed/trending` | Get trending posts |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete reference.

## 🐛 Common Issues

### Database Connection Failed
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Confirm credentials are correct

### Redis Connection Failed
- Verify Redis is running on correct host:port
- Check REDIS_URL format
- Test with `redis-cli`

### Cloudflare R2 Upload Fails
- Verify R2 credentials
- Check bucket name is correct
- Ensure R2 endpoint is correct

### JWT Token Validation Failed
- Check JWT_SECRET is same as configured
- Verify token hasn't expired
- Check Authorization header format: `Bearer <token>`

## 📞 Support & Documentation

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Reference**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Issues**: Report bugs and feature requests

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🎉 Acknowledgments

Built with ❤️ for the Peaple community platform.

---

**Made with Node.js, Express, PostgreSQL, and Redis** 🚀
