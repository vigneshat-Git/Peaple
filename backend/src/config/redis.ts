import { createClient } from 'redis';
import { env } from './env.js';

let isRedisConnected = false;

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.warn('Redis max retries exceeded');
        return new Error('Redis disabled');
      }
      return Math.min(retries * 50, 500);
    },
  },
});

// 🔔 Event listeners
redisClient.on('error', (err) => {
  console.warn('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  isRedisConnected = true;
  console.log('Redis Client Ready');
});

redisClient.on('end', () => {
  isRedisConnected = false;
  console.log('Redis Disconnected');
});

// 🚀 Connect Redis (non-blocking safe)
export async function connectRedis() {
  if (!env.REDIS_URL) {
    console.log("⚠️ No REDIS_URL, skipping Redis");
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️ Redis not available, disabling it');

    // ✅ THIS STOPS RECONNECT LOOP
    redisClient.quit().catch(() => {});

    return;
  }
}

// 📦 Cache helper
export async function getCacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {

  // 🔥 Skip Redis if not connected
  if (!isRedisConnected) {
    return fetcher();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetcher();
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('Cache operation failed:', error);
    return fetcher();
  }
}

// 🧹 Invalidate cache
export async function invalidateCache(pattern: string) {
  if (!isRedisConnected) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
  }
}

// 🔌 Close Redis
export async function closeRedis() {
  if (!isRedisConnected) return;

  await redisClient.quit();
}

// 📤 Export client if needed
export { redisClient };