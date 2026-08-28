// src/middlewares/rate-limiter.ts

import rateLimit from 'express-rate-limit';
import { ApiError } from '@/shared/errors/api-error.js';

// Strict rate limiter for sensitive authentication endpoints (e.g. login, signup, password reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      ApiError.tooManyRequests(
        'Too many authentication attempts. Please try again after 15 minutes.',
      ),
    );
  },
});

// General rate limiter for general API endpoints
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many requests from this IP. Please try again later.'));
  },
});
