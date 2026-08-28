// src/shared/services/email.service.ts

import { env } from '@/config/env.js';
import { Logger } from '@/config/logger.js';

export class EmailService {
  /**
   * Sends an email verification link to the user.
   */
  public static async sendVerificationEmail(email: string, rawToken: string): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;

    if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
      Logger.warn('Email was not sent: SMTP is disabled in development mode. Use the logged verification URL.', {
        email,
        verificationUrl,
      });
      Logger.info('Email Verification Link Sent', { email, rawToken, verificationUrl });
      return;
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
      throw new Error(
        'Email verification cannot be sent because SMTP credentials are not configured.',
      );
    }

    throw new Error('SMTP email delivery is not implemented yet. Configure an email provider.');
  }
}
