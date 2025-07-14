# ANDI - AI Instructional Coach Platform

**Your favorite teacher's favorite teacher** 🍎

ANDI is an AI-powered instructional coaching platform that transforms classroom audio into actionable insights, helping teachers improve their practice through data-driven feedback and personalized recommendations.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (recommended)
- Git

### Development Setup

1. **Initial Setup**
   ```bash
   git clone <repository-url>
   cd ANDI-app
   ./dev-setup.sh
   ```

2. **Start Application**
   ```bash
   # Start in detached mode (recommended)
   ./start-andi.sh --detached
   
   # Or start in foreground mode (will block on web app)
   ./start-andi.sh
   ```

3. **Access Services**
   - **Database (PgAdmin)**: http://localhost:5050
   - **Web App**: http://localhost:3000
   - **API Docs**: http://localhost:3001/docs *(coming soon)*

4. **Stop Application**
   ```bash
   ./stop-andi.sh
   ```

## Application Architecture

ANDI is built as a modular, containerized application with the following components:

```
ANDI Platform
├── 🗄️  Database Layer (PostgreSQL)     ✅ Complete
├── 🌐 Web Application (Next.js)        🚧 Coming Soon
├── 🔌 API Services (Express.js)        🚧 Coming Soon
├── 🤖 Langflow (AI Workflows)          🚧 Coming Soon
├── 📊 Data Warehouse (ClickHouse)      🚧 Coming Soon
└── 📈 Monitoring Stack                 🚧 Coming Soon
```

### Current Status
- **✅ Database Layer**: Complete PostgreSQL implementation with 25+ tables, RLS policies, and Azure deployment
- **🚧 Web Application**: Placeholder ready for Next.js implementation
- **🚧 API Services**: Placeholder ready for Express.js backend
- **🚧 AI Workflows**: Placeholder ready for Langflow integration
- **🚧 Analytics**: Placeholder ready for ClickHouse data warehouse
- **🚧 Monitoring**: Placeholder ready for observability stack

## Core Features

### 🎯 Classroom Impact Quotient (CIQ)
ANDI's proprietary metric that quantifies teaching effectiveness across three pillars:
- **Equity**: Ensuring psychological safety and voice for all students
- **Creativity**: Fostering self-expression and innovative thinking
- **Innovation**: Connecting learning to real-world impact

### 🎙️ Audio Analysis Pipeline
- Multi-directional microphone classroom capture
- AI-powered transcription and NLP analysis
- Key moment identification and highlight extraction
- Talk-time ratio analysis and questioning pattern recognition

### 👥 Community Features
- Teacher Lounge forum for peer collaboration
- Resource library with curated educational materials
- Shared classroom activities and teaching strategies
- Peer mentorship and support networks

### 🏆 Gamification & Growth
- Achievement system for teaching milestones
- Progress tracking and goal setting
- Professional development trivia and challenges
- Performance dashboards and trend analysis

## Development Commands

### Application Control
```bash
# Start all services
./start-andi.sh

# Start specific services
./start-andi.sh database web-app

# Start with options
./start-andi.sh --detached --logs --clean

# Stop all services
./stop-andi.sh

# Stop specific services
./stop-andi.sh database

# Force stop all
./stop-andi.sh --force
```

### Database Operations
```bash
cd app/app-database

# Quick commands
make up              # Start database
make down            # Stop database
make psql            # Open PostgreSQL CLI
make health-check    # Run health diagnostics
make backup          # Create backup
make seed            # Load test data
make reset           # Fresh database

# Full command list
make help            # Show all available commands
```

### Development Helpers
```bash
# Load development aliases
source dev-aliases.sh

# Then use shortcuts
andi-start           # Start application
andi-stop            # Stop application
andi-db              # Open database CLI
andi-logs            # Follow logs
andi-clean           # Clean restart
```

## Configuration

### Environment Files
- **`.env`**: Main application configuration
- **`app/app-database/.env`**: Database-specific settings

### Key Configuration Options
```bash
# Application
NODE_ENV=development
ANDI_PORT=3000
API_PORT=3001

# Database
POSTGRES_PORT=5432
PGADMIN_PORT=5050

# AI Services
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
ASSEMBLY_AI_API_KEY=your-key

# Storage
AWS_S3_BUCKET=andi-audio-files
```

## Project Structure

```
ANDI-app/
├── 0-Engineering-Context/     # Project documentation and requirements
├── app/
│   ├── app-database/          # PostgreSQL database layer
│   ├── web-app/              # Next.js frontend (coming soon)
│   ├── data-warehouse/       # ClickHouse analytics (coming soon)
│   ├── Langflow/             # AI workflow engine (coming soon)
│   └── documentation/        # API and technical docs (coming soon)
├── logs/                     # Application logs
├── .pids/                    # Process ID files
├── start-andi.sh            # Main startup script
├── stop-andi.sh             # Graceful shutdown script
├── dev-setup.sh             # Development environment setup
├── .env.example             # Environment configuration template
└── README.md                # This file
```

## Database Schema

The PostgreSQL database implements a comprehensive schema across 5 schemas:

### Schemas Overview
- **`auth`**: User management and authentication
- **`core`**: Main application data (sessions, goals, activities)
- **`analytics`**: CIQ metrics and performance summaries
- **`community`**: Forum, resources, and social features
- **`gamification`**: Achievements, trivia, and progress tracking

### Key Tables
- **Users & Profiles**: Teacher and coach management with school associations
- **Audio Sessions**: Recording metadata, transcripts, and analysis results
- **CIQ Metrics**: Equity, creativity, and innovation scoring
- **Recommendations**: AI-generated teaching strategies and activities
- **Community**: Forum questions, answers, votes, and resource sharing
- **Achievements**: Gamification system with progress tracking

## Security Features

### Data Protection
- **Row Level Security (RLS)**: Complete data isolation between users
- **Role-based Access**: Teacher, Coach, and Admin permissions
- **Encrypted Storage**: Sensitive data protection
- **SSL/TLS**: Encrypted connections
- **Audit Logging**: Comprehensive change tracking

### Authentication
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Session management
- Multi-factor authentication support (planned)

## Cloud Deployment

### Azure Integration
ANDI is designed for Azure cloud deployment with:

- **Azure PostgreSQL Flexible Server**: Managed database with high availability
- **Azure Container Instances**: Containerized application deployment
- **Azure Blob Storage**: Audio file storage
- **Azure Monitor**: Logging and diagnostics
- **Infrastructure as Code**: Bicep templates for reproducible deployments

### Deployment Commands
```bash
# Deploy database to Azure
cd app/app-database/azure
./deploy.sh

# Deploy schema
make azure-deploy
```

## Contributing

### Development Workflow
1. Set up development environment: `./dev-setup.sh`
2. Start services: `./start-andi.sh`
3. Make changes and test locally
4. Run health checks: `make health-check` (database)
5. Commit changes with descriptive messages

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive error handling
- Security-first development practices
- Performance optimization

### Database Changes
1. Create migration files in `app/app-database/migrations/versions/`
2. Test locally: `make migrate`
3. Update schema documentation
4. Test with seed data

## Troubleshooting

### Common Issues

**Services won't start**
```bash
# Check if ports are in use
lsof -i :3000 -i :5432 -i :5050

# Clean restart
./start-andi.sh --clean
```

**Database connection issues**
```bash
cd app/app-database
make health-check
make restart
```

**Permission errors**
```bash
# Make sure scripts are executable
chmod +x *.sh
chmod +x app/app-database/scripts/*.sh
```

### Logs and Debugging
```bash
# View all logs
tail -f logs/*.log

# Database logs
cd app/app-database
make logs

# Enable debug mode
DEBUG=true ./start-andi.sh
```

## Technology Stack

### Core Technologies
- **Database**: PostgreSQL 16 with extensions
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS *(planned)*
- **Backend**: Node.js, Express.js *(planned)*
- **AI/ML**: OpenAI, Anthropic, Assembly AI
- **Analytics**: ClickHouse *(planned)*
- **Workflows**: Langflow *(planned)*

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Cloud**: Microsoft Azure
- **Monitoring**: Grafana, Prometheus *(planned)*
- **CI/CD**: GitHub Actions *(planned)*

## Roadmap

### Phase 1: Foundation ✅
- [x] Database schema and infrastructure
- [x] Development environment setup
- [x] Application orchestration scripts

### Phase 2: Core Application 🚧
- [ ] Next.js web application
- [ ] User authentication and profiles
- [ ] Audio recording and upload
- [ ] Basic CIQ analysis

### Phase 3: AI Integration 🚧
- [ ] Langflow workflow engine
- [ ] Audio transcription pipeline
- [ ] AI recommendation system
- [ ] CIQ scoring algorithm

### Phase 4: Community Features 🚧
- [ ] Teacher Lounge forum
- [ ] Resource library
- [ ] Achievements and gamification
- [ ] Coach-teacher collaboration

### Phase 5: Analytics & Insights 🚧
- [ ] ClickHouse data warehouse
- [ ] Advanced reporting
- [ ] Performance dashboards
- [ ] Predictive analytics

## Support

For questions, issues, or contributions:
- Review the comprehensive documentation in each component
- Check troubleshooting sections
- Use the health check commands for diagnostics
- Follow the development setup guide

---

**ANDI Labs** - Empowering educators through AI-powered insights
*"Your favorite teacher's favorite teacher"*