// tests/user.test.ts

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app.js';

describe('User Module Integration Tests', () => {
  describe('GET /api/v1/users/me - Protected Route', () => {
    it('should return 401 Unauthorized when request has no token cookie or header', async () => {
      const response = await request(app).get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token missing');
    });

    it('should return 401 Unauthorized when token is malformed', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid_jwt_token_string');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid access token');
    });
  });

  describe('PATCH /api/v1/users/me - Authorization Enforcement', () => {
    it('should reject unauthenticated profile update with 401 Unauthorized', async () => {
      const response = await request(app).patch('/api/v1/users/me').send({
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/change-password - Authorization Enforcement', () => {
    it('should reject unauthenticated password change with 401 Unauthorized', async () => {
      const response = await request(app).post('/api/v1/users/change-password').send({
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
