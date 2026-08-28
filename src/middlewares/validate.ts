// src/middlewares/validate.ts

import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';
import { ApiError } from '@/shared/errors/api-error.js';

export const validate = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as Record<string, unknown>;

      if (parsed && typeof parsed === 'object') {
        if ('body' in parsed && parsed.body !== undefined) req.body = parsed.body;
        if ('query' in parsed && parsed.query !== undefined)
          req.query = parsed.query as Request['query'];
        if ('params' in parsed && parsed.params !== undefined)
          req.params = parsed.params as Request['params'];
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMap = error.issues.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
          message: issue.message,
        }));
        next(ApiError.badRequest('Validation failed', issueMap));
      } else {
        next(error);
      }
    }
  };
};
