// src/modules/auth/auth.controller.ts

import type { Request, Response } from 'express';
import { AuthService } from '@/modules/auth/auth.service.js';
import { GoogleOAuthService } from '@/modules/auth/oauth/google.service.js';
import { GithubOAuthService } from '@/modules/auth/oauth/github.service.js';
import { ApiResponse } from '@/shared/utils/api-response.js';
import { env } from '@/config/env.js';
import { ApiError } from '@/shared/errors/api-error.js';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Set httpOnly Access Token cookie (15 mins)
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set httpOnly Refresh Token cookie (7 days)
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
  });
};

export class AuthController {
  public static register = async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json(
      ApiResponse.success('User registered successfully', {
        user: result.user,
      }),
    );
  };

  public static login = async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json(
      ApiResponse.success('Login successful', {
        user: result.user,
      }),
    );
  };

  public static refresh = async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      throw ApiError.unauthorized('Refresh token missing');
    }

    const result = await AuthService.refresh(rawRefreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json(ApiResponse.success('Token refreshed successfully'));
  };

  public static logout = async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await AuthService.logout(rawRefreshToken);
    clearAuthCookies(res);

    res.status(200).json(ApiResponse.success('Logged out successfully'));
  };

  public static forgotPassword = async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body);
    res.status(200).json(ApiResponse.success(result.message, result));
  };

  public static resetPassword = async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);
    clearAuthCookies(res);

    res.status(200).json(ApiResponse.success(result.message));
  };

  // Google OAuth Endpoints
  public static googleAuthUrl = async (_req: Request, res: Response) => {
    const url = GoogleOAuthService.getAuthUrl();
    res.status(200).json(ApiResponse.success('Google auth URL generated', { url }));
  };

  public static googleCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      throw ApiError.badRequest('Authorization code missing in callback');
    }

    const profile = await GoogleOAuthService.getUserFromCode(code);
    const result = await AuthService.handleOAuthUser(profile);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    if (req.accepts('html') && env.CLIENT_URL) {
      res.redirect(`${env.CLIENT_URL}/oauth/success`);
      return;
    }

    res
      .status(200)
      .json(ApiResponse.success('Google authentication successful', { user: result.user }));
  };

  public static googleTokenExchange = async (req: Request, res: Response) => {
    const { code, idToken } = req.body;
    const profile = code
      ? await GoogleOAuthService.getUserFromCode(code)
      : await GoogleOAuthService.getUserFromIdToken(idToken!);

    const result = await AuthService.handleOAuthUser(profile);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res
      .status(200)
      .json(ApiResponse.success('Google authentication successful', { user: result.user }));
  };

  // GitHub OAuth Endpoints
  public static githubAuthUrl = async (_req: Request, res: Response) => {
    const url = GithubOAuthService.getAuthUrl();
    res.status(200).json(ApiResponse.success('GitHub auth URL generated', { url }));
  };

  public static githubCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      throw ApiError.badRequest('Authorization code missing in callback');
    }

    const profile = await GithubOAuthService.getUserFromCode(code);
    const result = await AuthService.handleOAuthUser(profile);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    if (req.accepts('html') && env.CLIENT_URL) {
      res.redirect(`${env.CLIENT_URL}/oauth/success`);
      return;
    }

    res
      .status(200)
      .json(ApiResponse.success('GitHub authentication successful', { user: result.user }));
  };

  public static githubTokenExchange = async (req: Request, res: Response) => {
    const { code } = req.body;
    const profile = await GithubOAuthService.getUserFromCode(code);

    const result = await AuthService.handleOAuthUser(profile);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res
      .status(200)
      .json(ApiResponse.success('GitHub authentication successful', { user: result.user }));
  };

  // Auth Configuration & Feature Toggles Endpoint
  public static getAuthConfig = async (_req: Request, res: Response) => {
    const config = AuthService.getAuthConfig();
    res.status(200).json(ApiResponse.success('Authentication configuration retrieved', config));
  };

  // Email Verification Endpoints
  public static verifyEmail = async (req: Request, res: Response) => {
    const result = await AuthService.verifyEmailToken(req.body);
    res.status(200).json(ApiResponse.success(result.message, { user: result.user }));
  };

  public static resendVerification = async (req: Request, res: Response) => {
    const result = await AuthService.resendEmailVerification(req.body);
    res.status(200).json(ApiResponse.success(result.message));
  };

  // Mobile OTP Endpoints
  public static sendMobileOtp = async (req: Request, res: Response) => {
    const result = await AuthService.sendMobileOtp(req.body);
    res.status(200).json(ApiResponse.success(result.message, { expiresIn: result.expiresIn }));
  };

  public static verifyMobileOtp = async (req: Request, res: Response) => {
    const result = await AuthService.verifyMobileOtp(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json(
      ApiResponse.success('Mobile verification successful', {
        user: result.user,
      }),
    );
  };
}
