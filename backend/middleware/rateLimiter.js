import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for upload endpoint
 * Max 5 requests per minute
 */
export const uploadRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    data: null,
    message: 'Too many upload requests. Please try again after 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API rate limiter
 * More permissive for general endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: {
    success: false,
    data: null,
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  uploadRateLimiter,
  generalRateLimiter
};
