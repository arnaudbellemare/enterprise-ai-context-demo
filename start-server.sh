#!/bin/bash

echo "🚀 Starting PERMUTATION AI Development Server..."
echo "================================================"

# Kill any existing processes on port 3000
echo "🔄 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Navigate to frontend directory
cd frontend

# Clean Next.js cache
echo "🧹 Cleaning Next.js cache..."
rm -rf .next

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Start the development server
echo "🎯 Starting development server..."
echo "   Server will be available at: http://localhost:3000"
echo "   Multi-Domain Evolution: http://localhost:3000/multi-domain-evolution"
echo ""
echo "⏳ Starting server... (this may take a few seconds)"
echo ""

npm run dev
