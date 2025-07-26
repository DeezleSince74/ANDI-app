-- ANDI Web Application Database Schema
-- Version: 001
-- Description: Initial schema setup for authentication and user management

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Users table (NextAuth compatible)
CREATE TABLE IF NOT EXISTS andi_web_user (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified TIMESTAMPTZ,
    image VARCHAR(255),
    -- ANDI specific fields
    role VARCHAR(50) DEFAULT 'teacher' NOT NULL,
    school_id VARCHAR(255),
    district_id VARCHAR(255),
    grade_levels JSONB,
    subjects JSONB,
    years_experience INTEGER,
    certification_level VARCHAR(100),
    preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (NextAuth OAuth)
CREATE TABLE IF NOT EXISTS andi_web_account (
    user_id VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    PRIMARY KEY (provider, provider_account_id)
);

-- Sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS andi_web_session (
    session_token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

-- Verification tokens (NextAuth)
CREATE TABLE IF NOT EXISTS andi_web_verification_token (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Teacher profiles
CREATE TABLE IF NOT EXISTS andi_web_teacher_profile (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES andi_web_user(id) ON DELETE CASCADE,
    school_id VARCHAR(255),
    grades_taught JSONB,
    subjects_taught JSONB,
    years_experience INTEGER,
    teaching_styles JSONB,
    personal_interests JSONB,
    strengths JSONB,
    voice_sample_url VARCHAR(500),
    avatar_url VARCHAR(500),
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_email ON andi_web_user(email);
CREATE INDEX idx_account_user_id ON andi_web_account(user_id);
CREATE INDEX idx_session_user_id ON andi_web_session(user_id);
CREATE INDEX idx_teacher_profile_school ON andi_web_teacher_profile(school_id);