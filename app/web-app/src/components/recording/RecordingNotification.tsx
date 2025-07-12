'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RecordingNotificationProps {
  isVisible: boolean;
  type: 'ended' | 'uploaded';
  onClose: () => void;
  className?: string;
}

export function RecordingNotification({ 
  isVisible, 
  type, 
  onClose, 
  className = '' 
}: RecordingNotificationProps) {
  if (!isVisible) return null;

  const getNotificationText = () => {
    switch (type) {
      case 'ended':
        return {
          title: 'Your recording has ended',
          subtitle: 'Report will be ready on 23 March 2025.'
        };
      case 'uploaded':
        return {
          title: 'Recording successfully uploaded',
          subtitle: 'Report will be ready on 23 March 2025.'
        };
      default:
        return {
          title: 'Recording complete',
          subtitle: 'Processing your classroom session.'
        };
    }
  };

  const notification = getNotificationText();

  return (
    <div className={`fixed top-20 right-6 z-50 ${className}`}>
      <Card className="bg-white border border-slate-200 shadow-lg min-w-[300px]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {notification.subtitle}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RecordingNotification;