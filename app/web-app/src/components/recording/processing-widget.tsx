'use client';

import { useState, useEffect } from 'react';
import { useHybridUpdates } from '@/hooks/useHybridUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  FileAudio, 
  Users, 
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface QueueItem {
  sessionId: string;
  displayName: string;
  queuePosition: number;
  status: 'queued' | 'processing' | 'completed';
  progress: number;
  estimatedCompletion?: Date;
  createdAt: Date;
}

export interface ProcessingWidgetProps {
  className?: string;
  userId?: string;
}

// Mock data for demonstration
const mockQueueItems: QueueItem[] = [
  {
    sessionId: '1',
    displayName: 'Math Review Session',
    queuePosition: 1,
    status: 'processing',
    progress: 65,
    estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
  },
  {
    sessionId: '2',
    displayName: 'Science Discussion',
    queuePosition: 2,
    status: 'queued',
    progress: 0,
    estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  }
];

export function ProcessingWidget({ className = '', userId }: ProcessingWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to fetch queue data (replace with your actual API call)
  const fetchQueueData = async (): Promise<QueueItem[]> => {
    // Simulate API call - replace with your actual endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Add some random progress updates to simulate real-time changes
        const updatedItems = mockQueueItems.map(item => ({
          ...item,
          progress: item.status === 'processing' 
            ? Math.min(item.progress + Math.random() * 10, 100) 
            : item.progress
        }));
        resolve(updatedItems);
      }, 500);
    });
  };

  // Use hybrid updates (WebSocket + polling fallback)
  const {
    data: queueItems,
    loading,
    updateSource,
    isHealthy,
    websocketStatus,
    refresh,
    getConnectionStats
  } = useHybridUpdates(
    fetchQueueData,
    userId || '',
    {
      pollingInterval: 5000,
      websocketEnabled: true,
      fallbackDelay: 15000
    }
  );

  const activeItems = queueItems?.filter(item => item.status !== 'completed') || [];
  const processingItem = activeItems.find(item => item.status === 'processing');
  const queuedItems = activeItems.filter(item => item.status === 'queued');
  const totalInQueue = activeItems.length;

  // Connection status helpers
  const getConnectionIcon = () => {
    if (updateSource === 'websocket' && websocketStatus === 'connected') {
      return <Wifi className="h-3 w-3 text-green-600" />;
    } else if (updateSource === 'websocket' && websocketStatus === 'connecting') {
      return <RefreshCw className="h-3 w-3 text-yellow-600 animate-spin" />;
    } else {
      return <WifiOff className="h-3 w-3 text-slate-400" />;
    }
  };

  const getConnectionBadge = () => {
    if (updateSource === 'websocket' && isHealthy) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Real-time
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Polling
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalInQueue === 0) {
    return null; // Don't show widget if no items in queue
  }

  return (
    <Card className={`w-full ${className} border-l-4 border-l-blue-500`}>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>Processing Queue</span>
            <Badge variant="secondary" className="text-xs">
              {totalInQueue}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {getConnectionBadge()}
            {processingItem && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Active</span>
              </div>
            )}
            {getConnectionIcon()}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Currently Processing Item */}
        {processingItem && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 truncate">
                {processingItem.displayName}
              </span>
              <span className="text-slate-500 text-xs">
                {processingItem.progress}%
              </span>
            </div>
            <Progress value={processingItem.progress} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>Processing</span>
              </div>
              {processingItem.estimatedCompletion && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    ~{formatDistanceToNow(processingItem.estimatedCompletion)} left
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue Summary */}
        {queuedItems.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{queuedItems.length} recording{queuedItems.length !== 1 ? 's' : ''} in queue</span>
            </div>
            {queuedItems[0]?.estimatedCompletion && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  Next: ~{formatDistanceToNow(queuedItems[0].estimatedCompletion)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Expanded Queue Details */}
        {isExpanded && queuedItems.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Queue
            </h4>
            {queuedItems.slice(0, 3).map((item, index) => (
              <div key={item.sessionId} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 w-4">
                    #{item.queuePosition}
                  </span>
                  <FileAudio className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-600 truncate max-w-[150px]">
                    {item.displayName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(item.createdAt)} ago
                  </span>
                </div>
              </div>
            ))}
            {queuedItems.length > 3 && (
              <div className="text-xs text-slate-400 text-center py-1">
                +{queuedItems.length - 3} more in queue
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs h-7"
            asChild
          >
            <Link href="/recordings">
              <Eye className="h-3 w-3 mr-1" />
              View All
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 px-2"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {processingItem && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-7"
              asChild
            >
              <Link href={`/recordings/${processingItem.sessionId}`}>
                Monitor
              </Link>
            </Button>
          )}
        </div>

        {/* Debug Information (only show in development) */}
        {process.env.NODE_ENV === 'development' && isExpanded && (
          <div className="text-xs text-slate-400 bg-slate-50 rounded p-2 mt-2">
            <div>Source: {updateSource}</div>
            <div>Status: {websocketStatus}</div>
            <div>Healthy: {isHealthy ? 'Yes' : 'No'}</div>
            <div>User: {userId}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProcessingWidget;