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
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { audioSessions } from './audio';

// Create analytics schema
export const analyticsSchema = pgSchema('analytics');

// Enums
export const frameworkTypeEnum = pgEnum('framework_type', ['eci', 'danielson']);
export const performanceStatusEnum = pgEnum('performance_status', ['improving', 'stable', 'needs_attention', 'classroom_maestro']);
export const trendDirectionEnum = pgEnum('trend_direction', ['up', 'down', 'stable']);
export const reportTypeEnum = pgEnum('report_type', ['weekly_summary', 'monthly_analysis', 'goal_progress', 'comparative']);
export const reportStatusEnum = pgEnum('report_status', ['generating', 'completed', 'failed']);

// CIQ Analytics & Performance
export const ciqMetrics = analyticsSchema.table('ciq_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  teacherId: uuid('teacher_id').notNull(),
  classroomId: uuid('classroom_id'),
  calculationDate: date('calculation_date').default(sql`CURRENT_DATE`),
  equityScore: numeric('equity_score', { precision: 5, scale: 2 }),
  creativityScore: numeric('creativity_score', { precision: 5, scale: 2 }),
  innovationScore: numeric('innovation_score', { precision: 5, scale: 2 }),
  overallScore: numeric('overall_score', { precision: 5, scale: 2 }),
  frameworkType: frameworkTypeEnum('framework_type').notNull().default('eci'),
  teacherTalkPercentage: numeric('teacher_talk_percentage', { precision: 5, scale: 2 }),
  studentTalkPercentage: numeric('student_talk_percentage', { precision: 5, scale: 2 }),
  questionCount: integer('question_count'),
  waitTimeAvg: numeric('wait_time_avg', { precision: 5, scale: 2 }),
  equityDetails: jsonb('equity_details').default({}),
  creativityDetails: jsonb('creativity_details').default({}),
  innovationDetails: jsonb('innovation_details').default({}),
  talkTimeRatio: numeric('talk_time_ratio', { precision: 5, scale: 2 }),
  questionMetrics: jsonb('question_metrics').default({}),
  radarData: jsonb('radar_data').default({}),
  eciDetailedScores: jsonb('eci_detailed_scores').default({}),
  adaptiveWeights: jsonb('adaptive_weights').default({}),
  calculationMetadata: jsonb('calculation_metadata').default({}),
  dataSourceWeights: jsonb('data_source_weights').default({}),
  qualityIndicators: jsonb('quality_indicators').default({}),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index('idx_ciq_metrics_session_id').on(table.sessionId),
  teacherIdIdx: index('idx_ciq_metrics_teacher_id').on(table.teacherId),
  classroomIdIdx: index('idx_ciq_metrics_classroom_id').on(table.classroomId),
  calculatedAtIdx: index('idx_ciq_metrics_calculated_at').on(table.calculatedAt),
  calculationDateIdx: index('idx_ciq_metrics_calculation_date').on(table.calculationDate),
  scoresIdx: index('idx_ciq_metrics_scores').on(table.equityScore, table.creativityScore, table.innovationScore),
  uniqueSession: unique('ciq_metrics_session_id_key').on(table.sessionId),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'ciq_metrics_session_id_fkey'
  }).onDelete('cascade'),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'ciq_metrics_teacher_id_fkey'
  }).onDelete('cascade'),
}));

export const teacherPerformanceSummary = analyticsSchema.table('teacher_performance_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  totalSessions: integer('total_sessions').notNull().default(0),
  totalDurationHours: numeric('total_duration_hours', { precision: 10, scale: 2 }).notNull().default('0'),
  sessionsThisWeek: integer('sessions_this_week').notNull().default(0),
  sessionsLastWeek: integer('sessions_last_week').notNull().default(0),
  performanceStatus: performanceStatusEnum('performance_status'),
  performanceTitle: varchar('performance_title', { length: 255 }),
  avgEquityScore: numeric('avg_equity_score', { precision: 5, scale: 2 }),
  avgCreativityScore: numeric('avg_creativity_score', { precision: 5, scale: 2 }),
  avgInnovationScore: numeric('avg_innovation_score', { precision: 5, scale: 2 }),
  avgOverallScore: numeric('avg_overall_score', { precision: 5, scale: 2 }),
  equityTrend: trendDirectionEnum('equity_trend'),
  creativityTrend: trendDirectionEnum('creativity_trend'),
  innovationTrend: trendDirectionEnum('innovation_trend'),
  weeklyTrends: jsonb('weekly_trends').default({}),
  radarPerformanceData: jsonb('radar_performance_data').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdIdx: index('idx_teacher_performance_teacher_id').on(table.teacherId),
  periodIdx: index('idx_teacher_performance_period').on(table.periodStart, table.periodEnd),
  statusIdx: index('idx_teacher_performance_status').on(table.performanceStatus),
  updatedIdx: index('idx_teacher_performance_updated').on(table.updatedAt),
  uniquePeriod: unique('teacher_performance_summary_teacher_id_period_start_period__key').on(
    table.teacherId, 
    table.periodStart, 
    table.periodEnd
  ),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'teacher_performance_summary_teacher_id_fkey'
  }).onDelete('cascade'),
}));

// Reports & Analytics
export const reports = analyticsSchema.table('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  generatedBy: uuid('generated_by').notNull(),
  teacherId: uuid('teacher_id'),
  reportType: reportTypeEnum('report_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  dateRangeStart: date('date_range_start').notNull(),
  dateRangeEnd: date('date_range_end').notNull(),
  data: jsonb('data').notNull().default({}),
  status: reportStatusEnum('status').notNull().default('generating'),
  isTagged: boolean('is_tagged').notNull().default(false),
  isReviewed: boolean('is_reviewed').notNull().default(false),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  generatedByIdx: index('idx_reports_generated_by').on(table.generatedBy),
  teacherIdIdx: index('idx_reports_teacher_id').on(table.teacherId),
  typeIdx: index('idx_reports_type').on(table.reportType),
  statusIdx: index('idx_reports_status').on(table.status),
  dateRangeIdx: index('idx_reports_date_range').on(table.dateRangeStart, table.dateRangeEnd),
  isTaggedIdx: index('idx_reports_is_tagged').on(table.isTagged),
  isReviewedIdx: index('idx_reports_is_reviewed').on(table.isReviewed),
  createdAtIdx: index('idx_reports_created_at').on(table.createdAt),
  generatedByFk: foreignKey({
    columns: [table.generatedBy],
    foreignColumns: [users.id],
    name: 'reports_generated_by_fkey'
  }).onDelete('cascade'),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [users.id],
    name: 'reports_teacher_id_fkey'
  }).onDelete('cascade'),
  reviewedByFk: foreignKey({
    columns: [table.reviewedBy],
    foreignColumns: [users.id],
    name: 'reports_reviewed_by_fkey'
  }).onDelete('set null'),
}));

// Type exports
export type CiqMetric = typeof ciqMetrics.$inferSelect;
export type NewCiqMetric = typeof ciqMetrics.$inferInsert;
export type TeacherPerformanceSummary = typeof teacherPerformanceSummary.$inferSelect;
export type NewTeacherPerformanceSummary = typeof teacherPerformanceSummary.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

// Utility types for CIQ analysis
export interface CiqScores {
  equity: number;
  creativity: number;
  innovation: number;
  overall: number;
}

export interface CiqAnalysisResult {
  scores: CiqScores;
  talkTimeRatio: number;
  questionMetrics: {
    totalQuestions: number;
    openEndedQuestions: number;
    waitTime: number;
    studentResponses: number;
  };
  recommendations: string[];
}

export interface PerformanceTrends {
  equity: 'up' | 'down' | 'stable';
  creativity: 'up' | 'down' | 'stable';
  innovation: 'up' | 'down' | 'stable';
}