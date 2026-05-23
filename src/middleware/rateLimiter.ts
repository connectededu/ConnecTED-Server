import rateLimit from 'express-rate-limit';


/**
 * Stricter rate limiter for authentication routes (login, register)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after an hour.',
  },
});
