# ANDI Ollama Setup Summary - July 20, 2025

## Completed Tasks

### 1. Docker-based Ollama Implementation ✅
- Set up Ollama using Docker container (`andi_ollama_cpu`) instead of native installation
- Running on CPU profile for macOS compatibility
- Container successfully integrated with existing ANDI Docker network

### 2. Model Downloads ✅
- **llama3.1:8b** - Downloaded for CIQ analysis and coaching (~4.7GB)
- **llama3.2:3b** - Downloaded for real-time analysis (~2.0GB)
- Note: llama3.1:7b-instruct not available, used 8b model for both analyzer and coach

### 3. Enhanced Model Prompts ✅
Created three ANDI-specific models with comprehensive prompts based on CIQ framework:

#### **andi-ciq-analyzer**
- Implements complete 15-component ECI Blueprint (E1-E5, C6-C10, I11-I15)
- Assembly AI transcript optimization with timestamp support
- Evidence-based scoring with JSON output for database integration
- Context window: 8192 tokens

#### **andi-coach**
- Strengths-first coaching approach with evidence from transcripts
- Research-based recommendations with implementation steps
- Non-evaluative, growth-focused language
- Context window: 6144 tokens

#### **andi-realtime**
- Fast participation pattern analysis (75-word responses)
- Focus on voice elevation and engagement signals
- Immediate actionable suggestions for teachers
- Context window: 1024 tokens (optimized for speed)

### 4. Integration Points ✅
- API endpoint: `http://localhost:11434/api/generate`
- Models accessible via Docker network for Langflow integration
- Structured JSON outputs for database storage
- Assembly AI transcript compatibility

## Key Files Created/Modified

1. `/app/open-llm-app/models/andi-ciq-analyzer.Modelfile`
2. `/app/open-llm-app/models/andi-coach.Modelfile`
3. `/app/open-llm-app/models/andi-realtime.Modelfile`
4. `/app/open-llm-app/models/README.md` - Comprehensive documentation

## Docker Commands Reference

```bash
# Start Ollama container
docker compose --profile cpu up -d

# List available models
curl -s http://localhost:11434/api/tags | jq '.models[] | .name'

# Test model
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "andi-realtime", "prompt": "Test prompt", "stream": false}'
```

## Next Steps for Integration

1. **Langflow Integration**: Import the CIQ analysis flows and configure Ollama endpoints
2. **API Routes**: Update Next.js API routes to include local LLM option
3. **UI Toggle**: Add model selection (local vs. cloud) in recording analysis settings
4. **Performance Testing**: Benchmark response times for each model
5. **Error Handling**: Implement fallback strategies for model timeouts

## Important Notes

- Models take time to load initially (especially 8B models)
- Real-time model (3B) responds faster but with simpler analysis
- All processing happens locally for complete privacy
- Docker container must be running for model access
- Models are non-evaluative and growth-focused per ANDI principles

## CIQ Framework Implementation Details

The enhanced models now properly implement:
- **Equity Components (E1-E5)**: Identity, Safety, Access, Voice, Collaboration
- **Creativity Components (C6-C10)**: Expression, Experimentation, Active Learning, Skill Development, Imagination
- **Innovation Components (I11-I15)**: Possibility, Real-World, Change-Making, Impact, Continuous Improvement

Each component requires evidence-based scoring with specific transcript quotes and timestamps for database integration.