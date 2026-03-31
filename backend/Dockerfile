# ================== BUILD STAGE ==================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# ================== RUNTIME STAGE ==================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl netcat-openbsd

# Create app directories
RUN mkdir -p uploads logs && chmod 777 uploads logs

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files (excluding .env)
COPY .env.docker .env
COPY . .

# Copy startup script
COPY scripts/start-backend.sh /start.sh
RUN chmod +x /start.sh

# Health check (required for AWS load balancer)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

EXPOSE ${PORT:-5000}

# Run with startup script
CMD ["/start.sh"]
