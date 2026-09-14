import mongoose from 'mongoose';
import { env } from './env.js';

const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongoDbUrl);
  console.log('MongoDB connected');
};

export default connectDB;
