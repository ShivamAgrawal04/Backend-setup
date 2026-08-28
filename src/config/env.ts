// src/config/env.ts

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRATION: z.string(),
  COOKIE_SECRET: z.string(),
  CLIENT_URL: z.string(),

  // OAuth Credentials
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),

  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string(),

  // Feature Toggles (Auth Methods & Verifications)
  ENABLE_EMAIL_AUTH: z.string().transform((val) => val === 'true'),
  ENABLE_MOBILE_AUTH: z.string().transform((val) => val === 'true'),
  ENABLE_OAUTH_AUTH: z.string().transform((val) => val === 'true'),
  REQUIRE_EMAIL_VERIFICATION: z.string().transform((val) => val === 'true'),
  REQUIRE_MOBILE_VERIFICATION: z.string().transform((val) => val === 'true'),

  // SMTP Email Settings
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),

  // Twilio / SMS Settings
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
});

import { Logger } from '@/config/logger.js';

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    Logger.error('Invalid environment variables', undefined, { errors: result.error.format() });
    throw new Error('Invalid environment variables');
  }
  return result.data;
};

export const env = parseEnv();
