// Export all schemas and types
export * from './auth';
export * from './core';
export * from './audio';
export * from './analytics';
export * from './community';
export * from './gamification';
export * from './resources';
export * from './ciq';

// Re-export commonly used types for convenience
export type {
  User,
  NewUser,
} from './auth';

export type {
  TeacherProfile,
  NewTeacherProfile,
  CoachProfile,
  NewCoachProfile,
} from './core';

export type {
  AudioSession,
  NewAudioSession,
  Recommendation,
  NewRecommendation,
  ClassroomActivity,
  NewClassroomActivity,
  Notification,
  NewNotification,
} from './audio';

export type {
  CiqMetric,
  NewCiqMetric,
} from './analytics';

export type {
  ForumQuestion,
  NewForumQuestion,
} from './community';

export type {
  Achievement,
  NewAchievement,
} from './gamification';

export type {
  Resource,
  NewResource,
} from './resources';

export type {
  Student,
  NewStudent,
  Classroom,
  NewClassroom,
  ClassroomEnrollment,
  NewClassroomEnrollment,
  StudentAcademicRecord,
  NewStudentAcademicRecord,
  StudentAttendance,
  NewStudentAttendance,
  StudentBehaviorRecord,
  NewStudentBehaviorRecord,
  Survey,
  NewSurvey,
  SurveyQuestion,
  NewSurveyQuestion,
  SurveyResponse,
  NewSurveyResponse,
  EciComponentScore,
  NewEciComponentScore,
  CiqAdaptiveWeight,
  NewCiqAdaptiveWeight,
  ExternalSystemIntegration,
  NewExternalSystemIntegration,
} from './ciq';

export type {
  TeacherGoal,
  NewTeacherGoal,
} from './core';

export type {
  CiqAnalysisResult,
  CiqScores,
  PerformanceTrends,
  Report,
  NewReport,
} from './analytics';

export type {
  CommunityStats,
  PopularQuestion,
  ForumQuestionWithAuthor,
  ForumAnswerWithAuthor,
} from './community';

export type {
  UserProgress,
  AchievementProgress,
  TriviaStats,
  Leaderboard,
} from './gamification';

export type {
  ResourceWithInteractions,
  PopularResource,
  ResourceFilters,
} from './resources';

// Schema collections for easier imports
export const authTables = {
  users: import('./auth').then(m => m.users),
  passwordResetTokens: import('./auth').then(m => m.passwordResetTokens),
};

export const coreTables = {
  districts: import('./core').then(m => m.districts),
  schools: import('./core').then(m => m.schools),
  teacherProfiles: import('./core').then(m => m.teacherProfiles),
  coachProfiles: import('./core').then(m => m.coachProfiles),
  coachTeacherAssignments: import('./core').then(m => m.coachTeacherAssignments),
  teacherGoals: import('./core').then(m => m.teacherGoals),
  goalProgressLogs: import('./core').then(m => m.goalProgressLogs),
};

export const audioTables = {
  audioSessions: import('./audio').then(m => m.audioSessions),
  audioUploads: import('./audio').then(m => m.audioUploads),
  keyMoments: import('./audio').then(m => m.keyMoments),
  recommendations: import('./audio').then(m => m.recommendations),
  classroomActivities: import('./audio').then(m => m.classroomActivities),
  conversations: import('./audio').then(m => m.conversations),
  notifications: import('./audio').then(m => m.notifications),
};

export const analyticsTables = {
  ciqMetrics: import('./analytics').then(m => m.ciqMetrics),
  teacherPerformanceSummary: import('./analytics').then(m => m.teacherPerformanceSummary),
  reports: import('./analytics').then(m => m.reports),
};

export const communityTables = {
  forumQuestions: import('./community').then(m => m.forumQuestions),
  forumAnswers: import('./community').then(m => m.forumAnswers),
  forumVotes: import('./community').then(m => m.forumVotes),
  forumBookmarks: import('./community').then(m => m.forumBookmarks),
};

export const gamificationTables = {
  achievements: import('./gamification').then(m => m.achievements),
  userAchievements: import('./gamification').then(m => m.userAchievements),
  triviaQuestions: import('./gamification').then(m => m.triviaQuestions),
  userTriviaResponses: import('./gamification').then(m => m.userTriviaResponses),
};

export const resourceTables = {
  resources: import('./resources').then(m => m.resources),
  resourceInteractions: import('./resources').then(m => m.resourceInteractions),
};

export const ciqTables = {
  students: import('./ciq').then(m => m.students),
  classrooms: import('./ciq').then(m => m.classrooms),
  classroomEnrollments: import('./ciq').then(m => m.classroomEnrollments),
  studentAcademicRecords: import('./ciq').then(m => m.studentAcademicRecords),
  studentAttendance: import('./ciq').then(m => m.studentAttendance),
  studentBehaviorRecords: import('./ciq').then(m => m.studentBehaviorRecords),
  surveys: import('./ciq').then(m => m.surveys),
  surveyQuestions: import('./ciq').then(m => m.surveyQuestions),
  surveyAssignments: import('./ciq').then(m => m.surveyAssignments),
  surveyResponses: import('./ciq').then(m => m.surveyResponses),
  questionResponses: import('./ciq').then(m => m.questionResponses),
  externalSystemIntegrations: import('./ciq').then(m => m.externalSystemIntegrations),
  eciComponentScores: import('./ciq').then(m => m.eciComponentScores),
  ciqAdaptiveWeights: import('./ciq').then(m => m.ciqAdaptiveWeights),
};