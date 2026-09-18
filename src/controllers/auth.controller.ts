import type { Request, Response, NextFunction } from 'express';
import { login, logout, refresh, register } from '../services/auth.service.js';
import { toAuthUser } from '../utils/users.js';
import { loginBody, refreshBody, registerBody } from '../utils/validation.js';

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, tokens } = await register(registerBody(req.body));
    res.status(201).json({ ...tokens, user: toAuthUser(user) });
  } catch (error) { next(error); }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { emailOrUsername, password } = loginBody(req.body);
    const { user, tokens } = await login(emailOrUsername, password);
    res.status(200).json({ ...tokens, user: toAuthUser(user) });
  } catch (error) { next(error); }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshBody(req.body);
    res.status(200).json(await refresh(refreshToken));
  } catch (error) { next(error); }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshBody(req.body);
    await logout(refreshToken);
    res.status(204).send();
  } catch (error) { next(error); }
}
