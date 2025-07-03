#!/bin/bash

# Database restore script for ANDI PostgreSQL
# Supports both local Docker and Azure PostgreSQL

set -e

# Load environment variables
source .env

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/andi_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found"
    exit 1
fi

echo "Starting database restore from ${BACKUP_FILE} at $(date)"

# Create temporary uncompressed file if backup is compressed
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo "Decompressing backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
    RESTORE_FILE="${TEMP_FILE}"
else
    RESTORE_FILE="${BACKUP_FILE}"
fi

# Confirm restore
echo "WARNING: This will replace all data in the database!"
read -p "Are you sure you want to restore from ${BACKUP_FILE}? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    [ -n "${TEMP_FILE}" ] && rm -f "${TEMP_FILE}"
    exit 0
fi

# Check if we're in production (Azure) or local development
if [ "${NODE_ENV}" = "production" ] && [ -n "${AZURE_POSTGRES_HOST}" ]; then
    echo "Restoring to Azure PostgreSQL database..."
    PGPASSWORD="${AZURE_POSTGRES_PASSWORD}" psql \
        -h "${AZURE_POSTGRES_HOST}" \
        -U "${AZURE_POSTGRES_USER}" \
        -d "${AZURE_POSTGRES_DB}" \
        -p 5432 \
        --file="${RESTORE_FILE}"
else
    echo "Restoring to local Docker PostgreSQL database..."
    docker exec -i -e PGPASSWORD="${POSTGRES_PASSWORD}" andi-postgres psql \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        < "${RESTORE_FILE}"
fi

# Clean up temporary file
[ -n "${TEMP_FILE}" ] && rm -f "${TEMP_FILE}"

echo "Database restore completed at $(date)"

# Run post-restore verification
echo "Verifying restore..."
if [ "${NODE_ENV}" = "production" ] && [ -n "${AZURE_POSTGRES_HOST}" ]; then
    PGPASSWORD="${AZURE_POSTGRES_PASSWORD}" psql \
        -h "${AZURE_POSTGRES_HOST}" \
        -U "${AZURE_POSTGRES_USER}" \
        -d "${AZURE_POSTGRES_DB}" \
        -p 5432 \
        -c "SELECT COUNT(*) as user_count FROM auth.users;"
else
    docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" andi-postgres psql \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -c "SELECT COUNT(*) as user_count FROM auth.users;"
fi

echo "Restore verification completed"