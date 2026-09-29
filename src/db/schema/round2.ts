import { pgTable, text, timestamp, boolean, integer, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { participants } from './users';

// --- Official Round 2 Schema (Visual Logo MCQ Quiz) ---

export const logos = pgTable(
  'logos',
  {
    id: text('id').primaryKey(), // 'L001', 'L002', etc.
    tileNumber: integer('tile_number').notNull().unique(), // 1 to 100
    answer: text('answer').notNull(), // e.g. 'Apple'
    category: text('category').notNull().default('General Brand'),
    difficulty: text('difficulty').notNull().default('Medium'),
    recommendedPoints: integer('recommended_points').notNull().default(10),
    pngPath: text('png_path').notNull(),
    svgPath: text('svg_path').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('logos_tile_number_idx').on(table.tileNumber),
  ]
);

export const round2Questions = pgTable(
  'round2_questions',
  {
    id: text('id').primaryKey(), // 'R2Q001' ... 'R2Q050'
    questionNumber: integer('question_number').notNull().unique(), // 1 to 50
    questionText: text('question_text').notNull(),
    correctLogoId: text('correct_logo_id').notNull().references(() => logos.id),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('round2_questions_number_idx').on(table.questionNumber),
  ]
);

export const round2Options = pgTable(
  'round2_options',
  {
    id: text('id').primaryKey(), // 'opt_1_A'
    questionId: text('question_id').notNull().references(() => round2Questions.id, { onDelete: 'cascade' }),
    logoId: text('logo_id').notNull().references(() => logos.id),
    optionOrder: integer('option_order').notNull(), // 1 to 4
  },
  (table) => [
    index('round2_options_question_idx').on(table.questionId),
  ]
);

export const round2Attempts = pgTable(
  'round2_attempts',
  {
    id: text('id').primaryKey(), // e.g. 'r2-attempt-<uuid>'
    participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    teamName: text('team_name'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    isSubmitted: boolean('is_submitted').notNull().default(false),
    totalQuestions: integer('total_questions').notNull().default(50),
    answeredCount: integer('answered_count').notNull().default(0),
    unansweredCount: integer('unanswered_count').notNull().default(50),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('round2_attempts_participant_idx').on(table.participantId),
    index('round2_attempts_is_submitted_idx').on(table.isSubmitted),
  ]
);

export const round2Answers = pgTable(
  'round2_answers',
  {
    id: text('id').primaryKey(),
    attemptId: text('attempt_id').notNull().references(() => round2Attempts.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => round2Questions.id, { onDelete: 'cascade' }),
    selectedLogoId: text('selected_logo_id'),
    isMarkedForReview: boolean('is_marked_for_review').notNull().default(false),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('round2_answers_attempt_q_idx').on(table.attemptId, table.questionId),
    index('round2_answers_attempt_idx').on(table.attemptId),
  ]
);

export const round2QuestionMappings = pgTable(
  'round2_question_mappings',
  {
    id: text('id').primaryKey(),
    attemptId: text('attempt_id').notNull().references(() => round2Attempts.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => round2Questions.id, { onDelete: 'cascade' }),
    sequenceOrder: integer('sequence_order').notNull(), // 1 to 50
  },
  (table) => [
    uniqueIndex('round2_qm_attempt_seq_idx').on(table.attemptId, table.sequenceOrder),
    uniqueIndex('round2_qm_attempt_question_idx').on(table.attemptId, table.questionId),
    index('round2_qm_attempt_idx').on(table.attemptId),
  ]
);

export const round2SecurityEvents = pgTable(
  'round2_security_events',
  {
    id: text('id').primaryKey(),
    participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id'),
    eventType: text('event_type').notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('round2_sec_events_participant_idx').on(table.participantId),
  ]
);

// --- Legacy Schema definitions (maintained for backward compatibility with migrations) ---

export const round2StateEnum = [
  'READY',
  'TEAM_SELECTED',
  'TILE_SELECTED',
  'LOGO_VISIBLE',
  'ANSWER_REVEALED',
  'SCORED_CORRECT',
  'SCORED_WRONG',
  'NEXT_TEAM',
  'COMPLETE',
] as const;
export type Round2State = (typeof round2StateEnum)[number];

export const round2Teams = pgTable(
  'round2_teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamNumber: integer('team_number').notNull().unique(),
    teamName: text('team_name').notNull(),
    participant1Id: uuid('participant1_id').references(() => participants.id, { onDelete: 'set null' }),
    participant2Id: uuid('participant2_id').references(() => participants.id, { onDelete: 'set null' }),
    score: integer('score').notNull().default(0),
    correctAnswers: integer('correct_answers').notNull().default(0),
    wrongAnswers: integer('wrong_answers').notNull().default(0),
    turnOrder: integer('turn_order').notNull(),
    isEliminated: boolean('is_eliminated').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('round2_teams_number_idx').on(table.teamNumber),
    index('round2_teams_score_idx').on(table.score),
  ]
);

export const round2Tiles = pgTable(
  'round2_tiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tileNumber: integer('tile_number').notNull().unique(), // 1 to 100
    brandName: text('brand_name').notNull(),
    category: text('category').notNull().default('General Brand'),
    logoImageUrl: text('logo_image_url').notNull(),
    difficulty: text('difficulty').notNull().default('Medium'),
    points: integer('points').notNull().default(10),
    
    // Status tracking
    isRevealed: boolean('is_revealed').notNull().default(false),
    isUsed: boolean('is_used').notNull().default(false),
    selectedByTeamId: uuid('selected_by_team_id').references(() => round2Teams.id, { onDelete: 'set null' }),
    scoredCorrectly: boolean('scored_correctly'),
    revealedAt: timestamp('revealed_at', { withTimezone: true }),
    scoredAt: timestamp('scored_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('round2_tiles_number_idx').on(table.tileNumber),
    index('round2_tiles_is_used_idx').on(table.isUsed),
  ]
);

export const round2GameState = pgTable('round2_game_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  currentState: text('current_state', { enum: round2StateEnum }).notNull().default('READY'),
  currentTeamId: uuid('current_team_id').references(() => round2Teams.id, { onDelete: 'set null' }),
  currentTileNumber: integer('current_tile_number').references(() => round2Tiles.tileNumber, { onDelete: 'set null' }),
  roundNumber: integer('round_number').notNull().default(1),
  isPaused: boolean('is_paused').notNull().default(false),
  stateVersion: integer('state_version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const round2Actions = pgTable(
  'round2_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').references(() => round2Teams.id, { onDelete: 'set null' }),
    tileNumber: integer('tile_number'),
    actionType: text('action_type').notNull(),
    pointsAwarded: integer('points_awarded').notNull().default(0),
    previousState: text('previous_state').notNull(),
    newState: text('new_state').notNull(),
    hostUserId: uuid('host_user_id'),
    canUndo: boolean('can_undo').notNull().default(true),
    isUndone: boolean('is_undone').notNull().default(false),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('round2_actions_timestamp_idx').on(table.timestamp),
    index('round2_actions_tile_idx').on(table.tileNumber),
  ]
);
