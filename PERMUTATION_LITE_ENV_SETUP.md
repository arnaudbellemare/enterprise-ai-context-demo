# PERMUTATION Lite: Environment Setup Complete

**Status**: ✅ All credentials configured

---

## Environment Variables Set

### Required (✅ All Set)

1. **Supabase Database**
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `POSTGRES_URL`
   - ✅ `POSTGRES_PRISMA_URL`

2. **Perplexity API**
   - ✅ `PERPLEXITY_API_KEY` (for real-time data and Teacher-Student system)

### Optional (Recommended)

3. **LLM Provider** (Choose one or more)
   - ⚠️ **Ollama** (Free, Local) - Set `OLLAMA_BASE_URL` if running locally
   - ⚠️ **OpenRouter** - Set `OPENROUTER_API_KEY` for cloud LLM access
   - ⚠️ **OpenAI** - Set `OPENAI_API_KEY` for best quality (paid)

---

## What You Have vs What's Needed

### ✅ You Have:
- Supabase (all credentials)
- Perplexity API key

### ⚠️ You Need (Choose One):

**Option 1: Ollama (Free, Recommended)**
```bash
# Install Ollama: https://ollama.ai
# Then run: ollama pull gemma:2b
# No API key needed!
```

**Option 2: OpenRouter (Cloud, Free tier available)**
```bash
OPENROUTER_API_KEY=your_key_here
```

**Option 3: OpenAI (Paid, Best Quality)**
```bash
OPENAI_API_KEY=sk-your_key_here
```

---

## For PERMUTATION Lite Specifically

**Minimum Required:**
- ✅ Supabase (you have this)
- ✅ One LLM provider (Ollama/OpenRouter/OpenAI)

**What PERMUTATION Lite Uses:**
- **Routing**: IRT + Domain Detector → Uses Supabase for domain memory
- **Optimization**: GEPA → Uses Supabase for prompt evolution storage
- **Learning**: ReasoningBank → Uses Supabase for memory storage
- **Verification**: RVS → Uses LLM provider
- **Answer Generation**: Uses LLM provider (via `/api/answer` route)

---

## Testing Setup

### Step 1: Install Ollama (Easiest Option)

```bash
# macOS
brew install ollama
ollama pull gemma:2b

# Or download from https://ollama.ai
```

### Step 2: Start Ollama

```bash
ollama serve
```

### Step 3: Test PERMUTATION Lite

```bash
# Start dev server
npm run dev

# In another terminal
node test-permutation-lite-real.js "What should the insurance premium be for a 1925 Art Deco Cartier platinum bracelet valued at $85,000?" art
```

---

## Environment File Location

Created: `frontend/.env.local`

**Important**: 
- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ File contains your actual credentials
- ✅ Restart dev server after changing env vars

---

## Verification

To verify your setup is working:

```bash
# Check env vars are loaded
node -e "require('dotenv').config({ path: './frontend/.env.local' }); console.log('Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'); console.log('Perplexity:', process.env.PERPLEXITY_API_KEY ? '✅' : '❌');"
```

---

## What Each Component Needs

| Component | Needs | Status |
|-----------|-------|--------|
| **Routing Layer** | Supabase | ✅ Ready |
| **Optimization (GEPA)** | Supabase | ✅ Ready |
| **Learning (ReasoningBank)** | Supabase | ✅ Ready |
| **Verification (RVS)** | LLM Provider | ⚠️ Need Ollama/OpenRouter/OpenAI |
| **Answer Generation** | LLM Provider | ⚠️ Need Ollama/OpenRouter/OpenAI |

---

## Next Steps

1. ✅ Environment file created with your credentials
2. ⚠️ Install Ollama OR set OpenRouter API key
3. ✅ Ready to test PERMUTATION Lite

---

*Environment Setup Complete - November 3, 2025*

