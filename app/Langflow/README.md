# ANDI Langflow Integration

This directory contains the Langflow setup for ANDI's AI workflows and integrations.

## Overview

Langflow is used to create and manage AI-powered workflows for:
- CIQ (Classroom Impact Quotient) analysis
- Audio transcription and analysis
- Teacher coaching recommendations
- Session insights generation
- Natural language interactions with ANDI data

## Quick Start

1. **Initialize the environment:**
   ```bash
   make init
   ```

2. **Configure your API keys:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. **Start Langflow:**
   ```bash
   make dev
   ```

4. **Access Langflow:**
   - URL: http://localhost:7860
   - Default login: `admin@andi.local` / `langflow_admin`

## Architecture

```
Langflow Integration
├── Langflow IDE (port 7860)
├── PostgreSQL Database (port 5433)
├── Redis Cache (port 6380)
└── Custom ANDI Components
```

## Directory Structure

- `flows/` - Langflow workflow definitions (JSON files)
- `custom_components/` - Custom Python components for ANDI integration
- `utils/` - Utility functions and helpers
- `docker-compose.dev.yml` - Development environment configuration
- `docker-compose.prod.yml` - Production environment configuration

## Custom Components

### ANDI Database Connector
Connects Langflow to ANDI's main database for:
- Retrieving session data
- Accessing teacher information
- Fetching CIQ scores
- Getting audio transcriptions

## Management Commands

```bash
make help     # Show all available commands
make dev      # Start development environment
make stop     # Stop all services
make logs     # View logs
make status   # Check service status
make health   # Health check all services
make backup   # Backup Langflow data
make clean    # Remove all data (WARNING: destructive)
```

## Environment Variables

Key environment variables (configure in `.env`):
- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `GOOGLE_API_KEY` - Google AI API key
- `ASSEMBLYAI_API_KEY` - AssemblyAI key for transcription
- `ANDI_DB_*` - ANDI database connection settings

## Creating Flows

1. Access Langflow at http://localhost:7860
2. Create a new flow using the visual editor
3. Use custom ANDI components for database access
4. Save flows to the `flows/` directory
5. Export flows as JSON for version control

## Integration with ANDI

Langflow integrates with ANDI through:
1. Custom database connector component
2. Shared network with ANDI services
3. Environment variable configuration
4. API endpoints for flow execution

## Troubleshooting

- **Cannot connect to Langflow:** Check if Docker is running and ports are available
- **Database connection errors:** Verify ANDI database credentials in `.env`
- **API key errors:** Ensure all required API keys are configured
- **Flow execution errors:** Check logs with `make logs`

## Production Deployment

For production deployment:
1. Use `docker-compose.prod.yml`
2. Set strong passwords and secret keys
3. Configure SSL/TLS termination
4. Set up monitoring and alerting
5. Regular backups with `make backup`