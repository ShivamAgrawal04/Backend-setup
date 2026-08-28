// tests/verification.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import { db } from '@/db/index.js';

describe('Verification & Authentication Toggles Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/auth/config', () => {
    it('should return authentication feature toggles', async () => {
      const response = await request(app).get('/api/v1/auth/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enableEmailAuth');
      expect(response.body.data).toHaveProperty('enableMobileAuth');
      expect(response.body.data).toHaveProperty('enableOAuthAuth');
      expect(response.body.data).toHaveProperty('requireEmailVerification');
      expect(response.body.data).toHaveProperty('requireMobileVerification');
    });
  });

  describe('Email Token Verification Flow', () => {
    it('should reject email verification without token in body', async () => {
      const response = await request(app).post('/api/v1/auth/verify-email').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid or non-existent email verification tokens', async () => {
      vi.spyOn(db.query.emailVerifications, 'findFirst').mockResolvedValue(undefined as never);

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid_non_existent_token_123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should successfully verify user email when valid token exists', async () => {
      const mockRecord = {
        id: 'token-uuid-123',
        userId: 'user-uuid-456',
        tokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      };

      const mockUser = {
        id: 'user-uuid-456',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        role: 'user',
      };

      vi.spyOn(db.query.emailVerifications, 'findFirst').mockResolvedValue(mockRecord as never);
      vi.spyOn(db, 'update').mockReturnValue({
        set: () => ({
          where: () => ({
            returning: async () => [mockUser],
          }),
        }),
      } as never);

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'valid_token_string' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email verified successfully');
    });
  });

  describe('Mobile OTP Verification Flow', () => {
    it('should reject OTP sending for malformed phone numbers', async () => {
      const response = await request(app)
        .post('/api/v1/auth/mobile/send-otp')
        .send({ phone: '12345' }); // missing leading + and international format

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should successfully send mobile OTP for valid E.164 phone number', async () => {
      vi.spyOn(db, 'insert').mockReturnValue({
        values: async () => [{}],
      } as never);

      const response = await request(app)
        .post('/api/v1/auth/mobile/send-otp')
        .send({ phone: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent successfully');
    });

    it('should reject invalid or expired OTP verification code', async () => {
      vi.spyOn(db.query.mobileOtps, 'findFirst').mockResolvedValue(undefined as never);

      const response = await request(app)
        .post('/api/v1/auth/mobile/verify-otp')
        .send({ phone: '+1234567890', code: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired OTP code');
    });
  });
});
