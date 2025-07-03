#!/bin/bash

# ANDI Langflow Azure Deployment Script
# Deploys Langflow for AI workflows on Azure Container Apps

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
POSTGRES_SERVER=""
LANGFLOW_MODE=""

# Default values
DEFAULT_LOCATION="eastus"
DEFAULT_ENVIRONMENT="dev"
DEFAULT_ADMIN_LOGIN="langflow_admin"

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
ANDI Langflow Azure Deployment Script

Usage: $0 [OPTIONS]

Options:
    -g, --resource-group    Azure resource group name (required)
    -l, --location          Azure location (default: $DEFAULT_LOCATION)
    -e, --environment       Environment name (dev|staging|prod) (default: $DEFAULT_ENVIRONMENT)
    -u, --admin-login       Langflow administrator login (default: $DEFAULT_ADMIN_LOGIN)
    -p, --admin-password    Langflow administrator password (will prompt if not provided)
    -s, --subscription      Azure subscription ID (will use default if not provided)
    --postgres-server       PostgreSQL server name (required for Langflow database)
    --mode                  Langflow mode (ide|runtime) (auto-detected from environment)
    -h, --help             Show this help message

Examples:
    $0 -g andi-rg-dev -l eastus -e dev --postgres-server andi-postgres-dev
    $0 -g andi-rg-prod -l eastus2 -e prod -u admin -p mypassword --postgres-server andi-postgres-prod --mode runtime

Environment Variables:
    AZURE_SUBSCRIPTION_ID   Default subscription ID
    AZURE_LOCATION         Default location
    AZURE_ENVIRONMENT      Default environment

Prerequisites:
    - Azure CLI installed and authenticated
    - Bicep CLI installed
    - Container Apps extension: az extension add --name containerapp
    - Existing PostgreSQL server for Langflow database
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
        --postgres-server)
            POSTGRES_SERVER="$2"
            shift 2
            ;;
        --mode)
            LANGFLOW_MODE="$2"
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

# Auto-detect Langflow mode based on environment
if [[ -z "$LANGFLOW_MODE" ]]; then
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        LANGFLOW_MODE="runtime"
    else
        LANGFLOW_MODE="ide"
    fi
fi

# Validate required parameters
if [[ -z "$RESOURCE_GROUP" ]]; then
    error "Resource group name is required"
    show_help
    exit 1
fi

if [[ -z "$POSTGRES_SERVER" ]]; then
    error "PostgreSQL server name is required for Langflow database"
    show_help
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    error "Environment must be one of: dev, staging, prod"
    exit 1
fi

# Validate Langflow mode
if [[ ! "$LANGFLOW_MODE" =~ ^(ide|runtime)$ ]]; then
    error "Langflow mode must be one of: ide, runtime"
    exit 1
fi

# Prompt for password if not provided
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo -n "Enter Langflow administrator password: "
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

# Check for Container Apps extension
if ! az extension show --name containerapp &> /dev/null; then
    log "Installing Azure Container Apps extension..."
    az extension add --name containerapp
fi

# Set subscription if provided
if [[ -n "$SUBSCRIPTION_ID" ]]; then
    log "Setting Azure subscription to: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Display configuration
log "🚀 ANDI Langflow Azure Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"
echo "Langflow Mode: $LANGFLOW_MODE"
echo "Admin Login: $ADMIN_LOGIN"
echo "PostgreSQL Server: $POSTGRES_SERVER"
echo "Subscription: $(az account show --query id -o tsv)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify PostgreSQL server exists
log "🔍 Verifying PostgreSQL server exists..."
if az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" &> /dev/null; then
    success "PostgreSQL server '$POSTGRES_SERVER' found"
else
    error "PostgreSQL server '$POSTGRES_SERVER' not found in resource group '$RESOURCE_GROUP'"
    error "Please deploy the database first or specify the correct server name"
    exit 1
fi

# Create Langflow database if it doesn't exist
log "📊 Creating Langflow database..."
LANGFLOW_DB_NAME="langflow_db"

# Check if database exists
if az postgres flexible-server db show --resource-group "$RESOURCE_GROUP" --server-name "$POSTGRES_SERVER" --database-name "$LANGFLOW_DB_NAME" &> /dev/null; then
    success "Langflow database '$LANGFLOW_DB_NAME' already exists"
else
    az postgres flexible-server db create \
        --resource-group "$RESOURCE_GROUP" \
        --server-name "$POSTGRES_SERVER" \
        --database-name "$LANGFLOW_DB_NAME"
    success "Langflow database '$LANGFLOW_DB_NAME' created"
fi

# Create resource group if it doesn't exist
log "📦 Creating resource group if it doesn't exist..."
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    success "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    success "Resource group '$RESOURCE_GROUP' created"
fi

# Deploy the Bicep template
log "🏗️  Deploying Langflow AI workflow infrastructure..."
DEPLOYMENT_NAME="andi-langflow-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$SCRIPT_DIR/azure-langflow.bicep" \
    --parameters \
        location="$LOCATION" \
        environmentName="$ENVIRONMENT" \
        administratorLogin="$ADMIN_LOGIN" \
        administratorLoginPassword="$ADMIN_PASSWORD" \
        postgresqlServerName="$POSTGRES_SERVER" \
        langflowDatabaseName="$LANGFLOW_DB_NAME" \
        langflowMode="$LANGFLOW_MODE" \
    --verbose

if [[ $? -eq 0 ]]; then
    success "✅ Langflow deployment completed successfully!"
    
    # Get deployment outputs
    log "📋 Retrieving deployment information..."
    
    LANGFLOW_URL=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.langflowUrl.value" \
        --output tsv)
    
    STORAGE_ACCOUNT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.storageAccountName.value" \
        --output tsv)
    
    REDIS_HOSTNAME=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.redisHostname.value" \
        --output tsv)
    
    CONTAINER_ENV=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.containerAppsEnvironmentName.value" \
        --output tsv)
    
    LOG_WORKSPACE=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.logAnalyticsWorkspaceName.value" \
        --output tsv)
    
    echo
    log "🌐 Access URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ "$LANGFLOW_MODE" == "ide" ]]; then
        echo "Langflow IDE:              $LANGFLOW_URL"
        echo "Langflow Login:            $ADMIN_LOGIN / [your password]"
    else
        echo "Langflow API Runtime:      $LANGFLOW_URL/api/v1"
        echo "Health Check:              $LANGFLOW_URL/api/v1/version"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "📊 Resource Information:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Storage Account:           $STORAGE_ACCOUNT"
    echo "Redis Cache:               $REDIS_HOSTNAME"
    echo "Container Apps Environment: $CONTAINER_ENV"
    echo "Log Analytics Workspace:   $LOG_WORKSPACE"
    echo "Database Name:             $LANGFLOW_DB_NAME"
    echo "Resource Group:            $RESOURCE_GROUP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "🔧 Management Commands:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "View app logs:             az containerapp logs show --name andi-langflow-$ENVIRONMENT --resource-group $RESOURCE_GROUP"
    echo "Scale app:                 az containerapp update --name andi-langflow-$ENVIRONMENT --resource-group $RESOURCE_GROUP --min-replicas 2 --max-replicas 5"
    echo "Upload flows:              az storage file upload-batch --account-name $STORAGE_ACCOUNT --destination langflow-flows --source ./flows/"
    echo "Upload components:         az storage file upload-batch --account-name $STORAGE_ACCOUNT --destination langflow-components --source ./custom_components/"
    echo "Database access:           az postgres flexible-server connect --name $POSTGRES_SERVER --admin-user $ADMIN_LOGIN --database-name $LANGFLOW_DB_NAME"
    echo "Delete deployment:         az group delete --name $RESOURCE_GROUP --yes"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    log "📁 Uploading flows and components to Azure Storage..."
    
    # Upload flows if the local flows directory exists
    FLOWS_DIR="$SCRIPT_DIR/../flows"
    if [[ -d "$FLOWS_DIR" && "$(ls -A $FLOWS_DIR 2>/dev/null)" ]]; then
        # Get storage account key
        STORAGE_KEY=$(az storage account keys list \
            --resource-group "$RESOURCE_GROUP" \
            --account-name "$STORAGE_ACCOUNT" \
            --query "[0].value" \
            --output tsv)
        
        # Upload flows
        az storage file upload-batch \
            --account-name "$STORAGE_ACCOUNT" \
            --account-key "$STORAGE_KEY" \
            --destination "langflow-flows" \
            --source "$FLOWS_DIR" \
            --pattern "*.json"
        
        success "Flows uploaded to Azure File Share"
    else
        warning "No flows found in $FLOWS_DIR"
    fi
    
    # Upload custom components if directory exists
    COMPONENTS_DIR="$SCRIPT_DIR/../custom_components"
    if [[ -d "$COMPONENTS_DIR" && "$(ls -A $COMPONENTS_DIR 2>/dev/null)" ]]; then
        az storage file upload-batch \
            --account-name "$STORAGE_ACCOUNT" \
            --account-key "$STORAGE_KEY" \
            --destination "langflow-components" \
            --source "$COMPONENTS_DIR"
        
        success "Custom components uploaded to Azure File Share"
    else
        warning "No custom components found in $COMPONENTS_DIR"
    fi
    
    log "⏳ Waiting for Langflow to start (this may take 3-5 minutes)..."
    sleep 90
    
    # Test connectivity
    log "🔍 Testing Langflow connectivity..."
    
    # Test Langflow API
    if curl -s --connect-timeout 30 "$LANGFLOW_URL/api/v1/version" > /dev/null; then
        success "Langflow is responding"
        
        # Get version info
        VERSION=$(curl -s "$LANGFLOW_URL/api/v1/version" 2>/dev/null | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
        log "Langflow version: $VERSION"
    else
        warning "Langflow is not yet responding (may need more time to start)"
        log "Container Apps can take 5-10 minutes to fully initialize"
    fi
    
    echo
    success "🎉 ANDI Langflow deployment completed successfully!"
    log "📖 Next steps:"
    
    if [[ "$LANGFLOW_MODE" == "ide" ]]; then
        echo "  1. Access the Langflow IDE at: $LANGFLOW_URL"
        echo "  2. Login with: $ADMIN_LOGIN / [your password]"
        echo "  3. Create AI workflows using the visual interface"
        echo "  4. Configure database connectors to ANDI data"
        echo "  5. Test your flows with real ANDI data"
        echo "  6. Export flows for production deployment"
    else
        echo "  1. Test the Langflow API at: $LANGFLOW_URL/api/v1"
        echo "  2. Deploy flows via the API or file upload"
        echo "  3. Integrate Langflow endpoints with ANDI web app"
        echo "  4. Configure monitoring and alerting"
        echo "  5. Set up auto-scaling based on usage patterns"
    fi
    
    echo "  7. Set up monitoring and performance tracking"
    echo "  8. Configure backup and disaster recovery"
    
else
    error "❌ Deployment failed. Check the error messages above."
    exit 1
fi