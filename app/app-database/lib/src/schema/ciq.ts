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
  unique,
  time
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { districts, schools, teacherProfiles } from './core';
import { audioSessions } from './audio';

// Create core schema reference (internal use only)
const coreSchema = pgSchema('core');

// ============================================================================
// ENUMS for CIQ Framework
// ============================================================================

export const surveyTypeEnum = pgEnum('survey_type', ['pre_observation', 'post_observation', 'mid_year', 'end_year', 'student_experience', 'parent_experience', 'custom']);
export const surveyStatusEnum = pgEnum('survey_status', ['draft', 'active', 'paused', 'completed', 'archived']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'likert_scale', 'text', 'boolean', 'ranking', 'matrix']);
export const responseStatusEnum = pgEnum('response_status', ['started', 'in_progress', 'completed', 'abandoned']);
export const integrationTypeEnum = pgEnum('integration_type', ['sis', 'lms', 'gradebook', 'attendance', 'assessment']);
export const syncFrequencyEnum = pgEnum('sync_frequency', ['real_time', 'hourly', 'daily', 'weekly', 'manual']);
export const integrationStatusEnum = pgEnum('integration_status', ['active', 'inactive', 'error', 'pending_setup']);
export const dataSyncStatusEnum = pgEnum('data_sync_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);
export const ciqFrameworkTypeEnum = pgEnum('framework_type', ['eci', 'danielson', 'charlotte_danielson', 'custom']);

// ============================================================================
// STUDENT MANAGEMENT SYSTEM (v1.2.0)
// ============================================================================

export const students = coreSchema.table('students', {
  studentId: uuid('student_id').primaryKey().defaultRandom(),
  studentIdentifier: varchar('student_identifier', { length: 100 }).notNull(),
  districtId: uuid('district_id'),
  schoolId: uuid('school_id'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 10 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  enrollmentDate: date('enrollment_date').default(sql`CURRENT_DATE`),
  graduationDate: date('graduation_date'),
  isActive: boolean('is_active').default(true),
  demographicData: jsonb('demographic_data').default({}),
  specialNeeds: jsonb('special_needs').default({}),
  emergencyContact: jsonb('emergency_contact').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  districtSchoolIdx: index('idx_students_district_school').on(table.districtId, table.schoolId),
  gradeActiveIdx: index('idx_students_grade_active').on(table.gradeLevel, table.isActive),
  identifierIdx: index('idx_students_identifier').on(table.studentIdentifier),
  uniqueStudentIdentifier: unique('unique_student_identifier_per_district').on(table.districtId, table.studentIdentifier),
  districtIdFk: foreignKey({
    columns: [table.districtId],
    foreignColumns: [districts.id],
    name: 'students_district_id_fkey'
  }).onDelete('cascade'),
  schoolIdFk: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
    name: 'students_school_id_fkey'
  }).onDelete('cascade'),
}));

export const classrooms = coreSchema.table('classrooms', {
  classroomId: uuid('classroom_id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id'),
  schoolId: uuid('school_id'),
  classroomName: varchar('classroom_name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 10 }).notNull(),
  academicYear: varchar('academic_year', { length: 10 }).notNull(),
  semester: varchar('semester', { length: 20 }),
  classPeriod: varchar('class_period', { length: 10 }),
  roomNumber: varchar('room_number', { length: 20 }),
  maxCapacity: integer('max_capacity').default(30),
  classSchedule: jsonb('class_schedule').default({}),
  curriculumStandards: jsonb('curriculum_standards').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teacherIdx: index('idx_classrooms_teacher').on(table.teacherId),
  schoolYearIdx: index('idx_classrooms_school_year').on(table.schoolId, table.academicYear),
  subjectGradeIdx: index('idx_classrooms_subject_grade').on(table.subject, table.gradeLevel),
  uniqueTeacherClassroomPeriod: unique('unique_teacher_classroom_period').on(table.teacherId, table.academicYear, table.semester, table.classPeriod),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [teacherProfiles.userId],
    name: 'classrooms_teacher_id_fkey'
  }).onDelete('cascade'),
  schoolIdFk: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
    name: 'classrooms_school_id_fkey'
  }).onDelete('cascade'),
}));

export const classroomEnrollments = coreSchema.table('classroom_enrollments', {
  enrollmentId: uuid('enrollment_id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id'),
  studentId: uuid('student_id'),
  enrollmentDate: date('enrollment_date').default(sql`CURRENT_DATE`),
  withdrawalDate: date('withdrawal_date'),
  enrollmentStatus: varchar('enrollment_status', { length: 20 }).default('active'),
  seatNumber: integer('seat_number'),
  specialAccommodations: jsonb('special_accommodations').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  classroomIdx: index('idx_enrollments_classroom').on(table.classroomId),
  studentIdx: index('idx_enrollments_student').on(table.studentId),
  statusIdx: index('idx_enrollments_status').on(table.enrollmentStatus),
  uniqueActiveEnrollment: unique('unique_active_enrollment').on(table.classroomId, table.studentId, table.enrollmentStatus),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'classroom_enrollments_classroom_id_fkey'
  }).onDelete('cascade'),
  studentIdFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.studentId],
    name: 'classroom_enrollments_student_id_fkey'
  }).onDelete('cascade'),
}));

export const studentAcademicRecords = coreSchema.table('student_academic_records', {
  recordId: uuid('record_id').primaryKey().defaultRandom(),
  studentId: uuid('student_id'),
  classroomId: uuid('classroom_id'),
  academicYear: varchar('academic_year', { length: 10 }).notNull(),
  semester: varchar('semester', { length: 20 }),
  currentGrade: varchar('current_grade', { length: 5 }),
  gradePercentage: numeric('grade_percentage', { precision: 5, scale: 2 }),
  assignmentScores: jsonb('assignment_scores').default({}),
  testScores: jsonb('test_scores').default({}),
  projectScores: jsonb('project_scores').default({}),
  participationGrade: varchar('participation_grade', { length: 5 }),
  effortGrade: varchar('effort_grade', { length: 5 }),
  learningObjectivesMet: jsonb('learning_objectives_met').default({}),
  skillAssessments: jsonb('skill_assessments').default({}),
  growthMeasurements: jsonb('growth_measurements').default({}),
  teacherComments: text('teacher_comments'),
  parentComments: text('parent_comments'),
  studentReflection: text('student_reflection'),
  recordedDate: date('recorded_date').default(sql`CURRENT_DATE`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdx: index('idx_academic_records_student').on(table.studentId),
  classroomIdx: index('idx_academic_records_classroom').on(table.classroomId),
  yearSemesterIdx: index('idx_academic_records_year_semester').on(table.academicYear, table.semester),
  uniqueStudentClassroomSemester: unique('unique_student_classroom_semester').on(table.studentId, table.classroomId, table.academicYear, table.semester),
  studentIdFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.studentId],
    name: 'student_academic_records_student_id_fkey'
  }).onDelete('cascade'),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'student_academic_records_classroom_id_fkey'
  }).onDelete('cascade'),
}));

export const studentAttendance = coreSchema.table('student_attendance', {
  attendanceId: uuid('attendance_id').primaryKey().defaultRandom(),
  studentId: uuid('student_id'),
  classroomId: uuid('classroom_id'),
  attendanceDate: date('attendance_date').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  arrivalTime: time('arrival_time'),
  departureTime: time('departure_time'),
  minutesPresent: integer('minutes_present').default(0),
  totalMinutes: integer('total_minutes').default(0),
  reason: varchar('reason', { length: 200 }),
  parentNotified: boolean('parent_notified').default(false),
  makeupWorkAssigned: boolean('makeup_work_assigned').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentDateIdx: index('idx_attendance_student_date').on(table.studentId, table.attendanceDate),
  classroomDateIdx: index('idx_attendance_classroom_date').on(table.classroomId, table.attendanceDate),
  statusIdx: index('idx_attendance_status').on(table.status),
  uniqueStudentClassroomDate: unique('unique_student_classroom_date').on(table.studentId, table.classroomId, table.attendanceDate),
  studentIdFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.studentId],
    name: 'student_attendance_student_id_fkey'
  }).onDelete('cascade'),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'student_attendance_classroom_id_fkey'
  }).onDelete('cascade'),
}));

export const studentBehaviorRecords = coreSchema.table('student_behavior_records', {
  behaviorId: uuid('behavior_id').primaryKey().defaultRandom(),
  studentId: uuid('student_id'),
  classroomId: uuid('classroom_id'),
  recordedBy: uuid('recorded_by'),
  incidentDate: date('incident_date').notNull(),
  incidentTime: time('incident_time'),
  behaviorType: varchar('behavior_type', { length: 50 }).notNull(),
  behaviorCategory: varchar('behavior_category', { length: 100 }),
  behaviorDescription: text('behavior_description').notNull(),
  severityLevel: integer('severity_level'),
  classroomContext: text('classroom_context'),
  antecedent: text('antecedent'),
  consequence: text('consequence'),
  interventionUsed: varchar('intervention_used', { length: 200 }),
  parentContacted: boolean('parent_contacted').default(false),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdx: index('idx_behavior_student').on(table.studentId),
  classroomIdx: index('idx_behavior_classroom').on(table.classroomId),
  dateIdx: index('idx_behavior_date').on(table.incidentDate),
  typeIdx: index('idx_behavior_type').on(table.behaviorType),
  studentIdFk: foreignKey({
    columns: [table.studentId],
    foreignColumns: [students.studentId],
    name: 'student_behavior_records_student_id_fkey'
  }).onDelete('cascade'),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'student_behavior_records_classroom_id_fkey'
  }).onDelete('cascade'),
  recordedByFk: foreignKey({
    columns: [table.recordedBy],
    foreignColumns: [users.id],
    name: 'student_behavior_records_recorded_by_fkey'
  }),
}));

// ============================================================================
// SURVEY INFRASTRUCTURE (v1.2.1)
// ============================================================================

export const surveys = pgTable('surveys', {
  surveyId: uuid('survey_id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  surveyType: surveyTypeEnum('survey_type').notNull(),
  targetAudience: varchar('target_audience', { length: 100 }),
  gradeLevels: text('grade_levels').array(),
  subjects: text('subjects').array(),
  schoolIds: uuid('school_ids').array(),
  districtIds: uuid('district_ids').array(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  reminderFrequency: integer('reminder_frequency').default(7),
  maxReminders: integer('max_reminders').default(3),
  estimatedDuration: integer('estimated_duration'),
  isAnonymous: boolean('is_anonymous').default(false),
  isMandatory: boolean('is_mandatory').default(false),
  allowPartialResponses: boolean('allow_partial_responses').default(true),
  status: surveyStatusEnum('status').default('draft'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('idx_surveys_status').on(table.status),
  typeIdx: index('idx_surveys_type').on(table.surveyType),
  createdByIdx: index('idx_surveys_created_by').on(table.createdBy),
  createdByFk: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: 'surveys_created_by_fkey'
  }),
}));

export const surveyQuestions = pgTable('survey_questions', {
  questionId: uuid('question_id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id'),
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').notNull(),
  questionOrder: integer('question_order').notNull(),
  isRequired: boolean('is_required').default(false),
  sectionTitle: varchar('section_title', { length: 200 }),
  options: jsonb('options').default({}),
  validationRules: jsonb('validation_rules').default({}),
  conditionalLogic: jsonb('conditional_logic').default({}),
  likertScaleType: varchar('likert_scale_type', { length: 50 }),
  minValue: integer('min_value'),
  maxValue: integer('max_value'),
  scaleLabels: jsonb('scale_labels').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  surveyIdx: index('idx_survey_questions_survey').on(table.surveyId),
  orderIdx: index('idx_survey_questions_order').on(table.questionOrder),
  surveyIdFk: foreignKey({
    columns: [table.surveyId],
    foreignColumns: [surveys.surveyId],
    name: 'survey_questions_survey_id_fkey'
  }).onDelete('cascade'),
}));

export const surveyAssignments = pgTable('survey_assignments', {
  assignmentId: uuid('assignment_id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id'),
  assignedToUserId: uuid('assigned_to_user_id'),
  assignedToRole: varchar('assigned_to_role', { length: 50 }),
  classroomId: uuid('classroom_id'),
  schoolId: uuid('school_id'),
  districtId: uuid('district_id'),
  assignedDate: date('assigned_date').default(sql`CURRENT_DATE`),
  dueDate: date('due_date'),
  remindersSent: integer('reminders_sent').default(0),
  lastReminderDate: date('last_reminder_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  surveyIdx: index('idx_survey_assignments_survey').on(table.surveyId),
  assignedToIdx: index('idx_survey_assignments_assigned_to').on(table.assignedToUserId),
  classroomIdx: index('idx_survey_assignments_classroom').on(table.classroomId),
  surveyIdFk: foreignKey({
    columns: [table.surveyId],
    foreignColumns: [surveys.surveyId],
    name: 'survey_assignments_survey_id_fkey'
  }).onDelete('cascade'),
  assignedToUserIdFk: foreignKey({
    columns: [table.assignedToUserId],
    foreignColumns: [users.id],
    name: 'survey_assignments_assigned_to_user_id_fkey'
  }),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'survey_assignments_classroom_id_fkey'
  }),
}));

export const surveyResponses = pgTable('survey_responses', {
  responseId: uuid('response_id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id'),
  assignmentId: uuid('assignment_id'),
  respondentUserId: uuid('respondent_user_id'),
  respondentRole: varchar('respondent_role', { length: 50 }),
  respondentMetadata: jsonb('respondent_metadata').default({}),
  status: responseStatusEnum('status').default('started'),
  startTime: timestamp('start_time', { withTimezone: true }),
  completionTime: timestamp('completion_time', { withTimezone: true }),
  timeSpentMinutes: integer('time_spent_minutes'),
  responses: jsonb('responses').default({}),
  completionPercentage: numeric('completion_percentage', { precision: 5, scale: 2 }).default('0'),
  sessionContext: jsonb('session_context').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  surveyIdx: index('idx_survey_responses_survey').on(table.surveyId),
  assignmentIdx: index('idx_survey_responses_assignment').on(table.assignmentId),
  respondentIdx: index('idx_survey_responses_respondent').on(table.respondentUserId),
  statusIdx: index('idx_survey_responses_status').on(table.status),
  surveyIdFk: foreignKey({
    columns: [table.surveyId],
    foreignColumns: [surveys.surveyId],
    name: 'survey_responses_survey_id_fkey'
  }).onDelete('cascade'),
  assignmentIdFk: foreignKey({
    columns: [table.assignmentId],
    foreignColumns: [surveyAssignments.assignmentId],
    name: 'survey_responses_assignment_id_fkey'
  }),
  respondentUserIdFk: foreignKey({
    columns: [table.respondentUserId],
    foreignColumns: [users.id],
    name: 'survey_responses_respondent_user_id_fkey'
  }),
}));

export const questionResponses = pgTable('question_responses', {
  questionResponseId: uuid('question_response_id').primaryKey().defaultRandom(),
  responseId: uuid('response_id'),
  questionId: uuid('question_id'),
  textResponse: text('text_response'),
  numericResponse: numeric('numeric_response', { precision: 10, scale: 2 }),
  booleanResponse: boolean('boolean_response'),
  jsonResponse: jsonb('json_response'),
  responseTimeSeconds: integer('response_time_seconds'),
  revisionCount: integer('revision_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  responseIdx: index('idx_question_responses_response').on(table.responseId),
  questionIdx: index('idx_question_responses_question').on(table.questionId),
  responseIdFk: foreignKey({
    columns: [table.responseId],
    foreignColumns: [surveyResponses.responseId],
    name: 'question_responses_response_id_fkey'
  }).onDelete('cascade'),
  questionIdFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [surveyQuestions.questionId],
    name: 'question_responses_question_id_fkey'
  }),
}));

// ============================================================================
// SIS/LMS INTEGRATION (v1.2.2)
// ============================================================================

export const externalSystemIntegrations = pgTable('external_system_integrations', {
  integrationId: uuid('integration_id').primaryKey().defaultRandom(),
  districtId: uuid('district_id'),
  schoolId: uuid('school_id'),
  systemName: varchar('system_name', { length: 100 }).notNull(),
  systemVendor: varchar('system_vendor', { length: 100 }),
  integrationType: integrationTypeEnum('integration_type').notNull(),
  systemVersion: varchar('system_version', { length: 50 }),
  baseUrl: varchar('base_url', { length: 500 }),
  apiEndpoint: varchar('api_endpoint', { length: 500 }),
  authenticationMethod: varchar('authentication_method', { length: 50 }),
  authenticationConfig: jsonb('authentication_config').default({}),
  fieldMappings: jsonb('field_mappings').default({}),
  dataFilters: jsonb('data_filters').default({}),
  transformationRules: jsonb('transformation_rules').default({}),
  syncFrequency: syncFrequencyEnum('sync_frequency').default('daily'),
  syncSchedule: varchar('sync_schedule', { length: 100 }),
  lastSuccessfulSync: timestamp('last_successful_sync', { withTimezone: true }),
  nextScheduledSync: timestamp('next_scheduled_sync', { withTimezone: true }),
  status: integrationStatusEnum('status').default('pending_setup'),
  errorCount: integer('error_count').default(0),
  lastErrorMessage: text('last_error_message'),
  lastErrorTime: timestamp('last_error_time', { withTimezone: true }),
  configuredBy: uuid('configured_by'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  districtIdx: index('idx_external_integrations_district').on(table.districtId),
  schoolIdx: index('idx_external_integrations_school').on(table.schoolId),
  statusIdx: index('idx_external_integrations_status').on(table.status),
  typeIdx: index('idx_external_integrations_type').on(table.integrationType),
  districtIdFk: foreignKey({
    columns: [table.districtId],
    foreignColumns: [districts.id],
    name: 'external_system_integrations_district_id_fkey'
  }),
  schoolIdFk: foreignKey({
    columns: [table.schoolId],
    foreignColumns: [schools.id],
    name: 'external_system_integrations_school_id_fkey'
  }),
  configuredByFk: foreignKey({
    columns: [table.configuredBy],
    foreignColumns: [users.id],
    name: 'external_system_integrations_configured_by_fkey'
  }),
  approvedByFk: foreignKey({
    columns: [table.approvedBy],
    foreignColumns: [users.id],
    name: 'external_system_integrations_approved_by_fkey'
  }),
}));

// ============================================================================
// ENHANCED CIQ ANALYTICS (v1.2.3)
// ============================================================================

export const eciComponentScores = pgTable('eci_component_scores', {
  componentScoreId: uuid('component_score_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id'),
  classroomId: uuid('classroom_id'),
  teacherId: uuid('teacher_id'),
  calculationDate: date('calculation_date').default(sql`CURRENT_DATE`),
  e1IdentityRecognition: numeric('e1_identity_recognition', { precision: 5, scale: 2 }),
  e2PsychologicalSafety: numeric('e2_psychological_safety', { precision: 5, scale: 2 }),
  e3AccessEquity: numeric('e3_access_equity', { precision: 5, scale: 2 }),
  e4VoiceElevation: numeric('e4_voice_elevation', { precision: 5, scale: 2 }),
  e5Collaboration: numeric('e5_collaboration', { precision: 5, scale: 2 }),
  c6SelfExpression: numeric('c6_self_expression', { precision: 5, scale: 2 }),
  c7Experimentation: numeric('c7_experimentation', { precision: 5, scale: 2 }),
  c8ActiveLearning: numeric('c8_active_learning', { precision: 5, scale: 2 }),
  c9SkillDevelopment: numeric('c9_skill_development', { precision: 5, scale: 2 }),
  c10Imagination: numeric('c10_imagination', { precision: 5, scale: 2 }),
  i11PossibilityMindset: numeric('i11_possibility_mindset', { precision: 5, scale: 2 }),
  i12RealWorldConnections: numeric('i12_real_world_connections', { precision: 5, scale: 2 }),
  i13ChangeMaking: numeric('i13_change_making', { precision: 5, scale: 2 }),
  i14ImpactAssessment: numeric('i14_impact_assessment', { precision: 5, scale: 2 }),
  i15ContinuousImprovement: numeric('i15_continuous_improvement', { precision: 5, scale: 2 }),
  equityAvg: numeric('equity_avg', { precision: 5, scale: 2 }),
  creativityAvg: numeric('creativity_avg', { precision: 5, scale: 2 }),
  innovationAvg: numeric('innovation_avg', { precision: 5, scale: 2 }),
  analyzerConfidence: numeric('analyzer_confidence', { precision: 5, scale: 2 }),
  transcriptQualityScore: numeric('transcript_quality_score', { precision: 5, scale: 2 }),
  analysisDurationMs: integer('analysis_duration_ms'),
  llmModelVersion: varchar('llm_model_version', { length: 50 }),
  analysisPromptsUsed: jsonb('analysis_prompts_used').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index('idx_eci_component_scores_session').on(table.sessionId),
  classroomIdx: index('idx_eci_component_scores_classroom').on(table.classroomId),
  teacherIdx: index('idx_eci_component_scores_teacher').on(table.teacherId),
  calculationDateIdx: index('idx_eci_component_scores_calculation_date').on(table.calculationDate),
  sessionIdFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [audioSessions.id],
    name: 'eci_component_scores_session_id_fkey'
  }),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'eci_component_scores_classroom_id_fkey'
  }),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [teacherProfiles.userId],
    name: 'eci_component_scores_teacher_id_fkey'
  }),
}));

export const ciqAdaptiveWeights = pgTable('ciq_adaptive_weights', {
  weightConfigId: uuid('weight_config_id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id'),
  teacherId: uuid('teacher_id'),
  effectiveStartDate: date('effective_start_date').default(sql`CURRENT_DATE`),
  effectiveEndDate: date('effective_end_date'),
  isActive: boolean('is_active').default(true),
  sisLmsWeight: numeric('sis_lms_weight', { precision: 5, scale: 2 }).default('50.00'),
  surveyWeight: numeric('survey_weight', { precision: 5, scale: 2 }).default('20.00'),
  eciBlueprintWeight: numeric('eci_blueprint_weight', { precision: 5, scale: 2 }).default('30.00'),
  equityComponentWeight: numeric('equity_component_weight', { precision: 5, scale: 2 }).default('33.33'),
  creativityComponentWeight: numeric('creativity_component_weight', { precision: 5, scale: 2 }).default('33.33'),
  innovationComponentWeight: numeric('innovation_component_weight', { precision: 5, scale: 2 }).default('33.34'),
  eciElementWeights: jsonb('eci_element_weights').default({}),
  teacherGoals: jsonb('teacher_goals').default({}),
  classroomContext: jsonb('classroom_context').default({}),
  customizationReason: text('customization_reason'),
  configuredBy: uuid('configured_by'),
  approvedBy: uuid('approved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  classroomIdx: index('idx_ciq_adaptive_weights_classroom').on(table.classroomId),
  teacherIdx: index('idx_ciq_adaptive_weights_teacher').on(table.teacherId),
  activeIdx: index('idx_ciq_adaptive_weights_active').on(table.isActive),
  classroomIdFk: foreignKey({
    columns: [table.classroomId],
    foreignColumns: [classrooms.classroomId],
    name: 'ciq_adaptive_weights_classroom_id_fkey'
  }),
  teacherIdFk: foreignKey({
    columns: [table.teacherId],
    foreignColumns: [teacherProfiles.userId],
    name: 'ciq_adaptive_weights_teacher_id_fkey'
  }),
  configuredByFk: foreignKey({
    columns: [table.configuredBy],
    foreignColumns: [users.id],
    name: 'ciq_adaptive_weights_configured_by_fkey'
  }),
  approvedByFk: foreignKey({
    columns: [table.approvedBy],
    foreignColumns: [users.id],
    name: 'ciq_adaptive_weights_approved_by_fkey'
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Student Management Types
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Classroom = typeof classrooms.$inferSelect;
export type NewClassroom = typeof classrooms.$inferInsert;
export type ClassroomEnrollment = typeof classroomEnrollments.$inferSelect;
export type NewClassroomEnrollment = typeof classroomEnrollments.$inferInsert;
export type StudentAcademicRecord = typeof studentAcademicRecords.$inferSelect;
export type NewStudentAcademicRecord = typeof studentAcademicRecords.$inferInsert;
export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type NewStudentAttendance = typeof studentAttendance.$inferInsert;
export type StudentBehaviorRecord = typeof studentBehaviorRecords.$inferSelect;
export type NewStudentBehaviorRecord = typeof studentBehaviorRecords.$inferInsert;

// Survey Infrastructure Types
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof surveyQuestions.$inferInsert;
export type SurveyAssignment = typeof surveyAssignments.$inferSelect;
export type NewSurveyAssignment = typeof surveyAssignments.$inferInsert;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
export type QuestionResponse = typeof questionResponses.$inferSelect;
export type NewQuestionResponse = typeof questionResponses.$inferInsert;

// Integration Types
export type ExternalSystemIntegration = typeof externalSystemIntegrations.$inferSelect;
export type NewExternalSystemIntegration = typeof externalSystemIntegrations.$inferInsert;

// Enhanced Analytics Types
export type EciComponentScore = typeof eciComponentScores.$inferSelect;
export type NewEciComponentScore = typeof eciComponentScores.$inferInsert;
export type CiqAdaptiveWeight = typeof ciqAdaptiveWeights.$inferSelect;
export type NewCiqAdaptiveWeight = typeof ciqAdaptiveWeights.$inferInsert;