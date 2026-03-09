import express, { Express, Request, Response } from 'express';
import { env } from './config/env.js';
import { setupMiddleware, setupRateLimiting, errorHandler, notFoundHandler } from './middleware/setup.js';
import { connectRedis, closeRedis } from './config/redis.js';
import { closePool } from './config/database.js';
import { initializeDatabase } from './db/migrations.js';

// Import route handlers
import authRoutes from './services/auth/auth.routes.js';
import postRoutes from './services/posts/post.routes.js';
import communityRoutes from './services/communities/community.routes.js';
import commentRoutes from './services/comments/comment.routes.js';
import voteRoutes from './services/votes/vote.routes.js';
import feedRoutes from './services/feed/feed.routes.js';

const app: Express = express();

// Setup middleware
setupMiddleware(app);
setupRateLimiting(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/feed', feedRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Peaple API',
    version: '1.0.0',
    description: 'Backend API for Peaple - Reddit-style community platform',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      communities: '/api/communities',
      comments: '/api/comments',
      votes: '/api/votes',
      feed: '/api/feed',
    },
    documentation: 'https://github.com/peaple/backend#api-documentation',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    console.log('Connected to Redis');

    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');

    // Start server
    app.listen(env.PORT, () => {
      console.log(`[✓] Peaple API server running on port ${env.PORT}`);
      console.log(`[✓] Environment: ${env.NODE_ENV}`);
      console.log(`[✓] API Base URL: ${env.API_BASE_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeRedis();
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeRedis();
  await closePool();
  process.exit(0);
});

// Start the server
startServer();

export default app;
