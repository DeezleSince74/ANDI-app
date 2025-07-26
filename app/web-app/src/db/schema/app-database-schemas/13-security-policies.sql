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