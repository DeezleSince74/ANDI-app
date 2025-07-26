# Build stage
FROM node:22-alpine AS builder

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Set build-time environment variables
ARG DATABASE_URL=postgresql://andi_user:andi_dev_password@localhost:5432/andi_db
ARG NEXTAUTH_SECRET=development-secret-key-please-change-in-production
ARG NEXTAUTH_URL=http://localhost:3000
ARG STORAGE_PROVIDER=azure
ARG AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://localhost:10000/devstoreaccount1;
ARG AZURE_STORAGE_CONTAINER_NAME=andi-media

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV STORAGE_PROVIDER=$STORAGE_PROVIDER
ENV AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING
ENV AZURE_STORAGE_CONTAINER_NAME=$AZURE_STORAGE_CONTAINER_NAME

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install production dependencies only
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies for development mode
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/.env.example ./.env.example

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create necessary directories and set permissions
RUN mkdir -p /app/.next/types /app/.next/cache
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application in development mode
CMD ["npm", "run", "dev"]