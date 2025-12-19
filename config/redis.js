import Redis from "ioredis";

let redis;

/**
 * Connects to Redis using environment variables
 * Make sure your .env file has:
 * REDIS_HOST=your-redis-host
 * REDIS_PORT=your-redis-port
 * REDIS_USER=your-redis-username
 * REDIS_PASSWORD=your-redis-password
 */
export const connectRedis = () => {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    // console.log(`📍 Connected to: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  redis.on('ready', () => {
    // console.log('🚀 Redis client is ready to accept commands');
  });

  return redis;
};

/**
 * Gets the Redis client instance
 * @returns {Redis} Redis client instance
 * @throws {Error} If Redis client is not initialized
 */
export const getRedisClient = () => {
  if (!redis) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redis;
};

/**
 * Closes the Redis connection gracefully
 */
export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    // console.log('👋 Redis connection closed');
  }
};