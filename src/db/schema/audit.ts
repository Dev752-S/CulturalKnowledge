import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id'), // User who performed the action
    actorRole: text('actor_role'),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    reason: text('reason'), // Required for high-risk actions
    beforeState: text('before_state'), // JSON snapshot
    afterState: text('after_state'), // JSON snapshot
    requestId: text('request_id'),
    severity: text('severity').notNull().default('INFO'), // INFO, WARNING, CRITICAL
    ipHash: text('ip_hash'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_actor_idx').on(table.actorId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_timestamp_idx').on(table.timestamp),
    index('audit_logs_target_idx').on(table.targetType, table.targetId),
  ]
);
