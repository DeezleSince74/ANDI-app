'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  FileAudio, 
  Brain, 
  MessageSquare, 
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface ProcessingStatus {
  sessionId: string;
  transcriptId?: string;
  status: 'transcribing' | 'analyzing' | 'coaching' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  transcript?: any;
  analysis?: any;
  coaching?: any;
}

interface ProcessingWidgetProps {
  sessionId: string;
  transcriptId?: string;
  recordingName?: string;
  onClose: () => void;
  onComplete?: (sessionId: string) => void;
}

export default function ProcessingWidget({ 
  sessionId, 
  transcriptId, 
  recordingName = 'Recording',
  onClose,
  onComplete 
}: ProcessingWidgetProps) {
  const [status, setStatus] = useState<ProcessingStatus>({
    sessionId,
    status: 'transcribing',
    progress: 10,
    currentStep: 'Transcribing audio...',
  });
  
  const [polling, setPolling] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!polling) return;

    const checkStatus = async () => {
      try {
        const url = transcriptId 
          ? `/api/recordings/status/${sessionId}?transcriptId=${transcriptId}`
          : `/api/recordings/status/${sessionId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        setStatus(data);
        
        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setPolling(false);
          
          // Notify parent of completion
          if (data.status === 'completed' && onComplete) {
            onComplete(sessionId);
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    // Check immediately
    checkStatus();
    
    // Then poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, [sessionId, transcriptId, polling, onComplete]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'transcribing':
        return <FileAudio className="h-4 w-4" />;
      case 'analyzing':
        return <Brain className="h-4 w-4" />;
      case 'coaching':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStepStatus = (step: string) => {
    const currentStepIndex = ['transcribing', 'analyzing', 'coaching'].indexOf(status.status);
    const stepIndex = ['transcribing', 'analyzing', 'coaching'].indexOf(step);
    
    if (status.status === 'failed') return 'failed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const steps = [
    {
      id: 'transcribing',
      name: 'Transcription',
      description: 'Converting audio to text with speaker identification',
    },
    {
      id: 'analyzing',
      name: 'CIQ Analysis',
      description: 'Analyzing classroom dynamics for equity, creativity, and innovation',
    },
    {
      id: 'coaching',
      name: 'Coaching Insights',
      description: 'Generating personalized teaching recommendations',
    },
  ];


  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`shadow-xl border-2 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-80'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Processing Recording</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{recordingName}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{status.currentStep}</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>

          {/* Processing Steps - Show detailed view when expanded */}
          {isExpanded && (
            <div className="space-y-3">
              {steps.map((step) => {
                const stepStatus = getStepStatus(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-md border ${
                      stepStatus === 'active' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`mt-0.5 ${stepStatus === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                      {stepStatus === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : stepStatus === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : stepStatus === 'active' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getStepIcon(step.id)
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        stepStatus === 'pending' ? 'text-muted-foreground' : ''
                      }`}>
                        {step.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Simple step indicators when not expanded */}
          {!isExpanded && (
            <div className="flex items-center justify-center gap-2">
              {steps.map((step) => {
                const stepStatus = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex items-center gap-1">
                    {stepStatus === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : stepStatus === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : stepStatus === 'active' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error State */}
          {status.status === 'failed' && status.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {status.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {status.status === 'completed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Analysis complete! View results in your recordings.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {(status.status === 'failed' || status.status === 'completed') && (
            <div className="flex gap-2 pt-2">
              {status.status === 'failed' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPolling(true);
                  }}
                  className="flex-1"
                >
                  Retry
                </Button>
              )}
              {status.status === 'completed' && (
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/results/${sessionId}`}
                  className="flex-1"
                >
                  View Results
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}