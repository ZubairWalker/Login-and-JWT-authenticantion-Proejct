import crypto from 'node:crypto';
import { env } from '../config/env.js';

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  roles: string[];
  jti: string;
  iat: number;
  exp: number;
  type: TokenType;
}

interface JwtHeader { alg: 'HS256'; typ: 'JWT'; }

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function createSignature(content: string): string {
  return crypto.createHmac('sha256', env.jwtSecret).update(content).digest('base64url');
}

function signToken(userId: string, roles: string[], type: TokenType, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = { sub: userId, roles, jti: crypto.randomUUID(), iat: now, exp: now + ttlSeconds, type };
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  return `${unsignedToken}.${createSignature(unsignedToken)}`;
}

export function signAccessToken(userId: string, roles: string[]): string {
  return signToken(userId, roles, 'access', ACCESS_TOKEN_TTL_SECONDS);
}

export function signRefreshToken(userId: string, roles: string[]): string {
  return signToken(userId, roles, 'refresh', REFRESH_TOKEN_TTL_SECONDS);
}

export function verifyToken(token: string, expectedType: TokenType): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error('Malformed token');
  const [encodedHeader, encodedPayload, signature] = parts as [string, string, string];
  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);
  const actual = Buffer.from(signature, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error('Invalid token signature');

  let header: JwtHeader;
  let payload: JwtPayload;
  try {
    header = decode<JwtHeader>(encodedHeader);
    payload = decode<JwtPayload>(encodedPayload);
  } catch {
    throw new Error('Malformed token');
  }
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Invalid token header');
  if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string' || !Array.isArray(payload.roles) || !payload.roles.every((role) => typeof role === 'string') || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || payload.type !== expectedType) throw new Error('Invalid token payload');
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenExpirationDate(token: string): Date {
  const [, encodedPayload] = token.split('.');
  if (!encodedPayload) throw new Error('Malformed token');
  return new Date(decode<JwtPayload>(encodedPayload).exp * 1000);
}
