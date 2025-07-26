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