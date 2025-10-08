#!/bin/bash

# ============================================================================
# Ollama + OpenRouter Dual Setup Script
# ============================================================================

echo "🚀 Setting up Ollama Cloud with OpenRouter fallback..."
echo ""

# Create/update .env.local with Ollama configuration
cat > frontend/.env.local << 'EOF'
# ============================================================================
# OLLAMA CLOUD CONFIGURATION (Primary LLM Provider)
# ============================================================================
OLLAMA_API_KEY=258971f26c784057be6b21abfeeed88b.6nz-n-y9k2ZXV1CCOIJabuEc
OLLAMA_BASE_URL=https://api.ollama.com
OLLAMA_ENABLED=true

# ============================================================================
# OPENROUTER (Fallback when Ollama fails)
# ============================================================================
OPENROUTER_API_KEY=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

# ============================================================================
# PERPLEXITY (Web Search)
# ============================================================================
PERPLEXITY_API_KEY=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

# ============================================================================
# SUPABASE (Vector Database)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://ofvbywlqztkgugrkibcp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTY2OTYsImV4cCI6MjA3NDMzMjY5Nn0.r3Kw4QEPTkSh0m8UEjuwYPNkx6HhtwO1pghWu2EMulU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE
EOF

echo "✅ Created frontend/.env.local with Ollama Cloud configuration"
echo ""
echo "📋 Configuration:"
echo "   - Primary: Ollama Cloud (unlimited, your API key)"
echo "   - Fallback: OpenRouter (if Ollama fails)"
echo "   - Web Search: Perplexity"
echo "   - Vector DB: Supabase"
echo ""
echo "🎯 Best Models for MacBook Air (if running locally):"
echo "   - llama3.2:1b (1.3GB) - Fastest, good quality"
echo "   - llama3.2:3b (2GB) - Best balance"
echo "   - phi3:mini (2.3GB) - Good for code"
echo ""
echo "☁️  With Ollama Cloud (your API key):"
echo "   - All models available!"
echo "   - No local installation needed"
echo "   - Unlimited usage"
echo ""
echo "🚀 Next step: Restart dev server"
echo "   cd frontend && npm run dev"
echo ""

