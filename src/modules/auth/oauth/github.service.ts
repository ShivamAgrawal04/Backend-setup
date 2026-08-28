// src/modules/auth/oauth/github.service.ts

import { env } from '@/config/env.js';
import { ApiError } from '@/shared/errors/api-error.js';
import type { OAuthUserProfile } from '@/shared/types/index.js';

export class GithubOAuthService {
  public static getAuthUrl(state?: string): string {
    if (!env.GITHUB_CLIENT_ID) {
      throw ApiError.badRequest('GitHub OAuth is not configured on this server');
    }

    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'user:email read:user',
      ...(state ? { state } : {}),
    });

    return `${rootUrl}?${options.toString()}`;
  }

  public static async getUserFromCode(code: string): Promise<OAuthUserProfile> {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw ApiError.badRequest('GitHub OAuth is not configured');
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    });

    if (!tokenResponse.ok) {
      throw ApiError.badRequest('Failed to exchange GitHub authorization code');
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      throw ApiError.badRequest(
        tokenData.error_description || 'Failed to obtain GitHub access token',
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Backend-Auth-App',
      },
    });

    if (!userResponse.ok) {
      throw ApiError.badRequest('Failed to fetch GitHub user profile');
    }

    const userData = (await userResponse.json()) as {
      id: number;
      login: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };

    let userEmail = userData.email;
    let isVerified = false;

    // Edge case: GitHub profile email might be private/null. Fetch emails explicitly.
    if (!userEmail) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Backend-Auth-App',
        },
      });

      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;

        const primaryEmail =
          emails.find((e) => e.primary && e.verified) ||
          emails.find((e) => e.verified) ||
          emails[0];

        if (primaryEmail) {
          userEmail = primaryEmail.email;
          isVerified = primaryEmail.verified;
        }
      }
    } else {
      isVerified = true;
    }

    if (!userEmail) {
      throw ApiError.badRequest(
        'Unable to retrieve a valid email address from your GitHub account',
      );
    }

    return {
      provider: 'github',
      providerAccountId: String(userData.id),
      email: userEmail.toLowerCase(),
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      emailVerified: isVerified,
    };
  }
}
