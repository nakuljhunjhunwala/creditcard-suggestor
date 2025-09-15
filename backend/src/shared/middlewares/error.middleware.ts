import { NextFunction, Request, Response } from 'express';
import { PRISMA_ERROR_MAP, StatusCodes } from '@/shared/constants';
import { env } from '@/shared/config/env.config';
import { logger, ResponseUtil } from '@/shared/utils';

export const handleValidationError = (
  error: Error & {
    isJoi?: boolean;
    details?: { path: string[]; message: string }[];
  },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error.isJoi) {
    return ResponseUtil.error(
      res,
      'Validation Error',
      StatusCodes.BAD_REQUEST,
      error.details?.map((detail: { path: string[]; message: string }) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    );
  }
  return next(error);
};

export const handlePrismaError = (
  error: Error & {
    name?: string;
    code?: string;
    meta?: Record<string, unknown>;
    errorCode?: string;
    clientVersion?: string;
  },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error.name === 'PrismaClientInitializationError') {
    logger.error('Prisma Client Initialization Error:', {
      message: error.message,
      errorCode: error.errorCode,
      clientVersion: error.clientVersion,
      stack: error.stack,
    });
    const definition = PRISMA_ERROR_MAP.P1001;
    const metaForMessage = error.meta ?? {};
    const message = definition
      ? definition.message(metaForMessage)
      : 'Failed to initialize connection with the database.';
    const statusCode =
      definition?.statusCode || StatusCodes.SERVICE_UNAVAILABLE;
    return ResponseUtil.error(res, message, statusCode);
  }

  if (error.code?.startsWith('P')) {
    logger.error('Prisma Operational Error:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack,
    });

    const errorDefinition = PRISMA_ERROR_MAP[error.code];
    const metaForMessage = error.meta ?? {};

    if (errorDefinition) {
      const message = errorDefinition.message(metaForMessage);
      const statusCode =
        errorDefinition.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      return ResponseUtil.error(res, message, statusCode);
    }

    const defaultMessage = `A database error occurred (Code: ${error.code}). Check server logs for details.`;
    return ResponseUtil.error(
      res,
      defaultMessage,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
  return next(error);
};

export const handleError = (
  error: Error & { statusCode?: number; isOperational?: boolean },
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Internal Server Error';

  if (
    env.NODE_ENV === 'production' &&
    statusCode === StatusCodes.INTERNAL_SERVER_ERROR &&
    !error.isOperational
  ) {
    message = 'An unexpected internal server error occurred.';
  }

  logger.error(`[${statusCode}] ${message}`, {
    path: req.path,
    method: req.method,
    body: req.body,
    stack: error.stack,
    isOperational: error.isOperational ?? false,
  });

  return ResponseUtil.error(res, message, statusCode);
};
