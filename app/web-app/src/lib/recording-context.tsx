'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { recordingService, RecordingState, RecordingEvent } from '@/services/RecordingService';
import { toast } from 'sonner';

interface RecordingContextType {
  recordingState: RecordingState;
  isUploadModalOpen: boolean;
  isRecordingModalOpen: boolean;
  isStopConfirmationOpen: boolean;
  notificationState: {
    isVisible: boolean;
    type: 'ended' | 'uploaded' | null;
  };
  startRecording: (duration: number, teacherId: string) => Promise<void>;
  stopRecording: () => void;
  confirmStopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openRecordingModal: () => void;
  closeRecordingModal: () => void;
  openStopConfirmation: () => void;
  closeStopConfirmation: () => void;
  showNotification: (type: 'ended' | 'uploaded') => void;
  hideNotification: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}

interface RecordingProviderProps {
  children: ReactNode;
}

export function RecordingProvider({ children }: RecordingProviderProps) {
  // Initialize with current recording service state to handle page refreshes/navigation
  const [recordingState, setRecordingState] = useState<RecordingState>(() => recordingService.getState());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isStopConfirmationOpen, setIsStopConfirmationOpen] = useState(false);
  const [notificationState, setNotificationState] = useState<{
    isVisible: boolean;
    type: 'ended' | 'uploaded' | null;
  }>({
    isVisible: false,
    type: null
  });

  useEffect(() => {
    console.log('RecordingProvider mounted/remounted. Current state:', recordingService.getState());
    
    // Check if recording is supported
    if (!recordingService.constructor.isSupported()) {
      toast.error('Recording is not supported in this browser. Please use Chrome, Firefox, or Edge.');
      return;
    }

    // Set up event listeners
    const handleStateChanged = (event: RecordingEvent) => {
      console.log('RecordingContext: State changed event received:', event.data.state);
      setRecordingState(event.data.state);
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
        toast.success('Recording saved successfully! Uploading...', {
          duration: 3000,
        });
        // Show "recording ended" notification
        setNotificationState({
          isVisible: true,
          type: 'ended'
        });
      } else {
        toast.error('Failed to save recording');
      }
    };

    const handleError = (event: RecordingEvent) => {
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
      const { type } = event.data;
      
      if (type === 'UPLOAD_SUCCESS') {
        toast.success('Recording uploaded successfully!', {
          duration: 3000,
        });
        // Show "uploaded" notification
        setNotificationState({
          isVisible: true,
          type: 'uploaded'
        });
      } else if (type === 'UPLOAD_FAILED') {
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
  }, []);

  const startRecording = async (duration: number, teacherId: string) => {
    try {
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
      toast.error(message, {
        duration: 5000,
      });
      throw error;
    }
  };

  const stopRecording = () => {
    // Show confirmation modal instead of immediately stopping
    setIsStopConfirmationOpen(true);
  };

  const confirmStopRecording = () => {
    try {
      recordingService.stopRecording();
      setIsStopConfirmationOpen(false);
      toast.info('Stopping recording...', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to stop recording', {
        duration: 3000,
      });
    }
  };

  const pauseRecording = () => {
    try {
      console.log('RecordingContext: Attempting to pause recording');
      recordingService.pauseRecording();
      toast.info('Recording paused', {
        duration: 2000,
      });
    } catch (error) {
      console.error('RecordingContext: Failed to pause recording:', error);
      toast.error('Failed to pause recording', {
        duration: 3000,
      });
    }
  };

  const resumeRecording = () => {
    try {
      console.log('RecordingContext: Attempting to resume recording');
      recordingService.resumeRecording();
      toast.info('Recording resumed', {
        duration: 2000,
      });
    } catch (error) {
      console.error('RecordingContext: Failed to resume recording:', error);
      toast.error('Failed to resume recording', {
        duration: 3000,
      });
    }
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openRecordingModal = () => setIsRecordingModalOpen(true);
  const closeRecordingModal = () => setIsRecordingModalOpen(false);
  const openStopConfirmation = () => setIsStopConfirmationOpen(true);
  const closeStopConfirmation = () => setIsStopConfirmationOpen(false);
  
  const showNotification = (type: 'ended' | 'uploaded') => {
    setNotificationState({
      isVisible: true,
      type
    });
  };
  
  const hideNotification = () => {
    setNotificationState({
      isVisible: false,
      type: null
    });
  };

  const value: RecordingContextType = {
    recordingState,
    isUploadModalOpen,
    isRecordingModalOpen,
    isStopConfirmationOpen,
    notificationState,
    startRecording,
    stopRecording,
    confirmStopRecording,
    pauseRecording,
    resumeRecording,
    openUploadModal,
    closeUploadModal,
    openRecordingModal,
    closeRecordingModal,
    openStopConfirmation,
    closeStopConfirmation,
    showNotification,
    hideNotification,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
}