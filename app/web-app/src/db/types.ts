/**
 * ANDI Database Types - Comprehensive Schema
 * Enhanced with app-database integration for full ANDI platform functionality
 * Maintains backward compatibility with existing types
 */

// User and Authentication Types
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: 'teacher' | 'admin' | 'student';
  schoolId: string | null;
  districtId: string | null;
  gradeLevels: string[] | null;
  subjects: string[] | null;
  yearsExperience: number | null;
  certificationLevel: string | null;
  preferences: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Account {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  tokenType: string | null;
  scope: string | null;
  idToken: string | null;
  sessionState: string | null;
}

export interface Session {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface TeacherProfile {
  userId: string;
  schoolId: string | null;
  gradesTaught: string[] | null;
  subjectsTaught: string[] | null;
  yearsExperience: number | null;
  teachingStyles: string[] | null;
  personalInterests: string[] | null;
  strengths: string[] | null;
  voiceSampleUrl: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date | null;
}

// Recording and AI Types
export interface RecordingSession {
  sessionId: string;
  userId: string;
  title: string;
  description: string | null;
  audioUrl: string | null;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcriptId: string | null;
  ciqScore: number | null;
  ciqData: Record<string, any> | null;
  coachingInsights: Record<string, any> | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface AIJob {
  id: string;
  sessionId: string | null;
  userId: string;
  jobType: 'transcription' | 'ciq_analysis' | 'coaching' | 'realtime';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  externalId: string | null;
  result: Record<string, any> | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Transcript {
  id: string;
  sessionId: string;
  externalId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string | null;
  confidence: number | null;
  audioUrl: string | null;
  words: TranscriptWord[] | null;
  utterances: TranscriptUtterance[] | null;
  summary: string | null;
  chapters: TranscriptChapter[] | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CIQAnalysis {
  id: string;
  sessionId: string;
  transcriptId: string;
  overallScore: number | null;
  equityScore: number | null;
  creativityScore: number | null;
  innovationScore: number | null;
  componentScores: ComponentScores | null;
  equityAnalysis: Record<string, any> | null;
  creativityAnalysis: Record<string, any> | null;
  innovationAnalysis: Record<string, any> | null;
  keyInsights: string[] | null;
  strengthsIdentified: string[] | null;
  areasForGrowth: string[] | null;
  evidenceSnippets: EvidenceSnippet[] | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CoachingRecommendation {
  id: string;
  sessionId: string;
  analysisId: string;
  category: 'equity' | 'creativity' | 'innovation';
  component: string | null;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionSteps: string[] | null;
  resources: Resource[] | null;
  expectedOutcome: string | null;
  timeframe: string | null;
  difficultyLevel: 'easy' | 'moderate' | 'challenging' | null;
  evidenceBasis: string[] | null;
  isImplemented: boolean;
  implementedAt: Date | null;
  feedback: Record<string, any> | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date | null;
}

// Supporting Types
export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptUtterance {
  text: string;
  start: number;
  end: number;
  speaker: string;
  confidence: number;
}

export interface TranscriptChapter {
  gist: string;
  headline: string;
  start: number;
  end: number;
}

export interface ComponentScores {
  E1?: number; // Psychological Safety
  E2?: number; // Access & Opportunity
  E3?: number; // Student Voice
  E4?: number; // Cultural Responsiveness
  E5?: number; // Differentiation
  C6?: number; // Self-Expression
  C7?: number; // Choice & Agency
  C8?: number; // Experimentation
  C9?: number; // Skill Development
  C10?: number; // Artistic Integration
  I11?: number; // Real-World Connection
  I12?: number; // Problem-Solving
  I13?: number; // Technology Integration
  I14?: number; // Future-Ready Skills
  I15?: number; // Continuous Improvement
}

export interface EvidenceSnippet {
  text: string;
  timestamp: number;
  speaker: string;
  component: string;
  score: number;
}

export interface Resource {
  title: string;
  type: 'article' | 'video' | 'tool' | 'activity';
  url: string;
  description: string;
}

// Input types for creating/updating records
export type CreateUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt'>>;

export type CreateRecordingSession = Omit<RecordingSession, 'createdAt' | 'updatedAt'>;
export type UpdateRecordingSession = Partial<Omit<RecordingSession, 'sessionId' | 'userId' | 'createdAt'>>;

export type CreateAIJob = Omit<AIJob, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAIJob = Partial<Omit<AIJob, 'id' | 'userId' | 'createdAt'>>;

export type CreateTranscript = Omit<Transcript, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTranscript = Partial<Omit<Transcript, 'id' | 'sessionId' | 'createdAt'>>;

// =============================================================================
// ENHANCED TYPES FROM APP-DATABASE INTEGRATION
// Auto-synced on Sat Jul 26 00:50:59 EDT 2025
// =============================================================================

// Core app-database schema types
export interface District {
  id: string;
  name: string;
  state: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface School {
  id: string;
  name: string;
  district_id?: string;
  school_type: SchoolType;
  address?: string;
  principal_name?: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

// Additional types would be generated here by a proper schema parser
// For now, maintaining existing comprehensive types from previous integration

// ENHANCED TYPES FROM APP-DATABASE INTEGRATION
// =============================================================================

// ENUM TYPES (matching PostgreSQL ENUMs)
export type UserRole = 'teacher' | 'coach' | 'admin';
export type SchoolType = 'public' | 'private' | 'charter' | 'magnet' | 'independent';
export type SessionStatus = 'uploading' | 'processing' | 'completed' | 'failed';
export type SessionSource = 'recorded' | 'uploaded';
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type MomentType = 'strength' | 'opportunity' | 'highlight';
export type FrameworkType = 'eci' | 'danielson';
export type PerformanceStatus = 'improving' | 'stable' | 'needs_attention' | 'classroom_maestro';
export type TrendDirection = 'up' | 'down' | 'stable';
export type RecommendationCategory = 'equity' | 'creativity' | 'innovation' | 'general';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type ResourceType = 'article' | 'video' | 'worksheet' | 'tool' | 'workshop' | 'course';
export type ResourceCategory = 'student_engagement' | 'diversity_inclusion' | 'technology_integration' | 'workshops' | 'all';
export type InteractionType = 'view' | 'like' | 'bookmark' | 'share';
export type ForumStatus = 'unanswered' | 'answered' | 'popular' | 'bookmarked';
export type VoteType = 'upvote' | 'downvote';
export type AchievementType = 'practice_prodigy' | 'consistency' | 'engagement' | 'community' | 'milestone';
export type NotificationType = 'session_processed' | 'recommendation_ready' | 'achievement_unlocked' | 'forum_answer' | 'report_ready';
export type SenderType = 'teacher' | 'coach';
export type ReportType = 'weekly_summary' | 'monthly_analysis' | 'goal_progress' | 'comparative';
export type ReportStatus = 'generating' | 'completed' | 'failed';
export type GoalCategory = 'equity' | 'creativity' | 'innovation' | 'engagement' | 'general';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type TargetType = 'question' | 'answer';
export type TriviaCategory = 'teaching_techniques' | 'student_engagement' | 'classroom_management' | 'wait_time';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';

// ENHANCED CORE TYPES
export interface District {
  id: string;
  name: string;
  state: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDistrict {
  name: string;
  state: string;
  contact_email?: string;
}

export interface School {
  id: string;
  name: string;
  district_id?: string;
  school_type: SchoolType;
  address?: string;
  principal_name?: string;
  contact_email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSchool {
  name: string;
  district_id?: string;
  school_type: SchoolType;
  address?: string;
  principal_name?: string;
  contact_email?: string;
}

export interface EnhancedTeacherProfile {
  id: string;
  user_id: string;
  school_id?: string;
  employee_id?: string;
  grade_levels?: string[];
  subjects?: string[];
  years_experience?: number;
  certification_level?: string;
  classroom_number?: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  bio?: string;
  teaching_philosophy?: string;
  professional_goals?: string;
  preferred_contact_method: string;
  timezone: string;
  notification_preferences: Record<string, any>;
  onboarding_completed: boolean;
  onboarding_step: number;
  privacy_settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEnhancedTeacherProfile {
  user_id: string;
  school_id?: string;
  employee_id?: string;
  grade_levels?: string[];
  subjects?: string[];
  years_experience?: number;
  certification_level?: string;
  classroom_number?: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  bio?: string;
  teaching_philosophy?: string;
  professional_goals?: string;
  preferred_contact_method?: string;
  timezone?: string;
  notification_preferences?: Record<string, any>;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  privacy_settings?: Record<string, any>;
}

export interface CoachProfile {
  id: string;
  user_id: string;
  specialization?: string[];
  years_coaching?: number;
  certifications?: string[];
  bio?: string;
  coaching_philosophy?: string;
  availability_schedule?: Record<string, any>;
  max_teachers_supported: number;
  current_teachers_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TeacherGoal {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_value?: number;
  current_value: number;
  unit?: string;
  target_date?: Date;
  status: GoalStatus;
  priority: PriorityLevel;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeacherGoal {
  teacher_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: Date;
  status?: GoalStatus;
  priority?: PriorityLevel;
}

// ENHANCED ANALYTICS TYPES
export interface CIQMetric {
  id: string;
  session_id: string;
  teacher_id: string;
  overall_score: number;
  equity_score?: number;
  creativity_score?: number;
  innovation_score?: number;
  framework_scores: Record<string, any>;
  participation_metrics: Record<string, any>;
  engagement_indicators: Record<string, any>;
  calculated_at: Date;
  calculation_version: string;
}

export interface TeacherPerformanceSummary {
  id: string;
  teacher_id: string;
  current_ciq_score?: number;
  average_ciq_score?: number;
  sessions_count: number;
  recommendations_implemented: number;
  goals_achieved: number;
  performance_status: PerformanceStatus;
  last_session_date?: Date;
  trend_direction: TrendDirection;
  improvement_areas?: string[];
  strengths?: string[];
  updated_at: Date;
}

export interface Report {
  id: string;
  teacher_id: string;
  report_type: ReportType;
  title: string;
  content: Record<string, any>;
  generated_at: Date;
  period_start?: Date;
  period_end?: Date;
  status: ReportStatus;
  file_path?: string;
  is_shared: boolean;
}

// COMMUNITY TYPES
export interface ForumQuestion {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags?: string[];
  status: ForumStatus;
  view_count: number;
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

// GAMIFICATION TYPES
export interface Achievement {
  id: string;
  name: string;
  description: string;
  achievement_type: AchievementType;
  criteria: Record<string, any>;
  points_value: number;
  badge_icon_url?: string;
  rarity: DifficultyLevel;
  is_active: boolean;
  created_at: Date;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: Date;
  progress_data: Record<string, any>;
}

// ENHANCED RESOURCE TYPES
export interface EnhancedResource {
  id: string;
  title: string;
  description?: string;
  resource_type: ResourceType;
  category: ResourceCategory;
  content_url?: string;
  file_path?: string;
  author_name?: string;
  organization?: string;
  difficulty_level: DifficultyLevel;
  estimated_time_minutes?: number;
  tags?: string[];
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ResourceInteraction {
  id: string;
  user_id: string;
  resource_id: string;
  interaction_type: InteractionType;
  created_at: Date;
}

// UTILITY TYPES
export interface DatabaseRecord {
  created_at: Date;
  updated_at?: Date;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string | Date;
  version?: string;
  pool_total?: number;
  pool_idle?: number;
  pool_waiting?: number;
  error?: string;
}

export interface DatabaseStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  isConnected: boolean;
}

// FRONTEND INTERFACE TYPES (for UI components)
export interface ProcessingWidgetData {
  sessionId: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error?: string;
}

export interface RecordingCardData {
  sessionId: string;
  title: string;
  createdAt: Date;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusBadge: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

// API RESPONSE TYPES
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// DATABASE CONFIGURATION TYPES
export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  application_name?: string;
}