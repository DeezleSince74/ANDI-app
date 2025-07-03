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