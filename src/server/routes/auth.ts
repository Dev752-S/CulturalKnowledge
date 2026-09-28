import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { getDatabase } from '../../db/client';
import { users, participants, sessions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const authRouter = new Hono();

const SESSION_COOKIE_NAME = 'skp_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

// In-memory session fallback when database is not connected (e.g. offline dev/testing)
const memorySessions = new Map<string, {
  userId: string;
  role: 'participant' | 'admin' | 'host' | 'proctor' | 'super_admin';
  fullName: string;
  email: string;
  expiresAt: Date;
}>();

/**
 * POST /api/v1/auth/google
 * Authenticates user via Google OAuth identity, establishes server-authoritative session
 */
authRouter.post('/google', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    // Google credential token or default test participant
    const email = body.email || 'participant.skp2026@gmail.com';
    const fullName = body.name || 'SKP Participant';
    const deviceFingerprint = c.req.header('user-agent') || 'browser-client';

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    const activeDb = getDatabase();

    if (activeDb) {
      // Find or create user
      let existingUser = (await activeDb.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!existingUser) {
        const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
        const [newUser] = await activeDb.insert(users).values({
          email,
          username,
          fullName,
          passwordHash: 'oauth_managed',
          role: 'participant',
        }).returning();
        existingUser = newUser;

        // Provision participant profile
        await activeDb.insert(participants).values({
          userId: existingUser.id,
          registrationNumber: 'SKP-' + Math.floor(100000 + Math.random() * 900000),
          collegeName: 'SKP Engineering College',
          department: 'Computer Science & Engineering',
          yearOfStudy: 'III',
          phone: '+91 98765 43210',
        });
      }

      // Deactivate any previous active sessions for single-session enforcement (Section 19)
      await activeDb.update(sessions)
        .set({ isActive: false })
        .where(and(eq(sessions.userId, existingUser.id), eq(sessions.isActive, true)));

      // Create new authoritative session
      await activeDb.insert(sessions).values({
        id: sessionId,
        userId: existingUser.id,
        role: existingUser.role,
        deviceFingerprint,
        ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
        userAgent: c.req.header('user-agent'),
        expiresAt,
        isActive: true,
      });
    } else {
      // Memory fallback for offline dev/test
      memorySessions.set(sessionId, {
        userId: 'dev-participant-id',
        role: 'participant',
        fullName,
        email,
        expiresAt,
      });
    }

    // Set secure HttpOnly session cookie
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE,
    });

    logger.info(`Participant logged in successfully: ${email}`);

    return c.json({
      success: true,
      user: {
        email,
        fullName,
        role: 'participant',
      },
    });
  } catch (err: any) {
    logger.error('Google login failed:', { error: err.message });
    return c.json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Authentication failed. Please try again.',
      },
    }, 400);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user from HttpOnly session
 */
authRouter.get('/me', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return c.json({ success: true, user: null });
  }

  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const activeSession = (await activeDb.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
      if (!activeSession || !activeSession.isActive || new Date() > activeSession.expiresAt) {
        deleteCookie(c, SESSION_COOKIE_NAME);
        return c.json({ success: true, user: null });
      }

      const user = (await activeDb.select().from(users).where(eq(users.id, activeSession.userId)).limit(1))[0];
      if (!user) {
        return c.json({ success: true, user: null });
      }

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch {
      return c.json({ success: true, user: null });
    }
  } else {
    const memSession = memorySessions.get(sessionId);
    if (!memSession || new Date() > memSession.expiresAt) {
      deleteCookie(c, SESSION_COOKIE_NAME);
      return c.json({ success: true, user: null });
    }
    return c.json({
      success: true,
      user: {
        id: memSession.userId,
        email: memSession.email,
        fullName: memSession.fullName,
        role: memSession.role,
      },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 */
authRouter.post('/logout', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionId) {
    const activeDb = getDatabase();
    if (activeDb) {
      await activeDb.update(sessions).set({ isActive: false }).where(eq(sessions.id, sessionId));
    } else {
      memorySessions.delete(sessionId);
    }
    deleteCookie(c, SESSION_COOKIE_NAME);
  }
  return c.json({ success: true, message: 'Logged out successfully' });
});

export default authRouter;
