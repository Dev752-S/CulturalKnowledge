import { Hono } from 'hono';

const leaderboardRouter = new Hono();

leaderboardRouter.get('/', (c) => {
  return c.json({ success: true, leaderboard: [] });
});

export default leaderboardRouter;
