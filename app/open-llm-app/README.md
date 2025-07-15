# ANDI Open LLM App

Local deployment of Meta Llama models using Ollama for privacy-focused AI analysis in the ANDI platform.

## Overview

This component provides local Large Language Model inference for ANDI's educational AI features:

- **🎯 CIQ Analysis**: Classroom Impact Quotient metrics using local AI
- **👩‍🏫 Teacher Coaching**: Personalized recommendations without external API calls  
- **⚡ Real-time Processing**: Fast classroom interaction analysis
- **🔒 Privacy-First**: All teacher/student data stays local

## Quick Start

### 1. Start Ollama Service

**With GPU Support** (Recommended):
```bash
make gpu
```

**CPU Only**:
```bash
make cpu
```

**With Web UI**:
```bash
make webui
```

### 2. Download ANDI Models

```bash
# Download Meta Llama models (30+ GB total)
make setup-models
```

This downloads and configures:
- **Llama 3.1 8B** (4.7GB) - CIQ Analysis
- **Llama 3.1 7B Instruct** (4.1GB) - Teacher Coaching
- **Llama 3.2 3B** (2.0GB) - Real-time Processing

### 3. Test Installation

```bash
make test
make health
```

## Architecture Integration

### ANDI Stack with Ollama
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web App       │    │    Langflow      │    │     Ollama      │
│   (Next.js)     │◄──►│  (AI Workflows)  │◄──►│  (Local LLMs)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   ClickHouse     │    │  Meta Llama     │
│   (App Data)    │    │  (Analytics)     │    │   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Integration Points

1. **Langflow Workflows** → Ollama API (localhost:11434)
2. **Privacy Mode** → All analysis stays local
3. **Hybrid Approach** → External APIs for non-sensitive tasks

## Available Models

| Model | Purpose | Size | Speed | Context |
|-------|---------|------|-------|---------|
| `andi-ciq-analyzer` | Deep CIQ analysis | 4.7GB | Slow | 4096 tokens |
| `andi-coach` | Teacher recommendations | 4.1GB | Medium | 3072 tokens |
| `andi-realtime` | Live monitoring | 2.0GB | Fast | 2048 tokens |

## API Usage

### CIQ Analysis
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-ciq-analyzer",
    "prompt": "Analyze this classroom transcript for CIQ metrics: [transcript]",
    "stream": false
  }'
```

### Teacher Coaching
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-coach", 
    "prompt": "Provide coaching recommendations for: [teacher data]",
    "stream": false
  }'
```

### Real-time Analysis
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-realtime",
    "prompt": "Quick insight on: [live classroom data]",
    "stream": false
  }'
```

## Management Commands

```bash
# Service Management
make gpu          # Start with GPU support
make cpu          # Start CPU-only mode  
make webui        # Start with Web UI
make stop         # Stop all services

# Model Management
make models       # List installed models
make pull-llama   # Download base Llama models
make setup-models # Configure ANDI-optimized models

# Monitoring
make status       # Check service status
make health       # Health check
make logs         # View logs
make test         # Test model inference

# Maintenance  
make clean        # Remove all data (WARNING)
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CIQ_MODEL=andi-ciq-analyzer
OLLAMA_COACH_MODEL=andi-coach
OLLAMA_REALTIME_MODEL=andi-realtime
```

### GPU Requirements
- **NVIDIA GPU** with CUDA support
- **8GB+ VRAM** recommended for multiple models
- **16GB+ RAM** for CPU-only mode

### Storage Requirements
- **40GB** disk space for all models
- **SSD recommended** for faster model loading

## Integration with Langflow

### 1. Configure Langflow Environment
Update `/app/Langflow/.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
```

### 2. Create Ollama Components
Langflow workflows can use Ollama endpoints instead of commercial APIs:

- Replace `OpenAI` components with `Ollama` components
- Use model names: `andi-ciq-analyzer`, `andi-coach`, `andi-realtime`
- Configure base URL: `http://localhost:11434`

## Privacy Benefits

✅ **FERPA Compliant** - No student data sent to external services  
✅ **Local Processing** - All AI inference happens on your infrastructure  
✅ **No API Keys** - No external API key management required  
✅ **Cost Control** - No per-token charges for AI analysis  
✅ **Offline Capable** - Works without internet connection  

## Performance Optimization

### GPU Mode (Recommended)
- **Fastest inference** (2-5 seconds per request)
- **Multiple models** can be loaded simultaneously
- **Requires NVIDIA GPU** with 8GB+ VRAM

### CPU Mode
- **Slower inference** (10-30 seconds per request)  
- **Lower resource requirements**
- **Works on any hardware**

### Hybrid Approach
- **Ollama** for sensitive teacher/student analysis
- **Commercial APIs** for general tasks (embeddings, etc.)

## Troubleshooting

### Models Not Loading
```bash
# Check disk space
df -h

# Check model status  
make models

# Re-download models
make clean
make setup-models
```

### Slow Performance
```bash
# Check GPU usage
nvidia-smi

# Check memory usage
docker stats andi_ollama

# Reduce loaded models
# Edit OLLAMA_MAX_LOADED_MODELS in .env
```

### Connection Issues
```bash
# Check service status
make status

# Check health
make health

# View logs
make logs
```

## Web UI Access

If started with `make webui`:
- **Ollama Web UI**: http://localhost:8080
- **Direct Ollama API**: http://localhost:11434
- **Model Management**: Full GUI for model testing

## Integration Roadmap

1. ✅ **Ollama Service Setup** - Local LLM server
2. ✅ **Meta Llama Models** - Educational AI models  
3. 🔄 **Langflow Integration** - AI workflow connection
4. 🔄 **Web App Integration** - Frontend model selection
5. ⏳ **Performance Monitoring** - Usage analytics
6. ⏳ **Model Fine-tuning** - ANDI-specific optimization

## Support

For issues with Ollama integration:
1. Check the logs: `make logs`
2. Verify health: `make health`  
3. Test models: `make test`
4. Review GPU usage: `nvidia-smi` (GPU mode)

The local LLM setup provides ANDI with powerful AI capabilities while maintaining complete privacy and control over educational data.