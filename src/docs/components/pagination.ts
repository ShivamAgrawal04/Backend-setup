// src/docs/components/pagination.ts

export const paginationSchemas = {
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      total: { type: 'integer', example: 100 },
      totalPages: { type: 'integer', example: 10 },
      hasNextPage: { type: 'boolean', example: true },
      hasPrevPage: { type: 'boolean', example: false },
    },
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Items retrieved successfully' },
      data: {
        type: 'array',
        items: { type: 'object' },
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' },
    },
  },
};

export const paginationQueryParams = [
  {
    name: 'page',
    in: 'query',
    description: 'Page number for pagination',
    required: false,
    schema: { type: 'integer', default: 1, minimum: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    description: 'Number of items per page',
    required: false,
    schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
  },
];
