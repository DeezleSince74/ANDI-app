# Production-ready PostgreSQL image for Azure deployment
FROM postgres:16-alpine

# Install additional packages for monitoring and backup
RUN apk add --no-cache \
    postgresql-contrib \
    postgresql-client \
    curl \
    bash \
    openssl

# Create backup directory
RUN mkdir -p /backups && chmod 755 /backups

# Copy initialization scripts
COPY ./init /docker-entrypoint-initdb.d/
COPY ./scripts /scripts/

# Make scripts executable
RUN chmod +x /scripts/*.sh

# Set up health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB

# Expose PostgreSQL port
EXPOSE 5432

# Volume for persistent data
VOLUME ["/var/lib/postgresql/data", "/backups"]