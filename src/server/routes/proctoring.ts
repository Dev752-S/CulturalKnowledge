import { Hono } from 'hono';

const proctoringRouter = new Hono();

proctoringRouter.get('/events', (c) => {
  return c.json({ success: true, events: [] });
});

export default proctoringRouter;
