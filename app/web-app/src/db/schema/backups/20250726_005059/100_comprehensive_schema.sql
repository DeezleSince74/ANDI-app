-- ANDI Comprehensive Database Schema
-- Merged from app-database for full ANDI platform functionality

-- =============================================================================
-- AUTH SCHEMA - User Management and Authentication
-- =============================================================================

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
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

-- NextAuth compatibility tables (maintain current auth system)
CREATE TABLE IF NOT EXISTS andi_web_user (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    image VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher' NOT NULL,
    emailVerified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ANDI specific fields
    schoolId VARCHAR(255),
    districtId VARCHAR(255),
    gradeLevels TEXT[],
    subjects TEXT[],
    yearsExperience INTEGER,
    certificationLevel VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    isActive BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS andi_web_account (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    providerAccountId VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS andi_web_session (
    id VARCHAR(255) PRIMARY KEY,
    sessionToken VARCHAR(255) NOT NULL UNIQUE,
    userId VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CORE SCHEMA - Organizational Structure
-- =============================================================================

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
    principal_name VARCHAR(255),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contact_email_format CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Teacher profiles (extended user information)
CREATE TABLE IF NOT EXISTS core.teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES core.schools(id) ON DELETE SET NULL,
    employee_id VARCHAR(50),
    grade_levels TEXT[],
    subjects TEXT[],
    years_experience INTEGER CHECK (years_experience >= 0),
    certification_level VARCHAR(100),
    classroom_number VARCHAR(20),
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    bio TEXT,
    teaching_philosophy TEXT,
    professional_goals TEXT,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "share_achievements": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach profiles
CREATE TABLE IF NOT EXISTS core.coach_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialization TEXT[],
    years_coaching INTEGER CHECK (years_coaching >= 0),
    certifications TEXT[],
    bio TEXT,
    coaching_philosophy TEXT,
    availability_schedule JSONB,
    max_teachers_supported INTEGER DEFAULT 10,
    current_teachers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reasonable_load CHECK (current_teachers_count <= max_teachers_supported)
);

-- Coach-Teacher assignments
CREATE TABLE IF NOT EXISTS core.coach_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES core.coach_profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    UNIQUE(coach_id, teacher_id)
);

-- Teacher goals
CREATE TABLE IF NOT EXISTS core.teacher_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category goal_category NOT NULL,
    target_value DECIMAL(5,2),
    current_value DECIMAL(5,2) DEFAULT 0,
    unit VARCHAR(50),
    target_date DATE,
    status goal_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_values CHECK (current_value >= 0 AND target_value > 0)
);

-- Goal progress logs
CREATE TABLE IF NOT EXISTS core.goal_progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES core.teacher_goals(id) ON DELETE CASCADE,
    previous_value DECIMAL(5,2),
    new_value DECIMAL(5,2) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_progress CHECK (new_value >= 0)
);

-- =============================================================================
-- RECORDING/AUDIO SCHEMA - Session Management and Analysis
-- =============================================================================

-- Audio sessions (main recording sessions)
CREATE TABLE IF NOT EXISTS andi_web_recording_session (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES andi_web_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration INTEGER,
    file_path VARCHAR(500),
    file_size INTEGER,
    file_format VARCHAR(10),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    source session_source DEFAULT 'uploaded',
    transcript_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- AI Jobs (processing jobs for transcription and analysis)  
CREATE TABLE IF NOT EXISTS andi_web_ai_job (
    job_id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES andi_web_recording_session(session_id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    external_id VARCHAR(255),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Audio uploads (file management)
CREATE TABLE IF NOT EXISTS audio_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration_seconds INTEGER,
    status upload_status DEFAULT 'pending',
    checksum VARCHAR(64),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_size CHECK (file_size > 0),
    CONSTRAINT reasonable_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- Key moments (important timestamps in sessions)
CREATE TABLE IF NOT EXISTS key_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    timestamp_seconds INTEGER NOT NULL,
    moment_type moment_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_timestamp CHECK (timestamp_seconds >= 0)
);

-- Recommendations (AI-generated coaching suggestions)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    teacher_id UUID NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    category recommendation_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_items TEXT[],
    evidence TEXT[],
    research_basis TEXT,
    priority priority_level DEFAULT 'medium',
    implementation_difficulty difficulty_level DEFAULT 'medium',
    estimated_impact_score DECIMAL(3,2) CHECK (estimated_impact_score >= 0 AND estimated_impact_score <= 1),
    is_personalized BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classroom activities (structured activities during sessions)
CREATE TABLE IF NOT EXISTS classroom_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    start_timestamp INTEGER NOT NULL,
    end_timestamp INTEGER,
    description TEXT,
    participants_count INTEGER,
    engagement_level DECIMAL(3,2) CHECK (engagement_level >= 0 AND engagement_level <= 1),
    learning_objectives TEXT[],
    outcomes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_timestamps CHECK (end_timestamp IS NULL OR end_timestamp > start_timestamp),
    CONSTRAINT positive_participants CHECK (participants_count IS NULL OR participants_count > 0)
);

-- Conversations (speaker-separated dialogue)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    speaker_label VARCHAR(50) NOT NULL,
    start_timestamp INTEGER NOT NULL,
    end_timestamp INTEGER NOT NULL,
    text_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    word_count INTEGER,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_conversation_time CHECK (end_timestamp > start_timestamp),
    CONSTRAINT positive_word_count CHECK (word_count IS NULL OR word_count > 0)
);

-- Notifications (system notifications for users)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- ANALYTICS SCHEMA - Performance Metrics and Analysis
-- =============================================================================

-- CIQ metrics (Classroom Impact Quotient scores)
CREATE TABLE IF NOT EXISTS analytics.ciq_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    teacher_id UUID NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    overall_score DECIMAL(4,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    equity_score DECIMAL(4,2) CHECK (equity_score >= 0 AND equity_score <= 100),
    creativity_score DECIMAL(4,2) CHECK (creativity_score >= 0 AND creativity_score <= 100),
    innovation_score DECIMAL(4,2) CHECK (innovation_score >= 0 AND innovation_score <= 100),
    framework_scores JSONB DEFAULT '{}',
    participation_metrics JSONB DEFAULT '{}',
    engagement_indicators JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculation_version VARCHAR(20) DEFAULT '1.0'
);

-- Teacher performance summary (aggregated performance data)
CREATE TABLE IF NOT EXISTS analytics.teacher_performance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID UNIQUE NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    current_ciq_score DECIMAL(4,2),
    average_ciq_score DECIMAL(4,2),
    sessions_count INTEGER DEFAULT 0,
    recommendations_implemented INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    performance_status performance_status DEFAULT 'stable',
    last_session_date DATE,
    trend_direction trend_direction DEFAULT 'stable',
    improvement_areas TEXT[],
    strengths TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_counts CHECK (
        sessions_count >= 0 AND 
        recommendations_implemented >= 0 AND 
        goals_achieved >= 0
    )
);

-- Reports (generated analysis reports)
CREATE TABLE IF NOT EXISTS analytics.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES core.teacher_profiles(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    status report_status DEFAULT 'completed',
    file_path VARCHAR(500),
    is_shared BOOLEAN DEFAULT false,
    CONSTRAINT valid_period CHECK (period_end IS NULL OR period_end >= period_start)
);

-- =============================================================================
-- COMMUNITY SCHEMA - Teacher Lounge and Forums
-- =============================================================================

-- Forum questions
CREATE TABLE IF NOT EXISTS community.forum_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    status forum_status DEFAULT 'unanswered',
    view_count INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_stats CHECK (view_count >= 0 AND upvotes >= 0 AND downvotes >= 0)
);

-- Forum answers
CREATE TABLE IF NOT EXISTS community.forum_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES community.forum_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_votes CHECK (upvotes >= 0 AND downvotes >= 0)
);

-- Forum votes
CREATE TABLE IF NOT EXISTS community.forum_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type target_type NOT NULL,
    target_id UUID NOT NULL,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

-- Forum bookmarks
CREATE TABLE IF NOT EXISTS community.forum_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES community.forum_questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- =============================================================================
-- GAMIFICATION SCHEMA - Achievements and Progress
-- =============================================================================

-- Achievements (available achievements)
CREATE TABLE IF NOT EXISTS gamification.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    achievement_type achievement_type NOT NULL,
    criteria JSONB NOT NULL,
    points_value INTEGER DEFAULT 0,
    badge_icon_url VARCHAR(500),
    rarity difficulty_level DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_points CHECK (points_value >= 0)
);

-- User achievements (earned achievements)
CREATE TABLE IF NOT EXISTS gamification.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES gamification.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_data JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);

-- Trivia questions
CREATE TABLE IF NOT EXISTS gamification.trivia_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    category trivia_category NOT NULL,
    difficulty difficulty_level DEFAULT 'medium',
    explanation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_answer_index CHECK (correct_answer_index >= 0)
);

-- User trivia responses
CREATE TABLE IF NOT EXISTS gamification.user_trivia_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES gamification.trivia_questions(id) ON DELETE CASCADE,
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_selected_answer CHECK (selected_answer_index >= 0)
);

-- =============================================================================
-- RESOURCES SCHEMA - Teaching Resources and Materials
-- =============================================================================

-- Resources (teaching materials)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type resource_type NOT NULL,
    category resource_category NOT NULL,
    content_url VARCHAR(500),
    file_path VARCHAR(500),
    author_name VARCHAR(255),
    organization VARCHAR(255),
    difficulty_level difficulty_level DEFAULT 'medium',
    estimated_time_minutes INTEGER,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_negative_stats CHECK (
        view_count >= 0 AND 
        like_count >= 0 AND 
        bookmark_count >= 0
    ),
    CONSTRAINT positive_time CHECK (estimated_time_minutes IS NULL OR estimated_time_minutes > 0)
);

-- Resource interactions (user engagement with resources)
CREATE TABLE IF NOT EXISTS resource_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id, interaction_type)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON auth.password_reset_tokens(expires_at);

-- NextAuth indexes  
CREATE INDEX IF NOT EXISTS idx_web_user_email ON andi_web_user(email);
CREATE INDEX IF NOT EXISTS idx_web_account_user_id ON andi_web_account(userId);
CREATE INDEX IF NOT EXISTS idx_web_session_user_id ON andi_web_session(userId);
CREATE INDEX IF NOT EXISTS idx_web_session_token ON andi_web_session(sessionToken);

-- Recording indexes
CREATE INDEX IF NOT EXISTS idx_recording_session_user_id ON andi_web_recording_session(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_session_status ON andi_web_recording_session(status);
CREATE INDEX IF NOT EXISTS idx_recording_session_created_at ON andi_web_recording_session(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_job_session_id ON andi_web_ai_job(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_status ON andi_web_ai_job(status);
CREATE INDEX IF NOT EXISTS idx_ai_job_type ON andi_web_ai_job(job_type);

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON core.teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school_id ON core.teacher_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON core.coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_teacher_assignments_coach_id ON core.coach_teacher_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_teacher_assignments_teacher_id ON core.coach_teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_goals_teacher_id ON core.teacher_goals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_goals_status ON core.teacher_goals(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_ciq_metrics_teacher_id ON analytics.ciq_metrics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ciq_metrics_session_id ON analytics.ciq_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_teacher_performance_teacher_id ON analytics.teacher_performance_summary(teacher_id);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_forum_questions_author_id ON community.forum_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_status ON community.forum_questions(status);
CREATE INDEX IF NOT EXISTS idx_forum_questions_created_at ON community.forum_questions(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id ON community.forum_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_author_id ON community.forum_answers(author_id);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON gamification.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON gamification.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_trivia_responses_user_id ON gamification.user_trivia_responses(user_id);

-- Resource indexes
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_resource_interactions_user_id ON resource_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_interactions_resource_id ON resource_interactions(resource_id);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_forum_questions_title_search ON community.forum_questions USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_forum_questions_content_search ON community.forum_questions USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_resources_title_search ON resources USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_resources_description_search ON resources USING gin(to_tsvector('english', description));