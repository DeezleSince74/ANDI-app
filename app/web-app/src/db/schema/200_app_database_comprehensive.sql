-- ANDI Comprehensive Database Schema
-- Auto-generated from app-database
-- DO NOT EDIT MANUALLY - Use app-database as source of truth

-- This file is automatically synchronized from app-database/init/
-- Last sync: $(date)
-- Source: app-database/init/*.sql


-- =============================================================================
-- Source: 0000_superb_sway.sql
-- =============================================================================

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
-- =============================================================================
-- Source: 01-extensions.sql
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'coach', 'admin');
CREATE TYPE school_type AS ENUM ('public', 'private', 'charter', 'magnet', 'independent');
CREATE TYPE session_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
CREATE TYPE session_source AS ENUM ('recorded', 'uploaded');
CREATE TYPE upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE moment_type AS ENUM ('strength', 'opportunity', 'highlight');
CREATE TYPE framework_type AS ENUM ('eci', 'danielson');
CREATE TYPE performance_status AS ENUM ('improving', 'stable', 'needs_attention', 'classroom_maestro');
CREATE TYPE trend_direction AS ENUM ('up', 'down', 'stable');
CREATE TYPE recommendation_category AS ENUM ('equity', 'creativity', 'innovation', 'general');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE resource_type AS ENUM ('article', 'video', 'worksheet', 'tool', 'workshop', 'course');
CREATE TYPE resource_category AS ENUM ('student_engagement', 'diversity_inclusion', 'technology_integration', 'workshops', 'all');
CREATE TYPE interaction_type AS ENUM ('view', 'like', 'bookmark', 'share');
CREATE TYPE forum_status AS ENUM ('unanswered', 'answered', 'popular', 'bookmarked');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');
CREATE TYPE achievement_type AS ENUM ('practice_prodigy', 'consistency', 'engagement', 'community', 'milestone');
CREATE TYPE notification_type AS ENUM ('session_processed', 'recommendation_ready', 'achievement_unlocked', 'forum_answer', 'report_ready');
CREATE TYPE sender_type AS ENUM ('teacher', 'coach');
CREATE TYPE report_type AS ENUM ('weekly_summary', 'monthly_analysis', 'goal_progress', 'comparative');
CREATE TYPE report_status AS ENUM ('generating', 'completed', 'failed');
CREATE TYPE goal_category AS ENUM ('equity', 'creativity', 'innovation', 'engagement', 'general');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'archived');
CREATE TYPE target_type AS ENUM ('question', 'answer');
CREATE TYPE trivia_category AS ENUM ('teaching_techniques', 'student_engagement', 'classroom_management', 'wait_time');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced');

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS community;
CREATE SCHEMA IF NOT EXISTS gamification;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT USAGE ON SCHEMA core TO PUBLIC;
GRANT USAGE ON SCHEMA analytics TO PUBLIC;
GRANT USAGE ON SCHEMA community TO PUBLIC;
GRANT USAGE ON SCHEMA gamification TO PUBLIC;
-- =============================================================================
-- Source: 02-core-tables.sql
-- =============================================================================

-- Core User Management Tables

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'teacher',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Organizational Structure Tables

-- Districts table
CREATE TABLE IF NOT EXISTS core.districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT state_code CHECK (state ~ '^[A-Z]{2}$'),
    CONSTRAINT contact_email_format CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Schools table
CREATE TABLE IF NOT EXISTS core.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    district_id UUID REFERENCES core.districts(id) ON DELETE SET NULL,
    school_type school_type NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT contact_email_format CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User Profile Tables

-- Teacher profiles
CREATE TABLE IF NOT EXISTS core.teacher_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES core.schools(id) ON DELETE SET NULL,
    grades_taught TEXT[],
    subjects_taught TEXT[],
    years_experience INTEGER CHECK (years_experience >= 0 AND years_experience <= 50),
    teaching_styles TEXT[],
    personal_interests TEXT[],
    strengths TEXT[],
    voice_sample_url VARCHAR(500),
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach profiles
CREATE TABLE IF NOT EXISTS core.coach_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES core.schools(id) ON DELETE SET NULL,
    district_id UUID REFERENCES core.districts(id) ON DELETE SET NULL,
    specializations TEXT[],
    years_coaching INTEGER CHECK (years_coaching >= 0 AND years_coaching <= 50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach-teacher assignments
CREATE TABLE IF NOT EXISTS core.coach_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    CONSTRAINT different_users CHECK (coach_id != teacher_id),
    UNIQUE(coach_id, teacher_id)
);

-- Create indexes for core tables
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_role ON auth.users(role);
CREATE INDEX idx_users_is_active ON auth.users(is_active);
CREATE INDEX idx_password_reset_tokens_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON auth.password_reset_tokens(expires_at);
CREATE INDEX idx_districts_state ON core.districts(state);
CREATE INDEX idx_schools_district_id ON core.schools(district_id);
CREATE INDEX idx_schools_type ON core.schools(school_type);
CREATE INDEX idx_teacher_profiles_school_id ON core.teacher_profiles(school_id);
CREATE INDEX idx_coach_profiles_school_id ON core.coach_profiles(school_id);
CREATE INDEX idx_coach_teacher_assignments_coach_id ON core.coach_teacher_assignments(coach_id);
CREATE INDEX idx_coach_teacher_assignments_teacher_id ON core.coach_teacher_assignments(teacher_id);
CREATE INDEX idx_coach_teacher_assignments_active ON core.coach_teacher_assignments(is_active);
-- =============================================================================
-- Source: 03-goals-development.sql
-- =============================================================================

-- Goals and Development Tables

-- Teacher goals
CREATE TABLE IF NOT EXISTS core.teacher_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category goal_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status goal_status DEFAULT 'active',
    target_date DATE,
    success_criteria JSONB DEFAULT '[]',
    progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_target_date CHECK (target_date IS NULL OR target_date >= CURRENT_DATE)
);

-- Goal progress logs
CREATE TABLE IF NOT EXISTS core.goal_progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES core.teacher_goals(id) ON DELETE CASCADE,
    session_id UUID, -- Will reference audio_sessions later
    notes TEXT,
    progress_increment NUMERIC(5,2) CHECK (progress_increment >= -100 AND progress_increment <= 100),
    metrics_snapshot JSONB DEFAULT '{}',
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for goals tables
CREATE INDEX idx_teacher_goals_teacher_id ON core.teacher_goals(teacher_id);
CREATE INDEX idx_teacher_goals_status ON core.teacher_goals(status);
CREATE INDEX idx_teacher_goals_category ON core.teacher_goals(category);
CREATE INDEX idx_teacher_goals_target_date ON core.teacher_goals(target_date);
CREATE INDEX idx_goal_progress_logs_goal_id ON core.goal_progress_logs(goal_id);
CREATE INDEX idx_goal_progress_logs_session_id ON core.goal_progress_logs(session_id);
CREATE INDEX idx_goal_progress_logs_logged_at ON core.goal_progress_logs(logged_at);
-- =============================================================================
-- Source: 04-audio-sessions.sql
-- =============================================================================

-- Audio Processing & Sessions Tables

-- Audio sessions
CREATE TABLE IF NOT EXISTS core.audio_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    status session_status DEFAULT 'uploading',
    source session_source NOT NULL,
    audio_file_url VARCHAR(500),
    transcript TEXT,
    metadata JSONB DEFAULT '{}',
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audio uploads tracking
CREATE TABLE IF NOT EXISTS core.audio_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100),
    upload_status upload_status DEFAULT 'pending',
    progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    error_message TEXT,
    upload_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'))
);

-- Key moments within sessions
CREATE TABLE IF NOT EXISTS core.key_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time_seconds INTEGER NOT NULL CHECK (start_time_seconds >= 0),
    end_time_seconds INTEGER NOT NULL,
    audio_clip_url VARCHAR(500),
    moment_type moment_type NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time_seconds > start_time_seconds)
);

-- Add foreign key constraint to goal_progress_logs
ALTER TABLE core.goal_progress_logs 
    ADD CONSTRAINT fk_goal_progress_session 
    FOREIGN KEY (session_id) 
    REFERENCES core.audio_sessions(id) 
    ON DELETE SET NULL;

-- Create indexes for audio tables
CREATE INDEX idx_audio_sessions_teacher_id ON core.audio_sessions(teacher_id);
CREATE INDEX idx_audio_sessions_status ON core.audio_sessions(status);
CREATE INDEX idx_audio_sessions_session_date ON core.audio_sessions(session_date);
CREATE INDEX idx_audio_sessions_created_at ON core.audio_sessions(created_at);
CREATE INDEX idx_audio_uploads_session_id ON core.audio_uploads(session_id);
CREATE INDEX idx_audio_uploads_status ON core.audio_uploads(upload_status);
CREATE INDEX idx_key_moments_session_id ON core.key_moments(session_id);
CREATE INDEX idx_key_moments_type ON core.key_moments(moment_type);
CREATE INDEX idx_key_moments_tags ON core.key_moments USING GIN(tags);
-- =============================================================================
-- Source: 05-analytics-performance.sql
-- =============================================================================

-- CIQ Analytics & Performance Tables

-- CIQ Metrics
CREATE TABLE IF NOT EXISTS analytics.ciq_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    equity_score NUMERIC(5,2) CHECK (equity_score >= 0 AND equity_score <= 100),
    creativity_score NUMERIC(5,2) CHECK (creativity_score >= 0 AND creativity_score <= 100),
    innovation_score NUMERIC(5,2) CHECK (innovation_score >= 0 AND innovation_score <= 100),
    overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    framework_type framework_type DEFAULT 'eci',
    equity_details JSONB DEFAULT '{}',
    creativity_details JSONB DEFAULT '{}',
    innovation_details JSONB DEFAULT '{}',
    talk_time_ratio NUMERIC(5,2) CHECK (talk_time_ratio >= 0 AND talk_time_ratio <= 100),
    question_metrics JSONB DEFAULT '{}',
    radar_data JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

-- Teacher Performance Summary
CREATE TABLE IF NOT EXISTS analytics.teacher_performance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    total_duration_hours NUMERIC(10,2) DEFAULT 0 CHECK (total_duration_hours >= 0),
    sessions_this_week INTEGER DEFAULT 0 CHECK (sessions_this_week >= 0),
    sessions_last_week INTEGER DEFAULT 0 CHECK (sessions_last_week >= 0),
    performance_status performance_status,
    performance_title VARCHAR(255),
    avg_equity_score NUMERIC(5,2) CHECK (avg_equity_score >= 0 AND avg_equity_score <= 100),
    avg_creativity_score NUMERIC(5,2) CHECK (avg_creativity_score >= 0 AND avg_creativity_score <= 100),
    avg_innovation_score NUMERIC(5,2) CHECK (avg_innovation_score >= 0 AND avg_innovation_score <= 100),
    avg_overall_score NUMERIC(5,2) CHECK (avg_overall_score >= 0 AND avg_overall_score <= 100),
    equity_trend trend_direction,
    creativity_trend trend_direction,
    innovation_trend trend_direction,
    weekly_trends JSONB DEFAULT '{}',
    radar_performance_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    UNIQUE(teacher_id, period_start, period_end)
);

-- Create indexes for analytics tables
CREATE INDEX idx_ciq_metrics_session_id ON analytics.ciq_metrics(session_id);
CREATE INDEX idx_ciq_metrics_teacher_id ON analytics.ciq_metrics(teacher_id);
CREATE INDEX idx_ciq_metrics_calculated_at ON analytics.ciq_metrics(calculated_at);
CREATE INDEX idx_ciq_metrics_scores ON analytics.ciq_metrics(equity_score, creativity_score, innovation_score);
CREATE INDEX idx_teacher_performance_teacher_id ON analytics.teacher_performance_summary(teacher_id);
CREATE INDEX idx_teacher_performance_period ON analytics.teacher_performance_summary(period_start, period_end);
CREATE INDEX idx_teacher_performance_status ON analytics.teacher_performance_summary(performance_status);
CREATE INDEX idx_teacher_performance_updated ON analytics.teacher_performance_summary(updated_at);
-- =============================================================================
-- Source: 06-recommendations-activities.sql
-- =============================================================================

-- AI Recommendations & Teaching Strategies Tables

-- Recommendations
CREATE TABLE IF NOT EXISTS core.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    category recommendation_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    strategy TEXT NOT NULL,
    activity TEXT,
    prompt TEXT,
    priority priority_level DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    is_implemented BOOLEAN DEFAULT false,
    is_liked BOOLEAN,
    implementation_feedback JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classroom Activities
CREATE TABLE IF NOT EXISTS core.classroom_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(50) NOT NULL,
    grade_levels TEXT[],
    subjects TEXT[],
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    difficulty difficulty_level,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    dislikes_count INTEGER DEFAULT 0 CHECK (dislikes_count >= 0),
    tags TEXT[],
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_category CHECK (category IN ('engagement', 'collaboration', 'creativity', 'assessment', 'mind_mapping'))
);

-- Create indexes for recommendations and activities
CREATE INDEX idx_recommendations_teacher_id ON core.recommendations(teacher_id);
CREATE INDEX idx_recommendations_session_id ON core.recommendations(session_id);
CREATE INDEX idx_recommendations_category ON core.recommendations(category);
CREATE INDEX idx_recommendations_priority ON core.recommendations(priority);
CREATE INDEX idx_recommendations_is_read ON core.recommendations(is_read);
CREATE INDEX idx_recommendations_created_at ON core.recommendations(created_at);
CREATE INDEX idx_classroom_activities_category ON core.classroom_activities(category);
CREATE INDEX idx_classroom_activities_grade_levels ON core.classroom_activities USING GIN(grade_levels);
CREATE INDEX idx_classroom_activities_subjects ON core.classroom_activities USING GIN(subjects);
CREATE INDEX idx_classroom_activities_tags ON core.classroom_activities USING GIN(tags);
CREATE INDEX idx_classroom_activities_created_by ON core.classroom_activities(created_by);
CREATE INDEX idx_classroom_activities_is_featured ON core.classroom_activities(is_featured);
-- =============================================================================
-- Source: 07-resources-library.sql
-- =============================================================================

-- Resources & Content Library Tables

-- Resources
CREATE TABLE IF NOT EXISTS core.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    resource_url VARCHAR(500) NOT NULL,
    source VARCHAR(255),
    resource_type resource_type NOT NULL,
    category resource_category DEFAULT 'all',
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    tags TEXT[],
    grade_levels TEXT[],
    subjects TEXT[],
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource Interactions
CREATE TABLE IF NOT EXISTS core.resource_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES core.resources(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id, interaction_type)
);

-- Create indexes for resources
CREATE INDEX idx_resources_type ON core.resources(resource_type);
CREATE INDEX idx_resources_category ON core.resources(category);
CREATE INDEX idx_resources_is_featured ON core.resources(is_featured);
CREATE INDEX idx_resources_created_by ON core.resources(created_by);
CREATE INDEX idx_resources_tags ON core.resources USING GIN(tags);
CREATE INDEX idx_resources_grade_levels ON core.resources USING GIN(grade_levels);
CREATE INDEX idx_resources_subjects ON core.resources USING GIN(subjects);
CREATE INDEX idx_resources_popularity ON core.resources(likes_count DESC, views_count DESC);
CREATE INDEX idx_resource_interactions_user_id ON core.resource_interactions(user_id);
CREATE INDEX idx_resource_interactions_resource_id ON core.resource_interactions(resource_id);
CREATE INDEX idx_resource_interactions_type ON core.resource_interactions(interaction_type);
CREATE INDEX idx_resource_interactions_created_at ON core.resource_interactions(created_at);
-- =============================================================================
-- Source: 08-community-forum.sql
-- =============================================================================

-- Teacher Lounge Community Forum Tables

-- Forum Questions
CREATE TABLE IF NOT EXISTS community.forum_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    upvotes_count INTEGER DEFAULT 0 CHECK (upvotes_count >= 0),
    answers_count INTEGER DEFAULT 0 CHECK (answers_count >= 0),
    is_answered BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    status forum_status DEFAULT 'unanswered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Answers
CREATE TABLE IF NOT EXISTS community.forum_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES community.forum_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes_count INTEGER DEFAULT 0 CHECK (upvotes_count >= 0),
    is_accepted BOOLEAN DEFAULT false,
    is_top_response BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Votes
CREATE TABLE IF NOT EXISTS community.forum_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type target_type NOT NULL,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id, target_type)
);

-- Forum Bookmarks
CREATE TABLE IF NOT EXISTS community.forum_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES community.forum_questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- Create indexes for forum tables
CREATE INDEX idx_forum_questions_author_id ON community.forum_questions(author_id);
CREATE INDEX idx_forum_questions_status ON community.forum_questions(status);
CREATE INDEX idx_forum_questions_is_featured ON community.forum_questions(is_featured);
CREATE INDEX idx_forum_questions_tags ON community.forum_questions USING GIN(tags);
CREATE INDEX idx_forum_questions_created_at ON community.forum_questions(created_at DESC);
CREATE INDEX idx_forum_questions_popularity ON community.forum_questions(upvotes_count DESC, answers_count DESC);
CREATE INDEX idx_forum_answers_question_id ON community.forum_answers(question_id);
CREATE INDEX idx_forum_answers_author_id ON community.forum_answers(author_id);
CREATE INDEX idx_forum_answers_is_accepted ON community.forum_answers(is_accepted);
CREATE INDEX idx_forum_answers_created_at ON community.forum_answers(created_at);
CREATE INDEX idx_forum_votes_user_id ON community.forum_votes(user_id);
CREATE INDEX idx_forum_votes_target ON community.forum_votes(target_id, target_type);
CREATE INDEX idx_forum_bookmarks_user_id ON community.forum_bookmarks(user_id);
CREATE INDEX idx_forum_bookmarks_question_id ON community.forum_bookmarks(question_id);
-- =============================================================================
-- Source: 09-gamification.sql
-- =============================================================================

-- Gamification & Achievements Tables

-- Achievements
CREATE TABLE IF NOT EXISTS gamification.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    achievement_type achievement_type NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}',
    points_value INTEGER DEFAULT 0 CHECK (points_value >= 0),
    progress_total INTEGER DEFAULT 1 CHECK (progress_total > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements
CREATE TABLE IF NOT EXISTS gamification.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES gamification.achievements(id) ON DELETE CASCADE,
    progress_current INTEGER DEFAULT 0 CHECK (progress_current >= 0),
    progress_total INTEGER DEFAULT 1 CHECK (progress_total > 0),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id),
    CONSTRAINT valid_progress CHECK (progress_current <= progress_total)
);

-- Trivia Questions
CREATE TABLE IF NOT EXISTS gamification.trivia_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    answer_options TEXT[] NOT NULL CHECK (array_length(answer_options, 1) >= 2),
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0),
    explanation TEXT,
    category trivia_category NOT NULL,
    difficulty difficulty_level NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_answer_index CHECK (correct_answer_index < array_length(answer_options, 1))
);

-- User Trivia Responses
CREATE TABLE IF NOT EXISTS gamification.user_trivia_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES gamification.trivia_questions(id) ON DELETE CASCADE,
    selected_answer INTEGER NOT NULL CHECK (selected_answer >= 0),
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- Create indexes for gamification tables
CREATE INDEX idx_achievements_type ON gamification.achievements(achievement_type);
CREATE INDEX idx_achievements_is_active ON gamification.achievements(is_active);
CREATE INDEX idx_user_achievements_user_id ON gamification.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON gamification.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_is_completed ON gamification.user_achievements(is_completed);
CREATE INDEX idx_user_achievements_completed_at ON gamification.user_achievements(completed_at);
CREATE INDEX idx_trivia_questions_category ON gamification.trivia_questions(category);
CREATE INDEX idx_trivia_questions_difficulty ON gamification.trivia_questions(difficulty);
CREATE INDEX idx_trivia_questions_is_active ON gamification.trivia_questions(is_active);
CREATE INDEX idx_user_trivia_responses_user_id ON gamification.user_trivia_responses(user_id);
CREATE INDEX idx_user_trivia_responses_question_id ON gamification.user_trivia_responses(question_id);
CREATE INDEX idx_user_trivia_responses_answered_at ON gamification.user_trivia_responses(answered_at);
-- =============================================================================
-- Source: 10-communication.sql
-- =============================================================================

-- Communication & Collaboration Tables

-- Conversations
CREATE TABLE IF NOT EXISTS core.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES core.audio_sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type sender_type NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES core.conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_sender CHECK (
        (sender_type = 'teacher' AND sender_id = teacher_id) OR 
        (sender_type = 'coach' AND sender_id = coach_id)
    )
);

-- Notifications
CREATE TABLE IF NOT EXISTS core.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for communication tables
CREATE INDEX idx_conversations_teacher_id ON core.conversations(teacher_id);
CREATE INDEX idx_conversations_coach_id ON core.conversations(coach_id);
CREATE INDEX idx_conversations_session_id ON core.conversations(session_id);
CREATE INDEX idx_conversations_sender_id ON core.conversations(sender_id);
CREATE INDEX idx_conversations_is_read ON core.conversations(is_read);
CREATE INDEX idx_conversations_created_at ON core.conversations(created_at DESC);
CREATE INDEX idx_conversations_reply_to ON core.conversations(reply_to_id);
CREATE INDEX idx_notifications_user_id ON core.notifications(user_id);
CREATE INDEX idx_notifications_type ON core.notifications(type);
CREATE INDEX idx_notifications_is_read ON core.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON core.notifications(created_at DESC);
-- =============================================================================
-- Source: 11-reports-analytics.sql
-- =============================================================================

-- Reports & Analytics Tables

-- Reports
CREATE TABLE IF NOT EXISTS analytics.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    status report_status DEFAULT 'generating',
    is_tagged BOOLEAN DEFAULT false,
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (date_range_end >= date_range_start),
    CONSTRAINT valid_review CHECK (
        (is_reviewed = false AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (is_reviewed = true AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

-- Create indexes for reports
CREATE INDEX idx_reports_generated_by ON analytics.reports(generated_by);
CREATE INDEX idx_reports_teacher_id ON analytics.reports(teacher_id);
CREATE INDEX idx_reports_type ON analytics.reports(report_type);
CREATE INDEX idx_reports_status ON analytics.reports(status);
CREATE INDEX idx_reports_date_range ON analytics.reports(date_range_start, date_range_end);
CREATE INDEX idx_reports_is_tagged ON analytics.reports(is_tagged);
CREATE INDEX idx_reports_is_reviewed ON analytics.reports(is_reviewed);
CREATE INDEX idx_reports_created_at ON analytics.reports(created_at DESC);
-- =============================================================================
-- Source: 12-triggers-functions.sql
-- =============================================================================

-- Trigger Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update forum question stats
CREATE OR REPLACE FUNCTION update_forum_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community.forum_questions 
        SET answers_count = answers_count + 1,
            is_answered = true,
            status = CASE 
                WHEN answers_count + 1 >= 5 THEN 'popular'::forum_status
                ELSE 'answered'::forum_status
            END
        WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community.forum_questions 
        SET answers_count = GREATEST(0, answers_count - 1),
            is_answered = (answers_count - 1 > 0),
            status = CASE 
                WHEN answers_count - 1 = 0 THEN 'unanswered'::forum_status
                WHEN answers_count - 1 >= 5 THEN 'popular'::forum_status
                ELSE 'answered'::forum_status
            END
        WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'question' THEN
            UPDATE community.forum_questions 
            SET upvotes_count = upvotes_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END
            WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'answer' THEN
            UPDATE community.forum_answers 
            SET upvotes_count = upvotes_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END
            WHERE id = NEW.target_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'question' THEN
            UPDATE community.forum_questions 
            SET upvotes_count = GREATEST(0, upvotes_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END)
            WHERE id = OLD.target_id;
        ELSIF OLD.target_type = 'answer' THEN
            UPDATE community.forum_answers 
            SET upvotes_count = GREATEST(0, upvotes_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END)
            WHERE id = OLD.target_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update resource interaction counts
CREATE OR REPLACE FUNCTION update_resource_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE core.resources 
        SET likes_count = likes_count + CASE WHEN NEW.interaction_type = 'like' THEN 1 ELSE 0 END,
            views_count = views_count + CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END
        WHERE id = NEW.resource_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE core.resources 
        SET likes_count = GREATEST(0, likes_count - CASE WHEN OLD.interaction_type = 'like' THEN 1 ELSE 0 END),
            views_count = GREATEST(0, views_count - CASE WHEN OLD.interaction_type = 'view' THEN 1 ELSE 0 END)
        WHERE id = OLD.resource_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check achievement progress
CREATE OR REPLACE FUNCTION check_achievement_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.progress_current >= NEW.progress_total AND NOT NEW.is_completed THEN
        NEW.is_completed = true;
        NEW.completed_at = CURRENT_TIMESTAMP;
        
        -- Create notification for achievement unlock
        INSERT INTO core.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            'achievement_unlocked',
            'Achievement Unlocked!',
            'You have unlocked a new achievement.',
            jsonb_build_object('achievement_id', NEW.achievement_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON core.districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON core.schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON core.teacher_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON core.coach_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_goals_updated_at BEFORE UPDATE ON core.teacher_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_sessions_updated_at BEFORE UPDATE ON core.audio_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_performance_summary_updated_at BEFORE UPDATE ON analytics.teacher_performance_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON core.recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classroom_activities_updated_at BEFORE UPDATE ON core.classroom_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON core.resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_questions_updated_at BEFORE UPDATE ON community.forum_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_answers_updated_at BEFORE UPDATE ON community.forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON gamification.user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON core.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON analytics.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Forum statistics triggers
CREATE TRIGGER update_forum_question_stats_insert AFTER INSERT ON community.forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_stats();

CREATE TRIGGER update_forum_question_stats_delete AFTER DELETE ON community.forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_stats();

-- Vote count triggers
CREATE TRIGGER update_vote_counts_insert AFTER INSERT ON community.forum_votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

CREATE TRIGGER update_vote_counts_delete AFTER DELETE ON community.forum_votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Resource interaction triggers
CREATE TRIGGER update_resource_counts_insert AFTER INSERT ON core.resource_interactions
    FOR EACH ROW EXECUTE FUNCTION update_resource_counts();

CREATE TRIGGER update_resource_counts_delete AFTER DELETE ON core.resource_interactions
    FOR EACH ROW EXECUTE FUNCTION update_resource_counts();

-- Achievement completion trigger
CREATE TRIGGER check_achievement_completion_update BEFORE UPDATE ON gamification.user_achievements
    FOR EACH ROW EXECUTE FUNCTION check_achievement_completion();
-- =============================================================================
-- Source: 13-security-policies.sql
-- =============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.coach_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teacher_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.goal_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audio_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.key_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.ciq_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.teacher_performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.classroom_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.resource_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.user_trivia_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.reports ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID AS $$
    SELECT current_setting('app.current_user_id', true)::UUID;
$$ LANGUAGE sql STABLE;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS user_role AS $$
    SELECT role FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- User Policies
CREATE POLICY "Users can view their own profile" ON auth.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON auth.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON auth.users
    FOR SELECT USING (auth.role() = 'admin');

-- Password Reset Token Policies
CREATE POLICY "Users can only view their own reset tokens" ON auth.password_reset_tokens
    FOR SELECT USING (user_id = auth.uid());

-- District and School Policies
CREATE POLICY "Anyone can view districts" ON core.districts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view schools" ON core.schools
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage districts" ON core.districts
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage schools" ON core.schools
    FOR ALL USING (auth.role() = 'admin');

-- Teacher Profile Policies
CREATE POLICY "Users can view their own teacher profile" ON core.teacher_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own teacher profile" ON core.teacher_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Coaches can view assigned teacher profiles" ON core.teacher_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.coach_teacher_assignments
            WHERE coach_id = auth.uid() 
            AND teacher_id = core.teacher_profiles.user_id
            AND is_active = true
        )
    );

-- Audio Session Policies
CREATE POLICY "Teachers can view their own sessions" ON core.audio_sessions
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create their own sessions" ON core.audio_sessions
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own sessions" ON core.audio_sessions
    FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Coaches can view assigned teacher sessions" ON core.audio_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.coach_teacher_assignments
            WHERE coach_id = auth.uid() 
            AND teacher_id = core.audio_sessions.teacher_id
            AND is_active = true
        )
    );

-- Goal Policies
CREATE POLICY "Teachers can manage their own goals" ON core.teacher_goals
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Coaches can view assigned teacher goals" ON core.teacher_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.coach_teacher_assignments
            WHERE coach_id = auth.uid() 
            AND teacher_id = core.teacher_goals.teacher_id
            AND is_active = true
        )
    );

-- CIQ Metrics Policies
CREATE POLICY "Teachers can view their own metrics" ON analytics.ciq_metrics
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Coaches can view assigned teacher metrics" ON analytics.ciq_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.coach_teacher_assignments
            WHERE coach_id = auth.uid() 
            AND teacher_id = analytics.ciq_metrics.teacher_id
            AND is_active = true
        )
    );

-- Recommendation Policies
CREATE POLICY "Teachers can view their own recommendations" ON core.recommendations
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own recommendations" ON core.recommendations
    FOR UPDATE USING (teacher_id = auth.uid());

-- Community Forum Policies
CREATE POLICY "Anyone can view forum questions" ON community.forum_questions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum questions" ON community.forum_questions
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own forum questions" ON community.forum_questions
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Anyone can view forum answers" ON community.forum_answers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum answers" ON community.forum_answers
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own forum answers" ON community.forum_answers
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can manage their own votes" ON community.forum_votes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own bookmarks" ON community.forum_bookmarks
    FOR ALL USING (user_id = auth.uid());

-- Resource Policies
CREATE POLICY "Anyone can view published resources" ON core.resources
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create resources" ON core.resources
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own resources" ON core.resources
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own resource interactions" ON core.resource_interactions
    FOR ALL USING (user_id = auth.uid());

-- Notification Policies
CREATE POLICY "Users can view their own notifications" ON core.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON core.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Conversation Policies
CREATE POLICY "Users can view conversations they're part of" ON core.conversations
    FOR SELECT USING (teacher_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "Users can create conversations they're part of" ON core.conversations
    FOR INSERT WITH CHECK (
        (sender_type = 'teacher' AND sender_id = auth.uid() AND teacher_id = auth.uid()) OR
        (sender_type = 'coach' AND sender_id = auth.uid() AND coach_id = auth.uid())
    );

-- Achievement Policies
CREATE POLICY "Anyone can view achievements" ON gamification.achievements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own achievement progress" ON gamification.user_achievements
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active trivia questions" ON gamification.trivia_questions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own trivia responses" ON gamification.user_trivia_responses
    FOR ALL USING (user_id = auth.uid());

-- Report Policies
CREATE POLICY "Users can view reports they generated" ON analytics.reports
    FOR SELECT USING (generated_by = auth.uid());

CREATE POLICY "Teachers can view their own reports" ON analytics.reports
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Coaches can view reports for assigned teachers" ON analytics.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.coach_teacher_assignments
            WHERE coach_id = auth.uid() 
            AND teacher_id = analytics.reports.teacher_id
            AND is_active = true
        )
    );

CREATE POLICY "Admins can view all reports" ON analytics.reports
    FOR SELECT USING (auth.role() = 'admin');
-- =============================================================================
-- Source: 14-onboarding-content.sql
-- =============================================================================

-- Onboarding Content Tables and Data

-- Create onboarding_content table to store configurable content for each screen
CREATE TABLE IF NOT EXISTS core.onboarding_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_name VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'option', 'instruction', 'label', 'placeholder'
    content_key VARCHAR(100) NOT NULL,
    content_value TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screen_name, content_type, content_key)
);

-- Create onboarding_progress table to track user progress
CREATE TABLE IF NOT EXISTS core.onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}',
    step_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create onboarding_goals table to store goal options for screen 8
CREATE TABLE IF NOT EXISTS core.onboarding_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('equity', 'creativity', 'innovation')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert grade level options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('grade_levels', 'option', 'pre-k', 'Pre-K', 1),
    ('grade_levels', 'option', 'kindergarten', 'Kindergarten', 2),
    ('grade_levels', 'option', '1st', '1st Grade', 3),
    ('grade_levels', 'option', '2nd', '2nd Grade', 4),
    ('grade_levels', 'option', '3rd', '3rd Grade', 5),
    ('grade_levels', 'option', '4th', '4th Grade', 6),
    ('grade_levels', 'option', '5th', '5th Grade', 7),
    ('grade_levels', 'option', '6th', '6th Grade', 8),
    ('grade_levels', 'option', '7th', '7th Grade', 9),
    ('grade_levels', 'option', '8th', '8th Grade', 10),
    ('grade_levels', 'option', '9th', '9th Grade', 11),
    ('grade_levels', 'option', '10th', '10th Grade', 12),
    ('grade_levels', 'option', '11th', '11th Grade', 13),
    ('grade_levels', 'option', '12th', '12th Grade', 14),
    ('grade_levels', 'option', 'college', 'College/University', 15),
    ('grade_levels', 'option', 'other', 'Other', 16)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert subject options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order, metadata) VALUES
    ('subjects_taught', 'option', 'language_arts', 'Language Arts/English', 1, '{"category": "core"}'),
    ('subjects_taught', 'option', 'mathematics', 'Mathematics', 2, '{"category": "core"}'),
    ('subjects_taught', 'option', 'science', 'Science', 3, '{"category": "core"}'),
    ('subjects_taught', 'option', 'social_studies', 'Social Studies & History', 4, '{"category": "core"}'),
    ('subjects_taught', 'option', 'foreign_languages', 'Foreign Languages', 5, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'fine_arts', 'Fine Arts/Music/Drama', 6, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'physical_education', 'Physical Education & Health', 7, '{"category": "specialized"}'),
    ('subjects_taught', 'option', 'career_technical', 'Career & Technical Education', 8, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'stem_electives', 'STEM Electives', 9, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'media_communication', 'Media and Communication', 10, '{"category": "technical"}'),
    ('subjects_taught', 'option', 'honors_ap', 'Honors & Advanced Placement', 11, '{"category": "advanced"}'),
    ('subjects_taught', 'option', 'ib_program', 'International Baccalaureate Program', 12, '{"category": "advanced"}')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order, metadata = EXCLUDED.metadata;

-- Insert teaching style options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order, metadata) VALUES
    ('teaching_styles', 'option', 'lunchtime_mentor', 'Lunchtime Mentor', 1, '{"description": "Creates safe, welcoming space where students feel valued"}'),
    ('teaching_styles', 'option', 'high_energy_entertainer', 'High-Energy Entertainer', 2, '{"description": "Transforms lessons into exciting experiences"}'),
    ('teaching_styles', 'option', 'life_coach', 'Life Coach', 3, '{"description": "Inspires students to see potential and tackle challenges"}'),
    ('teaching_styles', 'option', 'chill_teacher', 'Chill Teacher', 4, '{"description": "Keeps classroom calm and focused with laid-back approach"}')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order, metadata = EXCLUDED.metadata;

-- Insert personal interest options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('personal_interests', 'option', 'outdoor_activities', 'Outdoor Activities', 1),
    ('personal_interests', 'option', 'sports', 'Sports', 2),
    ('personal_interests', 'option', 'traveling', 'Traveling', 3),
    ('personal_interests', 'option', 'reading', 'Reading', 4),
    ('personal_interests', 'option', 'writing', 'Writing', 5),
    ('personal_interests', 'option', 'cooking_baking', 'Cooking/Baking', 6),
    ('personal_interests', 'option', 'gardening', 'Gardening', 7),
    ('personal_interests', 'option', 'music', 'Music', 8),
    ('personal_interests', 'option', 'art_craft', 'Art and Craft', 9),
    ('personal_interests', 'option', 'photography', 'Photography', 10),
    ('personal_interests', 'option', 'yoga_meditation', 'Yoga/Meditation', 11),
    ('personal_interests', 'option', 'fitness_exercise', 'Fitness & Exercise', 12),
    ('personal_interests', 'option', 'movies_tv', 'Watching Movies/TV Shows', 13),
    ('personal_interests', 'option', 'gaming', 'Gaming', 14)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert teaching strength options
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value, display_order) VALUES
    ('teaching_strengths', 'option', 'communication_skills', 'Communication Skills', 1),
    ('teaching_strengths', 'option', 'subject_expertise', 'Subject Matter Expertise', 2),
    ('teaching_strengths', 'option', 'adaptability', 'Adaptability', 3),
    ('teaching_strengths', 'option', 'problem_solving', 'Problem-Solving Skills', 4),
    ('teaching_strengths', 'option', 'cultural_competence', 'Cultural Competence', 5),
    ('teaching_strengths', 'option', 'classroom_management', 'Classroom Management', 6),
    ('teaching_strengths', 'option', 'lesson_planning', 'Effective Lesson Planning', 7),
    ('teaching_strengths', 'option', 'empathy_eq', 'Empathy and Emotional Intelligence', 8),
    ('teaching_strengths', 'option', 'collaboration', 'Collaboration and Teamwork', 9),
    ('teaching_strengths', 'option', 'patience', 'Patience and Perseverance', 10),
    ('teaching_strengths', 'option', 'creativity_innovation', 'Creativity and Innovation', 11)
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value, display_order = EXCLUDED.display_order;

-- Insert goal options for CIQ framework
INSERT INTO core.onboarding_goals (category, title, description, display_order) VALUES
    -- Equity goals
    ('equity', 'Increase Student Voice', 'Ensure all students have opportunities to share their thoughts and ideas', 1),
    ('equity', 'Create Inclusive Environment', 'Build a classroom where every student feels valued and respected', 2),
    ('equity', 'Address Learning Gaps', 'Identify and support students who need additional assistance', 3),
    ('equity', 'Foster Cultural Awareness', 'Celebrate diversity and integrate culturally responsive teaching', 4),
    
    -- Creativity goals
    ('creativity', 'Encourage Creative Expression', 'Provide opportunities for students to express themselves creatively', 5),
    ('creativity', 'Design Engaging Activities', 'Develop innovative lessons that spark curiosity and imagination', 6),
    ('creativity', 'Support Risk-Taking', 'Create safe spaces for students to experiment and learn from mistakes', 7),
    ('creativity', 'Integrate Arts & Projects', 'Incorporate creative projects and artistic elements into curriculum', 8),
    
    -- Innovation goals
    ('innovation', 'Connect to Real World', 'Help students see how learning applies to their lives and future', 9),
    ('innovation', 'Integrate Technology', 'Use digital tools to enhance learning experiences', 10),
    ('innovation', 'Promote Critical Thinking', 'Develop activities that challenge students to think deeply', 11),
    ('innovation', 'Encourage Problem-Solving', 'Guide students to find creative solutions to complex challenges', 12)
ON CONFLICT DO NOTHING;

-- Insert screen instructions and labels
INSERT INTO core.onboarding_content (screen_name, content_type, content_key, content_value) VALUES
    ('grade_levels', 'instruction', 'main', 'Which grade levels do you teach?'),
    ('grade_levels', 'instruction', 'subtitle', 'This helps us provide tools and resources suited to your students'' needs'),
    ('grade_levels', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_experience', 'instruction', 'main', 'How many years have you been teaching?'),
    ('teaching_experience', 'instruction', 'subtitle', 'Your experience level helps us tailor our focus areas and strategies to your journey'),
    
    ('subjects_taught', 'instruction', 'main', 'What subjects do you teach?'),
    ('subjects_taught', 'instruction', 'subtitle', 'Let''s focus on the subjects that matter most to you and your students'),
    ('subjects_taught', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_styles', 'instruction', 'main', 'How would you describe your teaching style?'),
    ('teaching_styles', 'instruction', 'subtitle', 'Understanding your approach helps us provide tailored recommendations'),
    ('teaching_styles', 'instruction', 'helper', 'Select up to 3'),
    
    ('personal_interests', 'instruction', 'main', 'What are your personal interests?'),
    ('personal_interests', 'instruction', 'subtitle', 'We''ll recommend activities and strategies that align with your passions and teaching style'),
    ('personal_interests', 'instruction', 'helper', 'Select all that apply'),
    
    ('teaching_strengths', 'instruction', 'main', 'What are your greatest strengths as a teacher?'),
    ('teaching_strengths', 'instruction', 'subtitle', 'This helps us suggest focus areas and personalized feedback for your growth'),
    ('teaching_strengths', 'instruction', 'helper', 'Select all that apply'),
    
    ('goal_setting', 'instruction', 'main', 'Let''s set your goals'),
    ('goal_setting', 'instruction', 'subtitle', 'Based on your responses, ANDI will help shape your personalized path using our CIQ framework'),
    ('goal_setting', 'instruction', 'helper', 'Select 4 goals total: one from Equity, one from Creativity, one from Innovation, and one additional goal of your choice'),
    
    ('voice_sample_intro', 'instruction', 'main', 'Voice Sample Recording'),
    ('voice_sample_intro', 'instruction', 'subtitle', 'Help ANDI understand your speaking style and tone. This allows us to differentiate your voice from your students during classroom recordings.'),
    ('voice_sample_intro', 'instruction', 'helper', 'This takes less than 2 minutes'),
    
    ('voice_sample_recording', 'instruction', 'main', 'Please read the following phrase:'),
    ('voice_sample_recording', 'instruction', 'phrase1', 'Good morning, class. Let''s get started with today''s lesson.'),
    ('voice_sample_recording', 'instruction', 'phrase2', 'Remember to raise your hand if you have any questions.'),
    ('voice_sample_recording', 'instruction', 'phrase3', 'Great job everyone! I''m proud of the work you''ve done today.')
ON CONFLICT (screen_name, content_type, content_key) DO UPDATE SET content_value = EXCLUDED.content_value;

-- Create indexes for onboarding tables
CREATE INDEX idx_onboarding_content_screen ON core.onboarding_content(screen_name);
CREATE INDEX idx_onboarding_content_active ON core.onboarding_content(is_active);
CREATE INDEX idx_onboarding_progress_user ON core.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_goals_category ON core.onboarding_goals(category);
CREATE INDEX idx_onboarding_goals_active ON core.onboarding_goals(is_active);