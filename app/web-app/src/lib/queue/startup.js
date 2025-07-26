/**
 * Queue System Startup (CommonJS version for server.js)
 * Initializes BullMQ workers for background processing
 */

const { Queue, Worker } = require('bullmq');
const { Redis } = require('ioredis');

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
const transcriptionQueue = new Queue('transcription', queueConfig);
const analysisQueue = new Queue('analysis', queueConfig);

// Helper function to get AssemblyAI service
function getAssemblyAI() {
  const apiKey = process.env.ASSEMBLY_AI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLY_AI_API_KEY not configured');
  }
  
  const { AssemblyAI } = require('assemblyai');
  return new AssemblyAI({ apiKey });
}

// Transcription Worker Process Function
async function processTranscription(job) {
  const { sessionId, audioUrl, userId, fileName } = job.data;
  
  console.log(`🎤 [TRANSCRIPTION] Starting job for session: ${sessionId}`);
  
  try {
    // Update job progress
    await job.updateProgress(10);
    
    // Initialize AssemblyAI
    const assemblyAI = getAssemblyAI();
    console.log(`📤 [TRANSCRIPTION] Uploading audio file: ${fileName}`);
    
    // Upload file to AssemblyAI
    const fs = require('fs');
    const path = require('path');
    const filePath = audioUrl.startsWith('/app') ? audioUrl : path.join('/app', audioUrl);
    
    console.log(`📁 [TRANSCRIPTION] Audio URL: ${audioUrl}`);
    console.log(`📁 [TRANSCRIPTION] File path: ${filePath}`);
    console.log(`📁 [TRANSCRIPTION] File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    
    const audioFile = fs.readFileSync(filePath);
    const uploadUrl = await assemblyAI.files.upload(audioFile);
    
    await job.updateProgress(30);
    console.log(`✅ [TRANSCRIPTION] File uploaded successfully: ${uploadUrl}`);
    
    // Start transcription
    const transcript = await assemblyAI.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true,
      auto_highlights: true,
      sentiment_analysis: true,
      entity_detection: true,
    });
    
    await job.updateProgress(80);
    console.log(`🎯 [TRANSCRIPTION] Transcription completed: ${transcript.id}`);
    
    // Update database (simplified for now)
    console.log(`💾 [TRANSCRIPTION] Saving results for session: ${sessionId}`);
    
    await job.updateProgress(100);
    
    return {
      transcriptId: transcript.id,
      status: 'completed',
      transcript: transcript.text,
      confidence: transcript.confidence,
      audioUrl: uploadUrl,
    };
    
  } catch (error) {
    console.error(`❌ [TRANSCRIPTION] Job failed for session ${sessionId}:`, error.message);
    throw error;
  }
}

// Analysis Worker Process Function  
async function processAnalysis(job) {
  const { sessionId, transcriptId, userId } = job.data;
  
  console.log(`🧠 [ANALYSIS] Starting CIQ analysis for session: ${sessionId}`);
  
  try {
    await job.updateProgress(10);
    
    // Placeholder for Ollama CIQ analysis
    console.log(`🤖 [ANALYSIS] Running CIQ analysis with Ollama...`);
    
    await job.updateProgress(50);
    
    // Simulate analysis processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await job.updateProgress(100);
    
    console.log(`✅ [ANALYSIS] CIQ analysis completed for session: ${sessionId}`);
    
    return {
      ciqScore: 85,
      insights: ['Great student engagement', 'Good questioning techniques'],
      status: 'completed',
    };
    
  } catch (error) {
    console.error(`❌ [ANALYSIS] Job failed for session ${sessionId}:`, error.message);
    throw error;
  }
}

// Create Workers
const transcriptionWorker = new Worker('transcription', processTranscription, queueConfig);
const analysisWorker = new Worker('analysis', processAnalysis, queueConfig);

let workersInitialized = false;

function initializeQueueWorkers() {
  if (workersInitialized) {
    console.log('🔄 [QUEUE] Workers already initialized');
    return;
  }

  try {
    console.log('🚀 [QUEUE] Initializing BullMQ workers...');
    
    // Set up worker event handlers
    transcriptionWorker.on('ready', () => {
      console.log('🎤 [QUEUE] Transcription worker ready');
    });
    
    transcriptionWorker.on('completed', (job, result) => {
      console.log(`✅ [QUEUE] Transcription job ${job.id} completed`);
    });
    
    transcriptionWorker.on('failed', (job, err) => {
      console.error(`❌ [QUEUE] Transcription job ${job?.id} failed:`, err.message);
    });
    
    transcriptionWorker.on('error', (error) => {
      console.error('❌ [QUEUE] Transcription worker error:', error);
    });
    
    analysisWorker.on('ready', () => {
      console.log('🧠 [QUEUE] Analysis worker ready');
    });
    
    analysisWorker.on('completed', (job, result) => {
      console.log(`✅ [QUEUE] Analysis job ${job.id} completed`);
    });
    
    analysisWorker.on('failed', (job, err) => {
      console.error(`❌ [QUEUE] Analysis job ${job?.id} failed:`, err.message);
    });
    
    analysisWorker.on('error', (error) => {
      console.error('❌ [QUEUE] Analysis worker error:', error);
    });
    
    workersInitialized = true;
    console.log('🎉 [QUEUE] All workers initialized successfully');
    
  } catch (error) {
    console.error('❌ [QUEUE] Failed to initialize workers:', error);
    throw error;
  }
}

function shutdownQueueWorkers() {
  if (!workersInitialized) {
    return Promise.resolve();
  }
  
  console.log('🛑 [QUEUE] Shutting down workers...');
  
  return Promise.all([
    transcriptionWorker.close(),
    analysisWorker.close(),
  ]).then(() => {
    workersInitialized = false;
    console.log('✅ [QUEUE] Workers shut down successfully');
  });
}

// Export functions
module.exports = {
  initializeQueueWorkers,
  shutdownQueueWorkers,
  transcriptionQueue,
  analysisQueue,
};