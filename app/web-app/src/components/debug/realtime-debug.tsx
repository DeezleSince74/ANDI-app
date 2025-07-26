'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  Send, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeMessage {
  id: string;
  timestamp: number;
  type: string;
  channel?: string;
  data: any;
}

interface RealtimeStatus {
  timestamp: string;
  postgresql: {
    isConnected: boolean;
    reconnectAttempts: number;
    channelsListening: number;
    hasWebSocketManager: boolean;
  };
  websocket: {
    totalUsers: number;
    totalConnections: number;
  };
  statistics: any;
}

export function RealtimeDebug({ userId }: { userId: string }) {
  const [status, setStatus] = useState<RealtimeStatus | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [testMessage, setTestMessage] = useState('Test from debug panel');
  const [customUserId, setCustomUserId] = useState(userId);
  const [loading, setLoading] = useState(false);

  // WebSocket connection
  const webSocket = useWebSocket(userId);

  // Fetch status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/realtime/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch realtime status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/realtime/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_notification',
          userId: customUserId,
          message: testMessage
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test notification sent:', result);
        
        // Add to messages
        setMessages(prev => [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'test_sent',
          data: result
        }, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for WebSocket messages
  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      const { message } = event.detail;
      
      setMessages(prev => [{
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: message.type || 'unknown',
        channel: message.channel,
        data: message
      }, ...prev.slice(0, 49)]); // Keep last 50 messages
    };

    window.addEventListener('websocket-message', handleMessage as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', handleMessage as EventListener);
    };
  }, []);

  // Auto-refresh status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getWebSocketStatusIcon = () => {
    switch (webSocket.connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Real-time Debug Panel</span>
        </h2>
        <Button 
          onClick={fetchStatus} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PostgreSQL Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>PostgreSQL Listener</span>
              {status && getStatusIcon(status.postgresql.isConnected)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {status ? (
              <>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant={status.postgresql.isConnected ? 'default' : 'destructive'}>
                    {status.postgresql.isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Channels:</span> {status.postgresql.channelsListening}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reconnect Attempts:</span> {status.postgresql.reconnectAttempts}
                </div>
                <div className="text-sm">
                  <span className="font-medium">WebSocket Manager:</span>{' '}
                  <Badge variant={status.postgresql.hasWebSocketManager ? 'default' : 'secondary'}>
                    {status.postgresql.hasWebSocketManager ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">Loading...</div>
            )}
          </CardContent>
        </Card>

        {/* WebSocket Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              {getWebSocketStatusIcon()}
              <span>WebSocket Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <Badge variant={webSocket.isConnected ? 'default' : 'destructive'}>
                {webSocket.connectionStatus}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">Reconnect Attempts:</span> {webSocket.reconnectAttempts}
            </div>
            {status && (
              <>
                <div className="text-sm">
                  <span className="font-medium">Total Users:</span> {status.websocket.totalUsers}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Total Connections:</span> {status.websocket.totalConnections}
                </div>
              </>
            )}
            <div className="text-sm">
              <span className="font-medium">User ID:</span> {userId}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-user-id">User ID</Label>
              <Input
                id="test-user-id"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                placeholder="User ID to test"
              />
            </div>
            <div>
              <Label htmlFor="test-message">Test Message</Label>
              <Input
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test message content"
              />
            </div>
          </div>
          <Button 
            onClick={sendTestNotification}
            disabled={loading || !customUserId.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Messages Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Recent Messages ({messages.length})</span>
            <Button 
              onClick={() => setMessages([])}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">
                No messages received yet. Send a test notification to see real-time updates.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{message.type}</Badge>
                      {message.channel && (
                        <Badge variant="secondary" className="text-xs">
                          {message.channel}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(message.timestamp)} ago</span>
                    </div>
                  </div>
                  <Textarea
                    value={JSON.stringify(message.data, null, 2)}
                    readOnly
                    className="text-xs font-mono h-24 resize-none"
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}