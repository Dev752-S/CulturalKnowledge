import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { requireAuth, requireRole, SESSION_COOKIE_NAME, SESSION_MAX_AGE, type SessionUser } from '../middleware/auth';
import { ADMIN_CREDENTIALS } from './auth';
import { logger } from '../../utils/logger';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRound1Questions,
  addRound1Question,
  updateRound1Question,
  deleteRound1Question,
  getRound2QuestionsList,
  addRound2Question,
  updateRound2Question,
  deleteRound2Question,
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  resetMemberAttempt,
  getAdminStats,
  setRoundActive,
  getRoundsStatus,
  getRound2Config,
  updateRound2Config,
  adjustTeamMarks,
  removeActiveParticipant,
  teamMarkAdjustments,
} from '../data/adminStore';
import { memoryAttempts } from './quiz';
import { memoryRound2Attempts } from './round2';
import { memorySessions } from '../middleware/auth';
import rawRound2Questions from '../data/round2_questions_50.json';

type AuthEnv = {
  Variables: {
    user: SessionUser;
  };
};

const adminRouter = new Hono<AuthEnv>();

// -------------------------------------------------------------
// PUBLIC ADMIN AUTH ROUTES
// -------------------------------------------------------------

/**
 * POST /api/v1/admin/login
 * Handles direct admin authentication from Admin Portal
 */
adminRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, passkey } = body;

    if (!email || !passkey) {
      return c.json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email ID and passkey are required.' },
      }, 400);
    }

    if (
      email.trim().toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() ||
      passkey !== ADMIN_CREDENTIALS.passkey
    ) {
      return c.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials or passkey.' },
      }, 401);
    }

    // Forward to internal admin login logic by setting session
    const sessionId = crypto.randomUUID();
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE,
    });

    const user = {
      id: 'usr-admin-darkdev',
      email: ADMIN_CREDENTIALS.email,
      fullName: ADMIN_CREDENTIALS.fullName,
      role: 'admin' as const,
    };

    return c.json({
      success: true,
      user,
      message: 'Admin authorization granted',
    });
  } catch (err: any) {
    logger.error('Admin login failed:', { error: err.message });
    return c.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Admin login failed.' },
    }, 500);
  }
});

/**
 * POST /api/v1/admin/logout
 */
adminRouter.post('/logout', async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME);
  return c.json({ success: true, message: 'Admin logged out successfully' });
});

// -------------------------------------------------------------
// PROTECTED ADMIN ROUTES (Require Admin Session)
// -------------------------------------------------------------

// Middleware guard: Must have valid session with 'admin' or 'super_admin' role
adminRouter.use('*', requireAuth, requireRole('admin', 'super_admin'));

/**
 * GET /api/v1/admin/me
 * Verifies admin session
 */
adminRouter.get('/me', (c) => {
  const user = c.get('user');
  return c.json({ success: true, user });
});

/**
 * GET /api/v1/admin/stats
 * Overview KPI metrics
 */
adminRouter.get('/stats', async (c) => {
  try {
    const stats = await getAdminStats();
    return c.json({ success: true, stats });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

// -------------------------------------------------------------
// EVENT MANAGEMENT (ADD, ALTER, DELETE, TOGGLE)
// -------------------------------------------------------------

adminRouter.get('/events', async (c) => {
  const events = await getEvents();
  return c.json({ success: true, events });
});

adminRouter.post('/events', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || !body.name.trim()) {
      return c.json({ success: false, error: { message: 'Event name is required.' } }, 400);
    }
    const created = await createEvent({
      name: body.name.trim(),
      round1DurationMinutes: body.round1DurationMinutes ? Number(body.round1DurationMinutes) : 60,
      round1TotalQuestions: body.round1TotalQuestions ? Number(body.round1TotalQuestions) : 100,
      round1IsActive: body.round1IsActive !== undefined ? Boolean(body.round1IsActive) : true,
      round2IsActive: body.round2IsActive !== undefined ? Boolean(body.round2IsActive) : true,
    });
    return c.json({ success: true, event: created, message: 'Event created successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.put('/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = await updateEvent(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: 'Event not found.' } }, 404);
    }
    return c.json({ success: true, event: updated, message: 'Event updated successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.delete('/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const ok = await deleteEvent(id);
    if (!ok) {
      return c.json({ success: false, error: { message: 'Event not found or could not be deleted.' } }, 404);
    }
    return c.json({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.patch('/events/:id/toggle-round', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { round, active } = body; // round: 'round1' | 'round2'

    const updateData: any = {};
    if (round === 'round1') updateData.round1IsActive = Boolean(active);
    if (round === 'round2') updateData.round2IsActive = Boolean(active);

    const updated = await updateEvent(id, updateData);
    if (!updated) {
      return c.json({ success: false, error: { message: 'Event not found.' } }, 404);
    }
    return c.json({
      success: true,
      event: updated,
      message: `${round === 'round1' ? 'Round 1' : 'Round 2'} is now ${Boolean(active) ? 'ACTIVE' : 'INACTIVE'}`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

/**
 * GET /api/v1/admin/rounds
 * Real-time status of each round's accessibility for competitors
 */
adminRouter.get('/rounds', async (c) => {
  const status = await getRoundsStatus();
  return c.json({ success: true, ...status });
});

/**
 * POST /api/v1/admin/rounds/toggle
 * Direct master switch to enable or disable any round for all competitors
 */
adminRouter.post('/rounds/toggle', async (c) => {
  try {
    const body = await c.req.json();
    const { round, active } = body;
    if (round !== 'round1' && round !== 'round2') {
      return c.json(
        { success: false, error: { message: 'Invalid round identifier. Use "round1" or "round2".' } },
        400
      );
    }
    const updated = await setRoundActive(round, Boolean(active));
    const roundName = round === 'round1' ? 'Round 1 Cultural Quiz' : 'Round 2 Logo Quiz';
    const statusText = Boolean(active) ? 'ENABLED (Competitors Can Attend)' : 'DISABLED (Locked For Competitors)';
    return c.json({
      success: true,
      round,
      active: Boolean(active),
      event: updated,
      message: `${roundName} is now ${statusText}`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

// -------------------------------------------------------------
// QUIZ & QUESTIONS MANAGEMENT (ROUND 1 & ROUND 2)
// -------------------------------------------------------------

// ROUND 1: CULTURAL / TECHNICAL MCQ
adminRouter.get('/questions/round-1', (c) => {
  const search = c.req.query('search');
  const category = c.req.query('category');
  const difficulty = c.req.query('difficulty');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;

  const result = getRound1Questions({ search, category, difficulty, page, limit });
  return c.json({ success: true, ...result });
});

adminRouter.get('/questions/round-1/categories', (c) => {
  const result = getRound1Questions({ limit: 1000 });
  return c.json({ success: true, categories: result.categories });
});

adminRouter.post('/questions/round-1', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.question_text || !body.option_a || !body.option_b) {
      return c.json({ success: false, error: { message: 'Question text and options A and B are required.' } }, 400);
    }

    const created = addRound1Question({
      question_text: body.question_text.trim(),
      category: body.category?.trim() || 'General Knowledge',
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c?.trim() || '',
      option_d: body.option_d?.trim() || '',
      correct_option: (body.correct_option || 'A').toUpperCase(),
      difficulty: body.difficulty || 'Medium',
      explanation: body.explanation || '',
    });

    return c.json({ success: true, question: created, message: 'Question added to Round 1 successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.put('/questions/round-1/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = updateRound1Question(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: 'Question not found.' } }, 404);
    }
    return c.json({ success: true, question: updated, message: 'Question updated successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.delete('/questions/round-1/:id', (c) => {
  const id = c.req.param('id');
  const ok = deleteRound1Question(id);
  if (!ok) {
    return c.json({ success: false, error: { message: 'Question not found or already deleted.' } }, 404);
  }
  return c.json({ success: true, message: 'Question deleted from Round 1 successfully' });
});

// ROUND 2: VISUAL LOGO QUIZ
adminRouter.get('/questions/round-2', (c) => {
  const search = c.req.query('search');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;

  const result = getRound2QuestionsList({ search, page, limit });
  return c.json({ success: true, ...result });
});

adminRouter.post('/questions/round-2', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.questionText || !body.correctBrandName) {
      return c.json({ success: false, error: { message: 'Question text and correct brand name are required.' } }, 400);
    }

    const created = addRound2Question({
      questionText: body.questionText.trim(),
      correctBrandName: body.correctBrandName.trim(),
      correctLogoId: body.correctLogoId || 'L001',
      options: body.options || [],
    });

    return c.json({ success: true, question: created, message: 'Question added to Round 2 successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.put('/questions/round-2/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = updateRound2Question(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: 'Round 2 question not found.' } }, 404);
    }
    return c.json({ success: true, question: updated, message: 'Round 2 question updated successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.delete('/questions/round-2/:id', (c) => {
  const id = c.req.param('id');
  const ok = deleteRound2Question(id);
  if (!ok) {
    return c.json({ success: false, error: { message: 'Question not found or already deleted.' } }, 404);
  }
  return c.json({ success: true, message: 'Question deleted from Round 2 successfully' });
});

// -------------------------------------------------------------
// MEMBERS & PARTICIPANTS MANAGEMENT
// -------------------------------------------------------------

adminRouter.get('/members', async (c) => {
  const search = c.req.query('search');
  const role = c.req.query('role');
  const qualified = c.req.query('qualified');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 25;

  const result = await getMembers({ search, role, qualified, page, limit });
  return c.json({ success: true, ...result });
});

adminRouter.post('/members', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.fullName || !body.email) {
      return c.json({ success: false, error: { message: 'Full name and email are required.' } }, 400);
    }

    const created = await addMember({
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role || 'participant',
      registrationNumber: body.registrationNumber?.trim(),
      collegeName: body.collegeName?.trim(),
      department: body.department?.trim(),
      yearOfStudy: body.yearOfStudy?.trim(),
      phone: body.phone?.trim(),
      teamName: body.teamName?.trim(),
      isQualifiedForRound2: Boolean(body.isQualifiedForRound2),
    });

    return c.json({ success: true, member: created, message: 'Member created successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.put('/members/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updated = await updateMember(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: 'Member not found.' } }, 404);
    }
    return c.json({ success: true, member: updated, message: 'Member updated successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.delete('/members/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const ok = await deleteMember(id);
    if (!ok) {
      return c.json({ success: false, error: { message: 'Member not found or could not be deleted.' } }, 404);
    }
    return c.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.post('/members/:id/reset-attempt', (c) => {
  const id = c.req.param('id');
  const ok = resetMemberAttempt(id);
  if (!ok) {
    return c.json({ success: false, error: { message: 'Member not found.' } }, 404);
  }
  return c.json({ success: true, message: 'Quiz attempt reset successfully. Participant can retake quiz.' });
});

// -------------------------------------------------------------
// ROUND 2 CUSTOM TIMER CONFIG (FLIP DURATION + OVERALL DURATION)
// -------------------------------------------------------------
adminRouter.get('/round2-config', (c) => {
  return c.json({ success: true, config: getRound2Config() });
});

adminRouter.put('/round2-config', async (c) => {
  try {
    const body = await c.req.json();
    const updated = updateRound2Config(body);
    return c.json({
      success: true,
      config: updated,
      message: `Round 2 config updated: Flip duration ${updated.cardFlipDurationSeconds}s, overall duration ${updated.overallDurationMinutes}m`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

adminRouter.post('/round2-config', async (c) => {
  try {
    const body = await c.req.json();
    const updated = updateRound2Config(body);
    return c.json({
      success: true,
      config: updated,
      message: `Round 2 config updated: Flip duration ${updated.cardFlipDurationSeconds}s, overall duration ${updated.overallDurationMinutes}m`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

// Helper for Round 2 scoring
const r2AnswersCorrectMap = new Map(
  rawRound2Questions.map((q) => [
    q.questionId,
    { logoId: q.correctLogoId, brandName: q.correctBrandName?.toLowerCase() },
  ])
);

export function computeRound2Score(mem: any): number {
  if (!mem || !mem.answers) return 0;
  let score = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    const correct = r2AnswersCorrectMap.get(qId);
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

// -------------------------------------------------------------
// TEAM MARKS MANAGEMENT & ADJUSTMENTS (ROUND 1, ROUND 2, OVERALL)
// -------------------------------------------------------------
adminRouter.get('/team-marks', (c) => {
  // Aggregate all teams across Round 1 attempts, Round 2 attempts, and manual adjustments
  const teamMap = new Map<
    string,
    {
      teamName: string;
      participantNames: string[];
      round1BaseScore: number;
      round1Adjustment: number;
      round1TotalScore: number;
      round2BaseScore: number;
      round2Adjustment: number;
      round2TotalScore: number;
      overallTotalScore: number;
    }
  >();

  const getOrCreateTeam = (teamName: string, participantName?: string) => {
    const clean = (teamName || 'Unknown Team').trim();
    if (!teamMap.has(clean)) {
      const adj = teamMarkAdjustments.get(clean) || { round1Adjustment: 0, round2Adjustment: 0 };
      teamMap.set(clean, {
        teamName: clean,
        participantNames: [],
        round1BaseScore: 0,
        round1Adjustment: adj.round1Adjustment || 0,
        round1TotalScore: adj.round1Adjustment || 0,
        round2BaseScore: 0,
        round2Adjustment: adj.round2Adjustment || 0,
        round2TotalScore: adj.round2Adjustment || 0,
        overallTotalScore: (adj.round1Adjustment || 0) + (adj.round2Adjustment || 0),
      });
    }
    const t = teamMap.get(clean)!;
    if (participantName && !t.participantNames.includes(participantName)) {
      t.participantNames.push(participantName);
    }
    return t;
  };

  for (const [, attempt] of memoryAttempts.entries()) {
    if (attempt.teamName) {
      const team = getOrCreateTeam(attempt.teamName, attempt.participantName);
      if (attempt.score > team.round1BaseScore) {
        team.round1BaseScore = attempt.score;
      }
    }
  }

  for (const [, attempt] of memoryRound2Attempts.entries()) {
    if (attempt.teamName) {
      const team = getOrCreateTeam(attempt.teamName);
      const r2Score = computeRound2Score(attempt);
      if (r2Score > team.round2BaseScore) {
        team.round2BaseScore = r2Score;
      }
    }
  }

  for (const [teamName, adj] of teamMarkAdjustments.entries()) {
    const team = getOrCreateTeam(teamName);
    team.round1Adjustment = adj.round1Adjustment;
    team.round2Adjustment = adj.round2Adjustment;
  }

  const teamsList = Array.from(teamMap.values()).map((t) => {
    const r1Total = Math.max(0, t.round1BaseScore + t.round1Adjustment);
    const r2Total = Math.max(0, t.round2BaseScore + t.round2Adjustment);
    return {
      ...t,
      round1TotalScore: r1Total,
      round2TotalScore: r2Total,
      overallTotalScore: r1Total + r2Total,
    };
  });

  teamsList.sort((a, b) => b.overallTotalScore - a.overallTotalScore);

  return c.json({ success: true, teams: teamsList });
});

adminRouter.post('/team-marks/adjust', async (c) => {
  try {
    const body = await c.req.json();
    const { teamName, round, delta } = body;
    if (!teamName || !teamName.trim()) {
      return c.json({ success: false, error: { message: 'Team name is required.' } }, 400);
    }
    if (round !== 'round1' && round !== 'round2') {
      return c.json({ success: false, error: { message: 'Round must be "round1" or "round2".' } }, 400);
    }
    const numDelta = Number(delta);
    if (isNaN(numDelta)) {
      return c.json({ success: false, error: { message: 'Valid marks delta is required.' } }, 400);
    }

    const updated = adjustTeamMarks(teamName, round, numDelta);
    return c.json({
      success: true,
      adjustment: updated,
      message: `Adjusted marks for ${teamName} in ${round === 'round1' ? 'Round 1' : 'Round 2'} by ${numDelta > 0 ? '+' : ''}${numDelta}`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});

// -------------------------------------------------------------
// ACTIVE PARTICIPANTS MANAGEMENT & REMOVAL
// -------------------------------------------------------------
adminRouter.get('/active-participants', (c) => {
  const activeList: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    teamName: string | null;
    round1Status: string;
    round1Score: number;
    round2Status: string;
    round2Answered: number;
    isDisqualified: boolean;
    lastActive: string;
  }> = [];

  for (const s of memorySessions.values()) {
    const r1 = memoryAttempts.get(s.userId);
    const r2 = memoryRound2Attempts.get(s.userId);
    const isDisq = Boolean(
      r1?.isDisqualified || r2?.isDisqualified
    );

    activeList.push({
      id: s.userId,
      userId: s.userId,
      fullName: s.fullName,
      email: s.email,
      teamName: s.teamName || r1?.teamName || r2?.teamName || null,
      round1Status: r1 ? (r1.isSubmitted ? (isDisq ? 'ELIMINATED' : 'SUBMITTED') : 'IN_PROGRESS') : 'NOT_STARTED',
      round1Score: r1?.score || 0,
      round2Status: r2 ? (r2.isSubmitted ? (isDisq ? 'ELIMINATED' : 'SUBMITTED') : 'IN_PROGRESS') : 'NOT_STARTED',
      round2Answered: r2?.answeredCount || 0,
      isDisqualified: isDisq,
      lastActive: new Date().toISOString(),
    });
  }

  return c.json({ success: true, participants: activeList });
});

adminRouter.post('/participants/:id/remove', (c) => {
  const id = c.req.param('id');
  const ok = removeActiveParticipant(id);
  if (!ok) {
    return c.json({ success: false, error: { message: 'Failed to remove active participant.' } }, 404);
  }
  return c.json({
    success: true,
    message: 'Active participant removed and eliminated from competition arena.',
  });
});

export default adminRouter;
