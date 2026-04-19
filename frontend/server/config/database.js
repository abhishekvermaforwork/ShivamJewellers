import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

/** Cached connection for Next.js serverless / dev hot reload */
let cached = global.mongoose;

export async function connectDatabase() {
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(env.mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });
  cached = { conn };
  global.mongoose = cached;
  if (env.nodeEnv !== 'production') {
    logger.info('MongoDB connected');
  }
  return conn;
}
