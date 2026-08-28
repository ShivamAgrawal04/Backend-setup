// src/shared/services/sms.service.ts

import { env } from '@/config/env.js';
import { Logger } from '@/config/logger.js';

export class SmsService {
  /**
   * Sends a 6-digit SMS OTP code to a mobile phone number.
   */
  public static async sendOtp(phone: string, otpCode: string): Promise<void> {
    if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
      Logger.warn('SMS was not sent in development mode. Use the OTP from this log for testing.', {
        phone,
        otpCode,
      });
      return;
    }

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      throw new Error('Mobile OTP cannot be sent because Twilio credentials are not configured.');
    }

    throw new Error('Twilio SMS delivery is not implemented yet. Configure the SMS provider integration.');
  }
}
