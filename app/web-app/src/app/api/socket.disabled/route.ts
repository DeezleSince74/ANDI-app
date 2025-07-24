import { NextRequest, NextResponse } from 'next/server';
import { createServer } from 'http';
import { webSocketService } from '@/services/ai/WebSocketService';

// Track if WebSocket server is already initialized
let isWebSocketInitialized = false;

export async function GET(request: NextRequest) {
  try {
    // This endpoint provides WebSocket server status
    const health = webSocketService.healthCheck();
    
    return NextResponse.json({
      success: true,
      websocket: {
        initialized: isWebSocketInitialized,
        ...health,
      },
      endpoints: {
        connect: '/api/socket.io',
        path: '/api/socket.io',
      },
    });

  } catch (error) {
    console.error('WebSocket status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get WebSocket status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'initialize' && !isWebSocketInitialized) {
      // Initialize WebSocket server
      // Note: In a real Next.js application, WebSocket initialization
      // should happen in a custom server setup (server.js) or
      // in a separate WebSocket server process
      
      return NextResponse.json({
        success: false,
        error: 'WebSocket initialization should be done in custom server setup',
        message: 'Use custom Next.js server or separate WebSocket process',
      }, { status: 501 });
    }

    if (action === 'health') {
      const health = webSocketService.healthCheck();
      
      return NextResponse.json({
        success: true,
        health,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: initialize, health' },
      { status: 400 }
    );

  } catch (error) {
    console.error('WebSocket action error:', error);
    
    return NextResponse.json(
      { 
        error: 'Action failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export flag for server initialization
export { isWebSocketInitialized };