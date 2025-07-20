import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { AIOrchestrationService } from '@/services/ai';

// Initialize AI Orchestration Service
const aiService = new AIOrchestrationService({
  assemblyAI: {
    apiKey: process.env.ASSEMBLY_AI_API_KEY!,
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

export async function GET(request: NextRequest) {
  try {
    // Check authentication for detailed health info
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    // Basic health check
    const startTime = Date.now();
    const health = await aiService.healthCheck();
    const responseTime = Date.now() - startTime;

    // Get active sessions count (only for authenticated users)
    const activeSessions = isAuthenticated ? aiService.getActiveSessions() : [];

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        assemblyAI: {
          status: health.assemblyAI ? 'healthy' : 'unavailable',
          apiKey: process.env.ASSEMBLY_AI_API_KEY ? 'configured' : 'missing',
        },
        ollama: {
          status: health.ollama ? 'healthy' : 'unavailable',
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          models: {
            ciqAnalyzer: process.env.OLLAMA_CIQ_MODEL || 'andi-ciq-analyzer',
            coach: process.env.OLLAMA_COACH_MODEL || 'andi-coach',
            realtime: process.env.OLLAMA_REALTIME_MODEL || 'andi-realtime',
          },
        },
        redis: {
          status: health.queue ? 'healthy' : 'unavailable',
          url: process.env.REDIS_URL ? 'configured' : 'default',
        },
      },
      ...(isAuthenticated && {
        activeSessions: {
          count: activeSessions.length,
          sessions: activeSessions.map(session => ({
            sessionId: session.sessionId,
            status: session.status,
            progress: session.progress,
            currentStep: session.currentStep,
          })),
        },
      }),
    };

    // Return appropriate status code
    const allHealthy = Object.values(health).every(Boolean);
    const statusCode = allHealthy ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

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
    const { action } = body;

    if (action === 'cleanup') {
      // Clean up old jobs and sessions
      await aiService.cleanup();
      
      return NextResponse.json({
        success: true,
        message: 'Cleanup completed',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: cleanup' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Health action error:', error);
    
    return NextResponse.json(
      { 
        error: 'Action failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}