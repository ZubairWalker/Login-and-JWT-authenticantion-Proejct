import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new AppError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED'));
  if (!req.user.isVerified) return next(new AppError(403, 'Email verification is required', 'EMAIL_NOT_VERIFIED'));
  next();
}
