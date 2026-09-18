import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import { RefreshToken, type Role, type UserDocument, User } from '../models/User.js';
import { getTokenExpirationDate, hashToken, signAccessToken, signRefreshToken, verifyToken } from './jwt.js';
import type { RegistrationInput } from '../utils/validation.js';

export interface TokenPair { accessToken: string; refreshToken: string; }

async function issueTokenPair(user: UserDocument): Promise<TokenPair> {
  const accessToken = signAccessToken(user.id, user.roles);
  const refreshToken = signRefreshToken(user.id, user.roles);
  const payload = verifyToken(refreshToken, 'refresh');
  await RefreshToken.create({ userId: user._id, jti: payload.jti, tokenHash: hashToken(refreshToken), expiresAt: getTokenExpirationDate(refreshToken) });
  return { accessToken, refreshToken };
}

export async function register(input: RegistrationInput): Promise<{ user: UserDocument; tokens: TokenPair }> {
  const existingUser = await User.findOne({ $or: [{ email: input.email }, { username: input.username }] });
  if (existingUser) {
    const field = existingUser.email === input.email ? 'email' : 'username';
    throw new AppError(409, `An account with this ${field} already exists`);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    email: input.email,
    username: input.username,
    passwordHash,
    profile: input.profile,
  });
  return { user, tokens: await issueTokenPair(user) };
}

export async function login(emailOrUsername: string, password: string): Promise<{ user: UserDocument; tokens: TokenPair }> {
  const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Invalid credentials');
  return { user, tokens: await issueTokenPair(user) };
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  let payload;
  try { payload = verifyToken(refreshToken, 'refresh'); } catch { throw new AppError(401, 'Invalid refresh token'); }
  const token = await RefreshToken.findOneAndUpdate(
    { jti: payload.jti, userId: payload.sub, tokenHash: hashToken(refreshToken), isRevoked: false, expiresAt: { $gt: new Date() } },
    { $set: { isRevoked: true } },
    { new: false },
  );
  if (!token) throw new AppError(401, 'Invalid refresh token');
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'Invalid refresh token');
  return issueTokenPair(user);
}

export async function logout(refreshToken: string): Promise<void> {
  let payload;
  try { payload = verifyToken(refreshToken, 'refresh'); } catch { return; }
  await RefreshToken.updateOne({ jti: payload.jti, userId: payload.sub, tokenHash: hashToken(refreshToken), isRevoked: false }, { $set: { isRevoked: true } });
}

export type { Role };
