# Railway Deployment Guide

## Prerequisites

1. **Railway Account** - Sign up at https://railway.app
2. **PostgreSQL Database** - Create PostgreSQL plugin
3. **Redis Cache** - Create Redis plugin
4. **Cloudflare R2** - Set up object storage account
5. **GitHub Repository** - Code hosted on GitHub

## Deployment Steps

### 1. Create Railway Project

1. Log in to Railway dashboard
2. Create new project: "Peaple Backend"
3. Add PostgreSQL plugin
4. Add Redis plugin

### 2. Configure PostgreSQL

1. In Railway, go to PostgreSQL plugin
2. Copy connection details:
   - **Host**
   - **Port** (usually 5432)
   - **Database** (usually `railway`)
   - **Username**
   - **Password**

3. Create `DATABASE_URL`:
```
postgresql://username:password@host:port/database
```

### 3. Configure Redis

1. In Railway, go to Redis plugin
2. Copy connection URL: `redis://host:port`
3. Set as `REDIS_URL` environment variable

### 4. Create Environment Variables

In Railway project settings, add these variables:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

JWT_SECRET=your-very-secure-secret-here
JWT_REFRESH_SECRET=another-very-secure-secret-here

R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-cloudflare-access-key
R2_SECRET_ACCESS_KEY=your-cloudflare-secret-key
R2_BUCKET_NAME=peaple-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

FRONTEND_URL=https://your-vercel-domain.vercel.app
API_BASE_URL=https://your-railway-domain.up.railway.app
```

### 5. Deploy from GitHub

1. In Railway, add GitHub service
2. Select `peaple-backend` repository
3. Select `backend` directory (root directory)
4. Configure build settings:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: 18.x or 20.x

### 6. Deploy Backend Service

1. Click "Deploy"
2. Wait for build and deployment to complete
3. Check logs for any errors
4. Verify API is running with health check:
```
curl https://your-railway-domain.up.railway.app/health
```

### 7. Run Database Migrations

After deployment:

1. Get Railway terminal access
2. Run migrations:
```bash
npm run db:migrate
npm run db:seed
```

Or use Railway environment editor:
```bash
npm run db:migrate
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run successfully
- [ ] Redis connection verified
- [ ] Cloudflare R2 credentials validated
- [ ] API health check passing
- [ ] CORS configured for frontend domain
- [ ] JWT secrets are strong and secure
- [ ] Rate limiting is active
- [ ] Error handling is working
- [ ] Logs are accessible
- [ ] Database backups configured
- [ ] Monitoring alerts set up

## Vercel Frontend Integration

In Vercel (frontend):

1. Set environment variables:
```
NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app/api
```

2. Update API calls to use:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

## Monitoring & Scaling

### Railway Metrics
- CPU usage
- Memory usage
- Network I/O
- Replica count (for scaling)

### Auto-scaling Configuration
1. Go to Railway project settings
2. Set resource limits:
   - Max CPU: 2000m
   - Max Memory: 2GB
3. Enable auto-scaling if needed

### Logs
- Access logs in Railway dashboard
- Use `railway logs` CLI command
- Monitor error rates

## Database Maintenance

### Backups
1. Railway handles automatic daily backups
2. Access backups in PostgreSQL plugin settings
3. Configure retention period (30 days recommended)

### Performance Optimization
1. Monitor slow queries
2. Add indexes where needed
3. Use EXPLAIN ANALYZE for query optimization

## Troubleshooting

### Build Fails
- Check Node version compatibility
- Verify all dependencies in package.json
- Look at build logs for specific errors

### Migration Errors
- Ensure DATABASE_URL is correct
- Check PostgreSQL connection
- Review migration SQL syntax

### Redis Connection Issues
- Verify REDIS_URL format
- Check Redis instance is running
- Test connection with `redis-cli`

### API Not Responding
- Check health endpoint
- Review error logs
- Verify environment variables
- Check database connection

### Performance Issues
- Monitor database queries
- Check Redis cache hit rates
- Review API response times
- Consider database optimization

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use Railway managed secrets
   - Rotate JWT secrets periodically

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict IP access if possible

3. **API Security**
   - Enable CORS only for frontend domain
   - Use HTTPS (Railway provides this)
   - Implement rate limiting
   - Validate all inputs

4. **Monitoring**
   - Set up error alerts
   - Monitor failed login attempts
   - Track rate limit violations
   - Review access logs regularly

## Cost Optimization

1. **Database**: 
   - Use appropriate PostgreSQL plan
   - Monitor connection count
   - Optimize queries

2. **Redis**:
   - Monitor memory usage
   - Set appropriate TTLs
   - Consider namespace prefix

3. **Bandwidth**:
   - Use Cloudflare R2 for media
   - Implement pagination
   - Cache responses

4. **Compute**:
   - Right-size CPU/memory allocation
   - Use production-grade plans only
   - Monitor resource usage

## Update & Maintenance

### Regular Updates
1. Keep Node.js version updated
2. Update npm packages regularly
3. Security patches applied immediately

### Database Migrations
1. Create migration files for schema changes
2. Test migrations in staging
3. Deploy migrations before app updates

### Zero-downtime Deployment
1. Railway supports zero-downtime deployments
2. Use database transactions for atomicity
3. Version API endpoints if needed

## Support & Resources

- Railway Documentation: https://docs.railway.app
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Redis Documentation: https://redis.io/docs
- Cloudflare R2: https://developers.cloudflare.com/r2
