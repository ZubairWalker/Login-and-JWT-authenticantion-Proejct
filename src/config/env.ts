import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoDbUrl: required('MongoDB_URL'),
  jwtSecret: required('JWT_SECRET'),
};
