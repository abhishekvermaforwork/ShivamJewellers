import 'dotenv/config';
import http from 'http';
import { createApp } from './src/app.js';
import { connectDatabase } from './src/config/database.js';
import { env } from './src/config/env.js';
import { logger } from './src/config/logger.js';

async function main() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`HTTP server listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, closing server`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { err });
  process.exit(1);
});
