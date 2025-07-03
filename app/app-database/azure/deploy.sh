#!/bin/bash

# Azure PostgreSQL deployment script for ANDI
set -e

# Configuration
RESOURCE_GROUP="andi-${ENVIRONMENT:-dev}-rg"
LOCATION="${AZURE_LOCATION:-eastus}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
DEPLOYMENT_NAME="andi-postgres-deployment-$(date +%Y%m%d-%H%M%S)"

# Check required environment variables
if [ -z "$AZURE_SUBSCRIPTION_ID" ]; then
    echo "Error: AZURE_SUBSCRIPTION_ID environment variable is required"
    exit 1
fi

if [ -z "$POSTGRES_ADMIN_USER" ]; then
    echo "Error: POSTGRES_ADMIN_USER environment variable is required"
    exit 1
fi

if [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    echo "Error: POSTGRES_ADMIN_PASSWORD environment variable is required"
    exit 1
fi

echo "Deploying ANDI PostgreSQL to Azure..."
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"

# Login to Azure if not already logged in
if ! az account show &> /dev/null; then
    echo "Logging into Azure..."
    az login
fi

# Set subscription
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create resource group if it doesn't exist
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Determine SKU based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    SKU_NAME="Standard_D2s_v3"
    SKU_TIER="GeneralPurpose"
    STORAGE_SIZE=128
    BACKUP_RETENTION=30
    GEO_REDUNDANT="Enabled"
else
    SKU_NAME="Standard_B2s"
    SKU_TIER="Burstable"
    STORAGE_SIZE=32
    BACKUP_RETENTION=7
    GEO_REDUNDANT="Disabled"
fi

# Deploy PostgreSQL using Bicep template
echo "Deploying PostgreSQL server..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file azure-postgresql.bicep \
    --name "$DEPLOYMENT_NAME" \
    --parameters \
        environmentName="$ENVIRONMENT" \
        administratorLogin="$POSTGRES_ADMIN_USER" \
        administratorLoginPassword="$POSTGRES_ADMIN_PASSWORD" \
        skuName="$SKU_NAME" \
        skuTier="$SKU_TIER" \
        storageSize=$STORAGE_SIZE \
        backupRetentionDays=$BACKUP_RETENTION \
        geoRedundantBackup="$GEO_REDUNDANT" \
        allowAzureIps=true

# Get deployment outputs
echo "Retrieving deployment outputs..."
SERVER_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.postgresqlServerName.value' \
    --output tsv)

SERVER_FQDN=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.postgresqlServerFqdn.value' \
    --output tsv)

DATABASE_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.databaseName.value' \
    --output tsv)

# Output connection details
echo ""
echo "✅ PostgreSQL deployment completed successfully!"
echo ""
echo "Connection Details:"
echo "  Server Name: $SERVER_NAME"
echo "  Server FQDN: $SERVER_FQDN"
echo "  Database: $DATABASE_NAME"
echo "  Admin User: $POSTGRES_ADMIN_USER"
echo ""
echo "Connection String:"
echo "  postgresql://$POSTGRES_ADMIN_USER:<password>@$SERVER_FQDN:5432/$DATABASE_NAME?sslmode=require"
echo ""
echo "Environment Variables for your application:"
echo "  AZURE_POSTGRES_HOST=$SERVER_FQDN"
echo "  AZURE_POSTGRES_USER=$POSTGRES_ADMIN_USER"
echo "  AZURE_POSTGRES_DB=$DATABASE_NAME"
echo "  AZURE_POSTGRES_PASSWORD=<your-password>"
echo "  AZURE_POSTGRES_SSL_MODE=require"
echo ""

# Test connection
echo "Testing database connection..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL client found, testing connection..."
    PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql \
        -h "$SERVER_FQDN" \
        -U "$POSTGRES_ADMIN_USER" \
        -d "$DATABASE_NAME" \
        -c "SELECT version();" && \
        echo "✅ Database connection test successful!" || \
        echo "❌ Database connection test failed"
else
    echo "PostgreSQL client (psql) not found, skipping connection test"
fi

echo ""
echo "Next steps:"
echo "1. Update your application's environment variables with the values above"
echo "2. Deploy your database schema using: make azure-deploy"
echo "3. Configure firewall rules if needed for your application's IP addresses"