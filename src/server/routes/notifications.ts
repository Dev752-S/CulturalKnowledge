import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, type SessionUser } from '../middleware/auth';
import { getDatabase } from '../../db/client';
import { notifications } from '../../db/schema/quiz';
import { memoryNotifications } from './quiz';

type AuthEnv = {
  Variables: {
    user: SessionUser;
  };
};

const notificationsRouter = new Hono<AuthEnv>();

notificationsRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user');
  const activeDb = getDatabase();

  const memNotifs = memoryNotifications.get(user.id) || [];

  if (activeDb) {
    try {
      const dbNotifs = await activeDb
        .select()
        .from(notifications)
        .where(eq(notifications.participantId, user.id))
        .orderBy(desc(notifications.createdAt));

      if (dbNotifs.length > 0) {
        return c.json({
          success: true,
          notifications: dbNotifs.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
          })),
        });
      }
    } catch {
      // Fallback to memNotifs
    }
  }

  return c.json({
    success: true,
    notifications: memNotifs,
  });
});

export default notificationsRouter;
