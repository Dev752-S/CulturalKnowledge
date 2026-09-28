import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { participants } from './users';
import { quizAttempts } from './quiz';

export const proctorEventTypeEnum = [
  'TAB_SWITCH_DETECTED',
  'TAB_HIDDEN',
  'TAB_VISIBLE',
  'WINDOW_BLUR',
  'WINDOW_FOCUS',
  'FULLSCREEN_EXIT',
  'FULLSCREEN_ENTER',
  'MULTI_SCREEN_SIGNAL',
  'CAMERA_PERMISSION_DENIED',
  'CAMERA_DISCONNECTED',
  'CAMERA_STREAM_INTERRUPTED',
  'FACE_NOT_DETECTED',
  'MULTIPLE_FACES',
  'NETWORK_DISCONNECTED',
  'NETWORK_RECONNECTED',
  'DUPLICATE_SESSION',
  'COPY_PASTE_ATTEMPT',
  'SUSPICIOUS_KEY_COMBO',
] as const;
export type ProctorEventType = (typeof proctorEventTypeEnum)[number];

export const proctorSeverityEnum = ['INFO', 'WARNING', 'HIGH', 'CRITICAL'] as const;
export type ProctorSeverity = (typeof proctorSeverityEnum)[number];

export const proctorEvents = pgTable(
  'proctor_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    attemptId: uuid('attempt_id').references(() => quizAttempts.id, { onDelete: 'set null' }),
    eventType: text('event_type', { enum: proctorEventTypeEnum }).notNull(),
    severity: text('severity', { enum: proctorSeverityEnum }).notNull().default('INFO'),
    metadata: text('metadata'), // JSON stringified details
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('proctor_events_participant_idx').on(table.participantId),
    index('proctor_events_attempt_idx').on(table.attemptId),
    index('proctor_events_event_type_idx').on(table.eventType),
    index('proctor_events_created_at_idx').on(table.createdAt),
  ]
);

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id'),
    action: text('action').notNull(),
    severity: text('severity', { enum: proctorSeverityEnum }).notNull().default('WARNING'),
    details: text('details'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('security_events_user_idx').on(table.userId),
    index('security_events_severity_idx').on(table.severity),
  ]
);
