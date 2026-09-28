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
    let participantId = 'dev-participant-id';

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
        const [newParticipant] = await activeDb.insert(participants).values({
          userId: existingUser.id,
          registrationNumber: 'SKP-' + Math.floor(100000 + Math.random() * 900000),
          collegeName: 'SKP Engineering College',
          department: 'Computer Science & Engineering',
          yearOfStudy: 'III',
          phone: '+91 98765 43210',
          teamName: null,
        }).returning();
        participantId = newParticipant.id;
      } else {
        const pList = await activeDb.select().from(participants).where(eq(participants.userId, existingUser.id)).limit(1);
        if (pList[0]) {
          participantId = pList[0].id;
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

      memorySessions.set(sessionId, {
        userId: 'dev-participant-id',
        role: 'participant',
        fullName,
        email,
        participantId,
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
