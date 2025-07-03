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