import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../models/User.js';
import { AppError } from '../errors/AppError.js';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED'));
    if (!roles.some((role) => req.user?.roles.includes(role))) return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
    next();
  };
}
