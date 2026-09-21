import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { login, logout, refresh, register, resendVerificationEmail, verifyEmail } from '../services/auth.service.js';
import { toAuthUser, toPublicUser } from '../utils/users.js';
import { emailBody, loginBody, refreshBody, registerBody } from '../utils/validation.js';

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await register(registerBody(req.body));
    res.status(201).json({ success: true, message: 'Registration successful. Check your email to verify your account.', user: toPublicUser(user) });
  } catch (error) { next(error); }
}

export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) throw new AppError(400, 'Verification token is required');
    const user = await verifyEmail(token);
    res.status(200).json({ success: true, message: 'Email verified successfully', user: toAuthUser(user) });
  } catch (error) { next(error); }
}

export async function resendVerificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await resendVerificationEmail(emailBody(req.body));
    res.status(200).json({ success: true, message: 'If an account exists, a verification email has been sent.' });
  } catch (error) { next(error); }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { emailOrUsername, password } = loginBody(req.body);
    const { user, tokens } = await login(emailOrUsername, password);
    res.status(200).json({ success: true, ...tokens, user: toAuthUser(user) });
  } catch (error) { next(error); }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshBody(req.body);
    res.status(200).json({ success: true, ...await refresh(refreshToken) });
  } catch (error) { next(error); }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshBody(req.body);
    await logout(refreshToken);
    res.status(204).send();
  } catch (error) { next(error); }
}
