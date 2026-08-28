// src/shared/utils/api-response.ts

export interface ApiResponseOptions<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(message: string, data?: T, meta?: Record<string, unknown>) {
    return {
      success: true,
      message,
      data: data ?? null,
      ...(meta ? { meta } : {}),
    };
  }

  static error(message: string, errors?: unknown) {
    return {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    };
  }
}
