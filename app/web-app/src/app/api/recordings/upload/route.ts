import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * ANDI Recording Upload API Endpoint
 * Handles classroom recording uploads with teacher ID and metadata
 */

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    
    // Extract recording metadata
    const teacherId = formData.get('teacherId') as string;
    const duration = parseInt(formData.get('duration') as string);
    const selectedDuration = parseInt(formData.get('selectedDuration') as string);
    const timestamp = formData.get('timestamp') as string;
    const recordingId = formData.get('recordingId') as string;
    const audioFile = formData.get('audio') as File;

    // Validate required fields
    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg'
    ];

    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${audioFile.type}` },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB for recordings)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 100MB allowed.' },
        { status: 400 }
      );
    }

    // Create upload directory structure
    const uploadsDir = join(process.cwd(), 'uploads', 'recordings');
    const teacherDir = join(uploadsDir, teacherId);
    
    // Ensure directories exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    if (!existsSync(teacherDir)) {
      await mkdir(teacherDir, { recursive: true });
    }

    // Generate filename with timestamp
    const fileExtension = audioFile.name.split('.').pop() || 'webm';
    const fileName = `${recordingId}.${fileExtension}`;
    const filePath = join(teacherDir, fileName);

    // Save audio file
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create recording metadata for database/queue
    const recordingMetadata = {
      id: recordingId,
      teacherId,
      fileName,
      filePath: filePath,
      fileSize: audioFile.size,
      mimeType: audioFile.type,
      duration, // actual recording duration in seconds
      selectedDuration, // user-selected duration in seconds
      timestamp,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      processingStatus: 'pending' // for Langflow queue
    };

    // TODO: Add recording to processing queue
    // This is where you would:
    // 1. Save metadata to database
    // 2. Add to processing queue for Langflow
    // 3. Trigger processing workflow
    
    console.log('Recording uploaded successfully:', recordingMetadata);

    // For now, simulate adding to queue
    console.log(`Recording ${recordingId} added to processing queue for teacher ${teacherId}`);
    
    // TODO: Integrate with your database
    // Example:
    // await db.recordings.create({
    //   data: recordingMetadata
    // });
    
    // TODO: Add to Langflow processing queue
    // Example:
    // await addToProcessingQueue(recordingMetadata);

    return NextResponse.json({
      success: true,
      recordingId,
      message: 'Recording uploaded successfully',
      metadata: {
        fileName,
        fileSize: audioFile.size,
        duration,
        selectedDuration,
        uploadedAt: recordingMetadata.uploadedAt
      }
    });

  } catch (error) {
    console.error('Recording upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * TODO: Implement queue integration
 * 
 * async function addToProcessingQueue(metadata: RecordingMetadata) {
 *   // Add recording to processing queue
 *   // This could be:
 *   // - Database table with status tracking
 *   // - Redis queue
 *   // - Message queue (RabbitMQ, etc.)
 *   // - Direct API call to Langflow
 *   
 *   // Example implementation:
 *   await queueService.add('recording-processing', {
 *     recordingId: metadata.id,
 *     teacherId: metadata.teacherId,
 *     filePath: metadata.filePath,
 *     metadata
 *   });
 * }
 */