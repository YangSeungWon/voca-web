#!/bin/sh

set -e

echo "Waiting for database to be ready..."

# Extract database connection info from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Default values if extraction fails
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

# Wait for PostgreSQL to be ready
MAX_TRIES=60
TRIES=0

until nc -z $DB_HOST $DB_PORT || [ $TRIES -eq $MAX_TRIES ]; do
  TRIES=$((TRIES + 1))
  echo "Database not ready yet... (attempt $TRIES/$MAX_TRIES)"
  sleep 1
done

if [ $TRIES -eq $MAX_TRIES ]; then
  echo "ERROR: Database failed to start within $MAX_TRIES seconds"
  exit 1
fi

echo "Database is ready!"

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Starting Next.js development server with hot reload..."
npm run dev
