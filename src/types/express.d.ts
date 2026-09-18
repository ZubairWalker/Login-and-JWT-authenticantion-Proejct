import type { Role } from '../models/User.js';
import type { TodoDocument } from '../models/Todo.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roles: Role[]; isVerified: boolean };
      todo?: TodoDocument;
    }
  }
}

export {};
