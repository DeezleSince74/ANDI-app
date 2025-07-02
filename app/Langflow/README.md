# Langflow - AI Workflow Engine

This directory contains the Langflow configurations and workflows for ANDI's AI-powered features.

## Overview

Langflow serves as the visual AI workflow builder for:
- Classroom audio analysis pipelines
- Teacher coaching and mentoring flows
- Resource recommendation systems
- Voice pattern analysis

## Structure

```
Langflow/
├── flows/              # Langflow workflow definitions
├── components/         # Custom Langflow components
├── configs/           # Configuration files
└── examples/          # Example flows and templates
```

## Key Workflows

1. **Audio Analysis Pipeline**
   - Transcription → Context extraction → Insight generation

2. **Coaching Flow**
   - Teacher profile → Historical data → Personalized recommendations

3. **Resource Matching**
   - Query embedding → Semantic search → Ranked results

## Integration Points

- **Input**: Audio files from Firebase Storage
- **Processing**: LLM chains for analysis
- **Output**: Structured data to ClickHouse
- **Vector Store**: Embeddings for semantic search

## Getting Started

1. Install Langflow: `pip install langflow`
2. Import workflow templates from `flows/`
3. Configure API keys in `configs/`
4. Test with examples in `examples/`