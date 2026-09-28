import { Hono } from 'hono';

const adminRouter = new Hono();

adminRouter.get('/overview', (c) => {
  return c.json({ success: true, message: 'Admin control room' });
});

export default adminRouter;
