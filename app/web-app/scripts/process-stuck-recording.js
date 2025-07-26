#!/usr/bin/env node
import { AssemblyAIService } from '../src/services/ai/AssemblyAIService.js';
import { OllamaService } from '../src/services/ai/OllamaService.js';
import { pool } from '../src/db/client.js';
import { getRecordingBySessionId, updateRecording, createAIJob } from '../src/db/repositories/recordings.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sessionId = 'session_upload_1753532530835_a86v7f3jv';
const transcriptId = 'e7376b7f-5ff0-4886-a2d0-8dc79f7fd309';

async function processStuckRecording() {
  try {
    console.log(`📋 Processing stuck recording: ${sessionId}`);
    
    // Get recording details
    const recording = await getRecordingBySessionId(sessionId);
    if (!recording) {
      console.error('❌ Recording not found');
      return;
    }
    
    console.log(`✅ Found recording: ${recording.title}`);
    console.log(`📊 Current status: ${recording.status}`);
    
    // Check Assembly AI transcript
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;
    if (!apiKey) {
      console.error('❌ Assembly AI API key not configured');
      return;
    }
    
    const assemblyAI = new AssemblyAIService(apiKey);
    console.log('🔍 Checking Assembly AI transcript status...');
    const transcript = await assemblyAI.getTranscript(transcriptId);
    console.log(`📊 Transcript status: ${transcript.status}`);
    
    if (transcript.status !== 'completed') {
      console.log('⏳ Transcript not yet completed, waiting...');
      return;
    }
    
    console.log('✅ Transcript completed!');
    
    // Initialize Ollama
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const ollama = new OllamaService(ollamaUrl);
    
    // Check Ollama health
    const isHealthy = await ollama.healthCheck();
    if (!isHealthy) {
      console.error('❌ Ollama service not available');
      return;
    }
    
    console.log('✅ Ollama service is healthy');
    
    // Run CIQ analysis
    console.log('🔍 Starting CIQ analysis...');
    const ciqAnalysis = await ollama.analyzeTranscript(transcript, sessionId);
    console.log('✅ CIQ analysis completed');
    console.log(`📊 Overall CIQ Score: ${ciqAnalysis.overallScore}`);
    
    // Generate coaching insights
    console.log('🎯 Generating coaching insights...');
    const coachingResult = await ollama.generateCoaching(ciqAnalysis, transcript);
    console.log('✅ Coaching insights generated');
    console.log(`📊 Strengths identified: ${coachingResult.strengths.length}`);
    console.log(`📊 Growth opportunities: ${coachingResult.growthOpportunities.length}`);
    
    // Update recording with results
    console.log('💾 Updating recording with results...');
    await updateRecording(sessionId, {
      ciqData: ciqAnalysis,
      coachingInsights: coachingResult,
      ciqScore: ciqAnalysis.overallScore,
      status: 'completed'
    });
    
    console.log('🎉 Recording processing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error processing recording:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the script
processStuckRecording();