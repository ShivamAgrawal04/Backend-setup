// src/docs/components/responses.ts

export const responseSchemas = {
  ApiResponseSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { type: 'object', nullable: true },
    },
  },
  ApiResponseError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Error description' },
      errors: { type: 'object', nullable: true },
    },
  },
};

export const commonResponses = {
  BadRequest: {
    description: 'Bad Request - Validation or input error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
  Unauthorized: {
    description: 'Unauthorized - Missing or invalid token',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
  Forbidden: {
    description: 'Forbidden - Insufficient permissions or account locked',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
  NotFound: {
    description: 'Not Found - Resource does not exist',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
  TooManyRequests: {
    description: 'Too Many Requests - Rate limit exceeded',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
  InternalServerError: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponseError' },
      },
    },
  },
};
