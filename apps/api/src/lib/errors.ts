import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class PaymentDeclinedError extends AppError {
  constructor(message: string, details?: unknown) {
    super(402, 'PAYMENT_DECLINED', message, details);
  }
}

export function formatError(error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      },
    });
  }

  request.log.error(error);

  return reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    },
  });
}
