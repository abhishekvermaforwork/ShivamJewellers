  function required(name, fallback = undefined) {
    const v = process.env[name];
    if (v === undefined || v === '') {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return v;
  }

  export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/invoicehub'),
    jwtSecret: required('JWT_SECRET', 'dev-only-change-in-production'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
  };
