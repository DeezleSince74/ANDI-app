import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { JobQueueService, AssemblyAIService, OllamaService } from '@/services/ai';

// Initialize services
const assemblyAI = new AssemblyAIService(process.env.ASSEMBLY_AI_API_KEY!);
const ollama = new OllamaService(
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
);
const jobQueue = new JobQueueService(
  process.env.REDIS_URL || 'redis://localhost:6379',
  assemblyAI,
  ollama
);

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job ID' },
        { status: 400 }
      );
    }

    // Get job status
    const jobStatus = await jobQueue.getJobStatus(jobId);
    
    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: jobStatus.id,
        type: jobStatus.type,
        status: jobStatus.status,
        progress: jobStatus.progress,
        result: jobStatus.result,
        error: jobStatus.error,
        createdAt: jobStatus.createdAt,
        updatedAt: jobStatus.updatedAt,
      },
    });

  } catch (error) {
    console.error('Job status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job ID' },
        { status: 400 }
      );
    }

    // Note: BullMQ doesn't easily support job cancellation
    // This would require additional implementation
    return NextResponse.json(
      { error: 'Job cancellation not yet implemented' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Job cancellation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}