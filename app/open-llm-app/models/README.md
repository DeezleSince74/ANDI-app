# ANDI Ollama Models - Enhanced for Full CIQ Framework

This directory contains Meta Llama models optimized for comprehensive ANDI educational analysis using the complete CIQ framework.

## Enhanced Models (Version 2.0)

### 🎯 andi-ciq-analyzer (Based on Llama 3.1 8B)
**Purpose**: Comprehensive CIQ analysis using complete 15-component ECI Blueprint
**Enhanced Features**:
- **Complete ECI Analysis**: All 15 components (E1-E5, C6-C10, I11-I15)
- **Assembly AI Integration**: Optimized for transcript analysis with timestamps
- **Evidence-Based Scoring**: Requires specific quotes and examples for each score
- **JSON Output**: Structured format for database integration
- **Non-Evaluative**: Growth-focused, strength-based analysis

**ECI Components Analyzed**:
- **Equity (E1-E5)**: Identity Recognition, Psychological Safety, Access Equity, Voice Elevation, Collaboration
- **Creativity (C6-C10)**: Self-Expression, Experimentation, Active Learning, Skill Development, Imagination  
- **Innovation (I11-I15)**: Possibility Mindset, Real-World Connections, Change-Making, Impact Assessment, Continuous Improvement

**Context Window**: 8192 tokens (double previous capacity)

### 👩‍🏫 andi-coach (Based on Llama 3.1 8B)
**Purpose**: Evidence-based teacher coaching using CIQ insights
**Enhanced Features**:
- **Strengths-First Approach**: Always celebrates teacher strengths with evidence
- **Research-Based Recommendations**: Connects suggestions to educational research
- **Implementation Guidance**: Specific steps with success indicators
- **Non-Evaluative Tone**: Supportive coaching language, never judgmental
- **Resource Suggestions**: Professional development and classroom tools

**Coaching Framework**:
1. **Celebration**: Specific strengths with evidence from transcripts
2. **Focus Areas**: 1-2 priority growth opportunities based on CIQ data
3. **Evidence-Based Recommendations**: Research-backed strategies with implementation steps
4. **Resources & Support**: Professional development and collaboration opportunities

**Context Window**: 6144 tokens

### ⚡ andi-realtime (Based on Llama 3.2 3B)
**Purpose**: Fast real-time classroom monitoring and immediate insights
**Enhanced Features**:
- **Participation Pattern Analysis**: Real-time talk time and engagement monitoring
- **Voice Elevation Focus**: Immediate feedback on student inclusion
- **Structured Output**: Quick insights with actionable suggestions
- **Engagement Signals**: Detection of excitement, curiosity, confusion
- **75-Word Limit**: Concise, focused feedback for real-time use

**Output Format**:
- 🎯 **Quick Insight**: Key observation
- 📊 **Pattern**: Talk time/participation pattern  
- 💡 **Suggestion**: Immediate action to try
- ⚡ **Success Indicator**: What to watch for

**Context Window**: 1024 tokens (optimized for speed)

## Model Performance Comparison

| Model | Size | Context | Speed | Use Case | Focus |
|-------|------|---------|-------|----------|-------|
| andi-ciq-analyzer | 4.7GB | 8192 | Slow | Post-session analysis | Complete ECI scoring |
| andi-coach | 4.1GB | 6144 | Medium | Coaching feedback | Growth recommendations |
| andi-realtime | 2.0GB | 1024 | Fast | Live monitoring | Participation patterns |

## API Usage Examples

### CIQ Analysis
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-ciq-analyzer",
    "prompt": "Analyze this Assembly AI transcript for complete ECI Framework:\n[TRANSCRIPT_WITH_TIMESTAMPS]",
    "stream": false
  }'
```

### Teacher Coaching
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-coach",
    "prompt": "Based on this CIQ analysis and transcript, provide coaching feedback:\nCIQ Scores: [SCORES]\nTranscript: [HIGHLIGHTS]",
    "stream": false
  }'
```

### Real-Time Analysis
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-realtime",
    "prompt": "Live segment: Teacher asks question, 1 student responds, 3 raise hands",
    "stream": false
  }'
```

## Integration with Langflow

These enhanced models are pre-configured for ANDI's Langflow workflows:

1. **Comprehensive CIQ Analysis Flow**: Uses `andi-ciq-analyzer` for complete 15-component scoring
2. **Evidence-Based Coaching Flow**: Uses `andi-coach` for personalized teacher development
3. **Real-Time Monitoring Flow**: Uses `andi-realtime` for live classroom insights

## Key Improvements from Version 1.0

### Enhanced CIQ Analysis
- **15-Component Framework**: Complete ECI Blueprint implementation vs. basic 3-pillar analysis
- **Evidence Requirements**: Mandates specific quotes and timestamps for all scores
- **JSON Structured Output**: Database-ready format for automated processing
- **Assembly AI Optimization**: Specifically designed for transcript analysis workflow

### Advanced Coaching
- **Research-Based**: All recommendations connected to educational research
- **Implementation Focus**: Concrete steps with success indicators and timelines
- **Strengths-First**: Always celebrates positives before suggesting growth areas
- **Resource Integration**: Suggests specific professional development opportunities

### Real-Time Intelligence
- **Participation Monitoring**: Focus on voice elevation and engagement patterns
- **Immediate Actionability**: 75-word limit ensures quick, focused insights
- **Positive Framing**: Encouraging language with gentle adjustment suggestions
- **Pattern Recognition**: Identifies talk time imbalances and inclusion opportunities

## Environment Variables

Configure your application to use these enhanced models:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CIQ_MODEL=andi-ciq-analyzer
OLLAMA_COACH_MODEL=andi-coach
OLLAMA_REALTIME_MODEL=andi-realtime

# Model-specific settings
CIQ_CONTEXT_WINDOW=8192
COACH_CONTEXT_WINDOW=6144
REALTIME_CONTEXT_WINDOW=1024
```

## Privacy and Ethics

All models are designed with ANDI's core principles:
- **Non-Evaluative**: Focus on growth, not judgment
- **Privacy-First**: All processing happens locally
- **Student-Centered**: Recommendations focus on student learning outcomes
- **Evidence-Based**: All insights require transcript evidence
- **Culturally Sensitive**: Framework considers diverse communication styles

## Future Enhancements

Planned improvements for Version 3.0:
- **Multi-Language Support**: Spanish and other language classroom analysis
- **Adaptive Weighting**: Dynamic adjustment based on teacher goals
- **Longitudinal Analysis**: Progress tracking across multiple sessions
- **Integration APIs**: Direct database connectivity for seamless workflow
- **Advanced Metrics**: Bloom's taxonomy analysis and deeper pedagogical insights