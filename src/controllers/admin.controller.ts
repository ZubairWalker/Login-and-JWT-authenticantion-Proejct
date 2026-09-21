import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { User } from '../models/User.js';
import { Todo } from '../models/Todo.js';
import { toPublicUser } from '../utils/users.js';
import { adminUserUpdateBody } from '../utils/validation.js';
import { getPagination, paginationResult } from '../utils/pagination.js';

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    res.status(200).json({ success: true, users: users.map(toPublicUser), pagination: paginationResult(page, limit, total) });
  } catch (error) { next(error); }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const update = adminUserUpdateBody(req.body);
    if (req.params.id === req.user?.id && update.roles) {
      throw new AppError(403, 'You cannot change your own role', 'FORBIDDEN');
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.user?.id) throw new AppError(403, 'You cannot deactivate yourself', 'FORBIDDEN');
    if (typeof req.body?.isActive !== 'boolean') {
      throw new AppError(400, 'isActive must be a boolean', 'INVALID_STATUS');
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive: req.body.isActive } }, { new: true });
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function getStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, verifiedUsers, adminUsers, totalTodos, completedTodos] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ roles: 'admin' }),
      Todo.countDocuments(),
      Todo.countDocuments({ completed: true }),
    ]);
    res.status(200).json({ success: true, statistics: { totalUsers, verifiedUsers, adminUsers, totalTodos, completedTodos } });
  } catch (error) { next(error); }
}
