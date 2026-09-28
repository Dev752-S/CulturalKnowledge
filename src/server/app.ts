import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, requestLogger } from './middleware/security';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import participantsRouter from './routes/participants';
import quizRouter from './routes/quiz';
import leaderboardRouter from './routes/leaderboard';
import proctoringRouter from './routes/proctoring';
import round2Router from './routes/round2';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import reportsRouter from './routes/reports';

const app = new Hono();

// Global Middlewares
app.use('*', requestLogger);
app.use('*', securityHeaders);

app.use(
  '*',
  cors({
    origin: (origin) => {
      // In production, match host or explicit CORS origin; allow same-origin by default
      if (!origin || origin.includes('localhost') || origin.includes('vercel.app')) {
        return origin || '*';
      }
      return env.CORS_ORIGIN || origin;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  })
);

// Unified Error Handler
app.onError(errorHandler);

// API v1 Router
const v1 = new Hono();
v1.route('/health', healthRouter);
v1.route('/auth', authRouter);
v1.route('/participants', participantsRouter);
v1.route('/quiz', quizRouter);
v1.route('/leaderboard', leaderboardRouter);
v1.route('/proctor', proctoringRouter);
v1.route('/round2', round2Router);
v1.route('/admin', adminRouter);
v1.route('/analytics', analyticsRouter);
v1.route('/reports', reportsRouter);

// Mount under both /api/v1 and directly if called as /api/v1
app.route('/api/v1', v1);
// Also support root-level /health check
app.route('/health', healthRouter);

export default app;
