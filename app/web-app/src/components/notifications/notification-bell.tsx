'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Eye, FileAudio, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export interface Notification {
  id: string;
  sessionId?: string;
  type: 'processing_complete' | 'processing_failed' | 'upload_complete' | 'analysis_ready';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
}

export interface NotificationBellProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

// Mock data for demonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    sessionId: 'sess_1',
    type: 'processing_complete',
    title: 'Recording Analysis Complete',
    message: 'Your recording "Math Review Session" has been processed and analysis is ready to view.',
    actionUrl: '/recordings/sess_1',
    isRead: false,
    priority: 'normal',
    createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  },
  {
    id: '2',
    sessionId: 'sess_2',
    type: 'processing_failed',
    title: 'Recording Processing Failed',
    message: 'There was an error processing "Science Discussion". Please try uploading again.',
    actionUrl: '/recordings',
    isRead: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    id: '3',
    type: 'analysis_ready',
    title: 'Weekly Insights Available',
    message: 'Your weekly classroom insights and trends are ready to explore.',
    actionUrl: '/insights',
    isRead: true,
    priority: 'normal',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  }
];

export function NotificationBell({ userId, onNotificationClick, className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching notifications
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);

    // Set up polling for new notifications
    const interval = setInterval(() => {
      // In a real app, this would poll your notifications API
      // For demo, we'll occasionally add a new notification
      const shouldAddNotification = Math.random() > 0.95; // 5% chance every 10 seconds
      if (shouldAddNotification) {
        const newNotification: Notification = {
          id: `new_${Date.now()}`,
          type: 'processing_complete',
          title: 'New Recording Complete',
          message: 'A recording has finished processing.',
          actionUrl: '/recordings',
          isRead: false,
          priority: 'normal',
          createdAt: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasHighPriority = notifications.some(n => !n.isRead && n.priority === 'high');

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'processing_complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing_failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'upload_complete':
        return <FileAudio className="h-4 w-4 text-blue-600" />;
      case 'analysis_ready':
        return <Eye className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative p-2 ${className}`}
        >
          <Bell className={`h-5 w-5 ${hasHighPriority ? 'text-red-600 animate-pulse' : 'text-slate-600'}`} />
          {unreadCount > 0 && (
            <Badge 
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs ${
                hasHighPriority ? 'bg-red-500' : 'bg-blue-500'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Notifications</span>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs h-6 px-2"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-400">
                                {formatDistanceToNow(notification.createdAt)} ago
                              </span>
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {notification.actionUrl && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={notification.actionUrl}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;