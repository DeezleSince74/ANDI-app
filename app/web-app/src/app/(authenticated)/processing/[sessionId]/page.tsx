'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, FileAudio, Brain, MessageSquare } from 'lucide-react';

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

export default function ProcessingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  // Get transcript ID from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const transcriptId = searchParams.get('transcriptId');
  
  const [status, setStatus] = useState<ProcessingStatus>({
    sessionId,
    status: 'transcribing',
    progress: 10,
    currentStep: 'Transcribing audio...',
  });
  
  const [polling, setPolling] = useState(true);

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
          
          // Redirect to results page if completed
          if (data.status === 'completed') {
            setTimeout(() => {
              router.push(`/results/${sessionId}`);
            }, 2000);
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
  }, [sessionId, polling, router]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'transcribing':
        return <FileAudio className="h-5 w-5" />;
      case 'analyzing':
        return <Brain className="h-5 w-5" />;
      case 'coaching':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Processing Your Recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{status.currentStep}</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>

          {/* Processing Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    stepStatus === 'active' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`mt-0.5 ${stepStatus === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {stepStatus === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : stepStatus === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : stepStatus === 'active' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      getStepIcon(step.id)
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      stepStatus === 'pending' ? 'text-muted-foreground' : ''
                    }`}>
                      {step.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error State */}
          {status.status === 'failed' && status.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {status.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {status.status === 'completed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Analysis complete! Redirecting to results...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
            {status.status === 'failed' && (
              <Button
                onClick={() => {
                  // Retry logic would go here
                  setPolling(true);
                }}
              >
                Retry Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}