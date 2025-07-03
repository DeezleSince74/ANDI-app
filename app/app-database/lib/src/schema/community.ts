import { 
  pgTable, 
  pgSchema, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  integer,
  pgEnum,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Create community schema
export const communitySchema = pgSchema('community');

// Enums
export const forumStatusEnum = pgEnum('forum_status', ['unanswered', 'answered', 'popular', 'bookmarked']);
export const targetTypeEnum = pgEnum('target_type', ['question', 'answer']);
export const voteTypeEnum = pgEnum('vote_type', ['upvote', 'downvote']);

// Teacher Lounge Community Forum
export const forumQuestions = communitySchema.table('forum_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: text('tags').array(),
  upvotesCount: integer('upvotes_count').notNull().default(0),
  answersCount: integer('answers_count').notNull().default(0),
  isAnswered: boolean('is_answered').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  status: forumStatusEnum('status').notNull().default('unanswered'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  authorIdIdx: index('idx_forum_questions_author_id').on(table.authorId),
  statusIdx: index('idx_forum_questions_status').on(table.status),
  isFeaturedIdx: index('idx_forum_questions_is_featured').on(table.isFeatured),
  tagsIdx: index('idx_forum_questions_tags').on(table.tags),
  createdAtIdx: index('idx_forum_questions_created_at').on(table.createdAt),
  popularityIdx: index('idx_forum_questions_popularity').on(table.upvotesCount, table.answersCount),
  authorIdFk: foreignKey({
    columns: [table.authorId],
    foreignColumns: [users.id],
    name: 'forum_questions_author_id_fkey'
  }).onDelete('cascade'),
}));

export const forumAnswers = communitySchema.table('forum_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull(),
  authorId: uuid('author_id').notNull(),
  content: text('content').notNull(),
  upvotesCount: integer('upvotes_count').notNull().default(0),
  isAccepted: boolean('is_accepted').notNull().default(false),
  isTopResponse: boolean('is_top_response').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  questionIdIdx: index('idx_forum_answers_question_id').on(table.questionId),
  authorIdIdx: index('idx_forum_answers_author_id').on(table.authorId),
  isAcceptedIdx: index('idx_forum_answers_is_accepted').on(table.isAccepted),
  createdAtIdx: index('idx_forum_answers_created_at').on(table.createdAt),
  questionIdFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [forumQuestions.id],
    name: 'forum_answers_question_id_fkey'
  }).onDelete('cascade'),
  authorIdFk: foreignKey({
    columns: [table.authorId],
    foreignColumns: [users.id],
    name: 'forum_answers_author_id_fkey'
  }).onDelete('cascade'),
}));

export const forumVotes = communitySchema.table('forum_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  targetId: uuid('target_id').notNull(),
  targetType: targetTypeEnum('target_type').notNull(),
  voteType: voteTypeEnum('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_forum_votes_user_id').on(table.userId),
  targetIdx: index('idx_forum_votes_target').on(table.targetId, table.targetType),
  uniqueVote: unique('forum_votes_user_id_target_id_target_type_key').on(
    table.userId, 
    table.targetId, 
    table.targetType
  ),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'forum_votes_user_id_fkey'
  }).onDelete('cascade'),
}));

export const forumBookmarks = communitySchema.table('forum_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  questionId: uuid('question_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_forum_bookmarks_user_id').on(table.userId),
  questionIdIdx: index('idx_forum_bookmarks_question_id').on(table.questionId),
  uniqueBookmark: unique('forum_bookmarks_user_id_question_id_key').on(table.userId, table.questionId),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'forum_bookmarks_user_id_fkey'
  }).onDelete('cascade'),
  questionIdFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [forumQuestions.id],
    name: 'forum_bookmarks_question_id_fkey'
  }).onDelete('cascade'),
}));

// Type exports
export type ForumQuestion = typeof forumQuestions.$inferSelect;
export type NewForumQuestion = typeof forumQuestions.$inferInsert;
export type ForumAnswer = typeof forumAnswers.$inferSelect;
export type NewForumAnswer = typeof forumAnswers.$inferInsert;
export type ForumVote = typeof forumVotes.$inferSelect;
export type NewForumVote = typeof forumVotes.$inferInsert;
export type ForumBookmark = typeof forumBookmarks.$inferSelect;
export type NewForumBookmark = typeof forumBookmarks.$inferInsert;

// Utility types for community features
export interface ForumQuestionWithAuthor extends ForumQuestion {
  author: {
    id: string;
    fullName: string;
    role: 'teacher' | 'coach' | 'admin';
  };
}

export interface ForumAnswerWithAuthor extends ForumAnswer {
  author: {
    id: string;
    fullName: string;
    role: 'teacher' | 'coach' | 'admin';
  };
}

export interface PopularQuestion {
  id: string;
  title: string;
  authorName: string;
  upvotes: number;
  answerCount: number;
  tags: string[];
  createdAt: Date;
}

export interface CommunityStats {
  totalQuestions: number;
  totalAnswers: number;
  activeUsers: number;
  topTags: Array<{ tag: string; count: number }>;
}