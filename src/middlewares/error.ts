// src/middlewares/error.ts

import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/shared/errors/api-error.js';
import { ApiResponse } from '@/shared/utils/api-response.js';
import { env } from '@/config/env.js';
import { Logger } from '@/config/logger.js';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: unknown = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if ((err as { code?: string }).code === '23505') {
    // Postgres unique constraint violation
    statusCode = 409;
    message = 'A resource with this unique constraint already exists.';
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Malformed request payload.';
  } else {
    message = err.message || message;
  }

  if (env.NODE_ENV !== 'test' && statusCode === 500) {
    Logger.error('Unhandled Error', err);
  }

  res
    .status(statusCode)
    .json(
      ApiResponse.error(message, env.NODE_ENV === 'development' ? errors || err.stack : errors),
    );
};
