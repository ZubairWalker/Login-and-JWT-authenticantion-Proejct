import type { UserDocument } from '../models/User.js';

export function toPublicUser(user: UserDocument) {
  const profile = {
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    ...(user.profile.bio !== undefined ? { bio: user.profile.bio } : {}),
  };
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    roles: user.roles,
    profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toAuthUser(user: UserDocument) {
  return { id: user.id, email: user.email, username: user.username, roles: user.roles };
}
