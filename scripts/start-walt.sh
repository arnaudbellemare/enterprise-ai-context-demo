#!/bin/bash
# Start WALT Service

set -e

echo "🚀 Starting WALT Service..."

# Check if virtual environment exists
if [ ! -d "venv-walt" ]; then
    echo "❌ Virtual environment not found. Run ./scripts/setup-walt.sh first."
    exit 1
fi

# Activate virtual environment
source venv-walt/bin/activate

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found"
fi

# Set default port if not specified
export WALT_SERVICE_PORT=${WALT_SERVICE_PORT:-5000}
export WALT_SERVICE_DEBUG=${WALT_SERVICE_DEBUG:-false}

echo "🔧 Configuration:"
echo "   Port: $WALT_SERVICE_PORT"
echo "   Debug: $WALT_SERVICE_DEBUG"
echo ""

# Start the service
python3 scripts/walt-service.py
