# ANDI Langflow Flows

This directory contains AI workflow flows for the ANDI platform. All AI processing workflows are developed and managed through Langflow.

## Flow Categories

### 🎯 CIQ Analysis Flows
- **ciq_real_time_analysis.json**: Real-time classroom interaction quality analysis
- **ciq_session_summary.json**: Post-session CIQ metric calculation and insights
- **ciq_comparative_analysis.json**: Compare CIQ scores across sessions and teachers

### 👩‍🏫 Teacher Recommendation Flows
- **teacher_personalized_coaching.json**: Generate personalized coaching recommendations
- **teacher_goal_tracking.json**: Track and update teacher development goals
- **teacher_resource_recommendations.json**: Suggest relevant learning resources

### 🎙️ Audio Processing Flows
- **audio_transcription_pipeline.json**: Convert classroom audio to text
- **audio_sentiment_analysis.json**: Analyze emotional tone in classroom discussions
- **audio_speaker_identification.json**: Identify different speakers in recordings

### 📊 Analytics & Insights Flows
- **student_engagement_analytics.json**: Analyze student participation patterns
- **classroom_climate_assessment.json**: Evaluate overall classroom atmosphere
- **equity_analysis.json**: Assess equity in student participation and opportunities

### 🤖 Multi-Agent Orchestration
- **coaching_conversation_agent.json**: AI coaching conversation management
- **adaptive_feedback_system.json**: Context-aware feedback generation
- **intervention_recommendation.json**: Suggest timely teaching interventions

## Flow Development Guidelines

### Development Process
1. **Design**: Create flow in Langflow IDE (`make dev`)
2. **Test**: Validate with sample ANDI data
3. **Export**: Save flow JSON to this directory
4. **Deploy**: Flow becomes available in production runtime
5. **Monitor**: Track performance via Sentry and logs

### Naming Conventions
- Use descriptive, kebab-case names
- Include version suffix for major updates (e.g., `_v2.json`)
- Prefix with category: `ciq_`, `teacher_`, `audio_`, `analytics_`

### Data Integration
Flows can access ANDI data through pre-configured connectors:
- **ANDI Main DB**: Real-time access to CIQ and teacher data
- **ANDI Warehouse**: Analytics data via ClickHouse
- **External APIs**: OpenAI, Anthropic, Assembly AI, etc.

### Performance Guidelines
- Optimize for < 2s response time for real-time flows
- Use async processing for batch analytics flows
- Implement proper error handling and retry logic
- Add comprehensive logging for debugging

## Flow Examples

### Sample CIQ Analysis Flow
```json
{
  "name": "ciq_real_time_analysis",
  "category": "ciq_analysis",
  "description": "Analyzes live classroom audio for CIQ metrics",
  "inputs": {
    "audio_stream": "base64_audio",
    "teacher_id": "uuid",
    "session_id": "uuid"
  },
  "outputs": {
    "ciq_score": "float",
    "wait_time_avg": "float", 
    "equity_score": "float",
    "recommendations": "array"
  }
}
```

### Sample Teacher Recommendation Flow
```json
{
  "name": "teacher_personalized_coaching",
  "category": "teacher_recommendations",
  "description": "Generates personalized coaching suggestions",
  "inputs": {
    "teacher_id": "uuid",
    "recent_sessions": "array",
    "goal_areas": "array"
  },
  "outputs": {
    "recommendations": "array",
    "priority_level": "string",
    "next_steps": "array"
  }
}
```

## Testing Flows

### Local Testing
```bash
# Start Langflow IDE
make dev

# Access at http://localhost:7860
# Import flow JSON
# Test with sample data
# Export updated flow
```

### Integration Testing
```bash
# Test flow API endpoints
curl -X POST http://localhost:7860/api/v1/run/{flow_id} \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"teacher_id": "123"}}'
```

## Production Deployment

Flows in this directory are automatically available in production runtime mode. The Langflow runtime serves each flow as a REST API endpoint:

```
POST /api/v1/run/{flow_id}
Content-Type: application/json

{
  "inputs": {
    "parameter1": "value1",
    "parameter2": "value2"
  }
}
```

## Monitoring & Observability

All flow executions are tracked with:
- **Execution logs**: Start/end times, input/output data
- **Performance metrics**: Response times, success rates
- **Error tracking**: Via Sentry integration
- **Custom metrics**: Business-specific KPIs

## Flow Versioning

- **Development**: Work in progress flows
- **Staging**: Tested flows ready for production validation  
- **Production**: Live flows serving ANDI applications
- **Archive**: Deprecated or replaced flows

## Getting Started

1. **Start development environment**: `make dev`
2. **Access Langflow IDE**: http://localhost:7860
3. **Import sample flows**: Use flow JSON files as templates
4. **Connect to ANDI data**: Use pre-configured database connectors
5. **Test your flows**: Validate with real ANDI data
6. **Export for production**: Save completed flows to this directory