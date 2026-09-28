import type { MiddlewareHandler } from 'hono';
import { getCookie, deleteCookie } from 'hono/cookie';
import { getDatabase } from '../../db/client';
import { users, participants, sessions, type UserRole } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from './errorHandler';

export const SESSION_COOKIE_NAME = 'skp_session';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  participantId?: string;
  teamName?: string | null;
}

// In-memory session store when database is not connected (dev/test)
export const memorySessions = new Map<string, {
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  participantId?: string;
  teamName?: string | null;
  expiresAt: Date;
}>();

export async function resolveSessionUser(sessionId?: string): Promise<SessionUser | null> {
  if (!sessionId) return null;

  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const sessionList = await activeDb.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      const activeSession = sessionList[0];
      if (!activeSession || !activeSession.isActive || new Date() > activeSession.expiresAt) {
        return null;
      }

      const userList = await activeDb.select().from(users).where(eq(users.id, activeSession.userId)).limit(1);
      const user = userList[0];
      if (!user) return null;

      let participantId: string | undefined;
      let teamName: string | null = null;

      if (user.role === 'participant') {
        const participantList = await activeDb.select().from(participants).where(eq(participants.userId, user.id)).limit(1);
        if (participantList[0]) {
          participantId = participantList[0].id;
          teamName = participantList[0].teamName;
        }
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        participantId,
        teamName,
      };
    } catch {
      return null;
    }
  } else {
    const mem = memorySessions.get(sessionId);
    if (!mem || new Date() > mem.expiresAt) {
      return null;
    }
    return {
      id: mem.userId,
      email: mem.email,
      fullName: mem.fullName,
      role: mem.role,
      participantId: mem.participantId || 'dev-participant-id',
      teamName: mem.teamName || null,
    };
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  const user = await resolveSessionUser(sessionId);

  if (!user) {
    if (sessionId) {
      deleteCookie(c, SESSION_COOKIE_NAME);
    }
    throw new AppError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
  }

  c.set('user', user);
  await next();
};

export function requireRole(...allowedRoles: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as SessionUser | undefined;
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!allowedRoles.includes(user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions for this resource', 403);
    }
    await next();
  };
}
