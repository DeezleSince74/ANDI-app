// Core AI Services
export { AssemblyAIService } from './AssemblyAIService';
export { OllamaService } from './OllamaService';
export { JobQueueService } from './JobQueueService';
export { AIOrchestrationService } from './AIOrchestrationService';

// Types for Assembly AI
export type {
  TranscriptionOptions,
  TranscriptWord,
  TranscriptUtterance,
  SentimentResult,
  TranscriptResult,
  TranscriptionStatus,
} from './AssemblyAIService';

// Types for Ollama
export type {
  ECIComponentScore,
  ECIComponentScores,
  ParticipationMetrics,
  SentimentAnalysis,
  EvidenceExample,
  CIQAnalysisResult,
  StrengthArea,
  GrowthOpportunity,
  PersonalizedRecommendation,
  CoachingResult,
  RealtimeInsight,
  OllamaModelConfig,
  OllamaResponse,
} from './OllamaService';

// Types for Job Queue
export type {
  JobStatus,
  TranscriptionJobData,
  AnalysisJobData,
  CoachingJobData,
  JobData,
  JobProgressCallback,
  JobCompleteCallback,
  JobErrorCallback,
} from './JobQueueService';

// Types for AI Orchestration
export type {
  AIOrchestrationConfig,
  AnalysisSession,
} from './AIOrchestrationService';