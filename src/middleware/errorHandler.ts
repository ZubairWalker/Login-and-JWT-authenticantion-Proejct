import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ message: 'Invalid JSON body' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'CastError') {
    res.status(400).json({ message: 'Invalid resource id' });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
};
