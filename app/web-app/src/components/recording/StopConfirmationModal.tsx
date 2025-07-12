'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';

export interface StopConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duration: number; // Current recording duration in seconds
}

export function StopConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  duration 
}: StopConfirmationModalProps) {
  if (!isOpen) return null;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-semibold text-slate-800">
                Stop Recording?
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Are you sure you want to stop and save your recording?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Recording Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Current recording time:</p>
                <p className="text-2xl font-mono font-bold text-slate-900">
                  {formatTime(duration)}
                </p>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mb-1"></div>
                <p className="text-xs text-slate-600">Recording</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  This will end your recording session
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Your recording will be saved and uploaded for analysis. You cannot resume after stopping.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Continue Recording
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Stop & Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StopConfirmationModal;