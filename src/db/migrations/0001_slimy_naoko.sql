ALTER TABLE "proctor_events" ALTER COLUMN "severity" SET DEFAULT 'INFO';--> statement-breakpoint
ALTER TABLE "security_events" ALTER COLUMN "severity" SET DEFAULT 'WARNING';--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN "security_state" text DEFAULT 'SECURE' NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN "violation_count" integer DEFAULT 0 NOT NULL;