import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import { RefreshToken, type Role, type UserDocument, User } from '../models/User.js';
import { getTokenExpirationDate, hashToken, signAccessToken, signRefreshToken, verifyToken } from './jwt.js';
import type { RegistrationInput } from '../utils/validation.js';
import { sendVerificationEmail } from '../utils/emailService.js';

export interface TokenPair { accessToken: string; refreshToken: string; }

async function issueTokenPair(user: UserDocument): Promise<TokenPair> {
  const accessToken = signAccessToken(user.id, user.roles);
  const refreshToken = signRefreshToken(user.id, user.roles);
  const payload = verifyToken(refreshToken, 'refresh');
  await RefreshToken.create({ userId: user._id, jti: payload.jti, tokenHash: hashToken(refreshToken), expiresAt: getTokenExpirationDate(refreshToken) });
  return { accessToken, refreshToken };
}

export async function register(input: RegistrationInput): Promise<UserDocument> {
  const existingUser = await User.findOne({ $or: [{ email: input.email }, { username: input.username }] });
  if (existingUser) {
    const field = existingUser.email === input.email ? 'email' : 'username';
    throw new AppError(409, `An account with this ${field} already exists`);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const user = await User.create({
    email: input.email,
    username: input.username,
    passwordHash,
    profile: input.profile,
    verificationTokenHash: hashToken(verificationToken),
    verificationTokenExpiry: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    lastVerificationSentAt: now,
  });
  await sendVerificationEmail(user.email, verificationToken);
  return user;
}

export async function login(emailOrUsername: string, password: string): Promise<{ user: UserDocument; tokens: TokenPair }> {
  const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Invalid credentials');
  if (!user.isVerified) throw new AppError(403, 'Email verification is required');
  return { user, tokens: await issueTokenPair(user) };
}

export async function verifyEmail(token: string): Promise<UserDocument> {
  const user = await User.findOne({ verificationTokenHash: hashToken(token), verificationTokenExpiry: { $gt: new Date() } }).select('+verificationTokenHash');
  if (!user) throw new AppError(400, 'Verification token is invalid or has expired');
  const verifiedUser = await User.findByIdAndUpdate(
    user.id,
    { $set: { isVerified: true }, $unset: { verificationTokenHash: 1, verificationTokenExpiry: 1 } },
    { new: true },
  );
  if (!verifiedUser) throw new AppError(404, 'User not found');
  return verifiedUser;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.isVerified) return;
  if (user.lastVerificationSentAt && Date.now() - user.lastVerificationSentAt.getTime() < 60_000) return;
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationTokenHash = hashToken(verificationToken);
  user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.lastVerificationSentAt = new Date();
  await user.save();
  await sendVerificationEmail(user.email, verificationToken);
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
  if (!user || !user.isVerified) throw new AppError(401, 'Invalid refresh token');
  return issueTokenPair(user);
}

export async function logout(refreshToken: string): Promise<void> {
  let payload;
  try { payload = verifyToken(refreshToken, 'refresh'); } catch { return; }
  await RefreshToken.updateOne({ jti: payload.jti, userId: payload.sub, tokenHash: hashToken(refreshToken), isRevoked: false }, { $set: { isRevoked: true } });
}

export type { Role };
