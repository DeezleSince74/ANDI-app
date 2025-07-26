import { NextRequest, NextResponse } from 'next/server';
import { getPostgreSQLListener } from '@/lib/database/pg-notify-listener';
import { getWebSocketManager } from '@/app/api/ws/route';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to view status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pgListener = getPostgreSQLListener();
    const wsManager = getWebSocketManager();

    // Get comprehensive status
    const status = {
      timestamp: new Date().toISOString(),
      postgresql: pgListener.getStatus(),
      websocket: wsManager.getStats(),
      statistics: await pgListener.getStatistics(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        websocketEnabled: true
      }
    };

    return NextResponse.json(status);

  } catch (error) {
    logger.error('Failed to get realtime status', { error });
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to test
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, message } = body;

    const pgListener = getPostgreSQLListener();

    switch (action) {
      case 'test_notification':
        const testUserId = userId || session.user.id;
        const testMessage = message || 'Test notification from realtime status API';
        
        await pgListener.testNotification(testUserId, testMessage);
        
        return NextResponse.json({
          success: true,
          message: 'Test notification sent',
          userId: testUserId,
          testMessage
        });

      case 'get_statistics':
        const stats = await pgListener.getStatistics();
        return NextResponse.json({
          success: true,
          statistics: stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: test_notification, get_statistics' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Failed to execute realtime action', { error });
    return NextResponse.json(
      { error: 'Failed to execute action', details: error.message },
      { status: 500 }
    );
  }
}