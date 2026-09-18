import { AppError } from '../errors/AppError.js';

type ProfileUpdate = Record<'profile.firstName' | 'profile.lastName' | 'profile.bio', string>;
type AdminUserUpdate = Partial<ProfileUpdate> & { roles?: ('user' | 'admin')[] };

export interface RegistrationInput {
  email: string;
  username: string;
  password: string;
  profile: { firstName: string; lastName: string; bio?: string };
}

export interface TodoInput {
  title: string;
  description?: string;
  completed?: boolean;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new AppError(400, 'Invalid request body');
  return value as Record<string, unknown>;
}

export function loginBody(body: unknown): { emailOrUsername: string; password: string } {
  const value = record(body);
  if (typeof value.emailOrUsername !== 'string' || !value.emailOrUsername.trim() || typeof value.password !== 'string' || !value.password) throw new AppError(400, 'emailOrUsername and password are required');
  return { emailOrUsername: value.emailOrUsername.trim().toLowerCase(), password: value.password };
}

export function registerBody(body: unknown): RegistrationInput {
  const value = record(body);
  const email = value.email;
  const username = value.username;
  const password = value.password;
  const profile = record(value.profile);

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AppError(400, 'A valid email is required');
  }
  if (typeof username !== 'string' || !username.trim()) throw new AppError(400, 'username is required');
  if (typeof password !== 'string' || password.length < 8) throw new AppError(400, 'password must be at least 8 characters long');
  if (typeof profile.firstName !== 'string' || !profile.firstName.trim()) throw new AppError(400, 'profile.firstName is required');
  if (typeof profile.lastName !== 'string' || !profile.lastName.trim()) throw new AppError(400, 'profile.lastName is required');
  if (profile.bio !== undefined && typeof profile.bio !== 'string') throw new AppError(400, 'profile.bio must be a string');

  return {
    email: email.trim().toLowerCase(),
    username: username.trim().toLowerCase(),
    password,
    profile: {
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      ...(profile.bio !== undefined ? { bio: profile.bio.trim() } : {}),
    },
  };
}

export function emailBody(body: unknown): string {
  const value = record(body);
  if (typeof value.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
    throw new AppError(400, 'A valid email is required');
  }
  return value.email.trim().toLowerCase();
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

export function adminUserUpdateBody(body: unknown): AdminUserUpdate {
  const value = record(body);
  const allowed = new Set(['profile', 'roles']);
  if (!Object.keys(value).length || Object.keys(value).some((key) => !allowed.has(key))) throw new AppError(400, 'Invalid user fields');
  const update: AdminUserUpdate = {};
  if ('profile' in value) Object.assign(update, profileUpdateBody({ profile: value.profile }));
  if ('roles' in value) {
    if (!Array.isArray(value.roles) || !value.roles.length || value.roles.some((role) => role !== 'user' && role !== 'admin')) {
      throw new AppError(400, 'roles must contain only user and admin');
    }
    update.roles = [...new Set(value.roles)] as ('user' | 'admin')[];
  }
  return update;
}

export function todoCreateBody(body: unknown): TodoInput {
  const value = record(body);
  if (typeof value.title !== 'string' || !value.title.trim()) throw new AppError(400, 'title is required');
  if (value.title.trim().length > 200) throw new AppError(400, 'title must be 200 characters or fewer');
  if (value.description !== undefined && typeof value.description !== 'string') throw new AppError(400, 'description must be a string');
  if (typeof value.description === 'string' && value.description.trim().length > 2000) throw new AppError(400, 'description must be 2000 characters or fewer');
  return {
    title: value.title.trim(),
    ...(typeof value.description === 'string' ? { description: value.description.trim() } : {}),
  };
}

export function todoUpdateBody(body: unknown): TodoInput {
  const value = record(body);
  const allowed = new Set(['title', 'description', 'completed']);
  if (!Object.keys(value).length || Object.keys(value).some((key) => !allowed.has(key))) throw new AppError(400, 'Invalid todo fields');
  const update: TodoInput = {} as TodoInput;
  if ('title' in value) {
    if (typeof value.title !== 'string' || !value.title.trim()) throw new AppError(400, 'title cannot be empty');
    if (value.title.trim().length > 200) throw new AppError(400, 'title must be 200 characters or fewer');
    update.title = value.title.trim();
  }
  if ('description' in value) {
    if (typeof value.description !== 'string' || value.description.trim().length > 2000) throw new AppError(400, 'description must be a string of 2000 characters or fewer');
    update.description = value.description.trim();
  }
  if ('completed' in value) {
    if (typeof value.completed !== 'boolean') throw new AppError(400, 'completed must be a boolean');
    update.completed = value.completed;
  }
  return update;
}
