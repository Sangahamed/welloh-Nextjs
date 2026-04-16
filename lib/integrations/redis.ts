import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Redis connection
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Memory fallback to prevent crash if env variables are not present during dev
const globalMemoryCache = new Map<string, { value: any; expiry: number }>();

export const cacheSet = async (key: string, value: any, ttlSeconds: number) => {
  if (redis) {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } else {
    globalMemoryCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (redis) {
    const data = await redis.get(key);
    return data ? (typeof data === "string" ? JSON.parse(data) : data) as T : null;
  } else {
    const entry = globalMemoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      globalMemoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  }
};

// Setup generalized rate limiters
// Create an Upstash Ratelimit instance using the sliding window algorithm
let externalApiRateLimiter: Ratelimit | null = null;
if (redis) {
  externalApiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute for Yahoo/Polygon/Gemini
    analytics: true,
  });
}

export const checkRateLimit = async (identifier: string): Promise<{ success: boolean; limit: number; remaining: number }> => {
  if (!externalApiRateLimiter) {
    // If Redis is not configured, we simulate a success for dev.
    return { success: true, limit: 100, remaining: 99 };
  }
  const { success, limit, remaining } = await externalApiRateLimiter.limit(identifier);
  return { success, limit, remaining };
};
