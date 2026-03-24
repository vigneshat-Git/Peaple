# Railway PostgreSQL Setup

## 1. Create PostgreSQL Database on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Provision PostgreSQL"
3. Once created, go to the PostgreSQL service
4. Click "Connect" tab
5. Copy the `DATABASE_URL` (starts with `postgresql://`)

## 2. Configure Environment Variables

### Option A: Using Railway Dashboard
1. Go to your backend service in Railway
2. Click "Variables" tab
3. Add new variable:
   - Name: `DATABASE_URL`
   - Value: (paste the connection string from step 1)
4. Also add these if not already set:
   - `NODE_ENV=production`
   - `JWT_SECRET` (generate a strong secret)
   - `JWT_REFRESH_SECRET` (generate a strong secret)

### Option B: Using .env file (Local Testing)
Create/Update `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@host:5432/railway
NODE_ENV=production
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

## 3. SSL Configuration (Already Done)

The backend automatically enables SSL for production:
```typescript
ssl: isProd ? { rejectUnauthorized: false } : false
```

This is required for Railway PostgreSQL connections.

## 4. Run Migrations

The migrations run automatically on server start via:
```typescript
await initializeDatabase();
```

## 5. Verify Connection

Check server logs for:
```
[✓] Database connected
Database migrations completed successfully
```

## 6. Connection String Format

Railway provides connection strings in this format:
```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:xxxxx@containers-xxxxx.railway.app:5432/railway
```

## Troubleshooting

### Error: "self-signed certificate in certificate chain"
Solution: SSL is already configured with `rejectUnauthorized: false`

### Error: "Connection refused"
Solution: Check that DATABASE_URL is set correctly and the database is provisioned

### Error: "Authentication failed"
Solution: Verify the password in DATABASE_URL matches your Railway database

## Local Development vs Production

- **Local**: Uses individual config (host, port, user, password)
- **Production**: Uses DATABASE_URL from Railway with SSL enabled

The backend automatically detects which mode to use based on the presence of DATABASE_URL.
