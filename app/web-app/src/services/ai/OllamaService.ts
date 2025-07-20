import { TranscriptResult } from './AssemblyAIService';

export interface ECIComponentScore {
  score: number; // 0-10
  evidence: string[];
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface ECIComponentScores {
  [componentId: string]: ECIComponentScore;
}

export interface ParticipationMetrics {
  teacherTalkPercentage: number;
  studentTalkPercentage: number;
  studentQuestionCount: number;
  teacherQuestionCount: number;
  bloomTaxonomyLevels: Record<string, number>;
  speakerDistribution: Record<string, number>;
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  engagementScore: number;
}

export interface EvidenceExample {
  component: string;
  quote: string;
  timestamp: number;
  speaker: string;
  impact: 'positive' | 'neutral' | 'needs_improvement';
}

export interface CIQAnalysisResult {
  sessionId: string;
  overallScore: number;
  components: {
    equity: ECIComponentScores; // E1-E5
    creativity: ECIComponentScores; // C6-C10
    innovation: ECIComponentScores; // I11-I15
  };
  participationMetrics: ParticipationMetrics;
  sentimentAnalysis: SentimentAnalysis;
  evidenceExamples: EvidenceExample[];
  analysisTimestamp: Date;
  modelVersion: string;
}

export interface StrengthArea {
  area: string;
  evidence: string;
  impact: string;
}

export interface GrowthOpportunity {
  area: string;
  currentState: string;
  recommendedAction: string;
  implementationSteps: string[];
  successIndicators: string[];
  timeline: string;
}

export interface PersonalizedRecommendation {
  recommendation: string;
  rationale: string;
  researchBasis: string;
  implementationSteps: string[];
  successIndicators: string[];
}

export interface CoachingResult {
  strengths: StrengthArea[];
  growthOpportunities: GrowthOpportunity[];
  personalizedRecommendations: PersonalizedRecommendation[];
  celebrationPoints: string[];
  coachingTimestamp: Date;
  modelVersion: string;
}

export interface RealtimeInsight {
  quickInsight: string;
  pattern: string;
  suggestion: string;
  successIndicator: string;
  timestamp: Date;
}

export interface OllamaModelConfig {
  ciqAnalyzer: string;
  coach: string;
  realtime: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private readonly baseUrl: string;
  private readonly models: OllamaModelConfig;

  constructor(baseUrl: string = 'http://localhost:11434', models?: Partial<OllamaModelConfig>) {
    this.baseUrl = baseUrl;
    this.models = {
      ciqAnalyzer: 'andi-ciq-analyzer',
      coach: 'andi-coach',
      realtime: 'andi-realtime',
      ...models,
    };
  }

  /**
   * Generate response from Ollama model
   */
  private async generateResponse(
    model: string,
    prompt: string,
    stream: boolean = false
  ): Promise<OllamaResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Analyze transcript using CIQ framework
   */
  async analyzeTranscript(
    transcript: TranscriptResult,
    sessionId: string
  ): Promise<CIQAnalysisResult> {
    // Prepare transcript data for analysis
    const transcriptText = this.formatTranscriptForAnalysis(transcript);
    
    const prompt = `
Please analyze this Assembly AI classroom transcript using the complete CIQ framework.

TRANSCRIPT DATA:
${transcriptText}

ANALYSIS REQUIREMENTS:
- Analyze all 15 ECI components (E1-E5, C6-C10, I11-I15)
- Provide specific evidence with timestamps and quotes
- Calculate participation metrics and sentiment analysis
- Give scores from 0-10 for each component
- Include actionable recommendations

Please respond with a valid JSON object following the CIQAnalysisResult structure.
    `;

    try {
      const response = await this.generateResponse(this.models.ciqAnalyzer, prompt);
      
      // Parse the JSON response
      const analysisData = JSON.parse(response.response);
      
      return {
        sessionId,
        overallScore: analysisData.overallScore || 0,
        components: analysisData.components || { equity: {}, creativity: {}, innovation: {} },
        participationMetrics: analysisData.participationMetrics || this.calculateParticipationMetrics(transcript),
        sentimentAnalysis: analysisData.sentimentAnalysis || this.calculateSentimentAnalysis(transcript),
        evidenceExamples: analysisData.evidenceExamples || [],
        analysisTimestamp: new Date(),
        modelVersion: this.models.ciqAnalyzer,
      };
    } catch (error) {
      console.error('Error analyzing transcript:', error);
      throw new Error(`CIQ analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate coaching recommendations
   */
  async generateCoaching(
    analysis: CIQAnalysisResult,
    transcript: TranscriptResult
  ): Promise<CoachingResult> {
    const prompt = `
Based on this CIQ analysis and classroom transcript, provide personalized coaching feedback.

CIQ ANALYSIS SUMMARY:
- Overall Score: ${analysis.overallScore}
- Equity Average: ${this.getAverageScore(analysis.components.equity)}
- Creativity Average: ${this.getAverageScore(analysis.components.creativity)}
- Innovation Average: ${this.getAverageScore(analysis.components.innovation)}

KEY EVIDENCE:
${analysis.evidenceExamples.map(e => `- ${e.component}: "${e.quote}" (${e.impact})`).join('\n')}

COACHING REQUIREMENTS:
- Start with celebrating specific strengths (evidence-based)
- Identify 1-2 priority growth areas
- Provide research-based recommendations with implementation steps
- Include success indicators and timeline
- Use supportive, non-evaluative language

Please respond with a valid JSON object following the CoachingResult structure.
    `;

    try {
      const response = await this.generateResponse(this.models.coach, prompt);
      const coachingData = JSON.parse(response.response);

      return {
        strengths: coachingData.strengths || [],
        growthOpportunities: coachingData.growthOpportunities || [],
        personalizedRecommendations: coachingData.personalizedRecommendations || [],
        celebrationPoints: coachingData.celebrationPoints || [],
        coachingTimestamp: new Date(),
        modelVersion: this.models.coach,
      };
    } catch (error) {
      console.error('Error generating coaching:', error);
      throw new Error(`Coaching generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze real-time transcript segment
   */
  async analyzeRealtime(transcriptSegment: string): Promise<RealtimeInsight> {
    const prompt = `
Analyze this live classroom transcript segment and provide immediate insights:

SEGMENT: "${transcriptSegment}"

Provide quick, actionable feedback in the structured format (under 75 words total).
Focus on participation patterns, voice elevation, and immediate suggestions.
    `;

    try {
      const response = await this.generateResponse(this.models.realtime, prompt);
      
      // Parse the structured response
      const lines = response.response.split('\n').filter(line => line.trim());
      
      return {
        quickInsight: this.extractInsightLine(lines, '🎯') || 'Analyzing classroom interaction',
        pattern: this.extractInsightLine(lines, '📊') || 'Monitoring participation patterns',
        suggestion: this.extractInsightLine(lines, '💡') || 'Continue current approach',
        successIndicator: this.extractInsightLine(lines, '⚡') || 'Watch for student engagement',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error in realtime analysis:', error);
      throw new Error(`Realtime analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  // Helper methods

  private formatTranscriptForAnalysis(transcript: TranscriptResult): string {
    if (!transcript.utterances || transcript.utterances.length === 0) {
      return transcript.text || '';
    }

    return transcript.utterances
      .map(utterance => {
        const timestamp = Math.floor(utterance.start / 1000);
        const minutes = Math.floor(timestamp / 60);
        const seconds = timestamp % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return `[${timeStr}] ${utterance.speaker}: ${utterance.text}`;
      })
      .join('\n');
  }

  private calculateParticipationMetrics(transcript: TranscriptResult): ParticipationMetrics {
    if (!transcript.utterances) {
      return {
        teacherTalkPercentage: 0,
        studentTalkPercentage: 0,
        studentQuestionCount: 0,
        teacherQuestionCount: 0,
        bloomTaxonomyLevels: {},
        speakerDistribution: {},
      };
    }

    const speakerStats: Record<string, { duration: number; utterances: number }> = {};
    let totalDuration = 0;

    transcript.utterances.forEach(utterance => {
      const duration = utterance.end - utterance.start;
      totalDuration += duration;

      if (!speakerStats[utterance.speaker]) {
        speakerStats[utterance.speaker] = { duration: 0, utterances: 0 };
      }
      speakerStats[utterance.speaker].duration += duration;
      speakerStats[utterance.speaker].utterances += 1;
    });

    // Simple heuristic: assume speaker "A" or speakers with longest talk time are teachers
    const speakers = Object.entries(speakerStats);
    const teacherSpeaker = speakers.reduce((prev, curr) => 
      curr[1].duration > prev[1].duration ? curr : prev
    )[0];

    const teacherDuration = speakerStats[teacherSpeaker]?.duration || 0;
    const studentDuration = totalDuration - teacherDuration;

    return {
      teacherTalkPercentage: totalDuration > 0 ? (teacherDuration / totalDuration) * 100 : 0,
      studentTalkPercentage: totalDuration > 0 ? (studentDuration / totalDuration) * 100 : 0,
      studentQuestionCount: this.countQuestions(transcript.utterances, teacherSpeaker, false),
      teacherQuestionCount: this.countQuestions(transcript.utterances, teacherSpeaker, true),
      bloomTaxonomyLevels: {},
      speakerDistribution: Object.fromEntries(
        speakers.map(([speaker, stats]) => [
          speaker,
          totalDuration > 0 ? (stats.duration / totalDuration) * 100 : 0
        ])
      ),
    };
  }

  private calculateSentimentAnalysis(transcript: TranscriptResult): SentimentAnalysis {
    if (!transcript.sentiment_analysis_results) {
      return {
        overallSentiment: 'neutral',
        sentimentBreakdown: { positive: 0, neutral: 100, negative: 0 },
        engagementScore: 5,
      };
    }

    const sentiments = transcript.sentiment_analysis_results;
    const total = sentiments.length;
    
    const counts = sentiments.reduce(
      (acc, s) => {
        acc[s.sentiment.toLowerCase() as keyof typeof acc]++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const percentages = {
      positive: (counts.positive / total) * 100,
      neutral: (counts.neutral / total) * 100,
      negative: (counts.negative / total) * 100,
    };

    const overallSentiment = 
      percentages.positive > percentages.negative ? 'positive' :
      percentages.negative > percentages.positive ? 'negative' : 'neutral';

    return {
      overallSentiment,
      sentimentBreakdown: percentages,
      engagementScore: Math.min(10, (percentages.positive / 10) + 5),
    };
  }

  private countQuestions(utterances: any[], teacherSpeaker: string, isTeacher: boolean): number {
    return utterances.filter(u => 
      (isTeacher ? u.speaker === teacherSpeaker : u.speaker !== teacherSpeaker) &&
      u.text.includes('?')
    ).length;
  }

  private getAverageScore(components: ECIComponentScores): number {
    const scores = Object.values(components).map(c => c.score);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  private extractInsightLine(lines: string[], emoji: string): string | null {
    const line = lines.find(l => l.includes(emoji));
    if (!line) return null;
    
    const parts = line.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : null;
  }
}