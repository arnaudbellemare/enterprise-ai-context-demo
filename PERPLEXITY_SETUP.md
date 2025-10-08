# 🌐 Perplexity API Setup - COMPLETE! ✅

## ✨ **Your Perplexity API Key is Configured!**

Your API key has been added and the server has been restarted. You can now use **Real API mode** with the Web Search node!

---

## 🚀 **How to Test Real API Mode**

### **Step 1: Open the Workflow Builder**
```
http://localhost:3000/workflow
```

### **Step 2: Build a Web Search Workflow**

**Option A: Use Example Workflow**
1. Click **"Load Example"** button
2. The example includes a Web Search node
3. Toggle to **"🔧 Real API"** mode (click the button)
4. Click **"▶️ Execute"**
5. Watch real web search happen!

**Option B: Build Custom Workflow**
1. Click **"🌐 Web Search"** from the sidebar
2. Add a **"✅ Generate Answer"** node
3. Connect: Web Search → Generate Answer
4. Toggle to **"🔧 Real API"** mode
5. Click **"▶️ Execute"**

---

## 🎯 **What Works with Perplexity API**

### **✅ Available:**
- **🌐 Web Search** - Live internet search with citations
- Real-time search results
- Recent information (configurable recency filter)
- Source citations

### **⚠️ Needs Additional API Keys:**
- **🔍 Memory Search** - Requires Supabase + OpenAI
- **🤖 Model Router** - Requires Anthropic or OpenAI
- **⚡ GEPA Optimize** - Requires Anthropic or OpenAI
- **🔍 LangStruct** - Requires OpenAI
- **▶ Custom Agent** - Requires Anthropic or OpenAI
- **✅ Generate Answer** - Requires Anthropic or OpenAI

**But you can use these in Demo Mode!** 🎮

---

## 🌐 **Example Workflow with Perplexity**

### **Real Web Search → Demo Agent → Demo Answer**

```
[🌐 Web Search]  ──►  [▶ Custom Agent]  ──►  [✅ Generate Answer]
    (Real API)           (Demo Mode)             (Demo Mode)
```

**What happens:**
1. **Web Search** - Real Perplexity API call gets live web results
2. **Custom Agent** - Demo mode provides mock analysis
3. **Generate Answer** - Demo mode provides mock answer

**Result:** Real web data + simulated processing = Great for testing!

---

## 🔧 **Add More API Keys (Optional)**

To unlock all features in Real API mode, add these to `frontend/.env.local`:

### **For Claude Models (Recommended):**
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```
**Enables:** Custom Agent, Generate Answer, GEPA Optimize

### **For OpenAI Models:**
```env
OPENAI_API_KEY=sk-your-key-here
```
**Enables:** Embeddings, Memory Search, LangStruct, GPT models

### **For Vector Database:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
**Enables:** Memory Search (persistent storage)

**After adding keys, restart the server:**
```bash
# Stop current server (Ctrl+C if in terminal)
cd frontend
npm run dev
```

---

## 💡 **Pro Tips**

### **1. Mix Demo & Real Modes**
- Use **Real API** for Web Search (live data)
- Use **Demo Mode** for other nodes (free testing)
- Toggle back and forth as needed!

### **2. Test Web Search First**
```
Simple workflow: Web Search → Generate Answer (in demo)
1. Toggle to Real API
2. Execute
3. See real Perplexity results in log!
```

### **3. Configure Search Parameters**
Click **⚙️ Config** on Web Search node:
- **Recency Filter**: 'day', 'week', 'month', 'year'
- **Max Results**: 1-10 results
- Customize for your use case!

### **4. Watch the Execution Log**
Real API calls show:
```
▶️ Executing: Web Search
   🌐 Calling Perplexity API...
   ✅ Retrieved 5 web results
   📎 Sources: [URLs shown here]
```

---

## 🎮 **Current Setup Status**

| Feature | Status | Mode Available |
|---------|--------|----------------|
| **🌐 Web Search** | ✅ Ready | Real API |
| **🔍 Memory Search** | ⚠️ Needs Setup | Demo Only |
| **📦 Context Assembly** | ✅ Ready | Demo + Real |
| **🤖 Model Router** | ⚠️ Needs API Key | Demo Only |
| **⚡ GEPA Optimize** | ⚠️ Needs API Key | Demo Only |
| **🔍 LangStruct** | ⚠️ Needs API Key | Demo Only |
| **▶ Custom Agent** | ⚠️ Needs API Key | Demo Only |
| **✅ Generate Answer** | ⚠️ Needs API Key | Demo Only |

---

## 🚨 **Troubleshooting**

### **Issue: Real API mode not showing results**
**Check:**
1. Is "🔧 Real API" mode toggled on?
2. Did you restart the server after adding the key?
3. Check execution log for error messages

### **Issue: "API key not configured" error**
**Solution:**
1. Verify `.env.local` file exists in `/frontend/` directory
2. Check the API key is correct (starts with `pplx-`)
3. Restart the server

### **Issue: Want to use other nodes in Real mode**
**Solution:**
- Add Anthropic or OpenAI API keys
- Most nodes need Claude or GPT to work in Real mode
- Or continue using Demo mode for those nodes!

---

## 🎉 **You're All Set!**

### **Quick Test:**
1. Visit: http://localhost:3000/workflow
2. Add a **Web Search** node
3. Toggle to **"🔧 Real API"** mode
4. Click **"▶️ Execute"**
5. See real web search results!

**Your Perplexity API is live and ready to search the web!** 🌐✨

---

## 📊 **Next Steps**

1. **Test Web Search** - Try real queries
2. **Add more API keys** - Unlock all features
3. **Build complex workflows** - Combine real + demo nodes
4. **Share results** - Export successful workflows
5. **Go to production** - All Real API mode!

**Happy searching!** 🚀
