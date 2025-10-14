#!/bin/bash
# Quick Setup for Testing (No Cloud APIs Needed!)
#
# OPTIONAL: Set PERPLEXITY_API_KEY before running if you have one
# export PERPLEXITY_API_KEY="pplx-YOUR_KEY_HERE"

echo "🚀 QUICK SETUP FOR TESTING - NO CLOUD APIS NEEDED!"
echo ""
echo "This sets up MINIMUM configuration (Supabase + Ollama = \$0)"
echo ""
if [ -n "$PERPLEXITY_API_KEY" ]; then
    echo "✅ PERPLEXITY_API_KEY detected! Will enable web search."
else
    echo "⚠️  PERPLEXITY_API_KEY not set. Web search disabled (optional)."
    echo "   To enable: export PERPLEXITY_API_KEY=\"pplx-YOUR_KEY\" before running"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════════"

# Check if Ollama is installed
echo ""
echo "Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found!"
    echo ""
    echo "Please install Ollama first:"
    echo "  1. Visit: https://ollama.ai"
    echo "  2. Download and install"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi
echo "✅ Ollama is installed!"

# Check if model is pulled
echo ""
echo "Checking for gemma2:2b model..."
if ! ollama list | grep -q "gemma2:2b"; then
    echo "📥 Pulling gemma2:2b model (this may take a few minutes)..."
    ollama pull gemma2:2b
    echo "✅ Model downloaded!"
else
    echo "✅ Model already downloaded!"
fi

# Optional: Pull larger models for better quality
echo ""
echo "Optional: Download larger models for better quality?"
echo "  - llama3.1:8b (better quality, still fast)"
echo "  - llava:7b (multimodal - vision + language)"
echo ""
read -p "Download larger models? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📥 Pulling llama3.1:8b..."
    ollama pull llama3.1:8b
    echo "📥 Pulling llava:7b (multimodal)..."
    ollama pull llava:7b
    echo "✅ Larger models downloaded!"
fi

# Create .env in root
echo ""
echo "Creating .env file in root..."
cat > .env << 'ENVEOF'
# Database (Supabase) - YOU HAVE THIS! ✅
NEXT_PUBLIC_SUPABASE_URL="https://ofvbywlqztkgugrkibcp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTY2OTYsImV4cCI6MjA3NDMzMjY5Nn0.r3Kw4QEPTkSh0m8UEjuwYPNkx6HhtwO1pghWu2EMulU"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE"
SUPABASE_URL="https://ofvbywlqztkgugrkibcp.supabase.co"

# Local LLM (Ollama) - FREE! ✅
USE_OLLAMA=true
OLLAMA_MODEL="gemma2:2b"
OLLAMA_BASE_URL="http://localhost:11434"

# Perplexity (Web Search) - OPTIONAL (add your key if you have one) ⚠️
PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY:-}"

# Local Embeddings - NO API KEY NEEDED! ✅
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL="Xenova/all-MiniLM-L6-v2"

# Cloud APIs - OPTIONAL! Can leave empty (using local alternatives) ⚠️
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GOOGLE_API_KEY=""
ENVEOF
echo "✅ Created .env in root"

# Create .env.local in frontend
echo ""
echo "Creating .env.local in frontend..."
cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL="https://ofvbywlqztkgugrkibcp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTY2OTYsImV4cCI6MjA3NDMzMjY5Nn0.r3Kw4QEPTkSh0m8UEjuwYPNkx6HhtwO1pghWu2EMulU"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE"

USE_OLLAMA=true
OLLAMA_MODEL="gemma2:2b"
OLLAMA_BASE_URL="http://localhost:11434"

PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY:-}"

USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL="Xenova/all-MiniLM-L6-v2"
ENVEOF
echo "✅ Created .env.local in frontend"

# Install dependencies if needed
echo ""
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi
echo "✅ Dependencies ready!"

# Done!
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🎉 SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  ✅ Supabase: Connected (your credentials)"
echo "  ✅ Ollama: gemma2:2b model ready"
echo "  ✅ Cloud APIs: Skipped (not needed for testing!)"
echo ""
echo "Cost: \$0 (100% free!)"
echo ""
echo "Next steps:"
echo "  1. Run validation: ./RUN_VALIDATION.sh"
echo "  2. If tests pass: System is ready! 🚀"
echo "  3. Deploy and use!"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
