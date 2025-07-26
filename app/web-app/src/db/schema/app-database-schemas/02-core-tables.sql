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