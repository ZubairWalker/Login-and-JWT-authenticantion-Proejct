function defaultCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'AUTHENTICATION_REQUIRED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR';
  }
}

export class AppError extends Error {
  public readonly code: string;

  constructor(
    public readonly statusCode: number,
    message: string,
    code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code ?? defaultCode(statusCode);
  }
}
