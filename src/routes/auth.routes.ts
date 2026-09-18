import { Router } from 'express';
import { loginController, logoutController, refreshController, registerController } from '../controllers/auth.controller.js';

export const authRouter = Router();
authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', logoutController);
