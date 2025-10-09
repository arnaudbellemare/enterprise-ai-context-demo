# 🚀 Install Ollama on MacBook Air (Easy Guide)

## ⚡ Quick Install (2 Steps)

### **Step 1: Download Ollama**

**Option A: Direct Download** ⭐ EASIEST
1. Open this link: https://ollama.com/download
2. Click **"Download for macOS"**
3. Wait for download (~100MB)
4. Open the downloaded file (`Ollama-darwin.zip` or `.dmg`)
5. Drag **Ollama** to your **Applications** folder
6. Open **Ollama** from Applications
7. You'll see a llama icon in your menu bar ✅

**Option B: Using Terminal**
```bash
# Download directly
curl -fsSL https://ollama.com/install.sh | sh
```

---

### **Step 2: Pull Models (Optimized for MacBook Air)**

Once Ollama is installed and running, open Terminal:

```bash
# Best models for MacBook Air (8GB RAM typical)

# 1. FASTEST - llama3.2:1b (1.3GB, very fast)
ollama pull llama3.2:1b

# 2. BALANCED - llama3.2:3b (2GB, best quality/speed)
ollama pull llama3.2:3b

# 3. CODE - phi3:mini (2.3GB, good for technical)
ollama pull phi3:mini

# Optional: If you have 16GB RAM
# ollama pull llama3.1:8b
```

---

## ✅ Verify It's Working

```bash
# Test Ollama is running
ollama list

# Expected output:
# NAME              ID            SIZE
# llama3.2:3b       ...           2GB
# llama3.2:1b       ...           1.3GB
# phi3:mini         ...           2.3GB

# Test a model
ollama run llama3.2:3b "Say hello!"
```

---

## 🎯 Best Models for MacBook Air

| Model | Size | RAM | Speed | Quality | Use For |
|-------|------|-----|-------|---------|---------|
| `llama3.2:1b` | 1.3GB | 2GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Fast tasks, simple analysis |
| `llama3.2:3b` | 2GB | 4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | **RECOMMENDED** - Best balance |
| `phi3:mini` | 2.3GB | 4GB | ⚡⚡⚡⭐ | ⭐⭐⭐⭐ | Code, technical tasks |
| `qwen2.5:3b` | 2GB | 4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Math, reasoning |

**If you have 16GB MacBook Air:**
| `llama3.1:8b` | 4.7GB | 8GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Best quality |
| `gemma2:9b` | 5.5GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Best reasoning |

---

## 🔧 After Installation

Once Ollama is running, I'll restart the dev server and the system will automatically use Ollama instead of OpenRouter!

**You'll see in the terminal:**
```
🦙 Trying Ollama: llama3.2:3b
✅ Ollama success: llama3.2:3b
```

Instead of:
```
⚠️ Ollama failed, falling back to OpenRouter
❌ OpenRouter error: 429 (rate limited)
```

---

## 💡 If You Don't Want to Install Ollama

**That's OK!** The system works with **OpenRouter alone**, just:

1. Use **Simple Workflow** (3 nodes) - Works perfectly
2. Wait **1 minute** between workflow executions (rate limits reset)
3. Or get **OpenAI free credits** ($5 free): https://platform.openai.com

---

## 🚀 Quick Start Commands

```bash
# 1. Download Ollama
open https://ollama.com/download

# 2. After installing, verify
ollama --version

# 3. Pull best model for MacBook Air
ollama pull llama3.2:3b

# 4. Test it
ollama run llama3.2:3b "Hello!"

# 5. Restart dev server
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-1/frontend
npm run dev
```

---

**Want to install Ollama now?** It's super easy - just download from the link above! 🚀

Or we can just use **Simple Workflow** which works perfectly with OpenRouter! ✅

