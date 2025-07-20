import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `andi_web_${name}`);

// NextAuth.js Tables
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }),
  image: varchar("image", { length: 255 }),
  
  // ANDI-specific user fields
  role: varchar("role", { length: 50 }).default("teacher").notNull(),
  schoolId: varchar("schoolId", { length: 255 }),
  districtId: varchar("districtId", { length: 255 }),
  gradeLevels: jsonb("gradeLevels").$type<string[]>(),
  subjects: jsonb("subjects").$type<string[]>(),
  yearsExperience: integer("yearsExperience"),
  certificationLevel: varchar("certificationLevel", { length: 100 }),
  preferences: jsonb("preferences").$type<Record<string, unknown>>(),
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date()
  ),
});

export const accounts = createTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  })
);

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
);

export const verificationTokens = createTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ANDI-specific tables for web app
export const userSessions = createTable(
  "user_session",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    sessionType: varchar("sessionType", { length: 100 }).notNull(), // "ciq_recording", "coaching", etc.
    sessionData: jsonb("sessionData").$type<Record<string, unknown>>(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    startedAt: timestamp("startedAt", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    endedAt: timestamp("endedAt", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (session) => ({
    userIdIdx: index("user_session_userId_idx").on(session.userId),
    statusIdx: index("user_session_status_idx").on(session.status),
    typeIdx: index("user_session_type_idx").on(session.sessionType),
  })
);

export const userPreferences = createTable(
  "user_preference",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    category: varchar("category", { length: 100 }).notNull(), // "notifications", "dashboard", "audio", etc.
    key: varchar("key", { length: 100 }).notNull(),
    value: jsonb("value").$type<unknown>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (pref) => ({
    userIdIdx: index("user_preference_userId_idx").on(pref.userId),
    categoryIdx: index("user_preference_category_idx").on(pref.category),
    compoundKey: index("user_preference_compound_idx").on(
      pref.userId,
      pref.category,
      pref.key
    ),
  })
);

export const auditLogs = createTable(
  "audit_log",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    resourceId: varchar("resourceId", { length: 255 }),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (log) => ({
    userIdIdx: index("audit_log_userId_idx").on(log.userId),
    actionIdx: index("audit_log_action_idx").on(log.action),
    resourceIdx: index("audit_log_resource_idx").on(log.resource),
    timestampIdx: index("audit_log_timestamp_idx").on(log.timestamp),
  })
);

// Onboarding Tables
export const onboardingContent = createTable(
  "onboarding_content",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    screenName: varchar("screen_name", { length: 50 }).notNull(),
    contentType: varchar("content_type", { length: 50 }).notNull(), // 'option', 'instruction', 'label', 'placeholder'
    contentKey: varchar("content_key", { length: 100 }).notNull(),
    contentValue: text("content_value").notNull(),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (content) => ({
    screenNameIdx: index("onboarding_content_screen_idx").on(content.screenName),
    activeIdx: index("onboarding_content_active_idx").on(content.isActive),
    compoundKey: index("onboarding_content_compound_idx").on(
      content.screenName,
      content.contentType,
      content.contentKey
    ),
  })
);

export const onboardingProgress = createTable(
  "onboarding_progress",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .primaryKey()
      .references(() => users.id),
    currentStep: integer("current_step").default(1),
    completedSteps: jsonb("completed_steps").$type<number[]>().default([]),
    stepData: jsonb("step_data").$type<Record<string, unknown>>().default({}),
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (progress) => ({
    userIdIdx: index("onboarding_progress_user_idx").on(progress.userId),
  })
);

export const onboardingGoals = createTable(
  "onboarding_goals",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    category: varchar("category", { length: 20 }).notNull(), // 'equity', 'creativity', 'innovation'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (goals) => ({
    categoryIdx: index("onboarding_goals_category_idx").on(goals.category),
    activeIdx: index("onboarding_goals_active_idx").on(goals.isActive),
  })
);

// Teacher Profile Table (enhanced version of user fields)
export const teacherProfiles = createTable(
  "teacher_profile",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .primaryKey()
      .references(() => users.id),
    schoolId: varchar("school_id", { length: 255 }),
    gradesTaught: jsonb("grades_taught").$type<string[]>(),
    subjectsTaught: jsonb("subjects_taught").$type<string[]>(),
    yearsExperience: integer("years_experience"),
    teachingStyles: jsonb("teaching_styles").$type<string[]>(),
    personalInterests: jsonb("personal_interests").$type<string[]>(),
    strengths: jsonb("strengths").$type<string[]>(),
    voiceSampleUrl: varchar("voice_sample_url", { length: 500 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (profile) => ({
    userIdIdx: index("teacher_profile_user_idx").on(profile.userId),
    schoolIdIdx: index("teacher_profile_school_idx").on(profile.schoolId),
    completedIdx: index("teacher_profile_completed_idx").on(profile.onboardingCompleted),
  })
);

// AI Orchestration Tables
export const aiJobs = createTable(
  "ai_job",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar("session_id", { length: 255 })
      .references(() => recordingSessions.sessionId),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    jobType: varchar("job_type", { length: 50 }).notNull(), // 'transcription', 'ciq_analysis', 'coaching', 'realtime'
    status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
    progress: integer("progress").default(0), // 0-100
    externalId: varchar("external_id", { length: 255 }), // Assembly AI transcript_id, etc.
    result: jsonb("result").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (job) => ({
    sessionIdIdx: index("ai_job_session_idx").on(job.sessionId),
    userIdIdx: index("ai_job_user_idx").on(job.userId),
    statusIdx: index("ai_job_status_idx").on(job.status),
    typeIdx: index("ai_job_type_idx").on(job.jobType),
    externalIdIdx: index("ai_job_external_idx").on(job.externalId),
    createdAtIdx: index("ai_job_created_idx").on(job.createdAt),
  })
);

export const recordingSessions = createTable(
  "recording_session",
  {
    sessionId: varchar("session_id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    audioUrl: varchar("audio_url", { length: 500 }),
    duration: integer("duration"), // in seconds
    status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'processing', 'completed', 'failed'
    transcriptId: varchar("transcript_id", { length: 255 }), // Assembly AI transcript ID
    ciqScore: integer("ciq_score"), // 0-100
    ciqData: jsonb("ciq_data").$type<Record<string, unknown>>(),
    coachingInsights: jsonb("coaching_insights").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (session) => ({
    userIdIdx: index("recording_session_user_idx").on(session.userId),
    statusIdx: index("recording_session_status_idx").on(session.status),
    transcriptIdIdx: index("recording_session_transcript_idx").on(session.transcriptId),
    createdAtIdx: index("recording_session_created_idx").on(session.createdAt),
  })
);

export const transcripts = createTable(
  "transcript",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar("session_id", { length: 255 })
      .notNull()
      .references(() => recordingSessions.sessionId),
    externalId: varchar("external_id", { length: 255 }).notNull(), // Assembly AI transcript ID
    status: varchar("status", { length: 50 }).notNull(), // 'queued', 'processing', 'completed', 'error'
    text: text("text"),
    confidence: integer("confidence"), // 0-100
    audioUrl: varchar("audio_url", { length: 500 }),
    words: jsonb("words").$type<Array<{
      text: string;
      start: number;
      end: number;
      confidence: number;
      speaker?: string;
    }>>(),
    utterances: jsonb("utterances").$type<Array<{
      start: number;
      end: number;
      text: string;
      speaker: string;
      confidence: number;
    }>>(),
    summary: text("summary"),
    chapters: jsonb("chapters").$type<Array<{
      summary: string;
      headline: string;
      start: number;
      end: number;
    }>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (transcript) => ({
    sessionIdIdx: index("transcript_session_idx").on(transcript.sessionId),
    externalIdIdx: index("transcript_external_idx").on(transcript.externalId),
    statusIdx: index("transcript_status_idx").on(transcript.status),
  })
);

export const ciqAnalyses = createTable(
  "ciq_analysis",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar("session_id", { length: 255 })
      .notNull()
      .references(() => recordingSessions.sessionId),
    transcriptId: varchar("transcript_id", { length: 255 })
      .notNull()
      .references(() => transcripts.id),
    overallScore: integer("overall_score"), // 0-100
    equityScore: integer("equity_score"), // 0-100
    creativityScore: integer("creativity_score"), // 0-100
    innovationScore: integer("innovation_score"), // 0-100
    // ECI Component Scores (E1-E5, C6-C10, I11-I15)
    componentScores: jsonb("component_scores").$type<Record<string, number>>(),
    // Detailed analysis by component
    equityAnalysis: jsonb("equity_analysis").$type<Record<string, unknown>>(),
    creativityAnalysis: jsonb("creativity_analysis").$type<Record<string, unknown>>(),
    innovationAnalysis: jsonb("innovation_analysis").$type<Record<string, unknown>>(),
    // Key insights and patterns
    keyInsights: jsonb("key_insights").$type<string[]>(),
    strengthsIdentified: jsonb("strengths_identified").$type<string[]>(),
    areasForGrowth: jsonb("areas_for_growth").$type<string[]>(),
    evidenceSnippets: jsonb("evidence_snippets").$type<Array<{
      text: string;
      component: string;
      timestamp: number;
      context: string;
    }>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (analysis) => ({
    sessionIdIdx: index("ciq_analysis_session_idx").on(analysis.sessionId),
    transcriptIdIdx: index("ciq_analysis_transcript_idx").on(analysis.transcriptId),
    overallScoreIdx: index("ciq_analysis_score_idx").on(analysis.overallScore),
  })
);

export const coachingRecommendations = createTable(
  "coaching_recommendation",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: varchar("session_id", { length: 255 })
      .notNull()
      .references(() => recordingSessions.sessionId),
    analysisId: varchar("analysis_id", { length: 255 })
      .notNull()
      .references(() => ciqAnalyses.id),
    category: varchar("category", { length: 50 }).notNull(), // 'equity', 'creativity', 'innovation'
    component: varchar("component", { length: 10 }), // 'E1', 'E2', 'C6', 'I11', etc.
    priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'high', 'medium', 'low'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    actionSteps: jsonb("action_steps").$type<string[]>(),
    resources: jsonb("resources").$type<Array<{
      title: string;
      url: string;
      type: string;
      description?: string;
    }>>(),
    expectedOutcome: text("expected_outcome"),
    timeframe: varchar("timeframe", { length: 50 }), // 'immediate', 'weekly', 'monthly'
    difficultyLevel: varchar("difficulty_level", { length: 20 }), // 'beginner', 'intermediate', 'advanced'
    evidenceBasis: jsonb("evidence_basis").$type<Array<{
      text: string;
      timestamp: number;
      reasoning: string;
    }>>(),
    isImplemented: boolean("is_implemented").default(false),
    implementedAt: timestamp("implemented_at", { withTimezone: true }),
    feedback: jsonb("feedback").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (recommendation) => ({
    sessionIdIdx: index("coaching_recommendation_session_idx").on(recommendation.sessionId),
    analysisIdIdx: index("coaching_recommendation_analysis_idx").on(recommendation.analysisId),
    categoryIdx: index("coaching_recommendation_category_idx").on(recommendation.category),
    priorityIdx: index("coaching_recommendation_priority_idx").on(recommendation.priority),
    implementedIdx: index("coaching_recommendation_implemented_idx").on(recommendation.isImplemented),
  })
);