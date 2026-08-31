# Multi-Stage Dockerfile for DocMind AI Platform
FROM node:22-alpine AS base

# Install Python 3.10 and build utilities
RUN apk add --no-cache python3 py3-pip make g++ sqlite

WORKDIR /app

# Copy package descriptors
COPY package*.json requirements.txt ./

# Install npm & python dependencies
RUN npm ci --only=production
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH="/app/venv/bin:$PATH"

EXPOSE 3000

# Run database seeder and start server
CMD ["sh", "-c", "node scripts/seed.js && node server.js"]
