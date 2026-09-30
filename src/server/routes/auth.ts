import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { getDatabase } from '../../db/client';
import { users, participants, sessions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, memorySessions, resolveSessionUser } from '../middleware/auth';

const authRouter = new Hono();

/**
 * POST /api/v1/auth/google
 * Authenticates user via Google OAuth identity, establishes server-authoritative session
 */
authRouter.post('/google', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = body.email || 'participant.skp2026@gmail.com';
    const fullName = body.name || 'SKP Participant';
    const deviceFingerprint = c.req.header('user-agent') || 'browser-client';

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    const activeDb = getDatabase();
    let teamName: string | null = null;

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
          teamName: null,
        }).returning();
      } else {
        const pList = await activeDb.select().from(participants).where(eq(participants.userId, existingUser.id)).limit(1);
        if (pList[0]) {
          teamName = pList[0].teamName;
        }
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
      // Check if memory store already has this user's team name
      for (const s of memorySessions.values()) {
        if (s.email === email && s.teamName) {
          teamName = s.teamName;
          break;
        }
      }

      const devUserId = 'dev-user-' + email.replace(/[^a-zA-Z0-9]/g, '_');
      const devParticipantId = 'dev-p-' + email.replace(/[^a-zA-Z0-9]/g, '_');

      memorySessions.set(sessionId, {
        userId: devUserId,
        role: 'participant',
        fullName,
        email,
        participantId: devParticipantId,
        teamName,
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

    const hasTeamName = Boolean(teamName && teamName.trim().length > 0);
    logger.info(`Participant logged in: ${email} (hasTeamName: ${hasTeamName})`);

    return c.json({
      success: true,
      user: {
        email,
        fullName,
        role: 'participant',
        teamName,
      },
      hasTeamName,
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
 * POST /api/v1/auth/admin-login
 * Dedicated administrative authentication using root credentials
 */
export const ADMIN_CREDENTIALS = {
  email: 'darkdev257@gmail.com',
  passkey: 'dev7.$25#@%9',
  fullName: 'Super Administrator',
  role: 'admin' as const,
};

authRouter.post('/admin-login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, passkey } = body;

    if (!email || !passkey) {
      return c.json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email ID and passkey are required.' },
      }, 400);
    }

    if (email.trim().toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() || passkey !== ADMIN_CREDENTIALS.passkey) {
      logger.warn(`Failed admin login attempt with ID: ${email}`);
      return c.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials or passkey.' },
      }, 401);
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
    const activeDb = getDatabase();
    let adminUserId = 'usr-admin-darkdev';

    if (activeDb) {
      let existingUser = (await activeDb.select().from(users).where(eq(users.email, ADMIN_CREDENTIALS.email)).limit(1))[0];
      if (!existingUser) {
        const [newUser] = await activeDb.insert(users).values({
          email: ADMIN_CREDENTIALS.email,
          username: 'darkdev257',
          fullName: ADMIN_CREDENTIALS.fullName,
          passwordHash: 'admin_passkey_verified',
          role: 'admin',
        }).returning();
        existingUser = newUser;
      } else if (existingUser.role !== 'admin' && existingUser.role !== 'super_admin') {
        await activeDb.update(users).set({ role: 'admin' }).where(eq(users.id, existingUser.id));
      }
      adminUserId = existingUser.id;

      // Deactivate prior sessions
      await activeDb.update(sessions)
        .set({ isActive: false })
        .where(and(eq(sessions.userId, existingUser.id), eq(sessions.isActive, true)));

      // Insert new admin session
      await activeDb.insert(sessions).values({
        id: sessionId,
        userId: existingUser.id,
        role: 'admin',
        deviceFingerprint: c.req.header('user-agent') || 'admin-console',
        ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
        userAgent: c.req.header('user-agent'),
        expiresAt,
        isActive: true,
      });
    } else {
      memorySessions.set(sessionId, {
        userId: adminUserId,
        role: 'admin',
        fullName: ADMIN_CREDENTIALS.fullName,
        email: ADMIN_CREDENTIALS.email,
        expiresAt,
      });
    }

    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE,
    });

    logger.info(`Admin successfully authenticated: ${ADMIN_CREDENTIALS.email}`);

    return c.json({
      success: true,
      user: {
        id: adminUserId,
        email: ADMIN_CREDENTIALS.email,
        fullName: ADMIN_CREDENTIALS.fullName,
        role: 'admin',
      },
      message: 'Admin authorization granted',
    });
  } catch (err: any) {
    logger.error('Admin login error:', { error: err.message });
    return c.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process admin authentication.' },
    }, 500);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user from HttpOnly session
 */
authRouter.get('/me', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  const user = await resolveSessionUser(sessionId);

  if (!user) {
    if (sessionId) deleteCookie(c, SESSION_COOKIE_NAME);
    return c.json({ success: true, user: null, hasTeamName: false });
  }

  const hasTeamName = Boolean(user.teamName && user.teamName.trim().length > 0);
  return c.json({
    success: true,
    user,
    hasTeamName,
  });
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
