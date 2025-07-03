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