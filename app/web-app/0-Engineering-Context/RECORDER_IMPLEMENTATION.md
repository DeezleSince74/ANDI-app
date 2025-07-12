# ANDI Recorder Implementation Guide

## Overview
The ANDI classroom recording system is a comprehensive browser-based audio recording solution that allows teachers to capture and analyze classroom sessions. This document describes the final implementation after development completion.

## System Architecture

### Core Components

#### 1. Recording Service (`/src/services/RecordingService.ts`)
- **Singleton pattern** for consistent state management across the app
- **MediaRecorder API wrapper** with optimized settings for AssemblyAI
- **Event-driven architecture** for real-time UI updates
- **Smart timer management** with pause duration tracking
- **Audio format**: WebM with Opus codec (32kbps, 16kHz)

```typescript
// Key configuration
const options = {
  audioBitsPerSecond: 32000,
  sampleRate: 16000,
  mimeType: 'audio/webm;codecs=opus'
};
```

#### 2. Storage Layer (`/src/services/StorageService.ts`)
- **IndexedDB wrapper** for offline-capable storage
- **Chunked storage** for large files (>50MB)
- **Metadata tracking** with teacher ID association
- **Automatic cleanup** and quota management

#### 3. Service Worker (`/public/recording-sw.js`)
- **Background upload queue** with retry logic
- **Offline functionality** for interrupted uploads
- **Background sync** when connection restored
- **Progress tracking** and status updates

#### 4. Global State Management (`/src/lib/recording-context.tsx`)
- **React Context** for app-wide recording state
- **Event listener management** for service updates
- **Toast notifications** for user feedback
- **Modal state coordination**

### User Interface Components

#### 1. Header Integration (`/src/components/app-header.tsx`)
- **Record button** accessible from anywhere in the app
- **Upload button** for manual file uploads
- **Modal hosting** for all recording-related dialogs

#### 2. Floating Recorder (`/src/components/recording/FloatingRecorder.tsx`)
- **Yellow floating widget** visible during recording
- **Real-time timer** with MM:SS format
- **Pause/Resume/Stop controls** with visual feedback
- **Fixed positioning** (bottom-right corner)

#### 3. Recording Modal (`/src/components/recording/RecordingModal.tsx`)
- **Duration selection** (30/45/60/90 minutes + 5-minute buffer)
- **Permission handling** for microphone access
- **Visual feedback** for recording start

#### 4. Stop Confirmation (`/src/components/recording/StopConfirmationModal.tsx`)
- **Safety warning** to prevent accidental stops
- **Current duration display** for user awareness
- **Confirm/Cancel options**

#### 5. Upload Modal (`/src/components/recording/UploadModal.tsx`)
- **Drag & drop interface** for manual uploads
- **Audio format validation**
- **Progress tracking** during upload

## User Workflow

### Starting a Recording
1. User clicks "Record" button in header
2. Recording modal opens with duration options
3. User selects duration (30/45/60/90 minutes)
4. System requests microphone permission
5. Recording starts with 5-minute buffer added
6. Floating widget appears with timer
7. Modal closes automatically

### During Recording
1. **Floating widget** shows current duration
2. **Pause/Resume** available at any time
3. **Navigation persistence** - widget stays visible across pages
4. **Time warnings** at 10, 5, and 1 minute remaining
5. **Audio level monitoring** (future enhancement)

### Stopping a Recording
1. User clicks stop button on floating widget
2. **Confirmation modal** appears with current duration
3. User confirms or cancels stop action
4. If confirmed, recording stops and saves to IndexedDB
5. **Background upload** begins automatically
6. Success/failure notifications displayed

### Automatic Features
- **Auto-stop** when duration limit reached
- **Background upload** with retry on failure
- **Offline storage** until upload possible
- **Smart cleanup** of old recordings

## Technical Implementation Details

### Audio Processing
```typescript
// MediaRecorder setup
const mediaRecorder = new MediaRecorder(stream, {
  audioBitsPerSecond: 32000,
  sampleRate: 16000,
  mimeType: 'audio/webm;codecs=opus'
});

// Optimized for AssemblyAI processing
const audioConfig = {
  format: 'webm',
  codec: 'opus',
  bitrate: '32kbps',
  sampleRate: '16kHz'
};
```

### State Management
```typescript
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  selectedDuration: number;
  recordingId: string | null;
  error: string | null;
}
```

### Event System
```typescript
// Service events
recordingService.addEventListener('stateChanged', handleStateChange);
recordingService.addEventListener('timeWarning', handleTimeWarning);
recordingService.addEventListener('autoStopped', handleAutoStop);
recordingService.addEventListener('recordingSaved', handleSaved);
```

### Upload Pipeline
1. **Local storage** in IndexedDB during recording
2. **Chunked upload** to `/api/recordings/upload`
3. **Teacher ID association** for proper routing
4. **ANDI API endpoint** processes file
5. **Langflow pipeline** handles speech-to-text
6. **AssemblyAI integration** for transcription

## Data Flow

### Recording Process
```
User Input → Recording Modal → MediaRecorder → Audio Chunks → IndexedDB → Background Upload → ANDI API → Langflow → AssemblyAI
```

### State Updates
```
MediaRecorder Events → Recording Service → Context Provider → UI Components → User Feedback
```

## File Structure
```
src/
├── services/
│   ├── RecordingService.ts      # Core recording logic
│   └── StorageService.ts        # IndexedDB operations
├── lib/
│   └── recording-context.tsx    # Global state management
├── components/
│   ├── app-header.tsx          # Header integration
│   └── recording/
│       ├── FloatingRecorder.tsx       # Floating widget
│       ├── RecordingModal.tsx         # Duration selection
│       ├── StopConfirmationModal.tsx  # Stop warning
│       └── UploadModal.tsx           # Manual upload
├── app/
│   ├── (authenticated)/
│   │   └── layout.tsx          # Provider setup
│   └── api/recordings/upload/
│       └── route.ts            # Upload endpoint
└── public/
    └── recording-sw.js         # Service worker
```

## Key Features Delivered

### ✅ Browser-Based Recording
- No plugin requirements
- Cross-browser compatibility (Chrome, Firefox, Edge)
- Modern MediaRecorder API usage

### ✅ Offline Capability
- IndexedDB storage for offline recording
- Service worker for background processing
- Automatic upload when connection restored

### ✅ Duration Management
- Preset durations (30/45/60/90 minutes)
- Automatic 5-minute buffer
- Smart auto-stop functionality

### ✅ Persistence & Navigation
- Recording continues across page navigation
- Floating widget always visible during recording
- Global state management via React Context

### ✅ User Experience
- Clear visual feedback and notifications
- Safety confirmations for critical actions
- Intuitive controls and status indicators

### ✅ Integration Ready
- AssemblyAI-optimized audio format
- ANDI API endpoint integration
- Teacher ID association for proper routing

## Performance Optimizations

### Memory Management
- Chunked recording for large files
- Automatic cleanup of processed recordings
- Efficient blob handling and disposal

### Network Efficiency
- Compressed audio format (Opus)
- Background upload with retry logic
- Chunked upload for large files

### Battery Optimization
- Efficient timer implementation
- Minimal DOM updates during recording
- Event-driven state updates only when needed

## Security Considerations

### Privacy Protection
- Local storage until upload confirmation
- Secure teacher ID association
- No cloud storage of sensitive audio data

### Permission Management
- Proper microphone permission handling
- User consent for recording activities
- Clear privacy indicators during recording

## Future Enhancements

### Planned Features
- Real-time audio level visualization
- Smart class detection for auto-stop
- Recording quality analysis
- Batch upload management
- Enhanced offline capabilities

### Technical Improvements
- Web Workers for audio processing
- WebAssembly for advanced audio analysis
- Progressive Web App (PWA) capabilities
- Enhanced error recovery mechanisms

## Testing & Validation

### Functional Testing
- ✅ Recording start/stop/pause/resume
- ✅ Duration limits and auto-stop
- ✅ Cross-page navigation persistence
- ✅ Upload and storage functionality
- ✅ Error handling and recovery

### Performance Testing
- ✅ Long duration recordings (90+ minutes)
- ✅ Memory usage monitoring
- ✅ Network interruption handling
- ✅ Battery usage optimization

## Deployment Notes

### Browser Requirements
- Modern browser with MediaRecorder support
- Microphone permission capability
- IndexedDB support for offline storage

### Server Requirements
- Node.js API for upload handling
- File storage system for recordings
- AssemblyAI integration for processing

This implementation provides a robust, user-friendly recording system that meets ANDI's requirements for classroom audio capture and analysis.