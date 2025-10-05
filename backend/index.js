import * as Sentry from '@sentry/node';
import { server, PORT } from './server.js';
import logger from './src/utils/logger.js';

// Initialize Sentry before the server starts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

server.listen(PORT, () => {
  logger.info(`🚀 Qiyal.ai Backend running on port ${PORT}`);
});