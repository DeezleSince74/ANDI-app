/**
 * Robust Recording Processing Queue with BullMQ + Redis
 * Replaces ad-hoc processing with resilient background jobs
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { AssemblyAIService } from '~/services/ai/AssemblyAIService';
import { OllamaService } from '~/services/ai/OllamaService';
import { updateRecording, createAIJob, updateAIJob } from '~/db/repositories/recordings';

// Job Data Types
export interface TranscriptionJobData {
  sessionId: string;
  audioUrl: string;
  userId: string;
  fileName: string;
}

export interface AnalysisJobData {
  sessionId: string;
  transcriptId: string;
  userId: string;
}

// Queue Configuration
const queueConfig = {
  connection: new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required for BullMQ
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
  }),
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 25,     // Keep last 25 failed jobs for debugging
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Initialize Queues
export const transcriptionQueue = new Queue('transcription', queueConfig);
export const analysisQueue = new Queue('analysis', queueConfig);

// Queue Events for monitoring
export const transcriptionEvents = new QueueEvents('transcription', { connection: queueConfig.connection });
export const analysisEvents = new QueueEvents('analysis', { connection: queueConfig.connection });

// Services
let assemblyAI: AssemblyAIService | null = null;
let ollama: OllamaService | null = null;

function getAssemblyAI(): AssemblyAIService {
  if (!assemblyAI) {
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;
    if (!apiKey) {
      throw new Error('ASSEMBLY_AI_API_KEY not configured');
    }
    assemblyAI = new AssemblyAIService(apiKey);
  }
  return assemblyAI;
}

function getOllama(): OllamaService {
  if (!ollama) {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    ollama = new OllamaService(ollamaUrl);
  }
  return ollama;
}

/**
 * Add recording to transcription queue
 */
export async function enqueueTranscription(
  sessionId: string,
  audioUrl: string,
  userId: string,
  fileName: string,
  priority?: 'low' | 'normal' | 'high'
): Promise<string> {
  console.log(`🎯 [QUEUE] Enqueuing transcription for session ${sessionId}`);
  
  const job = await transcriptionQueue.add(
    'transcribe',
    { sessionId, audioUrl, userId, fileName } as TranscriptionJobData,
    {
      priority: priority === 'high' ? 10 : priority === 'low' ? 1 : 5,
      jobId: `transcribe_${sessionId}`, // Prevent duplicates
    }
  );

  // Update recording status
  await updateRecording(sessionId, {
    status: 'processing' // Use 'processing' for all active states
  });

  console.log(`✅ [QUEUE] Transcription job ${job.id} enqueued for session ${sessionId}`);
  return job.id!;
}

/**
 * Add recording to analysis queue
 */
export async function enqueueAnalysis(
  sessionId: string,
  transcriptId: string,
  userId: string,
  priority?: 'low' | 'normal' | 'high'
): Promise<string> {
  console.log(`🧠 [QUEUE] Enqueuing analysis for session ${sessionId}`);
  
  const job = await analysisQueue.add(
    'analyze',
    { sessionId, transcriptId, userId } as AnalysisJobData,
    {
      priority: priority === 'high' ? 10 : priority === 'low' ? 1 : 5,
      jobId: `analyze_${sessionId}`, // Prevent duplicates
      delay: 1000, // Small delay to ensure transcription data is fully saved
    }
  );

  // Update recording status
  await updateRecording(sessionId, {
    status: 'processing' // Use 'processing' instead of 'analyzing' for DB constraint
  });

  console.log(`✅ [QUEUE] Analysis job ${job.id} enqueued for session ${sessionId}`);
  return job.id!;
}

/**
 * Transcription Worker
 * Handles audio transcription with Assembly AI
 */
export const transcriptionWorker = new Worker(
  'transcription',
  async (job: Job<TranscriptionJobData>) => {
    const { sessionId, audioUrl, userId, fileName } = job.data;
    
    try {
      console.log(`🎤 [TRANSCRIPTION] Starting job ${job.id} for session ${sessionId}`);
      
      // Update progress
      await job.updateProgress(10);
      await updateRecording(sessionId, { status: 'processing' });

      // Initialize services
      const assemblyService = getAssemblyAI();
      
      // Start transcription
      await job.updateProgress(25);
      console.log(`📤 [TRANSCRIPTION] Submitting audio to Assembly AI: ${fileName}`);
      
      const transcriptId = await assemblyService.startTranscription(audioUrl, {
        speaker_labels: true,
        auto_chapters: false,
        auto_highlights: false,
        sentiment_analysis: true,
        entity_detection: false,
        language_detection: true,
      });

      // Update progress and save transcript ID
      await job.updateProgress(50);
      await updateRecording(sessionId, { 
        transcriptId,
        status: 'processing'
      });

      console.log(`⏳ [TRANSCRIPTION] Assembly AI transcript ID: ${transcriptId}, polling for completion...`);

      // Poll for completion
      await job.updateProgress(75);
      const transcript = await assemblyService.pollTranscriptionStatus(transcriptId);

      if (transcript.status !== 'completed') {
        throw new Error(`Transcription failed with status: ${transcript.status}`);
      }

      // Job completed
      await job.updateProgress(100);
      console.log(`✅ [TRANSCRIPTION] Completed for session ${sessionId}`);

      // Automatically enqueue analysis
      console.log(`🔗 [TRANSCRIPTION] Auto-enqueuing analysis for session ${sessionId}`);
      await enqueueAnalysis(sessionId, transcriptId, userId);

      return {
        sessionId,
        transcriptId,
        status: 'completed',
        duration: transcript.audio_duration,
        confidence: transcript.confidence,
      };

    } catch (error) {
      console.error(`❌ [TRANSCRIPTION] Job ${job.id} failed:`, error);
      
      // Update recording with error
      await updateRecording(sessionId, {
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Transcription failed',
          stage: 'transcription',
          timestamp: new Date().toISOString(),
        }
      });

      throw error;
    }
  },
  {
    connection: queueConfig.connection,
    concurrency: 2, // Process 2 transcriptions concurrently
  }
);

/**
 * Analysis Worker  
 * Handles CIQ analysis and coaching with Ollama
 */
export const analysisWorker = new Worker(
  'analysis', 
  async (job: Job<AnalysisJobData>) => {
    const { sessionId, transcriptId, userId } = job.data;
    
    try {
      console.log(`🧠 [ANALYSIS] Starting job ${job.id} for session ${sessionId}`);
      
      // Update progress
      await job.updateProgress(10);
      await updateRecording(sessionId, { status: 'processing' });

      // Get transcript from Assembly AI
      const assemblyService = getAssemblyAI();
      const transcript = await assemblyService.getTranscript(transcriptId);

      if (transcript.status !== 'completed') {
        throw new Error(`Transcript not ready: ${transcript.status}`);
      }

      // Initialize Ollama
      const ollamaService = getOllama();
      
      // Check Ollama health
      const isHealthy = await ollamaService.healthCheck();
      if (!isHealthy) {
        throw new Error('Ollama service unavailable');
      }

      // Create AI job for CIQ analysis
      await job.updateProgress(30);
      const ciqJobId = await createAIJob({
        sessionId,
        userId,
        jobType: 'ciq_analysis',
        status: 'processing',
        progress: 0,
        externalId: transcriptId,
        metadata: { stage: 'ciq_analysis' }
      });

      // Run CIQ analysis
      console.log(`🔍 [ANALYSIS] Running CIQ analysis for session ${sessionId}`);
      await job.updateProgress(60);
      const ciqAnalysis = await ollamaService.analyzeTranscript(transcript, sessionId);
      
      await updateAIJob(ciqJobId, {
        status: 'completed',
        progress: 100,
        result: ciqAnalysis
      });

      // Create AI job for coaching
      await job.updateProgress(70);
      const coachingJobId = await createAIJob({
        sessionId,
        userId, 
        jobType: 'coaching',
        status: 'processing',
        progress: 0,
        externalId: transcriptId,
        metadata: { stage: 'coaching' }
      });

      // Generate coaching insights
      console.log(`🎯 [ANALYSIS] Generating coaching insights for session ${sessionId}`);
      await job.updateProgress(85);
      const coachingResult = await ollamaService.generateCoaching(ciqAnalysis, transcript);

      await updateAIJob(coachingJobId, {
        status: 'completed', 
        progress: 100,
        result: coachingResult
      });

      // Update recording with final results
      await job.updateProgress(100);
      await updateRecording(sessionId, {
        ciqData: ciqAnalysis,
        coachingInsights: coachingResult,
        ciqScore: ciqAnalysis.overallScore,
        status: 'completed'
      });

      console.log(`🎉 [ANALYSIS] Completed for session ${sessionId} with CIQ score: ${ciqAnalysis.overallScore}`);

      return {
        sessionId,
        ciqScore: ciqAnalysis.overallScore,
        strengths: coachingResult.strengths?.length || 0,
        opportunities: coachingResult.growthOpportunities?.length || 0,
        status: 'completed'
      };

    } catch (error) {
      console.error(`❌ [ANALYSIS] Job ${job.id} failed:`, error);
      
      // Update recording with error
      await updateRecording(sessionId, {
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Analysis failed',
          stage: 'analysis',
          timestamp: new Date().toISOString(),
        }
      });

      throw error;
    }
  },
  {
    connection: queueConfig.connection,
    concurrency: 1, // Process 1 analysis at a time (CPU intensive)
  }
);

/**
 * Get queue health and stats
 */
export async function getQueueHealth() {
  const [transcriptionWaiting, transcriptionActive, transcriptionCompleted, transcriptionFailed] = 
    await Promise.all([
      transcriptionQueue.getWaiting(),
      transcriptionQueue.getActive(), 
      transcriptionQueue.getCompleted(),
      transcriptionQueue.getFailed(),
    ]);

  const [analysisWaiting, analysisActive, analysisCompleted, analysisFailed] = 
    await Promise.all([
      analysisQueue.getWaiting(),
      analysisQueue.getActive(),
      analysisQueue.getCompleted(), 
      analysisQueue.getFailed(),
    ]);

  return {
    transcription: {
      waiting: transcriptionWaiting.length,
      active: transcriptionActive.length,
      completed: transcriptionCompleted.length,
      failed: transcriptionFailed.length,
    },
    analysis: {
      waiting: analysisWaiting.length,
      active: analysisActive.length,
      completed: analysisCompleted.length,
      failed: analysisFailed.length,
    },
    redis: {
      status: queueConfig.connection.status,
    }
  };
}

/**
 * Retry failed jobs
 */
export async function retryFailedJobs(queueName: 'transcription' | 'analysis', limit = 10) {
  const queue = queueName === 'transcription' ? transcriptionQueue : analysisQueue;
  const failedJobs = await queue.getFailed(0, limit - 1);
  
  console.log(`🔄 [QUEUE] Retrying ${failedJobs.length} failed ${queueName} jobs`);
  
  for (const job of failedJobs) {
    await job.retry();
    console.log(`🔄 [QUEUE] Retrying job ${job.id}`);
  }
  
  return failedJobs.length;
}

/**
 * Clean old completed jobs
 */
export async function cleanOldJobs(maxAge = 24 * 60 * 60 * 1000) {
  await Promise.all([
    transcriptionQueue.clean(maxAge, 10, 'completed'),
    transcriptionQueue.clean(maxAge, 25, 'failed'),
    analysisQueue.clean(maxAge, 10, 'completed'),
    analysisQueue.clean(maxAge, 25, 'failed'),
  ]);
  
  console.log(`🧹 [QUEUE] Cleaned old jobs older than ${maxAge}ms`);
}

// Event listeners for monitoring
transcriptionEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`✅ [QUEUE] Transcription job ${jobId} completed:`, returnvalue);
});

transcriptionEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ [QUEUE] Transcription job ${jobId} failed:`, failedReason);
});

analysisEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`✅ [QUEUE] Analysis job ${jobId} completed:`, returnvalue);
});

analysisEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ [QUEUE] Analysis job ${jobId} failed:`, failedReason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 [QUEUE] Shutting down workers...');
  await Promise.all([
    transcriptionWorker.close(),
    analysisWorker.close(),
    transcriptionQueue.close(),
    analysisQueue.close(),
  ]);
});