import { Hono } from 'hono';
import { eq, desc, asc } from 'drizzle-orm';
import { getDatabase } from '../../db/client';
import { quizAttempts, participants, users } from '../../db/schema';
import { memoryAttempts } from './quiz';
import { memoryRound2Attempts } from './round2';
import { teamMarkAdjustments } from '../data/adminStore';
import rawRound2Questions from '../data/round2_questions_50.json';

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

export interface Round2LeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName: string;
  score: number; // Correct logo names (0-50) + adjustments
  baseScore: number;
  adjustment: number;
  answeredCount: number;
  submittedAt: string | null;
}

export interface OverallLeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  teamName: string;
  round1Score: number;
  round2Score: number;
  totalScore: number;
  submittedAt: string | null;
}

// Helper map for Round 2 correct answers
const r2CorrectAnswersMap = new Map(
  rawRound2Questions.map((q) => [
    q.questionId,
    { logoId: q.correctLogoId, brandName: q.correctBrandName?.toLowerCase() },
  ])
);

export function calculateMemRound2Score(mem: any): number {
  if (!mem || !mem.answers) return 0;
  let score = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    const correct = r2CorrectAnswersMap.get(qId);
    if (!correct) continue;
    if (
      (ans.selectedBrandName && ans.selectedBrandName.toLowerCase() === correct.brandName) ||
      (ans.selectedLogoId && ans.selectedLogoId === correct.logoId)
    ) {
      score += 1;
    }
  }
  return score;
}

// 1. Compute Round 1 Leaderboard
export async function getRound1Leaderboard(): Promise<LeaderboardEntry[]> {
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
        const adj = teamMarkAdjustments.get((row.teamName || '').trim())?.round1Adjustment || 0;
        entries.push({
          participantId: row.participantId,
          participantName: row.fullName || 'Contestant',
          teamName: row.teamName || 'Team Vibes',
          score: Math.max(0, row.score + adj),
          accuracyPercentage: row.accuracyPercentage,
          submittedAt: row.submittedAt,
        });
      }
    } catch {
      // Fallback
    }
  }

  for (const [userId, mem] of memoryAttempts.entries()) {
    if (mem.isSubmitted && !seenParticipants.has(userId) && !mem.isDisqualified) {
      seenParticipants.add(userId);
      const adj = teamMarkAdjustments.get((mem.teamName || '').trim())?.round1Adjustment || 0;
      entries.push({
        participantId: userId,
        participantName: mem.participantName || 'Contestant',
        teamName: mem.teamName || 'Team Vibes',
        score: Math.max(0, mem.score + adj),
        accuracyPercentage: mem.accuracyPercentage,
        submittedAt: mem.submittedAt,
      });
    }
  }

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return timeA - timeB;
  });

  return entries.map((entry, idx) => ({
    rank: idx + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamName: entry.teamName,
    score: entry.score,
    accuracyPercentage: entry.accuracyPercentage,
    submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null,
  }));
}

// 2. Compute Round 2 Leaderboard
export function getRound2Leaderboard(): Round2LeaderboardEntry[] {
  const entries: Array<{
    participantId: string;
    participantName: string;
    teamName: string;
    score: number;
    baseScore: number;
    adjustment: number;
    answeredCount: number;
    submittedAt: Date | null;
  }> = [];

  for (const [userId, mem] of memoryRound2Attempts.entries()) {
    if (mem.isSubmitted && !mem.isDisqualified) {
      const baseScore = calculateMemRound2Score(mem);
      const adj = teamMarkAdjustments.get((mem.teamName || '').trim())?.round2Adjustment || 0;
      const totalR2Score = Math.max(0, baseScore + adj);

      entries.push({
        participantId: userId,
        participantName: mem.teamName || 'Contestant',
        teamName: mem.teamName || 'Team Vibes',
        score: totalR2Score,
        baseScore,
        adjustment: adj,
        answeredCount: mem.answeredCount || 0,
        submittedAt: mem.submittedAt,
      });
    }
  }

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return timeA - timeB;
  });

  return entries.map((entry, idx) => ({
    rank: idx + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamName: entry.teamName,
    score: entry.score,
    baseScore: entry.baseScore,
    adjustment: entry.adjustment,
    answeredCount: entry.answeredCount,
    submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null,
  }));
}

// 3. Compute Overall Dashboard (Round 1 + Round 2)
export async function getOverallLeaderboard(): Promise<OverallLeaderboardEntry[]> {
  const r1 = await getRound1Leaderboard();
  const r2 = getRound2Leaderboard();

  const teamsMap = new Map<
    string,
    {
      participantId: string;
      participantName: string;
      teamName: string;
      round1Score: number;
      round2Score: number;
      totalScore: number;
      submittedAt: string | null;
    }
  >();

  for (const item of r1) {
    const key = item.teamName.toLowerCase();
    teamsMap.set(key, {
      participantId: item.participantId,
      participantName: item.participantName,
      teamName: item.teamName,
      round1Score: item.score,
      round2Score: 0,
      totalScore: item.score,
      submittedAt: item.submittedAt,
    });
  }

  for (const item of r2) {
    const key = item.teamName.toLowerCase();
    const existing = teamsMap.get(key);
    if (existing) {
      existing.round2Score = item.score;
      existing.totalScore = existing.round1Score + item.score;
      if (item.submittedAt) existing.submittedAt = item.submittedAt;
    } else {
      teamsMap.set(key, {
        participantId: item.participantId,
        participantName: item.participantName,
        teamName: item.teamName,
        round1Score: 0,
        round2Score: item.score,
        totalScore: item.score,
        submittedAt: item.submittedAt,
      });
    }
  }

  const list = Array.from(teamsMap.values());
  list.sort((a, b) => b.totalScore - a.totalScore);

  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

// GET /api/v1/leaderboard
leaderboardRouter.get('/', async (c) => {
  const round = c.req.query('round');
  const r1 = await getRound1Leaderboard();
  const r2 = getRound2Leaderboard();
  const overall = await getOverallLeaderboard();

  if (round === 'round2') {
    return c.json({
      success: true,
      round: 'round2',
      leaderboard: r2,
      round1: r1,
      round2: r2,
      overall,
    });
  }

  if (round === 'overall') {
    return c.json({
      success: true,
      round: 'overall',
      leaderboard: overall,
      round1: r1,
      round2: r2,
      overall,
    });
  }

  // Default: Round 1 leaderboard for backwards compatibility
  return c.json({
    success: true,
    round: 'round1',
    leaderboard: r1,
    round1: r1,
    round2: r2,
    overall,
  });
});

// GET /api/v1/leaderboard/all
leaderboardRouter.get('/all', async (c) => {
  const round1 = await getRound1Leaderboard();
  const round2 = getRound2Leaderboard();
  const overall = await getOverallLeaderboard();

  return c.json({
    success: true,
    round1,
    round2,
    overall,
  });
});

export default leaderboardRouter;
