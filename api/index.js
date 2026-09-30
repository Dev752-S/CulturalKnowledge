var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/api.ts
import { getRequestListener } from "@hono/node-server";

// src/server/app.ts
import { Hono as Hono12 } from "hono";
import { cors } from "hono/cors";

// src/server/env.ts
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
var fallbackSessionSecret = "skp_skill_arena_default_session_secret_2026";
var fallbackCsrfSecret = "skp_skill_arena_default_csrf_secret_2026";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  SESSION_SECRET: z.string().optional().transform((val) => val && val.trim().length >= 16 ? val.trim() : fallbackSessionSecret),
  CSRF_SECRET: z.string().optional().transform((val) => val && val.trim().length >= 16 ? val.trim() : fallbackCsrfSecret),
  STORAGE_ENDPOINT: z.string().optional().default(""),
  STORAGE_ACCESS_KEY: z.string().optional().default(""),
  STORAGE_SECRET_KEY: z.string().optional().default(""),
  STORAGE_BUCKET: z.string().optional().default("skill-arena-assets"),
  CORS_ORIGIN: z.string().optional().default("http://localhost:3000")
});
var parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.error("\u274C Invalid environment variables, using fallback defaults:", parsedEnv.error.format());
}
var env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});

// src/utils/logger.ts
var Logger = class {
  format(level, message, context) {
    const timestamp6 = (/* @__PURE__ */ new Date()).toISOString();
    return JSON.stringify({
      timestamp: timestamp6,
      level: level.toUpperCase(),
      message,
      ...context || {}
    });
  }
  info(message, context) {
    console.log(this.format("info", message, context));
  }
  warn(message, context) {
    console.warn(this.format("warn", message, context));
  }
  error(message, context) {
    console.error(this.format("error", message, context));
  }
  debug(message, context) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, context));
    }
  }
};
var logger = new Logger();

// src/server/middleware/errorHandler.ts
var AppError = class extends Error {
  code;
  statusCode;
  details;
  constructor(code, message, statusCode = 400, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
};
var errorHandler = (err, c) => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, {
      statusCode: err.statusCode,
      details: err.details
    });
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...err.details ? { details: err.details } : {}
        }
      },
      err.statusCode
    );
  }
  logger.error("Unhandled server error:", {
    message: err.message,
    stack: err.stack
  });
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later."
      }
    },
    500
  );
};

// src/server/middleware/security.ts
var securityHeaders = async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=()"
  );
  await next();
};
var requestLogger = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  await next();
  const duration = Date.now() - start;
  const status = c.res.status;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[${(/* @__PURE__ */ new Date()).toISOString()}] ${method} ${path} -> ${status} (${duration}ms)`
    );
  }
};

// src/server/routes/health.ts
import { Hono } from "hono";

// src/db/client.ts
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";

// src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  events: () => events,
  leaderboardSnapshots: () => leaderboardSnapshots,
  logos: () => logos,
  notifications: () => notifications,
  participants: () => participants,
  proctorEventTypeEnum: () => proctorEventTypeEnum,
  proctorEvents: () => proctorEvents,
  proctorSeverityEnum: () => proctorSeverityEnum,
  qualificationResults: () => qualificationResults,
  quizAnswers: () => quizAnswers,
  quizAttempts: () => quizAttempts,
  quizOptions: () => quizOptions,
  quizQuestionMappings: () => quizQuestionMappings,
  quizQuestions: () => quizQuestions,
  quizSecurityStateEnum: () => quizSecurityStateEnum,
  round2Actions: () => round2Actions,
  round2Answers: () => round2Answers,
  round2Attempts: () => round2Attempts,
  round2GameState: () => round2GameState,
  round2Options: () => round2Options,
  round2QuestionMappings: () => round2QuestionMappings,
  round2Questions: () => round2Questions,
  round2SecurityEvents: () => round2SecurityEvents,
  round2StateEnum: () => round2StateEnum,
  round2Teams: () => round2Teams,
  round2Tiles: () => round2Tiles,
  securityEvents: () => securityEvents,
  sessions: () => sessions,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});

// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
var userRoleEnum = ["participant", "proctor", "host", "admin", "super_admin"];
var users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoleEnum }).notNull().default("participant"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role)
  ]
);
var participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    registrationNumber: text("registration_number").notNull().unique(),
    collegeName: text("college_name").notNull(),
    phone: text("phone").notNull(),
    department: text("department").notNull(),
    yearOfStudy: text("year_of_study").notNull(),
    teamName: text("team_name"),
    isQualifiedForRound2: boolean("is_qualified_for_round2").notNull().default(false),
    preflightCompleted: boolean("preflight_completed").notNull().default(false),
    preflightData: text("preflight_data"),
    // JSON string of client checks
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("participants_user_id_idx").on(table.userId),
    uniqueIndex("participants_reg_num_idx").on(table.registrationNumber)
  ]
);
var sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    // Session token hash
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: userRoleEnum }).notNull(),
    deviceFingerprint: text("device_fingerprint").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt)
  ]
);

// src/db/schema/quiz.ts
import { pgTable as pgTable2, text as text2, timestamp as timestamp2, boolean as boolean2, integer, uuid as uuid2, index as index2, uniqueIndex as uniqueIndex2 } from "drizzle-orm/pg-core";
var events = pgTable2("events", {
  id: uuid2("id").defaultRandom().primaryKey(),
  name: text2("name").notNull().default("SKP Cultural Fest 2026 - Skill Arena"),
  round1StartedAt: timestamp2("round1_started_at", { withTimezone: true }),
  round1EndedAt: timestamp2("round1_ended_at", { withTimezone: true }),
  round1DurationMinutes: integer("round1_duration_minutes").notNull().default(60),
  round1TotalQuestions: integer("round1_total_questions").notNull().default(100),
  round1IsActive: boolean2("round1_is_active").notNull().default(false),
  round2IsActive: boolean2("round2_is_active").notNull().default(false),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp2("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var quizQuestions = pgTable2("quiz_questions", {
  id: uuid2("id").defaultRandom().primaryKey(),
  questionNumber: integer("question_number").notNull().unique(),
  questionText: text2("question_text").notNull(),
  category: text2("category").notNull().default("General Technical"),
  difficulty: text2("difficulty").notNull().default("Medium"),
  positiveMarks: integer("positive_marks").notNull().default(1),
  negativeMarks: integer("negative_marks").notNull().default(0),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
});
var quizOptions = pgTable2("quiz_options", {
  id: uuid2("id").defaultRandom().primaryKey(),
  questionId: uuid2("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  optionKey: text2("option_key").notNull(),
  // 'A', 'B', 'C', 'D'
  optionText: text2("option_text").notNull(),
  isCorrect: boolean2("is_correct").notNull().default(false)
  // SERVER-SIDE ONLY - NEVER SENT TO CLIENT
}, (table) => [
  index2("quiz_options_question_id_idx").on(table.questionId)
]);
var quizSecurityStateEnum = [
  "SECURE",
  "WARNING",
  "FLAGGED",
  "UNDER_REVIEW",
  "INTERVENTION_REQUIRED",
  "SUBMITTED"
];
var quizAttempts = pgTable2("quiz_attempts", {
  id: uuid2("id").defaultRandom().primaryKey(),
  participantId: uuid2("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  startedAt: timestamp2("started_at", { withTimezone: true }).notNull(),
  endsAt: timestamp2("ends_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp2("submitted_at", { withTimezone: true }),
  isSubmitted: boolean2("is_submitted").notNull().default(false),
  isAutoSubmitted: boolean2("is_auto_submitted").notNull().default(false),
  isDisqualified: boolean2("is_disqualified").notNull().default(false),
  disqualificationReason: text2("disqualification_reason"),
  // Strict Server-Authoritative Security State
  securityState: text2("security_state", { enum: quizSecurityStateEnum }).notNull().default("SECURE"),
  violationCount: integer("violation_count").notNull().default(0),
  // Authoritative server-side computed scores
  totalQuestions: integer("total_questions").notNull().default(100),
  answeredCount: integer("answered_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  unansweredCount: integer("unanswered_count").notNull().default(100),
  score: integer("score").notNull().default(0),
  accuracyPercentage: text2("accuracy_percentage").notNull().default("0.00"),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp2("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex2("quiz_attempts_participant_idx").on(table.participantId),
  index2("quiz_attempts_is_submitted_idx").on(table.isSubmitted)
]);
var quizQuestionMappings = pgTable2("quiz_question_mappings", {
  id: uuid2("id").defaultRandom().primaryKey(),
  attemptId: uuid2("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: uuid2("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  sequenceOrder: integer("sequence_order").notNull()
  // 1 to 100
}, (table) => [
  uniqueIndex2("quiz_qm_attempt_seq_idx").on(table.attemptId, table.sequenceOrder),
  uniqueIndex2("quiz_qm_attempt_question_idx").on(table.attemptId, table.questionId)
]);
var quizAnswers = pgTable2("quiz_answers", {
  id: uuid2("id").defaultRandom().primaryKey(),
  attemptId: uuid2("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: uuid2("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  selectedOptionId: uuid2("selected_option_id").references(() => quizOptions.id, { onDelete: "set null" }),
  isMarkedForReview: boolean2("is_marked_for_review").notNull().default(false),
  savedAt: timestamp2("saved_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex2("quiz_answers_attempt_question_idx").on(table.attemptId, table.questionId),
  index2("quiz_answers_attempt_idx").on(table.attemptId)
]);
var qualificationResults = pgTable2("qualification_results", {
  id: uuid2("id").defaultRandom().primaryKey(),
  participantId: uuid2("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  score: integer("score").notNull(),
  timeTakenSeconds: integer("time_taken_seconds").notNull(),
  isTop15: boolean2("is_top_15").notNull().default(false),
  publishedAt: timestamp2("published_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex2("qualification_participant_idx").on(table.participantId),
  index2("qualification_rank_idx").on(table.rank)
]);
var leaderboardSnapshots = pgTable2("leaderboard_snapshots", {
  id: uuid2("id").defaultRandom().primaryKey(),
  snapshotData: text2("snapshot_data").notNull(),
  // JSON stringified rankings
  version: integer("version").notNull().default(1),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
});
var notifications = pgTable2("notifications", {
  id: text2("id").primaryKey(),
  participantId: uuid2("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  title: text2("title").notNull(),
  message: text2("message").notNull(),
  type: text2("type").notNull().default("INFO"),
  isRead: boolean2("is_read").notNull().default(false),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index2("notifications_participant_idx").on(table.participantId)
]);

// src/db/schema/proctor.ts
import { pgTable as pgTable3, text as text3, timestamp as timestamp3, uuid as uuid3, index as index3 } from "drizzle-orm/pg-core";
var proctorEventTypeEnum = [
  "TAB_SWITCH_DETECTED",
  "TAB_HIDDEN",
  "TAB_VISIBLE",
  "WINDOW_BLUR",
  "WINDOW_FOCUS",
  "FULLSCREEN_EXIT",
  "FULLSCREEN_ENTER",
  "MULTI_SCREEN_SIGNAL",
  "CAMERA_PERMISSION_DENIED",
  "CAMERA_DISCONNECTED",
  "CAMERA_STREAM_INTERRUPTED",
  "FACE_NOT_DETECTED",
  "MULTIPLE_FACES",
  "NETWORK_DISCONNECTED",
  "NETWORK_RECONNECTED",
  "DUPLICATE_SESSION",
  "COPY_PASTE_ATTEMPT",
  "SUSPICIOUS_KEY_COMBO"
];
var proctorSeverityEnum = ["INFO", "WARNING", "HIGH", "CRITICAL"];
var proctorEvents = pgTable3(
  "proctor_events",
  {
    id: uuid3("id").defaultRandom().primaryKey(),
    participantId: uuid3("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
    attemptId: uuid3("attempt_id").references(() => quizAttempts.id, { onDelete: "set null" }),
    eventType: text3("event_type", { enum: proctorEventTypeEnum }).notNull(),
    severity: text3("severity", { enum: proctorSeverityEnum }).notNull().default("INFO"),
    metadata: text3("metadata"),
    // JSON stringified details
    ipAddress: text3("ip_address"),
    userAgent: text3("user_agent"),
    createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index3("proctor_events_participant_idx").on(table.participantId),
    index3("proctor_events_attempt_idx").on(table.attemptId),
    index3("proctor_events_event_type_idx").on(table.eventType),
    index3("proctor_events_created_at_idx").on(table.createdAt)
  ]
);
var securityEvents = pgTable3(
  "security_events",
  {
    id: uuid3("id").defaultRandom().primaryKey(),
    userId: uuid3("user_id"),
    action: text3("action").notNull(),
    severity: text3("severity", { enum: proctorSeverityEnum }).notNull().default("WARNING"),
    details: text3("details"),
    ipAddress: text3("ip_address"),
    userAgent: text3("user_agent"),
    createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index3("security_events_user_idx").on(table.userId),
    index3("security_events_severity_idx").on(table.severity)
  ]
);

// src/db/schema/round2.ts
import { pgTable as pgTable4, text as text4, timestamp as timestamp4, boolean as boolean3, integer as integer2, uuid as uuid4, index as index4, uniqueIndex as uniqueIndex3 } from "drizzle-orm/pg-core";
var logos = pgTable4(
  "logos",
  {
    id: text4("id").primaryKey(),
    // 'L001', 'L002', etc.
    tileNumber: integer2("tile_number").notNull().unique(),
    // 1 to 100
    answer: text4("answer").notNull(),
    // e.g. 'Apple'
    category: text4("category").notNull().default("General Brand"),
    difficulty: text4("difficulty").notNull().default("Medium"),
    recommendedPoints: integer2("recommended_points").notNull().default(10),
    pngPath: text4("png_path").notNull(),
    svgPath: text4("svg_path").notNull(),
    active: boolean3("active").notNull().default(true),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex3("logos_tile_number_idx").on(table.tileNumber)
  ]
);
var round2Questions = pgTable4(
  "round2_questions",
  {
    id: text4("id").primaryKey(),
    // 'R2Q001' ... 'R2Q050'
    questionNumber: integer2("question_number").notNull().unique(),
    // 1 to 50
    questionText: text4("question_text").notNull(),
    correctLogoId: text4("correct_logo_id").notNull().references(() => logos.id),
    active: boolean3("active").notNull().default(true),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex3("round2_questions_number_idx").on(table.questionNumber)
  ]
);
var round2Options = pgTable4(
  "round2_options",
  {
    id: text4("id").primaryKey(),
    // 'opt_1_A'
    questionId: text4("question_id").notNull().references(() => round2Questions.id, { onDelete: "cascade" }),
    logoId: text4("logo_id").notNull().references(() => logos.id),
    optionOrder: integer2("option_order").notNull()
    // 1 to 4
  },
  (table) => [
    index4("round2_options_question_idx").on(table.questionId)
  ]
);
var round2Attempts = pgTable4(
  "round2_attempts",
  {
    id: text4("id").primaryKey(),
    // e.g. 'r2-attempt-<uuid>'
    participantId: uuid4("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
    teamName: text4("team_name"),
    startedAt: timestamp4("started_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp4("submitted_at", { withTimezone: true }),
    isSubmitted: boolean3("is_submitted").notNull().default(false),
    totalQuestions: integer2("total_questions").notNull().default(50),
    answeredCount: integer2("answered_count").notNull().default(0),
    unansweredCount: integer2("unanswered_count").notNull().default(50),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex3("round2_attempts_participant_idx").on(table.participantId),
    index4("round2_attempts_is_submitted_idx").on(table.isSubmitted)
  ]
);
var round2Answers = pgTable4(
  "round2_answers",
  {
    id: text4("id").primaryKey(),
    attemptId: text4("attempt_id").notNull().references(() => round2Attempts.id, { onDelete: "cascade" }),
    questionId: text4("question_id").notNull().references(() => round2Questions.id, { onDelete: "cascade" }),
    selectedLogoId: text4("selected_logo_id"),
    selectedOptionId: text4("selected_option_id"),
    selectedBrandName: text4("selected_brand_name"),
    revealStartedAt: timestamp4("reveal_started_at", { withTimezone: true }),
    revealEndedAt: timestamp4("reveal_ended_at", { withTimezone: true }),
    isCardLocked: boolean3("is_card_locked").notNull().default(false),
    isMarkedForReview: boolean3("is_marked_for_review").notNull().default(false),
    savedAt: timestamp4("saved_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex3("round2_answers_attempt_q_idx").on(table.attemptId, table.questionId),
    index4("round2_answers_attempt_idx").on(table.attemptId)
  ]
);
var round2QuestionMappings = pgTable4(
  "round2_question_mappings",
  {
    id: text4("id").primaryKey(),
    attemptId: text4("attempt_id").notNull().references(() => round2Attempts.id, { onDelete: "cascade" }),
    questionId: text4("question_id").notNull().references(() => round2Questions.id, { onDelete: "cascade" }),
    sequenceOrder: integer2("sequence_order").notNull()
    // 1 to 50
  },
  (table) => [
    uniqueIndex3("round2_qm_attempt_seq_idx").on(table.attemptId, table.sequenceOrder),
    uniqueIndex3("round2_qm_attempt_question_idx").on(table.attemptId, table.questionId),
    index4("round2_qm_attempt_idx").on(table.attemptId)
  ]
);
var round2SecurityEvents = pgTable4(
  "round2_security_events",
  {
    id: text4("id").primaryKey(),
    participantId: uuid4("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
    attemptId: text4("attempt_id"),
    eventType: text4("event_type").notNull(),
    metadata: text4("metadata"),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index4("round2_sec_events_participant_idx").on(table.participantId)
  ]
);
var round2StateEnum = [
  "READY",
  "TEAM_SELECTED",
  "TILE_SELECTED",
  "LOGO_VISIBLE",
  "ANSWER_REVEALED",
  "SCORED_CORRECT",
  "SCORED_WRONG",
  "NEXT_TEAM",
  "COMPLETE"
];
var round2Teams = pgTable4(
  "round2_teams",
  {
    id: uuid4("id").defaultRandom().primaryKey(),
    teamNumber: integer2("team_number").notNull().unique(),
    teamName: text4("team_name").notNull(),
    participant1Id: uuid4("participant1_id").references(() => participants.id, { onDelete: "set null" }),
    participant2Id: uuid4("participant2_id").references(() => participants.id, { onDelete: "set null" }),
    score: integer2("score").notNull().default(0),
    correctAnswers: integer2("correct_answers").notNull().default(0),
    wrongAnswers: integer2("wrong_answers").notNull().default(0),
    turnOrder: integer2("turn_order").notNull(),
    isEliminated: boolean3("is_eliminated").notNull().default(false),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex3("round2_teams_number_idx").on(table.teamNumber),
    index4("round2_teams_score_idx").on(table.score)
  ]
);
var round2Tiles = pgTable4(
  "round2_tiles",
  {
    id: uuid4("id").defaultRandom().primaryKey(),
    tileNumber: integer2("tile_number").notNull().unique(),
    // 1 to 100
    brandName: text4("brand_name").notNull(),
    category: text4("category").notNull().default("General Brand"),
    logoImageUrl: text4("logo_image_url").notNull(),
    difficulty: text4("difficulty").notNull().default("Medium"),
    points: integer2("points").notNull().default(10),
    // Status tracking
    isRevealed: boolean3("is_revealed").notNull().default(false),
    isUsed: boolean3("is_used").notNull().default(false),
    selectedByTeamId: uuid4("selected_by_team_id").references(() => round2Teams.id, { onDelete: "set null" }),
    scoredCorrectly: boolean3("scored_correctly"),
    revealedAt: timestamp4("revealed_at", { withTimezone: true }),
    scoredAt: timestamp4("scored_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex3("round2_tiles_number_idx").on(table.tileNumber),
    index4("round2_tiles_is_used_idx").on(table.isUsed)
  ]
);
var round2GameState = pgTable4("round2_game_state", {
  id: uuid4("id").defaultRandom().primaryKey(),
  currentState: text4("current_state", { enum: round2StateEnum }).notNull().default("READY"),
  currentTeamId: uuid4("current_team_id").references(() => round2Teams.id, { onDelete: "set null" }),
  currentTileNumber: integer2("current_tile_number").references(() => round2Tiles.tileNumber, { onDelete: "set null" }),
  roundNumber: integer2("round_number").notNull().default(1),
  isPaused: boolean3("is_paused").notNull().default(false),
  stateVersion: integer2("state_version").notNull().default(1),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var round2Actions = pgTable4(
  "round2_actions",
  {
    id: uuid4("id").defaultRandom().primaryKey(),
    teamId: uuid4("team_id").references(() => round2Teams.id, { onDelete: "set null" }),
    tileNumber: integer2("tile_number"),
    actionType: text4("action_type").notNull(),
    pointsAwarded: integer2("points_awarded").notNull().default(0),
    previousState: text4("previous_state").notNull(),
    newState: text4("new_state").notNull(),
    hostUserId: uuid4("host_user_id"),
    canUndo: boolean3("can_undo").notNull().default(true),
    isUndone: boolean3("is_undone").notNull().default(false),
    timestamp: timestamp4("timestamp", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index4("round2_actions_timestamp_idx").on(table.timestamp),
    index4("round2_actions_tile_idx").on(table.tileNumber)
  ]
);

// src/db/schema/audit.ts
import { pgTable as pgTable5, text as text5, timestamp as timestamp5, uuid as uuid5, index as index5 } from "drizzle-orm/pg-core";
var auditLogs = pgTable5(
  "audit_logs",
  {
    id: uuid5("id").defaultRandom().primaryKey(),
    actorId: uuid5("actor_id"),
    // User who performed the action
    actorRole: text5("actor_role"),
    action: text5("action").notNull(),
    targetType: text5("target_type").notNull(),
    targetId: text5("target_id"),
    reason: text5("reason"),
    // Required for high-risk actions
    beforeState: text5("before_state"),
    // JSON snapshot
    afterState: text5("after_state"),
    // JSON snapshot
    requestId: text5("request_id"),
    severity: text5("severity").notNull().default("INFO"),
    // INFO, WARNING, CRITICAL
    ipHash: text5("ip_hash"),
    timestamp: timestamp5("timestamp", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index5("audit_logs_actor_idx").on(table.actorId),
    index5("audit_logs_action_idx").on(table.action),
    index5("audit_logs_timestamp_idx").on(table.timestamp),
    index5("audit_logs_target_idx").on(table.targetType, table.targetId)
  ]
);

// src/db/client.ts
var dbInstance = null;
var poolInstance = null;
function getDatabase() {
  if (dbInstance) return dbInstance;
  const url = env.DATABASE_URL;
  if (!url) {
    logger.warn("DATABASE_URL is not set. Database operations will fail unless configured.");
    return null;
  }
  try {
    if (url.includes("neon.tech") || url.includes("sslmode=require")) {
      logger.info("Initializing Neon Serverless PostgreSQL connection");
      poolInstance = new NeonPool({ connectionString: url });
      dbInstance = drizzleNeon(poolInstance, { schema: schema_exports });
    } else {
      logger.info("Initializing standard Node PostgreSQL connection pool");
      poolInstance = new pg.Pool({ connectionString: url });
      dbInstance = drizzlePg(poolInstance, { schema: schema_exports });
    }
    return dbInstance;
  } catch (err) {
    logger.error("Failed to initialize database client:", { error: err.message });
    return null;
  }
}
async function checkDatabaseConnection() {
  const url = env.DATABASE_URL;
  if (!url) {
    return {
      connected: false,
      message: "DATABASE_URL not configured. Set DATABASE_URL in environment."
    };
  }
  const start = Date.now();
  try {
    const db2 = getDatabase();
    if (!db2) {
      return { connected: false, message: "Database client failed to initialize" };
    }
    if (poolInstance) {
      await poolInstance.query("SELECT 1");
    }
    const latencyMs = Date.now() - start;
    return { connected: true, message: "PostgreSQL connection operational", latencyMs };
  } catch (err) {
    return { connected: false, message: err.message || "Database ping failed" };
  }
}
var db = getDatabase();

// src/db/redis.ts
import { Redis } from "@upstash/redis";
var MemoryRedisClient = class {
  store = /* @__PURE__ */ new Map();
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key, value, options) {
    if (options?.nx && this.store.has(key)) {
      const existing = this.store.get(key);
      if (!existing?.expiresAt || Date.now() <= existing.expiresAt) {
        return null;
      }
    }
    let expiresAt;
    if (options?.ex) {
      expiresAt = Date.now() + options.ex * 1e3;
    } else if (options?.px) {
      expiresAt = Date.now() + options.px;
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }
  async del(key) {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }
  async incr(key) {
    const existing = await this.get(key);
    const nextVal = (typeof existing === "number" ? existing : 0) + 1;
    this.store.set(key, { value: nextVal });
    return nextVal;
  }
  async expire(key, seconds) {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1e3;
    return 1;
  }
  async ping() {
    return "PONG (in-memory mock)";
  }
};
var redisInstance;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_URL.startsWith("http")) {
  try {
    const upstash = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN
    });
    redisInstance = upstash;
    logger.info("Connected to Upstash Redis REST");
  } catch (err) {
    logger.warn("Failed initializing Upstash Redis, falling back to in-memory store:", { error: err.message });
    redisInstance = new MemoryRedisClient();
  }
} else {
  logger.info("Using memory-backed Redis interface (offline/dev/test mode)");
  redisInstance = new MemoryRedisClient();
}
var redis = redisInstance;

// src/server/routes/health.ts
var healthRouter = new Hono();
healthRouter.get("/", async (c) => {
  const dbHealth = await checkDatabaseConnection();
  let redisHealth = { connected: false, message: "Unchecked" };
  try {
    const pong = await redis.ping();
    redisHealth = { connected: true, message: pong };
  } catch (err) {
    redisHealth = { connected: false, message: err.message || "Redis ping failed" };
  }
  const overallHealthy = dbHealth.connected && redisHealth.connected;
  const status = overallHealthy ? "healthy" : redisHealth.connected || dbHealth.connected ? "degraded" : "unhealthy";
  return c.json({
    success: true,
    status,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0",
    service: "SKP Skill Arena API",
    checks: {
      database: {
        status: dbHealth.connected ? "up" : "down",
        latencyMs: dbHealth.latencyMs
      },
      redis: {
        status: redisHealth.connected ? "up" : "down"
      }
    }
  }, status === "unhealthy" ? 503 : 200);
});
var health_default = healthRouter;

// src/server/routes/auth.ts
import { Hono as Hono2 } from "hono";
import { getCookie as getCookie2, setCookie, deleteCookie as deleteCookie2 } from "hono/cookie";
import { eq as eq2, and } from "drizzle-orm";

// src/server/middleware/auth.ts
import { getCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
var SESSION_COOKIE_NAME = "skp_session";
var SESSION_MAX_AGE = 60 * 60 * 24;
var memorySessions = /* @__PURE__ */ new Map();
async function resolveSessionUser(sessionId) {
  if (!sessionId) return null;
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const sessionList = await activeDb.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      const activeSession = sessionList[0];
      if (!activeSession || !activeSession.isActive || /* @__PURE__ */ new Date() > activeSession.expiresAt) {
        return null;
      }
      const userList = await activeDb.select().from(users).where(eq(users.id, activeSession.userId)).limit(1);
      const user = userList[0];
      if (!user) return null;
      let participantId;
      let teamName = null;
      if (user.role === "participant") {
        const participantList = await activeDb.select().from(participants).where(eq(participants.userId, user.id)).limit(1);
        if (participantList[0]) {
          participantId = participantList[0].id;
          teamName = participantList[0].teamName;
        }
      }
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        participantId,
        teamName
      };
    } catch {
      return null;
    }
  } else {
    const mem = memorySessions.get(sessionId);
    if (!mem || /* @__PURE__ */ new Date() > mem.expiresAt) {
      return null;
    }
    return {
      id: mem.userId,
      email: mem.email,
      fullName: mem.fullName,
      role: mem.role,
      participantId: mem.participantId || "dev-participant-id",
      teamName: mem.teamName || null
    };
  }
}
var requireAuth = async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  const user = await resolveSessionUser(sessionId);
  if (!user) {
    if (sessionId) {
      deleteCookie(c, SESSION_COOKIE_NAME);
    }
    throw new AppError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
  }
  c.set("user", user);
  await next();
};
function requireRole(...allowedRoles) {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (!allowedRoles.includes(user.role)) {
      throw new AppError("FORBIDDEN", "Insufficient permissions for this resource", 403);
    }
    await next();
  };
}

// src/server/routes/auth.ts
var authRouter = new Hono2();
authRouter.post("/google", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = body.email || "participant.skp2026@gmail.com";
    const fullName = body.name || "SKP Participant";
    const deviceFingerprint = c.req.header("user-agent") || "browser-client";
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1e3);
    const activeDb = getDatabase();
    let teamName = null;
    if (activeDb) {
      let existingUser = (await activeDb.select().from(users).where(eq2(users.email, email)).limit(1))[0];
      if (!existingUser) {
        const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1e3);
        const [newUser] = await activeDb.insert(users).values({
          email,
          username,
          fullName,
          passwordHash: "oauth_managed",
          role: "participant"
        }).returning();
        existingUser = newUser;
        await activeDb.insert(participants).values({
          userId: existingUser.id,
          registrationNumber: "SKP-" + Math.floor(1e5 + Math.random() * 9e5),
          collegeName: "SKP Engineering College",
          department: "Computer Science & Engineering",
          yearOfStudy: "III",
          phone: "+91 98765 43210",
          teamName: null
        }).returning();
      } else {
        const pList = await activeDb.select().from(participants).where(eq2(participants.userId, existingUser.id)).limit(1);
        if (pList[0]) {
          teamName = pList[0].teamName;
        }
      }
      await activeDb.update(sessions).set({ isActive: false }).where(and(eq2(sessions.userId, existingUser.id), eq2(sessions.isActive, true)));
      await activeDb.insert(sessions).values({
        id: sessionId,
        userId: existingUser.id,
        role: existingUser.role,
        deviceFingerprint,
        ipAddress: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        expiresAt,
        isActive: true
      });
    } else {
      for (const s of memorySessions.values()) {
        if (s.email === email && s.teamName) {
          teamName = s.teamName;
          break;
        }
      }
      const devUserId = "dev-user-" + email.replace(/[^a-zA-Z0-9]/g, "_");
      const devParticipantId = "dev-p-" + email.replace(/[^a-zA-Z0-9]/g, "_");
      memorySessions.set(sessionId, {
        userId: devUserId,
        role: "participant",
        fullName,
        email,
        participantId: devParticipantId,
        teamName,
        expiresAt
      });
    }
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: SESSION_MAX_AGE
    });
    const hasTeamName = Boolean(teamName && teamName.trim().length > 0);
    logger.info(`Participant logged in: ${email} (hasTeamName: ${hasTeamName})`);
    return c.json({
      success: true,
      user: {
        email,
        fullName,
        role: "participant",
        teamName
      },
      hasTeamName
    });
  } catch (err) {
    logger.error("Google login failed:", { error: err.message });
    return c.json({
      success: false,
      error: {
        code: "AUTH_FAILED",
        message: "Authentication failed. Please try again."
      }
    }, 400);
  }
});
var ADMIN_CREDENTIALS = {
  email: "darkdev257@gmail.com",
  passkey: "dev7.$25#@%9",
  fullName: "Super Administrator",
  role: "admin"
};
authRouter.post("/admin-login", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, passkey } = body;
    if (!email || !passkey) {
      return c.json({
        success: false,
        error: { code: "MISSING_CREDENTIALS", message: "Email ID and passkey are required." }
      }, 400);
    }
    if (email.trim().toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() || passkey !== ADMIN_CREDENTIALS.passkey) {
      logger.warn(`Failed admin login attempt with ID: ${email}`);
      return c.json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid admin credentials or passkey." }
      }, 401);
    }
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1e3);
    const activeDb = getDatabase();
    let adminUserId = "usr-admin-darkdev";
    if (activeDb) {
      let existingUser = (await activeDb.select().from(users).where(eq2(users.email, ADMIN_CREDENTIALS.email)).limit(1))[0];
      if (!existingUser) {
        const [newUser] = await activeDb.insert(users).values({
          email: ADMIN_CREDENTIALS.email,
          username: "darkdev257",
          fullName: ADMIN_CREDENTIALS.fullName,
          passwordHash: "admin_passkey_verified",
          role: "admin"
        }).returning();
        existingUser = newUser;
      } else if (existingUser.role !== "admin" && existingUser.role !== "super_admin") {
        await activeDb.update(users).set({ role: "admin" }).where(eq2(users.id, existingUser.id));
      }
      adminUserId = existingUser.id;
      await activeDb.update(sessions).set({ isActive: false }).where(and(eq2(sessions.userId, existingUser.id), eq2(sessions.isActive, true)));
      await activeDb.insert(sessions).values({
        id: sessionId,
        userId: existingUser.id,
        role: "admin",
        deviceFingerprint: c.req.header("user-agent") || "admin-console",
        ipAddress: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        expiresAt,
        isActive: true
      });
    } else {
      memorySessions.set(sessionId, {
        userId: adminUserId,
        role: "admin",
        fullName: ADMIN_CREDENTIALS.fullName,
        email: ADMIN_CREDENTIALS.email,
        expiresAt
      });
    }
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: SESSION_MAX_AGE
    });
    logger.info(`Admin successfully authenticated: ${ADMIN_CREDENTIALS.email}`);
    return c.json({
      success: true,
      user: {
        id: adminUserId,
        email: ADMIN_CREDENTIALS.email,
        fullName: ADMIN_CREDENTIALS.fullName,
        role: "admin"
      },
      message: "Admin authorization granted"
    });
  } catch (err) {
    logger.error("Admin login error:", { error: err.message });
    return c.json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to process admin authentication." }
    }, 500);
  }
});
authRouter.get("/me", async (c) => {
  const sessionId = getCookie2(c, SESSION_COOKIE_NAME);
  const user = await resolveSessionUser(sessionId);
  if (!user) {
    if (sessionId) deleteCookie2(c, SESSION_COOKIE_NAME);
    return c.json({ success: true, user: null, hasTeamName: false });
  }
  const hasTeamName = Boolean(user.teamName && user.teamName.trim().length > 0);
  return c.json({
    success: true,
    user,
    hasTeamName
  });
});
authRouter.post("/logout", async (c) => {
  const sessionId = getCookie2(c, SESSION_COOKIE_NAME);
  if (sessionId) {
    const activeDb = getDatabase();
    if (activeDb) {
      await activeDb.update(sessions).set({ isActive: false }).where(eq2(sessions.id, sessionId));
    } else {
      memorySessions.delete(sessionId);
    }
    deleteCookie2(c, SESSION_COOKIE_NAME);
  }
  return c.json({ success: true, message: "Logged out successfully" });
});
var auth_default = authRouter;

// src/server/routes/participants.ts
import { Hono as Hono3 } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z as z2 } from "zod";
import { eq as eq3 } from "drizzle-orm";
var participantsRouter = new Hono3();
var teamNameSchema = z2.object({
  teamName: z2.string().trim().min(2, "Team name must be at least 2 characters long").max(50, "Team name cannot exceed 50 characters").refine((val) => !/[\x00-\x1F\x7F]/.test(val), {
    message: "Team name contains invalid characters"
  }).transform((val) => val.replace(/\s+/g, " "))
  // Normalize multiple spaces
});
participantsRouter.post("/team", requireAuth, zValidator("json", teamNameSchema), async (c) => {
  const user = c.get("user");
  const { teamName } = c.req.valid("json");
  if (user.role !== "participant") {
    throw new AppError("FORBIDDEN", "Only participants can submit a team name", 403);
  }
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const participantList = await activeDb.select().from(participants).where(eq3(participants.userId, user.id)).limit(1);
      if (!participantList[0]) {
        throw new AppError("PARTICIPANT_NOT_FOUND", "Participant profile not found", 404);
      }
      await activeDb.update(participants).set({
        teamName,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(participants.id, participantList[0].id));
      logger.info(`Updated team name for participant ${user.email}: "${teamName}"`);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error("Failed to update team name in database:", { error: err.message });
      throw new AppError("DATABASE_ERROR", "Failed to save team name. Please try again.", 500);
    }
  } else {
    for (const s of memorySessions.values()) {
      if (s.userId === user.id || s.email === user.email) {
        s.teamName = teamName;
      }
    }
    logger.info(`Updated in-memory team name for ${user.email}: "${teamName}"`);
  }
  return c.json({
    success: true,
    message: "Team name registered successfully",
    teamName
  });
});
participantsRouter.get("/", requireAuth, (c) => {
  return c.json({ success: true, data: [] });
});
var participants_default = participantsRouter;

// src/server/routes/quiz.ts
import { Hono as Hono5 } from "hono";
import { z as z4 } from "zod";
import { zValidator as zValidator3 } from "@hono/zod-validator";
import { eq as eq6 } from "drizzle-orm";

// src/server/data/quiz_questions_100.ts
var data = [
  {
    "question_id": "Q001",
    "source_question_number": 1,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Which dance is called the mother of all classical dances?",
    "option_a": "Kathak",
    "option_b": "Bharatanatyam",
    "option_c": "Kuchipudi",
    "option_d": "Odissi",
    "correct_option": "B",
    "correct_answer": "Bharatanatyam",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q002",
    "source_question_number": 2,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "What is the traditional dress of Tamil Nadu for women?",
    "option_a": "Phulkari",
    "option_b": "Kanchipuram Saree",
    "option_c": "Mekhela Chador",
    "option_d": "Chaniya Choli",
    "correct_option": "B",
    "correct_answer": "Kanchipuram Saree",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q003",
    "source_question_number": 3,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Pongal is the harvest festival of which state?",
    "option_a": "Kerala",
    "option_b": "Karnataka",
    "option_c": "Tamil Nadu",
    "option_d": "Andhra Pradesh",
    "correct_option": "C",
    "correct_answer": "Tamil Nadu",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q004",
    "source_question_number": 4,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Which festival is known as the Festival of Colors?",
    "option_a": "Diwali",
    "option_b": "Holi",
    "option_c": "Onam",
    "option_d": "Pongal",
    "correct_option": "B",
    "correct_answer": "Holi",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q005",
    "source_question_number": 5,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Who is traditionally associated with the creation of Bharatanatyam?",
    "option_a": "Lord Shiva as Nataraja",
    "option_b": "Lord Krishna",
    "option_c": "Lord Vishnu",
    "option_d": "Lord Ganesha",
    "correct_option": "A",
    "correct_answer": "Lord Shiva as Nataraja",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q006",
    "source_question_number": 6,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "What is the traditional martial art of Kerala?",
    "option_a": "Silambam",
    "option_b": "Kalaripayattu",
    "option_c": "Kushti",
    "option_d": "Gatka",
    "correct_option": "B",
    "correct_answer": "Kalaripayattu",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q007",
    "source_question_number": 7,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Giddha is the folk dance of which state?",
    "option_a": "Punjab",
    "option_b": "Gujarat",
    "option_c": "Rajasthan",
    "option_d": "Haryana",
    "correct_option": "A",
    "correct_answer": "Punjab",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q008",
    "source_question_number": 8,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Madhubani painting is traditionally associated with which state?",
    "option_a": "Bihar",
    "option_b": "Odisha",
    "option_c": "Assam",
    "option_d": "Maharashtra",
    "correct_option": "A",
    "correct_answer": "Bihar",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q009",
    "source_question_number": 9,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "What is the holy book of Sikhs?",
    "option_a": "Vedas",
    "option_b": "Bhagavad Gita",
    "option_c": "Guru Granth Sahib",
    "option_d": "Tripitaka",
    "correct_option": "C",
    "correct_answer": "Guru Granth Sahib",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q010",
    "source_question_number": 10,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Which instrument is Ustad Bismillah Khan famous for?",
    "option_a": "Tabla",
    "option_b": "Sitar",
    "option_c": "Shehnai",
    "option_d": "Flute",
    "correct_option": "C",
    "correct_answer": "Shehnai",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q011",
    "source_question_number": 11,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Onam festival belongs to which state?",
    "option_a": "Tamil Nadu",
    "option_b": "Kerala",
    "option_c": "Goa",
    "option_d": "Karnataka",
    "correct_option": "B",
    "correct_answer": "Kerala",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q012",
    "source_question_number": 12,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "What traditional food is commonly served on a banana leaf in Tamil Nadu?",
    "option_a": "Biryani",
    "option_b": "Sadhya/Traditional Meals",
    "option_c": "Dhokla",
    "option_d": "Litti Chokha",
    "correct_option": "B",
    "correct_answer": "Sadhya/Traditional Meals",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q013",
    "source_question_number": 13,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "The famous Meenakshi Temple is located in which city?",
    "option_a": "Chennai",
    "option_b": "Coimbatore",
    "option_c": "Madurai",
    "option_d": "Thanjavur",
    "correct_option": "C",
    "correct_answer": "Madurai",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q014",
    "source_question_number": 14,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "What is Kolam commonly called in North India?",
    "option_a": "Rangoli",
    "option_b": "Mandala",
    "option_c": "Alpana",
    "option_d": "Warli",
    "correct_option": "A",
    "correct_answer": "Rangoli",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q015",
    "source_question_number": 15,
    "category": "INDIAN TRADITIONAL CULTURE",
    "question_text": "Kathak is a classical dance traditionally associated with which region?",
    "option_a": "Uttar Pradesh",
    "option_b": "Kerala",
    "option_c": "Tamil Nadu",
    "option_d": "Assam",
    "correct_option": "A",
    "correct_answer": "Uttar Pradesh",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q016",
    "source_question_number": 16,
    "category": "VEHICLE GK",
    "question_text": "How many wheels does an auto-rickshaw have?",
    "option_a": "2",
    "option_b": "3",
    "option_c": "4",
    "option_d": "6",
    "correct_option": "B",
    "correct_answer": "3",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q017",
    "source_question_number": 17,
    "category": "VEHICLE GK",
    "question_text": "What is a common speed limit in city areas?",
    "option_a": "20 km/h",
    "option_b": "40\u201350 km/h",
    "option_c": "80\u2013100 km/h",
    "option_d": "120 km/h",
    "correct_option": "B",
    "correct_answer": "40\u201350 km/h",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q018",
    "source_question_number": 18,
    "category": "VEHICLE GK",
    "question_text": "What does RTO stand for?",
    "option_a": "Road Transport Organization",
    "option_b": "Regional Transport Office",
    "option_c": "Road Traffic Office",
    "option_d": "Regional Traffic Organization",
    "correct_option": "B",
    "correct_answer": "Regional Transport Office",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q019",
    "source_question_number": 19,
    "category": "VEHICLE GK",
    "question_text": "A helmet is mainly used by which vehicle users?",
    "option_a": "Car users",
    "option_b": "Bus users",
    "option_c": "Two-wheeler users",
    "option_d": "Train passengers",
    "correct_option": "C",
    "correct_answer": "Two-wheeler users",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q020",
    "source_question_number": 20,
    "category": "VEHICLE GK",
    "question_text": "What does a red traffic signal mean?",
    "option_a": "Go",
    "option_b": "Slow down",
    "option_c": "Stop",
    "option_d": "Turn right",
    "correct_option": "C",
    "correct_answer": "Stop",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q021",
    "source_question_number": 21,
    "category": "VEHICLE GK",
    "question_text": "Which company is one of the world's largest vehicle manufacturers?",
    "option_a": "Toyota",
    "option_b": "Tesla",
    "option_c": "Ford",
    "option_d": "BMW",
    "correct_option": "A",
    "correct_answer": "Toyota",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q022",
    "source_question_number": 22,
    "category": "VEHICLE GK",
    "question_text": "Which was India's first commercially produced electric car?",
    "option_a": "Tata Nexon EV",
    "option_b": "Mahindra Reva",
    "option_c": "Tata Tiago EV",
    "option_d": "Hyundai Kona Electric",
    "correct_option": "B",
    "correct_answer": "Mahindra Reva",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q023",
    "source_question_number": 23,
    "category": "VEHICLE GK",
    "question_text": "What does CC stand for in a bike?",
    "option_a": "Car Control",
    "option_b": "Cubic Capacity",
    "option_c": "Cycle Capacity",
    "option_d": "Current Control",
    "correct_option": "B",
    "correct_answer": "Cubic Capacity",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q024",
    "source_question_number": 24,
    "category": "VEHICLE GK",
    "question_text": "Which company makes Thar?",
    "option_a": "Tata Motors",
    "option_b": "Mahindra",
    "option_c": "Hyundai",
    "option_d": "Toyota",
    "correct_option": "B",
    "correct_answer": "Mahindra",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q025",
    "source_question_number": 25,
    "category": "VEHICLE GK",
    "question_text": "Which company makes Swift?",
    "option_a": "Maruti Suzuki",
    "option_b": "Honda",
    "option_c": "Ford",
    "option_d": "Kia",
    "correct_option": "A",
    "correct_answer": "Maruti Suzuki",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q026",
    "source_question_number": 26,
    "category": "VEHICLE GK",
    "question_text": "Who is credited with inventing the first practical automobile?",
    "option_a": "Henry Ford",
    "option_b": "Karl Benz",
    "option_c": "Elon Musk",
    "option_d": "James Watt",
    "correct_option": "B",
    "correct_answer": "Karl Benz",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q027",
    "source_question_number": 27,
    "category": "VEHICLE GK",
    "question_text": "Which car is often regarded as one of India's first indigenous mass-produced cars?",
    "option_a": "Maruti 800",
    "option_b": "Hindustan Ambassador",
    "option_c": "Tata Nano",
    "option_d": "Mahindra Thar",
    "correct_option": "B",
    "correct_answer": "Hindustan Ambassador",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q028",
    "source_question_number": 28,
    "category": "VEHICLE GK",
    "question_text": "Which fuel is commonly used by trucks?",
    "option_a": "Petrol",
    "option_b": "Diesel",
    "option_c": "Kerosene",
    "option_d": "LPG",
    "correct_option": "B",
    "correct_answer": "Diesel",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q029",
    "source_question_number": 29,
    "category": "VEHICLE GK",
    "question_text": "Which vehicle normally has two wheels?",
    "option_a": "Car",
    "option_b": "Bus",
    "option_c": "Bike",
    "option_d": "Auto-rickshaw",
    "correct_option": "C",
    "correct_answer": "Bike",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q030",
    "source_question_number": 30,
    "category": "VEHICLE GK",
    "question_text": "Which car is known for a top speed of around 490 km/h in a special high-speed version?",
    "option_a": "Bugatti Chiron Super Sport 300+",
    "option_b": "Toyota Camry",
    "option_c": "Honda City",
    "option_d": "Tata Nexon",
    "correct_option": "A",
    "correct_answer": "Bugatti Chiron Super Sport 300+",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q031",
    "source_question_number": 31,
    "category": "VEHICLE GK",
    "question_text": "Which company's logo has four rings?",
    "option_a": "BMW",
    "option_b": "Audi",
    "option_c": "Mercedes-Benz",
    "option_d": "Volvo",
    "correct_option": "B",
    "correct_answer": "Audi",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q032",
    "source_question_number": 32,
    "category": "VEHICLE GK",
    "question_text": "Which company makes the Bullet motorcycle?",
    "option_a": "Yamaha",
    "option_b": "Royal Enfield",
    "option_c": "Bajaj",
    "option_d": "TVS",
    "correct_option": "B",
    "correct_answer": "Royal Enfield",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q033",
    "source_question_number": 33,
    "category": "VEHICLE GK",
    "question_text": "What does SUV stand for?",
    "option_a": "Sports Utility Vehicle",
    "option_b": "Sport Utility Vehicle",
    "option_c": "Speed Utility Vehicle",
    "option_d": "Super Utility Van",
    "correct_option": "B",
    "correct_answer": "Sport Utility Vehicle",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q034",
    "source_question_number": 34,
    "category": "VEHICLE GK",
    "question_text": "Which car company has a horse logo?",
    "option_a": "Ferrari",
    "option_b": "Toyota",
    "option_c": "Audi",
    "option_d": "Hyundai",
    "correct_option": "A",
    "correct_answer": "Ferrari",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q035",
    "source_question_number": 35,
    "category": "VEHICLE GK",
    "question_text": "Which car company is famous for a bull logo?",
    "option_a": "Lamborghini",
    "option_b": "BMW",
    "option_c": "Tesla",
    "option_d": "Ford",
    "correct_option": "A",
    "correct_answer": "Lamborghini",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q036",
    "source_question_number": 36,
    "category": "VEHICLE GK",
    "question_text": "BMW is a company from which country?",
    "option_a": "France",
    "option_b": "Germany",
    "option_c": "Japan",
    "option_d": "Italy",
    "correct_option": "B",
    "correct_answer": "Germany",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q037",
    "source_question_number": 37,
    "category": "VEHICLE GK",
    "question_text": "Toyota is a company from which country?",
    "option_a": "USA",
    "option_b": "Germany",
    "option_c": "Japan",
    "option_d": "India",
    "correct_option": "C",
    "correct_answer": "Japan",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q038",
    "source_question_number": 38,
    "category": "VEHICLE GK",
    "question_text": "Which electric car company was co-founded by Elon Musk?",
    "option_a": "Tesla",
    "option_b": "Toyota",
    "option_c": "Ford",
    "option_d": "Tata Motors",
    "correct_option": "A",
    "correct_answer": "Tesla",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q039",
    "source_question_number": 39,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the capital of India?",
    "option_a": "Mumbai",
    "option_b": "Chennai",
    "option_c": "New Delhi",
    "option_d": "Kolkata",
    "correct_option": "C",
    "correct_answer": "New Delhi",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q040",
    "source_question_number": 40,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the National Animal of India?",
    "option_a": "Lion",
    "option_b": "Tiger",
    "option_c": "Elephant",
    "option_d": "Leopard",
    "correct_option": "B",
    "correct_answer": "Tiger",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q041",
    "source_question_number": 41,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the National Bird of India?",
    "option_a": "Peacock",
    "option_b": "Parrot",
    "option_c": "Eagle",
    "option_d": "Sparrow",
    "correct_option": "A",
    "correct_answer": "Peacock",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q042",
    "source_question_number": 42,
    "category": "INDIA & WORLD GK",
    "question_text": "Who wrote the National Anthem of India?",
    "option_a": "Mahatma Gandhi",
    "option_b": "Rabindranath Tagore",
    "option_c": "Subramania Bharati",
    "option_d": "Jawaharlal Nehru",
    "correct_option": "B",
    "correct_answer": "Rabindranath Tagore",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q043",
    "source_question_number": 43,
    "category": "INDIA & WORLD GK",
    "question_text": "Who is popularly known as the Father of the Nation in India?",
    "option_a": "Sardar Patel",
    "option_b": "Jawaharlal Nehru",
    "option_c": "Mahatma Gandhi",
    "option_d": "B. R. Ambedkar",
    "correct_option": "C",
    "correct_answer": "Mahatma Gandhi",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q044",
    "source_question_number": 44,
    "category": "INDIA & WORLD GK",
    "question_text": "Who was the first Prime Minister of India?",
    "option_a": "Mahatma Gandhi",
    "option_b": "Jawaharlal Nehru",
    "option_c": "Sardar Patel",
    "option_d": "Rajendra Prasad",
    "correct_option": "B",
    "correct_answer": "Jawaharlal Nehru",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q045",
    "source_question_number": 45,
    "category": "INDIA & WORLD GK",
    "question_text": "Who is known as the Missile Man of India?",
    "option_a": "C. V. Raman",
    "option_b": "Homi Bhabha",
    "option_c": "A. P. J. Abdul Kalam",
    "option_d": "Vikram Sarabhai",
    "correct_option": "C",
    "correct_answer": "A. P. J. Abdul Kalam",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q046",
    "source_question_number": 46,
    "category": "INDIA & WORLD GK",
    "question_text": "Which is the largest state in India by area?",
    "option_a": "Maharashtra",
    "option_b": "Rajasthan",
    "option_c": "Madhya Pradesh",
    "option_d": "Uttar Pradesh",
    "correct_option": "B",
    "correct_answer": "Rajasthan",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q047",
    "source_question_number": 47,
    "category": "INDIA & WORLD GK",
    "question_text": "Which is the smallest state in India by area?",
    "option_a": "Goa",
    "option_b": "Sikkim",
    "option_c": "Tripura",
    "option_d": "Manipur",
    "correct_option": "A",
    "correct_answer": "Goa",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q048",
    "source_question_number": 48,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the National Flower of India?",
    "option_a": "Rose",
    "option_b": "Jasmine",
    "option_c": "Lotus",
    "option_d": "Sunflower",
    "correct_option": "C",
    "correct_answer": "Lotus",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q049",
    "source_question_number": 49,
    "category": "INDIA & WORLD GK",
    "question_text": "Which is the largest ocean in the world?",
    "option_a": "Atlantic Ocean",
    "option_b": "Indian Ocean",
    "option_c": "Arctic Ocean",
    "option_d": "Pacific Ocean",
    "correct_option": "D",
    "correct_answer": "Pacific Ocean",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q050",
    "source_question_number": 50,
    "category": "INDIA & WORLD GK",
    "question_text": "Which is commonly recognized as the longest river in the world?",
    "option_a": "Amazon",
    "option_b": "Nile",
    "option_c": "Ganga",
    "option_d": "Yangtze",
    "correct_option": "B",
    "correct_answer": "Nile",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q051",
    "source_question_number": 51,
    "category": "INDIA & WORLD GK",
    "question_text": "Which is the smallest country in the world?",
    "option_a": "Monaco",
    "option_b": "Maldives",
    "option_c": "Vatican City",
    "option_d": "Singapore",
    "correct_option": "C",
    "correct_answer": "Vatican City",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q052",
    "source_question_number": 52,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the capital of the USA?",
    "option_a": "New York",
    "option_b": "Los Angeles",
    "option_c": "Washington, D.C.",
    "option_d": "Chicago",
    "correct_option": "C",
    "correct_answer": "Washington, D.C.",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q053",
    "source_question_number": 53,
    "category": "INDIA & WORLD GK",
    "question_text": "Who is credited with inventing the telephone?",
    "option_a": "Thomas Edison",
    "option_b": "Alexander Graham Bell",
    "option_c": "Nikola Tesla",
    "option_d": "James Watt",
    "correct_option": "B",
    "correct_answer": "Alexander Graham Bell",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q054",
    "source_question_number": 54,
    "category": "INDIA & WORLD GK",
    "question_text": "How many planets are there in our Solar System?",
    "option_a": "7",
    "option_b": "8",
    "option_c": "9",
    "option_d": "10",
    "correct_option": "B",
    "correct_answer": "8",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q055",
    "source_question_number": 55,
    "category": "INDIA & WORLD GK",
    "question_text": "Which gas is essential for humans to breathe?",
    "option_a": "Carbon dioxide",
    "option_b": "Nitrogen",
    "option_c": "Oxygen",
    "option_d": "Hydrogen",
    "correct_option": "C",
    "correct_answer": "Oxygen",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q056",
    "source_question_number": 56,
    "category": "INDIA & WORLD GK",
    "question_text": "What is H\u2082O?",
    "option_a": "Oxygen",
    "option_b": "Hydrogen",
    "option_c": "Salt",
    "option_d": "Water",
    "correct_option": "D",
    "correct_answer": "Water",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q057",
    "source_question_number": 57,
    "category": "INDIA & WORLD GK",
    "question_text": "How many days are there in a leap year?",
    "option_a": "365",
    "option_b": "366",
    "option_c": "364",
    "option_d": "367",
    "correct_option": "B",
    "correct_answer": "366",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q058",
    "source_question_number": 58,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the largest organ in the human body?",
    "option_a": "Heart",
    "option_b": "Brain",
    "option_c": "Skin",
    "option_d": "Liver",
    "correct_option": "C",
    "correct_answer": "Skin",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q059",
    "source_question_number": 59,
    "category": "INDIA & WORLD GK",
    "question_text": "What is the currency of Japan?",
    "option_a": "Won",
    "option_b": "Yuan",
    "option_c": "Yen",
    "option_d": "Dollar",
    "correct_option": "C",
    "correct_answer": "Yen",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q060",
    "source_question_number": 60,
    "category": "INDIA & WORLD GK",
    "question_text": "Who wrote the Ramayana?",
    "option_a": "Vyasa",
    "option_b": "Valmiki",
    "option_c": "Kalidasa",
    "option_d": "Tulsidas",
    "correct_option": "B",
    "correct_answer": "Valmiki",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q061",
    "source_question_number": 61,
    "category": "INDIA & WORLD GK",
    "question_text": "What is 2 + 2 \xD7 2?",
    "option_a": "8",
    "option_b": "6",
    "option_c": "4",
    "option_d": "10",
    "correct_option": "B",
    "correct_answer": "6",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q062",
    "source_question_number": 62,
    "category": "Questions on AI",
    "question_text": "What is the full form of \u201CAI\u201D?",
    "option_a": "Artificially Intelligent",
    "option_b": "Artificial Intelligence",
    "option_c": "Artificially Intelligence",
    "option_d": "Advanced Intelligence",
    "correct_option": "B",
    "correct_answer": "Artificial Intelligence",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q063",
    "source_question_number": 63,
    "category": "Questions on AI",
    "question_text": "Who is the inventor of Artificial Intelligence?",
    "option_a": "Geoffrey Hinton",
    "option_b": "Andrew Ng",
    "option_c": "John McCarthy",
    "option_d": "J\xFCrgen Schmidhuber",
    "correct_option": "C",
    "correct_answer": "John McCarthy",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q064",
    "source_question_number": 64,
    "category": "Questions on AI",
    "question_text": "Which of the following is the branch of Artificial Intelligence?",
    "option_a": "Machine Learning",
    "option_b": "Cyber forensics",
    "option_c": "Full-Stack Developer",
    "option_d": "Network Design",
    "correct_option": "A",
    "correct_answer": "Machine Learning",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q065",
    "source_question_number": 65,
    "category": "Questions on AI",
    "question_text": "In how many categories process of Artificial Intelligence is categorized?",
    "option_a": "categorized into 5 categories",
    "option_b": "processes are categorized based on the input provided",
    "option_c": "categorized into 3 categories",
    "option_d": "process is not categorized",
    "correct_option": "C",
    "correct_answer": "categorized into 3 categories",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q066",
    "source_question_number": 66,
    "category": "Questions on AI",
    "question_text": "What is the name of the Artificial Intelligence system developed by Daniel Bobrow?",
    "option_a": "program known as BACON",
    "option_b": "system known as STUDENT",
    "option_c": "program known as SHRDLU",
    "option_d": "system known as SIMD",
    "correct_option": "B",
    "correct_answer": "system known as STUDENT",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q067",
    "source_question_number": 67,
    "category": "Questions on AI",
    "question_text": "Which of the following is not an application of artificial intelligence?",
    "option_a": "Face recognition system",
    "option_b": "Chatbots",
    "option_c": "LIDAR",
    "option_d": "DBMS",
    "correct_option": "D",
    "correct_answer": "DBMS",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q068",
    "source_question_number": 68,
    "category": "Questions on AI",
    "question_text": "Which of the following machine requires input from the humans but can interpret the outputs themselves?",
    "option_a": "Actuators",
    "option_b": "Sensor",
    "option_c": "Agents",
    "option_d": "AI system",
    "correct_option": "D",
    "correct_answer": "AI system",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q069",
    "source_question_number": 69,
    "category": "Questions on AI",
    "question_text": "_________ number of informed search method are there in Artificial Intelligence.",
    "option_a": "4",
    "option_b": "3",
    "option_c": "2",
    "option_d": "1",
    "correct_option": "A",
    "correct_answer": "4",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q070",
    "source_question_number": 70,
    "category": "Questions on AI",
    "question_text": "Which of the following are the approaches to Artificial Intelligence?",
    "option_a": "Applied approach",
    "option_b": "Strong approach",
    "option_c": "Weak approach",
    "option_d": "All of the mentioned",
    "correct_option": "D",
    "correct_answer": "All of the mentioned",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q071",
    "source_question_number": 71,
    "category": "Questions on AI",
    "question_text": "Face Recognition system is based on which type of approach?",
    "option_a": "Weak AI approach",
    "option_b": "Applied AI approach",
    "option_c": "Cognitive AI approach",
    "option_d": "Strong AI approach",
    "correct_option": "B",
    "correct_answer": "Applied AI approach",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q072",
    "source_question_number": 72,
    "category": "Questions on AI",
    "question_text": "Which of the following environment is strategic?",
    "option_a": "Rational",
    "option_b": "Deterministic",
    "option_c": "Partial",
    "option_d": "Stochastic",
    "correct_option": "B",
    "correct_answer": "Deterministic",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q073",
    "source_question_number": 73,
    "category": "Questions on AI",
    "question_text": "What does the Bayesian network provide?",
    "option_a": "Partial description of the domain",
    "option_b": "Complete description of the problem",
    "option_c": "Complete description of the domain",
    "option_d": "None of the mentioned",
    "correct_option": "C",
    "correct_answer": "Complete description of the domain",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q074",
    "source_question_number": 74,
    "category": "Questions on AI",
    "question_text": "Which of the following are the 5 big ideas of AI?",
    "option_a": "Perception",
    "option_b": "Human-AI Interaction",
    "option_c": "Societal Impact",
    "option_d": "All of the above",
    "correct_option": "D",
    "correct_answer": "All of the above",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q075",
    "source_question_number": 75,
    "category": "INDIAN CULTURE",
    "question_text": "Who had introduced Police system in India?",
    "option_a": "Lord Wellesley",
    "option_b": "Lord Minto",
    "option_c": "Lord Hastings",
    "option_d": "Lord Cornwallis",
    "correct_option": "D",
    "correct_answer": "Lord Cornwallis",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q076",
    "source_question_number": 76,
    "category": "INDIAN CULTURE",
    "question_text": "The rock cut temples of Mahabalipuram and the temples of Kanchipuram are the achievements of the ________ rulers.",
    "option_a": "Pallava",
    "option_b": "Chola",
    "option_c": "Hoyasala",
    "option_d": "Vijayanagar",
    "correct_option": "A",
    "correct_answer": "Pallava",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q077",
    "source_question_number": 77,
    "category": "INDIAN CULTURE",
    "question_text": "Kumbh Mela is held in every ___ years",
    "option_a": "12",
    "option_b": "10",
    "option_c": "9",
    "option_d": "6",
    "correct_option": "A",
    "correct_answer": "12",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q078",
    "source_question_number": 78,
    "category": "INDIAN CULTURE",
    "question_text": "Which of the musical instruments are of Indo-Islamic origin?",
    "option_a": "Sitar, Table and Shehnai",
    "option_b": "Sitar, Tabla and Sarangi",
    "option_c": "Sitar, Sarangi and Shehnai",
    "option_d": "Sarangi, Tabla and Shehnai",
    "correct_option": "B",
    "correct_answer": "Sitar, Tabla and Sarangi",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q079",
    "source_question_number": 79,
    "category": "INDIAN CULTURE",
    "question_text": "Which novel Rabindra Nath Tagore won the Noble Prize for?",
    "option_a": "Rajashi",
    "option_b": "Rupanjali",
    "option_c": "Gitanjali",
    "option_d": "Meghadutam",
    "correct_option": "C",
    "correct_answer": "Gitanjali",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q080",
    "source_question_number": 80,
    "category": "INDIAN CULTURE",
    "question_text": "Who has written famous novel \u2018Devdas\u2019?",
    "option_a": "Saratchandra Chattopadhyay",
    "option_b": "Rabindranath Tagore",
    "option_c": "Samudra Gupta",
    "option_d": "Bankim Chandra Chattopadhyay",
    "correct_option": "A",
    "correct_answer": "Saratchandra Chattopadhyay",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q081",
    "source_question_number": 81,
    "category": "INDIAN CULTURE",
    "question_text": "\u2018Panchatantra\u2019 is originally written by _____________.",
    "option_a": "Kalidas",
    "option_b": "Vishnu Sharma",
    "option_c": "Tulsi Das",
    "option_d": "None of the above",
    "correct_option": "B",
    "correct_answer": "Vishnu Sharma",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q082",
    "source_question_number": 82,
    "category": "INDIAN CULTURE",
    "question_text": "Which Veda Sanskrit literature has begun from?",
    "option_a": "Yajur Veda",
    "option_b": "Atharva Veda",
    "option_c": "Sam Veda",
    "option_d": "Rig Veda",
    "correct_option": "D",
    "correct_answer": "Rig Veda",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q083",
    "source_question_number": 83,
    "category": "INDIAN CULTURE",
    "question_text": "Which musical instrument is Goddess Saraswathi associated with?",
    "option_a": "Conch",
    "option_b": "Damru",
    "option_c": "Ektara",
    "option_d": "Veena",
    "correct_option": "D",
    "correct_answer": "Veena",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q084",
    "source_question_number": 84,
    "category": "INDIAN CULTURE",
    "question_text": "Which musical instrument is Lord Shiva associated with?",
    "option_a": "Conch",
    "option_b": "Damru",
    "option_c": "Ektara",
    "option_d": "Flute",
    "correct_option": "B",
    "correct_answer": "Damru",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q085",
    "source_question_number": 85,
    "category": "INDIAN CULTURE",
    "question_text": "Which musical instrument is Lord Vishnu associated with?",
    "option_a": "Conch",
    "option_b": "Ektara",
    "option_c": "Flute",
    "option_d": "Garmon",
    "correct_option": "A",
    "correct_answer": "Conch",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q086",
    "source_question_number": 86,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "2.Which Indian tennis player won his maiden World Table Tennis (WTT) men\u2019s singles title at the WTT Feeder Olomouc 2026?",
    "option_a": "Akash Pal",
    "option_b": "Ankur Bhattacharjee",
    "option_c": "Deni Kozul",
    "option_d": "Sharath Kamal",
    "correct_option": "B",
    "correct_answer": "Ankur Bhattacharjee",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q087",
    "source_question_number": 87,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "What is the theme of the 11th Vibrant Gujarat Global Summit 2027?",
    "option_a": "Gujarat: Gateway to Global Growth",
    "option_b": "Viksit Gujarat \u2013 Shaping Global Future",
    "option_c": "Gujarat: Growth and Innovation",
    "option_d": "Viksit Bharat \u2013 Global Gujarat",
    "correct_option": "B",
    "correct_answer": "Viksit Gujarat \u2013 Shaping Global Future",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q088",
    "source_question_number": 88,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which space telescope was recently launched by NASA to study black holes, exoplanets and exploding stars?",
    "option_a": "James Webb Space Telescope",
    "option_b": "Nancy Grace Roman Space Telescope",
    "option_c": "Chandra X-ray Observatory",
    "option_d": "Hubble Space Telescope",
    "correct_option": "B",
    "correct_answer": "Nancy Grace Roman Space Telescope",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q089",
    "source_question_number": 89,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Who has been re-appointed as the Attorney General of India in September 2025?",
    "option_a": "K.K. Venugopal",
    "option_b": "Mukul Saini",
    "option_c": "R. Venkataramani",
    "option_d": "Vikram Singh",
    "correct_option": "C",
    "correct_answer": "R. Venkataramani",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q090",
    "source_question_number": 90,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Who received the Tamil Nadu Government\u2019s Scientist Award in Environmental Science for 2022?",
    "option_a": "R. Arthur James",
    "option_b": "R. Sakthi Krishnan",
    "option_c": "E. Sundaravalli",
    "option_d": "M. P. Saminathan",
    "correct_option": "A",
    "correct_answer": "R. Arthur James",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q091",
    "source_question_number": 91,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Who won the 2025 Nobel Prize in Literature?",
    "option_a": "Han Kang",
    "option_b": "L\xE1szl\xF3 Krasznahorkai",
    "option_c": "Olga Tokarczuk",
    "option_d": "Peter Handke",
    "correct_option": "B",
    "correct_answer": "L\xE1szl\xF3 Krasznahorkai",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q092",
    "source_question_number": 92,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which Indian national park director has received the Kenton R. Miller Award 2025?",
    "option_a": "Gir National Park",
    "option_b": "Sundarbans National Park",
    "option_c": "Kaziranga National Park",
    "option_d": "Jim Corbett National Park",
    "correct_option": "C",
    "correct_answer": "Kaziranga National Park",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q093",
    "source_question_number": 93,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which state government has approved the Building and Management of Aviation Assets and Network (B-MAAN) scheme in October 2025?",
    "option_a": "Haryana",
    "option_b": "Jharkhand",
    "option_c": "Odisha",
    "option_d": "Gujarat",
    "correct_option": "C",
    "correct_answer": "Odisha",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q094",
    "source_question_number": 94,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "The National Technical Textiles Mission (NTTM) is an initiative of which ministry?",
    "option_a": "Ministry of Science and Technology",
    "option_b": "Ministry of Textiles",
    "option_c": "Ministry of Commerce and Industry",
    "option_d": "Ministry of Micro, Small and Medium Enterprises",
    "correct_option": "B",
    "correct_answer": "Ministry of Textiles",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q095",
    "source_question_number": 95,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which ancient port city in Tamil Nadu was famously known as the gateway to Roman trade?",
    "option_a": "Uraiyur",
    "option_b": "Kanchipuram",
    "option_c": "Puhar (Kaveripattinam)",
    "option_d": "Madurai",
    "correct_option": "C",
    "correct_answer": "Puhar (Kaveripattinam)",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q096",
    "source_question_number": 96,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which Pallava ruler is credited with introducing rock-cut architecture at Mahabalipuram?",
    "option_a": "Mahendravarman I",
    "option_b": "Narasimhavarman II",
    "option_c": "Simhavishnu",
    "option_d": "Nandivarman II",
    "correct_option": "A",
    "correct_answer": "Mahendravarman I",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q097",
    "source_question_number": 97,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which Tamil saint is renowned for composing the devotional hymns collectively known as the \u201CTiruvachakam\u201D?",
    "option_a": "Sundarar",
    "option_b": "Thirugnana Sambandar",
    "option_c": "Appar",
    "option_d": "Manikkavacakar",
    "correct_option": "D",
    "correct_answer": "Manikkavacakar",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q098",
    "source_question_number": 98,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Who led the Salt Satyagraha at Vedaranyam in Tamil Nadu in 1930?",
    "option_a": "C. Rajagopalachari",
    "option_b": "Subramania Bharati",
    "option_c": "V. O. Chidambaram Pillai",
    "option_d": "Thiruppur Kumaran",
    "correct_option": "A",
    "correct_answer": "C. Rajagopalachari",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q099",
    "source_question_number": 99,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which river in Tamil Nadu flows entirely within the state and empties into the Bay of Bengal near Cuddalore?",
    "option_a": "Palar",
    "option_b": "Vaigai",
    "option_c": "Vellar",
    "option_d": "Thamirabarani",
    "correct_option": "C",
    "correct_answer": "Vellar",
    "difficulty": "",
    "explanation": ""
  },
  {
    "question_id": "Q100",
    "source_question_number": 100,
    "category": "CURRENT AFFIRS-2026",
    "question_text": "Which state has become the first in India to eradicate extreme poverty?",
    "option_a": "Andhra Pradesh",
    "option_b": "Tamil Nadu",
    "option_c": "Kerala",
    "option_d": "Maharashtra",
    "correct_option": "C",
    "correct_answer": "Kerala",
    "difficulty": "",
    "explanation": ""
  }
];
var quiz_questions_100_default = data;

// src/server/data/adminStore.ts
import { eq as eq4, desc } from "drizzle-orm";

// src/server/data/round2_questions_50.ts
var data2 = [
  {
    "questionId": "R2Q001",
    "questionNumber": 1,
    "questionText": "Which logo belongs to the company behind the iPhone?",
    "correctLogoId": "L001",
    "correctTileNumber": 1,
    "correctBrandName": "Apple",
    "options": [
      {
        "optionId": "opt_1_A",
        "logoId": "L001",
        "tileNumber": 1,
        "brandName": "Apple",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/001.svg",
        "pngUrl": "/logos/001.png"
      },
      {
        "optionId": "opt_1_B",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_1_C",
        "logoId": "L002",
        "tileNumber": 2,
        "brandName": "Google",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/002.svg",
        "pngUrl": "/logos/002.png"
      },
      {
        "optionId": "opt_1_D",
        "logoId": "L051",
        "tileNumber": 51,
        "brandName": "Cloudflare",
        "category": "Cloud & Security",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/051.svg",
        "pngUrl": "/logos/051.png"
      }
    ]
  },
  {
    "questionId": "R2Q002",
    "questionNumber": 2,
    "questionText": "Which logo represents the search engine known for its colorful G?",
    "correctLogoId": "L002",
    "correctTileNumber": 2,
    "correctBrandName": "Google",
    "options": [
      {
        "optionId": "opt_2_A",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_2_B",
        "logoId": "L019",
        "tileNumber": 19,
        "brandName": "Google Chrome",
        "category": "Browser & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/019.svg",
        "pngUrl": "/logos/019.png"
      },
      {
        "optionId": "opt_2_C",
        "logoId": "L002",
        "tileNumber": 2,
        "brandName": "Google",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/002.svg",
        "pngUrl": "/logos/002.png"
      },
      {
        "optionId": "opt_2_D",
        "logoId": "L052",
        "tileNumber": 52,
        "brandName": "React",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/052.svg",
        "pngUrl": "/logos/052.png"
      }
    ]
  },
  {
    "questionId": "R2Q003",
    "questionNumber": 3,
    "questionText": "Which logo belongs to the company that makes Windows?",
    "correctLogoId": "L003",
    "correctTileNumber": 3,
    "correctBrandName": "Microsoft",
    "options": [
      {
        "optionId": "opt_3_A",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_3_B",
        "logoId": "L053",
        "tileNumber": 53,
        "brandName": "Angular",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/053.svg",
        "pngUrl": "/logos/053.png"
      },
      {
        "optionId": "opt_3_C",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_3_D",
        "logoId": "L021",
        "tileNumber": 21,
        "brandName": "Windows",
        "category": "Operating Systems",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/021.svg",
        "pngUrl": "/logos/021.png"
      }
    ]
  },
  {
    "questionId": "R2Q004",
    "questionNumber": 4,
    "questionText": "Which logo is associated with the online shopping company known for its smile-shaped arrow?",
    "correctLogoId": "L004",
    "correctTileNumber": 4,
    "correctBrandName": "Amazon",
    "options": [
      {
        "optionId": "opt_4_A",
        "logoId": "L031",
        "tileNumber": 31,
        "brandName": "eBay",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/031.svg",
        "pngUrl": "/logos/031.png"
      },
      {
        "optionId": "opt_4_B",
        "logoId": "L033",
        "tileNumber": 33,
        "brandName": "Shopify",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/033.svg",
        "pngUrl": "/logos/033.png"
      },
      {
        "optionId": "opt_4_C",
        "logoId": "L004",
        "tileNumber": 4,
        "brandName": "Amazon",
        "category": "Technology & Commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/004.svg",
        "pngUrl": "/logos/004.png"
      },
      {
        "optionId": "opt_4_D",
        "logoId": "L054",
        "tileNumber": 54,
        "brandName": "Vue.js",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/054.svg",
        "pngUrl": "/logos/054.png"
      }
    ]
  },
  {
    "questionId": "R2Q005",
    "questionNumber": 5,
    "questionText": "Which logo belongs to the company that owns Instagram and WhatsApp?",
    "correctLogoId": "L005",
    "correctTileNumber": 5,
    "correctBrandName": "Meta",
    "options": [
      {
        "optionId": "opt_5_A",
        "logoId": "L005",
        "tileNumber": 5,
        "brandName": "Meta",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/005.svg",
        "pngUrl": "/logos/005.png"
      },
      {
        "optionId": "opt_5_B",
        "logoId": "L006",
        "tileNumber": 6,
        "brandName": "Facebook",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/006.svg",
        "pngUrl": "/logos/006.png"
      },
      {
        "optionId": "opt_5_C",
        "logoId": "L055",
        "tileNumber": 55,
        "brandName": "Node.js",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/055.svg",
        "pngUrl": "/logos/055.png"
      },
      {
        "optionId": "opt_5_D",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      }
    ]
  },
  {
    "questionId": "R2Q006",
    "questionNumber": 6,
    "questionText": 'Which logo represents the social network that uses a blue "f"?',
    "correctLogoId": "L006",
    "correctTileNumber": 6,
    "correctBrandName": "Facebook",
    "options": [
      {
        "optionId": "opt_6_A",
        "logoId": "L006",
        "tileNumber": 6,
        "brandName": "Facebook",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/006.svg",
        "pngUrl": "/logos/006.png"
      },
      {
        "optionId": "opt_6_B",
        "logoId": "L015",
        "tileNumber": 15,
        "brandName": "Reddit",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/015.svg",
        "pngUrl": "/logos/015.png"
      },
      {
        "optionId": "opt_6_C",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_6_D",
        "logoId": "L056",
        "tileNumber": 56,
        "brandName": "Python",
        "category": "Programming",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/056.svg",
        "pngUrl": "/logos/056.png"
      }
    ]
  },
  {
    "questionId": "R2Q007",
    "questionNumber": 7,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L007",
    "correctTileNumber": 7,
    "correctBrandName": "Instagram",
    "options": [
      {
        "optionId": "opt_7_A",
        "logoId": "L057",
        "tileNumber": 57,
        "brandName": "Java",
        "category": "Programming",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/057.svg",
        "pngUrl": "/logos/057.png"
      },
      {
        "optionId": "opt_7_B",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_7_C",
        "logoId": "L012",
        "tileNumber": 12,
        "brandName": "Snapchat",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/012.svg",
        "pngUrl": "/logos/012.png"
      },
      {
        "optionId": "opt_7_D",
        "logoId": "L006",
        "tileNumber": 6,
        "brandName": "Facebook",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/006.svg",
        "pngUrl": "/logos/006.png"
      }
    ]
  },
  {
    "questionId": "R2Q008",
    "questionNumber": 8,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L008",
    "correctTileNumber": 8,
    "correctBrandName": "YouTube",
    "options": [
      {
        "optionId": "opt_8_A",
        "logoId": "L008",
        "tileNumber": 8,
        "brandName": "YouTube",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/008.svg",
        "pngUrl": "/logos/008.png"
      },
      {
        "optionId": "opt_8_B",
        "logoId": "L039",
        "tileNumber": 39,
        "brandName": "SoundCloud",
        "category": "Music & Audio",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/039.svg",
        "pngUrl": "/logos/039.png"
      },
      {
        "optionId": "opt_8_C",
        "logoId": "L058",
        "tileNumber": 58,
        "brandName": "Raspberry Pi",
        "category": "Hardware & Education",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/058.svg",
        "pngUrl": "/logos/058.png"
      },
      {
        "optionId": "opt_8_D",
        "logoId": "L030",
        "tileNumber": 30,
        "brandName": "Twitch",
        "category": "Gaming & Streaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/030.svg",
        "pngUrl": "/logos/030.png"
      }
    ]
  },
  {
    "questionId": "R2Q009",
    "questionNumber": 9,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L009",
    "correctTileNumber": 9,
    "correctBrandName": "WhatsApp",
    "options": [
      {
        "optionId": "opt_9_A",
        "logoId": "L014",
        "tileNumber": 14,
        "brandName": "Discord",
        "category": "Communication & Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/014.svg",
        "pngUrl": "/logos/014.png"
      },
      {
        "optionId": "opt_9_B",
        "logoId": "L059",
        "tileNumber": 59,
        "brandName": "Bluetooth",
        "category": "Technology Standard",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/059.svg",
        "pngUrl": "/logos/059.png"
      },
      {
        "optionId": "opt_9_C",
        "logoId": "L009",
        "tileNumber": 9,
        "brandName": "WhatsApp",
        "category": "Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/009.svg",
        "pngUrl": "/logos/009.png"
      },
      {
        "optionId": "opt_9_D",
        "logoId": "L013",
        "tileNumber": 13,
        "brandName": "Telegram",
        "category": "Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/013.svg",
        "pngUrl": "/logos/013.png"
      }
    ]
  },
  {
    "questionId": "R2Q010",
    "questionNumber": 10,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L010",
    "correctTileNumber": 10,
    "correctBrandName": "Spotify",
    "options": [
      {
        "optionId": "opt_10_A",
        "logoId": "L060",
        "tileNumber": 60,
        "brandName": "USB",
        "category": "Technology Standard",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/060.svg",
        "pngUrl": "/logos/060.png"
      },
      {
        "optionId": "opt_10_B",
        "logoId": "L010",
        "tileNumber": 10,
        "brandName": "Spotify",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/010.svg",
        "pngUrl": "/logos/010.png"
      },
      {
        "optionId": "opt_10_C",
        "logoId": "L039",
        "tileNumber": 39,
        "brandName": "SoundCloud",
        "category": "Music & Audio",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/039.svg",
        "pngUrl": "/logos/039.png"
      },
      {
        "optionId": "opt_10_D",
        "logoId": "L008",
        "tileNumber": 8,
        "brandName": "YouTube",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/008.svg",
        "pngUrl": "/logos/008.png"
      }
    ]
  },
  {
    "questionId": "R2Q011",
    "questionNumber": 11,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L011",
    "correctTileNumber": 11,
    "correctBrandName": "TikTok",
    "options": [
      {
        "optionId": "opt_11_A",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_11_B",
        "logoId": "L012",
        "tileNumber": 12,
        "brandName": "Snapchat",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/012.svg",
        "pngUrl": "/logos/012.png"
      },
      {
        "optionId": "opt_11_C",
        "logoId": "L061",
        "tileNumber": 61,
        "brandName": "Figma",
        "category": "Design & Creative",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/061.svg",
        "pngUrl": "/logos/061.png"
      },
      {
        "optionId": "opt_11_D",
        "logoId": "L011",
        "tileNumber": 11,
        "brandName": "TikTok",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/011.svg",
        "pngUrl": "/logos/011.png"
      }
    ]
  },
  {
    "questionId": "R2Q012",
    "questionNumber": 12,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L012",
    "correctTileNumber": 12,
    "correctBrandName": "Snapchat",
    "options": [
      {
        "optionId": "opt_12_A",
        "logoId": "L012",
        "tileNumber": 12,
        "brandName": "Snapchat",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/012.svg",
        "pngUrl": "/logos/012.png"
      },
      {
        "optionId": "opt_12_B",
        "logoId": "L011",
        "tileNumber": 11,
        "brandName": "TikTok",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/011.svg",
        "pngUrl": "/logos/011.png"
      },
      {
        "optionId": "opt_12_C",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_12_D",
        "logoId": "L062",
        "tileNumber": 62,
        "brandName": "Behance",
        "category": "Design & Creative",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/062.svg",
        "pngUrl": "/logos/062.png"
      }
    ]
  },
  {
    "questionId": "R2Q013",
    "questionNumber": 13,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L013",
    "correctTileNumber": 13,
    "correctBrandName": "Telegram",
    "options": [
      {
        "optionId": "opt_13_A",
        "logoId": "L063",
        "tileNumber": 63,
        "brandName": "Dribbble",
        "category": "Design & Creative",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/063.svg",
        "pngUrl": "/logos/063.png"
      },
      {
        "optionId": "opt_13_B",
        "logoId": "L009",
        "tileNumber": 9,
        "brandName": "WhatsApp",
        "category": "Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/009.svg",
        "pngUrl": "/logos/009.png"
      },
      {
        "optionId": "opt_13_C",
        "logoId": "L013",
        "tileNumber": 13,
        "brandName": "Telegram",
        "category": "Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/013.svg",
        "pngUrl": "/logos/013.png"
      },
      {
        "optionId": "opt_13_D",
        "logoId": "L014",
        "tileNumber": 14,
        "brandName": "Discord",
        "category": "Communication & Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/014.svg",
        "pngUrl": "/logos/014.png"
      }
    ]
  },
  {
    "questionId": "R2Q014",
    "questionNumber": 14,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L014",
    "correctTileNumber": 14,
    "correctBrandName": "Discord",
    "options": [
      {
        "optionId": "opt_14_A",
        "logoId": "L030",
        "tileNumber": 30,
        "brandName": "Twitch",
        "category": "Gaming & Streaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/030.svg",
        "pngUrl": "/logos/030.png"
      },
      {
        "optionId": "opt_14_B",
        "logoId": "L028",
        "tileNumber": 28,
        "brandName": "Xbox",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/028.svg",
        "pngUrl": "/logos/028.png"
      },
      {
        "optionId": "opt_14_C",
        "logoId": "L014",
        "tileNumber": 14,
        "brandName": "Discord",
        "category": "Communication & Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/014.svg",
        "pngUrl": "/logos/014.png"
      },
      {
        "optionId": "opt_14_D",
        "logoId": "L064",
        "tileNumber": 64,
        "brandName": "Vimeo",
        "category": "Media & Entertainment",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/064.svg",
        "pngUrl": "/logos/064.png"
      }
    ]
  },
  {
    "questionId": "R2Q015",
    "questionNumber": 15,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L015",
    "correctTileNumber": 15,
    "correctBrandName": "Reddit",
    "options": [
      {
        "optionId": "opt_15_A",
        "logoId": "L065",
        "tileNumber": 65,
        "brandName": "Deezer",
        "category": "Music & Audio",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/065.svg",
        "pngUrl": "/logos/065.png"
      },
      {
        "optionId": "opt_15_B",
        "logoId": "L018",
        "tileNumber": 18,
        "brandName": "X / Twitter",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/018.svg",
        "pngUrl": "/logos/018.png"
      },
      {
        "optionId": "opt_15_C",
        "logoId": "L015",
        "tileNumber": 15,
        "brandName": "Reddit",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/015.svg",
        "pngUrl": "/logos/015.png"
      },
      {
        "optionId": "opt_15_D",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      }
    ]
  },
  {
    "questionId": "R2Q016",
    "questionNumber": 16,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L016",
    "correctTileNumber": 16,
    "correctBrandName": "LinkedIn",
    "options": [
      {
        "optionId": "opt_16_A",
        "logoId": "L017",
        "tileNumber": 17,
        "brandName": "GitHub",
        "category": "Developer & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/017.svg",
        "pngUrl": "/logos/017.png"
      },
      {
        "optionId": "opt_16_B",
        "logoId": "L016",
        "tileNumber": 16,
        "brandName": "LinkedIn",
        "category": "Professional & Social",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/016.svg",
        "pngUrl": "/logos/016.png"
      },
      {
        "optionId": "opt_16_C",
        "logoId": "L066",
        "tileNumber": 66,
        "brandName": "Audible",
        "category": "Media & Books",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/066.svg",
        "pngUrl": "/logos/066.png"
      },
      {
        "optionId": "opt_16_D",
        "logoId": "L006",
        "tileNumber": 6,
        "brandName": "Facebook",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/006.svg",
        "pngUrl": "/logos/006.png"
      }
    ]
  },
  {
    "questionId": "R2Q017",
    "questionNumber": 17,
    "questionText": "Which logo represents the developer platform where many programmers store code repositories?",
    "correctLogoId": "L017",
    "correctTileNumber": 17,
    "correctBrandName": "GitHub",
    "options": [
      {
        "optionId": "opt_17_A",
        "logoId": "L017",
        "tileNumber": 17,
        "brandName": "GitHub",
        "category": "Developer & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/017.svg",
        "pngUrl": "/logos/017.png"
      },
      {
        "optionId": "opt_17_B",
        "logoId": "L067",
        "tileNumber": 67,
        "brandName": "Goodreads",
        "category": "Books & Knowledge",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/067.svg",
        "pngUrl": "/logos/067.png"
      },
      {
        "optionId": "opt_17_C",
        "logoId": "L047",
        "tileNumber": 47,
        "brandName": "GitLab",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/047.svg",
        "pngUrl": "/logos/047.png"
      },
      {
        "optionId": "opt_17_D",
        "logoId": "L048",
        "tileNumber": 48,
        "brandName": "Stack Overflow",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/048.svg",
        "pngUrl": "/logos/048.png"
      }
    ]
  },
  {
    "questionId": "R2Q018",
    "questionNumber": 18,
    "questionText": "Which logo represents the social platform formerly known as Twitter?",
    "correctLogoId": "L018",
    "correctTileNumber": 18,
    "correctBrandName": "X / Twitter",
    "options": [
      {
        "optionId": "opt_18_A",
        "logoId": "L015",
        "tileNumber": 15,
        "brandName": "Reddit",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/015.svg",
        "pngUrl": "/logos/015.png"
      },
      {
        "optionId": "opt_18_B",
        "logoId": "L006",
        "tileNumber": 6,
        "brandName": "Facebook",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/006.svg",
        "pngUrl": "/logos/006.png"
      },
      {
        "optionId": "opt_18_C",
        "logoId": "L018",
        "tileNumber": 18,
        "brandName": "X / Twitter",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/018.svg",
        "pngUrl": "/logos/018.png"
      },
      {
        "optionId": "opt_18_D",
        "logoId": "L068",
        "tileNumber": 68,
        "brandName": "Patreon",
        "category": "Creator Economy",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/068.svg",
        "pngUrl": "/logos/068.png"
      }
    ]
  },
  {
    "questionId": "R2Q019",
    "questionNumber": 19,
    "questionText": "Which logo represents the web browser from Google?",
    "correctLogoId": "L019",
    "correctTileNumber": 19,
    "correctBrandName": "Google Chrome",
    "options": [
      {
        "optionId": "opt_19_A",
        "logoId": "L069",
        "tileNumber": 69,
        "brandName": "Kickstarter",
        "category": "Crowdfunding",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/069.svg",
        "pngUrl": "/logos/069.png"
      },
      {
        "optionId": "opt_19_B",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_19_C",
        "logoId": "L019",
        "tileNumber": 19,
        "brandName": "Google Chrome",
        "category": "Browser & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/019.svg",
        "pngUrl": "/logos/019.png"
      },
      {
        "optionId": "opt_19_D",
        "logoId": "L041",
        "tileNumber": 41,
        "brandName": "Mozilla Firefox",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/041.svg",
        "pngUrl": "/logos/041.png"
      }
    ]
  },
  {
    "questionId": "R2Q020",
    "questionNumber": 20,
    "questionText": "Which logo represents Google's mobile operating system?",
    "correctLogoId": "L020",
    "correctTileNumber": 20,
    "correctBrandName": "Android",
    "options": [
      {
        "optionId": "opt_20_A",
        "logoId": "L070",
        "tileNumber": 70,
        "brandName": "Quora",
        "category": "Knowledge & Social",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/070.svg",
        "pngUrl": "/logos/070.png"
      },
      {
        "optionId": "opt_20_B",
        "logoId": "L044",
        "tileNumber": 44,
        "brandName": "Linux",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/044.svg",
        "pngUrl": "/logos/044.png"
      },
      {
        "optionId": "opt_20_C",
        "logoId": "L020",
        "tileNumber": 20,
        "brandName": "Android",
        "category": "Operating Systems",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/020.svg",
        "pngUrl": "/logos/020.png"
      },
      {
        "optionId": "opt_20_D",
        "logoId": "L021",
        "tileNumber": 21,
        "brandName": "Windows",
        "category": "Operating Systems",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/021.svg",
        "pngUrl": "/logos/021.png"
      }
    ]
  },
  {
    "questionId": "R2Q021",
    "questionNumber": 21,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L021",
    "correctTileNumber": 21,
    "correctBrandName": "Windows",
    "options": [
      {
        "optionId": "opt_21_A",
        "logoId": "L020",
        "tileNumber": 20,
        "brandName": "Android",
        "category": "Operating Systems",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/020.svg",
        "pngUrl": "/logos/020.png"
      },
      {
        "optionId": "opt_21_B",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_21_C",
        "logoId": "L021",
        "tileNumber": 21,
        "brandName": "Windows",
        "category": "Operating Systems",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/021.svg",
        "pngUrl": "/logos/021.png"
      },
      {
        "optionId": "opt_21_D",
        "logoId": "L071",
        "tileNumber": 71,
        "brandName": "Medium",
        "category": "Publishing",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/071.svg",
        "pngUrl": "/logos/071.png"
      }
    ]
  },
  {
    "questionId": "R2Q022",
    "questionNumber": 22,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L022",
    "correctTileNumber": 22,
    "correctBrandName": "PayPal",
    "options": [
      {
        "optionId": "opt_22_A",
        "logoId": "L022",
        "tileNumber": 22,
        "brandName": "PayPal",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/022.svg",
        "pngUrl": "/logos/022.png"
      },
      {
        "optionId": "opt_22_B",
        "logoId": "L024",
        "tileNumber": 24,
        "brandName": "Mastercard",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/024.svg",
        "pngUrl": "/logos/024.png"
      },
      {
        "optionId": "opt_22_C",
        "logoId": "L072",
        "tileNumber": 72,
        "brandName": "Stripe",
        "category": "Finance & Payments",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/072.svg",
        "pngUrl": "/logos/072.png"
      },
      {
        "optionId": "opt_22_D",
        "logoId": "L023",
        "tileNumber": 23,
        "brandName": "Visa",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/023.svg",
        "pngUrl": "/logos/023.png"
      }
    ]
  },
  {
    "questionId": "R2Q023",
    "questionNumber": 23,
    "questionText": "Which logo is a card-network brand used for electronic payments?",
    "correctLogoId": "L023",
    "correctTileNumber": 23,
    "correctBrandName": "Visa",
    "options": [
      {
        "optionId": "opt_23_A",
        "logoId": "L073",
        "tileNumber": 73,
        "brandName": "Apple Pay",
        "category": "Finance & Payments",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/073.svg",
        "pngUrl": "/logos/073.png"
      },
      {
        "optionId": "opt_23_B",
        "logoId": "L023",
        "tileNumber": 23,
        "brandName": "Visa",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/023.svg",
        "pngUrl": "/logos/023.png"
      },
      {
        "optionId": "opt_23_C",
        "logoId": "L022",
        "tileNumber": 22,
        "brandName": "PayPal",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/022.svg",
        "pngUrl": "/logos/022.png"
      },
      {
        "optionId": "opt_23_D",
        "logoId": "L024",
        "tileNumber": 24,
        "brandName": "Mastercard",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/024.svg",
        "pngUrl": "/logos/024.png"
      }
    ]
  },
  {
    "questionId": "R2Q024",
    "questionNumber": 24,
    "questionText": "Which logo is another major card-network brand used for payments?",
    "correctLogoId": "L024",
    "correctTileNumber": 24,
    "correctBrandName": "Mastercard",
    "options": [
      {
        "optionId": "opt_24_A",
        "logoId": "L022",
        "tileNumber": 22,
        "brandName": "PayPal",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/022.svg",
        "pngUrl": "/logos/022.png"
      },
      {
        "optionId": "opt_24_B",
        "logoId": "L074",
        "tileNumber": 74,
        "brandName": "Google Pay",
        "category": "Finance & Payments",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/074.svg",
        "pngUrl": "/logos/074.png"
      },
      {
        "optionId": "opt_24_C",
        "logoId": "L024",
        "tileNumber": 24,
        "brandName": "Mastercard",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/024.svg",
        "pngUrl": "/logos/024.png"
      },
      {
        "optionId": "opt_24_D",
        "logoId": "L023",
        "tileNumber": 23,
        "brandName": "Visa",
        "category": "Finance & Payments",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/023.svg",
        "pngUrl": "/logos/023.png"
      }
    ]
  },
  {
    "questionId": "R2Q025",
    "questionNumber": 25,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L025",
    "correctTileNumber": 25,
    "correctBrandName": "Uber",
    "options": [
      {
        "optionId": "opt_25_A",
        "logoId": "L025",
        "tileNumber": 25,
        "brandName": "Uber",
        "category": "Travel & Mobility",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/025.svg",
        "pngUrl": "/logos/025.png"
      },
      {
        "optionId": "opt_25_B",
        "logoId": "L026",
        "tileNumber": 26,
        "brandName": "Airbnb",
        "category": "Travel & Hospitality",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/026.svg",
        "pngUrl": "/logos/026.png"
      },
      {
        "optionId": "opt_25_C",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_25_D",
        "logoId": "L075",
        "tileNumber": 75,
        "brandName": "Bitcoin",
        "category": "Finance & Crypto",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/075.svg",
        "pngUrl": "/logos/075.png"
      }
    ]
  },
  {
    "questionId": "R2Q026",
    "questionNumber": 26,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L026",
    "correctTileNumber": 26,
    "correctBrandName": "Airbnb",
    "options": [
      {
        "optionId": "opt_26_A",
        "logoId": "L076",
        "tileNumber": 76,
        "brandName": "Ethereum",
        "category": "Finance & Crypto",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/076.svg",
        "pngUrl": "/logos/076.png"
      },
      {
        "optionId": "opt_26_B",
        "logoId": "L026",
        "tileNumber": 26,
        "brandName": "Airbnb",
        "category": "Travel & Hospitality",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/026.svg",
        "pngUrl": "/logos/026.png"
      },
      {
        "optionId": "opt_26_C",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_26_D",
        "logoId": "L025",
        "tileNumber": 25,
        "brandName": "Uber",
        "category": "Travel & Mobility",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/025.svg",
        "pngUrl": "/logos/025.png"
      }
    ]
  },
  {
    "questionId": "R2Q027",
    "questionNumber": 27,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L027",
    "correctTileNumber": 27,
    "correctBrandName": "PlayStation",
    "options": [
      {
        "optionId": "opt_27_A",
        "logoId": "L077",
        "tileNumber": 77,
        "brandName": "Lyft",
        "category": "Travel & Mobility",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/077.svg",
        "pngUrl": "/logos/077.png"
      },
      {
        "optionId": "opt_27_B",
        "logoId": "L028",
        "tileNumber": 28,
        "brandName": "Xbox",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/028.svg",
        "pngUrl": "/logos/028.png"
      },
      {
        "optionId": "opt_27_C",
        "logoId": "L029",
        "tileNumber": 29,
        "brandName": "Steam",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/029.svg",
        "pngUrl": "/logos/029.png"
      },
      {
        "optionId": "opt_27_D",
        "logoId": "L027",
        "tileNumber": 27,
        "brandName": "PlayStation",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/027.svg",
        "pngUrl": "/logos/027.png"
      }
    ]
  },
  {
    "questionId": "R2Q028",
    "questionNumber": 28,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L028",
    "correctTileNumber": 28,
    "correctBrandName": "Xbox",
    "options": [
      {
        "optionId": "opt_28_A",
        "logoId": "L028",
        "tileNumber": 28,
        "brandName": "Xbox",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/028.svg",
        "pngUrl": "/logos/028.png"
      },
      {
        "optionId": "opt_28_B",
        "logoId": "L078",
        "tileNumber": 78,
        "brandName": "Waze",
        "category": "Travel & Mobility",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/078.svg",
        "pngUrl": "/logos/078.png"
      },
      {
        "optionId": "opt_28_C",
        "logoId": "L029",
        "tileNumber": 29,
        "brandName": "Steam",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/029.svg",
        "pngUrl": "/logos/029.png"
      },
      {
        "optionId": "opt_28_D",
        "logoId": "L027",
        "tileNumber": 27,
        "brandName": "PlayStation",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/027.svg",
        "pngUrl": "/logos/027.png"
      }
    ]
  },
  {
    "questionId": "R2Q029",
    "questionNumber": 29,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L029",
    "correctTileNumber": 29,
    "correctBrandName": "Steam",
    "options": [
      {
        "optionId": "opt_29_A",
        "logoId": "L027",
        "tileNumber": 27,
        "brandName": "PlayStation",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/027.svg",
        "pngUrl": "/logos/027.png"
      },
      {
        "optionId": "opt_29_B",
        "logoId": "L029",
        "tileNumber": 29,
        "brandName": "Steam",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/029.svg",
        "pngUrl": "/logos/029.png"
      },
      {
        "optionId": "opt_29_C",
        "logoId": "L028",
        "tileNumber": 28,
        "brandName": "Xbox",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/028.svg",
        "pngUrl": "/logos/028.png"
      },
      {
        "optionId": "opt_29_D",
        "logoId": "L079",
        "tileNumber": 79,
        "brandName": "DHL",
        "category": "Logistics",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/079.svg",
        "pngUrl": "/logos/079.png"
      }
    ]
  },
  {
    "questionId": "R2Q030",
    "questionNumber": 30,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L030",
    "correctTileNumber": 30,
    "correctBrandName": "Twitch",
    "options": [
      {
        "optionId": "opt_30_A",
        "logoId": "L029",
        "tileNumber": 29,
        "brandName": "Steam",
        "category": "Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/029.svg",
        "pngUrl": "/logos/029.png"
      },
      {
        "optionId": "opt_30_B",
        "logoId": "L008",
        "tileNumber": 8,
        "brandName": "YouTube",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/008.svg",
        "pngUrl": "/logos/008.png"
      },
      {
        "optionId": "opt_30_C",
        "logoId": "L080",
        "tileNumber": 80,
        "brandName": "FedEx",
        "category": "Logistics",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/080.svg",
        "pngUrl": "/logos/080.png"
      },
      {
        "optionId": "opt_30_D",
        "logoId": "L030",
        "tileNumber": 30,
        "brandName": "Twitch",
        "category": "Gaming & Streaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/030.svg",
        "pngUrl": "/logos/030.png"
      }
    ]
  },
  {
    "questionId": "R2Q031",
    "questionNumber": 31,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L031",
    "correctTileNumber": 31,
    "correctBrandName": "eBay",
    "options": [
      {
        "optionId": "opt_31_A",
        "logoId": "L032",
        "tileNumber": 32,
        "brandName": "Etsy",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/032.svg",
        "pngUrl": "/logos/032.png"
      },
      {
        "optionId": "opt_31_B",
        "logoId": "L031",
        "tileNumber": 31,
        "brandName": "eBay",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/031.svg",
        "pngUrl": "/logos/031.png"
      },
      {
        "optionId": "opt_31_C",
        "logoId": "L081",
        "tileNumber": 81,
        "brandName": "UPS",
        "category": "Logistics",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/081.svg",
        "pngUrl": "/logos/081.png"
      },
      {
        "optionId": "opt_31_D",
        "logoId": "L033",
        "tileNumber": 33,
        "brandName": "Shopify",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/033.svg",
        "pngUrl": "/logos/033.png"
      }
    ]
  },
  {
    "questionId": "R2Q032",
    "questionNumber": 32,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L032",
    "correctTileNumber": 32,
    "correctBrandName": "Etsy",
    "options": [
      {
        "optionId": "opt_32_A",
        "logoId": "L082",
        "tileNumber": 82,
        "brandName": "Yelp",
        "category": "Food & Local Discovery",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/082.svg",
        "pngUrl": "/logos/082.png"
      },
      {
        "optionId": "opt_32_B",
        "logoId": "L031",
        "tileNumber": 31,
        "brandName": "eBay",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/031.svg",
        "pngUrl": "/logos/031.png"
      },
      {
        "optionId": "opt_32_C",
        "logoId": "L033",
        "tileNumber": 33,
        "brandName": "Shopify",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/033.svg",
        "pngUrl": "/logos/033.png"
      },
      {
        "optionId": "opt_32_D",
        "logoId": "L032",
        "tileNumber": 32,
        "brandName": "Etsy",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/032.svg",
        "pngUrl": "/logos/032.png"
      }
    ]
  },
  {
    "questionId": "R2Q033",
    "questionNumber": 33,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L033",
    "correctTileNumber": 33,
    "correctBrandName": "Shopify",
    "options": [
      {
        "optionId": "opt_33_A",
        "logoId": "L033",
        "tileNumber": 33,
        "brandName": "Shopify",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/033.svg",
        "pngUrl": "/logos/033.png"
      },
      {
        "optionId": "opt_33_B",
        "logoId": "L083",
        "tileNumber": 83,
        "brandName": "Untappd",
        "category": "Food & Beverage",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/083.svg",
        "pngUrl": "/logos/083.png"
      },
      {
        "optionId": "opt_33_C",
        "logoId": "L031",
        "tileNumber": 31,
        "brandName": "eBay",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/031.svg",
        "pngUrl": "/logos/031.png"
      },
      {
        "optionId": "opt_33_D",
        "logoId": "L032",
        "tileNumber": 32,
        "brandName": "Etsy",
        "category": "E-commerce",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/032.svg",
        "pngUrl": "/logos/032.png"
      }
    ]
  },
  {
    "questionId": "R2Q034",
    "questionNumber": 34,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L034",
    "correctTileNumber": 34,
    "correctBrandName": "Dropbox",
    "options": [
      {
        "optionId": "opt_34_A",
        "logoId": "L084",
        "tileNumber": 84,
        "brandName": "Strava",
        "category": "Sports & Fitness",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/084.svg",
        "pngUrl": "/logos/084.png"
      },
      {
        "optionId": "opt_34_B",
        "logoId": "L035",
        "tileNumber": 35,
        "brandName": "Slack",
        "category": "Productivity & Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/035.svg",
        "pngUrl": "/logos/035.png"
      },
      {
        "optionId": "opt_34_C",
        "logoId": "L034",
        "tileNumber": 34,
        "brandName": "Dropbox",
        "category": "Cloud & Productivity",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/034.svg",
        "pngUrl": "/logos/034.png"
      },
      {
        "optionId": "opt_34_D",
        "logoId": "L050",
        "tileNumber": 50,
        "brandName": "Amazon Web Services",
        "category": "Cloud Computing",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/050.svg",
        "pngUrl": "/logos/050.png"
      }
    ]
  },
  {
    "questionId": "R2Q035",
    "questionNumber": 35,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L035",
    "correctTileNumber": 35,
    "correctBrandName": "Slack",
    "options": [
      {
        "optionId": "opt_35_A",
        "logoId": "L014",
        "tileNumber": 14,
        "brandName": "Discord",
        "category": "Communication & Gaming",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/014.svg",
        "pngUrl": "/logos/014.png"
      },
      {
        "optionId": "opt_35_B",
        "logoId": "L035",
        "tileNumber": 35,
        "brandName": "Slack",
        "category": "Productivity & Communication",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/035.svg",
        "pngUrl": "/logos/035.png"
      },
      {
        "optionId": "opt_35_C",
        "logoId": "L085",
        "tileNumber": 85,
        "brandName": "Salesforce",
        "category": "Business Software",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/085.svg",
        "pngUrl": "/logos/085.png"
      },
      {
        "optionId": "opt_35_D",
        "logoId": "L034",
        "tileNumber": 34,
        "brandName": "Dropbox",
        "category": "Cloud & Productivity",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/034.svg",
        "pngUrl": "/logos/034.png"
      }
    ]
  },
  {
    "questionId": "R2Q036",
    "questionNumber": 36,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L036",
    "correctTileNumber": 36,
    "correctBrandName": "Pinterest",
    "options": [
      {
        "optionId": "opt_36_A",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_36_B",
        "logoId": "L015",
        "tileNumber": 15,
        "brandName": "Reddit",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/015.svg",
        "pngUrl": "/logos/015.png"
      },
      {
        "optionId": "opt_36_C",
        "logoId": "L036",
        "tileNumber": 36,
        "brandName": "Pinterest",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/036.svg",
        "pngUrl": "/logos/036.png"
      },
      {
        "optionId": "opt_36_D",
        "logoId": "L086",
        "tileNumber": 86,
        "brandName": "Atlassian",
        "category": "Business Software",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/086.svg",
        "pngUrl": "/logos/086.png"
      }
    ]
  },
  {
    "questionId": "R2Q037",
    "questionNumber": 37,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L037",
    "correctTileNumber": 37,
    "correctBrandName": "Wikipedia",
    "options": [
      {
        "optionId": "opt_37_A",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_37_B",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      },
      {
        "optionId": "opt_37_C",
        "logoId": "L087",
        "tileNumber": 87,
        "brandName": "Jira",
        "category": "Business Software",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/087.svg",
        "pngUrl": "/logos/087.png"
      },
      {
        "optionId": "opt_37_D",
        "logoId": "L037",
        "tileNumber": 37,
        "brandName": "Wikipedia",
        "category": "Knowledge & Education",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/037.svg",
        "pngUrl": "/logos/037.png"
      }
    ]
  },
  {
    "questionId": "R2Q038",
    "questionNumber": 38,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L038",
    "correctTileNumber": 38,
    "correctBrandName": "IMDb",
    "options": [
      {
        "optionId": "opt_38_A",
        "logoId": "L088",
        "tileNumber": 88,
        "brandName": "Confluence",
        "category": "Business Software",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/088.svg",
        "pngUrl": "/logos/088.png"
      },
      {
        "optionId": "opt_38_B",
        "logoId": "L008",
        "tileNumber": 8,
        "brandName": "YouTube",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/008.svg",
        "pngUrl": "/logos/008.png"
      },
      {
        "optionId": "opt_38_C",
        "logoId": "L038",
        "tileNumber": 38,
        "brandName": "IMDb",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/038.svg",
        "pngUrl": "/logos/038.png"
      },
      {
        "optionId": "opt_38_D",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      }
    ]
  },
  {
    "questionId": "R2Q039",
    "questionNumber": 39,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L039",
    "correctTileNumber": 39,
    "correctBrandName": "SoundCloud",
    "options": [
      {
        "optionId": "opt_39_A",
        "logoId": "L089",
        "tileNumber": 89,
        "brandName": "Trello",
        "category": "Productivity",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/089.svg",
        "pngUrl": "/logos/089.png"
      },
      {
        "optionId": "opt_39_B",
        "logoId": "L010",
        "tileNumber": 10,
        "brandName": "Spotify",
        "category": "Media & Entertainment",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/010.svg",
        "pngUrl": "/logos/010.png"
      },
      {
        "optionId": "opt_39_C",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_39_D",
        "logoId": "L039",
        "tileNumber": 39,
        "brandName": "SoundCloud",
        "category": "Music & Audio",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/039.svg",
        "pngUrl": "/logos/039.png"
      }
    ]
  },
  {
    "questionId": "R2Q040",
    "questionNumber": 40,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L040",
    "correctTileNumber": 40,
    "correctBrandName": "WordPress",
    "options": [
      {
        "optionId": "opt_40_A",
        "logoId": "L090",
        "tileNumber": 90,
        "brandName": "HubSpot",
        "category": "Business & Marketing",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/090.svg",
        "pngUrl": "/logos/090.png"
      },
      {
        "optionId": "opt_40_B",
        "logoId": "L040",
        "tileNumber": 40,
        "brandName": "WordPress",
        "category": "Web & Publishing",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/040.svg",
        "pngUrl": "/logos/040.png"
      },
      {
        "optionId": "opt_40_C",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_40_D",
        "logoId": "L007",
        "tileNumber": 7,
        "brandName": "Instagram",
        "category": "Social Media",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/007.svg",
        "pngUrl": "/logos/007.png"
      }
    ]
  },
  {
    "questionId": "R2Q041",
    "questionNumber": 41,
    "questionText": "Which logo represents the Firefox web browser?",
    "correctLogoId": "L041",
    "correctTileNumber": 41,
    "correctBrandName": "Mozilla Firefox",
    "options": [
      {
        "optionId": "opt_41_A",
        "logoId": "L041",
        "tileNumber": 41,
        "brandName": "Mozilla Firefox",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/041.svg",
        "pngUrl": "/logos/041.png"
      },
      {
        "optionId": "opt_41_B",
        "logoId": "L043",
        "tileNumber": 43,
        "brandName": "Safari",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/043.svg",
        "pngUrl": "/logos/043.png"
      },
      {
        "optionId": "opt_41_C",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_41_D",
        "logoId": "L091",
        "tileNumber": 91,
        "brandName": "Mailchimp",
        "category": "Marketing",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/091.svg",
        "pngUrl": "/logos/091.png"
      }
    ]
  },
  {
    "questionId": "R2Q042",
    "questionNumber": 42,
    "questionText": "Which logo represents the Microsoft web browser Edge?",
    "correctLogoId": "L042",
    "correctTileNumber": 42,
    "correctBrandName": "Microsoft Edge",
    "options": [
      {
        "optionId": "opt_42_A",
        "logoId": "L043",
        "tileNumber": 43,
        "brandName": "Safari",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/043.svg",
        "pngUrl": "/logos/043.png"
      },
      {
        "optionId": "opt_42_B",
        "logoId": "L092",
        "tileNumber": 92,
        "brandName": "Product Hunt",
        "category": "Technology Community",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/092.svg",
        "pngUrl": "/logos/092.png"
      },
      {
        "optionId": "opt_42_C",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_42_D",
        "logoId": "L041",
        "tileNumber": 41,
        "brandName": "Mozilla Firefox",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/041.svg",
        "pngUrl": "/logos/041.png"
      }
    ]
  },
  {
    "questionId": "R2Q043",
    "questionNumber": 43,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L043",
    "correctTileNumber": 43,
    "correctBrandName": "Safari",
    "options": [
      {
        "optionId": "opt_43_A",
        "logoId": "L042",
        "tileNumber": 42,
        "brandName": "Microsoft Edge",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/042.svg",
        "pngUrl": "/logos/042.png"
      },
      {
        "optionId": "opt_43_B",
        "logoId": "L043",
        "tileNumber": 43,
        "brandName": "Safari",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/043.svg",
        "pngUrl": "/logos/043.png"
      },
      {
        "optionId": "opt_43_C",
        "logoId": "L093",
        "tileNumber": 93,
        "brandName": "Hacker News",
        "category": "Technology Community",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/093.svg",
        "pngUrl": "/logos/093.png"
      },
      {
        "optionId": "opt_43_D",
        "logoId": "L041",
        "tileNumber": 41,
        "brandName": "Mozilla Firefox",
        "category": "Browser & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/041.svg",
        "pngUrl": "/logos/041.png"
      }
    ]
  },
  {
    "questionId": "R2Q044",
    "questionNumber": 44,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L044",
    "correctTileNumber": 44,
    "correctBrandName": "Linux",
    "options": [
      {
        "optionId": "opt_44_A",
        "logoId": "L046",
        "tileNumber": 46,
        "brandName": "Fedora",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/046.svg",
        "pngUrl": "/logos/046.png"
      },
      {
        "optionId": "opt_44_B",
        "logoId": "L045",
        "tileNumber": 45,
        "brandName": "Ubuntu",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/045.svg",
        "pngUrl": "/logos/045.png"
      },
      {
        "optionId": "opt_44_C",
        "logoId": "L094",
        "tileNumber": 94,
        "brandName": "Red Hat",
        "category": "Enterprise Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/094.svg",
        "pngUrl": "/logos/094.png"
      },
      {
        "optionId": "opt_44_D",
        "logoId": "L044",
        "tileNumber": 44,
        "brandName": "Linux",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/044.svg",
        "pngUrl": "/logos/044.png"
      }
    ]
  },
  {
    "questionId": "R2Q045",
    "questionNumber": 45,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L045",
    "correctTileNumber": 45,
    "correctBrandName": "Ubuntu",
    "options": [
      {
        "optionId": "opt_45_A",
        "logoId": "L044",
        "tileNumber": 44,
        "brandName": "Linux",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/044.svg",
        "pngUrl": "/logos/044.png"
      },
      {
        "optionId": "opt_45_B",
        "logoId": "L095",
        "tileNumber": 95,
        "brandName": "DigitalOcean",
        "category": "Cloud Computing",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/095.svg",
        "pngUrl": "/logos/095.png"
      },
      {
        "optionId": "opt_45_C",
        "logoId": "L045",
        "tileNumber": 45,
        "brandName": "Ubuntu",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/045.svg",
        "pngUrl": "/logos/045.png"
      },
      {
        "optionId": "opt_45_D",
        "logoId": "L046",
        "tileNumber": 46,
        "brandName": "Fedora",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/046.svg",
        "pngUrl": "/logos/046.png"
      }
    ]
  },
  {
    "questionId": "R2Q046",
    "questionNumber": 46,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L046",
    "correctTileNumber": 46,
    "correctBrandName": "Fedora",
    "options": [
      {
        "optionId": "opt_46_A",
        "logoId": "L045",
        "tileNumber": 45,
        "brandName": "Ubuntu",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/045.svg",
        "pngUrl": "/logos/045.png"
      },
      {
        "optionId": "opt_46_B",
        "logoId": "L046",
        "tileNumber": 46,
        "brandName": "Fedora",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/046.svg",
        "pngUrl": "/logos/046.png"
      },
      {
        "optionId": "opt_46_C",
        "logoId": "L096",
        "tileNumber": 96,
        "brandName": "Laravel",
        "category": "Developer & Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/096.svg",
        "pngUrl": "/logos/096.png"
      },
      {
        "optionId": "opt_46_D",
        "logoId": "L044",
        "tileNumber": 44,
        "brandName": "Linux",
        "category": "Operating Systems",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/044.svg",
        "pngUrl": "/logos/044.png"
      }
    ]
  },
  {
    "questionId": "R2Q047",
    "questionNumber": 47,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L047",
    "correctTileNumber": 47,
    "correctBrandName": "GitLab",
    "options": [
      {
        "optionId": "opt_47_A",
        "logoId": "L047",
        "tileNumber": 47,
        "brandName": "GitLab",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/047.svg",
        "pngUrl": "/logos/047.png"
      },
      {
        "optionId": "opt_47_B",
        "logoId": "L048",
        "tileNumber": 48,
        "brandName": "Stack Overflow",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/048.svg",
        "pngUrl": "/logos/048.png"
      },
      {
        "optionId": "opt_47_C",
        "logoId": "L097",
        "tileNumber": 97,
        "brandName": "Symfony",
        "category": "Developer & Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/097.svg",
        "pngUrl": "/logos/097.png"
      },
      {
        "optionId": "opt_47_D",
        "logoId": "L017",
        "tileNumber": 17,
        "brandName": "GitHub",
        "category": "Developer & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/017.svg",
        "pngUrl": "/logos/017.png"
      }
    ]
  },
  {
    "questionId": "R2Q048",
    "questionNumber": 48,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L048",
    "correctTileNumber": 48,
    "correctBrandName": "Stack Overflow",
    "options": [
      {
        "optionId": "opt_48_A",
        "logoId": "L098",
        "tileNumber": 98,
        "brandName": "Bootstrap",
        "category": "Developer & Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/098.svg",
        "pngUrl": "/logos/098.png"
      },
      {
        "optionId": "opt_48_B",
        "logoId": "L048",
        "tileNumber": 48,
        "brandName": "Stack Overflow",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/048.svg",
        "pngUrl": "/logos/048.png"
      },
      {
        "optionId": "opt_48_C",
        "logoId": "L017",
        "tileNumber": 17,
        "brandName": "GitHub",
        "category": "Developer & Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/017.svg",
        "pngUrl": "/logos/017.png"
      },
      {
        "optionId": "opt_48_D",
        "logoId": "L047",
        "tileNumber": 47,
        "brandName": "GitLab",
        "category": "Developer & Technology",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/047.svg",
        "pngUrl": "/logos/047.png"
      }
    ]
  },
  {
    "questionId": "R2Q049",
    "questionNumber": 49,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L049",
    "correctTileNumber": 49,
    "correctBrandName": "Docker",
    "options": [
      {
        "optionId": "opt_49_A",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_49_B",
        "logoId": "L099",
        "tileNumber": 99,
        "brandName": "Sass",
        "category": "Developer & Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/099.svg",
        "pngUrl": "/logos/099.png"
      },
      {
        "optionId": "opt_49_C",
        "logoId": "L049",
        "tileNumber": 49,
        "brandName": "Docker",
        "category": "Developer & Cloud",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/049.svg",
        "pngUrl": "/logos/049.png"
      },
      {
        "optionId": "opt_49_D",
        "logoId": "L050",
        "tileNumber": 50,
        "brandName": "Amazon Web Services",
        "category": "Cloud Computing",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/050.svg",
        "pngUrl": "/logos/050.png"
      }
    ]
  },
  {
    "questionId": "R2Q050",
    "questionNumber": 50,
    "questionText": "Identify the brand or platform represented by this logo.",
    "correctLogoId": "L050",
    "correctTileNumber": 50,
    "correctBrandName": "Amazon Web Services",
    "options": [
      {
        "optionId": "opt_50_A",
        "logoId": "L100",
        "tileNumber": 100,
        "brandName": "Less",
        "category": "Developer & Technology",
        "difficulty": "Hard",
        "recommendedPoints": 20,
        "svgUrl": "/logos/100.svg",
        "pngUrl": "/logos/100.png"
      },
      {
        "optionId": "opt_50_B",
        "logoId": "L003",
        "tileNumber": 3,
        "brandName": "Microsoft",
        "category": "Technology",
        "difficulty": "Easy",
        "recommendedPoints": 10,
        "svgUrl": "/logos/003.svg",
        "pngUrl": "/logos/003.png"
      },
      {
        "optionId": "opt_50_C",
        "logoId": "L050",
        "tileNumber": 50,
        "brandName": "Amazon Web Services",
        "category": "Cloud Computing",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/050.svg",
        "pngUrl": "/logos/050.png"
      },
      {
        "optionId": "opt_50_D",
        "logoId": "L049",
        "tileNumber": 49,
        "brandName": "Docker",
        "category": "Developer & Cloud",
        "difficulty": "Medium",
        "recommendedPoints": 15,
        "svgUrl": "/logos/049.svg",
        "pngUrl": "/logos/049.png"
      }
    ]
  }
];
var round2_questions_50_default = data2;

// src/server/data/adminStore.ts
var memoryEvents = [
  {
    id: "evt-skp-2026-main",
    name: "SKP Cultural Fest 2026 - Kala Sangamam Skill Arena",
    round1DurationMinutes: 60,
    round1TotalQuestions: 100,
    round1IsActive: true,
    round2IsActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
async function getEvents() {
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      const dbEvents = await activeDb.select().from(events).orderBy(desc(events.createdAt));
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents.map((e) => ({
          id: e.id,
          name: e.name,
          round1DurationMinutes: e.round1DurationMinutes,
          round1TotalQuestions: e.round1TotalQuestions,
          round1IsActive: e.round1IsActive,
          round2IsActive: e.round2IsActive,
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    } catch (err) {
      console.warn("Database error while fetching events, falling back to memory store:", err);
    }
  }
  return memoryEvents;
}
async function createEvent(data4) {
  const activeDb = getDatabase();
  const newEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data4.name,
    round1DurationMinutes: Number(data4.round1DurationMinutes) || 60,
    round1TotalQuestions: Number(data4.round1TotalQuestions) || 100,
    round1IsActive: data4.round1IsActive !== void 0 ? Boolean(data4.round1IsActive) : true,
    round2IsActive: data4.round2IsActive !== void 0 ? Boolean(data4.round2IsActive) : true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (activeDb) {
    try {
      const [inserted] = await activeDb.insert(events).values({
        name: newEvent.name,
        round1DurationMinutes: newEvent.round1DurationMinutes,
        round1TotalQuestions: newEvent.round1TotalQuestions,
        round1IsActive: newEvent.round1IsActive,
        round2IsActive: newEvent.round2IsActive
      }).returning();
      if (inserted) {
        newEvent.id = inserted.id;
      }
    } catch (err) {
      console.warn("Database error inserting event, saving to memory store:", err);
    }
  }
  memoryEvents.unshift(newEvent);
  return newEvent;
}
async function updateEvent(id, data4) {
  const activeDb = getDatabase();
  let updatedItem = null;
  const idx = memoryEvents.findIndex((e) => e.id === id);
  if (idx !== -1) {
    memoryEvents[idx] = {
      ...memoryEvents[idx],
      ...data4,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    updatedItem = memoryEvents[idx];
  }
  if (activeDb) {
    try {
      const [res] = await activeDb.update(events).set({
        ...data4.name ? { name: data4.name } : {},
        ...data4.round1DurationMinutes !== void 0 ? { round1DurationMinutes: Number(data4.round1DurationMinutes) } : {},
        ...data4.round1TotalQuestions !== void 0 ? { round1TotalQuestions: Number(data4.round1TotalQuestions) } : {},
        ...data4.round1IsActive !== void 0 ? { round1IsActive: Boolean(data4.round1IsActive) } : {},
        ...data4.round2IsActive !== void 0 ? { round2IsActive: Boolean(data4.round2IsActive) } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(events.id, id)).returning();
      if (res) {
        updatedItem = {
          id: res.id,
          name: res.name,
          round1DurationMinutes: res.round1DurationMinutes,
          round1TotalQuestions: res.round1TotalQuestions,
          round1IsActive: res.round1IsActive,
          round2IsActive: res.round2IsActive,
          createdAt: res.createdAt ? new Date(res.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: res.updatedAt ? new Date(res.updatedAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    } catch (err) {
      console.warn("Database error updating event:", err);
    }
  }
  return updatedItem;
}
async function deleteEvent(id) {
  const activeDb = getDatabase();
  const initialLen = memoryEvents.length;
  memoryEvents = memoryEvents.filter((e) => e.id !== id);
  if (activeDb) {
    try {
      await activeDb.delete(events).where(eq4(events.id, id));
      return true;
    } catch (err) {
      console.warn("Database error deleting event:", err);
    }
  }
  return memoryEvents.length < initialLen;
}
var currentRound1Questions = quiz_questions_100_default.map((q, idx) => ({
  question_id: q.question_id || `Q${String(idx + 1).padStart(3, "0")}`,
  source_question_number: q.source_question_number || idx + 1,
  category: q.category || "General Knowledge",
  question_text: q.question_text || "",
  option_a: q.option_a || "",
  option_b: q.option_b || "",
  option_c: q.option_c || "",
  option_d: q.option_d || "",
  correct_option: q.correct_option || "A",
  correct_answer: q.correct_answer || "",
  difficulty: q.difficulty || "Medium",
  explanation: q.explanation || ""
}));
var currentRound2Questions = round2_questions_50_default.map((q, idx) => ({
  questionId: q.questionId || `R2Q${String(idx + 1).padStart(3, "0")}`,
  questionNumber: q.questionNumber || idx + 1,
  questionText: q.questionText || "",
  correctLogoId: q.correctLogoId || "L001",
  correctTileNumber: q.correctTileNumber,
  correctBrandName: q.correctBrandName,
  options: q.options || []
}));
function getRound1Questions(filters) {
  let list = [...currentRound1Questions];
  if (filters?.category && filters.category !== "all") {
    list = list.filter((q) => q.category.toLowerCase() === filters.category.toLowerCase());
  }
  if (filters?.difficulty && filters.difficulty !== "all") {
    list = list.filter((q) => (q.difficulty || "Medium").toLowerCase() === filters.difficulty.toLowerCase());
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (q) => q.question_text.toLowerCase().includes(s) || q.category.toLowerCase().includes(s) || q.option_a.toLowerCase().includes(s) || q.option_b.toLowerCase().includes(s) || q.option_c.toLowerCase().includes(s) || q.option_d.toLowerCase().includes(s)
    );
  }
  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);
  const categories = Array.from(new Set(currentRound1Questions.map((q) => q.category))).sort();
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), categories };
}
function addRound1Question(data4) {
  const nextNum = currentRound1Questions.length > 0 ? Math.max(...currentRound1Questions.map((q) => q.source_question_number)) + 1 : 1;
  const nextId = `Q${String(nextNum).padStart(3, "0")}`;
  const correctLetter = (data4.correct_option || "A").toUpperCase();
  let correct_answer = data4.option_a;
  if (correctLetter === "B") correct_answer = data4.option_b;
  else if (correctLetter === "C") correct_answer = data4.option_c;
  else if (correctLetter === "D") correct_answer = data4.option_d;
  const newQ = {
    question_id: nextId,
    source_question_number: nextNum,
    category: data4.category || "Cultural Knowledge",
    question_text: data4.question_text,
    option_a: data4.option_a,
    option_b: data4.option_b,
    option_c: data4.option_c,
    option_d: data4.option_d,
    correct_option: correctLetter,
    correct_answer,
    difficulty: data4.difficulty || "Medium",
    explanation: data4.explanation || ""
  };
  currentRound1Questions.push(newQ);
  return newQ;
}
function updateRound1Question(id, data4) {
  const idx = currentRound1Questions.findIndex((q) => q.question_id === id);
  if (idx === -1) return null;
  const current = currentRound1Questions[idx];
  const updated = {
    ...current,
    ...data4
  };
  if (data4.correct_option || data4.option_a || data4.option_b || data4.option_c || data4.option_d) {
    const correctLetter = (updated.correct_option || "A").toUpperCase();
    if (correctLetter === "A") updated.correct_answer = updated.option_a;
    else if (correctLetter === "B") updated.correct_answer = updated.option_b;
    else if (correctLetter === "C") updated.correct_answer = updated.option_c;
    else if (correctLetter === "D") updated.correct_answer = updated.option_d;
  }
  currentRound1Questions[idx] = updated;
  return updated;
}
function deleteRound1Question(id) {
  const initialLen = currentRound1Questions.length;
  currentRound1Questions = currentRound1Questions.filter((q) => q.question_id !== id);
  return currentRound1Questions.length < initialLen;
}
function getRound2QuestionsList(filters) {
  let list = [...currentRound2Questions];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (q) => q.questionText.toLowerCase().includes(s) || q.correctBrandName && q.correctBrandName.toLowerCase().includes(s)
    );
  }
  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
function addRound2Question(data4) {
  const nextNum = currentRound2Questions.length > 0 ? Math.max(...currentRound2Questions.map((q) => q.questionNumber)) + 1 : 1;
  const nextId = `R2Q${String(nextNum).padStart(3, "0")}`;
  const newQ = {
    questionId: nextId,
    questionNumber: nextNum,
    questionText: data4.questionText,
    correctLogoId: data4.correctLogoId || "L001",
    correctBrandName: data4.correctBrandName,
    options: data4.options || []
  };
  currentRound2Questions.push(newQ);
  return newQ;
}
function updateRound2Question(id, data4) {
  const idx = currentRound2Questions.findIndex((q) => q.questionId === id);
  if (idx === -1) return null;
  currentRound2Questions[idx] = {
    ...currentRound2Questions[idx],
    ...data4
  };
  return currentRound2Questions[idx];
}
function deleteRound2Question(id) {
  const initialLen = currentRound2Questions.length;
  currentRound2Questions = currentRound2Questions.filter((q) => q.questionId !== id);
  return currentRound2Questions.length < initialLen;
}
var memoryMembers = [
  {
    id: "mem-admin-01",
    userId: "usr-admin-darkdev",
    fullName: "Super Administrator",
    email: "darkdev257@gmail.com",
    role: "admin",
    registrationNumber: "SKP-ADMIN-001",
    collegeName: "SKP Engineering College",
    department: "Platform Administration",
    yearOfStudy: "Faculty/Admin",
    phone: "+91 99999 88888",
    teamName: "Admin Core",
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: "NOT_STARTED",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "mem-part-01",
    userId: "usr-aarav-sharma",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@skp.edu.in",
    role: "participant",
    registrationNumber: "SKP-100201",
    collegeName: "SKP Engineering College",
    department: "Computer Science & Engineering",
    yearOfStudy: "III",
    phone: "+91 98401 23456",
    teamName: "Quantum Coders",
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: "SUBMITTED",
    quizScore: 84,
    accuracy: "84.00%",
    createdAt: new Date(Date.now() - 36e5 * 24).toISOString()
  },
  {
    id: "mem-part-02",
    userId: "usr-priya-patel",
    fullName: "Priya Patel",
    email: "priya.patel@skp.edu.in",
    role: "participant",
    registrationNumber: "SKP-100202",
    collegeName: "SKP Institute of Technology",
    department: "Electronics & Communication",
    yearOfStudy: "II",
    phone: "+91 98402 34567",
    teamName: "Aroha Strikers",
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: "SUBMITTED",
    quizScore: 78,
    accuracy: "78.00%",
    createdAt: new Date(Date.now() - 36e5 * 18).toISOString()
  },
  {
    id: "mem-part-03",
    userId: "usr-karthik-raja",
    fullName: "Karthik Raja",
    email: "karthik.raja@skp.edu.in",
    role: "participant",
    registrationNumber: "SKP-100203",
    collegeName: "SKP Engineering College",
    department: "Information Technology",
    yearOfStudy: "IV",
    phone: "+91 98403 45678",
    teamName: "Cyber Titans",
    isQualifiedForRound2: false,
    isActive: true,
    quizStatus: "SUBMITTED",
    quizScore: 62,
    accuracy: "62.00%",
    createdAt: new Date(Date.now() - 36e5 * 12).toISOString()
  },
  {
    id: "mem-part-04",
    userId: "usr-deepa-n",
    fullName: "Deepa Natarajan",
    email: "deepa.n@skp.edu.in",
    role: "participant",
    registrationNumber: "SKP-100204",
    collegeName: "SKP Engineering College",
    department: "Artificial Intelligence & Data Science",
    yearOfStudy: "III",
    phone: "+91 98404 56789",
    teamName: "AI Innovators",
    isQualifiedForRound2: true,
    isActive: true,
    quizStatus: "SUBMITTED",
    quizScore: 91,
    accuracy: "91.00%",
    createdAt: new Date(Date.now() - 36e5 * 6).toISOString()
  },
  {
    id: "mem-part-05",
    userId: "usr-rahul-verma",
    fullName: "Rahul Verma",
    email: "rahul.v@skp.edu.in",
    role: "participant",
    registrationNumber: "SKP-100205",
    collegeName: "SKP Polytechnic College",
    department: "Mechanical Engineering",
    yearOfStudy: "II",
    phone: "+91 98405 67890",
    teamName: "Tech Mavericks",
    isQualifiedForRound2: false,
    isActive: true,
    quizStatus: "IN_PROGRESS",
    quizScore: 0,
    accuracy: "0.00%",
    createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
  }
];
async function getMembers(filters) {
  for (const s of memorySessions.values()) {
    if (s.email && !memoryMembers.some((m) => m.email.toLowerCase() === s.email.toLowerCase())) {
      memoryMembers.push({
        id: `mem-${s.userId}`,
        userId: s.userId,
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        registrationNumber: `SKP-${Math.floor(1e5 + Math.random() * 9e5)}`,
        collegeName: "SKP Engineering College",
        department: "Engineering",
        yearOfStudy: "III",
        phone: "+91 90000 00000",
        teamName: s.teamName || null,
        isQualifiedForRound2: false,
        isActive: true,
        quizStatus: "NOT_STARTED",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  for (const [pId, attempt] of memoryAttempts.entries()) {
    const mem = memoryMembers.find((m) => m.userId === pId || m.id === pId);
    if (mem) {
      mem.quizStatus = attempt.isSubmitted ? "SUBMITTED" : "IN_PROGRESS";
      mem.quizScore = attempt.score;
      mem.accuracy = attempt.accuracyPercentage;
    }
  }
  let list = [...memoryMembers];
  if (filters?.role && filters.role !== "all") {
    list = list.filter((m) => m.role === filters.role);
  }
  if (filters?.qualified && filters.qualified !== "all") {
    const isQ = filters.qualified === "true" || filters.qualified === "yes";
    list = list.filter((m) => m.isQualifiedForRound2 === isQ);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (m) => m.fullName.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.teamName && m.teamName.toLowerCase().includes(s) || m.registrationNumber.toLowerCase().includes(s) || m.collegeName.toLowerCase().includes(s)
    );
  }
  const total = list.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function addMember(data4) {
  const activeDb = getDatabase();
  const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const regNum = data4.registrationNumber || `SKP-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const newMember = {
    id: `mem-${Date.now()}`,
    userId,
    fullName: data4.fullName,
    email: data4.email,
    role: data4.role || "participant",
    registrationNumber: regNum,
    collegeName: data4.collegeName || "SKP Engineering College",
    department: data4.department || "Computer Science & Engineering",
    yearOfStudy: data4.yearOfStudy || "III",
    phone: data4.phone || "+91 98765 43210",
    teamName: data4.teamName || null,
    isQualifiedForRound2: Boolean(data4.isQualifiedForRound2),
    isActive: true,
    quizStatus: "NOT_STARTED",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (activeDb) {
    try {
      const [u] = await activeDb.insert(users).values({
        email: newMember.email,
        username: newMember.email.split("@")[0] + "_" + Math.floor(Math.random() * 1e3),
        fullName: newMember.fullName,
        passwordHash: "admin_provisioned",
        role: newMember.role
      }).returning();
      if (u) {
        newMember.userId = u.id;
        if (newMember.role === "participant") {
          const [p] = await activeDb.insert(participants).values({
            userId: u.id,
            registrationNumber: newMember.registrationNumber,
            collegeName: newMember.collegeName,
            department: newMember.department,
            yearOfStudy: newMember.yearOfStudy,
            phone: newMember.phone,
            teamName: newMember.teamName,
            isQualifiedForRound2: newMember.isQualifiedForRound2
          }).returning();
          if (p) newMember.id = p.id;
        }
      }
    } catch (err) {
      console.warn("Database error creating member:", err);
    }
  }
  memoryMembers.unshift(newMember);
  return newMember;
}
async function updateMember(id, data4) {
  const activeDb = getDatabase();
  const idx = memoryMembers.findIndex((m) => m.id === id || m.userId === id);
  if (idx === -1) return null;
  memoryMembers[idx] = {
    ...memoryMembers[idx],
    ...data4
  };
  const updated = memoryMembers[idx];
  if (activeDb) {
    try {
      await activeDb.update(users).set({
        ...data4.fullName ? { fullName: data4.fullName } : {},
        ...data4.email ? { email: data4.email } : {},
        ...data4.role ? { role: data4.role } : {},
        ...data4.isActive !== void 0 ? { isActive: Boolean(data4.isActive) } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(users.id, updated.userId));
      if (updated.role === "participant") {
        await activeDb.update(participants).set({
          ...data4.teamName !== void 0 ? { teamName: data4.teamName } : {},
          ...data4.collegeName ? { collegeName: data4.collegeName } : {},
          ...data4.department ? { department: data4.department } : {},
          ...data4.yearOfStudy ? { yearOfStudy: data4.yearOfStudy } : {},
          ...data4.phone ? { phone: data4.phone } : {},
          ...data4.isQualifiedForRound2 !== void 0 ? { isQualifiedForRound2: Boolean(data4.isQualifiedForRound2) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(participants.userId, updated.userId));
      }
    } catch (err) {
      console.warn("Database error updating member:", err);
    }
  }
  return updated;
}
async function deleteMember(id) {
  const activeDb = getDatabase();
  const member = memoryMembers.find((m) => m.id === id || m.userId === id);
  if (!member) return false;
  memoryMembers = memoryMembers.filter((m) => m.id !== id && m.userId !== id);
  memoryAttempts.delete(member.userId);
  memoryAttempts.delete(member.id);
  if (activeDb) {
    try {
      await activeDb.delete(users).where(eq4(users.id, member.userId));
      return true;
    } catch (err) {
      console.warn("Database error deleting member:", err);
    }
  }
  return true;
}
function resetMemberAttempt(userIdOrMemberId) {
  const member = memoryMembers.find((m) => m.id === userIdOrMemberId || m.userId === userIdOrMemberId);
  if (!member) return false;
  memoryAttempts.delete(member.userId);
  memoryAttempts.delete(member.id);
  member.quizStatus = "NOT_STARTED";
  member.quizScore = void 0;
  member.accuracy = void 0;
  return true;
}
async function getAdminStats() {
  const evts = await getEvents();
  const activeEventsCount = evts.filter((e) => e.round1IsActive || e.round2IsActive).length;
  const totalMembers = memoryMembers.length;
  const qualifiedForR2 = memoryMembers.filter((m) => m.isQualifiedForRound2).length;
  const submittedAttempts = memoryMembers.filter((m) => m.quizStatus === "SUBMITTED").length;
  const inProgressAttempts = memoryMembers.filter((m) => m.quizStatus === "IN_PROGRESS").length;
  return {
    events: {
      total: evts.length,
      active: activeEventsCount,
      primaryEvent: evts[0] || null
    },
    quizzes: {
      round1TotalQuestions: currentRound1Questions.length,
      round2TotalQuestions: currentRound2Questions.length,
      round1CategoriesCount: new Set(currentRound1Questions.map((q) => q.category)).size
    },
    members: {
      total: totalMembers,
      participants: memoryMembers.filter((m) => m.role === "participant").length,
      admins: memoryMembers.filter((m) => m.role === "admin" || m.role === "super_admin").length,
      qualifiedForRound2: qualifiedForR2
    },
    activity: {
      submittedAttempts,
      inProgressAttempts,
      totalAttempts: submittedAttempts + inProgressAttempts
    },
    serverTime: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function isRoundActive(round) {
  const evts = await getEvents();
  if (evts.length === 0) return true;
  const primary = evts[0];
  return round === "round1" ? primary.round1IsActive : primary.round2IsActive;
}
async function setRoundActive(round, active) {
  const evts = await getEvents();
  if (evts.length === 0) {
    const newEvt = await createEvent({
      name: "SKP Cultural Fest 2026 - Kala Sangamam Skill Arena",
      round1IsActive: round === "round1" ? active : true,
      round2IsActive: round === "round2" ? active : true
    });
    return newEvt;
  }
  const primary = evts[0];
  const updateData = round === "round1" ? { round1IsActive: active } : { round2IsActive: active };
  return updateEvent(primary.id, updateData);
}
var round2Config = {
  cardFlipDurationSeconds: 5,
  overallDurationMinutes: 30
};
function getRound2Config() {
  return round2Config;
}
function updateRound2Config(data4) {
  if (data4.cardFlipDurationSeconds !== void 0) {
    round2Config.cardFlipDurationSeconds = Math.max(1, Math.min(60, Number(data4.cardFlipDurationSeconds) || 5));
  }
  if (data4.overallDurationMinutes !== void 0) {
    round2Config.overallDurationMinutes = Math.max(1, Math.min(180, Number(data4.overallDurationMinutes) || 30));
  }
  return round2Config;
}
var teamMarkAdjustments = /* @__PURE__ */ new Map();
function adjustTeamMarks(teamName, round, delta) {
  const cleanName = (teamName || "Unknown Team").trim();
  const existing = teamMarkAdjustments.get(cleanName) || {
    teamName: cleanName,
    round1Adjustment: 0,
    round2Adjustment: 0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (round === "round1") {
    existing.round1Adjustment += delta;
  } else {
    existing.round2Adjustment += delta;
  }
  existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  teamMarkAdjustments.set(cleanName, existing);
  return existing;
}
function removeActiveParticipant(idOrUserIdOrEmail) {
  for (const [sId, sess] of memorySessions.entries()) {
    if (sess.userId === idOrUserIdOrEmail || sess.email.toLowerCase() === idOrUserIdOrEmail.toLowerCase()) {
      memorySessions.delete(sId);
    }
  }
  for (const [pId, attempt] of memoryAttempts.entries()) {
    if (pId === idOrUserIdOrEmail) {
      attempt.isSubmitted = true;
      attempt.isDisqualified = true;
      attempt.disqualificationReason = "Removed by Competition Administrator";
    }
  }
  const mem = memoryMembers.find(
    (m) => m.id === idOrUserIdOrEmail || m.userId === idOrUserIdOrEmail || m.email.toLowerCase() === idOrUserIdOrEmail.toLowerCase()
  );
  if (mem) {
    mem.isActive = false;
    mem.quizStatus = "SUBMITTED";
  }
  return true;
}
async function getRoundsStatus() {
  const evts = await getEvents();
  const primary = evts[0] || {
    id: "default",
    name: "SKP Cultural Fest 2026 - Kala Sangamam Skill Arena",
    round1DurationMinutes: 60,
    round1TotalQuestions: 100,
    round1IsActive: true,
    round2IsActive: true
  };
  return {
    eventId: primary.id,
    eventName: primary.name,
    round1: {
      name: "Round 1 Cultural Quiz",
      isActive: Boolean(primary.round1IsActive),
      durationMinutes: primary.round1DurationMinutes || 60,
      totalQuestions: primary.round1TotalQuestions || 100
    },
    round2: {
      name: "Round 2 Logo Quiz",
      isActive: Boolean(primary.round2IsActive),
      totalQuestions: 50,
      cardFlipDurationSeconds: round2Config.cardFlipDurationSeconds,
      durationMinutes: round2Config.overallDurationMinutes
    }
  };
}

// src/server/routes/round2.ts
import { Hono as Hono4 } from "hono";
import { z as z3 } from "zod";
import { zValidator as zValidator2 } from "@hono/zod-validator";
import { eq as eq5 } from "drizzle-orm";

// src/server/data/logo_manifest.ts
var data3 = [
  {
    "logo_id": "L001",
    "tile_number": 1,
    "answer": "Apple",
    "category": "Technology",
    "difficulty": "Easy",
    "source_icon_slug": "apple",
    "png_file": "logos_png/001_apple.png",
    "svg_file": "logos_svg/001_apple.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L002",
    "tile_number": 2,
    "answer": "Google",
    "category": "Technology",
    "difficulty": "Easy",
    "source_icon_slug": "google",
    "png_file": "logos_png/002_google.png",
    "svg_file": "logos_svg/002_google.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L003",
    "tile_number": 3,
    "answer": "Microsoft",
    "category": "Technology",
    "difficulty": "Easy",
    "source_icon_slug": "microsoft",
    "png_file": "logos_png/003_microsoft.png",
    "svg_file": "logos_svg/003_microsoft.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L004",
    "tile_number": 4,
    "answer": "Amazon",
    "category": "Technology & Commerce",
    "difficulty": "Easy",
    "source_icon_slug": "amazon",
    "png_file": "logos_png/004_amazon.png",
    "svg_file": "logos_svg/004_amazon.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L005",
    "tile_number": 5,
    "answer": "Meta",
    "category": "Technology",
    "difficulty": "Easy",
    "source_icon_slug": "meta",
    "png_file": "logos_png/005_meta.png",
    "svg_file": "logos_svg/005_meta.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L006",
    "tile_number": 6,
    "answer": "Facebook",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "facebook",
    "png_file": "logos_png/006_facebook.png",
    "svg_file": "logos_svg/006_facebook.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L007",
    "tile_number": 7,
    "answer": "Instagram",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "instagram",
    "png_file": "logos_png/007_instagram.png",
    "svg_file": "logos_svg/007_instagram.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L008",
    "tile_number": 8,
    "answer": "YouTube",
    "category": "Media & Entertainment",
    "difficulty": "Easy",
    "source_icon_slug": "youtube",
    "png_file": "logos_png/008_youtube.png",
    "svg_file": "logos_svg/008_youtube.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L009",
    "tile_number": 9,
    "answer": "WhatsApp",
    "category": "Communication",
    "difficulty": "Easy",
    "source_icon_slug": "whatsapp",
    "png_file": "logos_png/009_whatsapp.png",
    "svg_file": "logos_svg/009_whatsapp.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L010",
    "tile_number": 10,
    "answer": "Spotify",
    "category": "Media & Entertainment",
    "difficulty": "Easy",
    "source_icon_slug": "spotify",
    "png_file": "logos_png/010_spotify.png",
    "svg_file": "logos_svg/010_spotify.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L011",
    "tile_number": 11,
    "answer": "TikTok",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "tiktok",
    "png_file": "logos_png/011_tiktok.png",
    "svg_file": "logos_svg/011_tiktok.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L012",
    "tile_number": 12,
    "answer": "Snapchat",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "snapchat",
    "png_file": "logos_png/012_snapchat.png",
    "svg_file": "logos_svg/012_snapchat.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L013",
    "tile_number": 13,
    "answer": "Telegram",
    "category": "Communication",
    "difficulty": "Easy",
    "source_icon_slug": "telegram",
    "png_file": "logos_png/013_telegram.png",
    "svg_file": "logos_svg/013_telegram.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L014",
    "tile_number": 14,
    "answer": "Discord",
    "category": "Communication & Gaming",
    "difficulty": "Easy",
    "source_icon_slug": "discord",
    "png_file": "logos_png/014_discord.png",
    "svg_file": "logos_svg/014_discord.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L015",
    "tile_number": 15,
    "answer": "Reddit",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "reddit",
    "png_file": "logos_png/015_reddit.png",
    "svg_file": "logos_svg/015_reddit.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L016",
    "tile_number": 16,
    "answer": "LinkedIn",
    "category": "Professional & Social",
    "difficulty": "Easy",
    "source_icon_slug": "linkedin",
    "png_file": "logos_png/016_linkedin.png",
    "svg_file": "logos_svg/016_linkedin.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L017",
    "tile_number": 17,
    "answer": "GitHub",
    "category": "Developer & Technology",
    "difficulty": "Easy",
    "source_icon_slug": "github",
    "png_file": "logos_png/017_github.png",
    "svg_file": "logos_svg/017_github.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L018",
    "tile_number": 18,
    "answer": "X / Twitter",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "x-twitter",
    "png_file": "logos_png/018_x_twitter.png",
    "svg_file": "logos_svg/018_x_twitter.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L019",
    "tile_number": 19,
    "answer": "Google Chrome",
    "category": "Browser & Technology",
    "difficulty": "Easy",
    "source_icon_slug": "chrome",
    "png_file": "logos_png/019_google_chrome.png",
    "svg_file": "logos_svg/019_google_chrome.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L020",
    "tile_number": 20,
    "answer": "Android",
    "category": "Operating Systems",
    "difficulty": "Easy",
    "source_icon_slug": "android",
    "png_file": "logos_png/020_android.png",
    "svg_file": "logos_svg/020_android.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L021",
    "tile_number": 21,
    "answer": "Windows",
    "category": "Operating Systems",
    "difficulty": "Easy",
    "source_icon_slug": "windows",
    "png_file": "logos_png/021_windows.png",
    "svg_file": "logos_svg/021_windows.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L022",
    "tile_number": 22,
    "answer": "PayPal",
    "category": "Finance & Payments",
    "difficulty": "Easy",
    "source_icon_slug": "paypal",
    "png_file": "logos_png/022_paypal.png",
    "svg_file": "logos_svg/022_paypal.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L023",
    "tile_number": 23,
    "answer": "Visa",
    "category": "Finance & Payments",
    "difficulty": "Easy",
    "source_icon_slug": "cc-visa",
    "png_file": "logos_png/023_visa.png",
    "svg_file": "logos_svg/023_visa.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L024",
    "tile_number": 24,
    "answer": "Mastercard",
    "category": "Finance & Payments",
    "difficulty": "Easy",
    "source_icon_slug": "cc-mastercard",
    "png_file": "logos_png/024_mastercard.png",
    "svg_file": "logos_svg/024_mastercard.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L025",
    "tile_number": 25,
    "answer": "Uber",
    "category": "Travel & Mobility",
    "difficulty": "Easy",
    "source_icon_slug": "uber",
    "png_file": "logos_png/025_uber.png",
    "svg_file": "logos_svg/025_uber.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L026",
    "tile_number": 26,
    "answer": "Airbnb",
    "category": "Travel & Hospitality",
    "difficulty": "Easy",
    "source_icon_slug": "airbnb",
    "png_file": "logos_png/026_airbnb.png",
    "svg_file": "logos_svg/026_airbnb.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L027",
    "tile_number": 27,
    "answer": "PlayStation",
    "category": "Gaming",
    "difficulty": "Easy",
    "source_icon_slug": "playstation",
    "png_file": "logos_png/027_playstation.png",
    "svg_file": "logos_svg/027_playstation.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L028",
    "tile_number": 28,
    "answer": "Xbox",
    "category": "Gaming",
    "difficulty": "Easy",
    "source_icon_slug": "xbox",
    "png_file": "logos_png/028_xbox.png",
    "svg_file": "logos_svg/028_xbox.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L029",
    "tile_number": 29,
    "answer": "Steam",
    "category": "Gaming",
    "difficulty": "Easy",
    "source_icon_slug": "steam",
    "png_file": "logos_png/029_steam.png",
    "svg_file": "logos_svg/029_steam.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L030",
    "tile_number": 30,
    "answer": "Twitch",
    "category": "Gaming & Streaming",
    "difficulty": "Easy",
    "source_icon_slug": "twitch",
    "png_file": "logos_png/030_twitch.png",
    "svg_file": "logos_svg/030_twitch.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L031",
    "tile_number": 31,
    "answer": "eBay",
    "category": "E-commerce",
    "difficulty": "Easy",
    "source_icon_slug": "ebay",
    "png_file": "logos_png/031_ebay.png",
    "svg_file": "logos_svg/031_ebay.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L032",
    "tile_number": 32,
    "answer": "Etsy",
    "category": "E-commerce",
    "difficulty": "Easy",
    "source_icon_slug": "etsy",
    "png_file": "logos_png/032_etsy.png",
    "svg_file": "logos_svg/032_etsy.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L033",
    "tile_number": 33,
    "answer": "Shopify",
    "category": "E-commerce",
    "difficulty": "Easy",
    "source_icon_slug": "shopify",
    "png_file": "logos_png/033_shopify.png",
    "svg_file": "logos_svg/033_shopify.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L034",
    "tile_number": 34,
    "answer": "Dropbox",
    "category": "Cloud & Productivity",
    "difficulty": "Easy",
    "source_icon_slug": "dropbox",
    "png_file": "logos_png/034_dropbox.png",
    "svg_file": "logos_svg/034_dropbox.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L035",
    "tile_number": 35,
    "answer": "Slack",
    "category": "Productivity & Communication",
    "difficulty": "Easy",
    "source_icon_slug": "slack",
    "png_file": "logos_png/035_slack.png",
    "svg_file": "logos_svg/035_slack.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L036",
    "tile_number": 36,
    "answer": "Pinterest",
    "category": "Social Media",
    "difficulty": "Easy",
    "source_icon_slug": "pinterest",
    "png_file": "logos_png/036_pinterest.png",
    "svg_file": "logos_svg/036_pinterest.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L037",
    "tile_number": 37,
    "answer": "Wikipedia",
    "category": "Knowledge & Education",
    "difficulty": "Easy",
    "source_icon_slug": "wikipedia-w",
    "png_file": "logos_png/037_wikipedia.png",
    "svg_file": "logos_svg/037_wikipedia.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L038",
    "tile_number": 38,
    "answer": "IMDb",
    "category": "Media & Entertainment",
    "difficulty": "Easy",
    "source_icon_slug": "imdb",
    "png_file": "logos_png/038_imdb.png",
    "svg_file": "logos_svg/038_imdb.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L039",
    "tile_number": 39,
    "answer": "SoundCloud",
    "category": "Music & Audio",
    "difficulty": "Easy",
    "source_icon_slug": "soundcloud",
    "png_file": "logos_png/039_soundcloud.png",
    "svg_file": "logos_svg/039_soundcloud.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L040",
    "tile_number": 40,
    "answer": "WordPress",
    "category": "Web & Publishing",
    "difficulty": "Easy",
    "source_icon_slug": "wordpress",
    "png_file": "logos_png/040_wordpress.png",
    "svg_file": "logos_svg/040_wordpress.svg",
    "recommended_points": 10,
    "active": true
  },
  {
    "logo_id": "L041",
    "tile_number": 41,
    "answer": "Mozilla Firefox",
    "category": "Browser & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "firefox",
    "png_file": "logos_png/041_mozilla_firefox.png",
    "svg_file": "logos_svg/041_mozilla_firefox.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L042",
    "tile_number": 42,
    "answer": "Microsoft Edge",
    "category": "Browser & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "edge",
    "png_file": "logos_png/042_microsoft_edge.png",
    "svg_file": "logos_svg/042_microsoft_edge.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L043",
    "tile_number": 43,
    "answer": "Safari",
    "category": "Browser & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "safari",
    "png_file": "logos_png/043_safari.png",
    "svg_file": "logos_svg/043_safari.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L044",
    "tile_number": 44,
    "answer": "Linux",
    "category": "Operating Systems",
    "difficulty": "Medium",
    "source_icon_slug": "linux",
    "png_file": "logos_png/044_linux.png",
    "svg_file": "logos_svg/044_linux.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L045",
    "tile_number": 45,
    "answer": "Ubuntu",
    "category": "Operating Systems",
    "difficulty": "Medium",
    "source_icon_slug": "ubuntu",
    "png_file": "logos_png/045_ubuntu.png",
    "svg_file": "logos_svg/045_ubuntu.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L046",
    "tile_number": 46,
    "answer": "Fedora",
    "category": "Operating Systems",
    "difficulty": "Medium",
    "source_icon_slug": "fedora",
    "png_file": "logos_png/046_fedora.png",
    "svg_file": "logos_svg/046_fedora.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L047",
    "tile_number": 47,
    "answer": "GitLab",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "gitlab",
    "png_file": "logos_png/047_gitlab.png",
    "svg_file": "logos_svg/047_gitlab.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L048",
    "tile_number": 48,
    "answer": "Stack Overflow",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "stack-overflow",
    "png_file": "logos_png/048_stack_overflow.png",
    "svg_file": "logos_svg/048_stack_overflow.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L049",
    "tile_number": 49,
    "answer": "Docker",
    "category": "Developer & Cloud",
    "difficulty": "Medium",
    "source_icon_slug": "docker",
    "png_file": "logos_png/049_docker.png",
    "svg_file": "logos_svg/049_docker.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L050",
    "tile_number": 50,
    "answer": "Amazon Web Services",
    "category": "Cloud Computing",
    "difficulty": "Medium",
    "source_icon_slug": "aws",
    "png_file": "logos_png/050_amazon_web_services.png",
    "svg_file": "logos_svg/050_amazon_web_services.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L051",
    "tile_number": 51,
    "answer": "Cloudflare",
    "category": "Cloud & Security",
    "difficulty": "Medium",
    "source_icon_slug": "cloudflare",
    "png_file": "logos_png/051_cloudflare.png",
    "svg_file": "logos_svg/051_cloudflare.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L052",
    "tile_number": 52,
    "answer": "React",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "react",
    "png_file": "logos_png/052_react.png",
    "svg_file": "logos_svg/052_react.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L053",
    "tile_number": 53,
    "answer": "Angular",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "angular",
    "png_file": "logos_png/053_angular.png",
    "svg_file": "logos_svg/053_angular.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L054",
    "tile_number": 54,
    "answer": "Vue.js",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "vuejs",
    "png_file": "logos_png/054_vue_js.png",
    "svg_file": "logos_svg/054_vue_js.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L055",
    "tile_number": 55,
    "answer": "Node.js",
    "category": "Developer & Technology",
    "difficulty": "Medium",
    "source_icon_slug": "node-js",
    "png_file": "logos_png/055_node_js.png",
    "svg_file": "logos_svg/055_node_js.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L056",
    "tile_number": 56,
    "answer": "Python",
    "category": "Programming",
    "difficulty": "Medium",
    "source_icon_slug": "python",
    "png_file": "logos_png/056_python.png",
    "svg_file": "logos_svg/056_python.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L057",
    "tile_number": 57,
    "answer": "Java",
    "category": "Programming",
    "difficulty": "Medium",
    "source_icon_slug": "java",
    "png_file": "logos_png/057_java.png",
    "svg_file": "logos_svg/057_java.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L058",
    "tile_number": 58,
    "answer": "Raspberry Pi",
    "category": "Hardware & Education",
    "difficulty": "Medium",
    "source_icon_slug": "raspberry-pi",
    "png_file": "logos_png/058_raspberry_pi.png",
    "svg_file": "logos_svg/058_raspberry_pi.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L059",
    "tile_number": 59,
    "answer": "Bluetooth",
    "category": "Technology Standard",
    "difficulty": "Medium",
    "source_icon_slug": "bluetooth",
    "png_file": "logos_png/059_bluetooth.png",
    "svg_file": "logos_svg/059_bluetooth.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L060",
    "tile_number": 60,
    "answer": "USB",
    "category": "Technology Standard",
    "difficulty": "Medium",
    "source_icon_slug": "usb",
    "png_file": "logos_png/060_usb.png",
    "svg_file": "logos_svg/060_usb.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L061",
    "tile_number": 61,
    "answer": "Figma",
    "category": "Design & Creative",
    "difficulty": "Medium",
    "source_icon_slug": "figma",
    "png_file": "logos_png/061_figma.png",
    "svg_file": "logos_svg/061_figma.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L062",
    "tile_number": 62,
    "answer": "Behance",
    "category": "Design & Creative",
    "difficulty": "Medium",
    "source_icon_slug": "behance",
    "png_file": "logos_png/062_behance.png",
    "svg_file": "logos_svg/062_behance.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L063",
    "tile_number": 63,
    "answer": "Dribbble",
    "category": "Design & Creative",
    "difficulty": "Medium",
    "source_icon_slug": "dribbble",
    "png_file": "logos_png/063_dribbble.png",
    "svg_file": "logos_svg/063_dribbble.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L064",
    "tile_number": 64,
    "answer": "Vimeo",
    "category": "Media & Entertainment",
    "difficulty": "Medium",
    "source_icon_slug": "vimeo-v",
    "png_file": "logos_png/064_vimeo.png",
    "svg_file": "logos_svg/064_vimeo.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L065",
    "tile_number": 65,
    "answer": "Deezer",
    "category": "Music & Audio",
    "difficulty": "Medium",
    "source_icon_slug": "deezer",
    "png_file": "logos_png/065_deezer.png",
    "svg_file": "logos_svg/065_deezer.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L066",
    "tile_number": 66,
    "answer": "Audible",
    "category": "Media & Books",
    "difficulty": "Medium",
    "source_icon_slug": "audible",
    "png_file": "logos_png/066_audible.png",
    "svg_file": "logos_svg/066_audible.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L067",
    "tile_number": 67,
    "answer": "Goodreads",
    "category": "Books & Knowledge",
    "difficulty": "Medium",
    "source_icon_slug": "goodreads",
    "png_file": "logos_png/067_goodreads.png",
    "svg_file": "logos_svg/067_goodreads.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L068",
    "tile_number": 68,
    "answer": "Patreon",
    "category": "Creator Economy",
    "difficulty": "Medium",
    "source_icon_slug": "patreon",
    "png_file": "logos_png/068_patreon.png",
    "svg_file": "logos_svg/068_patreon.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L069",
    "tile_number": 69,
    "answer": "Kickstarter",
    "category": "Crowdfunding",
    "difficulty": "Medium",
    "source_icon_slug": "kickstarter",
    "png_file": "logos_png/069_kickstarter.png",
    "svg_file": "logos_svg/069_kickstarter.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L070",
    "tile_number": 70,
    "answer": "Quora",
    "category": "Knowledge & Social",
    "difficulty": "Medium",
    "source_icon_slug": "quora",
    "png_file": "logos_png/070_quora.png",
    "svg_file": "logos_svg/070_quora.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L071",
    "tile_number": 71,
    "answer": "Medium",
    "category": "Publishing",
    "difficulty": "Medium",
    "source_icon_slug": "medium",
    "png_file": "logos_png/071_medium.png",
    "svg_file": "logos_svg/071_medium.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L072",
    "tile_number": 72,
    "answer": "Stripe",
    "category": "Finance & Payments",
    "difficulty": "Medium",
    "source_icon_slug": "stripe",
    "png_file": "logos_png/072_stripe.png",
    "svg_file": "logos_svg/072_stripe.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L073",
    "tile_number": 73,
    "answer": "Apple Pay",
    "category": "Finance & Payments",
    "difficulty": "Medium",
    "source_icon_slug": "apple-pay",
    "png_file": "logos_png/073_apple_pay.png",
    "svg_file": "logos_svg/073_apple_pay.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L074",
    "tile_number": 74,
    "answer": "Google Pay",
    "category": "Finance & Payments",
    "difficulty": "Medium",
    "source_icon_slug": "google-pay",
    "png_file": "logos_png/074_google_pay.png",
    "svg_file": "logos_svg/074_google_pay.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L075",
    "tile_number": 75,
    "answer": "Bitcoin",
    "category": "Finance & Crypto",
    "difficulty": "Medium",
    "source_icon_slug": "bitcoin",
    "png_file": "logos_png/075_bitcoin.png",
    "svg_file": "logos_svg/075_bitcoin.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L076",
    "tile_number": 76,
    "answer": "Ethereum",
    "category": "Finance & Crypto",
    "difficulty": "Medium",
    "source_icon_slug": "ethereum",
    "png_file": "logos_png/076_ethereum.png",
    "svg_file": "logos_svg/076_ethereum.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L077",
    "tile_number": 77,
    "answer": "Lyft",
    "category": "Travel & Mobility",
    "difficulty": "Medium",
    "source_icon_slug": "lyft",
    "png_file": "logos_png/077_lyft.png",
    "svg_file": "logos_svg/077_lyft.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L078",
    "tile_number": 78,
    "answer": "Waze",
    "category": "Travel & Mobility",
    "difficulty": "Medium",
    "source_icon_slug": "waze",
    "png_file": "logos_png/078_waze.png",
    "svg_file": "logos_svg/078_waze.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L079",
    "tile_number": 79,
    "answer": "DHL",
    "category": "Logistics",
    "difficulty": "Medium",
    "source_icon_slug": "dhl",
    "png_file": "logos_png/079_dhl.png",
    "svg_file": "logos_svg/079_dhl.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L080",
    "tile_number": 80,
    "answer": "FedEx",
    "category": "Logistics",
    "difficulty": "Medium",
    "source_icon_slug": "fedex",
    "png_file": "logos_png/080_fedex.png",
    "svg_file": "logos_svg/080_fedex.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L081",
    "tile_number": 81,
    "answer": "UPS",
    "category": "Logistics",
    "difficulty": "Medium",
    "source_icon_slug": "ups",
    "png_file": "logos_png/081_ups.png",
    "svg_file": "logos_svg/081_ups.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L082",
    "tile_number": 82,
    "answer": "Yelp",
    "category": "Food & Local Discovery",
    "difficulty": "Medium",
    "source_icon_slug": "yelp",
    "png_file": "logos_png/082_yelp.png",
    "svg_file": "logos_svg/082_yelp.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L083",
    "tile_number": 83,
    "answer": "Untappd",
    "category": "Food & Beverage",
    "difficulty": "Medium",
    "source_icon_slug": "untappd",
    "png_file": "logos_png/083_untappd.png",
    "svg_file": "logos_svg/083_untappd.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L084",
    "tile_number": 84,
    "answer": "Strava",
    "category": "Sports & Fitness",
    "difficulty": "Medium",
    "source_icon_slug": "strava",
    "png_file": "logos_png/084_strava.png",
    "svg_file": "logos_svg/084_strava.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L085",
    "tile_number": 85,
    "answer": "Salesforce",
    "category": "Business Software",
    "difficulty": "Medium",
    "source_icon_slug": "salesforce",
    "png_file": "logos_png/085_salesforce.png",
    "svg_file": "logos_svg/085_salesforce.svg",
    "recommended_points": 15,
    "active": true
  },
  {
    "logo_id": "L086",
    "tile_number": 86,
    "answer": "Atlassian",
    "category": "Business Software",
    "difficulty": "Hard",
    "source_icon_slug": "atlassian",
    "png_file": "logos_png/086_atlassian.png",
    "svg_file": "logos_svg/086_atlassian.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L087",
    "tile_number": 87,
    "answer": "Jira",
    "category": "Business Software",
    "difficulty": "Hard",
    "source_icon_slug": "jira",
    "png_file": "logos_png/087_jira.png",
    "svg_file": "logos_svg/087_jira.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L088",
    "tile_number": 88,
    "answer": "Confluence",
    "category": "Business Software",
    "difficulty": "Hard",
    "source_icon_slug": "confluence",
    "png_file": "logos_png/088_confluence.png",
    "svg_file": "logos_svg/088_confluence.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L089",
    "tile_number": 89,
    "answer": "Trello",
    "category": "Productivity",
    "difficulty": "Hard",
    "source_icon_slug": "trello",
    "png_file": "logos_png/089_trello.png",
    "svg_file": "logos_svg/089_trello.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L090",
    "tile_number": 90,
    "answer": "HubSpot",
    "category": "Business & Marketing",
    "difficulty": "Hard",
    "source_icon_slug": "hubspot",
    "png_file": "logos_png/090_hubspot.png",
    "svg_file": "logos_svg/090_hubspot.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L091",
    "tile_number": 91,
    "answer": "Mailchimp",
    "category": "Marketing",
    "difficulty": "Hard",
    "source_icon_slug": "mailchimp",
    "png_file": "logos_png/091_mailchimp.png",
    "svg_file": "logos_svg/091_mailchimp.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L092",
    "tile_number": 92,
    "answer": "Product Hunt",
    "category": "Technology Community",
    "difficulty": "Hard",
    "source_icon_slug": "product-hunt",
    "png_file": "logos_png/092_product_hunt.png",
    "svg_file": "logos_svg/092_product_hunt.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L093",
    "tile_number": 93,
    "answer": "Hacker News",
    "category": "Technology Community",
    "difficulty": "Hard",
    "source_icon_slug": "hacker-news",
    "png_file": "logos_png/093_hacker_news.png",
    "svg_file": "logos_svg/093_hacker_news.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L094",
    "tile_number": 94,
    "answer": "Red Hat",
    "category": "Enterprise Technology",
    "difficulty": "Hard",
    "source_icon_slug": "redhat",
    "png_file": "logos_png/094_red_hat.png",
    "svg_file": "logos_svg/094_red_hat.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L095",
    "tile_number": 95,
    "answer": "DigitalOcean",
    "category": "Cloud Computing",
    "difficulty": "Hard",
    "source_icon_slug": "digital-ocean",
    "png_file": "logos_png/095_digitalocean.png",
    "svg_file": "logos_svg/095_digitalocean.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L096",
    "tile_number": 96,
    "answer": "Laravel",
    "category": "Developer & Technology",
    "difficulty": "Hard",
    "source_icon_slug": "laravel",
    "png_file": "logos_png/096_laravel.png",
    "svg_file": "logos_svg/096_laravel.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L097",
    "tile_number": 97,
    "answer": "Symfony",
    "category": "Developer & Technology",
    "difficulty": "Hard",
    "source_icon_slug": "symfony",
    "png_file": "logos_png/097_symfony.png",
    "svg_file": "logos_svg/097_symfony.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L098",
    "tile_number": 98,
    "answer": "Bootstrap",
    "category": "Developer & Technology",
    "difficulty": "Hard",
    "source_icon_slug": "bootstrap",
    "png_file": "logos_png/098_bootstrap.png",
    "svg_file": "logos_svg/098_bootstrap.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L099",
    "tile_number": 99,
    "answer": "Sass",
    "category": "Developer & Technology",
    "difficulty": "Hard",
    "source_icon_slug": "sass",
    "png_file": "logos_png/099_sass.png",
    "svg_file": "logos_svg/099_sass.svg",
    "recommended_points": 20,
    "active": true
  },
  {
    "logo_id": "L100",
    "tile_number": 100,
    "answer": "Less",
    "category": "Developer & Technology",
    "difficulty": "Hard",
    "source_icon_slug": "less",
    "png_file": "logos_png/100_less.png",
    "svg_file": "logos_svg/100_less.svg",
    "recommended_points": 20,
    "active": true
  }
];
var logo_manifest_default = data3;

// src/server/routes/round2.ts
var round2Router = new Hono4();
var memoryRound2Attempts = /* @__PURE__ */ new Map();
var memoryRound2SecurityEvents = [];
var dbSeeded = false;
async function ensureDbSeeded() {
  if (dbSeeded) return;
  const activeDb = getDatabase();
  if (!activeDb) return;
  try {
    const existingLogos = await activeDb.select().from(logos).limit(1);
    if (existingLogos.length === 0) {
      logger.info("Seeding 100 logos into database...");
      for (const item of logo_manifest_default) {
        await activeDb.insert(logos).values({
          id: item.logo_id,
          tileNumber: item.tile_number,
          answer: item.answer,
          category: item.category,
          difficulty: item.difficulty,
          recommendedPoints: item.recommended_points,
          pngPath: item.png_file,
          svgPath: item.svg_file,
          active: item.active
        }).onConflictDoNothing();
      }
    }
    const existingQuestions = await activeDb.select().from(round2Questions).limit(1);
    if (existingQuestions.length === 0) {
      logger.info("Seeding 50 Round 2 questions & 200 options into database...");
      for (const q of round2_questions_50_default) {
        await activeDb.insert(round2Questions).values({
          id: q.questionId,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          correctLogoId: q.correctLogoId,
          active: true
        }).onConflictDoNothing();
        for (let idx = 0; idx < q.options.length; idx++) {
          const opt = q.options[idx];
          await activeDb.insert(round2Options).values({
            id: opt.optionId,
            questionId: q.questionId,
            logoId: opt.logoId,
            optionOrder: idx + 1
          }).onConflictDoNothing();
        }
      }
    }
    dbSeeded = true;
  } catch (err) {
    logger.warn("Error during Round 2 DB seeding check:", { error: err.message });
  }
}
function shuffleArray(array, seedStr) {
  const arr = [...array];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = seed * 31 + seedStr.charCodeAt(i) & 4294967295;
  }
  const random = () => {
    seed = seed * 1664525 + 1013904223 & 4294967295;
    return (seed >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function generateShuffledOptionsForAttempt(participantId) {
  const map = /* @__PURE__ */ new Map();
  const letters = ["A", "B", "C", "D"];
  for (const q of round2_questions_50_default) {
    const shuffled = shuffleArray(q.options, `${participantId}-${q.questionId}`);
    const assigned = shuffled.map((opt, idx) => ({
      optionId: `opt_${q.questionNumber}_${letters[idx]}`,
      logoId: opt.logoId,
      tileNumber: opt.tileNumber,
      brandName: opt.brandName,
      key: letters[idx],
      svgUrl: opt.svgUrl,
      pngUrl: opt.pngUrl
    }));
    map.set(q.questionId, assigned);
  }
  return map;
}
function sanitizeRound2Questions(questionOrder, shuffledMap) {
  const rawMap = new Map(round2_questions_50_default.map((q) => [q.questionId, q]));
  return questionOrder.map((qId, idx) => {
    const q = rawMap.get(qId);
    const options = shuffledMap.get(qId) || [];
    const numStr = String(q.correctTileNumber).padStart(3, "0");
    const correctOpt = q.options.find((o) => o.logoId === q.correctLogoId) || q.options[0];
    return {
      questionId: q.questionId,
      questionNumber: idx + 1,
      // Position 1 of 50 ... Position 50 of 50
      questionText: q.questionText || "Identify the logo shown on the card",
      category: correctOpt?.category || "Brand Identity",
      difficulty: correctOpt?.difficulty || "Medium",
      logoSvgUrl: `/logos/${numStr}.svg`,
      logoPngUrl: `/logos/${numStr}.png`,
      logoImageUrl: `/logos/${numStr}.svg`,
      options: options.map((opt) => ({
        optionId: opt.optionId,
        key: opt.key,
        text: opt.brandName,
        brandName: opt.brandName,
        logoId: opt.logoId
      }))
    };
  });
}
async function getOrRestoreAttempt(userId, teamName) {
  let mem = memoryRound2Attempts.get(userId);
  if (mem) return mem;
  const activeDb = getDatabase();
  if (!activeDb) return null;
  try {
    const existing = await activeDb.select().from(round2Attempts).where(eq5(round2Attempts.participantId, userId)).limit(1);
    if (!existing[0]) return null;
    const currentAttempt = existing[0];
    const mappings = await activeDb.select().from(round2QuestionMappings).where(eq5(round2QuestionMappings.attemptId, currentAttempt.id)).orderBy(round2QuestionMappings.sequenceOrder);
    const questionOrder = mappings.length === 50 ? mappings.map((m) => m.questionId) : round2_questions_50_default.map((q) => q.questionId);
    const dbAnswers = await activeDb.select().from(round2Answers).where(eq5(round2Answers.attemptId, currentAttempt.id));
    const answersMap = /* @__PURE__ */ new Map();
    const revealsMap = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    for (const ans of dbAnswers) {
      const isLocked = ans.isCardLocked || (ans.revealStartedAt ? now.getTime() - ans.revealStartedAt.getTime() >= 5e3 : false);
      answersMap.set(ans.questionId, {
        selectedLogoId: ans.selectedLogoId,
        selectedOptionId: ans.selectedOptionId || null,
        selectedBrandName: ans.selectedBrandName || null,
        isMarkedForReview: ans.isMarkedForReview,
        revealStartedAt: ans.revealStartedAt || null,
        revealEndedAt: ans.revealEndedAt || null,
        isCardLocked: isLocked,
        savedAt: ans.savedAt
      });
      if (ans.revealStartedAt) {
        revealsMap.set(ans.questionId, {
          revealStartedAt: ans.revealStartedAt,
          isLocked
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
      answers: answersMap
    };
    memoryRound2Attempts.set(userId, mem);
    return mem;
  } catch (err) {
    logger.warn("Failed to restore Round 2 attempt from DB:", { error: err.message });
    return null;
  }
}
round2Router.post("/start", requireAuth, async (c) => {
  const user = c.get("user");
  const active = await isRoundActive("round2");
  if (!active && user.role !== "admin" && user.role !== "super_admin") {
    throw new AppError(
      "ROUND_INACTIVE",
      "Round 2 Logo Quiz is currently disabled by the competition administrator. Only rounds in ENABLED state can be attended by competitors.",
      403
    );
  }
  const now = /* @__PURE__ */ new Date();
  await ensureDbSeeded();
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    const questionOrder = round2_questions_50_default.map((q) => q.questionId);
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
      reveals: /* @__PURE__ */ new Map(),
      answers: /* @__PURE__ */ new Map()
    };
    memoryRound2Attempts.set(user.id, mem);
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
          unansweredCount: 50
        }).onConflictDoNothing();
        for (let idx = 0; idx < questionOrder.length; idx++) {
          await activeDb.insert(round2QuestionMappings).values({
            id: `r2qm-${mem.id}-${idx + 1}`,
            attemptId: mem.id,
            questionId: questionOrder[idx],
            sequenceOrder: idx + 1
          }).onConflictDoNothing();
        }
      } catch (err) {
        logger.warn("Failed to persist Round 2 attempt to DB (using memory fallback):", { error: err.message });
      }
    }
  }
  const sanitizedQuestions = sanitizeRound2Questions(mem.questionOrder, mem.shuffledOptions);
  const cfg = getRound2Config();
  const elapsedSec = Math.floor((now.getTime() - mem.startedAt.getTime()) / 1e3);
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
      cardFlipDurationSeconds: cfg.cardFlipDurationSeconds
    },
    durationMinutes: cfg.overallDurationMinutes,
    cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
    overallDurationMinutes: cfg.overallDurationMinutes,
    remainingSeconds,
    questions: sanitizedQuestions
  });
});
round2Router.get("/start", requireAuth, async (c) => {
  const user = c.get("user");
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    const postRes = await fetch(new URL("/api/v1/round2/start", c.req.url).toString(), {
      method: "POST",
      headers: { cookie: c.req.header("cookie") || "" }
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
      unansweredCount: 50 - mem.answers.size
    },
    questions: sanitizedQuestions
  });
});
round2Router.get("/attempt", requireAuth, async (c) => {
  const user = c.get("user");
  const now = /* @__PURE__ */ new Date();
  const mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    return c.json({ success: true, attempt: null });
  }
  const answersObj = {};
  for (const [qId, ans] of mem.answers.entries()) {
    answersObj[qId] = {
      selectedOptionId: ans.selectedOptionId,
      selectedBrandName: ans.selectedBrandName,
      selectedLogoId: ans.selectedLogoId,
      isMarkedForReview: ans.isMarkedForReview,
      isCardLocked: ans.isCardLocked,
      savedAt: ans.savedAt.toISOString()
    };
  }
  const revealsObj = {};
  const cfg = getRound2Config();
  const elapsedAttemptSec = Math.floor((now.getTime() - mem.startedAt.getTime()) / 1e3);
  const remainingSeconds = Math.max(0, cfg.overallDurationMinutes * 60 - elapsedAttemptSec);
  const flipDurationMs = cfg.cardFlipDurationSeconds * 1e3;
  for (const [qId, rev] of mem.reveals.entries()) {
    const elapsedMs = now.getTime() - rev.revealStartedAt.getTime();
    const isLocked = rev.isLocked || elapsedMs >= flipDurationMs;
    revealsObj[qId] = {
      isLocked,
      remainingMs: isLocked ? 0 : Math.max(0, flipDurationMs - elapsedMs),
      revealStartedAt: rev.revealStartedAt.toISOString()
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
      reveals: revealsObj
    },
    cardFlipDurationSeconds: cfg.cardFlipDurationSeconds,
    overallDurationMinutes: cfg.overallDurationMinutes,
    remainingSeconds
  });
});
round2Router.get("/questions", requireAuth, async (c) => {
  const user = c.get("user");
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    const questionOrder = round2_questions_50_default.map((q) => q.questionId);
    const shuffledOptions = generateShuffledOptionsForAttempt(user.id);
    return c.json({
      success: true,
      total: 50,
      questions: sanitizeRound2Questions(questionOrder, shuffledOptions)
    });
  }
  return c.json({
    success: true,
    total: 50,
    questions: sanitizeRound2Questions(mem.questionOrder, mem.shuffledOptions)
  });
});
round2Router.post("/reveal/:questionId", requireAuth, async (c) => {
  const user = c.get("user");
  const questionId = c.req.param("questionId");
  const now = /* @__PURE__ */ new Date();
  const mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError("NOT_FOUND", "No active Round 2 attempt found", 404);
  }
  if (mem.isDisqualified) {
    throw new AppError("FORBIDDEN", "Participant has been eliminated due to security anomaly. No second chance.", 403);
  }
  if (mem.isSubmitted) {
    throw new AppError("FORBIDDEN", "Round 2 attempt has already been submitted", 403);
  }
  if (!mem.questionOrder.includes(questionId)) {
    throw new AppError("NOT_FOUND", "Question does not belong to this Round 2 attempt", 404);
  }
  const flipDurationMs = getRound2Config().cardFlipDurationSeconds * 1e3;
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
        revealStartedAt: existingReveal.revealStartedAt.toISOString()
      });
    }
    return c.json({
      success: true,
      questionId,
      isLocked: false,
      remainingMs: Math.max(0, flipDurationMs - elapsedMs),
      revealStartedAt: existingReveal.revealStartedAt.toISOString()
    });
  }
  const newReveal = {
    revealStartedAt: now,
    isLocked: false
  };
  mem.reveals.set(questionId, newReveal);
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb.insert(round2Answers).values({
        id: `ans-${mem.id}-${questionId}`,
        attemptId: mem.id,
        questionId,
        revealStartedAt: now,
        isCardLocked: false,
        savedAt: now
      }).onConflictDoUpdate({
        target: [round2Answers.attemptId, round2Answers.questionId],
        set: {
          revealStartedAt: now
        }
      });
    } catch (err) {
      logger.warn("Failed to record reveal in DB:", { error: err.message });
    }
  }
  return c.json({
    success: true,
    questionId,
    isLocked: false,
    remainingMs: flipDurationMs,
    revealStartedAt: now.toISOString()
  });
});
var round2AnswerSchema = z3.object({
  selectedOptionId: z3.string().nullable().optional(),
  selectedBrandName: z3.string().nullable().optional(),
  selectedLogoId: z3.string().nullable().optional()
});
var handleSaveAnswer = async (c) => {
  const user = c.get("user");
  const questionId = c.req.param("questionId");
  const body = (c.req.valid ? c.req.valid("json") : null) || await c.req.json().catch(() => ({}));
  const { selectedOptionId, selectedBrandName, selectedLogoId } = body || {};
  const now = /* @__PURE__ */ new Date();
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError("NOT_FOUND", "No active Round 2 attempt found", 404);
  }
  if (mem.isDisqualified) {
    throw new AppError("FORBIDDEN", "Participant has been eliminated due to security anomaly. No second chance.", 403);
  }
  if (mem.isSubmitted) {
    throw new AppError("FORBIDDEN", "Round 2 attempt has already been submitted", 403);
  }
  if (!mem.questionOrder.includes(questionId)) {
    throw new AppError("NOT_FOUND", "Question does not belong to this Round 2 attempt", 404);
  }
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
    throw new AppError("BAD_REQUEST", "Invalid answer option selected for this question", 400);
  }
  const existingAns = mem.answers.get(questionId);
  if (existingAns && existingAns.selectedOptionId) {
    if (matchedOption && existingAns.selectedOptionId === matchedOption.optionId) {
      return c.json({
        success: true,
        questionId,
        selectedOptionId: existingAns.selectedOptionId,
        selectedBrandName: existingAns.selectedBrandName,
        savedAt: existingAns.savedAt.toISOString()
      });
    }
    return c.json({
      success: true,
      alreadyAnswered: true,
      questionId,
      selectedOptionId: existingAns.selectedOptionId,
      selectedBrandName: existingAns.selectedBrandName,
      savedAt: existingAns.savedAt.toISOString()
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
    savedAt: now
  });
  const rev = mem.reveals.get(questionId);
  if (rev) {
    rev.isLocked = true;
  } else {
    mem.reveals.set(questionId, { revealStartedAt: now, isLocked: true });
  }
  mem.answeredCount = mem.answers.size;
  mem.unansweredCount = 50 - mem.answeredCount;
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb.insert(round2Answers).values({
        id: `ans-${mem.id}-${questionId}`,
        attemptId: mem.id,
        questionId,
        selectedLogoId: logoId,
        selectedOptionId: optId,
        selectedBrandName: brandName,
        isCardLocked: true,
        isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
        savedAt: now
      }).onConflictDoUpdate({
        target: [round2Answers.attemptId, round2Answers.questionId],
        set: {
          selectedLogoId: logoId,
          selectedOptionId: optId,
          selectedBrandName: brandName,
          isCardLocked: true,
          savedAt: now
        }
      });
    } catch (err) {
      logger.warn("Failed to persist Round 2 answer to DB:", { error: err.message });
    }
  }
  return c.json({
    success: true,
    questionId,
    selectedOptionId: optId,
    selectedBrandName: brandName,
    savedAt: now.toISOString()
  });
};
round2Router.put("/answers/:questionId", requireAuth, zValidator2("json", round2AnswerSchema), handleSaveAnswer);
round2Router.post("/answers/:questionId", requireAuth, zValidator2("json", round2AnswerSchema), handleSaveAnswer);
var round2ReviewSchema = z3.object({
  isMarkedForReview: z3.boolean()
});
round2Router.post(
  "/review/:questionId",
  requireAuth,
  zValidator2("json", round2ReviewSchema),
  async (c) => {
    const user = c.get("user");
    const questionId = c.req.param("questionId");
    const { isMarkedForReview } = c.req.valid("json");
    const now = /* @__PURE__ */ new Date();
    let mem = await getOrRestoreAttempt(user.id, user.teamName);
    if (!mem) {
      throw new AppError("NOT_FOUND", "No active Round 2 attempt found", 404);
    }
    if (mem.isSubmitted) {
      throw new AppError("FORBIDDEN", "Round 2 attempt has already been submitted", 403);
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
        savedAt: now
      });
    }
    const activeDb = getDatabase();
    if (activeDb) {
      try {
        await activeDb.insert(round2Answers).values({
          id: `ans-${mem.id}-${questionId}`,
          attemptId: mem.id,
          questionId,
          selectedLogoId: existing?.selectedLogoId || null,
          selectedOptionId: existing?.selectedOptionId || null,
          selectedBrandName: existing?.selectedBrandName || null,
          isMarkedForReview,
          savedAt: now
        }).onConflictDoUpdate({
          target: [round2Answers.attemptId, round2Answers.questionId],
          set: {
            isMarkedForReview,
            savedAt: now
          }
        });
      } catch (err) {
        logger.warn("Failed to persist review status to DB:", { error: err.message });
      }
    }
    return c.json({
      success: true,
      questionId,
      isMarkedForReview
    });
  }
);
var round2SecurityEventSchema = z3.object({
  eventType: z3.string(),
  metadata: z3.record(z3.string(), z3.any()).optional().default({})
});
round2Router.post(
  "/security-events",
  requireAuth,
  zValidator2("json", round2SecurityEventSchema),
  async (c) => {
    const user = c.get("user");
    const { eventType, metadata } = c.req.valid("json");
    const now = /* @__PURE__ */ new Date();
    const mem = await getOrRestoreAttempt(user.id, user.teamName);
    const isAnomaly = ["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT"].includes(eventType);
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
      createdAt: now
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
          createdAt: now
        });
      } catch (err) {
        logger.warn("Failed to persist Round 2 security event to DB:", { error: err.message });
      }
    }
    logger.warn(`Round 2 Security Event [${eventType}] from participant ${user.email}`, metadata);
    return c.json({
      success: true,
      eventRecorded: true,
      eliminated: isAnomaly
    });
  }
);
round2Router.post("/submit", requireAuth, async (c) => {
  const user = c.get("user");
  const now = /* @__PURE__ */ new Date();
  let mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem) {
    throw new AppError("NOT_FOUND", "No active Round 2 attempt found", 404);
  }
  if (mem.isDisqualified) {
    throw new AppError("FORBIDDEN", "Participant has been eliminated due to security anomaly. No second chance.", 403);
  }
  if (mem.isSubmitted) {
    return c.json({
      success: true,
      alreadySubmitted: true,
      result: {
        attemptId: mem.id,
        totalQuestions: 50,
        answeredCount: mem.answeredCount,
        unansweredCount: mem.unansweredCount,
        submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : now.toISOString()
      }
    });
  }
  let answeredCount = 0;
  let correctScore = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    if (ans.selectedOptionId || ans.selectedLogoId) {
      answeredCount++;
    }
    const rawQ = round2_questions_50_default.find((q) => q.questionId === qId);
    if (rawQ) {
      if (ans.selectedBrandName && ans.selectedBrandName.toLowerCase() === rawQ.correctBrandName.toLowerCase() || ans.selectedLogoId && ans.selectedLogoId === rawQ.correctLogoId) {
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
  const activeDb = getDatabase();
  if (activeDb) {
    try {
      await activeDb.update(round2Attempts).set({
        isSubmitted: true,
        submittedAt: now,
        answeredCount,
        unansweredCount
      }).where(eq5(round2Attempts.id, mem.id));
    } catch (err) {
      logger.warn("Failed to update submitted Round 2 attempt in DB:", { error: err.message });
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
      submittedAt: now.toISOString()
    }
  });
});
round2Router.get("/result", requireAuth, async (c) => {
  const user = c.get("user");
  const mem = await getOrRestoreAttempt(user.id, user.teamName);
  if (!mem || !mem.isSubmitted) {
    throw new AppError("NOT_FOUND", "No submitted Round 2 attempt found", 404);
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
      participantName: user.fullName
    }
  });
});
var round2_default = round2Router;

// src/server/routes/quiz.ts
var quizRouter = new Hono5();
var memoryAttempts = /* @__PURE__ */ new Map();
var memoryNotifications = /* @__PURE__ */ new Map();
var memorySecurityEvents = [];
function getSanitizedQuestions() {
  return quiz_questions_100_default.map((q) => ({
    id: q.question_id,
    number: q.source_question_number,
    category: q.category,
    text: q.question_text,
    options: [
      { key: "A", text: q.option_a },
      { key: "B", text: q.option_b },
      { key: "C", text: q.option_c },
      { key: "D", text: q.option_d }
    ]
  }));
}
quizRouter.get("/rounds-status", async (c) => {
  const status = await getRoundsStatus();
  return c.json({ success: true, ...status });
});
quizRouter.post("/round-1/start", requireAuth, async (c) => {
  const user = c.get("user");
  const active = await isRoundActive("round1");
  if (!active && user.role !== "admin" && user.role !== "super_admin") {
    throw new AppError(
      "ROUND_INACTIVE",
      "Round 1 Cultural Quiz is currently disabled by the competition administrator. Only rounds in ENABLED state can be attended by competitors.",
      403
    );
  }
  const now = /* @__PURE__ */ new Date();
  const durationMs = 60 * 60 * 1e3;
  const activeDb = getDatabase();
  let attempt;
  if (activeDb) {
    const existing = await activeDb.select().from(quizAttempts).where(eq6(quizAttempts.participantId, user.id)).limit(1);
    if (existing[0]) {
      attempt = {
        id: existing[0].id,
        startedAt: existing[0].startedAt,
        endsAt: existing[0].endsAt,
        isSubmitted: existing[0].isSubmitted,
        isAutoSubmitted: existing[0].isAutoSubmitted
      };
    } else {
      const endsAt = new Date(now.getTime() + durationMs);
      const inserted = await activeDb.insert(quizAttempts).values({
        participantId: user.id,
        startedAt: now,
        endsAt,
        totalQuestions: 100,
        unansweredCount: 100
      }).returning();
      attempt = {
        id: inserted[0].id,
        startedAt: inserted[0].startedAt,
        endsAt: inserted[0].endsAt,
        isSubmitted: inserted[0].isSubmitted,
        isAutoSubmitted: inserted[0].isAutoSubmitted
      };
    }
  } else {
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
        accuracyPercentage: "0.00",
        answers: /* @__PURE__ */ new Map()
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
      isAutoSubmitted: mem.isAutoSubmitted
    };
  }
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.endsAt.getTime() - Date.now()) / 1e3)
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
      totalQuestions: 100
    },
    questions: getSanitizedQuestions()
  });
});
quizRouter.get("/round-1/attempt", requireAuth, async (c) => {
  const user = c.get("user");
  const activeDb = getDatabase();
  if (activeDb) {
    const existing = await activeDb.select().from(quizAttempts).where(eq6(quizAttempts.participantId, user.id)).limit(1);
    if (!existing[0]) {
      return c.json({ success: true, attempt: null });
    }
    const currentAttempt = existing[0];
    const remainingSeconds = Math.max(
      0,
      Math.floor((currentAttempt.endsAt.getTime() - Date.now()) / 1e3)
    );
    const answersList = await activeDb.select().from(quizAnswers).where(eq6(quizAnswers.attemptId, currentAttempt.id));
    const answersMap = {};
    for (const ans of answersList) {
      answersMap[ans.questionId] = {
        selectedOption: null,
        // Will map to option key if needed
        isMarkedForReview: ans.isMarkedForReview
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
        answers: answersMap
      }
    });
  } else {
    const mem = memoryAttempts.get(user.id);
    if (!mem) {
      return c.json({ success: true, attempt: null });
    }
    const remainingSeconds = Math.max(
      0,
      Math.floor((mem.endsAt.getTime() - Date.now()) / 1e3)
    );
    const answersObj = {};
    for (const [qId, ans] of mem.answers.entries()) {
      answersObj[qId] = {
        selectedOption: ans.selectedOption,
        isMarkedForReview: ans.isMarkedForReview,
        savedAt: ans.savedAt.toISOString()
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
        answers: answersObj
      }
    });
  }
});
quizRouter.get("/round-1/questions", requireAuth, (c) => {
  return c.json({
    success: true,
    total: 100,
    questions: getSanitizedQuestions()
  });
});
var answerSchema = z4.object({
  selectedOption: z4.enum(["A", "B", "C", "D"]).nullable()
});
quizRouter.put(
  "/round-1/answers/:questionId",
  requireAuth,
  zValidator3("json", answerSchema),
  async (c) => {
    const user = c.get("user");
    const questionId = c.req.param("questionId");
    const { selectedOption } = c.req.valid("json");
    const now = /* @__PURE__ */ new Date();
    const questionExists = quiz_questions_100_default.some((q) => q.question_id === questionId);
    if (!questionExists) {
      throw new AppError("NOT_FOUND", "Question ID not found in quiz paper", 404);
    }
    const mem = memoryAttempts.get(user.id);
    if (mem) {
      if (mem.isDisqualified) {
        throw new AppError("FORBIDDEN", "Participant has been eliminated due to security anomaly. No second chance.", 403);
      }
      if (mem.isSubmitted) {
        throw new AppError("FORBIDDEN", "Quiz attempt has already been submitted", 403);
      }
      if (now > mem.endsAt) {
        throw new AppError("FORBIDDEN", "Quiz time has expired", 403);
      }
      const existingAns = mem.answers.get(questionId);
      mem.answers.set(questionId, {
        selectedOption,
        isMarkedForReview: existingAns ? existingAns.isMarkedForReview : false,
        savedAt: now
      });
      return c.json({
        success: true,
        questionId,
        selectedOption,
        savedAt: now.toISOString()
      });
    }
    return c.json({
      success: true,
      questionId,
      selectedOption,
      savedAt: now.toISOString()
    });
  }
);
var reviewSchema = z4.object({
  isMarkedForReview: z4.boolean()
});
quizRouter.post(
  "/round-1/review/:questionId",
  requireAuth,
  zValidator3("json", reviewSchema),
  async (c) => {
    const user = c.get("user");
    const questionId = c.req.param("questionId");
    const { isMarkedForReview } = c.req.valid("json");
    const now = /* @__PURE__ */ new Date();
    const mem = memoryAttempts.get(user.id);
    if (mem) {
      if (mem.isSubmitted) {
        throw new AppError("FORBIDDEN", "Quiz attempt has already been submitted", 403);
      }
      const existing = mem.answers.get(questionId);
      if (existing) {
        existing.isMarkedForReview = isMarkedForReview;
      } else {
        mem.answers.set(questionId, {
          selectedOption: null,
          isMarkedForReview,
          savedAt: now
        });
      }
    }
    return c.json({
      success: true,
      questionId,
      isMarkedForReview
    });
  }
);
var securityEventSchema = z4.object({
  eventType: z4.string(),
  metadata: z4.record(z4.string(), z4.any()).optional().default({})
});
quizRouter.post(
  "/round-1/security-events",
  requireAuth,
  zValidator3("json", securityEventSchema),
  async (c) => {
    const user = c.get("user");
    const { eventType, metadata } = c.req.valid("json");
    const now = /* @__PURE__ */ new Date();
    const mem = memoryAttempts.get(user.id);
    const isAnomaly = ["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT"].includes(eventType);
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
      createdAt: now
    });
    logger.warn(`Security Event [${eventType}] from participant ${user.email}`, metadata);
    return c.json({
      success: true,
      eventRecorded: true,
      eliminated: isAnomaly
    });
  }
);
quizRouter.post("/round-1/submit", requireAuth, async (c) => {
  const user = c.get("user");
  const now = /* @__PURE__ */ new Date();
  const mem = memoryAttempts.get(user.id);
  if (!mem) {
    throw new AppError("NOT_FOUND", "No active quiz attempt found", 404);
  }
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
        submittedAt: mem.submittedAt ? mem.submittedAt.toISOString() : now.toISOString()
      }
    });
  }
  let correctCount = 0;
  let wrongCount = 0;
  let answeredCount = 0;
  for (const q of quiz_questions_100_default) {
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
  const score = correctCount;
  const accuracy = answeredCount > 0 ? (correctCount / answeredCount * 100).toFixed(2) : "0.00";
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
      await activeDb.update(quizAttempts).set({
        isSubmitted: true,
        isAutoSubmitted: mem.isAutoSubmitted,
        submittedAt: now,
        score,
        answeredCount,
        correctCount,
        wrongCount,
        unansweredCount,
        accuracyPercentage: accuracy
      }).where(eq6(quizAttempts.participantId, user.id));
    } catch (err) {
      logger.warn("Failed to update Quiz attempt in DB:", { error: err.message });
    }
  }
  const notifId = `notif-round1-${mem.id}`;
  let userNotifs = memoryNotifications.get(user.id);
  if (!userNotifs) {
    userNotifs = [];
    memoryNotifications.set(user.id, userNotifs);
  }
  if (!userNotifs.some((n) => n.id === notifId)) {
    const notifItem = {
      id: notifId,
      participantId: user.id,
      title: "Round 1 Completed",
      message: "Your Cultural Knowledge Quiz has been submitted successfully. Your marks are now available on the leaderboard.",
      type: "ROUND_1_COMPLETION",
      score,
      isRead: false,
      createdAt: now.toISOString()
    };
    userNotifs.push(notifItem);
    if (activeDb) {
      try {
        await activeDb.insert(notifications).values({
          id: notifId,
          participantId: user.id,
          title: notifItem.title,
          message: notifItem.message,
          type: notifItem.type,
          isRead: false,
          createdAt: now
        }).onConflictDoNothing();
      } catch (err) {
        logger.warn("Failed to persist notification to DB:", { error: err.message });
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
      submittedAt: now.toISOString()
    }
  });
});
quizRouter.get("/round-1/result", requireAuth, (c) => {
  const user = c.get("user");
  const mem = memoryAttempts.get(user.id);
  if (!mem || !mem.isSubmitted) {
    throw new AppError("NOT_FOUND", "No submitted quiz attempt found", 404);
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
      participantName: user.fullName
    }
  });
});
quizRouter.route("/round-2", round2_default);
var quiz_default = quizRouter;

// src/server/routes/leaderboard.ts
import { Hono as Hono6 } from "hono";
import { eq as eq7, desc as desc2, asc } from "drizzle-orm";
var leaderboardRouter = new Hono6();
var r2CorrectAnswersMap = new Map(
  round2_questions_50_default.map((q) => [
    q.questionId,
    { logoId: q.correctLogoId, brandName: q.correctBrandName?.toLowerCase() }
  ])
);
function calculateMemRound2Score(mem) {
  if (!mem || !mem.answers) return 0;
  let score = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    const correct = r2CorrectAnswersMap.get(qId);
    if (!correct) continue;
    if (ans.selectedBrandName && ans.selectedBrandName.toLowerCase() === correct.brandName || ans.selectedLogoId && ans.selectedLogoId === correct.logoId) {
      score += 1;
    }
  }
  return score;
}
async function getRound1Leaderboard() {
  const activeDb = getDatabase();
  const entries = [];
  const seenParticipants = /* @__PURE__ */ new Set();
  if (activeDb) {
    try {
      const dbRows = await activeDb.select({
        participantId: quizAttempts.participantId,
        score: quizAttempts.score,
        accuracyPercentage: quizAttempts.accuracyPercentage,
        submittedAt: quizAttempts.submittedAt,
        teamName: participants.teamName,
        fullName: users.fullName
      }).from(quizAttempts).leftJoin(participants, eq7(quizAttempts.participantId, participants.id)).leftJoin(users, eq7(participants.userId, users.id)).where(eq7(quizAttempts.isSubmitted, true)).orderBy(desc2(quizAttempts.score), asc(quizAttempts.submittedAt));
      for (const row of dbRows) {
        seenParticipants.add(row.participantId);
        const adj = teamMarkAdjustments.get((row.teamName || "").trim())?.round1Adjustment || 0;
        entries.push({
          participantId: row.participantId,
          participantName: row.fullName || "Contestant",
          teamName: row.teamName || "Team Vibes",
          score: Math.max(0, row.score + adj),
          accuracyPercentage: row.accuracyPercentage,
          submittedAt: row.submittedAt
        });
      }
    } catch {
    }
  }
  for (const [userId, mem] of memoryAttempts.entries()) {
    if (mem.isSubmitted && !seenParticipants.has(userId) && !mem.isDisqualified) {
      seenParticipants.add(userId);
      const adj = teamMarkAdjustments.get((mem.teamName || "").trim())?.round1Adjustment || 0;
      entries.push({
        participantId: userId,
        participantName: mem.participantName || "Contestant",
        teamName: mem.teamName || "Team Vibes",
        score: Math.max(0, mem.score + adj),
        accuracyPercentage: mem.accuracyPercentage,
        submittedAt: mem.submittedAt
      });
    }
  }
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return timeA - timeB;
  });
  return entries.map((entry, idx) => ({
    rank: idx + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamName: entry.teamName,
    score: entry.score,
    accuracyPercentage: entry.accuracyPercentage,
    submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null
  }));
}
function getRound2Leaderboard() {
  const entries = [];
  for (const [userId, mem] of memoryRound2Attempts.entries()) {
    if (mem.isSubmitted && !mem.isDisqualified) {
      const baseScore = calculateMemRound2Score(mem);
      const adj = teamMarkAdjustments.get((mem.teamName || "").trim())?.round2Adjustment || 0;
      const totalR2Score = Math.max(0, baseScore + adj);
      entries.push({
        participantId: userId,
        participantName: mem.teamName || "Contestant",
        teamName: mem.teamName || "Team Vibes",
        score: totalR2Score,
        baseScore,
        adjustment: adj,
        answeredCount: mem.answeredCount || 0,
        submittedAt: mem.submittedAt
      });
    }
  }
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
    return timeA - timeB;
  });
  return entries.map((entry, idx) => ({
    rank: idx + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamName: entry.teamName,
    score: entry.score,
    baseScore: entry.baseScore,
    adjustment: entry.adjustment,
    answeredCount: entry.answeredCount,
    submittedAt: entry.submittedAt ? entry.submittedAt.toISOString() : null
  }));
}
async function getOverallLeaderboard() {
  const r1 = await getRound1Leaderboard();
  const r2 = getRound2Leaderboard();
  const teamsMap = /* @__PURE__ */ new Map();
  for (const item of r1) {
    const key = item.teamName.toLowerCase();
    teamsMap.set(key, {
      participantId: item.participantId,
      participantName: item.participantName,
      teamName: item.teamName,
      round1Score: item.score,
      round2Score: 0,
      totalScore: item.score,
      submittedAt: item.submittedAt
    });
  }
  for (const item of r2) {
    const key = item.teamName.toLowerCase();
    const existing = teamsMap.get(key);
    if (existing) {
      existing.round2Score = item.score;
      existing.totalScore = existing.round1Score + item.score;
      if (item.submittedAt) existing.submittedAt = item.submittedAt;
    } else {
      teamsMap.set(key, {
        participantId: item.participantId,
        participantName: item.participantName,
        teamName: item.teamName,
        round1Score: 0,
        round2Score: item.score,
        totalScore: item.score,
        submittedAt: item.submittedAt
      });
    }
  }
  const list = Array.from(teamsMap.values());
  list.sort((a, b) => b.totalScore - a.totalScore);
  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}
leaderboardRouter.get("/", async (c) => {
  const round = c.req.query("round");
  const r1 = await getRound1Leaderboard();
  const r2 = getRound2Leaderboard();
  const overall = await getOverallLeaderboard();
  if (round === "round2") {
    return c.json({
      success: true,
      round: "round2",
      leaderboard: r2,
      round1: r1,
      round2: r2,
      overall
    });
  }
  if (round === "overall") {
    return c.json({
      success: true,
      round: "overall",
      leaderboard: overall,
      round1: r1,
      round2: r2,
      overall
    });
  }
  return c.json({
    success: true,
    round: "round1",
    leaderboard: r1,
    round1: r1,
    round2: r2,
    overall
  });
});
leaderboardRouter.get("/all", async (c) => {
  const round1 = await getRound1Leaderboard();
  const round2 = getRound2Leaderboard();
  const overall = await getOverallLeaderboard();
  return c.json({
    success: true,
    round1,
    round2,
    overall
  });
});
var leaderboard_default = leaderboardRouter;

// src/server/routes/proctoring.ts
import { Hono as Hono7 } from "hono";
var proctoringRouter = new Hono7();
proctoringRouter.get("/events", (c) => {
  return c.json({ success: true, events: [] });
});
var proctoring_default = proctoringRouter;

// src/server/routes/notifications.ts
import { Hono as Hono8 } from "hono";
import { eq as eq8, desc as desc3 } from "drizzle-orm";
var notificationsRouter = new Hono8();
notificationsRouter.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const activeDb = getDatabase();
  const memNotifs = memoryNotifications.get(user.id) || [];
  if (activeDb) {
    try {
      const dbNotifs = await activeDb.select().from(notifications).where(eq8(notifications.participantId, user.id)).orderBy(desc3(notifications.createdAt));
      if (dbNotifs.length > 0) {
        return c.json({
          success: true,
          notifications: dbNotifs.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt
          }))
        });
      }
    } catch {
    }
  }
  return c.json({
    success: true,
    notifications: memNotifs
  });
});
var notifications_default = notificationsRouter;

// src/server/routes/admin.ts
import { Hono as Hono9 } from "hono";
import { setCookie as setCookie2, deleteCookie as deleteCookie3 } from "hono/cookie";
var adminRouter = new Hono9();
adminRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, passkey } = body;
    if (!email || !passkey) {
      return c.json({
        success: false,
        error: { code: "MISSING_CREDENTIALS", message: "Email ID and passkey are required." }
      }, 400);
    }
    if (email.trim().toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() || passkey !== ADMIN_CREDENTIALS.passkey) {
      return c.json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid admin credentials or passkey." }
      }, 401);
    }
    const sessionId = crypto.randomUUID();
    setCookie2(c, SESSION_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: SESSION_MAX_AGE
    });
    const user = {
      id: "usr-admin-darkdev",
      email: ADMIN_CREDENTIALS.email,
      fullName: ADMIN_CREDENTIALS.fullName,
      role: "admin"
    };
    return c.json({
      success: true,
      user,
      message: "Admin authorization granted"
    });
  } catch (err) {
    logger.error("Admin login failed:", { error: err.message });
    return c.json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Admin login failed." }
    }, 500);
  }
});
adminRouter.post("/logout", async (c) => {
  deleteCookie3(c, SESSION_COOKIE_NAME);
  return c.json({ success: true, message: "Admin logged out successfully" });
});
adminRouter.use("*", requireAuth, requireRole("admin", "super_admin"));
adminRouter.get("/me", (c) => {
  const user = c.get("user");
  return c.json({ success: true, user });
});
adminRouter.get("/stats", async (c) => {
  try {
    const stats = await getAdminStats();
    return c.json({ success: true, stats });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.get("/events", async (c) => {
  const events2 = await getEvents();
  return c.json({ success: true, events: events2 });
});
adminRouter.post("/events", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || !body.name.trim()) {
      return c.json({ success: false, error: { message: "Event name is required." } }, 400);
    }
    const created = await createEvent({
      name: body.name.trim(),
      round1DurationMinutes: body.round1DurationMinutes ? Number(body.round1DurationMinutes) : 60,
      round1TotalQuestions: body.round1TotalQuestions ? Number(body.round1TotalQuestions) : 100,
      round1IsActive: body.round1IsActive !== void 0 ? Boolean(body.round1IsActive) : true,
      round2IsActive: body.round2IsActive !== void 0 ? Boolean(body.round2IsActive) : true
    });
    return c.json({ success: true, event: created, message: "Event created successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.put("/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = await updateEvent(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: "Event not found." } }, 404);
    }
    return c.json({ success: true, event: updated, message: "Event updated successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.delete("/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const ok = await deleteEvent(id);
    if (!ok) {
      return c.json({ success: false, error: { message: "Event not found or could not be deleted." } }, 404);
    }
    return c.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.patch("/events/:id/toggle-round", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { round, active } = body;
    const updateData = {};
    if (round === "round1") updateData.round1IsActive = Boolean(active);
    if (round === "round2") updateData.round2IsActive = Boolean(active);
    const updated = await updateEvent(id, updateData);
    if (!updated) {
      return c.json({ success: false, error: { message: "Event not found." } }, 404);
    }
    return c.json({
      success: true,
      event: updated,
      message: `${round === "round1" ? "Round 1" : "Round 2"} is now ${Boolean(active) ? "ACTIVE" : "INACTIVE"}`
    });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.get("/rounds", async (c) => {
  const status = await getRoundsStatus();
  return c.json({ success: true, ...status });
});
adminRouter.post("/rounds/toggle", async (c) => {
  try {
    const body = await c.req.json();
    const { round, active } = body;
    if (round !== "round1" && round !== "round2") {
      return c.json(
        { success: false, error: { message: 'Invalid round identifier. Use "round1" or "round2".' } },
        400
      );
    }
    const updated = await setRoundActive(round, Boolean(active));
    const roundName = round === "round1" ? "Round 1 Cultural Quiz" : "Round 2 Logo Quiz";
    const statusText = Boolean(active) ? "ENABLED (Competitors Can Attend)" : "DISABLED (Locked For Competitors)";
    return c.json({
      success: true,
      round,
      active: Boolean(active),
      event: updated,
      message: `${roundName} is now ${statusText}`
    });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.get("/questions/round-1", (c) => {
  const search = c.req.query("search");
  const category = c.req.query("category");
  const difficulty = c.req.query("difficulty");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const result = getRound1Questions({ search, category, difficulty, page, limit });
  return c.json({ success: true, ...result });
});
adminRouter.get("/questions/round-1/categories", (c) => {
  const result = getRound1Questions({ limit: 1e3 });
  return c.json({ success: true, categories: result.categories });
});
adminRouter.post("/questions/round-1", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.question_text || !body.option_a || !body.option_b) {
      return c.json({ success: false, error: { message: "Question text and options A and B are required." } }, 400);
    }
    const created = addRound1Question({
      question_text: body.question_text.trim(),
      category: body.category?.trim() || "General Knowledge",
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c?.trim() || "",
      option_d: body.option_d?.trim() || "",
      correct_option: (body.correct_option || "A").toUpperCase(),
      difficulty: body.difficulty || "Medium",
      explanation: body.explanation || ""
    });
    return c.json({ success: true, question: created, message: "Question added to Round 1 successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.put("/questions/round-1/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = updateRound1Question(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: "Question not found." } }, 404);
    }
    return c.json({ success: true, question: updated, message: "Question updated successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.delete("/questions/round-1/:id", (c) => {
  const id = c.req.param("id");
  const ok = deleteRound1Question(id);
  if (!ok) {
    return c.json({ success: false, error: { message: "Question not found or already deleted." } }, 404);
  }
  return c.json({ success: true, message: "Question deleted from Round 1 successfully" });
});
adminRouter.get("/questions/round-2", (c) => {
  const search = c.req.query("search");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const result = getRound2QuestionsList({ search, page, limit });
  return c.json({ success: true, ...result });
});
adminRouter.post("/questions/round-2", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.questionText || !body.correctBrandName) {
      return c.json({ success: false, error: { message: "Question text and correct brand name are required." } }, 400);
    }
    const created = addRound2Question({
      questionText: body.questionText.trim(),
      correctBrandName: body.correctBrandName.trim(),
      correctLogoId: body.correctLogoId || "L001",
      options: body.options || []
    });
    return c.json({ success: true, question: created, message: "Question added to Round 2 successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.put("/questions/round-2/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = updateRound2Question(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: "Round 2 question not found." } }, 404);
    }
    return c.json({ success: true, question: updated, message: "Round 2 question updated successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.delete("/questions/round-2/:id", (c) => {
  const id = c.req.param("id");
  const ok = deleteRound2Question(id);
  if (!ok) {
    return c.json({ success: false, error: { message: "Question not found or already deleted." } }, 404);
  }
  return c.json({ success: true, message: "Question deleted from Round 2 successfully" });
});
adminRouter.get("/members", async (c) => {
  const search = c.req.query("search");
  const role = c.req.query("role");
  const qualified = c.req.query("qualified");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 25;
  const result = await getMembers({ search, role, qualified, page, limit });
  return c.json({ success: true, ...result });
});
adminRouter.post("/members", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.fullName || !body.email) {
      return c.json({ success: false, error: { message: "Full name and email are required." } }, 400);
    }
    const created = await addMember({
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role || "participant",
      registrationNumber: body.registrationNumber?.trim(),
      collegeName: body.collegeName?.trim(),
      department: body.department?.trim(),
      yearOfStudy: body.yearOfStudy?.trim(),
      phone: body.phone?.trim(),
      teamName: body.teamName?.trim(),
      isQualifiedForRound2: Boolean(body.isQualifiedForRound2)
    });
    return c.json({ success: true, member: created, message: "Member created successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.put("/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = await updateMember(id, body);
    if (!updated) {
      return c.json({ success: false, error: { message: "Member not found." } }, 404);
    }
    return c.json({ success: true, member: updated, message: "Member updated successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.delete("/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const ok = await deleteMember(id);
    if (!ok) {
      return c.json({ success: false, error: { message: "Member not found or could not be deleted." } }, 404);
    }
    return c.json({ success: true, message: "Member deleted successfully" });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.post("/members/:id/reset-attempt", (c) => {
  const id = c.req.param("id");
  const ok = resetMemberAttempt(id);
  if (!ok) {
    return c.json({ success: false, error: { message: "Member not found." } }, 404);
  }
  return c.json({ success: true, message: "Quiz attempt reset successfully. Participant can retake quiz." });
});
adminRouter.get("/round2-config", (c) => {
  return c.json({ success: true, config: getRound2Config() });
});
adminRouter.put("/round2-config", async (c) => {
  try {
    const body = await c.req.json();
    const updated = updateRound2Config(body);
    return c.json({
      success: true,
      config: updated,
      message: `Round 2 config updated: Flip duration ${updated.cardFlipDurationSeconds}s, overall duration ${updated.overallDurationMinutes}m`
    });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.post("/round2-config", async (c) => {
  try {
    const body = await c.req.json();
    const updated = updateRound2Config(body);
    return c.json({
      success: true,
      config: updated,
      message: `Round 2 config updated: Flip duration ${updated.cardFlipDurationSeconds}s, overall duration ${updated.overallDurationMinutes}m`
    });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
var r2AnswersCorrectMap = new Map(
  round2_questions_50_default.map((q) => [
    q.questionId,
    { logoId: q.correctLogoId, brandName: q.correctBrandName?.toLowerCase() }
  ])
);
function computeRound2Score(mem) {
  if (!mem || !mem.answers) return 0;
  let score = 0;
  for (const [qId, ans] of mem.answers.entries()) {
    const correct = r2AnswersCorrectMap.get(qId);
    if (!correct) continue;
    if (ans.selectedBrandName && ans.selectedBrandName.toLowerCase() === correct.brandName || ans.selectedLogoId && ans.selectedLogoId === correct.logoId) {
      score += 1;
    }
  }
  return score;
}
adminRouter.get("/team-marks", (c) => {
  const teamMap = /* @__PURE__ */ new Map();
  const getOrCreateTeam = (teamName, participantName) => {
    const clean = (teamName || "Unknown Team").trim();
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
        overallTotalScore: (adj.round1Adjustment || 0) + (adj.round2Adjustment || 0)
      });
    }
    const t = teamMap.get(clean);
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
      overallTotalScore: r1Total + r2Total
    };
  });
  teamsList.sort((a, b) => b.overallTotalScore - a.overallTotalScore);
  return c.json({ success: true, teams: teamsList });
});
adminRouter.post("/team-marks/adjust", async (c) => {
  try {
    const body = await c.req.json();
    const { teamName, round, delta } = body;
    if (!teamName || !teamName.trim()) {
      return c.json({ success: false, error: { message: "Team name is required." } }, 400);
    }
    if (round !== "round1" && round !== "round2") {
      return c.json({ success: false, error: { message: 'Round must be "round1" or "round2".' } }, 400);
    }
    const numDelta = Number(delta);
    if (isNaN(numDelta)) {
      return c.json({ success: false, error: { message: "Valid marks delta is required." } }, 400);
    }
    const updated = adjustTeamMarks(teamName, round, numDelta);
    return c.json({
      success: true,
      adjustment: updated,
      message: `Adjusted marks for ${teamName} in ${round === "round1" ? "Round 1" : "Round 2"} by ${numDelta > 0 ? "+" : ""}${numDelta}`
    });
  } catch (err) {
    return c.json({ success: false, error: { message: err.message } }, 500);
  }
});
adminRouter.get("/active-participants", (c) => {
  const activeList = [];
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
      round1Status: r1 ? r1.isSubmitted ? isDisq ? "ELIMINATED" : "SUBMITTED" : "IN_PROGRESS" : "NOT_STARTED",
      round1Score: r1?.score || 0,
      round2Status: r2 ? r2.isSubmitted ? isDisq ? "ELIMINATED" : "SUBMITTED" : "IN_PROGRESS" : "NOT_STARTED",
      round2Answered: r2?.answeredCount || 0,
      isDisqualified: isDisq,
      lastActive: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return c.json({ success: true, participants: activeList });
});
adminRouter.post("/participants/:id/remove", (c) => {
  const id = c.req.param("id");
  const ok = removeActiveParticipant(id);
  if (!ok) {
    return c.json({ success: false, error: { message: "Failed to remove active participant." } }, 404);
  }
  return c.json({
    success: true,
    message: "Active participant removed and eliminated from competition arena."
  });
});
var admin_default = adminRouter;

// src/server/routes/analytics.ts
import { Hono as Hono10 } from "hono";
var analyticsRouter = new Hono10();
analyticsRouter.get("/summary", (c) => {
  return c.json({ success: true, summary: {} });
});
var analytics_default = analyticsRouter;

// src/server/routes/reports.ts
import { Hono as Hono11 } from "hono";
var reportsRouter = new Hono11();
reportsRouter.get("/", (c) => {
  return c.json({ success: true, reports: [] });
});
var reports_default = reportsRouter;

// src/server/app.ts
var app = new Hono12();
app.use("*", requestLogger);
app.use("*", securityHeaders);
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin || origin.includes("localhost") || origin.includes("vercel.app")) {
        return origin || "*";
      }
      return env.CORS_ORIGIN || origin;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Request-ID"]
  })
);
app.onError(errorHandler);
var v1 = new Hono12();
v1.route("/health", health_default);
v1.route("/auth", auth_default);
v1.route("/participants", participants_default);
v1.route("/participant", participants_default);
v1.route("/quiz", quiz_default);
v1.route("/leaderboard", leaderboard_default);
v1.route("/proctor", proctoring_default);
v1.route("/round2", round2_default);
v1.route("/notifications", notifications_default);
v1.route("/admin", admin_default);
v1.route("/analytics", analytics_default);
v1.route("/reports", reports_default);
app.route("/api/v1", v1);
app.route("/v1", v1);
app.route("/health", health_default);
app.get("/api", (c) => c.json({ status: "ok", service: "SKP Skill Arena API", version: "1.0.0" }));
app.get("/api/health", (c) => c.json({ status: "ok", service: "SKP Skill Arena API", version: "1.0.0" }));
var app_default = app;

// src/server/api.ts
var config = {
  runtime: "nodejs"
};
var listener = getRequestListener(app_default.fetch);
function handler(req, res) {
  try {
    if (res && typeof res.writeHead === "function") {
      if (req && (req.url === "/api" || req.url === "/api/")) {
        const originalUrl = req.headers && (req.headers["x-forwarded-uri"] || req.headers["x-matched-path"]);
        if (typeof originalUrl === "string" && originalUrl.startsWith("/api")) {
          req.url = originalUrl;
        }
      }
      return listener(req, res);
    }
    return app_default.fetch(req);
  } catch (err) {
    console.error("SERVERLESS EXECUTION ERROR:", err);
    if (res && typeof res.status === "function") {
      return res.status(500).json({
        success: false,
        error: { message: err?.message || "Serverless invocation error" }
      });
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: err?.message || "Serverless invocation error" }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
export {
  config,
  handler as default
};
