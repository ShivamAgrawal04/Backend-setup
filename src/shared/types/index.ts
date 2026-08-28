// src/shared/types/index.ts

import type { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string | null;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface JwtTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthUserProfile {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}
