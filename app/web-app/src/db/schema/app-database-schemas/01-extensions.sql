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