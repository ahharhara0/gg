/**
 * Centralized error handler.
 * NEVER exposes stack traces, secrets, or internal DB details.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'المسار المطلوب غير موجود',
    },
    requestId: (req as any).requestId ?? 'no-req-id',
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId ?? 'no-req-id';

  // Zod validation errors.
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'البيانات المرسلة غير صحيحة',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      requestId,
    });
    return;
  }

  // Known API errors.
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`API Error: ${err.code}`, { message: err.message, requestId, details: err.details });
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId,
    });
    return;
  }

  // Unknown errors — never expose internals.
  const message = err instanceof Error ? err.message : String(err);
  const errCode = (err as any)?.code;
  const isFirebaseAuthError =
    message.includes('Could not load the default credentials') ||
    message.toLowerCase().includes('permission-denied') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('Missing or insufficient permissions') ||
    message.includes('UNAUTHENTICATED') ||
    errCode === 7 || // gRPC PERMISSION_DENIED
    errCode === 16;  // gRPC UNAUTHENTICATED
  if (isFirebaseAuthError) {
    logger.warn('Backend degraded — Firestore unavailable', { message, requestId, path: req.path });
    res.status(503).json({
      success: false,
      error: {
        code: 'BACKEND_NOT_READY',
        message: 'خدمة قاعدة البيانات غير متاحة حاليًا أو بانتظار إعداد مفتاح الخدمة. يرجى المحاولة لاحقًا.',
      },
      requestId,
    });
    return;
  }

  logger.error('Unhandled error', { message, requestId, stack: (err as any)?.stack, path: req.path });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.',
    },
    requestId,
  });
}

/** Wrap async route handlers so thrown errors are forwarded to errorHandler. */
export function asyncHandler<T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
