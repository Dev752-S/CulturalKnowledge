import { Hono } from 'hono';

const participantsRouter = new Hono();

participantsRouter.get('/', (c) => {
  return c.json({ success: true, data: [] });
});

export default participantsRouter;
