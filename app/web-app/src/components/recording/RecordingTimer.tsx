'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, Square, Mic, MicOff } from 'lucide-react';

export interface RecordingTimerProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // Current duration in seconds
  remainingTime: number; // Remaining time in seconds
  selectedDuration: number; // Total selected duration in minutes
  audioLevel: number; // Audio level 0-100
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function RecordingTimer({
  isRecording,
  isPaused,
  duration,
  remainingTime,
  selectedDuration,
  audioLevel,
  onPause,
  onResume,
  onStop
}: RecordingTimerProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const totalSeconds = selectedDuration * 60;
  const progressPercentage = Math.min(100, (duration / totalSeconds) * 100);

  // Determine warning state
  const isWarning = remainingTime <= 300 && remainingTime > 60; // 5 minutes or less
  const isCritical = remainingTime <= 60; // 1 minute or less

  // Audio level visual indicator
  const getAudioLevelColor = () => {
    if (audioLevel < 10) return 'bg-slate-300';
    if (audioLevel < 30) return 'bg-green-400';
    if (audioLevel < 70) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardContent className="p-6">
        {/* Recording Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`relative ${isRecording && !isPaused ? 'animate-pulse' : ''}`}>
              {isRecording && !isPaused ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-600">RECORDING</span>
                </div>
              ) : isPaused ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-600">PAUSED</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-600">STOPPED</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Audio Level Indicator */}
          <div className="flex items-center gap-2">
            {audioLevel > 0 ? <Mic className="h-4 w-4 text-slate-600" /> : <MicOff className="h-4 w-4 text-slate-400" />}
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-full ${
                    (audioLevel / 10) > i ? getAudioLevelColor() : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold text-slate-800 mb-2">
            {formatTime(duration)}
          </div>
          <div className={`text-lg font-medium ${
            isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-slate-600'
          }`}>
            {remainingTime > 0 ? (
              <>Time remaining: {formatTime(remainingTime)}</>
            ) : (
              <>Recording complete</>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>0:00</span>
            <span>{selectedDuration}:00 + 5:00 buffer</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isCritical 
                  ? 'bg-red-500' 
                  : isWarning 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 text-center mt-1">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center">
          {isRecording && (
            <>
              {isPaused ? (
                <Button
                  onClick={onResume}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={onPause}
                  size="lg"
                  variant="outline"
                  className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 px-6"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button
                onClick={onStop}
                size="lg"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 px-6"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop & Save
              </Button>
            </>
          )}
        </div>

        {/* Time Warnings */}
        {isWarning && !isCritical && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ 5 minutes or less remaining. Consider wrapping up your class.
            </p>
          </div>
        )}
        
        {isCritical && remainingTime > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              🚨 Less than 1 minute remaining! Recording will stop automatically.
            </p>
          </div>
        )}

        {remainingTime <= 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              ✅ Recording has reached the selected duration and will be saved automatically.
            </p>
          </div>
        )}

        {/* Recording Info */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Selected Duration:</span>
              <span className="ml-2 font-medium text-slate-800">{selectedDuration} min</span>
            </div>
            <div>
              <span className="text-slate-600">Buffer Time:</span>
              <span className="ml-2 font-medium text-green-600">+5 min</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecordingTimer;