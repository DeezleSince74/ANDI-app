import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

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

    // For now, return mock data with current dates
    // TODO: Replace with actual database query
    const currentDate = new Date();
    const thisWeek = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const mockRecordings = [
      {
        sessionId: 'session_1',
        displayName: 'Math Class - Algebra Review',
        createdAt: new Date(currentDate.getTime() - (1 * 24 * 60 * 60 * 1000)), // 1 day ago
        duration: 2700, // 45 mins
        sourceType: 'recorded',
        status: 'completed',
        processingStage: 'completed',
        processingProgress: 100,
        ciqScore: 85
      },
      {
        sessionId: 'session_2', 
        displayName: 'Science Discussion - Climate Change',
        createdAt: new Date(currentDate.getTime() - (2 * 24 * 60 * 60 * 1000)), // 2 days ago
        duration: 3600, // 1 hour
        sourceType: 'uploaded',
        status: 'completed',
        processingStage: 'completed', 
        processingProgress: 100,
        ciqScore: 92
      },
      {
        sessionId: 'session_3',
        displayName: 'Reading Group - Chapter Discussion',
        createdAt: new Date(currentDate.getTime() - (3 * 24 * 60 * 60 * 1000)), // 3 days ago
        duration: 1800, // 30 mins
        sourceType: 'recorded',
        status: 'processing',
        processingStage: 'analyzing',
        processingProgress: 65,
      }
    ];

    console.log('📋 [RECORDINGS API] Returning recordings:', mockRecordings.length);

    return NextResponse.json({
      success: true,
      recordings: mockRecordings,
      total: mockRecordings.length
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