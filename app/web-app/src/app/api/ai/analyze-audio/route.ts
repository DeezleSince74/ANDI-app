import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { AIOrchestrationService } from '@/services/ai';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Initialize AI Orchestration Service
const aiService = new AIOrchestrationService({
  assemblyAI: {
    apiKey: process.env.ASSEMBLY_AI_API_KEY!,
    webhookUrl: process.env.ASSEMBLY_AI_WEBHOOK_URL,
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    models: {
      ciqAnalyzer: process.env.OLLAMA_CIQ_MODEL || 'andi-ciq-analyzer',
      coach: process.env.OLLAMA_COACH_MODEL || 'andi-coach',
      realtime: process.env.OLLAMA_REALTIME_MODEL || 'andi-realtime',
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;
    const skipCoaching = formData.get('skipCoaching') === 'true';

    if (!audioFile || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: audio file and sessionId' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: WAV, MP3, M4A, WebM, OGG' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'audio');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = audioFile.name.split('.').pop();
    const filename = `${sessionId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, filename);

    // Save file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Start analysis pipeline
    const analysisSession = await aiService.startAnalysisPipeline(
      sessionId,
      session.user.id,
      filePath,
      filename,
      {
        transcriptionOptions: {
          speaker_labels: true,
          sentiment_analysis: true,
          auto_chapters: false,
          auto_highlights: false,
          entity_detection: false,
          language_detection: false,
        },
        skipCoaching,
      }
    );

    return NextResponse.json({
      success: true,
      sessionId: analysisSession.sessionId,
      status: analysisSession.status,
      progress: analysisSession.progress,
      currentStep: analysisSession.currentStep,
      transcriptionJobId: analysisSession.transcriptionJobId,
    });

  } catch (error) {
    console.error('Audio analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // Get session status
    const analysisSession = aiService.getSessionStatus(sessionId);
    
    if (!analysisSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: analysisSession.sessionId,
      status: analysisSession.status,
      progress: analysisSession.progress,
      currentStep: analysisSession.currentStep,
      error: analysisSession.error,
      transcriptionJobId: analysisSession.transcriptionJobId,
      analysisJobId: analysisSession.analysisJobId,
      coachingJobId: analysisSession.coachingJobId,
    });

  } catch (error) {
    console.error('Get analysis status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}