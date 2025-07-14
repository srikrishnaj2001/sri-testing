#!/bin/bash

echo "🛑 Stopping PostgreSQL database for eFood (cheez)..."

# Stop and remove the container
docker rm -f cheez-service-postgres-development || true

echo "✅ PostgreSQL container stopped and removed" 