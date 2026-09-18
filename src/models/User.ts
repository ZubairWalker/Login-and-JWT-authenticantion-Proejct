import mongoose, { type HydratedDocument } from 'mongoose';

export type Role = 'user' | 'admin';

export interface IUser {
  email: string;
  username: string;
  passwordHash: string;
  roles: Role[];
  isVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpiry?: Date;
  lastVerificationSentAt?: Date;
  profile: { firstName: string; lastName: string; bio?: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken {
  userId: mongoose.Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: { type: [String], enum: ['user', 'admin'], default: ['user'] },
    isVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, select: false },
    verificationTokenExpiry: Date,
    lastVerificationSentAt: Date,
    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      bio: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, __v, passwordHash, ...user } = ret;
    return { ...user, id: String(_id) };
  },
});

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<IUser>;
export const User = mongoose.model<IUser>('User', userSchema);
export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
