import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import type { TodoDocument } from '../models/Todo.js';
import { Todo } from '../models/Todo.js';
import { todoCreateBody, todoUpdateBody } from '../utils/validation.js';

function toTodo(todo: TodoDocument) {
  return {
    id: todo.id,
    title: todo.title,
    ...(todo.description !== undefined ? { description: todo.description } : {}),
    completed: todo.completed,
    owner: todo.owner.toString(),
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

export async function createTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = todoCreateBody(req.body);
    const todo = await Todo.create({ ...input, owner: req.user!.id });
    res.status(201).json({ todo: toTodo(todo) });
  } catch (error) { next(error); }
}

export async function listMyTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const todos = await Todo.find({ owner: req.user!.id }).sort({ createdAt: -1 });
    res.status(200).json({ todos: todos.map((todo) => toTodo(todo as TodoDocument)) });
  } catch (error) { next(error); }
}

export function getTodo(req: Request, res: Response): void {
  res.status(200).json({ todo: toTodo(req.todo!) });
}

export async function updateTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const update = todoUpdateBody(req.body);
    const todo = req.todo!;
    Object.assign(todo, update);
    await todo.save();
    res.status(200).json({ todo: toTodo(todo) });
  } catch (error) { next(error); }
}

export async function deleteTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await req.todo!.deleteOne();
    res.status(204).send();
  } catch (error) { next(error); }
}

export async function listUserTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    if (!userId) throw new AppError(400, 'Invalid user id');
    const todos = await Todo.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json({ todos: todos.map((todo) => toTodo(todo as TodoDocument)) });
  } catch (error) { next(error); }
}
