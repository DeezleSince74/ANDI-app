/**
 * Queue System Startup
 * Initializes BullMQ workers for background processing
 */

import { transcriptionWorker, analysisWorker } from './recording-queue';

let workersInitialized = false;

export function initializeQueueWorkers() {
  if (workersInitialized) {
    console.log('🔄 [QUEUE] Workers already initialized');
    return;
  }

  try {
    console.log('🚀 [QUEUE] Initializing BullMQ workers...');
    
    // Workers are initialized when imported
    console.log('✅ [QUEUE] Transcription worker initialized');
    console.log('✅ [QUEUE] Analysis worker initialized');
    
    // Set up worker event handlers
    transcriptionWorker.on('ready', () => {
      console.log('🎤 [QUEUE] Transcription worker ready');
    });
    
    transcriptionWorker.on('error', (error) => {
      console.error('❌ [QUEUE] Transcription worker error:', error);
    });
    
    analysisWorker.on('ready', () => {
      console.log('🧠 [QUEUE] Analysis worker ready');
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

export function shutdownQueueWorkers() {
  if (!workersInitialized) {
    return;
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