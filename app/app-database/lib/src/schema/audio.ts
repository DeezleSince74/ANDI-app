import { 
  pgTable, 
  pgSchema, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { teacherGoals, sessionStatusEnum, sessionSourceEnum, uploadStatusEnum, momentTypeEnum } from './core';

// Use core schema for audio-related tables
const coreSchema = pgSchema('core');

// Audio Processing & Sessions
export const audioSessions = coreSchema.table('audio_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  sessionDate: date('session_date').notNull().defaultNow(),
  durationSeconds: integer('duration_seconds'),
  status: sessionStatusEnum('status').notNull().default('uploading'),
  source: sessionSourceEnum('source').notNull(),
  audioFileUrl: varchar('audio_file_url', { length: 500 }),
  transcript: text('transcript'),
  metadata: jsonb('metadata').default({}),
  sessionNotes: text('session_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdIdx: index('idx_audio_sessions_teacher_id').on(table.teacherId),
  statusIdx: index('idx_audio_sessions_status').on(table.status),
  sessionDateIdx: index('idx_audio_sessions_session_date').on(table.sessionDate),
  createdAtIdx: index('idx_audio_sessions_created_at').on(table.createdAt),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'audio_sessions_teacher_id_fkey'
  }).onDelete('cascade'),
}));

export const audioUploads = coreSchema.table('audio_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  fileSizeBytes: numeric('file_size_bytes'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadStatus: uploadStatusEnum('upload_status').notNull().default('pending'),
  progressPercentage: numeric('progress_percentage', { precision: 5, scale: 2 }).default('0'),
  errorMessage: text('error_message'),
  uploadStartedAt: timestamp('upload_started_at', { withTimezone: true }).notNull().defaultNow(),
  uploadCompletedAt: timestamp('upload_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index('idx_audio_uploads_session_id').on(table.sessionId),
  statusIdx: index('idx_audio_uploads_status').on(table.uploadStatus),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'audio_uploads_session_id_fkey'
  }).onDelete('cascade'),
}));

export const keyMoments = coreSchema.table('key_moments', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTimeSeconds: integer('start_time_seconds').notNull(),
  endTimeSeconds: integer('end_time_seconds').notNull(),
  audioClipUrl: varchar('audio_clip_url', { length: 500 }),
  momentType: momentTypeEnum('moment_type').notNull(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index('idx_key_moments_session_id').on(table.sessionId),
  typeIdx: index('idx_key_moments_type').on(table.momentType),
  tagsIdx: index('idx_key_moments_tags').on(table.tags),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'key_moments_session_id_fkey'
  }).onDelete('cascade'),
}));

// Recommendations
export const recommendations = coreSchema.table('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull(),
  sessionId: uuid('session_id'),
  category: varchar('category').notNull(), // recommendation_category enum
  title: varchar('title', { length: 255 }).notNull(),
  strategy: text('strategy').notNull(),
  activity: text('activity'),
  prompt: text('prompt'),
  priority: varchar('priority').default('medium'), // priority_level enum
  isRead: boolean('is_read').notNull().default(false),
  isImplemented: boolean('is_implemented').notNull().default(false),
  isLiked: boolean('is_liked'),
  implementationFeedback: jsonb('implementation_feedback').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdIdx: index('idx_recommendations_teacher_id').on(table.teacherId),
  sessionIdIdx: index('idx_recommendations_session_id').on(table.sessionId),
  categoryIdx: index('idx_recommendations_category').on(table.category),
  priorityIdx: index('idx_recommendations_priority').on(table.priority),
  isReadIdx: index('idx_recommendations_is_read').on(table.isRead),
  createdAtIdx: index('idx_recommendations_created_at').on(table.createdAt),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'recommendations_teacher_id_fkey'
  }).onDelete('cascade'),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'recommendations_session_id_fkey'
  }).onDelete('cascade'),
}));

export const classroomActivities = coreSchema.table('classroom_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  category: varchar('category', { length: 50 }).notNull(),
  gradeLevels: text('grade_levels').array(),
  subjects: text('subjects').array(),
  durationMinutes: integer('duration_minutes'),
  difficulty: varchar('difficulty'), // difficulty_level enum
  likesCount: integer('likes_count').notNull().default(0),
  dislikesCount: integer('dislikes_count').notNull().default(0),
  tags: text('tags').array(),
  createdBy: uuid('created_by').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_classroom_activities_category').on(table.category),
  gradeLevelsIdx: index('idx_classroom_activities_grade_levels').on(table.gradeLevels),
  subjectsIdx: index('idx_classroom_activities_subjects').on(table.subjects),
  tagsIdx: index('idx_classroom_activities_tags').on(table.tags),
  createdByIdx: index('idx_classroom_activities_created_by').on(table.createdBy),
  isFeaturedIdx: index('idx_classroom_activities_is_featured').on(table.isFeatured),
  createdByFk: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: 'classroom_activities_created_by_fkey'
  }).onDelete('cascade'),
}));

// Update goal progress logs to reference audio sessions
// This creates the foreign key that was mentioned in the core file

// Communication
export const conversations = coreSchema.table('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull(),
  coachId: uuid('coach_id').notNull(),
  sessionId: uuid('session_id'),
  message: text('message').notNull(),
  senderType: varchar('sender_type').notNull(), // sender_type enum
  senderId: uuid('sender_id').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  replyToId: uuid('reply_to_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdIdx: index('idx_conversations_teacher_id').on(table.teacherId),
  coachIdIdx: index('idx_conversations_coach_id').on(table.coachId),
  sessionIdIdx: index('idx_conversations_session_id').on(table.sessionId),
  senderIdIdx: index('idx_conversations_sender_id').on(table.senderId),
  isReadIdx: index('idx_conversations_is_read').on(table.isRead),
  createdAtIdx: index('idx_conversations_created_at').on(table.createdAt),
  replyToIdx: index('idx_conversations_reply_to').on(table.replyToId),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'conversations_teacher_id_fkey'
  }).onDelete('cascade'),
  coachIdFk: foreignKey({
    columns: [table.coachId],
    foreignColumns: [users.id],
    name: 'conversations_coach_id_fkey'
  }).onDelete('cascade'),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'conversations_session_id_fkey'
  }).onDelete('cascade'),
  senderIdFk: foreignKey({
    columns: [table.senderId],
    foreignColumns: [users.id],
    name: 'conversations_sender_id_fkey'
  }).onDelete('cascade'),
  replyToIdFk: foreignKey({
    columns: [table.replyToId],
    foreignColumns: [table.id],
    name: 'conversations_reply_to_id_fkey'
  }).onDelete('set null'),
}));

export const notifications = coreSchema.table('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  type: varchar('type').notNull(), // notification_type enum
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data').default({}),
  isRead: boolean('is_read').notNull().default(false),
  actionUrl: varchar('action_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  typeIdx: index('idx_notifications_type').on(table.type),
  isReadIdx: index('idx_notifications_is_read').on(table.isRead),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'notifications_user_id_fkey'
  }).onDelete('cascade'),
}));

// Type exports
export type AudioSession = typeof audioSessions.$inferSelect;
export type NewAudioSession = typeof audioSessions.$inferInsert;
export type AudioUpload = typeof audioUploads.$inferSelect;
export type NewAudioUpload = typeof audioUploads.$inferInsert;
export type KeyMoment = typeof keyMoments.$inferSelect;
export type NewKeyMoment = typeof keyMoments.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
export type ClassroomActivity = typeof classroomActivities.$inferSelect;
export type NewClassroomActivity = typeof classroomActivities.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;