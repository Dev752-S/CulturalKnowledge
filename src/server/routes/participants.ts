import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDatabase } from '../../db/client';
import { participants } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, memorySessions, type SessionUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

type AuthEnv = {
  Variables: {
    user: SessionUser;
  };
};

const participantsRouter = new Hono<AuthEnv>();

// Zod validation conforming to Section 10
const teamNameSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters long')
    .max(50, 'Team name cannot exceed 50 characters')
    .refine((val) => !/[\x00-\x1F\x7F]/.test(val), {
      message: 'Team name contains invalid characters',
    })
    .transform((val) => val.replace(/\s+/g, ' ')), // Normalize multiple spaces
});

/**
 * POST /api/v1/participant/team
 * Persists the participant's team name into authoritative persistent state
 */
participantsRouter.post('/team', requireAuth, zValidator('json', teamNameSchema), async (c) => {
  const user = c.get('user') as SessionUser;
  const { teamName } = c.req.valid('json');

  if (user.role !== 'participant') {
    throw new AppError('FORBIDDEN', 'Only participants can submit a team name', 403);
  }

  const activeDb = getDatabase();

  if (activeDb) {
    try {
      // Find participant record for user
      const participantList = await activeDb
        .select()
        .from(participants)
        .where(eq(participants.userId, user.id))
        .limit(1);

      if (!participantList[0]) {
        throw new AppError('PARTICIPANT_NOT_FOUND', 'Participant profile not found', 404);
      }

      // Update team name authoritatively
      await activeDb
        .update(participants)
        .set({
          teamName,
          updatedAt: new Date(),
        })
        .where(eq(participants.id, participantList[0].id));

      logger.info(`Updated team name for participant ${user.email}: "${teamName}"`);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to update team name in database:', { error: err.message });
      throw new AppError('DATABASE_ERROR', 'Failed to save team name. Please try again.', 500);
    }
  } else {
    // Memory store update for offline dev / testing
    for (const s of memorySessions.values()) {
      if (s.userId === user.id || s.email === user.email) {
        s.teamName = teamName;
      }
    }
    logger.info(`Updated in-memory team name for ${user.email}: "${teamName}"`);
  }

  return c.json({
    success: true,
    message: 'Team name registered successfully',
    teamName,
  });
});

participantsRouter.get('/', requireAuth, (c) => {
  return c.json({ success: true, data: [] });
});

export default participantsRouter;
