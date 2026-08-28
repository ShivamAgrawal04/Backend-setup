// src/modules/auth/auth.swagger.ts

export const authSwaggerSchemas = {
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      password: {
        type: 'string',
        minLength: 8,
        example: 'Password123!',
        description: 'Must contain at least 1 uppercase, 1 lowercase, and 1 digit.',
      },
      name: { type: 'string', minLength: 2, example: 'John Doe' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      password: { type: 'string', example: 'Password123!' },
    },
  },
  RefreshRequest: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        description: 'Optional if sent via httpOnly cookie',
        example: '9a8f...3c',
      },
    },
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
    },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string', example: 'a1b2c3d4e5f6...' },
      newPassword: { type: 'string', minLength: 8, example: 'NewPassword123!' },
    },
  },
  GoogleTokenExchangeRequest: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'OAuth authorization code' },
      idToken: { type: 'string', description: 'Google ID Token' },
    },
  },
  GithubTokenExchangeRequest: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', example: '8c9d1e2f3a...' },
    },
  },
  VerifyEmailRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', example: '3f8e...' },
    },
  },
  ResendVerificationRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'john@example.com' },
    },
  },
  SendMobileOtpRequest: {
    type: 'object',
    required: ['phone'],
    properties: {
      phone: { type: 'string', example: '+1234567890' },
    },
  },
  VerifyMobileOtpRequest: {
    type: 'object',
    required: ['phone', 'code'],
    properties: {
      phone: { type: 'string', example: '+1234567890' },
      code: { type: 'string', example: '123456' },
      name: { type: 'string', example: 'John Doe' },
    },
  },
};

export const authSwaggerPaths = {
  '/api/v1/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description:
        'Creates a user account, hashes password, and returns access token + httpOnly refresh token cookie.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
          },
        },
      },
      responses: {
        201: { description: 'User registered successfully' },
        400: { description: 'Validation error' },
        409: { description: 'Email already exists' },
        429: { description: 'Too many registration requests' },
      },
    },
  },
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login user',
      description:
        'Authenticates credentials, checks account lockouts, and returns access token + refresh token cookie.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Login successful' },
        400: { description: 'Invalid input or social-only account' },
        401: { description: 'Invalid credentials' },
        403: { description: 'Account locked due to failed attempts' },
        429: { description: 'Rate limit exceeded' },
      },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Rotate and refresh access token',
      description:
        'Uses refresh token cookie (or body payload) to issue a new access token and rotated refresh token.',
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Token refreshed successfully' },
        401: { description: 'Invalid/expired refresh token or theft reuse detected' },
      },
    },
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout user',
      description: 'Revokes the active refresh token and clears httpOnly session cookie.',
      responses: {
        200: { description: 'Logged out successfully' },
      },
    },
  },
  '/api/v1/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset',
      description: 'Generates a secure password reset token.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Reset request processed' },
        429: { description: 'Rate limit exceeded' },
      },
    },
  },
  '/api/v1/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password with token',
      description:
        'Resets user password, invalidates reset token, and revokes all active session refresh tokens.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Password reset successful' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  '/api/v1/auth/google': {
    get: {
      tags: ['OAuth Social Auth'],
      summary: 'Get Google OAuth Consent URL',
      responses: {
        200: { description: 'Returns Google consent screen redirect URL' },
      },
    },
  },
  '/api/v1/auth/google/callback': {
    get: {
      tags: ['OAuth Social Auth'],
      summary: 'Google OAuth Redirect Callback',
      parameters: [
        {
          name: 'code',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Authorization code returned by Google',
        },
      ],
      responses: {
        200: { description: 'Google authentication successful' },
        400: { description: 'Missing code or code exchange failure' },
      },
    },
  },
  '/api/v1/auth/google/token': {
    post: {
      tags: ['OAuth Social Auth'],
      summary: 'Direct SPA Google Token Exchange',
      description:
        'Exchanges authorization code or ID Token from Google Client SDK for session tokens.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GoogleTokenExchangeRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Google authentication successful' },
        400: { description: 'Invalid Google code or ID Token' },
      },
    },
  },
  '/api/v1/auth/github': {
    get: {
      tags: ['OAuth Social Auth'],
      summary: 'Get GitHub OAuth Authorization URL',
      responses: {
        200: { description: 'Returns GitHub consent screen URL' },
      },
    },
  },
  '/api/v1/auth/github/callback': {
    get: {
      tags: ['OAuth Social Auth'],
      summary: 'GitHub OAuth Redirect Callback',
      parameters: [
        {
          name: 'code',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Authorization code returned by GitHub',
        },
      ],
      responses: {
        200: { description: 'GitHub authentication successful' },
        400: { description: 'Code exchange or email retrieval failure' },
      },
    },
  },
  '/api/v1/auth/github/token': {
    post: {
      tags: ['OAuth Social Auth'],
      summary: 'Direct SPA GitHub Token Exchange',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GithubTokenExchangeRequest' },
          },
        },
      },
      responses: {
        200: { description: 'GitHub authentication successful' },
        400: { description: 'Invalid GitHub code' },
      },
    },
  },
  '/api/v1/auth/config': {
    get: {
      tags: ['Authentication'],
      summary: 'Get active auth method toggles & verification config',
      responses: {
        200: { description: 'Authentication configuration returned successfully' },
      },
    },
  },
  '/api/v1/auth/verify-email': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify email with token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VerifyEmailRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Email verified successfully' },
        400: { description: 'Invalid or expired token' },
      },
    },
  },
  '/api/v1/auth/resend-verification': {
    post: {
      tags: ['Authentication'],
      summary: 'Resend email verification link',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResendVerificationRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Verification link resent if account exists' },
      },
    },
  },
  '/api/v1/auth/mobile/send-otp': {
    post: {
      tags: ['Mobile Authentication'],
      summary: 'Send 6-digit OTP code to mobile phone',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SendMobileOtpRequest' },
          },
        },
      },
      responses: {
        200: { description: 'OTP sent successfully' },
        403: { description: 'Mobile authentication disabled' },
      },
    },
  },
  '/api/v1/auth/mobile/verify-otp': {
    post: {
      tags: ['Mobile Authentication'],
      summary: 'Verify mobile OTP code and login/register',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VerifyMobileOtpRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Mobile verification successful, returns tokens' },
        400: { description: 'Invalid or expired OTP code' },
        403: { description: 'Mobile authentication disabled' },
      },
    },
  },
};
