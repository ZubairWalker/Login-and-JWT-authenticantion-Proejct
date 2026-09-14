import { AppError } from '../errors/AppError.js';

type ProfileUpdate = Record<'profile.firstName' | 'profile.lastName' | 'profile.bio', string>;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AppError(400, 'Invalid request body');
  return value as Record<string, unknown>;
}

export function loginBody(body: unknown): { emailOrUsername: string; password: string } {
  const value = record(body);
  if (typeof value.emailOrUsername !== 'string' || !value.emailOrUsername.trim() || typeof value.password !== 'string' || !value.password) throw new AppError(400, 'emailOrUsername and password are required');
  return { emailOrUsername: value.emailOrUsername.trim().toLowerCase(), password: value.password };
}

export function refreshBody(body: unknown): { refreshToken: string } {
  const value = record(body);
  if (typeof value.refreshToken !== 'string' || !value.refreshToken) throw new AppError(400, 'refreshToken is required');
  return { refreshToken: value.refreshToken };
}

export function profileUpdateBody(body: unknown): Partial<ProfileUpdate> {
  const value = record(body);
  if (Object.keys(value).length !== 1 || !('profile' in value)) throw new AppError(400, 'Only profile may be updated');
  const profile = record(value.profile);
  const allowed = new Set(['firstName', 'lastName', 'bio']);
  const keys = Object.keys(profile);
  if (!keys.length || keys.some((key) => !allowed.has(key))) throw new AppError(400, 'Invalid profile fields');

  const update: Partial<ProfileUpdate> = {};
  for (const key of keys) {
    const field = profile[key];
    if (typeof field !== 'string') throw new AppError(400, 'Profile fields must be strings');
    if ((key === 'firstName' || key === 'lastName') && !field.trim()) throw new AppError(400, `${key} cannot be empty`);
    update[`profile.${key}` as keyof ProfileUpdate] = field.trim();
  }
  return update;
}
