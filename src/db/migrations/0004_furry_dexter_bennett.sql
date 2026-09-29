CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'INFO' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_question_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"sequence_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "round1_duration_minutes" SET DEFAULT 60;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_question_mappings" ADD CONSTRAINT "round2_question_mappings_attempt_id_round2_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."round2_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_question_mappings" ADD CONSTRAINT "round2_question_mappings_question_id_round2_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."round2_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_participant_idx" ON "notifications" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_qm_attempt_seq_idx" ON "round2_question_mappings" USING btree ("attempt_id","sequence_order");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_qm_attempt_question_idx" ON "round2_question_mappings" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "round2_qm_attempt_idx" ON "round2_question_mappings" USING btree ("attempt_id");