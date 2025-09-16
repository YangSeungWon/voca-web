#!/bin/sh

echo "Waiting for database..."
sleep 10

echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
exec node server.js