import { AssemblyAI } from 'assemblyai';

export interface TranscriptionOptions {
  speaker_labels: boolean;
  auto_chapters: boolean;
  auto_highlights: boolean;
  sentiment_analysis: boolean;
  entity_detection: boolean;
  language_detection: boolean;
  webhook_url?: string;
}

export interface TranscriptWord {
  confidence: number;
  end: number;
  speaker: string;
  start: number;
  text: string;
}

export interface TranscriptUtterance {
  confidence: number;
  end: number;
  speaker: string;
  start: number;
  text: string;
  words: TranscriptWord[];
}

export interface SentimentResult {
  text: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  start: number;
  end: number;
}

export interface TranscriptResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string;
  utterances: TranscriptUtterance[];
  sentiment_analysis_results?: SentimentResult[];
  audio_duration?: number;
  confidence?: number;
  language_code?: string;
}

export interface TranscriptionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
}

export class AssemblyAIService {
  private readonly client: AssemblyAI;

  constructor(apiKey: string) {
    this.client = new AssemblyAI({
      apiKey: apiKey,
    });
  }

  /**
   * Upload audio file to Assembly AI using official SDK
   */
  async uploadAudio(audioFile: Buffer | File, filename: string): Promise<string> {
    console.log('🔄 [AssemblyAI] Starting file upload using SDK...');
    console.log('📊 [AssemblyAI] File details:', {
      filename,
      isBuffer: audioFile instanceof Buffer,
      size: audioFile instanceof Buffer ? audioFile.length : audioFile.size,
    });

    try {
      // The SDK handles file uploads automatically
      // We just need to pass the buffer or file directly
      let uploadUrl: string;
      
      if (audioFile instanceof Buffer) {
        console.log('📤 [AssemblyAI] Uploading buffer...');
        uploadUrl = await this.client.files.upload(audioFile);
      } else {
        console.log('📤 [AssemblyAI] Uploading File object...');
        // For File objects, we need to convert to buffer first
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploadUrl = await this.client.files.upload(buffer);
      }

      console.log('✅ [AssemblyAI] Upload successful:', uploadUrl);
      return uploadUrl;
      
    } catch (error) {
      console.error('❌ [AssemblyAI] Upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start transcription job using official SDK
   */
  async startTranscription(
    uploadUrl: string, 
    options: Partial<TranscriptionOptions> = {}
  ): Promise<string> {
    console.log('🔄 [AssemblyAI] Starting transcription...');
    
    const defaultOptions = {
      speaker_labels: true,
      auto_chapters: false,
      auto_highlights: false,
      sentiment_analysis: true,
      entity_detection: false,
      language_detection: false,
    };

    const transcriptionOptions = { ...defaultOptions, ...options };
    
    console.log('📊 [AssemblyAI] Transcription options:', transcriptionOptions);

    try {
      const transcript = await this.client.transcripts.submit({
        audio: uploadUrl,
        ...transcriptionOptions,
      });

      console.log('✅ [AssemblyAI] Transcription started:', transcript.id);
      return transcript.id;
      
    } catch (error) {
      console.error('❌ [AssemblyAI] Transcription start failed:', error);
      throw new Error(`Transcription start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transcription result using official SDK
   */
  async getTranscript(transcriptId: string): Promise<TranscriptResult> {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      return transcript as TranscriptResult;
    } catch (error) {
      console.error('❌ [AssemblyAI] Get transcript failed:', error);
      throw new Error(`Get transcript failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Poll transcription status until completion using official SDK
   */
  async pollTranscriptionStatus(
    transcriptId: string,
    maxRetries: number = 60,
    intervalMs: number = 5000
  ): Promise<TranscriptResult> {
    try {
      console.log('🔄 [AssemblyAI] Polling transcription status...');
      const transcript = await this.client.transcripts.waitUntilReady(transcriptId, {
        pollingInterval: intervalMs,
        pollingTimeout: maxRetries * intervalMs,
      });
      
      console.log('✅ [AssemblyAI] Transcription completed:', transcript.id);
      return transcript as TranscriptResult;
    } catch (error) {
      console.error('❌ [AssemblyAI] Polling failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transcription status only
   */
  async getTranscriptionStatus(transcriptId: string): Promise<TranscriptionStatus> {
    const transcript = await this.getTranscript(transcriptId);
    return {
      id: transcript.id,
      status: transcript.status,
      error: transcript.status === 'error' ? 'Transcription failed' : undefined,
    };
  }

  /**
   * Delete transcript using official SDK
   */
  async deleteTranscript(transcriptId: string): Promise<void> {
    try {
      await this.client.transcripts.delete(transcriptId);
      console.log('✅ [AssemblyAI] Transcript deleted:', transcriptId);
    } catch (error) {
      console.error('❌ [AssemblyAI] Delete transcript failed:', error);
      throw new Error(`Delete transcript failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}