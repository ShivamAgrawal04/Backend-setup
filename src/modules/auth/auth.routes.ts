import { Router } from 'express';
import { AuthController } from '@/modules/auth/auth.controller.js';
import { validate } from '@/middlewares/validate.js';
import { authRateLimiter } from '@/middlewares/rate-limiter.js';
import { checkFeatureEnabled } from '@/middlewares/feature-flag.js';
import { asyncHandler } from '@/shared/utils/async-handler.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleTokenExchangeSchema,
  githubTokenExchangeSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  sendMobileOtpSchema,
  verifyMobileOtpSchema,
} from '@/modules/auth/auth.schema.js';

const router = Router();

// Auth Config / Toggles Route
router.get('/config', asyncHandler(AuthController.getAuthConfig));

// Local Email/Password Auth Routes
router.post(
  '/register',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(AuthController.register),
);

router.post(
  '/login',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(AuthController.login),
);

router.post('/refresh', validate(refreshTokenSchema), asyncHandler(AuthController.refresh));

router.post('/logout', asyncHandler(AuthController.logout));

router.post(
  '/forgot-password',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword),
);

router.post(
  '/reset-password',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword),
);

// Email Verification Routes
router.post(
  '/verify-email',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(verifyEmailSchema),
  asyncHandler(AuthController.verifyEmail),
);

router.post(
  '/resend-verification',
  checkFeatureEnabled('email'),
  authRateLimiter,
  validate(resendVerificationSchema),
  asyncHandler(AuthController.resendVerification),
);

// Mobile OTP Routes
router.post(
  '/mobile/send-otp',
  checkFeatureEnabled('mobile'),
  authRateLimiter,
  validate(sendMobileOtpSchema),
  asyncHandler(AuthController.sendMobileOtp),
);

router.post(
  '/mobile/verify-otp',
  checkFeatureEnabled('mobile'),
  authRateLimiter,
  validate(verifyMobileOtpSchema),
  asyncHandler(AuthController.verifyMobileOtp),
);

// Google OAuth Routes
router.get('/google', checkFeatureEnabled('oauth'), asyncHandler(AuthController.googleAuthUrl));
router.get(
  '/google/callback',
  checkFeatureEnabled('oauth'),
  asyncHandler(AuthController.googleCallback),
);
router.post(
  '/google/token',
  checkFeatureEnabled('oauth'),
  validate(googleTokenExchangeSchema),
  asyncHandler(AuthController.googleTokenExchange),
);

// GitHub OAuth Routes
router.get('/github', checkFeatureEnabled('oauth'), asyncHandler(AuthController.githubAuthUrl));
router.get(
  '/github/callback',
  checkFeatureEnabled('oauth'),
  asyncHandler(AuthController.githubCallback),
);
router.post(
  '/github/token',
  checkFeatureEnabled('oauth'),
  validate(githubTokenExchangeSchema),
  asyncHandler(AuthController.githubTokenExchange),
);

export default router;
