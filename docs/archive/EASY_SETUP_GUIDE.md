# 🚀 Easy Setup & Execution Guide

## ✨ **INSTANT DEMO - NO SETUP REQUIRED!**

The workflow builder now has **DEMO MODE** enabled by default - you can test everything immediately without any configuration!

### 📋 **Quick Start (30 seconds)**

1. **Open the app**: http://localhost:3000/workflow
2. **Click "Load Example"** - Pre-built workflow appears
3. **Click "▶️ Execute Demo"** - Watch it run with realistic mock data!
4. **See results** in the execution log

**That's it! No API keys, no configuration, just instant results!** 🎉

---

## 🎮 **Demo Mode Features**

### **What Demo Mode Does:**
- ✅ Simulates realistic API responses
- ✅ Shows exactly how workflows execute
- ✅ Displays mock results for each node type
- ✅ Perfect for testing and learning
- ✅ No external dependencies needed

### **Mock Responses Include:**
- **Memory Search**: "Found 3 matching documents"
- **Web Search**: "Retrieved 5 web results"
- **Context Assembly**: "Assembled context from 8 sources"
- **Custom Agent**: "Analysis complete: Positive sentiment detected"
- **Generate Answer**: "Generated comprehensive answer (245 words)"
- **GEPA Optimize**: "Prompt optimized (iteration 3/3)"
- **LangStruct**: "Structured extraction complete"
- **Model Router**: "Routed to Claude-3-Haiku"

---

## 🔧 **Switching to Real API Mode**

When you're ready to use real AI services:

### **Step 1: Toggle Real API Mode**
- Click the **"🎮 Demo Mode"** button in the toolbar
- It will switch to **"🔧 Real API"**

### **Step 2: Configure API Keys**
Create `/frontend/.env.local`:
```bash
# Required for real execution
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Optional (for advanced features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### **Step 3: Restart the Server**
```bash
cd frontend
npm run dev
```

### **Step 4: Execute with Real APIs**
- Build your workflow
- Ensure "🔧 Real API" mode is active
- Click "▶️ Execute"
- Get real AI responses!

---

## 📊 **How to Build Your First Workflow**

### **Method 1: Start from Example**
1. Click **"Load Example"** button
2. See a pre-built workflow: Memory Search → Custom Agent → Generate Answer
3. Click **"▶️ Execute Demo"** to run it
4. Watch the execution log for results

### **Method 2: Build from Scratch**
1. **Add Nodes**: Click node types from the left sidebar
2. **Connect Nodes**: Drag from green handle (source) to blue handle (target)
3. **Configure**: Click "⚙️ Config" on any node to customize
4. **Execute**: Click "▶️ Execute Demo" to run

### **Method 3: Import Existing**
1. Click **"Import"** button
2. Select a `.json` workflow file
3. Workflow loads automatically
4. Execute or modify as needed

---

## 🎯 **Example Workflows to Try**

### **1. Simple AI Chat**
```
Custom Agent → Generate Answer
```
- Basic AI conversation flow
- Great for testing prompts

### **2. Enhanced Research**
```
Memory Search → Web Search → Context Assembly → Generate Answer
```
- Combines internal knowledge + live web data
- Produces comprehensive answers

### **3. Optimized Analysis**
```
GEPA Optimize → LangStruct → Custom Agent → Generate Answer
```
- Optimizes prompts first
- Extracts structured data
- Custom analysis
- Final answer generation

### **4. Smart Routing**
```
Memory Search → Model Router → Generate Answer
```
- Retrieves context
- Selects best AI model automatically
- Generates optimized response

---

## 🔍 **Understanding Workflow Validation**

### **Valid Workflows** (Gray Lines ✅)
- All nodes connected properly
- No circular dependencies
- Single entry and exit points
- Execute button enabled

### **Invalid Workflows** (Red Lines ❌)
- Orphaned nodes (not connected)
- Circular dependencies (infinite loops)
- Multiple entry/exit points
- Execute button disabled
- Error messages in sidebar

**Tip**: The system validates in real-time and shows you exactly what's wrong!

---

## 💡 **Pro Tips**

### **1. Use Demo Mode for Learning**
- Perfect for understanding workflow logic
- No costs, no API limits
- Instant feedback

### **2. Configure Nodes Before Executing**
- Click "⚙️ Config" on any node
- Adjust temperature, max tokens, prompts
- See changes reflected immediately

### **3. Export Your Workflows**
- Click "Export" to save as JSON
- Share with team members
- Version control your workflows

### **4. Watch the Execution Log**
- Shows each step in real-time
- Displays results from each node
- Helps debug issues

### **5. Test Different Configurations**
- Try different node orders
- Experiment with parameters
- See what works best

---

## 🚨 **Troubleshooting**

### **Problem: Execute button is disabled**
**Solution**: 
- Check for red connection lines (validation errors)
- Look at the error panel in the sidebar
- Fix the issues shown

### **Problem: No results showing**
**Solution**:
- Make sure you're in Demo Mode (🎮 icon)
- Check the execution log panel
- Verify nodes are connected

### **Problem: Want to use real APIs**
**Solution**:
- Add API keys to `.env.local`
- Toggle to "🔧 Real API" mode
- Restart the server

### **Problem: Workflow too slow**
**Solution**:
- In Demo Mode: Each node takes ~1.2 seconds (configurable)
- In Real API Mode: Depends on API response times
- Optimize by reducing unnecessary nodes

---

## 🎉 **You're Ready!**

1. **Start** → http://localhost:3000/workflow
2. **Click** → "Load Example"
3. **Run** → "▶️ Execute Demo"
4. **Watch** → Results in execution log
5. **Build** → Your own workflows!

**No configuration needed - just instant workflow magic!** ✨

---

## 📚 **What's Next?**

- **Experiment** with different node combinations
- **Configure** each node's parameters
- **Export** successful workflows
- **Share** with your team
- **Switch** to Real API mode when ready

**Happy workflow building!** 🚀
