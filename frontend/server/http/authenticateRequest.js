import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';

/** Throws AppError if not authenticated; mutates req.user / req.userId */
export async function authenticateRequest(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = payload.sub;
    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) {
      throw new AppError('Invalid session', 401, 'UNAUTHORIZED');
    }
    req.user = user;
    req.userId = String(user._id);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}
