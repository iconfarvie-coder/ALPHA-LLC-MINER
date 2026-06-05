#!/bin/bash

# ALPHA LLC MINER - Setup Script
# Automatically configures the project for local development

set -e

echo "🚀 ALPHA LLC MINER - Automatic Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed successfully"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your broker credentials."
else
    echo "ℹ️  .env file already exists (skipping)"
fi

echo ""
echo "🔨 Running build check..."
npm run build
echo "✅ Build successful"
echo ""

echo "✨ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Edit .env with your MetaTrader 5 credentials"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
echo "📖 Documentation: See MT5_INTEGRATION.md for detailed API docs"
echo ""
