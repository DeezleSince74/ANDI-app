#!/bin/bash

# ANDI Data Warehouse Azure Deployment Script
# Deploys ClickHouse, Grafana, and Prometheus to Azure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCE_GROUP=""
LOCATION=""
ENVIRONMENT=""
ADMIN_LOGIN=""
ADMIN_PASSWORD=""
SUBSCRIPTION_ID=""

# Default values
DEFAULT_LOCATION="eastus"
DEFAULT_ENVIRONMENT="dev"
DEFAULT_ADMIN_LOGIN="clickhouse_admin"

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

# Help function
show_help() {
    cat << EOF
ANDI Data Warehouse Azure Deployment Script

Usage: $0 [OPTIONS]

Options:
    -g, --resource-group    Azure resource group name (required)
    -l, --location          Azure location (default: $DEFAULT_LOCATION)
    -e, --environment       Environment name (dev|staging|prod) (default: $DEFAULT_ENVIRONMENT)
    -u, --admin-login       ClickHouse administrator login (default: $DEFAULT_ADMIN_LOGIN)
    -p, --admin-password    ClickHouse administrator password (will prompt if not provided)
    -s, --subscription      Azure subscription ID (will use default if not provided)
    -h, --help             Show this help message

Examples:
    $0 -g andi-rg-dev -l eastus -e dev
    $0 -g andi-rg-prod -l eastus2 -e prod -u admin -p mypassword

Environment Variables:
    AZURE_SUBSCRIPTION_ID   Default subscription ID
    AZURE_LOCATION         Default location
    AZURE_ENVIRONMENT      Default environment

Prerequisites:
    - Azure CLI installed and authenticated
    - Bicep CLI installed
    - Proper permissions in Azure subscription

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

# Prompt for password if not provided
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo -n "Enter ClickHouse administrator password: "
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
log "🚀 ANDI Data Warehouse Azure Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"
echo "Admin Login: $ADMIN_LOGIN"
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

# Deploy the Bicep template
log "🏗️  Deploying ClickHouse data warehouse infrastructure..."
DEPLOYMENT_NAME="andi-clickhouse-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$SCRIPT_DIR/azure-clickhouse.bicep" \
    --parameters \
        location="$LOCATION" \
        environmentName="$ENVIRONMENT" \
        administratorLogin="$ADMIN_LOGIN" \
        administratorLoginPassword="$ADMIN_PASSWORD" \
    --verbose

if [[ $? -eq 0 ]]; then
    success "✅ Data warehouse deployment completed successfully!"
    
    # Get deployment outputs
    log "📋 Retrieving deployment information..."
    
    CLICKHOUSE_ENDPOINT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.clickhouseEndpoint.value" \
        --output tsv)
    
    GRAFANA_ENDPOINT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.grafanaEndpoint.value" \
        --output tsv)
    
    PROMETHEUS_ENDPOINT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.prometheusEndpoint.value" \
        --output tsv)
    
    STORAGE_ACCOUNT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.storageAccountName.value" \
        --output tsv)
    
    CONTAINER_GROUP=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.containerGroupName.value" \
        --output tsv)
    
    echo
    log "🌐 Access URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ClickHouse HTTP Interface: $CLICKHOUSE_ENDPOINT"
    echo "ClickHouse Play UI:        $CLICKHOUSE_ENDPOINT/play"
    echo "Grafana Dashboard:         $GRAFANA_ENDPOINT (admin/$ADMIN_PASSWORD)"
    echo "Prometheus:                $PROMETHEUS_ENDPOINT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "📊 Resource Information:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Storage Account: $STORAGE_ACCOUNT"
    echo "Container Group: $CONTAINER_GROUP"
    echo "Resource Group:  $RESOURCE_GROUP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "🔧 Management Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "View container logs:    az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP --container-name clickhouse"
    echo "Restart containers:     az container restart --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP"
    echo "Stop containers:        az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP"
    echo "Start containers:       az container start --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP"
    echo "Delete deployment:      az group delete --name $RESOURCE_GROUP --yes"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "⏳ Waiting for services to start (this may take a few minutes)..."
    sleep 30
    
    # Test connectivity
    log "🔍 Testing service connectivity..."
    
    # Test ClickHouse
    if curl -s --connect-timeout 10 "$CLICKHOUSE_ENDPOINT/ping" > /dev/null; then
        success "ClickHouse is responding"
    else
        warning "ClickHouse is not yet responding (may need more time to start)"
    fi
    
    # Test Grafana
    if curl -s --connect-timeout 10 "$GRAFANA_ENDPOINT/api/health" > /dev/null; then
        success "Grafana is responding"
    else
        warning "Grafana is not yet responding (may need more time to start)"
    fi
    
    # Test Prometheus
    if curl -s --connect-timeout 10 "$PROMETHEUS_ENDPOINT/-/healthy" > /dev/null; then
        success "Prometheus is responding"
    else
        warning "Prometheus is not yet responding (may need more time to start)"
    fi
    
    echo
    success "🎉 ANDI Data Warehouse deployment completed successfully!"
    log "📖 Next steps:"
    echo "  1. Initialize the ClickHouse schema using the local scripts"
    echo "  2. Configure Grafana dashboards and data sources"
    echo "  3. Set up data pipelines to populate the warehouse"
    echo "  4. Configure monitoring and alerting"
    
else
    error "❌ Deployment failed. Check the error messages above."
    exit 1
fi