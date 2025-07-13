import { 
  pgTable, 
  pgSchema, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Create gamification schema
export const gamificationSchema = pgSchema('gamification');

// Enums
export const achievementTypeEnum = pgEnum('achievement_type', ['practice_prodigy', 'consistency', 'engagement', 'community', 'milestone']);
export const triviaCategoryEnum = pgEnum('trivia_category', ['teaching_techniques', 'student_engagement', 'classroom_management', 'wait_time']);
export const triviaDifficultyEnum = pgEnum('trivia_difficulty', ['easy', 'medium', 'hard']);

// Gamification & Achievements
export const achievements = gamificationSchema.table('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  iconUrl: varchar('icon_url', { length: 500 }),
  achievementType: achievementTypeEnum('achievement_type').notNull(),
  criteria: jsonb('criteria').notNull().default({}),
  pointsValue: integer('points_value').notNull().default(0),
  progressTotal: integer('progress_total').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('idx_achievements_type').on(table.achievementType),
  isActiveIdx: index('idx_achievements_is_active').on(table.isActive),
}));

export const userAchievements = gamificationSchema.table('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  achievementId: uuid('achievement_id').notNull(),
  progressCurrent: integer('progress_current').notNull().default(0),
  progressTotal: integer('progress_total').notNull().default(1),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_achievements_user_id').on(table.userId),
  achievementIdIdx: index('idx_user_achievements_achievement_id').on(table.achievementId),
  isCompletedIdx: index('idx_user_achievements_is_completed').on(table.isCompleted),
  completedAtIdx: index('idx_user_achievements_completed_at').on(table.completedAt),
  uniqueUserAchievement: unique('user_achievements_user_id_achievement_id_key').on(table.userId, table.achievementId),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'user_achievements_user_id_fkey'
  }).onDelete('cascade'),
  achievementIdFk: foreignKey({
    columns: [table.achievementId],
    foreignColumns: [achievements.id],
    name: 'user_achievements_achievement_id_fkey'
  }).onDelete('cascade'),
}));

export const triviaQuestions = gamificationSchema.table('trivia_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionText: text('question_text').notNull(),
  answerOptions: text('answer_options').array().notNull(),
  correctAnswerIndex: integer('correct_answer_index').notNull(),
  explanation: text('explanation'),
  category: triviaCategoryEnum('category').notNull(),
  difficulty: triviaDifficultyEnum('difficulty').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_trivia_questions_category').on(table.category),
  difficultyIdx: index('idx_trivia_questions_difficulty').on(table.difficulty),
  isActiveIdx: index('idx_trivia_questions_is_active').on(table.isActive),
}));

export const userTriviaResponses = gamificationSchema.table('user_trivia_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  questionId: uuid('question_id').notNull(),
  selectedAnswer: integer('selected_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_trivia_responses_user_id').on(table.userId),
  questionIdIdx: index('idx_user_trivia_responses_question_id').on(table.questionId),
  answeredAtIdx: index('idx_user_trivia_responses_answered_at').on(table.answeredAt),
  uniqueResponse: unique('user_trivia_responses_user_id_question_id_key').on(table.userId, table.questionId),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'user_trivia_responses_user_id_fkey'
  }).onDelete('cascade'),
  questionIdFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [triviaQuestions.id],
    name: 'user_trivia_responses_question_id_fkey'
  }).onDelete('cascade'),
}));

// Type exports
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type TriviaQuestion = typeof triviaQuestions.$inferSelect;
export type NewTriviaQuestion = typeof triviaQuestions.$inferInsert;
export type UserTriviaResponse = typeof userTriviaResponses.$inferSelect;
export type NewUserTriviaResponse = typeof userTriviaResponses.$inferInsert;

// Utility types for gamification features
export interface UserProgress {
  userId: string;
  totalPoints: number;
  completedAchievements: number;
  currentLevel: number;
  nextLevelProgress: number;
  recentAchievements: Achievement[];
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  total: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface TriviaStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  streak: number;
  favoriteCategory: string;
}

export interface Leaderboard {
  rank: number;
  userId: string;
  fullName: string;
  totalPoints: number;
  achievementCount: number;
}

// Achievement criteria interfaces
export interface MilestoneAchievementCriteria {
  sessions: number;
}

export interface ConsistencyAchievementCriteria {
  sessions_per_week: number;
  weeks: number;
}

export interface CommunityAchievementCriteria {
  forum_answers: number;
  helpful_votes?: number;
}

export interface EngagementAchievementCriteria {
  avg_equity_score: number;
  consecutive_sessions: number;
}

export interface PracticeAchievementCriteria {
  consecutive_equity_85: number;
  min_sessions: number;
}