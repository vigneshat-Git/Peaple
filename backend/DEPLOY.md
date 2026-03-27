# Railway Deployment Guide - Peaple Backend

This guide covers deploying the Peaple backend with video processing to Railway.

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository with your code
3. Redis instance (Railway provides this)
4. PostgreSQL database (Railway provides this)

## Deployment Steps

### 1. Connect Repository

1. Go to Railway Dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `Peaple` repository
4. Railway will detect the `railway.json` configuration

### 2. Configure Environment Variables

Set these environment variables in Railway Dashboard (Variables tab):

```bash
# Database (Railway provides this automatically if you add a PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (Railway provides this automatically if you add a Redis service)
REDIS_URL=redis://default:password@host:port

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Cloudflare R2 (Object Storage)
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://pub-<account-id>.r2.dev

# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-railway-url.railway.app/api
FRONTEND_URL=https://your-frontend-url.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Add Required Services

In your Railway project, add these services:

1. **PostgreSQL** - Database for posts, users, comments
2. **Redis** - Required for video processing queue (BullMQ)

### 4. Deploy

Railway will automatically deploy when you push to GitHub. Manual deploy:
```bash
git add .
git commit -m "Add video processing pipeline"
git push origin main
```

## How It Works

### FFmpeg Installation

The `nixpacks.toml` file tells Railway to install FFmpeg alongside Node.js:

```toml
[phases.setup]
nixPkgs = ["nodejs", "npm", "ffmpeg"]
```

This happens automatically during build - no manual setup needed.

### Video Processing Flow

1. User uploads video via frontend
2. Video saved to `/tmp` on Railway
3. BullMQ adds job to Redis queue
4. Video worker picks up job
5. FFmpeg converts video (H.264/AAC, 720p max)
6. Thumbnail generated
7. Both uploaded to R2
8. Temporary files cleaned up

### Fallback Behavior

If FFmpeg is not available, videos are uploaded as-is without processing.

## Monitoring

### Health Check
```
GET https://your-api.railway.app/health
```

### View Logs
In Railway Dashboard:
1. Select your service
2. Go to "Deploys" or "Logs" tab
3. View real-time logs

### Video Processing Status
Check job status:
```
GET https://your-api.railway.app/api/media/video/status/:jobId
```

## Troubleshooting

### FFmpeg Not Found
If videos upload but don't process:
```
# Check Railway logs for:
[FFmpeg] ✗ FFmpeg is NOT available
```

Solution: Ensure `nixpacks.toml` is in the backend folder and redeploy.

### Redis Connection Failed
```
Error: connect ECONNREFUSED
```

Solution: Add Redis service in Railway Dashboard and set `REDIS_URL`.

### Video Processing Timeout
Large videos (>100MB) may timeout. FFmpeg processing is async and won't block API.

## Scaling

Railway automatically scales your app. For video processing:
- **Concurrency**: Worker processes 2 videos simultaneously
- **Queue**: Redis queue holds pending jobs
- **Retries**: Failed jobs retry 3 times with exponential backoff

## Cost Optimization

Videos are processed on Railway but stored on Cloudflare R2:
- **Railway**: CPU/time for FFmpeg processing
- **R2**: Storage and bandwidth (much cheaper)

## Frontend Integration

Ensure your frontend API URL points to Railway:

```typescript
// frontend .env.production
VITE_API_URL=https://your-railway-url.railway.app/api
```

## Support

- Railway Docs: https://docs.railway.app
- FFmpeg Docs: https://ffmpeg.org/documentation.html
- BullMQ Docs: https://docs.bullmq.io
