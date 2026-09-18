import { Router } from 'express';
import { getStatistics, getUser, listUsers, updateUser } from '../controllers/admin.controller.js';
import { listUserTodos } from '../controllers/todo.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireVerified } from '../middleware/requireVerified.js';

export const adminRouter = Router();
adminRouter.use(authenticate, requireVerified, authorize('admin'));
adminRouter.get('/stats', getStatistics);
adminRouter.get('/users', listUsers);
adminRouter.get('/users/:id', getUser);
adminRouter.patch('/users/:id', updateUser);
adminRouter.get('/users/:id/todos', listUserTodos);
