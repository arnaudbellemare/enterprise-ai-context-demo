#!/bin/bash
# Quick start script for feedback demo

echo "🚀 Starting Feedback Demo..."
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    echo "Please run this from the project root"
    exit 1
fi

# Navigate to frontend
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start dev server
echo ""
echo "✅ Starting Next.js dev server..."
echo "📍 Demo will be at: http://localhost:3000/feedback-demo"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
