import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { Todo } from '../models/Todo.js';

// A non-owner receives 404 so the endpoint does not reveal that another user's todo exists.
export async function requireTodoAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const filter = req.user.roles.includes('admin')
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user.id };
    const todo = await Todo.findOne(filter);
    if (!todo) throw new AppError(404, 'Todo not found');
    req.todo = todo;
    next();
  } catch (error) { next(error); }
}
