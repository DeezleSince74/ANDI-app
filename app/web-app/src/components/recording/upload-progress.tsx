'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileAudio, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Pause, 
  Play,
  X,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  uploadProgress: number; // 0-100
  processingProgress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // in seconds
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function UploadProgress({
  fileName,
  fileSize,
  uploadProgress,
  processingProgress,
  status,
  stage,
  estimatedTimeRemaining,
  onCancel,
  onPause,
  onResume,
  onRetry,
  className = ''
}: UploadProgressProps) {
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (status === 'uploading' || status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, startTime]);

  const getStatusBadge = () => {
    switch (status) {
      case 'uploading':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Uploading</Badge>;
      case 'processing':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'uploading':
        return 'Uploading audio file...';
      case 'transcribing':
        return 'Converting speech to text...';
      case 'analyzing':
        return 'Analyzing classroom dynamics...';
      case 'completed':
        return 'Analysis complete!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Preparing...';
    }
  };

  const getCurrentProgress = () => {
    if (stage === 'uploading') return uploadProgress;
    if (stage === 'transcribing') return Math.max(uploadProgress, 20 + (processingProgress * 0.4));
    if (stage === 'analyzing') return Math.max(uploadProgress, 60 + (processingProgress * 0.4));
    if (stage === 'completed') return 100;
    return 0;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'processing':
        return <FileAudio className="h-5 w-5 text-amber-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-slate-600" />;
      default:
        return <Clock className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="truncate">{fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {onCancel && status !== 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{getStageMessage()}</span>
            <span className="text-slate-600">{Math.round(getCurrentProgress())}%</span>
          </div>
          <Progress value={getCurrentProgress()} className="h-2" />
        </div>

        {/* File Info */}
        <div className="flex justify-between text-xs text-slate-500">
          <span>Size: {formatFileSize(fileSize)}</span>
          <span>
            {status === 'uploading' || status === 'processing' ? (
              `Elapsed: ${formatTime(Math.floor(elapsedTime / 1000))}`
            ) : status === 'completed' ? (
              `Completed in ${formatTime(Math.floor(elapsedTime / 1000))}`
            ) : (
              'Waiting...'
            )}
          </span>
        </div>

        {/* Time Remaining */}
        {estimatedTimeRemaining && (status === 'uploading' || status === 'processing') && (
          <div className="flex items-center justify-center text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
            <Clock className="h-3 w-3 mr-1" />
            <span>About {formatTime(estimatedTimeRemaining)} remaining</span>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              <AlertCircle className="h-4 w-4" />
              <span>Upload failed. Please try again.</span>
            </div>
            <div className="flex space-x-2">
              {onRetry && (
                <Button onClick={onRetry} size="sm" className="flex-1">
                  Retry Upload
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {status === 'paused' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <Pause className="h-4 w-4" />
              <span>Upload paused</span>
            </div>
            <div className="flex space-x-2">
              {onResume && (
                <Button onClick={onResume} size="sm" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && onPause && (
          <Button 
            onClick={onPause} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}

        {status === 'completed' && (
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
            <CheckCircle className="h-4 w-4" />
            <span>Your recording has been processed and is ready to view!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UploadProgress;