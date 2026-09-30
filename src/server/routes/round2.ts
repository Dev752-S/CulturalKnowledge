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
import { isRoundActive, getRound2Config } from '../data/adminStore';

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
  selectedBrandName: string | null;
  isMarkedForReview: boolean;
  revealStartedAt: Date | null;
  revealEndedAt: Date | null;
  isCardLocked: boolean;
  savedAt: Date;
}

export interface MemRound2ShuffledOption {
  optionId: string;
  logoId: string;
  tileNumber: number;
  brandName: string;
  key: 'A' | 'B' | 'C' | 'D';
  svgUrl?: string;
  pngUrl?: string;
}

export interface MemRound2Attempt {
  id: string;
  participantId: string;
  teamName: string | null;
  startedAt: Date;
  submittedAt: Date | null;
  isSubmitted: boolean;
  isDisqualified?: boolean;
  disqualificationReason?: string;
  score?: number;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  questionOrder: string[]; // 50 Question IDs in sequence order (Position 1 to 50)
  shuffledOptions: Map<string, MemRound2ShuffledOption[]>; // questionId -> 4 shuffled options
  reveals: Map<string, { revealStartedAt: Date; isLocked: boolean }>; // questionId -> reveal state
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

// Helper: Generates attempt-stable randomized options without exposing correct answers
function generateShuffledOptionsForAttempt(participantId: string): Map<string, MemRound2ShuffledOption[]> {
  const map = new Map<string, MemRound2ShuffledOption[]>();
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  for (const q of rawRound2Questions) {
    const shuffled = shuffleArray(q.options, `${participantId}-${q.questionId}`);
    const assigned: MemRound2ShuffledOption[] = shuffled.map((opt, idx) => ({
      optionId: `opt_${q.questionNumber}_${letters[idx]}`,
      logoId: opt.logoId,
      tileNumber: opt.tileNumber,
      brandName: opt.brandName,
      key: letters[idx],
      svgUrl: opt.svgUrl,
      pngUrl: opt.pngUrl,
    }));
    map.set(q.questionId, assigned);
  }

  return map;
}

// Helper: Sanitize questions for client delivery in the EXACT order of the attempt question mapping (Position 1 to 50)
// Adapts the Flip-Card Game Model:
// - Single Logo Image on the card (logoSvgUrl, logoPngUrl, logoImageUrl)
// - FOUR TEXT Answer Options (A, B, C, D with text/brandName, NO logo images)
// - NEVER exposes correct answers, points, or scores
export function sanitizeRound2Questions(
  questionOrder: string[],
  shuffledMap: Map<string, MemRound2ShuffledOption[]>
) {
  const rawMap = new Map(rawRound2Questions.map((q) => [q.questionId, q]));

  return questionOrder.map((qId, idx) => {
    const q = rawMap.get(qId)!;
    const options = shuffledMap.get(qId) || [];
    const numStr = String(q.correctTileNumber).padStart(3, '0');
    const correctOpt = q.options.find((o: any) => o.logoId === q.correctLogoId) || q.options[0];

    return {
      questionId: q.questionId,
      questionNumber: idx + 1, // Position 1 of 50 ... Position 50 of 50
      questionText: q.questionText || 'Identify the logo shown on the card',
      category: correctOpt?.category || 'Brand Identity',
      difficulty: correctOpt?.difficulty || 'Medium',
      logoSvgUrl: `/logos/${numStr}.svg`,
      logoPngUrl: `/logos/${numStr}.png`,
      logoImageUrl: `/logos/${numStr}.svg`,
      options: options.map((opt) => ({
        optionId: opt.optionId,
        key: opt.key,
        text: opt.brandName,
        brandName: opt.brandName,
        logoId: opt.logoId,
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
    const revealsMap = new Map<string, { revealStartedAt: Date; isLocked: boolean }>();
    const now = new Date();

    for (const ans of dbAnswers) {
      const isLocked = ans.isCardLocked || (ans.revealStartedAt ? now.getTime() - ans.revealStartedAt.getTime() >= 5000 : false);
      answersMap.set(ans.questionId, {
        selectedLogoId: ans.selectedLogoId,
        selectedOptionId: ans.selectedOptionId || null,
        selectedBrandName: ans.selectedBrandName || null,
        isMarkedForReview: ans.isMarkedForReview,
        revealStartedAt: ans.revealStartedAt || null,
        revealEndedAt: ans.revealEndedAt || null,
        isCardLocked: isLocked,
        savedAt: ans.savedAt,
      });

      if (ans.revealStartedAt) {
        revealsMap.set(ans.questionId, {
          revealStartedAt: ans.revealStartedAt,
          isLocked,
        });
      }
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
      reveals: revealsMap,
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
// Initiates or resumes the untimed, unscored 50-question Round 2 Flip-Card Logo Identification Game
round2Router.post('/start', requireAuth, async (c) => {
  const user = c.get('user');

  // Verify Round 2 is in ENABLED state (Section: Admin Round Activation)
  const active = await isRoundActive('round2');
  if (!active && user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AppError(
      'ROUND_INACTIVE',
      'Round 2 Logo Quiz is currently disabled by the competition administrator. Only rounds in ENABLED state can be attended by competitors.',
      403
    );
  }

  const now = new Date();
  await ensureDbSeeded();

  let mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem) {
    // Generate stable question mapping: exactly 50 questions
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
      reveals: new Map(),
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
  const cfg = getRound2Config();
  const elapsedSec = Math.floor((now.getTime() - mem.startedAt.getTime()) / 1000);
  const remainingSeconds = Math.max(0, cfg.overallDurationMinutes * 60 - elapsedSec);

  return c.json({
    success: true,
    attempt: {
      id: mem.id,
      startedAt: mem.startedAt.toISOString(),
      isSubmitted: mem.isSubmitted,
      isDisqualified: Boolean(mem.isDisqualified),
      totalQuestions: 50,
      answeredCount: mem.answers.size,
      unansweredCount: 50 - mem.answers.size,
      remainingSeconds,
      durationMinutes: cfg.overallDurationMinutes,
      overallDurationMinutes: cfg.overallDurationMinutes,
      cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
    },
    durationMinutes: cfg.overallDurationMinutes,
    cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
    overallDurationMinutes: cfg.overallDurationMinutes,
    remainingSeconds,
    questions: sanitizedQuestions,
  });
});

// Also support GET /api/v1/round2/start for convenience
round2Router.get('/start', requireAuth, async (c) => {
  const user = c.get('user');
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    // Forward to post start
    const postRes = await fetch(new URL('/api/v1/round2/start', c.req.url).toString(), {
      method: 'POST',
      headers: { cookie: c.req.header('cookie') || '' },
    });
    return c.json(await postRes.json());
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
// Fetches active attempt state, saved answers, reveals, and review flags
round2Router.get('/attempt', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();
  const mem = await getOrRestoreAttempt(user.id, user.teamName);

  if (!mem) {
    return c.json({ success: true, attempt: null });
  }

  const answersObj: Record<
    string,
    {
      selectedOptionId: string | null;
      selectedBrandName: string | null;
      selectedLogoId: string | null;
      isMarkedForReview: boolean;
      isCardLocked: boolean;
      savedAt: string;
    }
  > = {};

  for (const [qId, ans] of mem.answers.entries()) {
    answersObj[qId] = {
      selectedOptionId: ans.selectedOptionId,
      selectedBrandName: ans.selectedBrandName,
      selectedLogoId: ans.selectedLogoId,
      isMarkedForReview: ans.isMarkedForReview,
      isCardLocked: ans.isCardLocked,
      savedAt: ans.savedAt.toISOString(),
    };
  }

  const revealsObj: Record<
    string,
    {
      isLocked: boolean;
      remainingMs: number;
      revealStartedAt: string;
    }
  > = {};

  const cfg = getRound2Config();
  const elapsedAttemptSec = Math.floor((now.getTime() - mem.startedAt.getTime()) / 1000);
  const remainingSeconds = Math.max(0, cfg.overallDurationMinutes * 60 - elapsedAttemptSec);
  const flipDurationMs = cfg.cardFlipDurationSeconds * 1000;

  for (const [qId, rev] of mem.reveals.entries()) {
    const elapsedMs = now.getTime() - rev.revealStartedAt.getTime();
    const isLocked = rev.isLocked || elapsedMs >= flipDurationMs;
    revealsObj[qId] = {
      isLocked,
      remainingMs: isLocked ? 0 : Math.max(0, flipDurationMs - elapsedMs),
      revealStartedAt: rev.revealStartedAt.toISOString(),
    };
  }

  return c.json({
    success: true,
    attempt: {
      id: mem.id,
      startedAt: mem.startedAt.toISOString(),
      isSubmitted: mem.isSubmitted,
      isDisqualified: Boolean(mem.isDisqualified),
      totalQuestions: 50,
      answeredCount: mem.answers.size,
      unansweredCount: 50 - mem.answers.size,
      remainingSeconds,
      overallDurationMinutes: cfg.overallDurationMinutes,
      cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
      answers: answersObj,
      reveals: revealsObj,
    },
    cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
    overallDurationMinutes: cfg.overallDurationMinutes,
    remainingSeconds,
  });
});

// 3. GET /api/v1/round2/questions
// Returns sanitized questions in stable attempt sequence order (Question 1 of 50 ... 50 of 50)
// WITHOUT exposing correct answers, points, or scores
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

// 4. POST /api/v1/round2/reveal/:questionId
// Starts or checks the server-authoritative reveal window (customizable duration)
// After reveal window expires: card is permanently locked! Cannot be revealed again!
round2Router.post('/reveal/:questionId', requireAuth, async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('questionId');
  const now = new Date();

  const mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
  }
  if (mem.isDisqualified) {
    throw new AppError('FORBIDDEN', 'Participant has been eliminated due to security anomaly. No second chance.', 403);
  }
  if (mem.isSubmitted) {
    throw new AppError('FORBIDDEN', 'Round 2 attempt has already been submitted', 403);
  }
  if (!mem.questionOrder.includes(questionId)) {
    throw new AppError('NOT_FOUND', 'Question does not belong to this Round 2 attempt', 404);
  }

  const flipDurationMs = getRound2Config().cardFlipDurationSeconds * 1000;

  const existingReveal = mem.reveals.get(questionId);
  if (existingReveal) {
    const elapsedMs = now.getTime() - existingReveal.revealStartedAt.getTime();
    if (elapsedMs >= flipDurationMs || existingReveal.isLocked) {
      existingReveal.isLocked = true;
      return c.json({
        success: true,
        questionId,
        isLocked: true,
        remainingMs: 0,
        revealStartedAt: existingReveal.revealStartedAt.toISOString(),
      });
    }

    return c.json({
      success: true,
      questionId,
      isLocked: false,
      remainingMs: Math.max(0, flipDurationMs - elapsedMs),
      revealStartedAt: existingReveal.revealStartedAt.toISOString(),
    });
  }

  // First-time reveal initiation
  const newReveal = {
    revealStartedAt: now,
    isLocked: false,
  };
  mem.reveals.set(questionId, newReveal);

  // Persist reveal start to database if configured
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb
        .insert(round2Answers)
        .values({
          id: `ans-${mem.id}-${questionId}`,
          attemptId: mem.id,
          questionId,
          revealStartedAt: now,
          isCardLocked: false,
          savedAt: now,
        })
        .onConflictDoUpdate({
          target: [round2Answers.attemptId, round2Answers.questionId],
          set: {
            revealStartedAt: now,
          },
        });
    } catch (err: any) {
      logger.warn('Failed to record reveal in DB:', { error: err.message });
    }
  }

  return c.json({
    success: true,
    questionId,
    isLocked: false,
    remainingMs: flipDurationMs,
    revealStartedAt: now.toISOString(),
  });
});

// 5. PUT & POST /api/v1/round2/answers/:questionId
// Autosaves an answer for the authenticated attempt.
// CRITICAL: Answering Question 1 or any question does NOT finish the quiz! The attempt remains active!
const round2AnswerSchema = z.object({
  selectedOptionId: z.string().nullable().optional(),
  selectedBrandName: z.string().nullable().optional(),
  selectedLogoId: z.string().nullable().optional(),
});

const handleSaveAnswer = async (c: any) => {
  const user = c.get('user');
  const questionId = c.req.param('questionId');
  const body = (c.req.valid ? c.req.valid('json') : null) || (await c.req.json().catch(() => ({})));
  const { selectedOptionId, selectedBrandName, selectedLogoId } = body || {};
  const now = new Date();

  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
  }

  if (mem.isDisqualified) {
    throw new AppError('FORBIDDEN', 'Participant has been eliminated due to security anomaly. No second chance.', 403);
  }

  if (mem.isSubmitted) {
    throw new AppError('FORBIDDEN', 'Round 2 attempt has already been submitted', 403);
  }

  if (!mem.questionOrder.includes(questionId)) {
    throw new AppError('NOT_FOUND', 'Question does not belong to this Round 2 attempt', 404);
  }

  // Validate that selected option is among the 4 options for this question
  const allowedOptions = mem.shuffledOptions.get(questionId) || [];
  let matchedOption = allowedOptions.find((o) => o.optionId === selectedOptionId);
  if (!matchedOption && selectedBrandName) {
    matchedOption = allowedOptions.find(
      (o) => o.brandName.toLowerCase() === selectedBrandName.toLowerCase()
    );
  }
  if (!matchedOption && selectedLogoId) {
    matchedOption = allowedOptions.find((o) => o.logoId === selectedLogoId);
  }

  if (selectedOptionId && !matchedOption) {
    throw new AppError('BAD_REQUEST', 'Invalid answer option selected for this question', 400);
  }

  const existingAns = mem.answers.get(questionId);
  // Double-answer / idempotency prevention:
  if (existingAns && existingAns.selectedOptionId) {
    // If the same option was already selected, return success (idempotent)
    if (matchedOption && existingAns.selectedOptionId === matchedOption.optionId) {
      return c.json({
        success: true,
        questionId,
        selectedOptionId: existingAns.selectedOptionId,
        selectedBrandName: existingAns.selectedBrandName,
        savedAt: existingAns.savedAt.toISOString(),
      });
    }
    // Finalized answers cannot be changed
    return c.json({
      success: true,
      alreadyAnswered: true,
      questionId,
      selectedOptionId: existingAns.selectedOptionId,
      selectedBrandName: existingAns.selectedBrandName,
      savedAt: existingAns.savedAt.toISOString(),
    });
  }

  const optId = matchedOption?.optionId || selectedOptionId || null;
  const brandName = matchedOption?.brandName || selectedBrandName || null;
  const logoId = matchedOption?.logoId || selectedLogoId || null;

  mem.answers.set(questionId, {
    selectedLogoId: logoId,
    selectedOptionId: optId,
    selectedBrandName: brandName,
    isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
    revealStartedAt: existingAns?.revealStartedAt || mem.reveals.get(questionId)?.revealStartedAt || null,
    revealEndedAt: now,
    isCardLocked: true,
    savedAt: now,
  });

  // Permanently lock card once answered
  const rev = mem.reveals.get(questionId);
  if (rev) {
    rev.isLocked = true;
  } else {
    mem.reveals.set(questionId, { revealStartedAt: now, isLocked: true });
  }

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
          selectedLogoId: logoId,
          selectedOptionId: optId,
          selectedBrandName: brandName,
          isCardLocked: true,
          isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
          savedAt: now,
        })
        .onConflictDoUpdate({
          target: [round2Answers.attemptId, round2Answers.questionId],
          set: {
            selectedLogoId: logoId,
            selectedOptionId: optId,
            selectedBrandName: brandName,
            isCardLocked: true,
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
    selectedOptionId: optId,
    selectedBrandName: brandName,
    savedAt: now.toISOString(),
  });
};

round2Router.put('/answers/:questionId', requireAuth, zValidator('json', round2AnswerSchema), handleSaveAnswer);
round2Router.post('/answers/:questionId', requireAuth, zValidator('json', round2AnswerSchema), handleSaveAnswer);

// 6. POST /api/v1/round2/review/:questionId
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
        selectedBrandName: null,
        isMarkedForReview,
        revealStartedAt: null,
        revealEndedAt: null,
        isCardLocked: false,
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
            selectedOptionId: existing?.selectedOptionId || null,
            selectedBrandName: existing?.selectedBrandName || null,
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

// 7. POST /api/v1/round2/security-events
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
    const isAnomaly = ['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'].includes(eventType);
    if (isAnomaly && mem) {
      mem.isDisqualified = true;
      mem.disqualificationReason = eventType;
      mem.isSubmitted = true;
      mem.submittedAt = now;
      logger.warn(`Participant ${user.email} ELIMINATED from Round 2 due to zero-tolerance anomaly: ${eventType}`);
    }

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
      eliminated: isAnomaly,
    });
  }
);

// 8. POST /api/v1/round2/submit
// Submits Round 2 attempt intentionally from the review modal or upon timer expiration.
round2Router.post('/submit', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();

  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError('NOT_FOUND', 'No active Round 2 attempt found', 404);
  }

  if (mem.isDisqualified) {
    throw new AppError('FORBIDDEN', 'Participant has been eliminated due to security anomaly. No second chance.', 403);
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
  let correctScore = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    if (ans.selectedOptionId || ans.selectedLogoId) {
      answeredCount++;
    }
    const rawQ = rawRound2Questions.find((q) => q.questionId === qId);
    if (rawQ) {
      if (
        (ans.selectedBrandName && ans.selectedBrandName.toLowerCase() === rawQ.correctBrandName.toLowerCase()) ||
        (ans.selectedLogoId && ans.selectedLogoId === rawQ.correctLogoId)
      ) {
        correctScore++;
      }
    }
  }
  const unansweredCount = 50 - answeredCount;

  mem.isSubmitted = true;
  mem.submittedAt = now;
  mem.answeredCount = answeredCount;
  mem.unansweredCount = unansweredCount;
  mem.score = correctScore;

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
    `Participant ${user.email} submitted Round 2 Flip-Card Logo Quiz (Answered: ${answeredCount}/50). UNTIMED & UNSCORED.`
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

// 9. GET /api/v1/round2/result
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
