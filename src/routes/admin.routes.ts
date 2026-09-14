import { Router } from 'express';
import { getUser, listUsers, updateUser } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const adminRouter = Router();
adminRouter.use(authenticate, authorize('admin'));
adminRouter.get('/users', listUsers);
adminRouter.get('/users/:id', getUser);
adminRouter.patch('/users/:id', updateUser);
