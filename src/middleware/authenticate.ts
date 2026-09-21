import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { User } from '../models/User.js';
import { verifyToken } from '../services/jwt.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');
    const token = authorization.slice('Bearer '.length).trim();
    const payload = verifyToken(token, 'access');
    const user = await User.findById(payload.sub).select('roles isVerified isActive');
    if (!user) throw new AppError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED');
    if (!user.isActive) throw new AppError(403, 'User account is deactivated', 'ACCOUNT_DEACTIVATED');
    req.user = { id: user.id, roles: user.roles, isVerified: user.isVerified };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED'));
  }
}
