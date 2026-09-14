import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const userRouter = Router();
userRouter.use(authenticate);
userRouter.get('/me', getMe);
userRouter.patch('/me', updateMe);
