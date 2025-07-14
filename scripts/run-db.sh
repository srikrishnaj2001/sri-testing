#!/bin/bash

echo "🐘 Starting PostgreSQL database for eFood (cheez)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Remove existing container if running
docker rm -f cheez-service-postgres-development || true

# Run PostgreSQL container
docker run \
    --rm \
    -p 5433:5432 \
    --name cheez-service-postgres-development \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=efood_nodejs \
    -d postgres:14

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL container started successfully"
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi

echo "✅ PostgreSQL is running on port 5433"
echo "📊 Database: efood_nodejs"
echo "👤 User: postgres"
echo "🔑 Password: postgres"
echo ""
echo "Connection string: postgresql://postgres:postgres@localhost:5433/efood_nodejs" 