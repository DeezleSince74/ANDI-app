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
  pgEnum,
  index,
  foreignKey,
  unique
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Create core schema
export const coreSchema = pgSchema('core');

// Enums
export const schoolTypeEnum = pgEnum('school_type', ['public', 'private', 'charter', 'magnet', 'independent']);
export const sessionStatusEnum = pgEnum('session_status', ['uploading', 'processing', 'completed', 'failed']);
export const sessionSourceEnum = pgEnum('session_source', ['recorded', 'uploaded']);
export const uploadStatusEnum = pgEnum('upload_status', ['pending', 'processing', 'completed', 'failed']);
export const momentTypeEnum = pgEnum('moment_type', ['strength', 'opportunity', 'highlight']);
export const goalCategoryEnum = pgEnum('goal_category', ['equity', 'creativity', 'innovation', 'engagement', 'general']);
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'paused', 'archived']);
export const recommendationCategoryEnum = pgEnum('recommendation_category', ['equity', 'creativity', 'innovation', 'general']);
export const priorityLevelEnum = pgEnum('priority_level', ['high', 'medium', 'low']);
export const resourceTypeEnum = pgEnum('resource_type', ['article', 'video', 'worksheet', 'tool', 'workshop', 'course']);
export const resourceCategoryEnum = pgEnum('resource_category', ['student_engagement', 'diversity_inclusion', 'technology_integration', 'workshops', 'all']);
export const interactionTypeEnum = pgEnum('interaction_type', ['view', 'like', 'bookmark', 'share']);
export const notificationTypeEnum = pgEnum('notification_type', ['session_processed', 'recommendation_ready', 'achievement_unlocked', 'forum_answer', 'report_ready']);
export const senderTypeEnum = pgEnum('sender_type', ['teacher', 'coach']);
export const resourceDifficultyEnum = pgEnum('resource_difficulty_level', ['beginner', 'intermediate', 'advanced']);

// Organizational Structure
export const districts = coreSchema.table('districts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  stateIdx: index('idx_districts_state').on(table.state),
}));

export const schools = coreSchema.table('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  districtId: uuid('district_id'),
  schoolType: schoolTypeEnum('school_type').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  districtIdIdx: index('idx_schools_district_id').on(table.districtId),
  typeIdx: index('idx_schools_type').on(table.schoolType),
  districtIdFk: foreignKey({
    columns: [table.districtId],
    foreignColumns: [districts.id],
    name: 'schools_district_id_fkey'
  }).onDelete('set null'),
}));

// User Profiles
export const teacherProfiles = coreSchema.table('teacher_profiles', {
  userId: uuid('user_id').primaryKey(),
  schoolId: uuid('school_id'),
  gradesTaught: text('grades_taught').array(),
  subjectsTaught: text('subjects_taught').array(),
  yearsExperience: integer('years_experience'),
  teachingStyles: text('teaching_styles').array(),
  personalInterests: text('personal_interests').array(),
  strengths: text('strengths').array(),
  voiceSampleUrl: varchar('voice_sample_url', { length: 500 }),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('idx_teacher_profiles_school_id').on(table.schoolId),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'teacher_profiles_user_id_fkey'
  }).onDelete('cascade'),
  schoolIdFk: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
    name: 'teacher_profiles_school_id_fkey'
  }).onDelete('set null'),
}));

export const coachProfiles = coreSchema.table('coach_profiles', {
  userId: uuid('user_id').primaryKey(),
  schoolId: uuid('school_id'),
  districtId: uuid('district_id'),
  specializations: text('specializations').array(),
  yearsCoaching: integer('years_coaching'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('idx_coach_profiles_school_id').on(table.schoolId),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'coach_profiles_user_id_fkey'
  }).onDelete('cascade'),
  schoolIdFk: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
    name: 'coach_profiles_school_id_fkey'
  }).onDelete('set null'),
  districtIdFk: foreignKey({
    columns: [table.districtId],
    foreignColumns: [districts.id],
    name: 'coach_profiles_district_id_fkey'
  }).onDelete('set null'),
}));

export const coachTeacherAssignments = coreSchema.table('coach_teacher_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id').notNull(),
  teacherId: uuid('teacher_id').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
}, (table) => ({
  coachIdIdx: index('idx_coach_teacher_assignments_coach_id').on(table.coachId),
  teacherIdIdx: index('idx_coach_teacher_assignments_teacher_id').on(table.teacherId),
  activeIdx: index('idx_coach_teacher_assignments_active').on(table.isActive),
  uniqueAssignment: unique('coach_teacher_assignments_coach_id_teacher_id_key').on(table.coachId, table.teacherId),
  coachIdFk: foreignKey({
    columns: [table.coachId],
    foreignColumns: [users.id],
    name: 'coach_teacher_assignments_coach_id_fkey'
  }).onDelete('cascade'),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'coach_teacher_assignments_teacher_id_fkey'
  }).onDelete('cascade'),
}));

// Goals and Development
export const teacherGoals = coreSchema.table('teacher_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull(),
  category: goalCategoryEnum('category').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: goalStatusEnum('status').notNull().default('active'),
  targetDate: date('target_date'),
  successCriteria: jsonb('success_criteria').default([]),
  progressPercentage: numeric('progress_percentage', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdIdx: index('idx_teacher_goals_teacher_id').on(table.teacherId),
  statusIdx: index('idx_teacher_goals_status').on(table.status),
  categoryIdx: index('idx_teacher_goals_category').on(table.category),
  targetDateIdx: index('idx_teacher_goals_target_date').on(table.targetDate),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'teacher_goals_teacher_id_fkey'
  }).onDelete('cascade'),
}));

export const goalProgressLogs = coreSchema.table('goal_progress_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').notNull(),
  sessionId: uuid('session_id'),
  notes: text('notes'),
  progressIncrement: numeric('progress_increment', { precision: 5, scale: 2 }),
  metricsSnapshot: jsonb('metrics_snapshot').default({}),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  goalIdIdx: index('idx_goal_progress_logs_goal_id').on(table.goalId),
  sessionIdIdx: index('idx_goal_progress_logs_session_id').on(table.sessionId),
  loggedAtIdx: index('idx_goal_progress_logs_logged_at').on(table.loggedAt),
  goalIdFk: foreignKey({
    columns: [table.goalId],
    foreignColumns: [teacherGoals.id],
    name: 'goal_progress_logs_goal_id_fkey'
  }).onDelete('cascade'),
}));

// Audio Processing & Sessions (continued in next file due to length)

// Type exports
export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type NewTeacherProfile = typeof teacherProfiles.$inferInsert;
export type CoachProfile = typeof coachProfiles.$inferSelect;
export type NewCoachProfile = typeof coachProfiles.$inferInsert;
export type CoachTeacherAssignment = typeof coachTeacherAssignments.$inferSelect;
export type NewCoachTeacherAssignment = typeof coachTeacherAssignments.$inferInsert;
export type TeacherGoal = typeof teacherGoals.$inferSelect;
export type NewTeacherGoal = typeof teacherGoals.$inferInsert;
export type GoalProgressLog = typeof goalProgressLogs.$inferSelect;
export type NewGoalProgressLog = typeof goalProgressLogs.$inferInsert;