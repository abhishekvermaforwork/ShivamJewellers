function required(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const jwtSecret = required('JWT_SECRET', 'dev-only-change-in-production');
if (isProduction && jwtSecret === 'dev-only-change-in-production') {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}

export const env = {
  nodeEnv,
  port: numberFromEnv('PORT', 4000),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/invoicehub'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptSaltRounds: numberFromEnv('BCRYPT_SALT_ROUNDS', 12),
  rateLimitWindowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: numberFromEnv('RATE_LIMIT_MAX', 300),
};
