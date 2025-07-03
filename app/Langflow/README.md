# ANDI Langflow Integration

Langflow handles ALL AI workflows for the ANDI platform, providing visual flow development and production-ready AI pipeline execution.

## Architecture Overview

### Development Environment
- **Langflow IDE**: Full visual interface for flow development
- **Dedicated Database**: Separate PostgreSQL database for Langflow data
- **Database Connectors**: Real-time access to ANDI CIQ and teacher data
- **Development Port**: 7860 (Langflow default)

### Production Environment
- **Langflow Runtime**: Headless API-only mode
- **API Endpoints**: Serves AI workflows as REST APIs
- **Azure Container Apps**: Scalable cloud deployment
- **Real-time Integration**: Direct database connections to ANDI data

## Use Cases

Langflow will handle all AI workflows including:
- **CIQ Analysis Pipelines**: Real-time classroom analysis
- **Teacher Recommendation Engines**: Personalized coaching suggestions
- **Audio Transcription Workflows**: Speech-to-text processing
- **Student Engagement Analytics**: Behavior pattern analysis
- **Automated Coaching Responses**: AI-driven feedback generation
- **Multi-agent Orchestration**: Complex AI workflow coordination

## Database Integration

### Langflow Database (Separate)
- **Purpose**: Langflow configuration, flows, and internal data
- **Database**: `langflow_db`
- **User**: `langflow_user`

### ANDI Data Access (Via Connectors)
- **Main Database**: Real-time access to CIQ and teacher data
- **Data Warehouse**: Analytics data access via ClickHouse connectors
- **Sync Pattern**: Real-time database connectors (no ETL required)

## Environment Configuration

### Development
- Full Langflow IDE with visual flow builder
- Hot-reload for flow development
- Debug logging and monitoring
- Direct database access for testing

### Production  
- Runtime-only mode (no UI)
- API endpoint exposure
- Production database connections
- Performance monitoring and scaling

## Security & Authentication

### Development Access
- Basic authentication for team access
- Internal network only
- Development database credentials

### Production API
- Service-to-service authentication
- API key management
- Secure database connections
- Azure managed identities

## Deployment Strategy

### Local Development
```bash
# Start Langflow IDE with PostgreSQL
docker-compose -f docker-compose.dev.yml up

# Access at: http://localhost:7860
```

### Azure Production
- **Azure Container Apps**: Auto-scaling runtime deployment
- **Managed PostgreSQL**: Dedicated Langflow database
- **Service Integration**: API endpoints consumed by ANDI web app
- **Monitoring**: Integrated with Sentry and Azure monitoring

## Resource Requirements

Based on Langflow documentation best practices:
- **Development**: 2 CPU cores, 4GB RAM
- **Production**: 4+ CPU cores, 8GB+ RAM (auto-scaling)
- **Database**: Standard tier with connection pooling
- **Storage**: SSD for optimal performance

## Monitoring & Observability

Langflow includes comprehensive monitoring for production deployments with full Sentry integration:

### Sentry Integration

ANDI Langflow is fully integrated with Sentry for:

- **Error Tracking**: Automatic capture of flow and component errors
- **Performance Monitoring**: Track AI workflow execution times
- **AI API Monitoring**: Monitor OpenAI, Anthropic, and other AI service calls
- **Database Query Tracking**: Monitor database connector performance
- **Custom Metrics**: Track business-specific metrics like CIQ analysis results

#### Sentry Configuration

```bash
# Set Sentry DSN in environment
export SENTRY_DSN="your-sentry-dsn-for-langflow"
export SENTRY_ENVIRONMENT="development"  # or staging/production
export SENTRY_TRACES_SAMPLE_RATE="1.0"   # 100% for dev, 0.1 for prod
```

#### Sentry Features for Langflow

1. **Flow Execution Monitoring**
   ```python
   from utils.sentry import track_flow
   
   @track_flow("ciq_analysis_flow", "CIQ Analysis Flow")
   def execute_ciq_analysis():
       # Your flow logic here
       pass
   ```

2. **Component Monitoring**
   ```python
   from utils.sentry import track_component
   
   @track_component("DatabaseConnector", "ANDI_CIQ_Reader")
   def read_ciq_data():
       # Component logic here
       pass
   ```

3. **AI API Call Monitoring**
   ```python
   from utils.sentry import track_ai_call
   
   @track_ai_call("openai", "gpt-4", "completion")
   def call_openai_api():
       # OpenAI API call
       pass
   ```

4. **Database Query Monitoring**
   ```python
   from utils.sentry import track_db_query
   
   @track_db_query("andi_db", "select")
   def query_teacher_data():
       # Database query logic
       pass
   ```

#### Custom Metrics Tracked

- **Flow Performance**: Execution time, success/failure rates
- **AI API Usage**: Token consumption, cost tracking, latency
- **Data Processing**: Records processed, data quality metrics
- **Component Health**: Individual component performance and errors
- **Business Metrics**: CIQ analysis results, teacher engagement scores

### Application Monitoring

- **Application Logs**: Centralized logging with structured format
- **Performance Metrics**: Flow execution times, component performance
- **Health Checks**: Automated monitoring of service availability
- **Azure Integration**: Log Analytics and Application Insights support

### Local Monitoring

```bash
# View logs
make logs

# Check health status
make health

# View performance metrics
docker stats andi-langflow-dev

# Initialize Sentry monitoring
python init_sentry.py
```

### Production Monitoring

In production, Sentry provides:

- **Real-time Alerts**: Get notified when AI workflows fail
- **Performance Insights**: Optimize slow-running flows and components
- **Error Grouping**: Identify patterns in AI workflow failures
- **Release Tracking**: Monitor deployment impact on workflow performance
- **User Context**: Track which teachers and schools are affected by issues