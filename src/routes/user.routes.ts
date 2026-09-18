import { Router } from 'express';
import { getMe, getPublicProfile, updateMe } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireVerified } from '../middleware/requireVerified.js';

export const userRouter = Router();
userRouter.get('/users/:id', getPublicProfile);
userRouter.use(authenticate, requireVerified);
userRouter.get('/me', getMe);
userRouter.patch('/me', updateMe);
