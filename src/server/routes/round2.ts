import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../../db/client';
import {
  logos,
  round2Questions,
  round2Options,
  round2Attempts,
  round2Answers,
  round2QuestionMappings,
  round2SecurityEvents,
} from '../../db/schema/round2';
import { requireAuth, type SessionUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';
import rawRound2Questions from '../data/round2_questions_50.json';
import logoManifest from '../data/logo_manifest.json';

type AuthEnv = {
  Variables: {
    user: SessionUser;
  };
};

export const round2Router = new Hono<AuthEnv>();

// In-Memory Storage for Dev/Test and Offline fallback
export interface MemRound2Answer {
  selectedLogoId: string | null;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  savedAt: Date;
}

export interface MemRound2ShuffledOption {
  optionId: string;
  logoId: string;
  tileNumber: number;
  svgUrl: string;
  pngUrl: string;
  key: 'A' | 'B' | 'C' | 'D';
}

export interface MemRound2Attempt {
  id: string;
  participantId: string;
  teamName: string | null;
  startedAt: Date;
  submittedAt: Date | null;
  isSubmitted: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  questionOrder: string[]; // 50 Question IDs in sequence order (Position 1 to 50)
  shuffledOptions: Map<string, MemRound2ShuffledOption[]>; // questionId -> 4 shuffled options
  answers: Map<string, MemRound2Answer>; // questionId -> answer
}

export const memoryRound2Attempts = new Map<string, MemRound2Attempt>();
export const memoryRound2SecurityEvents: Array<{
  id: string;
  participantId: string;
  attemptId: string | null;
  eventType: string;
  metadata: string;
  createdAt: Date;
}> = [];

// Seed Database if connected and empty (Both 100 Logos and 50 Questions x 4 Options = 200 Options)
let dbSeeded = false;
export async function ensureDbSeeded() {
  if (dbSeeded) return;
  const activeDb = getDatabase();
  if (!activeDb) return;

  try {
    const existingLogos = await activeDb.select().from(logos).limit(1);
    if (existingLogos.length === 0) {
      logger.info('Seeding 100 logos into database...');
      for (const item of logoManifest) {
        await activeDb.insert(logos).values({
          id: item.logo_id,
          tileNumber: item.tile_number,
          answer: item.answer,
          category: item.category,
          difficulty: item.difficulty,
          recommendedPoints: item.recommended_points,
          pngPath: item.png_file,
          svgPath: item.svg_file,
          active: item.active,
        }).onConflictDoNothing();
      }
    }

    const existingQuestions = await activeDb.select().from(round2Questions).limit(1);
    if (existingQuestions.length === 0) {
      logger.info('Seeding 50 Round 2 questions & 200 options into database...');
      for (const q of rawRound2Questions) {
        await activeDb.insert(round2Questions).values({
          id: q.questionId,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          correctLogoId: q.correctLogoId,
          active: true,
        }).onConflictDoNothing();

        for (let idx = 0; idx < q.options.length; idx++) {
          const opt = q.options[idx];
          await activeDb.insert(round2Options).values({
            id: opt.optionId,
            questionId: q.questionId,
            logoId: opt.logoId,
            optionOrder: idx + 1,
          }).onConflictDoNothing();
        }
      }
    }
    dbSeeded = true;
  } catch (err: any) {
    logger.warn('Error during Round 2 DB seeding check:', { error: err.message });
  }
}

// Utility: Deterministic seeded shuffle for options
function shuffleArray<T>(array: T[], seedStr: string): T[] {
  const arr = [...array];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const random = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Generates attempt-stable randomized options without exposing correct answers or company names
function generateShuffledOptionsForAttempt(participantId: string): Map<string, MemRound2ShuffledOption[]> {
  const map = new Map<string, MemRound2ShuffledOption[]>();
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  for (const q of rawRound2Questions) {
    const shuffled = shuffleArray(q.options, `${participantId}-${q.questionId}`);
    const assigned: MemRound2ShuffledOption[] = shuffled.map((opt, idx) => ({
      optionId: `opt_${q.questionNumber}_${letters[idx]}`,
      logoId: opt.logoId,
      tileNumber: opt.tileNumber,
      svgUrl: opt.svgUrl,
      pngUrl: opt.pngUrl,
      key: letters[idx],
    }));
    map.set(q.questionId, assigned);
  }

  return map;
}

// Helper: Sanitize questions for client delivery in the EXACT order of the attempt question mapping (Position 1 to 50)
// NEVER exposes correct answers, points, or company names
function sanitizeRound2Questions(
  questionOrder: string[],
  shuffledMap: Map<string, MemRound2ShuffledOption[]>
) {
  const rawMap = new Map(rawRound2Questions.map((q) => [q.questionId, q]));

  return questionOrder.map((qId, idx) => {
    const q = rawMap.get(qId)!;
    const options = shuffledMap.get(qId) || [];
    return {
      questionId: q.questionId,
      questionNumber: idx + 1, // Position 1 of 50 ... Position 50 of 50
      questionText: q.questionText,
      options: options.map((opt) => ({
        optionId: opt.optionId,
        logoId: opt.logoId,
        key: opt.key,
        svgUrl: opt.svgUrl,
        pngUrl: opt.pngUrl,
      })),
    };
  });
}

// Helper: Syncs or restores attempt from DB into memory
async function getOrRestoreAttempt(userId: string, teamName?: string | null): Promise<MemRound2Attempt | null> {
  let mem = memoryRound2Attempts.get(userId);
  if (mem) return mem;

  const activeDb = getDatabase();
  if (!activeDb) return null;

  try {
    const existing = await activeDb
      .select()
      .from(round2Attempts)
      .where(eq(round2Attempts.participantId, userId))
      .limit(1);

    if (!existing[0]) return null;

    const currentAttempt = existing[0];

    // Load question mappings in order
    const mappings = await activeDb
      .select()
      .from(round2QuestionMappings)
      .where(eq(round2QuestionMappings.attemptId, currentAttempt.id))
      .orderBy(round2QuestionMappings.sequenceOrder);

    const questionOrder = mappings.length === 50
      ? mappings.map((m: any) => m.questionId)
      : rawRound2Questions.map((q) => q.questionId);

    // Load saved answers
    const dbAnswers = await activeDb
      .select()
      .from(round2Answers)
      .where(eq(round2Answers.attemptId, currentAttempt.id));

    const answersMap = new Map<string, MemRound2Answer>();
    for (const ans of dbAnswers) {
      answersMap.set(ans.questionId, {
        selectedLogoId: ans.selectedLogoId,
        selectedOptionId: null,
        isMarkedForReview: ans.isMarkedForReview,
        savedAt: ans.savedAt,
      });
    }

    const shuffledOptions = generateShuffledOptionsForAttempt(userId);
    mem = {
      id: currentAttempt.id,
      participantId: userId,
      teamName: currentAttempt.teamName || teamName || null,
      startedAt: currentAttempt.startedAt,
      submittedAt: currentAttempt.submittedAt,
      isSubmitted: currentAttempt.isSubmitted,
      totalQuestions: 50,
      answeredCount: answersMap.size,
      unansweredCount: 50 - answersMap.size,
      questionOrder,
      shuffledOptions,
      answers: answersMap,
    };
    memoryRound2Attempts.set(userId, mem);
    return mem;
  } catch (err: any) {
    logger.warn('Failed to restore Round 2 attempt from DB:', { error: err.message });
    return null;
  }
}

// 1. POST /api/v1/round2/start or /api/v1/quiz/round-2/start
// Initiates or resumes the untimed, unscored 50-question Round 2 Visual Logo Quiz
// Stable Question Mapping: Position 1..50 is persisted and stays identical across refreshes.
round2Router.post('/start', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();
  await ensureDbSeeded();

  let mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem) {
    // Generate stable question mapping: 50 questions
    const questionOrder = rawRound2Questions.map((q) => q.questionId);
    const shuffledOptions = generateShuffledOptionsForAttempt(user.id);
    const attemptId = `r2-attempt-${user.id}-${Date.now()}`;

    mem = {
      id: attemptId,
      participantId: user.id,
      teamName: user.teamName || null,
      startedAt: now,
      submittedAt: null,
      isSubmitted: false,
      totalQuestions: 50,
      answeredCount: 0,
      unansweredCount: 50,
      questionOrder,
      shuffledOptions,
      answers: new Map(),
    };
    memoryRound2Attempts.set(user.id, mem);

    // Persist attempt and mappings to Database
    const activeDb = getDatabase();
    if (activeDb) {
      try {
        await activeDb.insert(round2Attempts).values({
          id: mem.id,
          participantId: user.id,
          teamName: user.teamName || null,
          startedAt: now,
          totalQuestions: 50,
          answeredCount: 0,
          unansweredCount: 50,
        }).onConflictDoNothing();

        for (let idx = 0; idx < questionOrder.length; idx++) {
          await activeDb.insert(round2QuestionMappings).values({
            id: `r2qm-${mem.id}-${idx + 1}`,
            attemptId: mem.id,
            questionId: questionOrder[idx],
            sequenceOrder: idx + 1,
          }).onConflictDoNothing();
        }
      } catch (err: any) {
        logger.warn('Failed to persist Round 2 attempt to DB (using memory fallback):', { error: err.message });
      }
    }
  }

  const sanitizedQuestions = sanitizeRound2Questions(mem.questionOrder, mem.shuffledOptions);

  return c.json({
    success: true,
    attempt: {
      id: mem.id,
      startedAt: mem.startedAt.toISOString(),
      isSubmitted: mem.isSubmitted,
      totalQuestions: 50,
      answeredCount: mem.answers.size,
      unansweredCount: 50 - mem.answers.size,
    },
    questions: sanitizedQuestions,
  });
});

// 2. GET /api/v1/round2/attempt
// Fetches active attempt state, saved answers, and review flags
round2Router.get('/attempt', requireAuth, async (c) => {
  const user = c.get('user');
  const mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem) {
    return c.json({ success: true, attempt: null });
  }

  const answersObj: Record<
    string,
    { selectedLogoId: string | null; selectedOptionId: string | null; isMarkedForReview: boolean; savedAt: string }
  > = {};

  for (const [qId, ans] of mem.answers.entries()) {
    answersObj[qId] = {
      selectedLogoId: ans.selectedLogoId,
      selectedOptionId: ans.selectedOptionId,
      isMarkedForReview: ans.isMarkedForReview,
      savedAt: ans.savedAt.toISOString(),
    };
  }

  return c.json({
    success: true,
    attempt: {
      id: mem.id,
      startedAt: mem.startedAt.toISOString(),
      isSubmitted: mem.isSubmitted,
      totalQuestions: 50,
      answeredCount: mem.answers.size,
      unansweredCount: 50 - mem.answers.size,
      answers: answersObj,
    },
  });
});

// 3. GET /api/v1/round2/questions
// Returns sanitized questions in stable attempt sequence order (Question 1 of 50 ... 50 of 50)
// WITHOUT exposing correct answers, company names, or marks
round2Router.get('/questions', requireAuth, async (c) => {
  const user = c.get('user');
  let mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem) {
    const questionOrder = rawRound2Questions.map((q) => q.questionId);
    const shuffledOptions = generateShuffledOptionsForAttempt(user.id);
    return c.json({
      success: true,
      total: 50,
      questions: sanitizeRound2Questions(questionOrder, shuffledOptions),
    });
  }

  return c.json({
    success: true,
    total: 50,
    questions: sanitizeRound2Questions(mem.questionOrder, mem.shuffledOptions),
  });
});

// 4. PUT /api/v1/round2/answers/:questionId
// Autosaves an answer for the authenticated attempt.
// CRITICAL: Answering Question 1 or any question does NOT finish the quiz! The attempt remains active!
const round2AnswerSchema = z.object({
  selectedLogoId: z.string().nullable().optional(),
  selectedOptionId: z.string().nullable().optional(),
});

round2Router.put(
  '/answers/:questionId',
  requireAuth,
  zValidator('json', round2AnswerSchema),
  async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('questionId');
    const { selectedLogoId, selectedOptionId } = c.req.valid('json');
    const now = new Date();

    // Verify question exists in Round 2 question bank
    const questionExists = rawRound2Questions.some((q) => q.questionId === questionId);
    if (!questionExists) {
      throw new AppError('NOT_FOUND', 'Question ID not found in Round 2 question paper', 404);
    }

    let mem = await getOrRestoreAttempt(user.id, user.teamName);
    if (!mem) {
      throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
    }

    if (mem.isSubmitted) {
      throw new AppError('FORBIDDEN', 'Round 2 attempt has already been submitted', 403);
    }

    const existingAns = mem.answers.get(questionId);
    mem.answers.set(questionId, {
      selectedLogoId: selectedLogoId ?? null,
      selectedOptionId: selectedOptionId ?? null,
      isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
      savedAt: now,
    });

    mem.answeredCount = mem.answers.size;
    mem.unansweredCount = 50 - mem.answeredCount;

    // Persist to database if configured
    const activeDb = getDatabase();
    if (activeDb) {
      try {
        await activeDb
          .insert(round2Answers)
          .values({
            id: `ans-${mem.id}-${questionId}`,
            attemptId: mem.id,
            questionId,
            selectedLogoId: selectedLogoId ?? null,
            isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
            savedAt: now,
          })
          .onConflictDoUpdate({
            target: [round2Answers.attemptId, round2Answers.questionId],
            set: {
              selectedLogoId: selectedLogoId ?? null,
              savedAt: now,
            },
          });
      } catch (err: any) {
        logger.warn('Failed to persist Round 2 answer to DB:', { error: err.message });
      }
    }

    return c.json({
      success: true,
      questionId,
      selectedLogoId,
      savedAt: now.toISOString(),
    });
  }
);

// 5. POST /api/v1/round2/review/:questionId
// Toggles bookmark / marked for review
const round2ReviewSchema = z.object({
  isMarkedForReview: z.boolean(),
});

round2Router.post(
  '/review/:questionId',
  requireAuth,
  zValidator('json', round2ReviewSchema),
  async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('questionId');
    const { isMarkedForReview } = c.req.valid('json');
    const now = new Date();

    let mem = await getOrRestoreAttempt(user.id, user.teamName);
    if (!mem) {
      throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
    }

    if (mem.isSubmitted) {
      throw new AppError('FORBIDDEN', 'Round 2 attempt has already been submitted', 403);
    }

    const existing = mem.answers.get(questionId);
    if (existing) {
      existing.isMarkedForReview = isMarkedForReview;
    } else {
      mem.answers.set(questionId, {
        selectedLogoId: null,
        selectedOptionId: null,
        isMarkedForReview,
        savedAt: now,
      });
    }

    const activeDb = getDatabase();
    if (activeDb) {
      try {
        await activeDb
          .insert(round2Answers)
          .values({
            id: `ans-${mem.id}-${questionId}`,
            attemptId: mem.id,
            questionId,
            selectedLogoId: existing?.selectedLogoId || null,
            isMarkedForReview,
            savedAt: now,
          })
          .onConflictDoUpdate({
            target: [round2Answers.attemptId, round2Answers.questionId],
            set: {
              isMarkedForReview,
              savedAt: now,
            },
          });
      } catch (err: any) {
        logger.warn('Failed to persist review status to DB:', { error: err.message });
      }
    }

    return c.json({
      success: true,
      questionId,
      isMarkedForReview,
    });
  }
);

// 6. POST /api/v1/round2/security-events
// Records proctoring security signals (TAB_SWITCH, FULLSCREEN_EXIT, etc.)
const round2SecurityEventSchema = z.object({
  eventType: z.string(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

round2Router.post(
  '/security-events',
  requireAuth,
  zValidator('json', round2SecurityEventSchema),
  async (c) => {
    const user = c.get('user');
    const { eventType, metadata } = c.req.valid('json');
    const now = new Date();

    const mem = await getOrRestoreAttempt(user.id, user.teamName);
    const eventId = `sec-r2-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    memoryRound2SecurityEvents.push({
      id: eventId,
      participantId: user.id,
      attemptId: mem?.id || null,
      eventType,
      metadata: JSON.stringify(metadata),
      createdAt: now,
    });

    const activeDb = getDatabase();
    if (activeDb) {
      try {
        await activeDb.insert(round2SecurityEvents).values({
          id: eventId,
          participantId: user.id,
          attemptId: mem?.id || null,
          eventType,
          metadata: JSON.stringify(metadata),
          createdAt: now,
        });
      } catch (err: any) {
        logger.warn('Failed to persist Round 2 security event to DB:', { error: err.message });
      }
    }

    logger.warn(`Round 2 Security Event [${eventType}] from participant ${user.email}`, metadata);

    return c.json({
      success: true,
      eventRecorded: true,
    });
  }
);

// 7. POST /api/v1/round2/submit
// Submits Round 2 attempt intentionally from the review modal.
// CRITICAL: Round 2 has NO points, NO score calculation, and NO leaderboard score mutation.
round2Router.post('/submit', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();

  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
  }

  // Idempotency: If already submitted, return the existing completion state
  if (mem.isSubmitted) {
    return c.json({
      success: true,
      alreadySubmitted: true,
      result: {
        attemptId: mem.id,
        totalQuestions: 50,
        answeredCount: mem.answeredCount,
        unansweredCount: mem.unansweredCount,
        submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : now.toISOString(),
      },
    });
  }

  // Count answered questions
  let answeredCount = 0;
  for (const [, ans] of mem.answers.entries()) {
    if (ans.selectedLogoId) {
      answeredCount++;
    }
  }
  const unansweredCount = 50 - answeredCount;

  mem.isSubmitted = true;
  mem.submittedAt = now;
  mem.answeredCount = answeredCount;
  mem.unansweredCount = unansweredCount;

  // Persist to database if configured
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb
        .update(round2Attempts)
        .set({
          isSubmitted: true,
          submittedAt: now,
          answeredCount,
          unansweredCount,
        })
        .where(eq(round2Attempts.id, mem.id));
    } catch (err: any) {
      logger.warn('Failed to update submitted Round 2 attempt in DB:', { error: err.message });
    }
  }

  logger.info(
    `Participant ${user.email} submitted Round 2 Logo Quiz (Answered: ${answeredCount}/50). UNTIMED & UNSCORED.`
  );

  return c.json({
    success: true,
    result: {
      attemptId: mem.id,
      totalQuestions: 50,
      answeredCount,
      unansweredCount,
      submittedAt: now.toISOString(),
    },
  });
});

// 8. GET /api/v1/round2/result
// Returns the completion state for Round 2 WITHOUT points, marks, or score
round2Router.get('/result', requireAuth, async (c) => {
  const user = c.get('user');
  const mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem || !mem.isSubmitted) {
    throw new AppError('NOT_FOUND', 'No submitted Round 2 attempt found', 404);
  }

  return c.json({
    success: true,
    result: {
      attemptId: mem.id,
      totalQuestions: 50,
      answeredCount: mem.answeredCount,
      unansweredCount: mem.unansweredCount,
      submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : null,
      teamName: mem.teamName,
      participantName: user.fullName,
    },
  });
});

export default round2Router;
