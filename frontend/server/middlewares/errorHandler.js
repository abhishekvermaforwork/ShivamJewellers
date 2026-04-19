import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code;

  if (statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });
  }

  const body = {
    success: false,
    error: {
      message: statusCode === 500 && env.nodeEnv === 'production' ? 'Internal server error' : err.message,
      ...(code ? { code } : {}),
    },
  };

  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
