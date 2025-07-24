import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAIService } from '@/services/ai/AssemblyAIService';
import { auth } from '@/server/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const { sessionId } = params;
    
    // Extract transcript ID from session ID (format: analysis_recordingId)
    // In a real app, you'd fetch this from the database
    // For now, we'll need to pass the transcript ID via query params
    const transcriptId = request.nextUrl.searchParams.get('transcriptId');
    
    if (!transcriptId) {
      // TODO: Look up transcript ID from database using sessionId
      return NextResponse.json({
        sessionId,
        status: 'transcribing',
        progress: 15,
        currentStep: 'Processing audio file...',
        message: 'Transcript ID not found. In production, this would be fetched from the database.',
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
        // In a real app, you'd check if CIQ analysis and coaching are done
        // For now, we'll just show transcription as complete
        mappedStatus = 'completed';
        progress = 100;
        currentStep = 'All processing complete!';
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

      // TODO: In production, you'd trigger CIQ analysis here
      // For now, we'll just mark it as complete
      response.analysis = {
        status: 'pending',
        message: 'CIQ analysis would be triggered here',
      };
      
      response.coaching = {
        status: 'pending',
        message: 'Coaching insights would be generated here',
      };
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