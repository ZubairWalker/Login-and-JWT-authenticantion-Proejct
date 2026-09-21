export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code = statusCode === 403 ? 'FORBIDDEN' : 'ERROR') {
    super(message);
    this.name = 'AppError';
  }
}
