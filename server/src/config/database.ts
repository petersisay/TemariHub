import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: env.NODE_ENV !== 'production', // Build indexes in dev/test, manage explicitly in prod
      serverSelectionTimeoutMS: 5000,
    });
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
