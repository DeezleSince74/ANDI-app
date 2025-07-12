# ANDI Recording Architecture Documentation

## Project Context
This document captures the complete architecture plan for implementing browser-based classroom recording functionality in the ANDI platform. The recording system is designed to capture 30-90 minute classroom sessions for analysis by AssemblyAI.

## Requirements Summary

### Core Requirements
- **Browser-based recording** using MediaRecorder API
- **Durable recording** that persists through internet connection loss
- **Long duration support** for 30-90 minute classroom sessions
- **Post-class upload** to ANDI API endpoint with teacher ID
- **Smart class end detection** to prevent unnecessarily long recordings
- **Duration selection** with preset buttons (30, 45, 60, 90 minutes + 5-minute buffer)

### Processing Pipeline Integration
- **Upload Target**: ANDI API endpoint with teacher ID and recording metadata
- **Processing Queue**: Server-side queue system picks up recordings
- **Langflow Integration**: Recordings sent to Langflow infrastructure for processing
- **AssemblyAI Processing**: Langflow flow handles speech-to-text via AssemblyAI
- **Target format**: **WebM with Opus codec** (directly supported by AssemblyAI)
- **Optimal settings**: 32kbps, 16kHz, mono for speech
- File size estimates:
  - 35 min (30+5): ~10MB
  - 50 min (45+5): ~14MB  
  - 65 min (60+5): ~18MB
  - 95 min (90+5): ~26MB

## Architecture Overview

### Technology Stack
- **MediaRecorder API** - Browser-based recording
- **IndexedDB** - Offline-capable local storage (50%+ of disk space available)
- **Service Worker** - Background processing and offline functionality
- **Web Workers** - Audio processing without blocking UI
- **WebCodecs API** - Optional efficient audio compression

### Data Flow Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   MediaRecorder │────▶│  IndexedDB   │────▶│Upload Queue │
│   (Browser API) │     │(Local Storage)│     │  (Retry)    │
└─────────────────┘     └──────────────┘     └─────────────┘
                                 │                      │
                                 ▼                      ▼
                          ┌──────────────┐      ┌─────────────┐
                          │Service Worker│      │ ANDI API    │
                          │  (Offline)   │      │ Endpoint    │
                          └──────────────┘      └─────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │Processing   │
                                                │Queue        │
                                                └─────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │ Langflow    │
                                                │Infrastructure│
                                                └─────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │ AssemblyAI  │
                                                │ Processing  │
                                                └─────────────┘
```

### Recording Configuration
```javascript
const mediaRecorderOptions = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 32000  // 32kbps for speech
};

const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000
};
```

## Duration Selection Feature

### UI Design
```
┌─────────────────────────────────────┐
│  Select Class Duration:             │
│                                     │
│  [30 min]  [45 min]  [60 min]  [90 min] │
│   +5 min    +5 min    +5 min    +5 min  │
│                                     │
│  Total recording time: 35 minutes   │
│  ⏺ Start Recording                  │
└─────────────────────────────────────┘
```

### Duration Options
- **30 minutes** → 35 minutes total (includes 5-min buffer)
- **45 minutes** → 50 minutes total (includes 5-min buffer)
- **60 minutes** → 65 minutes total (includes 5-min buffer)
- **90 minutes** → 95 minutes total (includes 5-min buffer)

### Timer Logic
- Auto-stop recording after selected duration + 5 minutes
- Visual countdown showing remaining time
- Warning notifications at 5-minute and 1-minute marks
- Manual stop override always available

## Smart Class End Detection

### Detection Strategies (Multiple parallel approaches)
1. **Silence Detection** - 5+ minutes of ambient noise only
2. **Time-based** - Configurable class periods (primary: duration selection)
3. **Schedule Integration** - Connect to school bell schedules (future)
4. **Audio Level Analysis** - No significant audio changes for extended period
5. **Manual Override** - Teacher can always stop manually

## Implementation Plan

### Phase 1: Core Recording Infrastructure (HIGH PRIORITY)
1. **Service Worker Setup**
   - Register service worker for offline capability
   - Implement background sync for uploads
   - Cache critical assets

2. **IndexedDB Storage Layer**
   - Create database schema for recordings
   - Implement chunked storage (5MB chunks)
   - Add metadata tracking (duration, timestamps, selected duration)

3. **Recording Service**
   - Wrapper around MediaRecorder API
   - Audio quality configuration optimized for Langflow/AssemblyAI
   - Real-time duration tracking
   - Pause/resume capability
   - Teacher ID integration for upload metadata

4. **Duration Selection UI**
   - Four preset buttons (30, 45, 60, 90 minutes)
   - Clear display of total time including 5-minute buffer
   - One-click start functionality

5. **Timer Logic**
   - Countdown timer based on selected duration
   - Automatic stop after duration + 5 minutes
   - Visual progress indicators

### Phase 2: Smart Recording Features (MEDIUM PRIORITY)
1. **Audio Analysis Worker**
   - Real-time silence detection
   - Audio level monitoring
   - Basic voice activity detection

2. **Class End Detection**
   - Configurable detection rules
   - Teacher preferences integration
   - Notification system

3. **Recording State Management**
   - State store for recording status
   - Persistent state across page refreshes
   - Multi-tab synchronization

### Phase 3: Upload & Processing (MEDIUM PRIORITY)
1. **Upload Queue System**
   - Priority queue for uploads
   - Retry mechanism with exponential backoff
   - Progress tracking

2. **Chunk Upload Strategy**
   - Split large files into 5MB chunks
   - Parallel chunk uploads
   - Resume capability

3. **ANDI API Integration**
   - Upload to ANDI API endpoint with teacher ID
   - Include recording metadata (duration, timestamp, class info)
   - Add chunked upload support for large files
   - Implement file assembly on server side

### Phase 4: UI/UX Polish (LOW PRIORITY)
1. **Enhanced Recording Interface**
   - Floating recording widget
   - Visual audio levels
   - Status indicators

2. **Session Management**
   - List of pending uploads
   - Upload progress
   - Retry controls

3. **Settings & Preferences**
   - Audio quality settings
   - Auto-stop preferences
   - Default duration selection

## Technical Considerations

### Browser Compatibility
- **Chrome/Edge**: Full support for all features
- **Firefox**: Full support for all features
- **Safari**: Limited (no background sync, requires workarounds)
- **Mobile**: Requires screen to stay on during recording

### Storage Management
- **IndexedDB Capacity**: 50% of free disk space
- **Warning System**: Alert at 80% usage
- **Auto-cleanup**: Remove uploaded recordings automatically
- **Chunk Strategy**: 5MB chunks for large file handling

### Security & Privacy
- All recordings encrypted at rest in IndexedDB
- Teacher consent required before recording
- Student privacy protection (no identifying audio stored longer than necessary)
- FERPA compliance for educational recordings

### Performance Optimizations
- Use Opus codec for maximum compression
- Implement audio downsampling to 16kHz (AssemblyAI requirement)
- Background processing via Web Workers
- Efficient memory management for long recordings

### Error Handling & Recovery
- Graceful degradation if storage is full
- Recovery from browser crashes during recording
- Retry mechanisms for failed uploads
- Clear error messages for teachers

## File Structure Plan
```
src/
├── components/
│   └── recording/
│       ├── RecordingWidget.tsx          # Main recording interface
│       ├── DurationSelector.tsx         # Duration selection buttons
│       ├── RecordingTimer.tsx          # Countdown timer display
│       └── UploadProgress.tsx          # Upload status display
├── services/
│   ├── RecordingService.ts             # MediaRecorder wrapper
│   ├── StorageService.ts               # IndexedDB operations
│   ├── UploadService.ts                # Upload queue management
│   └── AudioAnalysisWorker.ts          # Web Worker for audio analysis
├── stores/
│   └── recordingStore.ts               # State management
└── workers/
    └── recording-sw.js                 # Service Worker
```

## Next Steps
1. Begin with Phase 1 implementation
2. Start with Service Worker setup for offline capability
3. Implement IndexedDB storage layer
4. Create recording service wrapper
5. Build duration selection UI
6. Add timer logic with automatic stop

## Success Metrics
- Recordings complete successfully for 95%+ of classroom sessions
- Average file size under 20MB for 60-minute sessions
- Upload success rate of 98%+ when internet is available
- Teacher satisfaction with one-click recording start
- Zero data loss during connection interruptions

---

*Last Updated: July 12, 2025*
*Status: Architecture Complete, Ready for Implementation*