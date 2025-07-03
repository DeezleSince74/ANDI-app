#!/bin/bash

# Database backup script for ANDI PostgreSQL
# Supports both local Docker and Azure PostgreSQL

set -e

# Load environment variables
source .env

# Set defaults
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/andi_backup_${TIMESTAMP}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup at $(date)"

# Check if we're in production (Azure) or local development
if [ "${NODE_ENV}" = "production" ] && [ -n "${AZURE_POSTGRES_HOST}" ]; then
    echo "Backing up Azure PostgreSQL database..."
    PGPASSWORD="${AZURE_POSTGRES_PASSWORD}" pg_dump \
        -h "${AZURE_POSTGRES_HOST}" \
        -U "${AZURE_POSTGRES_USER}" \
        -d "${AZURE_POSTGRES_DB}" \
        -p 5432 \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="${BACKUP_FILE}"
else
    echo "Backing up local Docker PostgreSQL database..."
    docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" andi-postgres pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --no-owner \
        --no-privileges \
        --verbose \
        > "${BACKUP_FILE}"
fi

# Compress the backup
echo "Compressing backup..."
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Clean up old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "andi_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo "Current backups:"
ls -lah "${BACKUP_DIR}"/andi_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup process completed at $(date)"