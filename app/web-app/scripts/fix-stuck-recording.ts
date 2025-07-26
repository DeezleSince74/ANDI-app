#!/usr/bin/env node
/**
 * Fix stuck recording by enqueuing analysis with the new queue system
 */

import { enqueueAnalysis } from '../src/lib/queue/recording-queue';

const sessionId = 'session_upload_1753532530835_a86v7f3jv';
const transcriptId = 'e7376b7f-5ff0-4886-a2d0-8dc79f7fd309';
const userId = '61581c73-ffed-46de-8ec9-7e37b2a55e46';

async function fixStuckRecording() {
  try {
    console.log(`🔧 [FIX] Fixing stuck recording: ${sessionId}`);
    console.log(`📊 [FIX] Transcript ID: ${transcriptId}`);
    
    // Enqueue analysis for the stuck recording
    const jobId = await enqueueAnalysis(sessionId, transcriptId, userId, 'high');
    
    console.log(`✅ [FIX] Analysis job ${jobId} enqueued for session ${sessionId}`);
    console.log(`🎯 [FIX] The recording should now process through the robust queue system`);
    
  } catch (error) {
    console.error('❌ [FIX] Error fixing stuck recording:', error);
  }
}

fixStuckRecording().then(() => {
  console.log('🏁 [FIX] Fix script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 [FIX] Script failed:', error);
  process.exit(1);
});