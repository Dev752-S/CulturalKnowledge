import { Hono } from 'hono';

const reportsRouter = new Hono();

reportsRouter.get('/', (c) => {
  return c.json({ success: true, reports: [] });
});

export default reportsRouter;
