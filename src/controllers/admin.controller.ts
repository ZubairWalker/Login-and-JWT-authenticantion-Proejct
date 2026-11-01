import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { User, RefreshToken } from '../models/User.js';
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
    const pagination = paginationResult(page, limit, total);
    res.status(200).json({
      success: true,
      users: users.map(toPublicUser),
      pagination,
      ...pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const update = adminUserUpdateBody(req.body);
    const isSelf = String(req.params.id) === String(req.user?.id);

    if (isSelf && update.roles !== undefined) {
      throw new AppError(403, 'You cannot change your own role', 'FORBIDDEN');
    }
    if (isSelf && update.isActive === false) {
      throw new AppError(403, 'You cannot deactivate yourself', 'FORBIDDEN');
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true });
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

    if (update.isActive === false) {
      await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });
    }

    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof req.body?.isActive !== 'boolean') {
      throw new AppError(400, 'isActive must be a boolean', 'INVALID_STATUS');
    }

    const isSelf = String(req.params.id) === String(req.user?.id);
    if (isSelf) {
      throw new AppError(403, 'You cannot deactivate yourself', 'FORBIDDEN');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: req.body.isActive } },
      { returnDocument: 'after' },
    );
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

    if (!req.body.isActive) {
      await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });
    }

    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
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
    res.status(200).json({
      success: true,
      statistics: { totalUsers, verifiedUsers, adminUsers, totalTodos, completedTodos },
    });
  } catch (error) {
    next(error);
  }
}
