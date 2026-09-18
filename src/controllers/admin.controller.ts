import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { User } from '../models/User.js';
import { Todo } from '../models/Todo.js';
import { toPublicUser } from '../utils/users.js';
import { adminUserUpdateBody } from '../utils/validation.js';

export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ users: users.map(toPublicUser) });
  } catch (error) { next(error); }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const update = adminUserUpdateBody(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ user: toPublicUser(user) });
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
    res.status(200).json({ statistics: { totalUsers, verifiedUsers, adminUsers, totalTodos, completedTodos } });
  } catch (error) { next(error); }
}
