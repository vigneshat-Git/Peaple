import { Pool, PoolClient } from 'pg';

// Check if using Railway (DATABASE_URL contains railway.app)
const isRailway = process.env.DATABASE_URL?.includes('railway.app');

// Use Railway PostgreSQL DATABASE_URL with SSL, or local without SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRailway ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log("Connected DB:", process.env.DATABASE_URL);
  console.log('[✓] Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export async function getConnection(): Promise<PoolClient> {
  try {
    return await pool.connect();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw error;
  }
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text);
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}

export { pool };
