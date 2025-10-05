import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize Redis client.
// It will automatically use the REDIS_URL environment variable if it's set.
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis connection error for rate limiting:', err);
});

/**
 * Creates a rate limiter middleware with a Redis store.
 * @param {number} windowMs - The time window in milliseconds.
 * @param {number} max - The max number of requests per window per IP.
 * @param {boolean} [skipSuccessfulRequests=false] - Whether to count successful requests.
 * @returns {Function} The rate limit middleware.
 */
export const createRateLimit = (windowMs, max, skipSuccessfulRequests = false) => {
  return rateLimit({
    store: new RedisStore({
      // The `ioredis` client instance to use.
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs,
    max,
    skipSuccessfulRequests,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, /*, next, options*/) =>
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later."
      }),
  });
};

// Create different rate limiters for different types of endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const chatRateLimit = createRateLimit(60 * 1000, 30); // 30 requests per minute