# ANDI AI Orchestration Architecture

## Overview

This document outlines the custom TypeScript-based AI orchestration system that replaces Langflow for ANDI's classroom analysis pipeline. The system provides direct integration between Assembly AI, Ollama models, and the PostgreSQL database.

## Architecture Components

### 1. Core Pipeline Flow

```
Audio Recording → Assembly AI → Transcript → Ollama Analysis → Database Storage → UI Updates
```

### 2. Service Architecture

```typescript
// Core Services
interface AIOrchestrationService {
  transcription: AssemblyAIService
  analysis: OllamaAnalysisService
  storage: DatabaseService
  queue: JobQueueService
  realtime: WebSocketService
}
```

## Service Definitions

### Assembly AI Service

```typescript
interface AssemblyAIService {
  uploadAudio(audioFile: File): Promise<string> // Returns upload_url
  startTranscription(uploadUrl: string, options: TranscriptionOptions): Promise<string> // Returns transcript_id
  getTranscript(transcriptId: string): Promise<TranscriptResult>
  pollTranscriptionStatus(transcriptId: string): Promise<TranscriptionStatus>
}

interface TranscriptionOptions {
  speaker_labels: true
  auto_chapters: false
  auto_highlights: false
  sentiment_analysis: true
  entity_detection: false
  language_detection: false
  webhook_url?: string
}

interface TranscriptResult {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text: string
  utterances: Array<{
    confidence: number
    end: number
    speaker: string
    start: number
    text: string
    words: Array<{
      confidence: number
      end: number
      speaker: string
      start: number
      text: string
    }>
  }>
  sentiment_analysis_results?: Array<{
    text: string
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
    confidence: number
    start: number
    end: number
  }>
}
```

### Ollama Analysis Service

```typescript
interface OllamaAnalysisService {
  analyzeTranscript(transcript: TranscriptResult): Promise<CIQAnalysisResult>
  generateCoaching(analysis: CIQAnalysisResult, transcript: TranscriptResult): Promise<CoachingResult>
  analyzeRealtime(transcriptSegment: string): Promise<RealtimeInsight>
}

interface CIQAnalysisResult {
  sessionId: string
  overallScore: number
  components: {
    equity: ECIComponentScores // E1-E5
    creativity: ECIComponentScores // C6-C10
    innovation: ECIComponentScores // I11-I15
  }
  participationMetrics: {
    teacherTalkPercentage: number
    studentTalkPercentage: number
    studentQuestionCount: number
    teacherQuestionCount: number
    bloomTaxonomyLevels: Record<string, number>
  }
  sentimentAnalysis: {
    overallSentiment: 'positive' | 'neutral' | 'negative'
    sentimentBreakdown: {
      positive: number
      neutral: number
      negative: number
    }
    engagementScore: number
  }
  evidenceExamples: Array<{
    component: string
    quote: string
    timestamp: number
    speaker: string
    impact: 'positive' | 'neutral' | 'needs_improvement'
  }>
}

interface ECIComponentScores {
  [componentId: string]: {
    score: number // 0-10
    evidence: string[]
    strengths: string[]
    opportunities: string[]
    recommendations: string[]
  }
}

interface CoachingResult {
  strengths: Array<{
    area: string
    evidence: string
    impact: string
  }>
  growthOpportunities: Array<{
    area: string
    currentState: string
    recommendedAction: string
    implementationSteps: string[]
    successIndicators: string[]
    timeline: string
  }>
  personalizedRecommendations: Array<{
    recommendation: string
    rationale: string
    researchBasis: string
    implementationSteps: string[]
    successIndicators: string[]
  }>
  celebrationPoints: string[]
}

interface RealtimeInsight {
  quickInsight: string
  pattern: string
  suggestion: string
  successIndicator: string
}
```

### Job Queue Service

```typescript
interface JobQueueService {
  addTranscriptionJob(audioSessionId: string, audioUrl: string): Promise<string>
  addAnalysisJob(transcriptId: string, sessionId: string): Promise<string>
  addCoachingJob(analysisId: string, sessionId: string): Promise<string>
  getJobStatus(jobId: string): Promise<JobStatus>
  onJobComplete(jobId: string, callback: (result: any) => void): void
}

interface JobStatus {
  id: string
  type: 'transcription' | 'analysis' | 'coaching'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  result?: any
  error?: string
  createdAt: Date
  updatedAt: Date
}

// Job Types
interface TranscriptionJob {
  sessionId: string
  audioUrl: string
  options: TranscriptionOptions
}

interface AnalysisJob {
  transcriptId: string
  sessionId: string
  transcript: TranscriptResult
}

interface CoachingJob {
  analysisId: string
  sessionId: string
  analysis: CIQAnalysisResult
  transcript: TranscriptResult
}
```

### WebSocket Service

```typescript
interface WebSocketService {
  broadcastJobProgress(sessionId: string, progress: JobProgressUpdate): void
  broadcastAnalysisComplete(sessionId: string, result: CIQAnalysisResult): void
  broadcastCoachingComplete(sessionId: string, result: CoachingResult): void
  broadcastRealtimeInsight(sessionId: string, insight: RealtimeInsight): void
}

interface JobProgressUpdate {
  jobId: string
  type: 'transcription' | 'analysis' | 'coaching'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
}
```

## API Route Structure

### `/api/audio/upload`
- **Method**: POST
- **Purpose**: Upload audio file and start transcription
- **Flow**:
  1. Validate audio file
  2. Upload to Assembly AI
  3. Create transcription job
  4. Return job ID and session ID

### `/api/audio/analyze`
- **Method**: POST  
- **Purpose**: Start CIQ analysis for completed transcript
- **Flow**:
  1. Retrieve transcript from Assembly AI
  2. Create analysis job for Ollama
  3. Queue parallel analysis of all 15 ECI components
  4. Return analysis job ID

### `/api/coaching/generate`
- **Method**: POST
- **Purpose**: Generate coaching recommendations
- **Flow**:
  1. Retrieve analysis results
  2. Create coaching job for Ollama
  3. Generate evidence-based recommendations
  4. Return coaching job ID

### `/api/realtime/analyze`
- **Method**: POST
- **Purpose**: Quick analysis of live transcript segments
- **Flow**:
  1. Accept transcript segment
  2. Send to andi-realtime model
  3. Return immediate insights

### `/api/jobs/[jobId]/status`
- **Method**: GET
- **Purpose**: Get job status and progress
- **Returns**: JobStatus object

## Database Integration

### New Tables for AI Orchestration

```sql
-- Job tracking
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES recording_sessions(session_id),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  external_id VARCHAR(255), -- Assembly AI transcript_id, etc.
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Real-time insights for live analysis
CREATE TABLE realtime_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES recording_sessions(session_id),
  insight_type VARCHAR(100) NOT NULL,
  content JSONB NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced session metadata
ALTER TABLE recording_sessions ADD COLUMN 
  transcription_job_id UUID,
  analysis_job_id UUID,
  coaching_job_id UUID,
  assembly_ai_transcript_id VARCHAR(255);
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. **Assembly AI Service** - Direct API integration
2. **Ollama Service** - HTTP client for local models
3. **Job Queue** - Bull/BullMQ with Redis backend
4. **Database Service** - Direct SQL integration with TypeScript types

### Phase 2: API Routes
1. **Audio upload endpoint** - File handling + Assembly AI
2. **Analysis endpoint** - Ollama integration
3. **Job status endpoints** - Progress tracking
4. **WebSocket setup** - Real-time updates

### Phase 3: Advanced Features
1. **Coaching generation** - Evidence-based recommendations
2. **Real-time analysis** - Live transcript processing
3. **Progress tracking** - Detailed job monitoring
4. **Error handling** - Retry logic and fallbacks

## Configuration

### Environment Variables
```env
# Assembly AI
ASSEMBLY_AI_API_KEY=your_api_key
ASSEMBLY_AI_WEBHOOK_URL=https://yourapp.com/api/webhooks/assembly-ai

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CIQ_MODEL=andi-ciq-analyzer
OLLAMA_COACH_MODEL=andi-coach
OLLAMA_REALTIME_MODEL=andi-realtime

# Queue
REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=3

# WebSocket
WEBSOCKET_PORT=3001
```

### Dependencies to Add
```json
{
  "dependencies": {
    "bullmq": "^4.15.0",
    "ioredis": "^5.3.2",
    "ws": "^8.14.2",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.8"
  }
}
```

## Error Handling Strategy

### Retry Logic
- **Assembly AI**: 3 retries with exponential backoff
- **Ollama**: 2 retries with 5-second delay
- **Database**: 3 retries with immediate retry

### Fallback Strategies
- **Ollama Timeout**: Fall back to cloud LLM APIs
- **Assembly AI Failure**: Allow manual transcript upload
- **Queue Failure**: Direct processing mode

### Monitoring
- **Job Queue Health**: Monitor Redis connection and queue depth
- **Model Availability**: Check Ollama service health
- **API Rate Limits**: Track Assembly AI usage

## Performance Optimizations

### Parallel Processing
- **ECI Components**: Analyze all 15 components in parallel
- **Batch Operations**: Group database operations
- **Caching**: Cache frequently accessed transcripts

### Resource Management
- **Queue Workers**: Scale based on load
- **Memory Management**: Stream large audio files
- **Connection Pooling**: Reuse HTTP connections

This architecture provides a robust, scalable foundation for ANDI's AI orchestration needs while maintaining the simplicity and performance benefits of a custom solution.