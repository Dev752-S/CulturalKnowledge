import { serve } from '@hono/node-server';
import app from './app';
import { env } from './env';
import { logger } from '../utils/logger';

const port = env.PORT || 3001;

logger.info(`Starting SKP Skill Arena Backend server on port ${port}...`);

serve(
  {
    fetch: app.fetch,
    port: Number(port),
  },
  (info) => {
    logger.info(`🚀 SKP Skill Arena API is running at http://localhost:${info.port}`);
    logger.info(`Health check available at http://localhost:${info.port}/api/v1/health`);
  }
);
