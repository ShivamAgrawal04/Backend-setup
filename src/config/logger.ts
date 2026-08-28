import 'dotenv/config';
import { pino } from 'pino';

const pinoInstance = pino({
  level: process.env.LOG_LEVEL,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
      : undefined,
});

/**
 * Centralized Logger class wrapping Pino.
 * Provides unified static helper methods: Logger.info, Logger.warn, Logger.error, Logger.debug
 */
export class Logger {
  public static info(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      pinoInstance.info(meta, message);
    } else {
      pinoInstance.info(message);
    }
  }

  public static warn(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      pinoInstance.warn(meta, message);
    } else {
      pinoInstance.warn(message);
    }
  }

  public static error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (error instanceof Error) {
      pinoInstance.error({ err: error, ...meta }, message);
    } else if (error || meta) {
      pinoInstance.error({ error, ...meta }, message);
    } else {
      pinoInstance.error(message);
    }
  }

  public static debug(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      pinoInstance.debug(meta, message);
    } else {
      pinoInstance.debug(message);
    }
  }
}

export const logger = pinoInstance;
