#!/bin/bash

set -e  # Exit on error

# Log startup
echo "=== Starting Football Booking Backend ==="
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database: $DB_HOST:$DB_PORT"

# Wait for database to be ready
DB_READY=0
ATTEMPTS=0
MAX_ATTEMPTS=30

echo "Waiting for database to be ready..."
while [ $DB_READY -eq 0 ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
    DB_READY=1
    echo "✅ Database is ready"
  else
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "Database not ready yet... ($ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 2
  fi
done

if [ $DB_READY -eq 0 ]; then
  echo "❌ Database failed to become ready after $MAX_ATTEMPTS attempts"
  exit 1
fi

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  node scripts/migrate-to-production.js || true
fi

# Start application
echo "🚀 Starting application..."
exec node server.js
