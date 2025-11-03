# Environment Setup: What You Have vs What You Need

**Status**: Analysis Complete

---

## ✅ What You Already Have

### Supabase (Complete)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ All Postgres connection strings

### Perplexity (Complete)
- ✅ `PERPLEXITY_API_KEY`

---

## ⚠️ What You Still Need

### LLM Provider (Required for Answer Generation)

**PERMUTATION Lite needs one LLM provider for:**
- Answer generation (via `/api/answer` route)
- RVS verification
- GEPA prompt optimization

**Choose ONE option:**

#### Option 1: Ollama (Free, Recommended)
```bash
# Install: https://ollama.ai
# Then run:
ollama pull gemma3:4b

# In .env.local, add:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
```

#### Option 2: OpenRouter (Cloud, Free tier available)
```bash
# Sign up: https://openrouter.ai
# In .env.local, add:
OPENROUTER_API_KEY=your_key_here
```

#### Option 3: OpenAI (Paid, Best Quality)
```bash
# In .env.local, add:
OPENAI_API_KEY=sk-your_key_here
```

---

## Complete `.env.local` File

Create `frontend/.env.local` with:

```bash
# ============================================================================
# PERMUTATION Lite Environment Variables
# ============================================================================

# Supabase Database (You have these)
NEXT_PUBLIC_SUPABASE_URL=https://ofvbywlqztkgugrkibcp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTY2OTYsImV4cCI6MjA3NDMzMjY5Nn0.r3Kw4QEPTkSh0m8UEjuwYPNkx6HhtwO1pghWu2EMulU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE

# Perplexity API (You have this)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# LLM Provider (CHOOSE ONE - You need this)
# Option 1: Ollama (Free, Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true

# Option 2: OpenRouter (Cloud)
# OPENROUTER_API_KEY=your_key_here

# Option 3: OpenAI (Paid)
# OPENAI_API_KEY=sk-your_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Component Requirements

| Component | Needs | Your Status |
|-----------|-------|-------------|
| **Routing (IRT + Domain)** | Supabase | ✅ Ready |
| **Optimization (GEPA)** | Supabase | ✅ Ready |
| **Learning (ReasoningBank)** | Supabase | ✅ Ready |
| **Verification (RVS)** | LLM Provider | ⚠️ **Need one** |
| **Answer Generation** | LLM Provider | ⚠️ **Need one** |
| **Teacher-Student** | Perplexity | ✅ Ready |

---

## Quick Setup (Ollama - Easiest)

```bash
# 1. Install Ollama
# macOS: brew install ollama
# Or download: https://ollama.ai

# 2. Pull a model
ollama pull gemma3:4b

# 3. Start Ollama (in background)
ollama serve

# 4. Create .env.local in frontend/ directory
# (Copy the template above)

# 5. Start dev server
cd frontend
npm run dev

# 6. Test
node test-permutation-lite-real.js "test query" "art"
```

---

## Summary

**You have:**
- ✅ Supabase (all credentials)
- ✅ Perplexity API

**You need:**
- ⚠️ One LLM provider (Ollama recommended - free and local)

**Total missing:** 1 thing (LLM provider)

Once you add Ollama or OpenRouter, PERMUTATION Lite will be fully functional.

---

*Setup Guide - November 3, 2025*

