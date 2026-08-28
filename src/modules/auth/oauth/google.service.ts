// src/modules/auth/oauth/google.service.ts

import { env } from '@/config/env.js';
import { ApiError } from '@/shared/errors/api-error.js';
import type { OAuthUserProfile } from '@/shared/types/index.js';

export class GoogleOAuthService {
  public static getAuthUrl(state?: string): string {
    if (!env.GOOGLE_CLIENT_ID) {
      throw ApiError.badRequest('Google OAuth is not configured on this server');
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = new URLSearchParams({
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      client_id: env.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      ...(state ? { state } : {}),
    });

    return `${rootUrl}?${options.toString()}`;
  }

  public static async getUserFromCode(code: string): Promise<OAuthUserProfile> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw ApiError.badRequest('Google OAuth is not configured');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw ApiError.badRequest('Failed to exchange Google OAuth code', errorBody);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; id_token?: string };

    // 2. Fetch User Profile
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw ApiError.badRequest('Failed to fetch user profile from Google');
    }

    const userData = (await userResponse.json()) as {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!userData.email) {
      throw ApiError.badRequest('Google user profile does not contain an email address');
    }

    return {
      provider: 'google',
      providerAccountId: userData.sub,
      email: userData.email.toLowerCase(),
      name: userData.name || userData.email.split('@')[0],
      avatarUrl: userData.picture,
      emailVerified: Boolean(userData.email_verified),
    };
  }

  public static async getUserFromIdToken(idToken: string): Promise<OAuthUserProfile> {
    // Validate ID Token using Google tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw ApiError.badRequest('Invalid Google ID token');
    }

    const payload = (await response.json()) as {
      sub: string;
      email: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      aud?: string;
    };

    if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw ApiError.badRequest('Google ID token audience mismatch');
    }

    if (!payload.email) {
      throw ApiError.badRequest('Google ID token missing email claim');
    }

    const isVerified = payload.email_verified === true || payload.email_verified === 'true';

    return {
      provider: 'google',
      providerAccountId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
      emailVerified: isVerified,
    };
  }
}
