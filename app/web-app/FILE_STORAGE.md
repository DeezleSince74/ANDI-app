# File Storage System

This document describes the local file storage implementation for the ANDI web application, designed to simulate cloud storage behavior during development.

## Overview

The file storage system handles:
- **Profile photos** (images) with automatic resizing and optimization
- **Voice samples** (audio) for teacher onboarding
- **File serving** with proper HTTP headers and caching

## Directory Structure

```
uploads/
├── images/          # Profile photos and images
├── audio/           # Voice recordings and audio files
└── temp/            # Temporary files (if needed)
```

## API Endpoints

### Image Upload
```
POST /api/upload/image
Content-Type: multipart/form-data
Authentication: Required

Body:
- image: File (required)

Response:
{
  "success": true,
  "file": {
    "filename": "uuid.jpg",
    "url": "/api/files/images/uuid.jpg",
    "size": 12345,
    "type": "image"
  }
}
```

### Audio Upload
```
POST /api/upload/audio
Content-Type: multipart/form-data
Authentication: Required

Body:
- audio: File (required)

Response:
{
  "success": true,
  "file": {
    "filename": "uuid.webm",
    "url": "/api/files/audio/uuid.webm", 
    "size": 54321,
    "type": "audio",
    "mimetype": "audio/webm"
  }
}
```

### File Serving
```
GET /api/files/{type}/{filename}

Parameters:
- type: "images" | "audio"
- filename: The file identifier

Response:
- File content with proper headers
- Content-Type based on file extension
- Cache-Control: public, max-age=31536000
- ETag for caching
```

## File Processing

### Images
- **Automatic resizing**: 400x400px for profile photos
- **Format conversion**: All images saved as JPEG
- **Optimization**: 85% quality compression
- **Auto-rotation**: Based on EXIF data
- **Size limit**: 5MB maximum

### Audio
- **Supported formats**: WebM, WAV, MP3, OGG
- **No processing**: Files stored as-is
- **Size limit**: 10MB maximum
- **Voice samples**: Combined recordings from multiple phrases

## Configuration

Environment variables in `.env.local`:

```env
# Local File Storage (for development)
STORAGE_PROVIDER="local"
MAX_IMAGE_SIZE="5242880"    # 5MB in bytes
MAX_AUDIO_SIZE="10485760"   # 10MB in bytes
```

## Security Features

- **Authentication required**: All uploads require valid session
- **File type validation**: MIME type checking
- **Size limits**: Configurable maximum file sizes
- **Path sanitization**: Prevents directory traversal
- **UUID filenames**: Prevents filename collisions

## Usage in Components

### Photo Upload Component
```tsx
const formData = new FormData()
formData.append('image', selectedFile)

const response = await fetch('/api/upload/image', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// result.file.url contains the file URL
```

### Voice Recording Component
```tsx
const combinedBlob = new Blob(audioBlobs, { type: 'audio/webm' })
const formData = new FormData()
formData.append('audio', combinedBlob, 'voice-sample.webm')

const response = await fetch('/api/upload/audio', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// result.file.url contains the audio URL
```

## Migration to Cloud Storage

The API interface is designed for easy migration to cloud storage:

### For Azure Blob Storage
1. Install `@azure/storage-blob`
2. Update `src/lib/storage.ts` to use Azure APIs
3. Change environment variables:
   ```env
   STORAGE_PROVIDER="azure"
   AZURE_STORAGE_CONNECTION_STRING="..."
   AZURE_STORAGE_CONTAINER_NAME="..."
   ```

### For AWS S3
1. Install `aws-sdk`
2. Update storage implementation
3. Change environment variables:
   ```env
   STORAGE_PROVIDER="aws"
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   S3_BUCKET_NAME="..."
   ```

### For Google Cloud Storage
1. Install `@google-cloud/storage`
2. Update storage implementation
3. Change environment variables:
   ```env
   STORAGE_PROVIDER="gcp"
   GOOGLE_CLOUD_PROJECT_ID="..."
   GOOGLE_CLOUD_BUCKET_NAME="..."
   ```

## File URLs

Local development URLs follow the pattern:
```
/api/files/{type}/{uuid}.{ext}
```

Cloud storage URLs would follow provider patterns:
```
https://storage.azure.com/container/uuid.jpg
https://bucket.s3.amazonaws.com/uuid.jpg
https://storage.googleapis.com/bucket/uuid.jpg
```

The application code uses the `url` field from upload responses, making it transparent to components.

## Maintenance

### Storage Statistics
```typescript
import { getStorageStats } from '~/lib/storage'

const stats = getStorageStats()
// Returns: { images: { count, size }, audio: { count, size } }
```

### File Cleanup
```typescript
import { deleteFile } from '~/lib/storage'

const deleted = deleteFile('images', 'filename.jpg')
// Returns: boolean indicating success
```

### Development Notes
- Upload directory is in `.gitignore`
- Files are stored with UUID names to prevent conflicts
- File serving includes proper caching headers
- Error handling with user-friendly messages

This local storage system provides full functionality for development while maintaining an API interface that supports seamless migration to production cloud storage services.