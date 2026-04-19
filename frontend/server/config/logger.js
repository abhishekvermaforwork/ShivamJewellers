import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const line = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${stack || message}${rest}`;
});

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp(), line),
  transports: [new winston.transports.Console({ format: combine(colorize(), line) })],
});
