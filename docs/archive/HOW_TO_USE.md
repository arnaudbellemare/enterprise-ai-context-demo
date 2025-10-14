# 🚀 How to Use the Visual Workflow Builder

## **TL;DR - Get Started in 30 Seconds**

```bash
# 1. Open your browser
http://localhost:3000/workflow

# 2. Click "Load Example"
# 3. Click "▶️ Execute Demo"
# 4. Watch it work!
```

**NO SETUP REQUIRED** - Demo mode is enabled by default! 🎉

---

## 🎮 **What is Demo Mode?**

Demo Mode lets you **execute workflows instantly** without any API keys or configuration. It uses realistic mock data to show you exactly how workflows run.

### **Features:**
- ✅ **Instant execution** - No waiting for external APIs
- ✅ **Realistic responses** - See what each node would return
- ✅ **No configuration** - Works out of the box
- ✅ **Zero cost** - No API charges
- ✅ **Perfect for learning** - Understand workflow logic

### **When to use Demo Mode:**
- 🎓 Learning how workflows work
- 🧪 Testing node configurations
- 🎨 Prototyping new workflows
- 👥 Demonstrating to team members
- 🚀 Quick validation of ideas

---

## 🔧 **Switching to Real API Mode**

When you're ready for production:

### **Step 1: Toggle the Mode**
- Click the **"🎮 Demo Mode"** button
- It switches to **"🔧 Real API"**

### **Step 2: Add API Keys**
Create `frontend/.env.local`:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
```

### **Step 3: Restart**
```bash
cd frontend
npm run dev
```

### **Step 4: Execute**
- Build your workflow
- Click **"▶️ Execute"**
- Get real AI responses!

---

## 🎯 **Building Workflows**

### **Method 1: Start with Example**
1. Click **"Load Example"** button
2. Pre-built workflow appears
3. Click **"▶️ Execute Demo"**
4. See it run!

### **Method 2: Build Your Own**
1. **Add nodes** from sidebar (click to add)
2. **Connect nodes** (drag green → blue dots)
3. **Configure** (click ⚙️ on any node)
4. **Execute** (click ▶️ Execute Demo)

---

## 📊 **Understanding the Interface**

### **Sidebar (Left)**
- 🎯 **Node Library** - All available node types
- 📋 **Execution Log** - Real-time workflow progress
- ⚠️ **Error Panel** - Validation issues (if any)

### **Toolbar (Top)**
- ▶️ **Execute** - Run the workflow
- 🎮 **Mode Toggle** - Demo ↔ Real API
- 📋 **Load Example** - Pre-built workflow
- 💾 **Export** - Save workflow as JSON
- 📥 **Import** - Load saved workflow
- 🧹 **Clear** - Remove all nodes

### **Stats Panel (Top Right)**
- **Nodes** - Count of nodes in workflow
- **Connections** - Count of edges
- **Mode** - Current execution mode
- **Status** - Workflow state

### **Canvas (Center)**
- **Drag nodes** to reposition
- **Drag handles** to connect
- **Click ⚙️** to configure
- **Click 🗑️** to delete

---

## 🔗 **Connection System**

### **Handles:**
- 🔵 **Blue (Left)** - Input/Target - receives data
- 🟢 **Green (Right)** - Output/Source - sends data

### **Connecting Nodes:**
1. Click and drag from **green dot** (source)
2. Drag to **blue dot** (target)
3. Release to connect

### **Connection Colors:**
- **Gray** ✅ - Valid connection
- **Red** ❌ - Invalid (error in workflow)

---

## ⚙️ **Node Types**

| Icon | Node | Purpose | Demo Output |
|------|------|---------|-------------|
| 🔍 | **Memory Search** | Search vector database | "Found 3 documents" |
| 🌐 | **Web Search** | Live internet search | "Retrieved 5 results" |
| 📦 | **Context Assembly** | Merge multiple sources | "Assembled 8 sources" |
| 🤖 | **Model Router** | Select best AI model | "Routed to Claude-3-Haiku" |
| ⚡ | **GEPA Optimize** | Improve prompts | "Optimized (3/3)" |
| 🔍 | **LangStruct** | Extract structured data | "12 entities extracted" |
| ▶ | **Custom Agent** | Your custom AI task | "Sentiment: Positive" |
| ✅ | **Generate Answer** | Final AI response | "Generated 245 words" |

---

## ✅ **Workflow Validation**

### **Valid Workflow:**
```
✅ All nodes connected
✅ No circular dependencies
✅ Gray connection lines
✅ Execute button enabled
```

### **Invalid Workflow:**
```
❌ Orphaned nodes (not connected)
❌ Circular dependencies (infinite loop)
❌ Red connection lines
❌ Execute button disabled
❌ Error messages shown
```

**Fix:** Check the error panel and fix the issues shown!

---

## 🎬 **Execution Flow**

### **What Happens When You Click Execute:**

```
Step 1: Validation
→ Check for errors
→ Verify all connections
→ Determine execution order

Step 2: Execution (in order)
→ Node 1: Memory Search
   ⏳ Executing...
   ✅ Complete
→ Node 2: Custom Agent
   ⏳ Executing...
   ✅ Complete
→ Node 3: Generate Answer
   ⏳ Executing...
   ✅ Complete

Step 3: Results
→ Show in execution log
→ Alert when complete
→ Display results
```

### **Visual Indicators:**
- 🟡 **Yellow border** - Currently executing
- 🟢 **Green border** - Completed successfully
- 🔴 **Red border** - Error occurred

---

## 💡 **Pro Tips**

### **1. Use Demo Mode for Prototyping**
Build and test workflow logic before connecting real APIs

### **2. Configure Before Executing**
Click ⚙️ on each node to customize behavior

### **3. Watch the Execution Log**
Real-time feedback shows exactly what's happening

### **4. Export Your Workflows**
Save successful workflows as JSON for reuse

### **5. Start Simple**
Begin with 2-3 nodes, then add complexity

### **6. Test Edge Cases**
Try invalid connections to understand validation

---

## 🎯 **Example Workflows**

### **1. Simple AI Chat**
```
Custom Agent → Generate Answer
```
**Use case:** Basic AI conversation

### **2. Enhanced Research**
```
Memory Search → Web Search → Context Assembly → Generate Answer
```
**Use case:** Comprehensive answers combining internal + web data

### **3. Smart Analysis**
```
Memory Search → Custom Agent → LangStruct → Generate Answer
```
**Use case:** Analyze data and extract structured insights

### **4. Optimized Response**
```
GEPA Optimize → Model Router → Generate Answer
```
**Use case:** Automatically improve prompts and select best model

---

## 🚨 **Common Issues & Solutions**

### **Issue: Execute button is grayed out**
**Solution:** Check for red lines and fix validation errors

### **Issue: No results showing**
**Solution:** Look at the execution log panel for details

### **Issue: Want to use real APIs**
**Solution:** Toggle to Real API mode and add API keys

### **Issue: Workflow is slow**
**Solution:** 
- Demo Mode: ~1.2s per node (configurable)
- Real API: Depends on API response time

### **Issue: Can't connect nodes**
**Solution:** Drag from green (source) to blue (target)

---

## 📚 **Documentation**

- **EASY_SETUP_GUIDE.md** - Complete setup instructions
- **DEMO_WALKTHROUGH.md** - Visual step-by-step guide
- **WORKFLOW_TEST_RESULTS.md** - Test results and validation
- **QUICK_DEMO.md** - 30-second quick start

---

## 🎉 **You're Ready!**

### **Quick Checklist:**
- [ ] Open http://localhost:3000/workflow
- [ ] Click "Load Example"
- [ ] Click "▶️ Execute Demo"
- [ ] Watch it run
- [ ] Build your own workflow
- [ ] Configure nodes
- [ ] Execute and see results!

**No configuration, no setup, just instant AI workflows!** 🚀

---

## 🔄 **What's Next?**

1. **Experiment** - Try different node combinations
2. **Configure** - Customize each node's settings
3. **Export** - Save successful workflows
4. **Share** - Demo to your team
5. **Deploy** - Switch to Real API mode for production

**Happy workflow building!** ✨
