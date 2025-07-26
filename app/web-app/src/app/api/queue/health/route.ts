import { NextResponse } from 'next/server';
import { getQueueHealth, retryFailedJobs, cleanOldJobs } from '~/lib/queue/recording-queue';

/**
 * Queue Health and Management API
 * GET: Get queue statistics
 * POST: Perform queue management operations
 */

export async function GET() {
  try {
    const health = await getQueueHealth();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      queues: health,
    });
  } catch (error) {
    console.error('Queue health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, queue, limit } = await request.json();
    
    switch (action) {
      case 'retry_failed':
        const retryCount = await retryFailedJobs(queue, limit);
        return NextResponse.json({
          success: true,
          message: `Retried ${retryCount} failed jobs in ${queue} queue`,
          retryCount,
        });
        
      case 'clean_old':
        await cleanOldJobs(limit || 24 * 60 * 60 * 1000); // Default 24 hours
        return NextResponse.json({
          success: true,
          message: 'Cleaned old completed jobs',
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: retry_failed, clean_old' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Queue management failed:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}