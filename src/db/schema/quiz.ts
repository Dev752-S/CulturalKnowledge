import { pgTable, text, timestamp, boolean, integer, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { participants } from './users';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default('SKP Cultural Fest 2026 - Skill Arena'),
  round1StartedAt: timestamp('round1_started_at', { withTimezone: true }),
  round1EndedAt: timestamp('round1_ended_at', { withTimezone: true }),
  round1DurationMinutes: integer('round1_duration_minutes').notNull().default(80),
  round1TotalQuestions: integer('round1_total_questions').notNull().default(100),
  round1IsActive: boolean('round1_is_active').notNull().default(false),
  round2IsActive: boolean('round2_is_active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionNumber: integer('question_number').notNull().unique(),
  questionText: text('question_text').notNull(),
  category: text('category').notNull().default('General Technical'),
  difficulty: text('difficulty').notNull().default('Medium'),
  positiveMarks: integer('positive_marks').notNull().default(1),
  negativeMarks: integer('negative_marks').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizOptions = pgTable('quiz_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  optionKey: text('option_key').notNull(), // 'A', 'B', 'C', 'D'
  optionText: text('option_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false), // SERVER-SIDE ONLY - NEVER SENT TO CLIENT
}, (table) => [
  index('quiz_options_question_id_idx').on(table.questionId),
]);

export const quizSecurityStateEnum = [
  'SECURE',
  'WARNING',
  'FLAGGED',
  'UNDER_REVIEW',
  'INTERVENTION_REQUIRED',
  'SUBMITTED',
] as const;
export type QuizSecurityState = (typeof quizSecurityStateEnum)[number];

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  isSubmitted: boolean('is_submitted').notNull().default(false),
  isAutoSubmitted: boolean('is_auto_submitted').notNull().default(false),
  isDisqualified: boolean('is_disqualified').notNull().default(false),
  disqualificationReason: text('disqualification_reason'),
  
  // Strict Server-Authoritative Security State
  securityState: text('security_state', { enum: quizSecurityStateEnum }).notNull().default('SECURE'),
  violationCount: integer('violation_count').notNull().default(0),

  // Authoritative server-side computed scores
  totalQuestions: integer('total_questions').notNull().default(100),
  answeredCount: integer('answered_count').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  wrongCount: integer('wrong_count').notNull().default(0),
  unansweredCount: integer('unanswered_count').notNull().default(100),
  score: integer('score').notNull().default(0),
  accuracyPercentage: text('accuracy_percentage').notNull().default('0.00'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('quiz_attempts_participant_idx').on(table.participantId),
  index('quiz_attempts_is_submitted_idx').on(table.isSubmitted),
]);

export const quizQuestionMappings = pgTable('quiz_question_mappings', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  sequenceOrder: integer('sequence_order').notNull(), // 1 to 100
}, (table) => [
  uniqueIndex('quiz_qm_attempt_seq_idx').on(table.attemptId, table.sequenceOrder),
  uniqueIndex('quiz_qm_attempt_question_idx').on(table.attemptId, table.questionId),
]);

export const quizAnswers = pgTable('quiz_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  selectedOptionId: uuid('selected_option_id').references(() => quizOptions.id, { onDelete: 'set null' }),
  isMarkedForReview: boolean('is_marked_for_review').notNull().default(false),
  savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('quiz_answers_attempt_question_idx').on(table.attemptId, table.questionId),
  index('quiz_answers_attempt_idx').on(table.attemptId),
]);

export const qualificationResults = pgTable('qualification_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  score: integer('score').notNull(),
  timeTakenSeconds: integer('time_taken_seconds').notNull(),
  isTop15: boolean('is_top_15').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('qualification_participant_idx').on(table.participantId),
  index('qualification_rank_idx').on(table.rank),
]);

export const leaderboardSnapshots = pgTable('leaderboard_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  snapshotData: text('snapshot_data').notNull(), // JSON stringified rankings
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
