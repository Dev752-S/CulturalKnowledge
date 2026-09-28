import { pgTable, text, timestamp, boolean, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const userRoleEnum = ['participant', 'proctor', 'host', 'admin', 'super_admin'] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: userRoleEnum }).notNull().default('participant'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_username_idx').on(table.username),
    uniqueIndex('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
);

export const participants = pgTable(
  'participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    registrationNumber: text('registration_number').notNull().unique(),
    collegeName: text('college_name').notNull(),
    phone: text('phone').notNull(),
    department: text('department').notNull(),
    yearOfStudy: text('year_of_study').notNull(),
    isQualifiedForRound2: boolean('is_qualified_for_round2').notNull().default(false),
    preflightCompleted: boolean('preflight_completed').notNull().default(false),
    preflightData: text('preflight_data'), // JSON string of client checks
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('participants_user_id_idx').on(table.userId),
    uniqueIndex('participants_reg_num_idx').on(table.registrationNumber),
  ]
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(), // Session token hash
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: userRoleEnum }).notNull(),
    deviceFingerprint: text('device_fingerprint').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    isActive: boolean('is_active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ]
);
