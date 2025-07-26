import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAIService } from '@/services/ai/AssemblyAIService';
import { OllamaService } from '@/services/ai/OllamaService';
import { auth } from '@/server/auth';
import { getRecordingBySessionId, updateRecording, createAIJob } from '~/db/repositories/recordings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    
    // Fetch recording from database
    const recording = await getRecordingBySessionId(sessionId);
    
    if (!recording) {
      return NextResponse.json({
        error: 'Recording not found',
      }, { status: 404 });
    }
    
    const transcriptId = recording.transcriptId;
    
    if (!transcriptId) {
      return NextResponse.json({
        sessionId,
        status: 'transcribing',
        progress: 15,
        currentStep: 'Processing audio file...',
        message: 'Transcription not yet started.',
      });
    }

    // Check Assembly AI transcription status
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Assembly AI API key not configured');
    }

    const assemblyAI = new AssemblyAIService(apiKey);
    const transcript = await assemblyAI.getTranscript(transcriptId);

    // Map Assembly AI status to our status
    let mappedStatus: 'transcribing' | 'analyzing' | 'coaching' | 'completed' | 'failed';
    let progress = 0;
    let currentStep = '';

    switch (transcript.status) {
      case 'queued':
        mappedStatus = 'transcribing';
        progress = 5;
        currentStep = 'Waiting in queue...';
        break;
      case 'processing':
        mappedStatus = 'transcribing';
        progress = 30;
        currentStep = 'Transcribing audio...';
        break;
      case 'completed':
        // Check if LLM analysis has been completed
        if (recording.ciqData && recording.coachingInsights) {
          mappedStatus = 'completed';
          progress = 100;
          currentStep = 'All processing complete!';
        } else {
          // Transcription complete, analysis should be queued automatically
          mappedStatus = 'analyzing';
          progress = 70;
          currentStep = 'Analyzing with AI Coach...';
          
          // Note: Analysis is now handled by the queue system automatically
        }
        break;
      case 'error':
        mappedStatus = 'failed';
        progress = 0;
        currentStep = 'Transcription failed';
        break;
      default:
        mappedStatus = 'transcribing';
        progress = 10;
        currentStep = 'Processing...';
    }

    // Build response
    const response: any = {
      sessionId,
      transcriptId,
      status: mappedStatus,
      progress,
      currentStep,
    };

    // Include transcript data if completed
    if (transcript.status === 'completed') {
      response.transcript = {
        text: transcript.text,
        duration: transcript.audio_duration,
        confidence: transcript.confidence,
        language: transcript.language_code,
        utterances: transcript.utterances,
        sentimentAnalysis: transcript.sentiment_analysis_results,
      };

      // Include CIQ analysis and coaching if available
      if (recording.ciqData) {
        response.analysis = {
          status: 'completed',
          data: recording.ciqData,
        };
      } else {
        response.analysis = {
          status: 'processing',
          message: 'AI analysis in progress...',
        };
      }
      
      if (recording.coachingInsights) {
        response.coaching = {
          status: 'completed',
          data: recording.coachingInsights,
        };
      } else {
        response.coaching = {
          status: 'processing',
          message: 'AI coaching insights being generated...',
        };
      }
    }

    // Include error if failed
    if (transcript.status === 'error') {
      response.error = 'Transcription failed. Please try uploading again.';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check processing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Trigger LLM analysis in background
 */
async function triggerLLMAnalysis(sessionId: string, transcriptId: string, transcript: any) {
  try {
    console.log(`🧠 [LLM ANALYSIS] Starting AI analysis for session ${sessionId}`);
    
    // Initialize Ollama service
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const ollama = new OllamaService(ollamaUrl);
    
    // Check if Ollama is available
    const isHealthy = await ollama.healthCheck();
    if (!isHealthy) {
      console.error('❌ [LLM ANALYSIS] Ollama service not available');
      return;
    }
    
    // Create AI job for CIQ analysis
    await createAIJob({
      sessionId,
      userId: '', // Will be set by the database function
      jobType: 'ciq_analysis',
      status: 'processing',
      progress: 0,
      externalId: transcriptId,
      metadata: {
        transcriptId,
        stage: 'ciq_analysis'
      }
    });
    
    // Run CIQ analysis
    console.log('🔍 [LLM ANALYSIS] Analyzing transcript with CIQ framework...');
    const ciqAnalysis = await ollama.analyzeTranscript(transcript, sessionId);
    console.log('✅ [LLM ANALYSIS] CIQ analysis completed');
    
    // Create AI job for coaching
    await createAIJob({
      sessionId,
      userId: '', // Will be set by the database function
      jobType: 'coaching',
      status: 'processing',
      progress: 0,
      externalId: transcriptId,
      metadata: {
        transcriptId,
        stage: 'coaching'
      }
    });
    
    // Generate coaching insights
    console.log('🎯 [LLM ANALYSIS] Generating coaching insights...');
    const coachingResult = await ollama.generateCoaching(ciqAnalysis, transcript);
    console.log('✅ [LLM ANALYSIS] Coaching insights generated');
    
    // Update recording with results
    await updateRecording(sessionId, {
      ciqData: ciqAnalysis,
      coachingInsights: coachingResult,
      ciqScore: ciqAnalysis.overallScore,
      status: 'completed'
    });
    
    console.log(`🎉 [LLM ANALYSIS] Analysis complete for session ${sessionId}`);
    
  } catch (error) {
    console.error('❌ [LLM ANALYSIS] Error during analysis:', error);
    
    // Update recording status to show analysis failed
    try {
      await updateRecording(sessionId, {
        status: 'completed', // Keep as completed since transcription worked
        metadata: {
          analysisError: error instanceof Error ? error.message : 'Analysis failed'
        }
      });
    } catch (updateError) {
      console.error('❌ [LLM ANALYSIS] Failed to update recording status:', updateError);
    }
  }
}