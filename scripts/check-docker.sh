#!/bin/bash

echo "🔍 Checking Docker installation..."

# Check if Docker command exists
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is installed but not running"
    echo "🚀 Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is installed and running"
echo "🐳 Docker version: $(docker --version)" 