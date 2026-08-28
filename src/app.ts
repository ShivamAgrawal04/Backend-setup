// src/app.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { setupSwagger } from '@/docs/index.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import userRoutes from '@/modules/user/user.routes.js';
import { errorHandler } from '@/middlewares/error.js';
import { generalRateLimiter } from '@/middlewares/rate-limiter.js';
import { ApiError } from '@/shared/errors/api-error.js';
import { ApiResponse } from '@/shared/utils/api-response.js';

const app = express();

if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      customErrorMessage: (req, res, err) =>
        `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      autoLogging: {
        ignore: (req) => req.url === '/favicon.ico',
      },
    }),
  );
}

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Swagger UI inline scripts
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Cookie Parser & Body Parsers
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Setup Interactive Modular Swagger API Documentation from docs/
setupSwagger(app);

// General Rate Limiting
app.use('/api', generalRateLimiter);

// API Health Check
app.get('/health', (_req, res) => {
  res.status(200).json(
    ApiResponse.success('API is healthy and operational', {
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }),
  );
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// 404 Handler
app.use((_req, _res, next) => {
  next(ApiError.notFound('Requested API endpoint does not exist'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
