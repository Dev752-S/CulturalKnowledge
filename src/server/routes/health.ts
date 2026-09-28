import { Hono } from 'hono';
import { checkDatabaseConnection } from '../../db/client';
import { redis } from '../../db/redis';

const healthRouter = new Hono();

healthRouter.get('/', async (c) => {
  const dbHealth = await checkDatabaseConnection();
  
  let redisHealth = { connected: false, message: 'Unchecked' };
  try {
    const pong = await redis.ping();
    redisHealth = { connected: true, message: pong };
  } catch (err: any) {
    redisHealth = { connected: false, message: err.message || 'Redis ping failed' };
  }

  const overallHealthy = dbHealth.connected && redisHealth.connected;
  const status = overallHealthy ? 'healthy' : (redisHealth.connected || dbHealth.connected ? 'degraded' : 'unhealthy');

  return c.json({
    success: true,
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'SKP Skill Arena API',
    checks: {
      database: {
        status: dbHealth.connected ? 'up' : 'down',
        latencyMs: dbHealth.latencyMs,
      },
      redis: {
        status: redisHealth.connected ? 'up' : 'down',
      },
    },
  }, status === 'unhealthy' ? 503 : 200);
});

export default healthRouter;
