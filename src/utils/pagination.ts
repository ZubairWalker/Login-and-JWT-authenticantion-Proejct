import { AppError } from '../errors/AppError.js';

export function getPagination(query: { page?: unknown; limit?: unknown }): { page: number; limit: number; skip: number } {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, 'page must be at least 1 and limit must be between 1 and 100', 'INVALID_PAGINATION');
  }
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationResult(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
