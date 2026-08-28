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
      Logger.info('Email Verification Link Sent', { email, rawToken, verificationUrl });
      return;
    }

    // Production SMTP / Email Provider integration placeholder
    // e.g. using Nodemailer or Resend
  }
}
