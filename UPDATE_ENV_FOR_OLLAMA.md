# 🔧 Update .env.local for Ollama

## Add These Lines to `frontend/.env.local`:

```bash
# Ollama Cloud API (primary - with your key!)
OLLAMA_API_KEY=258971f26c784057be6b21abfeeed88b.6nz-n-y9k2ZXV1CCOIJabuEc
OLLAMA_BASE_URL=https://api.ollama.com
OLLAMA_ENABLED=true

# Keep existing keys as fallback
# OPENROUTER_API_KEY=sk-or-v1-...
# PERPLEXITY_API_KEY=pplx-...
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🎯 Best Models for MacBook Air

### **Local Models (if you install Ollama app):**

| Model | Size | RAM Needed | Speed | Quality | Recommended |
|-------|------|------------|-------|---------|-------------|
| `llama3.2:1b` | 1.3GB | 2GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | ✅ YES (fastest) |
| `llama3.2:3b` | 2GB | 4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ YES (balanced) |
| `phi3:mini` | 2.3GB | 4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ YES (code) |
| `qwen2.5:3b` | 2GB | 4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ YES (reasoning) |
| `llama3.1:8b` | 4.7GB | 8GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ⚠️ If you have 16GB RAM |
| `gemma2:9b` | 5.5GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | ⚠️ If you have 16GB RAM |

### **Ollama Cloud (with your API key):**
- ✅ **All models available** (no local RAM limits!)
- ✅ **Unlimited usage** with your key
- ✅ **Fast** (cloud inference)
- ✅ **No local installation** needed

---

## ⚡ Quick Commands

### **Option A: Use Ollama Cloud (No local install needed!)**
```bash
# Just add to .env.local:
OLLAMA_API_KEY=258971f26c784057be6b21abfeeed88b.6nz-n-y9k2ZXV1CCOIJabuEc
OLLAMA_BASE_URL=https://api.ollama.com
OLLAMA_ENABLED=true

# I'll update the code to use it!
```

### **Option B: Install Ollama Locally (For MacBook Air)**
```bash
# 1. Download from https://ollama.com/download
# 2. Open Ollama app
# 3. Pull small models:
ollama pull llama3.2:1b    # Fastest
ollama pull llama3.2:3b    # Best balance
ollama pull phi3:mini      # Code tasks

# 4. Add to .env.local:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
```

### **Option C: Both! (Recommended)**
```bash
# Use Ollama Cloud as primary
OLLAMA_API_KEY=258971f26c784057be6b21abfeeed88b.6nz-n-y9k2ZXV1CCOIJabuEc
OLLAMA_BASE_URL=https://api.ollama.com

# Install local Ollama as fallback
ollama pull llama3.2:3b
```

---

## 🚀 I'll Update the Code Now!

Let me create the intelligent fallback system:
1. **Try Ollama first** (cloud or local)
2. **Fallback to OpenRouter** if Ollama fails
3. **Smart model selection** based on task
4. **Automatic retry logic**

Ready for me to update the code? 🔥

