'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pause, Play, Square } from 'lucide-react';

export interface FloatingRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // Current duration in seconds
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  className?: string;
}

export function FloatingRecorder({
  isRecording,
  isPaused,
  duration,
  onPause,
  onResume,
  onStop,
  className = ''
}: FloatingRecorderProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Hide the recorder when not recording
  if (!isRecording) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="bg-yellow-400 border-yellow-500 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Recording Status */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-slate-900">
                Recording in session
              </div>
            </div>
            
            {/* Timer */}
            <div className="text-2xl font-mono font-bold text-slate-900">
              {formatTime(duration)}
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-2">
              {isPaused ? (
                <Button
                  onClick={() => {
                    console.log('FloatingRecorder: Resume button clicked', { isRecording, isPaused });
                    onResume();
                  }}
                  size="icon"
                  className="h-10 w-10 bg-green-600 hover:bg-green-700 text-white rounded-full"
                  disabled={!isRecording}
                >
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    console.log('FloatingRecorder: Pause button clicked', { isRecording, isPaused });
                    onPause();
                  }}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 border-slate-700 text-slate-700 hover:bg-slate-100 rounded-full"
                  disabled={!isRecording || isPaused}
                >
                  <Pause className="h-5 w-5" />
                </Button>
              )}
              
              <Button
                onClick={() => {
                  console.log('FloatingRecorder: Stop button clicked', { isRecording, isPaused });
                  onStop();
                }}
                size="icon"
                variant="outline"
                className="h-10 w-10 border-red-600 text-red-600 hover:bg-red-50 rounded-full"
                disabled={!isRecording}
              >
                <Square className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FloatingRecorder;