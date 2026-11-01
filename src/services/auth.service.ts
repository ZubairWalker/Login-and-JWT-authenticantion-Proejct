import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import { RefreshToken, type Role, type UserDocument, User } from '../models/User.js';
import { getTokenExpirationDate, hashToken, signAccessToken, signRefreshToken, verifyToken } from './jwt.js';
import type { RegistrationInput } from '../utils/validation.js';
import { sendVerificationEmail } from '../utils/emailService.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(user: UserDocument): Promise<TokenPair> {
  const accessToken = signAccessToken(user.id, user.roles);
  const refreshToken = signRefreshToken(user.id, user.roles);
  const payload = verifyToken(refreshToken, 'refresh');
  await RefreshToken.create({
    userId: user._id,
    jti: payload.jti,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpirationDate(refreshToken),
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegistrationInput): Promise<UserDocument> {
  const existingUser = await User.findOne({ $or: [{ email: input.email }, { username: input.username }] });
  if (existingUser) {
    const field = existingUser.email === input.email ? 'email' : 'username';
    throw new AppError(409, `An account with this ${field} already exists`, 'DUPLICATE_ACCOUNT');
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
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) {
    throw new AppError(403, 'User account is deactivated', 'ACCOUNT_DEACTIVATED');
  }
  return { user, tokens: await issueTokenPair(user) };
}

export async function verifyEmail(token: string): Promise<UserDocument> {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    verificationTokenHash: tokenHash,
    verificationTokenExpiry: { $gt: new Date() },
  }).select('+verificationTokenHash');
  if (!user) {
    throw new AppError(400, 'Verification token is invalid or has expired', 'INVALID_TOKEN');
  }

  const verifiedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: { isVerified: true },
      $unset: { verificationTokenHash: 1, verificationTokenExpiry: 1 },
    },
    { returnDocument: 'after' },
  );
  if (!verifiedUser) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }
  return verifiedUser;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.isVerified) return;

  const now = new Date();
  if (user.lastVerificationSentAt && now.getTime() - user.lastVerificationSentAt.getTime() < 60 * 1000) {
    return;
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationTokenHash = hashToken(verificationToken);
  user.verificationTokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  user.lastVerificationSentAt = now;
  await user.save();
  await sendVerificationEmail(user.email, verificationToken);
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(refreshToken, 'refresh');
  } catch {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const tokenHash = hashToken(refreshToken);
  const token = await RefreshToken.findOneAndUpdate(
    { jti: payload.jti, tokenHash, isRevoked: false, expiresAt: { $gt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!token) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
  if (!user.isActive) {
    throw new AppError(403, 'User account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  return issueTokenPair(user);
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyToken(refreshToken, 'refresh');
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.findOneAndUpdate(
      { jti: payload.jti, tokenHash, isRevoked: false },
      { $set: { isRevoked: true } },
    );
  } catch {
    // Silent logout on invalid token to avoid leaking token details
  }
}
