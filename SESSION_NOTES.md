# ANDI Session Notes

## Previous Session - July 14, 2025
Successfully integrated Ollama local LLM server with Meta Llama models into the ANDI platform for privacy-focused AI inference.

## Current Session - July 24, 2025

### Session Summary
Worked on implementing the upload workflow for audio recordings, setting up Google OAuth authentication, implementing Azure Blob storage for voice clips, and creating user reset scripts for testing.

### Key Accomplishments

#### 1. Upload Workflow Implementation
- Fixed M4A file upload support (added missing MIME types: `audio/x-m4a`, `audio/mp4a-latm`)
- Integrated Assembly AI for audio transcription (API key stored in .env.local)
- Created processing status page at `/processing/[sessionId]`
- Set up real-time transcription status polling

#### 2. Google OAuth Authentication
- Configured Google OAuth credentials (stored in .env.local)
- Added `prompt: "consent"` to force OAuth screen (TODO: Change for production)
- Removed all development authentication bypasses
- **IMPORTANT**: Need to add callback URL to Google Cloud Console: `http://localhost:3000/api/auth/callback/google`

#### 3. Azure Blob Storage Implementation
- Set up Azurite for local Azure Blob storage simulation
- Created comprehensive AzureStorageService
- Fixed voice clip storage during onboarding to persist to Azure
- Storage runs on ports 10000-10002

#### 4. User Management Scripts
- Created `/scripts/reset-user.sh` - comprehensive user data removal
- Created `/reset-derek.sh` - quick wrapper for derekfrempong@gmail.com
- Fixed scripts to use correct NextAuth table structure (andi_web_* tables)

#### 5. Build and Infrastructure Fixes
- Fixed Next.js build errors by cleaning .next directory
- Installed missing @azure/storage-blob dependency
- Added detailed auth logging for debugging

### Current State

#### Running Services
- PostgreSQL Database (port 5432)
- Azure Blob Storage Simulator (Azurite) (ports 10000-10002)
- Ollama Local LLM Server (port 11434) with ANDI models
- Next.js Web Application (port 3000)

#### Pending Tasks (TODO)
1. **Add Google OAuth callback URL to Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Add: `http://localhost:3000/api/auth/callback/google`

2. **Test complete onboarding flow with voice clips**
   - Sign in with Google OAuth
   - Complete full onboarding including voice recording
   - Verify voice clips are stored in Azure Blob storage

3. **Complete upload-to-analysis workflow**
   - Implement results display page
   - Create database records for uploads
   - Test full workflow with M4A file

4. **Production considerations**
   - Change Google OAuth prompt from "consent" to "select_account"
   - Set up production Azure Blob storage
   - Configure production OAuth credentials

### Known Issues
- Next.js occasionally has build corruption issues - fix with `rm -rf .next`
- Stop script shows some errors but continues properly
- Redis connection errors during build are expected (Redis is optional)

### File Locations
- Upload Modal: `/src/components/recording/UploadModal.tsx`
- Upload API: `/src/app/api/recordings/upload/route.ts`
- Processing Page: `/src/app/(authenticated)/processing/[sessionId]/page.tsx`
- Azure Storage Service: `/src/services/AzureStorageService.ts`
- Auth Config: `/src/lib/auth.ts`
- User Reset Script: `/scripts/reset-user.sh`

### Environment Variables Set
- Assembly AI API key configured
- Google OAuth credentials configured
- Azure Blob storage configured with Azurite
- Storage provider set to "azure"

### Next Session Starting Point
1. Start services with `./start-andi.sh --detached`
2. Ensure Google OAuth callback URL is configured in Cloud Console
3. Test authentication flow with derekfrempong@gmail.com
4. Complete onboarding with voice recording
5. Test file upload with the M4A recording
6. Implement results display page for transcriptions

---

## Previous Session Content - July 14, 2025

### ✅ Completed in Previous Session

#### 1. Ollama Infrastructure Setup
- **Location**: `app/open-llm-app/` directory
- **Docker Compose**: GPU + CPU profiles with health checks
- **Makefile**: Complete management system with 12+ commands
- **Environment Config**: `.env.example` with comprehensive settings

### 2. Meta Llama Model Integration  
- **Llama 3.1 8B** → `andi-ciq-analyzer` (Deep classroom analysis)
- **Llama 3.1 7B Instruct** → `andi-coach` (Teacher coaching & recommendations)
- **Llama 3.2 3B** → `andi-realtime` (Fast real-time processing)
- **Automated Setup**: `make setup-models` script downloads and configures everything

### 3. ANDI Stack Integration
- **start-andi.sh**: Added Ollama as service with GPU/CPU auto-detection
- **Status Monitoring**: Health checks and service status reporting
- **Default Services**: Now includes `database web-app langflow ollama`

### 4. Langflow Integration
- **Environment Variables**: Ollama endpoints configured in Langflow
- **Custom Components**: `ollama_andi_component.py` with specialized ANDI classes
- **Sample Flows**: Ready-to-import JSON flows for CIQ analysis and teacher coaching

## 🎯 Key Benefits Achieved
- **Privacy-First**: All teacher/student AI analysis stays local
- **Cost Control**: No per-token charges for LLM inference  
- **FERPA Compliance**: Educational data never leaves local infrastructure
- **Hybrid Approach**: Use Ollama for sensitive data, external APIs for general tasks
- **Performance**: GPU acceleration with CPU fallback

## 📋 Next Session Priorities

### Immediate Next Steps (Ready to implement)
1. **Test Complete Stack**:
   ```bash
   ./start-andi.sh --detached
   cd app/open-llm-app && make setup-models  # Downloads 30+ GB
   ```

2. **Langflow Flow Development**:
   - Import sample flows into Langflow IDE (http://localhost:7860)
   - Test CIQ analysis with real classroom transcripts
   - Validate teacher coaching recommendations
   - Create additional flows for specific ANDI use cases

3. **Web App Integration**:
   - Add Ollama model selection to recording analysis UI
   - Create local vs. external AI toggle in settings
   - Update API routes to support Ollama endpoints
   - Add model status indicators in dashboard

### Medium-Term Development
4. **Model Fine-tuning**:
   - Collect ANDI-specific training data
   - Fine-tune models for educational context
   - Optimize prompts for CIQ framework
   - Validate accuracy against educational research

5. **Performance Optimization**:
   - Model caching and pre-loading strategies
   - GPU memory management for multiple models
   - Response time optimization for real-time use cases
   - Load balancing for high-traffic scenarios

6. **Production Readiness**:
   - Security hardening for local LLM deployment
   - Monitoring and alerting for model performance
   - Backup and recovery procedures for model data
   - Documentation for IT administrators

## 🔧 Technical Architecture

### Current Stack
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │    Langflow      │    │     Ollama      │    │  Meta Llama     │
│   (Next.js)     │◄──►│  (AI Workflows)  │◄──►│  (Local LLMs)   │◄──►│   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   ClickHouse     │    │   Docker        │    │  Local Storage  │
│   (App Data)    │    │  (Analytics)     │    │  (Containers)   │    │  (Model Files)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Endpoints
- **Ollama API**: http://localhost:11434/api/generate
- **Langflow**: http://localhost:7860 (includes Ollama components)
- **Web UI** (optional): http://localhost:8080

### Model Specifications
| Model | Size | Context | Use Case | Performance |
|-------|------|---------|----------|-------------|
| andi-ciq-analyzer | 4.7GB | 4096 tokens | CIQ Analysis | Slow, Deep |
| andi-coach | 4.1GB | 3072 tokens | Teacher Coaching | Medium |
| andi-realtime | 2.0GB | 2048 tokens | Real-time Processing | Fast |

## 📁 File Locations

### Ollama Setup
- **Main Directory**: `app/open-llm-app/`
- **Docker Config**: `app/open-llm-app/docker-compose.yml`
- **Management**: `app/open-llm-app/Makefile`
- **Setup Script**: `app/open-llm-app/scripts/setup-andi-models.sh`

### Langflow Integration  
- **Custom Component**: `app/Langflow/custom_components/ollama_andi_component.py`
- **Sample Flows**: `app/Langflow/flows/ciq_analysis_ollama.json`
- **Environment**: `app/Langflow/.env.example` (updated with Ollama config)

### Startup Integration
- **Main Script**: `start-andi.sh` (updated with Ollama service)
- **Documentation**: `CLAUDE.md` (updated with current stack info)

## 🚀 Getting Started Commands

```bash
# Start full ANDI stack
./start-andi.sh --detached

# Download and setup Ollama models (one-time, ~30GB download)
cd app/open-llm-app
make setup-models

# Test Ollama integration
make test
make health

# Access services
# Web App: http://localhost:3000
# Langflow: http://localhost:7860  
# Ollama API: http://localhost:11434
# Ollama Web UI: http://localhost:8080 (if started with webui profile)
```

## 🎯 Session Goals Achieved
✅ Complete local LLM infrastructure  
✅ Meta Llama model integration  
✅ Privacy-first AI architecture  
✅ Langflow workflow integration  
✅ ANDI stack orchestration  
✅ Documentation and setup automation  

**Ready for next session**: Testing, flow development, and web app integration.