import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = payload.sub;
    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) {
      return next(new AppError('Invalid session', 401, 'UNAUTHORIZED'));
    }
    req.user = user;
    req.userId = String(user._id);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
}
