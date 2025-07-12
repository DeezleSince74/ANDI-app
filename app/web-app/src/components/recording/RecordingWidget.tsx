'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DurationSelector from './DurationSelector';
import RecordingTimer from './RecordingTimer';
import { recordingService, RecordingState, RecordingEvent } from '@/services/RecordingService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Upload, RefreshCw } from 'lucide-react';

export interface RecordingWidgetProps {
  teacherId: string;
  onRecordingComplete?: (recordingId: string) => void;
  className?: string;
}

type WidgetState = 'selection' | 'recording' | 'processing' | 'complete' | 'error';

export function RecordingWidget({ 
  teacherId, 
  onRecordingComplete,
  className = ''
}: RecordingWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('selection');
  const [recordingState, setRecordingState] = useState<RecordingState>(recordingService.getState());
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failed'>('idle');

  // Initialize recording service and event listeners
  useEffect(() => {
    // Check if recording is supported
    if (!recordingService.constructor.isSupported()) {
      setError('Recording is not supported in this browser. Please use Chrome, Firefox, or Edge.');
      setWidgetState('error');
      return;
    }

    // Set up event listeners
    const handleStateChanged = (event: RecordingEvent) => {
      setRecordingState(event.data.state);
      
      // Update widget state based on recording state
      switch (event.data.state.status) {
        case 'recording':
        case 'paused':
          setWidgetState('recording');
          break;
        case 'processing':
          setWidgetState('processing');
          break;
        case 'idle':
          if (widgetState !== 'complete') {
            setWidgetState('selection');
          }
          break;
        case 'error':
          setError(event.data.state.error || 'Recording error occurred');
          setWidgetState('error');
          break;
      }
    };

    const handleTimeWarning = (event: RecordingEvent) => {
      const minutes = event.data.remainingMinutes;
      toast.warning(`${minutes} minute${minutes > 1 ? 's' : ''} remaining in recording`, {
        duration: 5000,
      });
    };

    const handleAutoStopped = (event: RecordingEvent) => {
      toast.info('Recording stopped automatically - time limit reached', {
        duration: 5000,
      });
    };

    const handleRecordingSaved = (event: RecordingEvent) => {
      const { recordingId, success } = event.data;
      
      if (success) {
        setWidgetState('complete');
        setUploadStatus('uploading');
        toast.success('Recording saved successfully! Uploading to server...', {
          duration: 3000,
        });
        
        if (onRecordingComplete) {
          onRecordingComplete(recordingId);
        }
      } else {
        setError('Failed to save recording');
        setWidgetState('error');
      }
    };

    const handleError = (event: RecordingEvent) => {
      setError(event.data.message);
      setWidgetState('error');
      toast.error(`Recording error: ${event.data.message}`, {
        duration: 5000,
      });
    };

    // Add event listeners
    recordingService.addEventListener('stateChanged', handleStateChanged);
    recordingService.addEventListener('timeWarning', handleTimeWarning);
    recordingService.addEventListener('autoStopped', handleAutoStopped);
    recordingService.addEventListener('recordingSaved', handleRecordingSaved);
    recordingService.addEventListener('error', handleError);

    // Listen for service worker upload status
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, recordingId } = event.data;
      
      if (type === 'UPLOAD_SUCCESS') {
        setUploadStatus('success');
        toast.success('Recording uploaded successfully!', {
          duration: 3000,
        });
      } else if (type === 'UPLOAD_FAILED') {
        setUploadStatus('failed');
        toast.error('Failed to upload recording. Will retry automatically.', {
          duration: 5000,
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Cleanup function
    return () => {
      recordingService.removeEventListener('stateChanged', handleStateChanged);
      recordingService.removeEventListener('timeWarning', handleTimeWarning);
      recordingService.removeEventListener('autoStopped', handleAutoStopped);
      recordingService.removeEventListener('recordingSaved', handleRecordingSaved);
      recordingService.removeEventListener('error', handleError);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [onRecordingComplete, widgetState]);

  // Handle duration selection
  const handleDurationSelected = (duration: number) => {
    setSelectedDuration(duration);
  };

  // Handle start recording
  const handleStartRecording = async (duration: number) => {
    try {
      setError(null);
      setUploadStatus('idle');
      
      await recordingService.startRecording({
        selectedDuration: duration,
        teacherId,
        autoStop: true
      });
      
      toast.success(`Started ${duration + 5}-minute recording session`, {
        duration: 3000,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setError(message);
      setWidgetState('error');
      toast.error(message, {
        duration: 5000,
      });
    }
  };

  // Handle pause recording
  const handlePauseRecording = () => {
    try {
      recordingService.pauseRecording();
      toast.info('Recording paused', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to pause recording', {
        duration: 3000,
      });
    }
  };

  // Handle resume recording
  const handleResumeRecording = () => {
    try {
      recordingService.resumeRecording();
      toast.info('Recording resumed', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to resume recording', {
        duration: 3000,
      });
    }
  };

  // Handle stop recording
  const handleStopRecording = () => {
    try {
      recordingService.stopRecording();
      toast.info('Stopping recording...', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to stop recording', {
        duration: 3000,
      });
    }
  };

  // Handle retry recording
  const handleRetryRecording = () => {
    setError(null);
    setWidgetState('selection');
    setUploadStatus('idle');
    recordingService.cleanup();
  };

  // Handle new recording
  const handleNewRecording = () => {
    setWidgetState('selection');
    setSelectedDuration(null);
    setUploadStatus('idle');
    recordingService.cleanup();
  };

  // Render based on widget state
  const renderContent = () => {
    switch (widgetState) {
      case 'selection':
        return (
          <DurationSelector
            onDurationSelected={handleDurationSelected}
            onStartRecording={handleStartRecording}
            selectedDuration={selectedDuration || undefined}
          />
        );

      case 'recording':
        return (
          <RecordingTimer
            isRecording={recordingState.isRecording}
            isPaused={recordingState.isPaused}
            duration={recordingState.duration}
            remainingTime={recordingState.remainingTime}
            selectedDuration={recordingState.selectedDuration}
            audioLevel={recordingState.audioLevel}
            onPause={handlePauseRecording}
            onResume={handleResumeRecording}
            onStop={handleStopRecording}
          />
        );

      case 'processing':
        return (
          <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Processing Recording...
              </h3>
              <p className="text-slate-600">
                Please wait while we save your classroom recording. This may take a few moments.
              </p>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : uploadStatus === 'uploading' ? (
                  <Upload className="h-8 w-8 text-blue-600 animate-pulse" />
                ) : uploadStatus === 'failed' ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {uploadStatus === 'success' ? 'Recording Complete!' :
                 uploadStatus === 'uploading' ? 'Uploading Recording...' :
                 uploadStatus === 'failed' ? 'Upload Pending' :
                 'Recording Saved!'}
              </h3>
              
              <p className="text-slate-600 mb-6">
                {uploadStatus === 'success' ? 
                  'Your classroom recording has been saved and uploaded successfully. You can now view the analysis in your dashboard.' :
                 uploadStatus === 'uploading' ? 
                  'Your recording is being uploaded to the server for analysis. This may take a few minutes.' :
                 uploadStatus === 'failed' ? 
                  'Your recording is saved locally and will be uploaded when connection is restored.' :
                  'Your classroom recording has been saved successfully and will be uploaded shortly.'}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleNewRecording}
                  size="lg"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Start New Recording
                </Button>
                
                {uploadStatus === 'success' && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    View Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Recording Error
              </h3>
              
              <p className="text-red-600 mb-6">
                {error}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleRetryRecording}
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`recording-widget ${className}`}>
      {renderContent()}
    </div>
  );
}

export default RecordingWidget;