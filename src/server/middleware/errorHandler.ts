import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { logger } from '../../utils/logger';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode: ContentfulStatusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, {
      statusCode: err.statusCode,
      details: err.details,
    });
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      err.statusCode
    );
  }

  // Handle generic unhandled errors
  logger.error('Unhandled server error:', {
    message: err.message,
    stack: err.stack,
  });

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    },
    500
  );
};
