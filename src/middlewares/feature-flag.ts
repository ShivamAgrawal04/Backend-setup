// src/middlewares/feature-flag.ts

import type { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env.js';
import { ApiError } from '@/shared/errors/api-error.js';

export type AuthFeature = 'email' | 'mobile' | 'oauth';

export const checkFeatureEnabled = (feature: AuthFeature) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (feature === 'email' && !env.ENABLE_EMAIL_AUTH) {
      throw ApiError.forbidden('Email authentication is currently disabled by administrator.');
    }

    if (feature === 'mobile' && !env.ENABLE_MOBILE_AUTH) {
      throw ApiError.forbidden('Mobile authentication is currently disabled by administrator.');
    }

    if (feature === 'oauth' && !env.ENABLE_OAUTH_AUTH) {
      throw ApiError.forbidden('OAuth authentication is currently disabled by administrator.');
    }

    next();
  };
};
