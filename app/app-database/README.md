# ANDI Database Layer

This directory contains the complete database infrastructure for ANDI's PostgreSQL database, supporting both local development and Azure cloud deployment.

## Quick Start

1. **Setup Environment**
   ```bash
   make env-setup
   # Edit .env with your configuration
   ```

2. **Start Database**
   ```bash
   make up
   ```

3. **Seed with Test Data**
   ```bash
   make seed
   ```

4. **Access Database**
   ```bash
   make psql
   # Or visit http://localhost:5050 for PgAdmin
   ```

## Structure

```
app-database/
├── init/              # Database initialization scripts (auto-executed)
├── migrations/        # Schema migrations and versioning
├── seeds/            # Test and sample data
├── scripts/          # Operational scripts (backup, restore, health)
├── lib/              # Database connection utilities
├── azure/            # Azure deployment configuration
├── pgadmin/          # PgAdmin configuration
├── docker-compose.yml # Local development containers
├── Dockerfile        # Production PostgreSQL image
└── Makefile          # Database management commands
```

## Database Schema

The database implements a comprehensive schema based on the ANDI ER diagram with the following key components:

### Core Schemas
- **auth**: User management and authentication
- **core**: Main application data (sessions, goals, activities)
- **analytics**: CIQ metrics and performance data
- **community**: Forum questions, answers, and interactions
- **gamification**: Achievements, trivia, and user progress

### Key Features
- **Row Level Security (RLS)**: Complete data isolation between users
- **Automated Triggers**: Auto-updating timestamps and statistics
- **Comprehensive Indexing**: Optimized for common query patterns
- **Full-Text Search**: PostgreSQL-native search capabilities
- **JSONB Storage**: Flexible metadata and configuration storage

## Available Commands

| Command | Description |
|---------|-------------|
| `make up` | Start database containers |
| `make down` | Stop and remove containers |
| `make restart` | Restart database services |
| `make logs` | View database logs |
| `make psql` | Open PostgreSQL CLI |
| `make backup` | Create database backup |
| `make restore BACKUP=<file>` | Restore from backup |
| `make health-check` | Run comprehensive health check |
| `make seed` | Load test data |
| `make clean` | Remove all data (WARNING) |
| `make reset` | Clean + fresh start |
| `make azure-deploy` | Deploy to Azure PostgreSQL |

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Make (for convenience commands)
- PostgreSQL client tools (optional, for direct access)

### Local Development
```bash
# Clone and setup
cd app-database
make env-setup

# Start services
make up

# Verify everything is working
make health-check

# Load sample data
make seed

# Access database
make psql
```

### PgAdmin Access
- URL: http://localhost:5050
- Email: admin@andi.local (configurable in .env)
- Password: admin_password (configurable in .env)

## Production Deployment

### Azure PostgreSQL
```bash
# Set environment variables
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export POSTGRES_ADMIN_USER="andi_admin"
export POSTGRES_ADMIN_PASSWORD="secure-password"
export ENVIRONMENT="prod"

# Deploy infrastructure
cd azure
./deploy.sh

# Deploy schema
make azure-deploy
```

### Environment Variables
```bash
# Local Development
POSTGRES_USER=andi_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=andi_db
POSTGRES_PORT=5432

# Azure Production
AZURE_POSTGRES_HOST=your-server.postgres.database.azure.com
AZURE_POSTGRES_USER=andi_admin
AZURE_POSTGRES_PASSWORD=secure_password
AZURE_POSTGRES_DB=andi_db
AZURE_POSTGRES_SSL_MODE=require
```

## Database Design Principles

### Security
- **Row Level Security**: Every table has RLS policies
- **Role-based Access**: Teacher, Coach, Admin roles with appropriate permissions
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Trails**: Comprehensive logging and change tracking

### Performance
- **Strategic Indexing**: B-tree, GIN, and partial indexes
- **Connection Pooling**: Configurable pool sizes for different environments
- **Query Optimization**: Optimized for common ANDI use patterns
- **Monitoring**: Built-in health checks and performance metrics

### Scalability
- **Schema Organization**: Logical separation using PostgreSQL schemas
- **Efficient JSONB**: Structured storage for flexible data
- **Proper Constraints**: Data integrity without performance penalties
- **Migration System**: Version-controlled schema changes

## Backup and Recovery

### Automated Backups
```bash
# Manual backup
make backup

# Automated daily backups (configure cron)
0 2 * * * cd /path/to/app-database && make backup
```

### Restore Process
```bash
# List available backups
ls -la backups/

# Restore from specific backup
make restore BACKUP=./backups/andi_backup_20240101_120000.sql.gz
```

### Azure Backup
Azure PostgreSQL includes automatic backups with point-in-time recovery up to 35 days.

## Monitoring and Health Checks

### Health Check
```bash
# Comprehensive health check
make health-check
```

### Monitoring Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size('andi_db'));

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname IN ('auth', 'core', 'analytics', 'community', 'gamification')
ORDER BY pg_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Considerations

### Access Control
- Database users have minimal required permissions
- Application uses connection pooling with single database user
- Row Level Security enforces data isolation
- All tables have appropriate RLS policies

### Data Protection
- Passwords are hashed using bcrypt
- Sensitive configuration in environment variables
- SSL/TLS encryption for all connections
- Audit logging enabled for all data changes

## Integration

### Application Connection
```javascript
const { db } = require('./lib/connection');

// Initialize connection
await db.initialize();

// Execute queries
const result = await db.query('SELECT * FROM auth.users WHERE id = $1', [userId]);

// Use transactions
await db.transaction(async (client) => {
    await client.query('INSERT INTO ...');
    await client.query('UPDATE ...');
});
```

### External Systems
- **Audio Storage**: Cloud storage URLs in database
- **Analytics Pipeline**: Events exported to ClickHouse
- **Authentication**: JWT tokens validated against user records
- **Real-time Updates**: PostgreSQL LISTEN/NOTIFY for live updates

## Troubleshooting

### Common Issues

**Connection refused**
```bash
# Check if containers are running
docker ps

# Check logs
make logs

# Restart services
make restart
```

**Permission denied**
```bash
# Verify environment variables
cat .env

# Check database user permissions
make psql
\du
```

**Slow queries**
```sql
-- Enable query logging
SET log_statement = 'all';

-- Check slow queries
SELECT query, calls, mean_time, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

## Contributing

### Schema Changes
1. Create migration file in `migrations/versions/`
2. Test locally with `make migrate`
3. Update schema documentation
4. Test with sample data

### Adding Seed Data
1. Update `seeds/seed-data.sql`
2. Test with `make reset && make seed`
3. Verify data integrity

For questions or issues, please refer to the ANDI development documentation or create an issue in the repository.