import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { AssemblyAIService } from '@/services/ai/AssemblyAIService';
import { auth } from '@/server/auth';

/**
 * ANDI Recording Upload API Endpoint
 * Handles classroom recording uploads with teacher ID and metadata
 * Triggers AI analysis pipeline for transcription and CIQ analysis
 */

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    // Parse form data
    const formData = await request.formData();
    
    // Extract recording metadata
    const teacherId = formData.get('teacherId') as string || user.id;
    const duration = parseInt(formData.get('duration') as string) || 0;
    const selectedDuration = parseInt(formData.get('selectedDuration') as string) || 0;
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

    // Start AI analysis with Assembly AI
    try {
      const apiKey = process.env.ASSEMBLY_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Assembly AI API key not configured');
      }

      const assemblyAI = new AssemblyAIService(apiKey);
      
      // Read the file buffer
      const fileBuffer = await readFile(filePath);
      
      // Upload to Assembly AI
      console.log('Uploading to Assembly AI...');
      const uploadUrl = await assemblyAI.uploadAudio(fileBuffer, fileName);
      
      // Start transcription
      console.log('Starting transcription...');
      const transcriptId = await assemblyAI.startTranscription(uploadUrl, {
        speaker_labels: true,
        sentiment_analysis: true,
        auto_highlights: true,
        language_detection: true,
      });

      console.log(`Transcription started with ID: ${transcriptId}`);

      // Create session ID for tracking
      const sessionId = `analysis_${recordingId}`;

      // TODO: Save to database
      // await db.recording.create({
      //   data: {
      //     ...recordingMetadata,
      //     sessionId,
      //     transcriptId,
      //   }
      // });

      return NextResponse.json({
        success: true,
        recordingId,
        sessionId,
        transcriptId,
        message: 'Recording uploaded and transcription started',
        metadata: {
          fileName,
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
      
      // Still return success for upload, but indicate analysis failed to start
      return NextResponse.json({
        success: true,
        recordingId,
        message: 'Recording uploaded successfully, but transcription failed to start',
        metadata: {
          fileName,
          fileSize: audioFile.size,
          duration,
          selectedDuration,
          uploadedAt: recordingMetadata.uploadedAt,
        },
        analysisError: aiError instanceof Error ? aiError.message : 'Failed to start transcription',
      });
    }

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