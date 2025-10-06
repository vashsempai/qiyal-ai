import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Pass-through middleware for test mode
const passThroughMiddleware = (req, res, next) => next();

// Conditional logic based on NODE_ENV
let createRateLimit, authRateLimit, apiRateLimit, chatRateLimit;

if (process.env.NODE_ENV === 'test') {
  // In test mode, export pass-through middleware
  createRateLimit = () => passThroughMiddleware;
  authRateLimit = passThroughMiddleware;
  apiRateLimit = passThroughMiddleware;
  chatRateLimit = passThroughMiddleware;
} else {
  // Initialize Redis client for production/development
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
  createRateLimit = (windowMs, max, skipSuccessfulRequests = false) => {
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
      }),
      windowMs,
      max,
      skipSuccessfulRequests,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) =>
        res.status(429).json({
          success: false,
          message: "Too many requests, please try again later."
        }),
    });
  };

  // Create different rate limiters for different types of endpoints
  authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
  apiRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
  chatRateLimit = createRateLimit(60 * 1000, 30); // 30 requests per minute
}

export { createRateLimit, authRateLimit, apiRateLimit, chatRateLimit };
