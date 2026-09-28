CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"registration_number" text NOT NULL,
	"college_name" text NOT NULL,
	"phone" text NOT NULL,
	"department" text NOT NULL,
	"year_of_study" text NOT NULL,
	"is_qualified_for_round2" boolean DEFAULT false NOT NULL,
	"preflight_completed" boolean DEFAULT false NOT NULL,
	"preflight_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"device_fingerprint" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'SKP Cultural Fest 2026 - Skill Arena' NOT NULL,
	"round1_started_at" timestamp with time zone,
	"round1_ended_at" timestamp with time zone,
	"round1_duration_minutes" integer DEFAULT 80 NOT NULL,
	"round1_total_questions" integer DEFAULT 100 NOT NULL,
	"round1_is_active" boolean DEFAULT false NOT NULL,
	"round2_is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_data" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" integer NOT NULL,
	"time_taken_seconds" integer NOT NULL,
	"is_top_15" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_id" uuid,
	"is_marked_for_review" boolean DEFAULT false NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"is_auto_submitted" boolean DEFAULT false NOT NULL,
	"is_disqualified" boolean DEFAULT false NOT NULL,
	"disqualification_reason" text,
	"total_questions" integer DEFAULT 100 NOT NULL,
	"answered_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"unanswered_count" integer DEFAULT 100 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"accuracy_percentage" text DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_key" text NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_question_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sequence_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"category" text DEFAULT 'General Technical' NOT NULL,
	"difficulty" text DEFAULT 'Medium' NOT NULL,
	"positive_marks" integer DEFAULT 1 NOT NULL,
	"negative_marks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_questions_question_number_unique" UNIQUE("question_number")
);
--> statement-breakpoint
CREATE TABLE "proctor_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"attempt_id" uuid,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'LOW' NOT NULL,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"severity" text DEFAULT 'MEDIUM' NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"tile_number" integer,
	"action_type" text NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"previous_state" text NOT NULL,
	"new_state" text NOT NULL,
	"host_user_id" uuid,
	"can_undo" boolean DEFAULT true NOT NULL,
	"is_undone" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_game_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"current_state" text DEFAULT 'READY' NOT NULL,
	"current_team_id" uuid,
	"current_tile_number" integer,
	"round_number" integer DEFAULT 1 NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"state_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round2_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_number" integer NOT NULL,
	"team_name" text NOT NULL,
	"participant1_id" uuid,
	"participant2_id" uuid,
	"score" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"wrong_answers" integer DEFAULT 0 NOT NULL,
	"turn_order" integer NOT NULL,
	"is_eliminated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "round2_teams_team_number_unique" UNIQUE("team_number")
);
--> statement-breakpoint
CREATE TABLE "round2_tiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tile_number" integer NOT NULL,
	"brand_name" text NOT NULL,
	"category" text DEFAULT 'General Brand' NOT NULL,
	"logo_image_url" text NOT NULL,
	"difficulty" text DEFAULT 'Medium' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"is_revealed" boolean DEFAULT false NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"selected_by_team_id" uuid,
	"scored_correctly" boolean,
	"revealed_at" timestamp with time zone,
	"scored_at" timestamp with time zone,
	CONSTRAINT "round2_tiles_tile_number_unique" UNIQUE("tile_number")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"reason" text,
	"before_state" text,
	"after_state" text,
	"request_id" text,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"ip_hash" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_results" ADD CONSTRAINT "qualification_results_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_selected_option_id_quiz_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."quiz_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question_mappings" ADD CONSTRAINT "quiz_question_mappings_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question_mappings" ADD CONSTRAINT "quiz_question_mappings_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_events" ADD CONSTRAINT "proctor_events_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_events" ADD CONSTRAINT "proctor_events_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_actions" ADD CONSTRAINT "round2_actions_team_id_round2_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."round2_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_game_state" ADD CONSTRAINT "round2_game_state_current_team_id_round2_teams_id_fk" FOREIGN KEY ("current_team_id") REFERENCES "public"."round2_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_game_state" ADD CONSTRAINT "round2_game_state_current_tile_number_round2_tiles_tile_number_fk" FOREIGN KEY ("current_tile_number") REFERENCES "public"."round2_tiles"("tile_number") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_teams" ADD CONSTRAINT "round2_teams_participant1_id_participants_id_fk" FOREIGN KEY ("participant1_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_teams" ADD CONSTRAINT "round2_teams_participant2_id_participants_id_fk" FOREIGN KEY ("participant2_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round2_tiles" ADD CONSTRAINT "round2_tiles_selected_by_team_id_round2_teams_id_fk" FOREIGN KEY ("selected_by_team_id") REFERENCES "public"."round2_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "participants_user_id_idx" ON "participants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_reg_num_idx" ON "participants" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "qualification_participant_idx" ON "qualification_results" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "qualification_rank_idx" ON "qualification_results" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_answers_attempt_question_idx" ON "quiz_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_attempt_idx" ON "quiz_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempts_participant_idx" ON "quiz_attempts" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_is_submitted_idx" ON "quiz_attempts" USING btree ("is_submitted");--> statement-breakpoint
CREATE INDEX "quiz_options_question_id_idx" ON "quiz_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_qm_attempt_seq_idx" ON "quiz_question_mappings" USING btree ("attempt_id","sequence_order");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_qm_attempt_question_idx" ON "quiz_question_mappings" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "proctor_events_participant_idx" ON "proctor_events" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "proctor_events_attempt_idx" ON "proctor_events" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "proctor_events_event_type_idx" ON "proctor_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "proctor_events_created_at_idx" ON "proctor_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_events_user_idx" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_events_severity_idx" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "round2_actions_timestamp_idx" ON "round2_actions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "round2_actions_tile_idx" ON "round2_actions" USING btree ("tile_number");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_teams_number_idx" ON "round2_teams" USING btree ("team_number");--> statement-breakpoint
CREATE INDEX "round2_teams_score_idx" ON "round2_teams" USING btree ("score");--> statement-breakpoint
CREATE UNIQUE INDEX "round2_tiles_number_idx" ON "round2_tiles" USING btree ("tile_number");--> statement-breakpoint
CREATE INDEX "round2_tiles_is_used_idx" ON "round2_tiles" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");