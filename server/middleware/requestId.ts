/**
 * Request ID middleware — every request gets a unique, traceable ID.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'] as string | undefined;
  const id = incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming) ? incoming : uuidv4();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
