// src/modules/user/user.swagger.ts

export const userSwaggerSchemas = {
  UpdateProfileRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, example: 'Jane Doe' },
      avatarUrl: {
        type: 'string',
        format: 'uri',
        nullable: true,
        example: 'https://avatar.com/pic.png',
      },
    },
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', example: 'Password123!' },
      newPassword: { type: 'string', minLength: 8, example: 'NewPassword456!' },
    },
  },
};

export const userSwaggerPaths = {
  '/api/v1/users/me': {
    get: {
      tags: ['User Management'],
      summary: 'Get Current Authenticated User Profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'User profile retrieved successfully' },
        401: { description: 'Missing or expired access token' },
      },
    },
    patch: {
      tags: ['User Management'],
      summary: 'Update User Profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Profile updated successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/v1/users/change-password': {
    post: {
      tags: ['User Management'],
      summary: 'Change User Password',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
          },
        },
      },
      responses: {
        200: { description: 'Password changed successfully' },
        400: { description: 'Current password incorrect or social account' },
        401: { description: 'Unauthorized' },
      },
    },
  },
};
