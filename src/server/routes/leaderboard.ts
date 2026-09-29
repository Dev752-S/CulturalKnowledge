import { Hono } from 'hono';
import { eq, desc, asc } from 'drizzle-orm';
import { getDatabase } from '../../db/client';
import { quizAttempts, participants, users } from '../../db/schema';
import { memoryAttempts } from './quiz';

const leaderboardRouter = new Hono();

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName: string;
  score: number;
  accuracyPercentage: string;
  submittedAt: string | null;
}

// GET /api/v1/leaderboard
// CRITICAL: Leaderboard is affected by ROUND 1 ONLY.
// Round 2 never adds points, marks, or scores to this leaderboard.
leaderboardRouter.get('/', async (c) => {
  const activeDb = getDatabase();
  const entries: Array<{
    participantId: string;
    participantName: string;
    teamName: string;
    score: number;
    accuracyPercentage: string;
    submittedAt: Date | null;
  }> = [];

  const seenParticipants = new Set<string>();

  // 1. If DB is active, query submitted Round 1 attempts
  if (activeDb) {
    try {
      const dbRows = await activeDb
        .select({
          participantId: quizAttempts.participantId,
          score: quizAttempts.score,
          accuracyPercentage: quizAttempts.accuracyPercentage,
          submittedAt: quizAttempts.submittedAt,
          teamName: participants.teamName,
          fullName: users.fullName,
        })
        .from(quizAttempts)
        .leftJoin(participants, eq(quizAttempts.participantId, participants.id))
        .leftJoin(users, eq(participants.userId, users.id))
        .where(eq(quizAttempts.isSubmitted, true))
        .orderBy(desc(quizAttempts.score), asc(quizAttempts.submittedAt));

      for (const row of dbRows) {
        seenParticipants.add(row.participantId);
        entries.push({
          participantId: row.participantId,
          participantName: row.fullName || 'Contestant',
          teamName: row.teamName || 'Team Vibes',
          score: row.score,
          accuracyPercentage: row.accuracyPercentage,
          submittedAt: row.submittedAt,
        });
      }
    } catch {
      // Fallback to memory
    }
  }

  // 2. Also check memoryAttempts for submitted attempts (for test/dev mode or unpersisted)
  for (const [userId, mem] of memoryAttempts.entries()) {
    if (mem.isSubmitted && !seenParticipants.has(userId)) {
      seenParticipants.add(userId);
      entries.push({
        participantId: userId,
        participantName: mem.participantName || 'Contestant',
        teamName: mem.teamName || 'Team Vibes',
        score: mem.score,
        accuracyPercentage: mem.accuracyPercentage,
        submittedAt: mem.submittedAt,
      });
    }
  }

  // Sort by Round 1 score descending, then submittedAt ascending
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return timeA - timeB;
  });

  // Assign ranks
  const rankedLeaderboard: LeaderboardEntry[] = entries.map((entry, idx) => ({
    rank: idx + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamName: entry.teamName,
    score: entry.score,
    accuracyPercentage: entry.accuracyPercentage,
    submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null,
  }));

  return c.json({
    success: true,
    leaderboard: rankedLeaderboard,
  });
});

export default leaderboardRouter;
