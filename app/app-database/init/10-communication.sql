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