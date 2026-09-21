import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, error: error.code, message: error.message });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ success: false, error: 'INVALID_JSON', message: 'Invalid JSON body' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'CastError') {
    res.status(400).json({ success: false, error: 'INVALID_RESOURCE_ID', message: 'Invalid resource id' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    res.status(409).json({ success: false, error: 'DUPLICATE_ACCOUNT', message: 'An account with this email or username already exists' });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
};
