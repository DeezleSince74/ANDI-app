/**
 * ANDI Recording Service
 * Wrapper around MediaRecorder API optimized for classroom recordings
 */

import { storageService, RecordingMetadata } from './StorageService';

export interface RecordingConfig {
  selectedDuration: number; // Duration in minutes (30, 45, 60, 90)
  teacherId: string;
  displayName: string; // User-provided name for the recording
  autoStop?: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // Current recording duration in seconds
  selectedDuration: number; // Selected duration + buffer in minutes
  remainingTime: number; // Time remaining in seconds
  recordingId: string | null;
  audioLevel: number; // Current audio level (0-100)
  status: 'idle' | 'recording' | 'paused' | 'stopping' | 'processing' | 'error';
  error?: string;
}

export type RecordingEventType = 
  | 'stateChanged'
  | 'audioLevelChanged' 
  | 'timeWarning'
  | 'autoStopped'
  | 'recordingSaved'
  | 'error';

export interface RecordingEvent {
  type: RecordingEventType;
  data?: any;
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recordingChunks: Blob[] = [];
  private startTime: number = 0;
  private pausedDuration: number = 0; // Track total paused time
  private pauseStartTime: number = 0; // Track when pause started
  private recordingInterval: number | null = null;
  private audioLevelInterval: number | null = null;
  private config: RecordingConfig | null = null;
  private serviceWorker: ServiceWorker | null = null;

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    selectedDuration: 0,
    remainingTime: 0,
    recordingId: null,
    audioLevel: 0,
    status: 'idle'
  };

  private eventListeners: Map<RecordingEventType, Set<(event: RecordingEvent) => void>> = new Map();

  constructor() {
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for offline functionality
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/recording-sw.js');
        console.log('Recording Service Worker registered:', registration);
        
        // Get active service worker
        this.serviceWorker = registration.active || registration.waiting || registration.installing;
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, recordingId, error } = event.data;
    
    switch (type) {
      case 'UPLOAD_SUCCESS':
        this.emit('recordingSaved', { recordingId, success: true });
        break;
      case 'UPLOAD_FAILED':
        this.emit('error', { recordingId, error, type: 'upload_failed' });
        break;
    }
  }

  /**
   * Get optimal recording format for browser
   */
  private getOptimalFormat(): { mimeType: string; extension: string } {
    const formats = [
      { mimeType: 'audio/webm;codecs=opus', extension: '.webm' },
      { mimeType: 'audio/ogg;codecs=opus', extension: '.ogg' },
      { mimeType: 'audio/mp4', extension: '.m4a' },
      { mimeType: 'audio/wav', extension: '.wav' }
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        return format;
      }
    }

    throw new Error('No supported audio format found');
  }

  /**
   * Initialize audio context and recording setup
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Request microphone access with optimized settings for speech
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for AssemblyAI
          channelCount: 1 // Mono recording
        }
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio analysis for level monitoring
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // Set up MediaRecorder with optimal settings
      const format = this.getOptimalFormat();
      const options = {
        mimeType: format.mimeType,
        audioBitsPerSecond: 32000 // 32kbps optimal for speech
      };

      this.mediaRecorder = new MediaRecorder(this.audioStream, options);
      this.setupMediaRecorderEvents();

      console.log('Audio initialized successfully:', format.mimeType);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw new Error(`Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up MediaRecorder event handlers
   */
  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordingChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('MediaRecorder onstart event fired');
      // Timer and monitoring are now started immediately in startRecording()
      // to avoid timing issues with the onstart event
    };

    this.mediaRecorder.onstop = () => {
      console.log('MediaRecorder stopped');
      this.stopRecordingTimer();
      this.stopAudioLevelMonitoring();
      this.processRecordingData();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.handleError('Recording failed: MediaRecorder error');
    };
  }

  /**
   * Start recording with specified configuration
   */
  async startRecording(config: RecordingConfig): Promise<void> {
    try {
      if (this.state.isRecording) {
        throw new Error('Recording already in progress');
      }

      this.config = config;
      this.recordingChunks = [];
      this.pausedDuration = 0;
      this.pauseStartTime = 0;
      
      // Initialize audio if not already done
      if (!this.audioStream || !this.mediaRecorder) {
        await this.initializeAudio();
      }

      // Generate unique recording ID
      const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate total duration including buffer
      const totalDurationMinutes = config.selectedDuration + 5; // Add 5-minute buffer
      const totalDurationSeconds = totalDurationMinutes * 60;

      // Update state
      this.state = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        selectedDuration: totalDurationMinutes,
        remainingTime: totalDurationSeconds,
        recordingId,
        audioLevel: 0,
        status: 'recording'
      };

      // Start recording
      console.log('About to start MediaRecorder...');
      this.mediaRecorder!.start(1000); // Collect data every second
      console.log('MediaRecorder.start() called');
      
      // Manually set start time and start timer immediately
      // Don't wait for onstart event as it might not fire reliably
      this.startTime = Date.now();
      console.log('Set startTime to:', this.startTime);
      this.startRecordingTimer();
      this.startAudioLevelMonitoring();
      
      // Create a new state object to trigger React re-renders
      this.emit('stateChanged', { state: { ...this.state } });
      console.log(`Recording started: ${recordingId} (${totalDurationMinutes} minutes)`);

    } catch (error) {
      this.handleError(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<void> {
    try {
      if (!this.state.isRecording) {
        throw new Error('No recording in progress');
      }

      this.state.status = 'stopping';
      // Create a new state object to trigger React re-renders
      this.emit('stateChanged', { state: { ...this.state } });

      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      // Stop audio stream
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
      }

      console.log('Recording stopped');
    } catch (error) {
      this.handleError(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    try {
      console.log('Attempting to pause recording. Current state:', {
        isRecording: this.state.isRecording,
        isPaused: this.state.isPaused,
        status: this.state.status,
        mediaRecorderState: this.mediaRecorder?.state
      });

      if (!this.state.isRecording || this.state.isPaused) {
        throw new Error('Cannot pause: not recording or already paused');
      }

      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        this.state.isPaused = true;
        this.state.status = 'paused';
        this.pauseStartTime = Date.now(); // Track when we paused
        this.stopRecordingTimer();
        // Create a new state object to trigger React re-renders
        this.emit('stateChanged', { state: { ...this.state } });
        console.log('Recording paused successfully');
      } else {
        throw new Error('MediaRecorder is not in recording state');
      }
    } catch (error) {
      this.handleError(`Failed to pause recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    try {
      console.log('Attempting to resume recording. Current state:', {
        isRecording: this.state.isRecording,
        isPaused: this.state.isPaused,
        status: this.state.status,
        mediaRecorderState: this.mediaRecorder?.state
      });

      if (!this.state.isRecording || !this.state.isPaused) {
        throw new Error('Cannot resume: not recording or not paused');
      }

      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        // Add the paused duration to our total
        if (this.pauseStartTime > 0) {
          this.pausedDuration += Date.now() - this.pauseStartTime;
          this.pauseStartTime = 0;
        }
        this.state.isPaused = false;
        this.state.status = 'recording';
        this.startRecordingTimer();
        // Create a new state object to trigger React re-renders
        this.emit('stateChanged', { state: { ...this.state } });
        console.log('Recording resumed successfully');
      } else {
        throw new Error('MediaRecorder is not in paused state');
      }
    } catch (error) {
      this.handleError(`Failed to resume recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start recording timer
   */
  private startRecordingTimer(): void {
    console.log('Starting recording timer. Start time:', this.startTime);
    this.recordingInterval = window.setInterval(() => {
      if (this.state.isRecording && !this.state.isPaused) {
        // Calculate duration excluding paused time
        const totalElapsed = Date.now() - this.startTime;
        const actualDuration = Math.floor((totalElapsed - this.pausedDuration) / 1000);
        this.state.duration = actualDuration;
        this.state.remainingTime = Math.max(0, (this.state.selectedDuration * 60) - this.state.duration);
        
        console.log('Timer tick:', { 
          duration: this.state.duration, 
          remainingTime: this.state.remainingTime,
          isRecording: this.state.isRecording,
          isPaused: this.state.isPaused 
        });
        
        // Check for time warnings
        if (this.state.remainingTime === 300) { // 5 minutes
          this.emit('timeWarning', { remainingMinutes: 5 });
        } else if (this.state.remainingTime === 60) { // 1 minute
          this.emit('timeWarning', { remainingMinutes: 1 });
        }
        
        // Auto-stop when time expires
        if (this.state.remainingTime <= 0 && this.config?.autoStop !== false) {
          this.emit('autoStopped', { reason: 'time_expired' });
          this.stopRecording();
          return;
        }
        
        // Create a new state object to trigger React re-renders
        this.emit('stateChanged', { state: { ...this.state } });
      }
    }, 1000);
  }

  /**
   * Stop recording timer
   */
  private stopRecordingTimer(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  /**
   * Start audio level monitoring
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.audioLevelInterval = window.setInterval(() => {
      if (this.analyser && this.state.isRecording && !this.state.isPaused) {
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        this.state.audioLevel = Math.min(100, Math.floor((rms / 128) * 100));
        
        this.emit('audioLevelChanged', { level: this.state.audioLevel });
      }
    }, 100); // Update 10 times per second
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }

  /**
   * Process and save recording data
   */
  private async processRecordingData(): Promise<void> {
    try {
      this.state.status = 'processing';
      // Create a new state object to trigger React re-renders
      this.emit('stateChanged', { state: { ...this.state } });

      if (this.recordingChunks.length === 0) {
        throw new Error('No recording data available');
      }

      // Create blob from chunks
      const format = this.getOptimalFormat();
      const audioBlob = new Blob(this.recordingChunks, { 
        type: format.mimeType 
      });

      const fileName = `${this.state.recordingId}${format.extension}`;
      
      // Create metadata
      const metadata: RecordingMetadata = {
        id: this.state.recordingId!,
        teacherId: this.config!.teacherId,
        displayName: this.config!.displayName,
        duration: this.state.duration,
        selectedDuration: this.state.selectedDuration * 60, // Convert to seconds
        timestamp: new Date().toISOString(),
        fileName,
        uploadStatus: 'pending',
        retryCount: 0,
        fileSize: audioBlob.size
      };

      // Initialize storage if needed
      try {
        await storageService.init();
      } catch (error) {
        console.warn('Storage already initialized or initialization failed:', error);
      }

      // Store recording
      if (audioBlob.size > 50 * 1024 * 1024) { // > 50MB, use chunked storage
        const chunks = this.chunkBlob(audioBlob, 5 * 1024 * 1024); // 5MB chunks
        await storageService.storeRecordingChunked(metadata, chunks);
      } else {
        await storageService.storeRecording(metadata, audioBlob);
      }

      // Notify service worker
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'REGISTER_RECORDING',
          data: metadata
        });
      }

      // Store recordingId before reset
      const recordingId = this.state.recordingId;
      
      // Reset state
      this.resetState();
      
      // Emit state change so UI updates
      // Create a new state object to trigger React re-renders
      this.emit('stateChanged', { state: { ...this.state } });
      
      this.emit('recordingSaved', { 
        recordingId: recordingId,
        metadata,
        success: true 
      });

      console.log('Recording processed and saved successfully');

    } catch (error) {
      this.handleError(`Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chunk blob into smaller pieces
   */
  private chunkBlob(blob: Blob, chunkSize: number): Blob[] {
    const chunks: Blob[] = [];
    let offset = 0;
    
    while (offset < blob.size) {
      const chunk = blob.slice(offset, offset + chunkSize);
      chunks.push(chunk);
      offset += chunkSize;
    }
    
    return chunks;
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    console.error('RecordingService error:', message);
    this.state.status = 'error';
    this.state.error = message;
    this.state.isRecording = false;
    this.state.isPaused = false;
    this.resetRecordingResources();
    this.emit('error', { message });
    // Create a new state object to trigger React re-renders
    this.emit('stateChanged', { state: { ...this.state } });
  }

  /**
   * Reset recording state
   */
  private resetState(): void {
    this.state = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      selectedDuration: 0,
      remainingTime: 0,
      recordingId: null,
      audioLevel: 0,
      status: 'idle'
    };
  }

  /**
   * Reset recording resources
   */
  private resetRecordingResources(): void {
    this.stopRecordingTimer();
    this.stopAudioLevelMonitoring();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.mediaRecorder = null;
    this.recordingChunks = [];
  }

  /**
   * Add event listener
   */
  addEventListener(type: RecordingEventType, listener: (event: RecordingEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: RecordingEventType, listener: (event: RecordingEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit(type: RecordingEventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: RecordingEvent = { type, data };
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * Check if recording is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.resetRecordingResources();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const recordingService = new RecordingService();