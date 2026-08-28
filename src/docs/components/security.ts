// src/docs/components/security.ts

export const securitySchemes = {
  accessTokenCookie: {
    type: 'apiKey',
    in: 'cookie',
    name: 'accessToken',
    description: 'HTTP-only access token cookie (valid for 15 minutes)',
  },
  refreshTokenCookie: {
    type: 'apiKey',
    in: 'cookie',
    name: 'refreshToken',
    description: 'HTTP-only refresh token cookie for session rotation (valid for 7 days)',
  },
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Bearer header token fallback for non-browser API clients',
  },
};
