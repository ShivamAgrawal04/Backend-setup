// tests/auth.test.ts

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import { db } from '@/db/index.js';

describe('Auth Module Integration Tests', () => {
  describe('POST /api/v1/auth/register - Input Validation', () => {
    it('should reject registration with invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email-format',
        password: 'Password123!',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject registration with a weak password missing digits or uppercase', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'john@example.com',
        password: 'weakpassword',
        name: 'John Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with short name (<2 chars)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'john@example.com',
        password: 'Password123!',
        name: 'J',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login - Authentication Validation', () => {
    it('should reject login request with missing fields', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh - Refresh Token Protection', () => {
    it('should fail when refresh token cookie is missing', async () => {
      const response = await request(app).post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token missing');
    });
  });

  describe('POST /api/v1/auth/forgot-password - Security Response', () => {
    it('should return 200 generic message without exposing whether user exists', async () => {
      // Mock db findFirst to return undefined (user not found)
      vi.spyOn(db.query.users, 'findFirst').mockResolvedValue(undefined as never);

      const response = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'nonexistent@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account with that email exists');
    });
  });

  describe('POST /api/v1/auth/reset-password - Validation', () => {
    it('should reject reset password without token', async () => {
      const response = await request(app).post('/api/v1/auth/reset-password').send({
        newPassword: 'NewPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
