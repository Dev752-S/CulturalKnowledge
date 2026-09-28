import { Hono } from 'hono';

const authRouter = new Hono();

authRouter.get('/me', (c) => {
  return c.json({
    success: true,
    user: null,
    message: 'Authentication session verification endpoint',
  });
});

export default authRouter;
