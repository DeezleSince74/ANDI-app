# ANDI Azure Deployment Guide

This directory contains Azure deployment scripts and templates for all ANDI components using Infrastructure as Code (Bicep templates).

## Architecture Overview

The ANDI platform deploys to Azure using the following components:

- **PostgreSQL Flexible Server** - Main application database
- **Azure Container Instances** - ClickHouse data warehouse with Grafana and Prometheus
- **Azure Container Apps** - Airflow data pipelines with auto-scaling
- **Azure Storage** - File shares for persistent data
- **Azure Cache for Redis** - Celery broker for Airflow
- **Log Analytics Workspace** - Centralized logging and monitoring

## Prerequisites

Before deploying, ensure you have:

1. **Azure CLI** installed and authenticated
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login to Azure
   az login
   
   # Set your subscription (optional)
   az account set --subscription "your-subscription-id"
   ```

2. **Bicep CLI** installed
   ```bash
   az bicep install
   ```

3. **Container Apps extension** (for data pipelines)
   ```bash
   az extension add --name containerapp
   ```

4. **Proper Azure permissions** for:
   - Creating resource groups
   - Deploying PostgreSQL Flexible Servers
   - Creating Container Instances and Container Apps
   - Managing Storage Accounts
   - Configuring networking resources

## Quick Start

### Deploy All Components

The simplest way to deploy the entire ANDI platform:

```bash
# Deploy to development environment
./deploy-all.sh -g andi-rg-dev -e dev

# Deploy to production environment
./deploy-all.sh -g andi-rg-prod -e prod -l eastus2
```

### Deploy Individual Components

You can also deploy components individually:

```bash
# Deploy only the database
./deploy-all.sh -g andi-rg-dev -c database

# Deploy database and warehouse
./deploy-all.sh -g andi-rg-dev -c database,warehouse

# Deploy only data pipelines (requires existing database)
./deploy-all.sh -g andi-rg-dev -c pipelines
```

## Component-Specific Deployment

### 1. Database (PostgreSQL)

```bash
cd app/app-database/azure
./deploy.sh -g andi-rg-dev -e dev
```

**Resources Created:**
- PostgreSQL Flexible Server (with extensions)
- Database with proper schema
- Firewall rules for Azure services
- Diagnostic settings for monitoring

**Outputs:**
- PostgreSQL server FQDN
- Connection string
- Database name

### 2. Data Warehouse (ClickHouse)

```bash
cd app/data-warehouse/azure
./deploy.sh -g andi-rg-dev -e dev
```

**Resources Created:**
- Container Instance with ClickHouse, Grafana, Prometheus
- Storage Account with file shares for persistence
- Network Security Group with proper port access
- Virtual Network for secure communication

**Outputs:**
- ClickHouse HTTP endpoint
- Grafana dashboard URL
- Prometheus monitoring URL

### 3. Data Pipelines (Airflow)

```bash
cd app/data-pipelines/azure
./deploy.sh -g andi-rg-dev -e dev --postgres-server andi-postgres-dev
```

**Resources Created:**
- Container Apps Environment
- Airflow Webserver, Scheduler, and Worker apps
- Redis Cache for Celery broker
- Storage Account for DAGs and logs
- Log Analytics Workspace

**Outputs:**
- Airflow Web UI URL
- Admin credentials
- Storage account for DAG uploads

## Environment Configuration

### Development (`dev`)
- **Database:** Standard_B2s (2 vCores, 4GB RAM)
- **ClickHouse:** Standard_D2s_v3 (2 vCores, 8GB RAM)
- **Airflow:** 1 scheduler, 1 worker, auto-scaling disabled
- **Storage:** Standard_LRS
- **Backup:** 7 days retention

### Production (`prod`)
- **Database:** Standard_D4s_v3 (4 vCores, 16GB RAM) with HA
- **ClickHouse:** Standard_D4s_v3 (4 vCores, 16GB RAM)
- **Airflow:** 2 schedulers, 3 workers, auto-scaling enabled
- **Storage:** Standard_GRS
- **Backup:** 30 days retention

## Network Architecture

```
Azure Virtual Network (10.0.0.0/16)
├── Database Subnet (10.0.0.0/24)
│   └── PostgreSQL Flexible Server
├── ClickHouse Subnet (10.0.1.0/24)
│   └── Container Instance
└── Airflow Subnet (10.1.1.0/24)
    └── Container Apps Environment
```

## Security Features

### Database Security
- SSL/TLS encryption in transit
- Private endpoint support
- Azure AD authentication
- Firewall rules restricting access
- Automatic backup encryption

### Network Security
- Virtual Network isolation
- Network Security Groups
- Service endpoints for storage
- Private DNS zones

### Application Security
- Managed identities for service authentication
- Key Vault integration for secrets
- HTTPS-only traffic
- Container image vulnerability scanning

## Monitoring & Observability

### Built-in Monitoring
- **Log Analytics Workspace** - Centralized logging
- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Azure Monitor** - Platform metrics and alerts

### Custom Dashboards
- Database performance metrics
- ClickHouse query performance
- Airflow task execution status
- Resource utilization trends

## Cost Management

### Development Environment (~$200-400/month)
- PostgreSQL: ~$50/month
- ClickHouse Container: ~$100/month
- Airflow Container Apps: ~$80/month
- Storage: ~$20/month
- Networking: ~$10/month

### Production Environment (~$800-1500/month)
- PostgreSQL with HA: ~$300/month
- ClickHouse Container: ~$400/month
- Airflow Container Apps: ~$300/month
- Storage with GRS: ~$80/month
- Load Balancer & Networking: ~$50/month

### Cost Optimization Tips
1. **Use development sizes** for non-production environments
2. **Stop Container Instances** when not in use
3. **Enable auto-scaling** to match usage patterns
4. **Use Azure Reserved Instances** for predictable workloads
5. **Monitor resource utilization** and right-size accordingly

## Backup & Disaster Recovery

### Automated Backups
- **PostgreSQL:** Point-in-time recovery up to 35 days
- **ClickHouse:** Azure Storage redundancy + custom backup scripts
- **Airflow:** DAGs and configurations in Git + Azure Storage

### Manual Backup Commands
```bash
# Database backup
az postgres flexible-server backup list --resource-group andi-rg-prod --name andi-postgres-prod

# Export ClickHouse data
curl "http://clickhouse-endpoint:8123/" --data "SELECT * FROM database.table FORMAT CSVWithNames" > backup.csv

# Download Airflow DAGs
az storage file download-batch --account-name andiairflowprod --source airflow-dags --destination ./dags-backup/
```

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Failures**
   ```bash
   # Check firewall rules
   az postgres flexible-server firewall-rule list --resource-group andi-rg-dev --name andi-postgres-dev
   
   # Test connection
   psql "postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require"
   ```

2. **ClickHouse Container Not Starting**
   ```bash
   # Check container logs
   az container logs --resource-group andi-rg-dev --name andi-clickhouse-dev --container-name clickhouse
   
   # Restart container
   az container restart --resource-group andi-rg-dev --name andi-clickhouse-dev
   ```

3. **Airflow Services Failing**
   ```bash
   # Check webserver logs
   az containerapp logs show --name andi-airflow-webserver-dev --resource-group andi-rg-dev
   
   # Check scheduler logs
   az containerapp logs show --name andi-airflow-scheduler-dev --resource-group andi-rg-dev
   ```

### Performance Tuning

1. **Database Performance**
   - Monitor connection pool usage
   - Optimize query performance
   - Consider read replicas for analytics

2. **ClickHouse Performance**
   - Monitor disk I/O and memory usage
   - Optimize table schemas and indexes
   - Consider clustering for large datasets

3. **Airflow Performance**
   - Scale workers based on task load
   - Optimize DAG design and dependencies
   - Monitor task execution times

## Maintenance

### Regular Tasks
- **Weekly:** Review security alerts and apply patches
- **Monthly:** Analyze cost reports and optimize resources
- **Quarterly:** Review backup and recovery procedures
- **Annually:** Conduct disaster recovery testing

### Update Procedures
```bash
# Update Bicep templates
az bicep upgrade

# Redeploy with new parameters
./deploy-all.sh -g andi-rg-prod -e prod --force-update

# Update container images
az container restart --resource-group andi-rg-prod --name andi-clickhouse-prod
az containerapp update --name andi-airflow-webserver-prod --resource-group andi-rg-prod --image apache/airflow:2.8.0
```

## Support

For deployment issues:
1. Check Azure Activity Log for error details
2. Review component-specific logs
3. Verify network connectivity and security rules
4. Consult Azure documentation for service-specific guidance

For ANDI application issues:
1. Check application logs in Log Analytics Workspace
2. Review Grafana dashboards for performance metrics
3. Verify data pipeline execution in Airflow UI