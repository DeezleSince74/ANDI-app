import FormData from 'form-data';

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
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.assemblyai.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Upload audio file to Assembly AI
   */
  async uploadAudio(audioFile: Buffer | File, filename: string): Promise<string> {
    const formData = new FormData();
    
    if (audioFile instanceof Buffer) {
      formData.append('file', audioFile, filename);
    } else {
      formData.append('file', audioFile);
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        ...formData.getHeaders?.() || {},
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();
    return result.upload_url;
  }

  /**
   * Start transcription job
   */
  async startTranscription(
    uploadUrl: string, 
    options: Partial<TranscriptionOptions> = {}
  ): Promise<string> {
    const defaultOptions: TranscriptionOptions = {
      speaker_labels: true,
      auto_chapters: false,
      auto_highlights: false,
      sentiment_analysis: true,
      entity_detection: false,
      language_detection: false,
    };

    const transcriptionOptions = { ...defaultOptions, ...options };

    const response = await fetch(`${this.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        ...transcriptionOptions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription start failed: ${error}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Get transcription result
   */
  async getTranscript(transcriptId: string): Promise<TranscriptResult> {
    const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get transcript failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Poll transcription status until completion
   */
  async pollTranscriptionStatus(
    transcriptId: string,
    maxRetries: number = 60,
    intervalMs: number = 5000
  ): Promise<TranscriptResult> {
    let retries = 0;

    while (retries < maxRetries) {
      const transcript = await this.getTranscript(transcriptId);

      if (transcript.status === 'completed') {
        return transcript;
      }

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.id}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      retries++;
    }

    throw new Error(`Transcription timed out after ${maxRetries} retries`);
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
   * Delete transcript
   */
  async deleteTranscript(transcriptId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Delete transcript failed: ${error}`);
    }
  }
}