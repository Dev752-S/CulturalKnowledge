import { Hono } from 'hono';

const analyticsRouter = new Hono();

analyticsRouter.get('/summary', (c) => {
  return c.json({ success: true, summary: {} });
});

export default analyticsRouter;
