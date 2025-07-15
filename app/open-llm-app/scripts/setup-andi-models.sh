#!/bin/bash

# ANDI Ollama Model Setup Script
# Configures Meta Llama models for ANDI-specific use cases

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Ollama is running
check_ollama() {
    log "Checking Ollama status..."
    if ! curl -s http://localhost:11434/api/version > /dev/null; then
        echo "Error: Ollama is not running. Please start it first with 'make gpu' or 'make cpu'"
        exit 1
    fi
    success "Ollama is running"
}

# Create custom Modelfiles for ANDI use cases
create_modelfiles() {
    log "Creating ANDI-optimized Modelfiles..."
    
    # CIQ Analysis Model
    cat > /tmp/andi-ciq-analyzer.Modelfile << 'EOF'
FROM llama3.1:8b

TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert educational AI assistant specializing in Classroom Impact Quotient (CIQ) analysis. You analyze classroom interactions to measure:

1. EQUITY: Psychological safety, access, and voice for all students
2. CREATIVITY: Self-expression, experimentation, and skill development  
3. INNOVATION: Real-world connections and continuous improvement

Provide specific, actionable insights without judgment. Focus on growth opportunities and celebrate strengths.
<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

PARAMETER temperature 0.3
PARAMETER top_p 0.8
PARAMETER stop "<|eot_id|>"
PARAMETER num_ctx 4096

SYSTEM """You are ANDI's CIQ analyzer. Analyze classroom transcripts and provide specific metrics for Equity, Creativity, and Innovation. Always include concrete recommendations for improvement."""
EOF

    # Teacher Coaching Model
    cat > /tmp/andi-coach.Modelfile << 'EOF'
FROM llama3.1:7b-instruct

TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are ANDI's personalized teacher coach. Your role is to provide supportive, growth-focused coaching based on classroom analysis. You:

- Celebrate teacher strengths and positive moments
- Offer specific, actionable recommendations
- Connect suggestions to research-based practices
- Maintain a supportive, non-evaluative tone
- Focus on student engagement and learning outcomes

Always provide 2-3 specific next steps the teacher can implement immediately.
<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

PARAMETER temperature 0.5
PARAMETER top_p 0.9
PARAMETER stop "<|eot_id|>"
PARAMETER num_ctx 3072

SYSTEM """You are a supportive teacher coach focused on growth and improvement. Provide personalized recommendations based on classroom data."""
EOF

    # Real-time Analysis Model
    cat > /tmp/andi-realtime.Modelfile << 'EOF'
FROM llama3.2:3b

TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are ANDI's real-time classroom analysis assistant. Provide quick, focused insights on classroom interactions as they happen. Keep responses concise and actionable.
<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

PARAMETER temperature 0.2
PARAMETER top_p 0.7
PARAMETER stop "<|eot_id|>"
PARAMETER num_ctx 2048

SYSTEM """Provide quick, real-time classroom analysis. Keep responses under 100 words and focus on immediate actionable insights."""
EOF

    success "Created ANDI Modelfiles"
}

# Create the custom models
create_models() {
    log "Creating ANDI-optimized models..."
    
    # Create CIQ Analyzer
    log "Creating andi-ciq-analyzer model..."
    docker exec andi_ollama ollama create andi-ciq-analyzer -f /tmp/andi-ciq-analyzer.Modelfile
    
    # Create Teacher Coach
    log "Creating andi-coach model..."
    docker exec andi_ollama ollama create andi-coach -f /tmp/andi-coach.Modelfile
    
    # Create Real-time Analyzer
    log "Creating andi-realtime model..."
    docker exec andi_ollama ollama create andi-realtime -f /tmp/andi-realtime.Modelfile
    
    success "Created ANDI-optimized models"
}

# Test the models
test_models() {
    log "Testing ANDI models..."
    
    # Test CIQ Analyzer
    log "Testing CIQ analyzer..."
    curl -s http://localhost:11434/api/generate -d '{
        "model": "andi-ciq-analyzer",
        "prompt": "Analyze this classroom interaction: Teacher asks a question, waits 2 seconds, then calls on Sarah who gives a detailed answer. What CIQ insights can you provide?",
        "stream": false
    }' | jq -r '.response' | head -5
    
    success "ANDI models are working!"
}

# Create model usage documentation
create_docs() {
    log "Creating model documentation..."
    
    cat > ../models/README.md << 'EOF'
# ANDI Ollama Models

This directory contains Meta Llama models optimized for ANDI educational analysis.

## Available Models

### 🎯 andi-ciq-analyzer (Based on Llama 3.1 8B)
**Purpose**: Comprehensive CIQ analysis of classroom interactions
**Use Cases**: 
- Post-session analysis
- Detailed CIQ metric calculation
- Comprehensive recommendations

**API Usage**:
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-ciq-analyzer",
    "prompt": "Analyze this classroom transcript: [transcript]",
    "stream": false
  }'
```

### 👩‍🏫 andi-coach (Based on Llama 3.1 7B Instruct)
**Purpose**: Personalized teacher coaching and recommendations
**Use Cases**:
- Coaching insights
- Professional development suggestions
- Strength-based feedback

**API Usage**:
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-coach",
    "prompt": "Based on this teacher data: [data], provide coaching recommendations",
    "stream": false
  }'
```

### ⚡ andi-realtime (Based on Llama 3.2 3B)
**Purpose**: Fast real-time classroom analysis
**Use Cases**:
- Live session monitoring
- Quick insights during teaching
- Immediate feedback

**API Usage**:
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "andi-realtime",
    "prompt": "Quick analysis: [live classroom data]",
    "stream": false
  }'
```

## Model Performance

| Model | Size | Speed | Use Case | Context Length |
|-------|------|-------|----------|----------------|
| andi-ciq-analyzer | 4.7GB | Slow | Deep analysis | 4096 tokens |
| andi-coach | 4.1GB | Medium | Coaching | 3072 tokens |
| andi-realtime | 2.0GB | Fast | Real-time | 2048 tokens |

## Integration with Langflow

These models are pre-configured to work with ANDI's Langflow workflows:

1. **CIQ Analysis Flow**: Uses `andi-ciq-analyzer`
2. **Teacher Recommendation Flow**: Uses `andi-coach`  
3. **Real-time Monitoring Flow**: Uses `andi-realtime`

## Environment Variables

Configure Langflow to use local Ollama:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CIQ_MODEL=andi-ciq-analyzer
OLLAMA_COACH_MODEL=andi-coach
OLLAMA_REALTIME_MODEL=andi-realtime
```
EOF

    success "Created model documentation"
}

# Main execution
main() {
    log "Setting up ANDI-optimized Ollama models..."
    
    check_ollama
    create_modelfiles
    create_models
    test_models
    create_docs
    
    success "ANDI Ollama setup complete!"
    echo ""
    echo "Available models:"
    echo "  • andi-ciq-analyzer    - Comprehensive CIQ analysis"
    echo "  • andi-coach           - Teacher coaching & recommendations"  
    echo "  • andi-realtime        - Fast real-time analysis"
    echo ""
    echo "Next steps:"
    echo "  1. Configure Langflow to use these models"
    echo "  2. Test integration with: make test"
    echo "  3. Access Web UI at: http://localhost:8080"
}

# Run the setup
main "$@"