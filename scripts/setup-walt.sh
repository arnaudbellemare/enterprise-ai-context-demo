#!/bin/bash
# WALT Setup Script
# Sets up WALT integration for PERMUTATION

set -e

echo "🚀 Setting up WALT integration..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2 | cut -d '.' -f 1,2)
REQUIRED_VERSION="3.11"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $REQUIRED_VERSION or higher is required. Found: $PYTHON_VERSION"
    echo ""
    echo "📝 To install Python 3.11+ on macOS:"
    echo "   brew install python@3.11"
    echo "   # Or download from python.org"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"

# Create virtual environment if it doesn't exist
if [ ! -d "venv-walt" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv-walt
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv-walt/bin/activate

# Install WALT and dependencies
echo "📦 Installing WALT and dependencies..."
pip install --upgrade pip
pip install -r scripts/requirements-walt.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install chromium

echo ""
echo "✅ WALT setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variables to .env.local:"
echo "   WALT_SERVICE_URL=http://localhost:5000"
echo "   WALT_SERVICE_PORT=5000"
echo "   WALT_ENABLED=true"
echo ""
echo "2. Start the WALT service:"
echo "   ./scripts/start-walt.sh"
echo ""
echo "3. Run the test:"
echo "   npm run test:walt"
echo ""
