import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { User } from '../models/User.js';
import { toPublicUser } from '../utils/users.js';
import { profileUpdateBody } from '../utils/validation.js';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const update = profileUpdateBody(req.body);
    const user = await User.findByIdAndUpdate(req.user?.id, { $set: update }, { new: true, runValidators: true });
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) { next(error); }
}
