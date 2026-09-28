import { pgTable, text, timestamp, boolean, integer, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { participants } from './users';

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
    isUsed: boolean('is_used').notNull().default(false), // A tile must never be scored twice
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
    actionType: text('action_type').notNull(), // SELECT_TEAM, SELECT_TILE, REVEAL, SCORE_CORRECT, SCORE_WRONG, UNDO
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
