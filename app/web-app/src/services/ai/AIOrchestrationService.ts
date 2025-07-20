import { AssemblyAIService, TranscriptionOptions } from './AssemblyAIService';
import { OllamaService } from './OllamaService';
import { JobQueueService, JobStatus } from './JobQueueService';
import { webSocketService } from './WebSocketService';

export interface AIOrchestrationConfig {
  assemblyAI: {
    apiKey: string;
    webhookUrl?: string;
  };
  ollama: {
    baseUrl?: string;
    models?: {
      ciqAnalyzer?: string;
      coach?: string;
      realtime?: string;
    };
  };
  redis: {
    url: string;
  };
}

export interface AnalysisSession {
  sessionId: string;
  userId: string;
  transcriptionJobId?: string;
  analysisJobId?: string;
  coachingJobId?: string;
  status: 'pending' | 'transcribing' | 'analyzing' | 'coaching' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AIOrchestrationService {
  private assemblyAI: AssemblyAIService;
  private ollama: OllamaService;
  private jobQueue: JobQueueService;
  private activeSessions = new Map<string, AnalysisSession>();

  constructor(config: AIOrchestrationConfig) {
    this.assemblyAI = new AssemblyAIService(config.assemblyAI.apiKey);
    this.ollama = new OllamaService(config.ollama.baseUrl, config.ollama.models);
    this.jobQueue = new JobQueueService(
      config.redis.url,
      this.assemblyAI,
      this.ollama
    );

    this.setupJobCallbacks();
  }

  /**
   * Start complete analysis pipeline for audio recording
   */
  async startAnalysisPipeline(
    sessionId: string,
    userId: string,
    audioPath: string,
    filename: string,
    options?: {
      transcriptionOptions?: Partial<TranscriptionOptions>;
      skipCoaching?: boolean;
    }
  ): Promise<AnalysisSession> {
    // Initialize session
    const now = new Date();
    const session: AnalysisSession = {
      sessionId,
      userId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing analysis pipeline...',
      createdAt: now,
      updatedAt: now,
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Step 1: Start transcription
      session.status = 'transcribing';
      session.currentStep = 'Starting transcription...';
      session.progress = 5;

      const transcriptionJobId = await this.jobQueue.addTranscriptionJob(
        sessionId,
        audioPath,
        filename,
        options?.transcriptionOptions
      );

      session.transcriptionJobId = transcriptionJobId;
      session.currentStep = 'Audio transcription in progress...';
      session.progress = 10;
      session.updatedAt = new Date();

      this.activeSessions.set(sessionId, session);
      
      // Emit progress via WebSocket
      webSocketService.emitSessionProgress(session);
      
      return session;

    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      this.activeSessions.set(sessionId, session);
      throw error;
    }
  }

  /**
   * Start analysis for existing transcript
   */
  async startAnalysisFromTranscript(
    sessionId: string,
    userId: string,
    transcriptId: string,
    skipCoaching: boolean = false
  ): Promise<AnalysisSession> {
    const now = new Date();
    const session: AnalysisSession = {
      sessionId,
      userId,
      status: 'analyzing',
      progress: 50,
      currentStep: 'Retrieving transcript...',
      createdAt: now,
      updatedAt: now,
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Get transcript from Assembly AI
      const transcript = await this.assemblyAI.getTranscript(transcriptId);

      // Start analysis
      const analysisJobId = await this.jobQueue.addAnalysisJob(
        sessionId,
        transcriptId,
        transcript
      );

      session.analysisJobId = analysisJobId;
      session.currentStep = 'CIQ analysis in progress...';
      session.progress = 60;
      session.updatedAt = new Date();

      this.activeSessions.set(sessionId, session);
      
      // Emit progress via WebSocket
      webSocketService.emitSessionProgress(session);
      
      return session;

    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      this.activeSessions.set(sessionId, session);
      throw error;
    }
  }

  /**
   * Get real-time analysis for transcript segment
   */
  async getRealtimeInsight(transcriptSegment: string) {
    return this.ollama.analyzeRealtime(transcriptSegment);
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): AnalysisSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): AnalysisSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    return this.jobQueue.getJobStatus(jobId);
  }

  /**
   * Cancel analysis session
   */
  cancelSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    // Note: BullMQ jobs will continue but won't update the session
  }

  /**
   * Register for session progress updates
   */
  onSessionProgress(callback: (session: AnalysisSession) => void): void {
    this.jobQueue.onProgress(({ jobId, progress, message }) => {
      // Find session with this job ID
      for (const session of this.activeSessions.values()) {
        if (session.transcriptionJobId === jobId ||
            session.analysisJobId === jobId ||
            session.coachingJobId === jobId) {
          
          session.progress = this.calculateOverallProgress(session, progress);
          session.currentStep = message;
          session.updatedAt = new Date();
          this.activeSessions.set(session.sessionId, session);
          
          // Emit progress via WebSocket
          webSocketService.emitSessionProgress(session);
          
          callback(session);
          break;
        }
      }
    });
  }

  /**
   * Register for session completion
   */
  onSessionComplete(callback: (sessionId: string, result: any) => void): void {
    this.jobQueue.onComplete(({ jobId, type, result }) => {
      // Find session with this job ID
      for (const session of this.activeSessions.values()) {
        if (session.transcriptionJobId === jobId ||
            session.analysisJobId === jobId ||
            session.coachingJobId === jobId) {
          
          this.handleJobComplete(session, type, result, callback);
          break;
        }
      }
    });
  }

  /**
   * Register for session errors
   */
  onSessionError(callback: (sessionId: string, error: string) => void): void {
    this.jobQueue.onError(({ jobId, error }) => {
      // Find session with this job ID
      for (const session of this.activeSessions.values()) {
        if (session.transcriptionJobId === jobId ||
            session.analysisJobId === jobId ||
            session.coachingJobId === jobId) {
          
          session.status = 'failed';
          session.error = error;
          session.updatedAt = new Date();
          this.activeSessions.set(session.sessionId, session);
          
          // Emit error via WebSocket
          webSocketService.emitSessionError(session.sessionId, session.userId, error);
          
          callback(session.sessionId, error);
          break;
        }
      }
    });
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    assemblyAI: boolean;
    ollama: boolean;
    queue: boolean;
  }> {
    const [ollamaHealth, queueHealth] = await Promise.all([
      this.ollama.healthCheck().catch(() => false),
      this.jobQueue.getQueueHealth().then(() => true).catch(() => false),
    ]);

    return {
      assemblyAI: true, // Assembly AI doesn't have a health endpoint
      ollama: ollamaHealth,
      queue: queueHealth,
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.activeSessions.clear();
    await this.jobQueue.close();
  }

  // Private methods

  private setupJobCallbacks(): void {
    // These are handled by the public callback registration methods
    // but we need to set up the internal flow
  }

  private async handleJobComplete(
    session: AnalysisSession,
    jobType: string,
    result: any,
    callback: (sessionId: string, result: any) => void
  ): Promise<void> {
    try {
      if (jobType === 'transcription') {
        // Transcription completed, start analysis
        session.status = 'analyzing';
        session.currentStep = 'Starting CIQ analysis...';
        session.progress = 40;
        session.updatedAt = new Date();

        const analysisJobId = await this.jobQueue.addAnalysisJob(
          session.sessionId,
          result.transcriptId,
          result.transcript
        );

        session.analysisJobId = analysisJobId;
        this.activeSessions.set(session.sessionId, session);
        
        // Emit progress via WebSocket
        webSocketService.emitSessionProgress(session);

      } else if (jobType === 'analysis') {
        // Analysis completed, start coaching
        session.status = 'coaching';
        session.currentStep = 'Generating coaching recommendations...';
        session.progress = 80;
        session.updatedAt = new Date();

        const coachingJobId = await this.jobQueue.addCoachingJob(
          session.sessionId,
          'analysis-' + session.sessionId,
          result.analysis,
          result.transcript || await this.getTranscriptForSession(session)
        );

        session.coachingJobId = coachingJobId;
        this.activeSessions.set(session.sessionId, session);
        
        // Emit progress via WebSocket
        webSocketService.emitSessionProgress(session);

      } else if (jobType === 'coaching') {
        // All jobs completed
        session.status = 'completed';
        session.currentStep = 'Analysis complete';
        session.progress = 100;
        session.updatedAt = new Date();
        this.activeSessions.set(session.sessionId, session);
        
        // Emit completion via WebSocket
        webSocketService.emitSessionComplete(session.sessionId, session.userId, result);
        
        callback(session.sessionId, result);
      }
    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      session.updatedAt = new Date();
      this.activeSessions.set(session.sessionId, session);
      
      // Emit error via WebSocket
      webSocketService.emitSessionError(session.sessionId, session.userId, session.error);
    }
  }

  private calculateOverallProgress(session: AnalysisSession, jobProgress: number): number {
    // Calculate overall progress based on current stage
    if (session.status === 'transcribing') {
      return Math.max(session.progress, 10 + (jobProgress * 0.3)); // 10-40%
    } else if (session.status === 'analyzing') {
      return Math.max(session.progress, 40 + (jobProgress * 0.4)); // 40-80%
    } else if (session.status === 'coaching') {
      return Math.max(session.progress, 80 + (jobProgress * 0.2)); // 80-100%
    }
    return session.progress;
  }

  private async getTranscriptForSession(session: AnalysisSession): Promise<any> {
    // This would need to be implemented based on how you store transcripts
    // For now, return null and handle in the calling code
    return null;
  }
}