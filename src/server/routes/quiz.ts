import { Hono } from 'hono';

const quizRouter = new Hono();

quizRouter.get('/state', (c) => {
  return c.json({ success: true, state: null });
});

export default quizRouter;
