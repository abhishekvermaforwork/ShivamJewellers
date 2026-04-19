import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiV1Router } from './routes/v1/index.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { handleStripeWebhook } from './controllers/stripeWebhook.controller.js';

const morganStream = {
  write: (msg) => logger.info(msg.trim()),
};

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(compression());

  app.post(
    '/api/v1/payments/webhook/stripe',
    express.raw({ type: 'application/json' }),
    asyncHandler(handleStripeWebhook),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan('combined', { stream: morganStream }));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'invoicehub-api' });
  });

  app.use('/api/v1', apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
