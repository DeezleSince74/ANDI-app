import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { OllamaService } from '@/services/ai';

// Initialize Ollama Service for real-time analysis
const ollamaService = new OllamaService(
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  {
    realtime: process.env.OLLAMA_REALTIME_MODEL || 'andi-realtime',
  }
);

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

    const body = await request.json();
    const { transcriptSegment, sessionId } = body;

    if (!transcriptSegment) {
      return NextResponse.json(
        { error: 'Missing transcript segment' },
        { status: 400 }
      );
    }

    // Validate transcript segment length
    if (transcriptSegment.length > 2000) {
      return NextResponse.json(
        { error: 'Transcript segment too long. Maximum 2000 characters for real-time analysis' },
        { status: 400 }
      );
    }

    // Get real-time insight
    const insight = await ollamaService.analyzeRealtime(transcriptSegment);

    return NextResponse.json({
      success: true,
      sessionId,
      insight: {
        quickInsight: insight.quickInsight,
        pattern: insight.pattern,
        suggestion: insight.suggestion,
        successIndicator: insight.successIndicator,
        timestamp: insight.timestamp,
      },
    });

  } catch (error) {
    console.error('Real-time analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Real-time analysis failed',
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

    // Health check for Ollama service
    const isHealthy = await ollamaService.healthCheck();
    const availableModels = await ollamaService.getModels();

    return NextResponse.json({
      success: true,
      service: {
        healthy: isHealthy,
        availableModels,
        realtimeModel: process.env.OLLAMA_REALTIME_MODEL || 'andi-realtime',
      },
    });

  } catch (error) {
    console.error('Real-time service health check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}