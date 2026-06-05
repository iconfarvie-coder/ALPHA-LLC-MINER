#!/bin/bash

# ALPHA LLC MINER - Docker Setup Script
# Builds and runs the application in Docker container

set -e

PROJECT_NAME="alpha-llc-miner"
IMAGE_NAME="$PROJECT_NAME:latest"
CONTAINER_NAME="$PROJECT_NAME-container"
PORT=3000

echo "🐳 ALPHA LLC MINER - Docker Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your credentials before running"
fi

echo ""
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Check if container already running
if docker ps | grep -q $CONTAINER_NAME; then
    echo "⏹️  Stopping existing container..."
    docker stop $CONTAINER_NAME
fi

# Check if container exists
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🗑️  Removing old container..."
    docker rm $CONTAINER_NAME
fi

echo ""
echo "🚀 Starting Docker container..."
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env \
    -p $PORT:$PORT \
    -v $(pwd):/app \
    $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

echo "✅ Container started successfully!"
echo ""
echo "📌 Container Details:"
echo "   Image: $IMAGE_NAME"
echo "   Container: $CONTAINER_NAME"
echo "   Port: http://localhost:$PORT"
echo ""
echo "🔍 View logs:"
echo "   docker logs -f $CONTAINER_NAME"
echo ""
echo "⏹️  Stop container:"
echo "   docker stop $CONTAINER_NAME"
echo ""
echo "🗑️  Remove container:"
echo "   docker rm $CONTAINER_NAME"
echo ""
