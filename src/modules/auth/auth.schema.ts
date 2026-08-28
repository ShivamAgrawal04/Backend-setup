// src/modules/auth/auth.schema.ts

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password is too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password is too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
  }),
});

export const googleTokenExchangeSchema = z.object({
  body: z
    .object({
      code: z.string().optional(),
      idToken: z.string().optional(),
    })
    .refine((data) => data.code || data.idToken, {
      message: "Either authorization 'code' or 'idToken' must be provided",
    }),
});

export const githubTokenExchangeSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Authorization code is required'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const sendMobileOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Phone number must be in E.164 international format (e.g. +1234567890)',
      ),
  }),
});

export const verifyMobileOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Phone number must be in E.164 international format (e.g. +1234567890)',
      ),
    code: z.string().length(6, 'OTP code must be exactly 6 digits'),
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type SendMobileOtpInput = z.infer<typeof sendMobileOtpSchema>['body'];
export type VerifyMobileOtpInput = z.infer<typeof verifyMobileOtpSchema>['body'];
