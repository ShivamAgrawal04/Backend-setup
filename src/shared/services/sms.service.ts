// src/shared/services/sms.service.ts

import { env } from '@/config/env.js';
import { Logger } from '@/config/logger.js';

export class SmsService {
  /**
   * Sends a 6-digit SMS OTP code to a mobile phone number.
   */
  public static async sendOtp(phone: string, otpCode: string): Promise<void> {
    if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
      Logger.info('SMS OTP Code Sent', { phone, otpCode });
      return;
    }

    // Production Twilio / SMS Provider integration placeholder
  }
}
