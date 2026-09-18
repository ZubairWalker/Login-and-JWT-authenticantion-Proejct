import { Router } from 'express';
import { loginController, logoutController, refreshController, registerController, resendVerificationController, verifyEmailController } from '../controllers/auth.controller.js';

export const authRouter = Router();
authRouter.post('/register', registerController);
authRouter.get('/verify-email', verifyEmailController);
authRouter.post('/resend-verification', resendVerificationController);
authRouter.post('/login', loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', logoutController);
