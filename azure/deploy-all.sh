#!/bin/bash

# ANDI Complete Azure Deployment Script
# Deploys all ANDI components to Azure: Database, Data Warehouse, and Data Pipelines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RESOURCE_GROUP=""
LOCATION=""
ENVIRONMENT=""
ADMIN_LOGIN=""
ADMIN_PASSWORD=""
SUBSCRIPTION_ID=""
COMPONENTS="all"

# Default values
DEFAULT_LOCATION="eastus"
DEFAULT_ENVIRONMENT="dev"
DEFAULT_ADMIN_LOGIN="andi_admin"

# Utility functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${PURPLE}ℹ${NC} $1"
}

# Help function
show_help() {
    cat << EOF
ANDI Complete Azure Deployment Script

Usage: $0 [OPTIONS]

Options:
    -g, --resource-group    Azure resource group name (required)
    -l, --location          Azure location (default: $DEFAULT_LOCATION)
    -e, --environment       Environment name (dev|staging|prod) (default: $DEFAULT_ENVIRONMENT)
    -u, --admin-login       Administrator login (default: $DEFAULT_ADMIN_LOGIN)
    -p, --admin-password    Administrator password (will prompt if not provided)
    -s, --subscription      Azure subscription ID (will use default if not provided)
    -c, --components        Components to deploy (database|warehouse|pipelines|all) (default: all)
    -h, --help             Show this help message

Examples:
    $0 -g andi-rg-dev -l eastus -e dev
    $0 -g andi-rg-prod -l eastus2 -e prod -u admin -p mypassword
    $0 -g andi-rg-dev -c database,warehouse

Environment Variables:
    AZURE_SUBSCRIPTION_ID   Default subscription ID
    AZURE_LOCATION         Default location
    AZURE_ENVIRONMENT      Default environment

Prerequisites:
    - Azure CLI installed and authenticated
    - Bicep CLI installed
    - Container Apps extension: az extension add --name containerapp
    - Proper permissions in Azure subscription

Deployment Order:
    1. PostgreSQL Database (app-database)
    2. ClickHouse Data Warehouse (data-warehouse)
    3. Airflow Data Pipelines (data-pipelines)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -u|--admin-login)
            ADMIN_LOGIN="$2"
            shift 2
            ;;
        -p|--admin-password)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        -s|--subscription)
            SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        -c|--components)
            COMPONENTS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set defaults from environment variables or hardcoded defaults
LOCATION="${LOCATION:-${AZURE_LOCATION:-$DEFAULT_LOCATION}}"
ENVIRONMENT="${ENVIRONMENT:-${AZURE_ENVIRONMENT:-$DEFAULT_ENVIRONMENT}}"
ADMIN_LOGIN="${ADMIN_LOGIN:-$DEFAULT_ADMIN_LOGIN}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-$AZURE_SUBSCRIPTION_ID}"

# Validate required parameters
if [[ -z "$RESOURCE_GROUP" ]]; then
    error "Resource group name is required"
    show_help
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    error "Environment must be one of: dev, staging, prod"
    exit 1
fi

# Convert comma-separated components to array
IFS=',' read -ra DEPLOY_COMPONENTS <<< "$COMPONENTS"

# Handle 'all' component
if [[ "$COMPONENTS" == "all" ]]; then
    DEPLOY_COMPONENTS=("database" "warehouse" "pipelines")
fi

# Validate components
for component in "${DEPLOY_COMPONENTS[@]}"; do
    if [[ ! "$component" =~ ^(database|warehouse|pipelines)$ ]]; then
        error "Invalid component: $component. Must be one of: database, warehouse, pipelines, all"
        exit 1
    fi
done

# Prompt for password if not provided
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo -n "Enter administrator password: "
    read -s ADMIN_PASSWORD
    echo
    
    if [[ -z "$ADMIN_PASSWORD" ]]; then
        error "Administrator password is required"
        exit 1
    fi
fi

# Validate password strength
if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
    error "Password must be at least 8 characters long"
    exit 1
fi

# Check Azure CLI
if ! command -v az &> /dev/null; then
    error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    error "Please log in to Azure CLI first: az login"
    exit 1
fi

# Set subscription if provided
if [[ -n "$SUBSCRIPTION_ID" ]]; then
    log "Setting Azure subscription to: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Display configuration
cat << 'EOF'
     _    _   _ ____ ___ 
    / \  | \ | |  _ \_ _|
   / _ \ |  \| | | | | | 
  / ___ \| |\  | |_| | | 
 /_/   \_\_| \_|____/___|
                        
 Azure Deployment Script
 
EOF

log "🚀 ANDI Complete Azure Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"
echo "Admin Login: $ADMIN_LOGIN"
echo "Components: ${DEPLOY_COMPONENTS[*]}"
echo "Subscription: $(az account show --query id -o tsv)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create resource group if it doesn't exist
log "📦 Creating resource group if it doesn't exist..."
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    success "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    success "Resource group '$RESOURCE_GROUP' created"
fi

# Track deployment outputs
POSTGRES_SERVER=""
CLICKHOUSE_ENDPOINT=""
AIRFLOW_URL=""

# Deploy components in order
for component in "${DEPLOY_COMPONENTS[@]}"; do
    case $component in
        database)
            log "🗄️  Deploying PostgreSQL Database..."
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            cd "$PROJECT_ROOT/app/app-database/azure"
            
            ./deploy.sh \
                --resource-group "$RESOURCE_GROUP" \
                --location "$LOCATION" \
                --environment "$ENVIRONMENT" \
                --admin-login "$ADMIN_LOGIN" \
                --admin-password "$ADMIN_PASSWORD"
            
            # Get PostgreSQL server name for other components
            POSTGRES_SERVER="andi-postgres-$ENVIRONMENT"
            success "Database deployment completed"
            ;;
            
        warehouse)
            log "📊 Deploying ClickHouse Data Warehouse..."
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            cd "$PROJECT_ROOT/app/data-warehouse/azure"
            
            ./deploy.sh \
                --resource-group "$RESOURCE_GROUP" \
                --location "$LOCATION" \
                --environment "$ENVIRONMENT" \
                --admin-login "$ADMIN_LOGIN" \
                --admin-password "$ADMIN_PASSWORD"
            
            success "Data warehouse deployment completed"
            ;;
            
        pipelines)
            log "🔄 Deploying Airflow Data Pipelines..."
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            # Ensure PostgreSQL server exists for Airflow metadata
            if [[ -z "$POSTGRES_SERVER" ]]; then
                POSTGRES_SERVER="andi-postgres-$ENVIRONMENT"
                
                # Verify server exists
                if ! az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" &> /dev/null; then
                    error "PostgreSQL server '$POSTGRES_SERVER' not found. Deploy database component first."
                    exit 1
                fi
            fi
            
            cd "$PROJECT_ROOT/app/data-pipelines/azure"
            
            ./deploy.sh \
                --resource-group "$RESOURCE_GROUP" \
                --location "$LOCATION" \
                --environment "$ENVIRONMENT" \
                --admin-login "$ADMIN_LOGIN" \
                --admin-password "$ADMIN_PASSWORD" \
                --postgres-server "$POSTGRES_SERVER"
            
            success "Data pipelines deployment completed"
            ;;
    esac
    
    echo
done

# Return to original directory
cd "$SCRIPT_DIR"

# Get final deployment information
log "📋 Gathering deployment information..."

# Get URLs from each component
if [[ " ${DEPLOY_COMPONENTS[*]} " =~ " database " ]]; then
    POSTGRES_FQDN=$(az postgres flexible-server show \
        --resource-group "$RESOURCE_GROUP" \
        --name "andi-postgres-$ENVIRONMENT" \
        --query "fullyQualifiedDomainName" \
        --output tsv 2>/dev/null || echo "Not deployed")
fi

if [[ " ${DEPLOY_COMPONENTS[*]} " =~ " warehouse " ]]; then
    # Get ClickHouse container IP
    CLICKHOUSE_IP=$(az container show \
        --resource-group "$RESOURCE_GROUP" \
        --name "andi-clickhouse-$ENVIRONMENT" \
        --query "ipAddress.ip" \
        --output tsv 2>/dev/null || echo "Not deployed")
    
    if [[ "$CLICKHOUSE_IP" != "Not deployed" ]]; then
        CLICKHOUSE_ENDPOINT="http://$CLICKHOUSE_IP:8123"
        GRAFANA_ENDPOINT="http://$CLICKHOUSE_IP:3000"
        PROMETHEUS_ENDPOINT="http://$CLICKHOUSE_IP:9090"
    fi
fi

if [[ " ${DEPLOY_COMPONENTS[*]} " =~ " pipelines " ]]; then
    AIRFLOW_URL=$(az containerapp show \
        --name "andi-airflow-webserver-$ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.configuration.ingress.fqdn" \
        --output tsv 2>/dev/null || echo "Not deployed")
    
    if [[ "$AIRFLOW_URL" != "Not deployed" && "$AIRFLOW_URL" != "" ]]; then
        AIRFLOW_URL="https://$AIRFLOW_URL"
    fi
fi

# Display final summary
echo
success "🎉 ANDI Azure Deployment Completed!"
log "🌐 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -n "$POSTGRES_FQDN" && "$POSTGRES_FQDN" != "Not deployed" ]]; then
    echo "PostgreSQL Database:       $POSTGRES_FQDN:5432"
    echo "PgAdmin (if deployed):     (Check Azure Container Instances)"
fi

if [[ -n "$CLICKHOUSE_ENDPOINT" ]]; then
    echo "ClickHouse HTTP:           $CLICKHOUSE_ENDPOINT"
    echo "ClickHouse Play UI:        $CLICKHOUSE_ENDPOINT/play"
    echo "Grafana Dashboard:         $GRAFANA_ENDPOINT (admin/$ADMIN_LOGIN)"
    echo "Prometheus:                $PROMETHEUS_ENDPOINT"
fi

if [[ -n "$AIRFLOW_URL" && "$AIRFLOW_URL" != "Not deployed" ]]; then
    echo "Airflow Web UI:            $AIRFLOW_URL"
    echo "Airflow Login:             $ADMIN_LOGIN / [your password]"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo
log "🔧 Management Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "View all resources:        az resource list --resource-group $RESOURCE_GROUP --output table"
echo "Monitor costs:             az consumption usage list --start-date $(date -d '1 month ago' '+%Y-%m-%d') --end-date $(date '+%Y-%m-%d')"
echo "Delete all resources:      az group delete --name $RESOURCE_GROUP --yes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo
log "📖 Next Steps:"
echo "  1. Configure database schemas and seed data"
echo "  2. Set up ClickHouse warehouse schemas"
echo "  3. Upload Airflow DAGs and configure connections"
echo "  4. Set up monitoring and alerting"
echo "  5. Configure SSL certificates for production"
echo "  6. Set up backup and disaster recovery"

echo
info "💡 Cost Optimization Tips:"
echo "  - Use 'dev' environment for development (smaller resources)"
echo "  - Stop Container Instances when not in use"
echo "  - Monitor resource utilization and scale accordingly"
echo "  - Consider Azure Reserved Instances for production"

echo
warning "🔒 Security Reminders:"
echo "  - Change default passwords"
echo "  - Configure firewall rules"
echo "  - Enable Azure AD authentication where possible"
echo "  - Set up proper backup retention policies"
echo "  - Review and configure network security groups"