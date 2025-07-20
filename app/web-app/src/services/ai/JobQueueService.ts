import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { AssemblyAIService, TranscriptResult, TranscriptionOptions } from './AssemblyAIService';
import { OllamaService, CIQAnalysisResult, CoachingResult } from './OllamaService';

export interface JobStatus {
  id: string;
  type: 'transcription' | 'analysis' | 'coaching';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionJobData {
  sessionId: string;
  audioPath: string;
  filename: string;
  options?: Partial<TranscriptionOptions>;
}

export interface AnalysisJobData {
  sessionId: string;
  transcriptId: string;
  transcript: TranscriptResult;
}

export interface CoachingJobData {
  sessionId: string;
  analysisId: string;
  analysis: CIQAnalysisResult;
  transcript: TranscriptResult;
}

export type JobData = TranscriptionJobData | AnalysisJobData | CoachingJobData;

export interface JobProgressCallback {
  (progress: { jobId: string; progress: number; message: string }): void;
}

export interface JobCompleteCallback {
  (result: { jobId: string; type: string; result: any }): void;
}

export interface JobErrorCallback {
  (error: { jobId: string; type: string; error: string }): void;
}

export class JobQueueService {
  private redis: Redis;
  private transcriptionQueue: Queue;
  private analysisQueue: Queue;
  private coachingQueue: Queue;
  private assemblyAI: AssemblyAIService;
  private ollama: OllamaService;
  
  private progressCallbacks: Set<JobProgressCallback> = new Set();
  private completeCallbacks: Set<JobCompleteCallback> = new Set();
  private errorCallbacks: Set<JobErrorCallback> = new Set();

  constructor(
    redisUrl: string,
    assemblyAI: AssemblyAIService,
    ollama: OllamaService
  ) {
    this.redis = new Redis(redisUrl);
    this.assemblyAI = assemblyAI;
    this.ollama = ollama;

    // Initialize queues
    this.transcriptionQueue = new Queue('transcription', { connection: this.redis });
    this.analysisQueue = new Queue('analysis', { connection: this.redis });
    this.coachingQueue = new Queue('coaching', { connection: this.redis });

    // Initialize workers
    this.initializeWorkers();
  }

  /**
   * Add transcription job
   */
  async addTranscriptionJob(
    sessionId: string,
    audioPath: string,
    filename: string,
    options?: Partial<TranscriptionOptions>
  ): Promise<string> {
    const job = await this.transcriptionQueue.add(
      'transcribe',
      {
        sessionId,
        audioPath,
        filename,
        options,
      } as TranscriptionJobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return job.id!;
  }

  /**
   * Add analysis job
   */
  async addAnalysisJob(
    sessionId: string,
    transcriptId: string,
    transcript: TranscriptResult
  ): Promise<string> {
    const job = await this.analysisQueue.add(
      'analyze',
      {
        sessionId,
        transcriptId,
        transcript,
      } as AnalysisJobData,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      }
    );

    return job.id!;
  }

  /**
   * Add coaching job
   */
  async addCoachingJob(
    sessionId: string,
    analysisId: string,
    analysis: CIQAnalysisResult,
    transcript: TranscriptResult
  ): Promise<string> {
    const job = await this.coachingQueue.add(
      'coach',
      {
        sessionId,
        analysisId,
        analysis,
        transcript,
      } as CoachingJobData,
      {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      }
    );

    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    // Try to find job in all queues
    const queues = [this.transcriptionQueue, this.analysisQueue, this.coachingQueue];
    const types = ['transcription', 'analysis', 'coaching'];

    for (let i = 0; i < queues.length; i++) {
      const job = await queues[i].getJob(jobId);
      if (job) {
        return {
          id: job.id!,
          type: types[i] as any,
          status: this.mapJobState(job),
          progress: job.progress as number || 0,
          result: job.returnvalue,
          error: job.failedReason,
          createdAt: new Date(job.timestamp),
          updatedAt: new Date(job.processedOn || job.timestamp),
        };
      }
    }

    return null;
  }

  /**
   * Register progress callback
   */
  onProgress(callback: JobProgressCallback): void {
    this.progressCallbacks.add(callback);
  }

  /**
   * Register completion callback
   */
  onComplete(callback: JobCompleteCallback): void {
    this.completeCallbacks.add(callback);
  }

  /**
   * Register error callback
   */
  onError(callback: JobErrorCallback): void {
    this.errorCallbacks.add(callback);
  }

  /**
   * Remove callback
   */
  removeCallback(callback: JobProgressCallback | JobCompleteCallback | JobErrorCallback): void {
    this.progressCallbacks.delete(callback as JobProgressCallback);
    this.completeCallbacks.delete(callback as JobCompleteCallback);
    this.errorCallbacks.delete(callback as JobErrorCallback);
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<{
    transcription: { waiting: number; active: number; completed: number; failed: number };
    analysis: { waiting: number; active: number; completed: number; failed: number };
    coaching: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const [transcriptionCounts, analysisCounts, coachingCounts] = await Promise.all([
      this.transcriptionQueue.getJobCounts(),
      this.analysisQueue.getJobCounts(),
      this.coachingQueue.getJobCounts(),
    ]);

    return {
      transcription: transcriptionCounts,
      analysis: analysisCounts,
      coaching: coachingCounts,
    };
  }

  /**
   * Clean completed jobs older than specified time
   */
  async cleanOldJobs(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const queues = [this.transcriptionQueue, this.analysisQueue, this.coachingQueue];
    
    await Promise.all(
      queues.map(queue => 
        queue.clean(maxAge, 10, 'completed').catch(console.error)
      )
    );
  }

  /**
   * Gracefully close all connections
   */
  async close(): Promise<void> {
    await Promise.all([
      this.transcriptionQueue.close(),
      this.analysisQueue.close(),
      this.coachingQueue.close(),
      this.redis.disconnect(),
    ]);
  }

  // Private methods

  private initializeWorkers(): void {
    // Transcription worker
    new Worker(
      'transcription',
      async (job: Job<TranscriptionJobData>) => {
        const { sessionId, audioPath, filename, options } = job.data;
        
        try {
          // Update progress
          await job.updateProgress(10);
          this.notifyProgress(job.id!, 10, 'Uploading audio file...');

          // Read audio file and upload
          const fs = await import('fs/promises');
          const audioBuffer = await fs.readFile(audioPath);
          
          await job.updateProgress(30);
          this.notifyProgress(job.id!, 30, 'Uploading to Assembly AI...');

          const uploadUrl = await this.assemblyAI.uploadAudio(audioBuffer, filename);
          
          await job.updateProgress(50);
          this.notifyProgress(job.id!, 50, 'Starting transcription...');

          const transcriptId = await this.assemblyAI.startTranscription(uploadUrl, options);
          
          await job.updateProgress(70);
          this.notifyProgress(job.id!, 70, 'Transcription in progress...');

          // Poll for completion
          const transcript = await this.assemblyAI.pollTranscriptionStatus(transcriptId);
          
          await job.updateProgress(100);
          this.notifyProgress(job.id!, 100, 'Transcription completed');

          const result = { sessionId, transcriptId, transcript };
          this.notifyComplete(job.id!, 'transcription', result);
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.notifyError(job.id!, 'transcription', errorMessage);
          throw error;
        }
      },
      { connection: this.redis, concurrency: 2 }
    );

    // Analysis worker
    new Worker(
      'analysis',
      async (job: Job<AnalysisJobData>) => {
        const { sessionId, transcript } = job.data;
        
        try {
          await job.updateProgress(20);
          this.notifyProgress(job.id!, 20, 'Starting CIQ analysis...');

          const analysis = await this.ollama.analyzeTranscript(transcript, sessionId);
          
          await job.updateProgress(100);
          this.notifyProgress(job.id!, 100, 'CIQ analysis completed');

          const result = { sessionId, analysis };
          this.notifyComplete(job.id!, 'analysis', result);
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.notifyError(job.id!, 'analysis', errorMessage);
          throw error;
        }
      },
      { connection: this.redis, concurrency: 1 }
    );

    // Coaching worker
    new Worker(
      'coaching',
      async (job: Job<CoachingJobData>) => {
        const { sessionId, analysis, transcript } = job.data;
        
        try {
          await job.updateProgress(30);
          this.notifyProgress(job.id!, 30, 'Generating coaching recommendations...');

          const coaching = await this.ollama.generateCoaching(analysis, transcript);
          
          await job.updateProgress(100);
          this.notifyProgress(job.id!, 100, 'Coaching recommendations completed');

          const result = { sessionId, coaching };
          this.notifyComplete(job.id!, 'coaching', result);
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.notifyError(job.id!, 'coaching', errorMessage);
          throw error;
        }
      },
      { connection: this.redis, concurrency: 1 }
    );
  }

  private mapJobState(job: Job): JobStatus['status'] {
    if (job.isCompleted()) return 'completed';
    if (job.isFailed()) return 'failed';
    if (job.isActive()) return 'processing';
    return 'pending';
  }

  private notifyProgress(jobId: string, progress: number, message: string): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ jobId, progress, message });
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  private notifyComplete(jobId: string, type: string, result: any): void {
    this.completeCallbacks.forEach(callback => {
      try {
        callback({ jobId, type, result });
      } catch (error) {
        console.error('Complete callback error:', error);
      }
    });
  }

  private notifyError(jobId: string, type: string, error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback({ jobId, type, error });
      } catch (error) {
        console.error('Error callback error:', error);
      }
    });
  }
}