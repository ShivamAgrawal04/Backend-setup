// src/docs/swagger.ts

import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { env } from '@/config/env.js';
import {
  securitySchemes,
  responseSchemas,
  commonResponses,
  paginationSchemas,
} from '@/docs/components/index.js';
import { authSwaggerSchemas, authSwaggerPaths } from '@/modules/auth/auth.swagger.js';
import { userSwaggerSchemas, userSwaggerPaths } from '@/modules/user/user.swagger.js';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Production Backend API Documentation',
    version: '1.0.0',
    description:
      'Modular OpenAPI 3.0 Documentation with structured docs/ components and feature-based module schemas.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes,
    responses: commonResponses,
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-46a6-a19b-00829a24446b' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
          emailVerified: { type: 'boolean', example: true },
          phone: { type: 'string', nullable: true, example: '+1234567890' },
          phoneVerified: { type: 'boolean', example: false },
          role: { type: 'string', example: 'user' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ...responseSchemas,
      ...paginationSchemas,
      ...authSwaggerSchemas,
      ...userSwaggerSchemas,
    },
  },
  paths: {
    ...authSwaggerPaths,
    ...userSwaggerPaths,
  },
};

export const setupSwagger = (app: Express) => {
  // Raw OpenAPI 3.0 JSON specification endpoint (mounted BEFORE swaggerUi middleware)
  app.get('/docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Interactive Swagger UI HTML interface
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
