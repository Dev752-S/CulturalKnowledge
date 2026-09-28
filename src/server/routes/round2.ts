import { Hono } from 'hono';

const round2Router = new Hono();

round2Router.get('/state', (c) => {
  return c.json({ success: true, round2State: null });
});

export default round2Router;
