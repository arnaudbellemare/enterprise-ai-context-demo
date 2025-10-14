#!/bin/bash
# Quick Start - Get localhost:3000 running!

echo "🚀 STARTING YOUR AI SYSTEM..."
echo ""

# Check Ollama
echo "Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not installed!"
    echo "   Install from: https://ollama.ai"
    exit 1
fi
echo "✅ Ollama found!"

# Start Ollama in background
echo ""
echo "Starting Ollama server..."
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!
sleep 2
echo "✅ Ollama running (PID: $OLLAMA_PID)"

# Check model
echo ""
echo "Checking for gemma2:2b model..."
if ! ollama list | grep -q "gemma2:2b"; then
    echo "📥 Pulling gemma2:2b (first time, may take 2-3 min)..."
    ollama pull gemma2:2b
fi
echo "✅ Model ready!"

# Navigate to frontend
echo ""
echo "Starting Next.js server..."
cd frontend

# Install if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    npm install
fi

# Start dev server
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🎉 SERVER STARTING!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Open these in your browser:"
echo ""
echo "  🏟️  ARENA:         http://localhost:3000/arena"
echo "  🛠️  AGENT BUILDER: http://localhost:3000/agent-builder"
echo "  🏠 HOME:          http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

npm run dev
