// tests/app.test.ts

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app.js';

describe('Application Core Endpoints', () => {
  it('GET /health - should return 200 OK and health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('healthy');
    expect(response.body.data).toHaveProperty('environment');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  it('GET /docs/swagger.json - should return OpenAPI 3.0 specification JSON', async () => {
    const response = await request(app).get('/docs/swagger.json');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('openapi', '3.0.0');
    expect(response.body).toHaveProperty('paths');
    expect(response.body.paths).toHaveProperty('/api/v1/auth/register');
  });

  it('GET /docs - should serve interactive Swagger UI', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('GET /api/v1/invalid-route - should return 404 Not Found error', async () => {
    const response = await request(app).get('/api/v1/invalid-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('does not exist');
  });
});
