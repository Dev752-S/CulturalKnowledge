CREATE TABLE "logos" (
	"id" text PRIMARY KEY NOT NULL,
	"tile_number" integer NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'General Brand' NOT NULL,
	"difficulty" text DEFAULT 'Medium' NOT NULL,
	"recommended_points" integer DEFAULT 10 NOT NULL,
	"png_path" text NOT NULL,
	"svg_path" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logos_tile_number_unique" UNIQUE("tile_number")
);
--> statement-breakpoint
CREATE TABLE "round2_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_logo_id" text,
	"is_marked_for_review" boolean DEFAULT false NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"team_name" text,
	"started_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"total_questions" integer DEFAULT 50 NOT NULL,
	"answered_count" integer DEFAULT 0 NOT NULL,
	"unanswered_count" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"logo_id" text NOT NULL,
	"option_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"correct_logo_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "round2_questions_question_number_unique" UNIQUE("question_number")
);
--> statement-breakpoint
CREATE TABLE "round2_security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"attempt_id" text,
	"event_type" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "round2_answers" ADD CONSTRAINT "round2_answers_attempt_id_round2_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."round2_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_answers" ADD CONSTRAINT "round2_answers_question_id_round2_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."round2_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_attempts" ADD CONSTRAINT "round2_attempts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_options" ADD CONSTRAINT "round2_options_question_id_round2_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."round2_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_options" ADD CONSTRAINT "round2_options_logo_id_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."logos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_questions" ADD CONSTRAINT "round2_questions_correct_logo_id_logos_id_fk" FOREIGN KEY ("correct_logo_id") REFERENCES "public"."logos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_security_events" ADD CONSTRAINT "round2_security_events_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "logos_tile_number_idx" ON "logos" USING btree ("tile_number");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_answers_attempt_q_idx" ON "round2_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "round2_answers_attempt_idx" ON "round2_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_attempts_participant_idx" ON "round2_attempts" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "round2_attempts_is_submitted_idx" ON "round2_attempts" USING btree ("is_submitted");--> statement-breakpoint
CREATE INDEX "round2_options_question_idx" ON "round2_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_questions_number_idx" ON "round2_questions" USING btree ("question_number");--> statement-breakpoint
CREATE INDEX "round2_sec_events_participant_idx" ON "round2_security_events" USING btree ("participant_id");