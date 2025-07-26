const { transcriptionQueue } = require('./dist/lib/queue/recording-queue.js');

async function retryTranscription() {
  try {
    console.log('Enqueuing transcription job...');
    
    const job = await transcriptionQueue.add(
      'transcribe',
      {
        sessionId: 'session_upload_1753538073757_k2tsyf423',
        audioUrl: '/app/uploads/recordings/61581c73-ffed-46de-8ec9-7e37b2a55e46/upload_1753538073757_k2tsyf423.m4a',
        userId: '61581c73-ffed-46de-8ec9-7e37b2a55e46',
        fileName: 'upload_1753538073757_k2tsyf423.m4a'
      },
      {
        priority: 10, // High priority
        jobId: `transcribe_retry_${Date.now()}`, // Unique job ID
      }
    );
    
    console.log('✅ Job enqueued successfully:', job.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enqueuing job:', error.message);
    process.exit(1);
  }
}

retryTranscription();