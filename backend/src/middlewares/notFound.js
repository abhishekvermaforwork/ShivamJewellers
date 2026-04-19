import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}
