CREATE TABLE "andi_web_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "andi_web_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "andi_web_audit_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resourceId" varchar(255),
	"details" jsonb,
	"ipAddress" varchar(45),
	"userAgent" text,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "andi_web_onboarding_content" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"screen_name" varchar(50) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_key" varchar(100) NOT NULL,
	"content_value" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_onboarding_goals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"category" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_onboarding_progress" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"current_step" integer DEFAULT 1,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"step_data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "andi_web_teacher_profile" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"school_id" varchar(255),
	"grades_taught" jsonb,
	"subjects_taught" jsonb,
	"years_experience" integer,
	"teaching_styles" jsonb,
	"personal_interests" jsonb,
	"strengths" jsonb,
	"voice_sample_url" varchar(500),
	"avatar_url" varchar(500),
	"onboarding_completed" boolean DEFAULT false,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_user_preference" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_user_session" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"sessionType" varchar(100) NOT NULL,
	"sessionData" jsonb,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"startedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"endedAt" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "andi_web_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" varchar(255),
	"role" varchar(50) DEFAULT 'teacher' NOT NULL,
	"schoolId" varchar(255),
	"districtId" varchar(255),
	"gradeLevels" jsonb,
	"subjects" jsonb,
	"yearsExperience" integer,
	"certificationLevel" varchar(100),
	"preferences" jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "andi_web_verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "andi_web_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "andi_web_account" ADD CONSTRAINT "andi_web_account_userId_andi_web_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_audit_log" ADD CONSTRAINT "andi_web_audit_log_userId_andi_web_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_onboarding_progress" ADD CONSTRAINT "andi_web_onboarding_progress_user_id_andi_web_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_session" ADD CONSTRAINT "andi_web_session_userId_andi_web_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_teacher_profile" ADD CONSTRAINT "andi_web_teacher_profile_user_id_andi_web_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_user_preference" ADD CONSTRAINT "andi_web_user_preference_userId_andi_web_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "andi_web_user_session" ADD CONSTRAINT "andi_web_user_session_userId_andi_web_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."andi_web_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "andi_web_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_log_userId_idx" ON "andi_web_audit_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "andi_web_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "andi_web_audit_log" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_log_timestamp_idx" ON "andi_web_audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "onboarding_content_screen_idx" ON "andi_web_onboarding_content" USING btree ("screen_name");--> statement-breakpoint
CREATE INDEX "onboarding_content_active_idx" ON "andi_web_onboarding_content" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "onboarding_content_compound_idx" ON "andi_web_onboarding_content" USING btree ("screen_name","content_type","content_key");--> statement-breakpoint
CREATE INDEX "onboarding_goals_category_idx" ON "andi_web_onboarding_goals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "onboarding_goals_active_idx" ON "andi_web_onboarding_goals" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "onboarding_progress_user_idx" ON "andi_web_onboarding_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "andi_web_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "teacher_profile_user_idx" ON "andi_web_teacher_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teacher_profile_school_idx" ON "andi_web_teacher_profile" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "teacher_profile_completed_idx" ON "andi_web_teacher_profile" USING btree ("onboarding_completed");--> statement-breakpoint
CREATE INDEX "user_preference_userId_idx" ON "andi_web_user_preference" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_preference_category_idx" ON "andi_web_user_preference" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_preference_compound_idx" ON "andi_web_user_preference" USING btree ("userId","category","key");--> statement-breakpoint
CREATE INDEX "user_session_userId_idx" ON "andi_web_user_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_session_status_idx" ON "andi_web_user_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_session_type_idx" ON "andi_web_user_session" USING btree ("sessionType");