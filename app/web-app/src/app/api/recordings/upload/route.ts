import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { auth } from '@/server/auth';
import { createRecording } from '~/db/repositories/recordings';
import { enqueueTranscription } from '~/lib/queue/recording-queue';
import type { CreateRecordingSession } from '~/db/types';

/**
 * ANDI Recording Upload API Endpoint
 * Handles classroom recording uploads with teacher ID and metadata
 * Triggers AI analysis pipeline for transcription and CIQ analysis
 */

export async function POST(request: NextRequest) {
  console.log('🔄 [UPLOAD API] Starting upload request...');
  
  try {
    // Check authentication
    const session = await auth();
    console.log('🔑 [UPLOAD API] Session check:', session ? 'Found' : 'Missing');
    
    if (!session?.user) {
      console.log('❌ [UPLOAD API] Authentication failed - no session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    console.log('👤 [UPLOAD API] User:', user.email);

    // Parse form data
    const formData = await request.formData();
    console.log('📊 [UPLOAD API] Form data keys:', Array.from(formData.keys()));
    
    // Extract recording metadata
    const teacherId = formData.get('teacherId') as string || user.id;
    const duration = parseInt(formData.get('duration') as string) || 0;
    const selectedDuration = parseInt(formData.get('selectedDuration') as string) || 0;
    const timestamp = formData.get('timestamp') as string;
    const recordingId = formData.get('recordingId') as string;
    const displayName = formData.get('displayName') as string || 'Untitled Recording';
    const audioFile = formData.get('audio') as File;
    
    console.log('📋 [UPLOAD API] Metadata:', {
      teacherId,
      duration,
      selectedDuration,
      timestamp,
      recordingId,
      displayName,
      audioFileName: audioFile?.name,
      audioFileSize: audioFile?.size,
      audioFileType: audioFile?.type
    });

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
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4a-latm',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/vnd.wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/aac',
      'audio/x-ms-wma',
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
      displayName,
      fileName,
      filePath: filePath,
      fileSize: audioFile.size,
      mimeType: audioFile.type,
      duration, // actual recording duration in seconds
      selectedDuration, // user-selected duration in seconds
      timestamp,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      processingStatus: 'pending',
    };

    console.log('Recording uploaded successfully:', recordingMetadata);

    // Create session ID for tracking
    const sessionId = `session_${recordingId}`;

    // Save recording session to database (without transcript ID initially)
    const recordingData: CreateRecordingSession = {
      sessionId,
      userId: user.id,
      title: displayName,
      description: `Recording uploaded on ${new Date().toLocaleDateString()}`,
      audioUrl: filePath,
      duration,
      status: 'pending', // Will be updated to 'transcribing' when queue picks it up
      metadata: {
        originalFileName: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        selectedDuration,
        uploadedAt: recordingMetadata.uploadedAt,
        processingStatus: 'queued'
      }
    };
    await createRecording(recordingData);

    // Enqueue for robust background processing
    try {
      console.log('🎯 [UPLOAD API] Enqueuing transcription job...');
      const jobId = await enqueueTranscription(
        sessionId,
        filePath, // Use local file path for now
        user.id,
        fileName,
        'normal' // Could be 'high' for premium users
      );
      
      console.log(`✅ [UPLOAD API] Transcription job ${jobId} enqueued for session ${sessionId}`);

      return NextResponse.json({
        success: true,
        recordingId,
        sessionId,
        transcriptId,
        message: 'Recording uploaded and transcription started',
        metadata: {
          fileName,
          displayName,
          fileSize: audioFile.size,
          duration,
          selectedDuration,
          uploadedAt: recordingMetadata.uploadedAt,
        },
        analysis: {
          sessionId,
          transcriptId,
          status: 'transcribing',
          message: 'Audio transcription in progress. This may take a few minutes.',
        },
      });

    } catch (aiError) {
      console.error('Assembly AI error:', aiError);
      
      // Still save to database but mark as failed
      const sessionId = `session_${recordingId}`;
      
      try {
        const failedRecordingData: CreateRecordingSession = {
          sessionId,
          userId: user.id,
          title: displayName,
          description: `Recording uploaded on ${new Date().toLocaleDateString()} (transcription failed)`,
          audioUrl: filePath,
          duration,
          status: 'failed',
          metadata: {
            originalFileName: audioFile.name,
            fileSize: audioFile.size,
            mimeType: audioFile.type,
            selectedDuration,
            uploadedAt: recordingMetadata.uploadedAt,
            processingStatus: 'failed',
            errorMessage: aiError instanceof Error ? aiError.message : 'Failed to start transcription'
          }
        };
        await createRecording(failedRecordingData);
      } catch (dbError) {
        console.error('Failed to save recording to database:', dbError);
      }
      
      // Still return success for upload, but indicate analysis failed to start
      return NextResponse.json({
        success: true,
        recordingId,
        sessionId,
        message: 'Recording uploaded successfully, but transcription failed to start',
        metadata: {
          fileName,
          displayName,
          fileSize: audioFile.size,
          duration,
          selectedDuration,
          uploadedAt: recordingMetadata.uploadedAt,
        },
        analysisError: aiError instanceof Error ? aiError.message : 'Failed to start transcription',
      });
    }

  } catch (error) {
    console.error('❌ [UPLOAD API] Critical error:', error);
    console.error('❌ [UPLOAD API] Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
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
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}