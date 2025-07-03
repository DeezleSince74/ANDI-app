/**
 * TypeScript type definitions for ANDI ETL pipelines
 */

export interface ETLConfig {
  batchSize: number;
  maxRetries: number;
  timeoutMs: number;
  parallelWorkers: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface ClickHouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// CIQ Data Types
export interface CIQSessionRaw {
  session_id: string;
  teacher_id: string;
  school_id: string;
  district_id: string;
  session_date: Date;
  session_timestamp: Date;
  duration_seconds: number;
  equity_score: number;
  wait_time_avg: number;
  student_engagement: number;
  overall_score: number;
  student_talk_time: number;
  teacher_talk_time: number;
  silence_time: number;
  question_count: number;
  response_count: number;
  created_at: Date;
}

export interface CIQSessionTransformed {
  session_id: string;
  teacher_id: string;
  school_id: string;
  district_id: string;
  session_date: string; // YYYY-MM-DD format for ClickHouse
  session_timestamp: string; // ISO string
  duration_seconds: number;
  equity_score: number;
  wait_time_avg: number;
  student_engagement: number;
  overall_score: number;
  student_talk_time: number;
  teacher_talk_time: number;
  silence_time: number;
  question_count: number;
  response_count: number;
  created_at: string;
}

// Dimension Data Types
export interface TeacherDimension {
  teacher_id: string;
  full_name: string;
  email: string;
  school_id: string;
  district_id: string;
  grade_levels: string[];
  subjects: string[];
  years_experience: number;
  created_at: string;
  updated_at: string;
}

export interface SchoolDimension {
  school_id: string;
  name: string;
  district_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  principal_name: string;
  student_count: number;
  teacher_count: number;
  created_at: string;
  updated_at: string;
}

export interface DistrictDimension {
  district_id: string;
  name: string;
  state: string;
  superintendent: string;
  total_schools: number;
  total_students: number;
  total_teachers: number;
  created_at: string;
  updated_at: string;
}

// Resource Usage Data Types
export interface ResourceUsageRaw {
  interaction_id: string;
  user_id: string;
  resource_id: string;
  interaction_type: string;
  interaction_date: Date;
  resource_title: string;
  resource_type: string;
  resource_category: string;
  created_at: Date;
}

export interface ResourceUsageTransformed {
  interaction_id: string;
  user_id: string;
  resource_id: string;
  interaction_type: string;
  interaction_date: string;
  resource_title: string;
  resource_type: string;
  resource_category: string;
  created_at: string;
}

// Community Activity Data Types
export interface CommunityActivityRaw {
  activity_id: string;
  user_id: string;
  activity_type: string;
  target_id: string;
  target_type: string;
  activity_date: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface CommunityActivityTransformed {
  activity_id: string;
  user_id: string;
  activity_type: string;
  target_id: string;
  target_type: string;
  activity_date: string;
  metadata: string; // JSON string
  created_at: string;
}

// ETL Pipeline Types
export interface ETLJob {
  jobId: string;
  jobName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessages: string[];
}

export interface ETLResult {
  success: boolean;
  recordsExtracted: number;
  recordsTransformed: number;
  recordsLoaded: number;
  recordsFailed: number;
  duration: number;
  errors: string[];
}

export interface DataQualityRule {
  field: string;
  rule: 'required' | 'type' | 'range' | 'format' | 'unique';
  parameters?: any;
  message: string;
}

export interface DataQualityResult {
  tableName: string;
  totalRecords: number;
  passedRecords: number;
  failedRecords: number;
  successRate: number;
  violations: Array<{
    rule: string;
    field: string;
    count: number;
    message: string;
  }>;
}

// Aggregation Types
export interface DailyTeacherPerformance {
  teacher_id: string;
  performance_date: string;
  session_count: number;
  avg_equity_score: number;
  avg_wait_time: number;
  avg_student_engagement: number;
  avg_overall_score: number;
  total_duration_minutes: number;
  created_at: string;
}

export interface WeeklySchoolMetrics {
  school_id: string;
  week_start_date: string;
  teacher_count: number;
  total_sessions: number;
  avg_school_score: number;
  active_teachers: number;
  top_performing_teachers: number;
  improvement_needed_teachers: number;
  created_at: string;
}

export interface MonthlyDistrictTrends {
  district_id: string;
  month_year: string;
  total_teachers: number;
  total_sessions: number;
  avg_district_score: number;
  schools_above_target: number;
  schools_below_target: number;
  teacher_retention_rate: number;
  engagement_trend: 'improving' | 'stable' | 'declining';
  created_at: string;
}