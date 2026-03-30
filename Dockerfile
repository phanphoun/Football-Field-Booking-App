# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Backend dependencies stage
FROM node:18-alpine AS backend-deps

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Runtime stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init
RUN mkdir -p /app/backend/public /app/backend/uploads/profile

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/
COPY backend/server.js ./backend/
COPY backend/public ./backend/public
COPY backend/src ./backend/src
COPY backend/uploads ./backend/uploads
COPY --from=frontend-builder /app/frontend/build ./backend/public

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /bin/sh -c 'wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT:-5000}/health" || exit 1'

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"]