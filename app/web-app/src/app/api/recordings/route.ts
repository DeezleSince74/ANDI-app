import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getRecordingsByUser } from '~/db/repositories/recordings';
import type { RecordingSession } from '~/db/types';

/**
 * ANDI Recordings List API Endpoint
 * Returns list of recordings for the authenticated user
 */

export async function GET(request: NextRequest) {
  console.log('🔄 [RECORDINGS API] Starting recordings list request...');
  
  try {
    // Check authentication
    const session = await auth();
    console.log('🔑 [RECORDINGS API] Session check:', session ? 'Found' : 'Missing');
    
    if (!session?.user) {
      console.log('❌ [RECORDINGS API] Authentication failed - no session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    console.log('👤 [RECORDINGS API] User:', user.email);

    // Query database for user's recordings
    const dbRecordings = await getRecordingsByUser(user.id);

    console.log('📋 [RECORDINGS API] Found recordings in database:', dbRecordings.length);

    // Transform database records to match frontend interface
    const recordings = dbRecordings.map(recording => ({
      sessionId: recording.sessionId,
      displayName: recording.title,
      createdAt: recording.createdAt,
      duration: recording.duration || 0,
      sourceType: 'uploaded' as const, // All current recordings are uploaded
      status: mapDatabaseStatus(recording.status),
      processingStage: mapProcessingStage(recording.status),
      processingProgress: getProcessingProgress(recording.status),
      ciqScore: recording.ciqScore
    }));

    console.log('📋 [RECORDINGS API] Transformed recordings:', recordings.length);

    return NextResponse.json({
      success: true,
      recordings: recordings,
      total: recordings.length
    });

  } catch (error) {
    console.error('❌ [RECORDINGS API] Critical error:', error);
    console.error('❌ [RECORDINGS API] Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch recordings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Map database status to frontend status
 */
function mapDatabaseStatus(dbStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (dbStatus) {
    case 'completed':
      return 'completed';
    case 'processing':
      return 'processing';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Map database status to processing stage
 */
function mapProcessingStage(dbStatus: string): 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed' {
  switch (dbStatus) {
    case 'completed':
      return 'completed';
    case 'processing':
      return 'transcribing'; // Currently processing means transcribing
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Get processing progress based on status
 */
function getProcessingProgress(dbStatus: string): number {
  switch (dbStatus) {
    case 'completed':
      return 100;
    case 'processing':
      return 45; // Assume roughly halfway through transcription
    case 'failed':
      return 0;
    default:
      return 10; // Just started
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}