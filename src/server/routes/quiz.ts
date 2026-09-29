import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../../db/client';
import { quizAttempts, quizAnswers, notifications } from '../../db/schema/quiz';
import { requireAuth, type SessionUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';
import rawQuestions from '../data/quiz_questions_100.json';
import { isRoundActive, getRoundsStatus } from '../data/adminStore';
import round2Router from './round2';

type AuthEnv = {
  Variables: {
    user: SessionUser;
  };
};

const quizRouter = new Hono<AuthEnv>();

// In-Memory Storage for Dev/Test and Offline fallback
export interface MemAnswer {
  selectedOption: string | null;
  isMarkedForReview: boolean;
  savedAt: Date;
}

export interface MemAttempt {
  id: string;
  participantId: string;
  participantName?: string;
  teamName: string | null;
  startedAt: Date;
  endsAt: Date;
  submittedAt: Date | null;
  isSubmitted: boolean;
  isAutoSubmitted: boolean;
  score: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracyPercentage: string;
  answers: Map<string, MemAnswer>;
  isDisqualified?: boolean;
  disqualificationReason?: string;
}

export interface NotificationItem {
  id: string;
  participantId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  score?: number;
  createdAt: string;
}

export const memoryAttempts = new Map<string, MemAttempt>();
export const memoryNotifications = new Map<string, NotificationItem[]>();
export const memorySecurityEvents: Array<{
  id: string;
  participantId: string;
  attemptId: string | null;
  eventType: string;
  metadata: string;
  createdAt: Date;
}> = [];

// Helper to sanitize questions: NEVER return correct answers or explanations to the client
function getSanitizedQuestions() {
  return rawQuestions.map((q) => ({
    id: q.question_id,
    number: q.source_question_number,
    category: q.category,
    text: q.question_text,
    options: [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ],
  }));
}

// GET /api/v1/quiz/rounds-status
// Public real-time round activation status for competitor clients
quizRouter.get('/rounds-status', async (c) => {
  const status = await getRoundsStatus();
  return c.json({ success: true, ...status });
});

// 1. POST /api/v1/quiz/round-1/start
// Initiates or resumes the 60-minute server-authoritative quiz attempt
quizRouter.post('/round-1/start', requireAuth, async (c) => {
  const user = c.get('user');

  // Verify Round 1 is in ENABLED state (Section: Admin Round Activation)
  const active = await isRoundActive('round1');
  if (!active && user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AppError(
      'ROUND_INACTIVE',
      'Round 1 Cultural Quiz is currently disabled by the competition administrator. Only rounds in ENABLED state can be attended by competitors.',
      403
    );
  }

  const now = new Date();
  const durationMs = 60 * 60 * 1000; // 60 minutes (3600 seconds)
  const activeDb = getDatabase();

  let attempt: {
    id: string;
    startedAt: Date;
    endsAt: Date;
    isSubmitted: boolean;
    isAutoSubmitted: boolean;
  };

  if (activeDb) {
    // Check if participant has an existing attempt
    const existing = await activeDb
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.participantId, user.id))
      .limit(1);

    if (existing[0]) {
      attempt = {
        id: existing[0].id,
        startedAt: existing[0].startedAt,
        endsAt: existing[0].endsAt,
        isSubmitted: existing[0].isSubmitted,
        isAutoSubmitted: existing[0].isAutoSubmitted,
      };
    } else {
      const endsAt = new Date(now.getTime() + durationMs);
      const inserted = await activeDb
        .insert(quizAttempts)
        .values({
          participantId: user.id,
          startedAt: now,
          endsAt,
          totalQuestions: 100,
          unansweredCount: 100,
        })
        .returning();

      attempt = {
        id: inserted[0].id,
        startedAt: inserted[0].startedAt,
        endsAt: inserted[0].endsAt,
        isSubmitted: inserted[0].isSubmitted,
        isAutoSubmitted: inserted[0].isAutoSubmitted,
      };
    }
  } else {
    // Memory fallback
    let mem = memoryAttempts.get(user.id);
    if (!mem) {
      const endsAt = new Date(now.getTime() + durationMs);
      mem = {
        id: `attempt-${user.id}-${Date.now()}`,
        participantId: user.id,
        participantName: user.fullName,
        teamName: user.teamName || null,
        startedAt: now,
        endsAt,
        submittedAt: null,
        isSubmitted: false,
        isAutoSubmitted: false,
        score: 0,
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        unansweredCount: 100,
        accuracyPercentage: '0.00',
        answers: new Map(),
      };
      memoryAttempts.set(user.id, mem);
    } else {
      mem.participantName = user.fullName;
      if (user.teamName) mem.teamName = user.teamName;
    }
    attempt = {
      id: mem.id,
      startedAt: mem.startedAt,
      endsAt: mem.endsAt,
      isSubmitted: mem.isSubmitted,
      isAutoSubmitted: mem.isAutoSubmitted,
    };
  }

  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.endsAt.getTime() - Date.now()) / 1000)
  );

  return c.json({
    success: true,
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      endsAt: attempt.endsAt.toISOString(),
      durationMinutes: 60,
      remainingSeconds,
      isSubmitted: attempt.isSubmitted,
      isAutoSubmitted: attempt.isAutoSubmitted,
      totalQuestions: 100,
    },
    questions: getSanitizedQuestions(),
  });
});

// 2. GET /api/v1/quiz/round-1/attempt
// Fetches active attempt state, remaining server time, and saved answers
quizRouter.get('/round-1/attempt', requireAuth, async (c) => {
  const user = c.get('user');
  const activeDb = getDatabase();

  if (activeDb) {
    const existing = await activeDb
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.participantId, user.id))
      .limit(1);

    if (!existing[0]) {
      return c.json({ success: true, attempt: null });
    }

    const currentAttempt = existing[0];
    const remainingSeconds = Math.max(
      0,
      Math.floor((currentAttempt.endsAt.getTime() - Date.now()) / 1000)
    );

    // Fetch saved answers
    const answersList = await activeDb
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, currentAttempt.id));

    const answersMap: Record<string, { selectedOption: string | null; isMarkedForReview: boolean }> = {};
    for (const ans of answersList) {
      answersMap[ans.questionId] = {
        selectedOption: null, // Will map to option key if needed
        isMarkedForReview: ans.isMarkedForReview,
      };
    }

    return c.json({
      success: true,
      attempt: {
        id: currentAttempt.id,
        startedAt: currentAttempt.startedAt.toISOString(),
        endsAt: currentAttempt.endsAt.toISOString(),
        remainingSeconds,
        isSubmitted: currentAttempt.isSubmitted,
        isAutoSubmitted: currentAttempt.isAutoSubmitted,
        totalQuestions: 100,
        answeredCount: currentAttempt.answeredCount,
        score: currentAttempt.isSubmitted ? currentAttempt.score : null,
        answers: answersMap,
      },
    });
  } else {
    // Memory store
    const mem = memoryAttempts.get(user.id);
    if (!mem) {
      return c.json({ success: true, attempt: null });
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((mem.endsAt.getTime() - Date.now()) / 1000)
    );

    const answersObj: Record<
      string,
      { selectedOption: string | null; isMarkedForReview: boolean; savedAt: string }
    > = {};
    for (const [qId, ans] of mem.answers.entries()) {
      answersObj[qId] = {
        selectedOption: ans.selectedOption,
        isMarkedForReview: ans.isMarkedForReview,
        savedAt: ans.savedAt.toISOString(),
      };
    }

    return c.json({
      success: true,
      attempt: {
        id: mem.id,
        startedAt: mem.startedAt.toISOString(),
        endsAt: mem.endsAt.toISOString(),
        remainingSeconds,
        isSubmitted: mem.isSubmitted,
        isAutoSubmitted: mem.isAutoSubmitted,
        totalQuestions: 100,
        answeredCount: mem.answers.size,
        score: mem.isSubmitted ? mem.score : null,
        answers: answersObj,
      },
    });
  }
});

// 3. GET /api/v1/quiz/round-1/questions
// Returns sanitized questions without answer keys
quizRouter.get('/round-1/questions', requireAuth, (c) => {
  return c.json({
    success: true,
    total: 100,
    questions: getSanitizedQuestions(),
  });
});

// 4. PUT /api/v1/quiz/round-1/answers/:questionId
// Autosaves an answer for the authenticated attempt
const answerSchema = z.object({
  selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
});

quizRouter.put(
  '/round-1/answers/:questionId',
  requireAuth,
  zValidator('json', answerSchema),
  async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('questionId');
    const { selectedOption } = c.req.valid('json');
    const now = new Date();

    // Verify questionId exists in valid questions
    const questionExists = rawQuestions.some((q) => q.question_id === questionId);
    if (!questionExists) {
      throw new AppError('NOT_FOUND', 'Question ID not found in quiz paper', 404);
    }

    const mem = memoryAttempts.get(user.id);
    if (mem) {
      if (mem.isDisqualified) {
        throw new AppError('FORBIDDEN', 'Participant has been eliminated due to security anomaly. No second chance.', 403);
      }
      if (mem.isSubmitted) {
        throw new AppError('FORBIDDEN', 'Quiz attempt has already been submitted', 403);
      }
      if (now > mem.endsAt) {
        throw new AppError('FORBIDDEN', 'Quiz time has expired', 403);
      }

      const existingAns = mem.answers.get(questionId);
      mem.answers.set(questionId, {
        selectedOption,
        isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
        savedAt: now,
      });

      return c.json({
        success: true,
        questionId,
        selectedOption,
        savedAt: now.toISOString(),
      });
    }

    return c.json({
      success: true,
      questionId,
      selectedOption,
      savedAt: now.toISOString(),
    });
  }
);

// 5. POST /api/v1/quiz/round-1/review/:questionId
// Toggles bookmark / marked for review
const reviewSchema = z.object({
  isMarkedForReview: z.boolean(),
});

quizRouter.post(
  '/round-1/review/:questionId',
  requireAuth,
  zValidator('json', reviewSchema),
  async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('questionId');
    const { isMarkedForReview } = c.req.valid('json');
    const now = new Date();

    const mem = memoryAttempts.get(user.id);
    if (mem) {
      if (mem.isSubmitted) {
        throw new AppError('FORBIDDEN', 'Quiz attempt has already been submitted', 403);
      }
      const existing = mem.answers.get(questionId);
      if (existing) {
        existing.isMarkedForReview = isMarkedForReview;
      } else {
        mem.answers.set(questionId, {
          selectedOption: null,
          isMarkedForReview,
          savedAt: now,
        });
      }
    }

    return c.json({
      success: true,
      questionId,
      isMarkedForReview,
    });
  }
);

// 6. POST /api/v1/quiz/round-1/security-events
// Records proctoring security signals (TAB_SWITCH, FULLSCREEN_EXIT, etc.)
const securityEventSchema = z.object({
  eventType: z.string(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

quizRouter.post(
  '/round-1/security-events',
  requireAuth,
  zValidator('json', securityEventSchema),
  async (c) => {
    const user = c.get('user');
    const { eventType, metadata } = c.req.valid('json');
    const now = new Date();

    const mem = memoryAttempts.get(user.id);
    const isAnomaly = ['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'].includes(eventType);
    if (isAnomaly && mem) {
      mem.isDisqualified = true;
      mem.disqualificationReason = eventType;
      mem.isSubmitted = true;
      mem.submittedAt = now;
      logger.warn(`Participant ${user.email} ELIMINATED due to zero-tolerance anomaly: ${eventType}`);
    }

    memorySecurityEvents.push({
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      participantId: user.id,
      attemptId: mem?.id || null,
      eventType,
      metadata: JSON.stringify(metadata),
      createdAt: now,
    });

    logger.warn(`Security Event [${eventType}] from participant ${user.email}`, metadata);

    return c.json({
      success: true,
      eventRecorded: true,
      eliminated: isAnomaly,
    });
  }
);

// 7. POST /api/v1/quiz/round-1/submit
// Atomically evaluates and scores the attempt on the server
quizRouter.post('/round-1/submit', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();

  const mem = memoryAttempts.get(user.id);
  if (!mem) {
    throw new AppError('NOT_FOUND', 'No active quiz attempt found', 404);
  }

  // Idempotency: If already submitted, return the existing result (Section 82)
  if (mem.isSubmitted) {
    return c.json({
      success: true,
      alreadySubmitted: true,
      result: {
        attemptId: mem.id,
        totalQuestions: 100,
        answeredCount: mem.answeredCount,
        unansweredCount: mem.unansweredCount,
        score: mem.score,
        accuracyPercentage: mem.accuracyPercentage,
        submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : now.toISOString(),
      },
    });
  }

  // Server-Authoritative Scoring (Section 45 & 85)
  // Compare each answer against rawQuestions answer key strictly on the server
  let correctCount = 0;
  let wrongCount = 0;
  let answeredCount = 0;

  for (const q of rawQuestions) {
    const userAns = mem.answers.get(q.question_id);
    if (userAns && userAns.selectedOption) {
      answeredCount++;
      if (userAns.selectedOption.toUpperCase() === q.correct_option.toUpperCase()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  }

  const unansweredCount = 100 - answeredCount;
  const score = correctCount; // 1 mark per correct answer, 0 for wrong
  const accuracy = answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(2) : '0.00';

  mem.isSubmitted = true;
  mem.submittedAt = now;
  mem.isAutoSubmitted = now > mem.endsAt;
  mem.score = score;
  mem.answeredCount = answeredCount;
  mem.correctCount = correctCount;
  mem.wrongCount = wrongCount;
  mem.unansweredCount = unansweredCount;
  mem.accuracyPercentage = accuracy;

  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb
        .update(quizAttempts)
        .set({
          isSubmitted: true,
          isAutoSubmitted: mem.isAutoSubmitted,
          submittedAt: now,
          score,
          answeredCount,
          correctCount,
          wrongCount,
          unansweredCount,
          accuracyPercentage: accuracy,
        })
        .where(eq(quizAttempts.participantId, user.id));
    } catch (err: any) {
      logger.warn('Failed to update Quiz attempt in DB:', { error: err.message });
    }
  }

  // Idempotent Completion Notification: exactly once per attempt
  const notifId = `notif-round1-${mem.id}`;
  let userNotifs = memoryNotifications.get(user.id);
  if (!userNotifs) {
    userNotifs = [];
    memoryNotifications.set(user.id, userNotifs);
  }

  if (!userNotifs.some((n) => n.id === notifId)) {
    const notifItem: NotificationItem = {
      id: notifId,
      participantId: user.id,
      title: 'Round 1 Completed',
      message:
        'Your Cultural Knowledge Quiz has been submitted successfully. Your marks are now available on the leaderboard.',
      type: 'ROUND_1_COMPLETION',
      score,
      isRead: false,
      createdAt: now.toISOString(),
    };
    userNotifs.push(notifItem);

    if (activeDb) {
      try {
        await activeDb
          .insert(notifications)
          .values({
            id: notifId,
            participantId: user.id,
            title: notifItem.title,
            message: notifItem.message,
            type: notifItem.type,
            isRead: false,
            createdAt: now,
          })
          .onConflictDoNothing();
      } catch (err: any) {
        logger.warn('Failed to persist notification to DB:', { error: err.message });
      }
    }
  }

  logger.info(
    `Participant ${user.email} submitted Quiz Round 1: Score ${score}/100 (Answered: ${answeredCount}, Correct: ${correctCount})`
  );

  return c.json({
    success: true,
    result: {
      attemptId: mem.id,
      totalQuestions: 100,
      answeredCount,
      unansweredCount,
      score,
      accuracyPercentage: accuracy,
      submittedAt: now.toISOString(),
    },
  });
});

// 8. GET /api/v1/quiz/round-1/result
// Returns the result of the submitted attempt
quizRouter.get('/round-1/result', requireAuth, (c) => {
  const user = c.get('user');
  const mem = memoryAttempts.get(user.id);

  if (!mem || !mem.isSubmitted) {
    throw new AppError('NOT_FOUND', 'No submitted quiz attempt found', 404);
  }

  return c.json({
    success: true,
    result: {
      attemptId: mem.id,
      totalQuestions: 100,
      answeredCount: mem.answeredCount,
      unansweredCount: mem.unansweredCount,
      score: mem.score,
      accuracyPercentage: mem.accuracyPercentage,
      submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : null,
      teamName: mem.teamName,
      participantName: user.fullName,
    },
  });
});

quizRouter.route('/round-2', round2Router);

export default quizRouter;
