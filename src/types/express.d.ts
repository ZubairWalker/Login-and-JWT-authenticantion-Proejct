import type { Role } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roles: Role[] };
    }
  }
}

export {};
