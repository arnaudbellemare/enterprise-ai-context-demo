# 🎬 Visual Demo Walkthrough

## **30-Second Quick Start**

### **Step 1: Open the Workflow Builder**
```
URL: http://localhost:3000/workflow
```

**What you'll see:**
- ✅ Clean interface with node library on the left
- ✅ Empty canvas in the center
- ✅ Toolbar at the top with buttons
- ✅ Stats panel showing "🎮 Demo" mode
- ✅ Quick start guide in bottom right

---

### **Step 2: Load Example Workflow**
**Click the "Load Example" button**

**What happens:**
```
📋 Example workflow loaded (appears in log)
```

**Visual result:**
```
[Memory Search]  ──►  [Custom Agent]  ──►  [Generate Answer]
     (Node 1)              (Node 2)              (Node 3)
```

**You'll see:**
- 3 nodes appear on the canvas
- Gray connection lines between them
- Each node shows:
  - Icon with color-coded background
  - Node name
  - Description
  - Status: "ready"

---

### **Step 3: Execute the Workflow**
**Click the "▶️ Execute Demo" button**

**What happens in real-time:**

```
[00:00] 🚀 Workflow execution started (DEMO MODE)

[00:01] ▶️ Executing: Memory Search
        Status: ready → executing (yellow animation)
        
[00:02] ✅ Found 3 matching documents
        Status: executing → complete (green checkmark)
        ✅ Completed: Memory Search

[00:03] ▶️ Executing: Custom Agent
        Status: ready → executing (yellow animation)
        
[00:04] ✅ Analysis complete: Positive sentiment detected
        Status: executing → complete (green checkmark)
        ✅ Completed: Custom Agent

[00:05] ▶️ Executing: Generate Answer
        Status: ready → executing (yellow animation)
        
[00:06] ✅ Generated comprehensive answer (245 words)
        Status: executing → complete (green checkmark)
        ✅ Completed: Generate Answer

[00:07] 🎉 Workflow completed successfully!
[00:07] 📊 Results: 3 nodes executed

✅ Workflow completed! Check the execution log for results.
```

**Visual indicators:**
- 🟡 Yellow border = Currently executing
- 🟢 Green border = Completed successfully
- Progress flows from left to right
- Connection lines show data flow

---

## **Building Your Own Workflow**

### **Step 1: Add Nodes**
**Click any node from the sidebar:**

```
🔍 Memory Search     → Searches your knowledge base
🌐 Web Search        → Live internet search
📦 Context Assembly  → Merges multiple sources
🤖 Model Router      → Picks best AI model
⚡ GEPA Optimize     → Improves prompts
🔍 LangStruct        → Extracts structured data
▶ Custom Agent       → Your custom AI task
✅ Generate Answer   → Final response
```

**Action**: Click "Memory Search"

**Result**:
- Node appears on canvas at random position
- You can drag it anywhere
- Green dot on right (source handle)
- Blue dot on left (target handle)

---

### **Step 2: Connect Nodes**
**Drag from green dot to blue dot:**

```
[Node A]  ●─────────────────────────►●  [Node B]
        green                      blue
       (source)                  (target)
```

**Visual feedback:**
- Purple dashed line appears while dragging
- Snaps to blue handle when close
- Becomes gray solid line when connected
- Log shows: "🔗 Connected: Node A → Node B"

**Validation:**
- ✅ Gray line = Valid connection
- ❌ Red line = Invalid (creates cycle, etc.)
- Error panel shows what's wrong

---

### **Step 3: Configure Node**
**Click "⚙️ Config" button on any node**

**Configuration panel opens:**
```
┌─────────────────────────────────────┐
│ Configure Memory Search             │
├─────────────────────────────────────┤
│                                     │
│ Match Threshold: [0.8      ]       │
│ Match Count:     [10       ]       │
│ Collection:      [my-docs  ]       │
│                                     │
│ API: /api/search/indexed            │
│                                     │
└─────────────────────────────────────┘
```

**You can modify:**
- Temperature settings
- Max tokens
- Model selection
- Task descriptions
- Any node-specific parameters

---

## **Demo Mode vs Real API Mode**

### **Demo Mode (Default) 🎮**

**What it does:**
```
Memory Search   → Returns: "Found 3 matching documents"
Web Search      → Returns: "Retrieved 5 web results"
Custom Agent    → Returns: "Positive sentiment detected"
Generate Answer → Returns: "245-word AI response"
```

**Benefits:**
- ✅ Instant results (no waiting for APIs)
- ✅ No API keys required
- ✅ No costs or rate limits
- ✅ Perfect for testing logic
- ✅ Shows exactly how workflows execute

**When to use:**
- Learning how workflows work
- Testing node connections
- Experimenting with configurations
- Sharing demos with team

---

### **Real API Mode 🔧**

**What it does:**
```
Memory Search   → Calls actual vector database
Web Search      → Hits Perplexity API for live data
Custom Agent    → Sends to Claude/GPT models
Generate Answer → Gets real AI-generated responses
```

**Requirements:**
- API keys in .env.local
- Internet connection
- Active API subscriptions

**When to use:**
- Production workflows
- Real user queries
- Actual data processing
- Live deployments

**To switch:**
1. Click "🎮 Demo Mode" button
2. It changes to "🔧 Real API"
3. Execution uses real services

---

## **Real-Time Execution Example**

### **Timeline View:**
```
T+0.0s  │ 🚀 Workflow started (DEMO MODE)
        │
T+0.5s  │ ▶️ Memory Search: executing...
T+1.7s  │    ✅ Found 3 documents
        │    ✅ Memory Search: complete
        │
T+1.8s  │ ▶️ Custom Agent: executing...
T+3.0s  │    ✅ Sentiment: Positive
        │    ✅ Custom Agent: complete
        │
T+3.1s  │ ▶️ Generate Answer: executing...
T+4.3s  │    ✅ Generated 245 words
        │    ✅ Generate Answer: complete
        │
T+4.4s  │ 🎉 Workflow completed!
        │ 📊 3 nodes executed successfully
```

### **Visual Progress:**
```
Step 1: Memory Search
┌─────────────────┐
│ 🔍 Memory...    │  ← Yellow border (executing)
│ Vector search   │
│ Status: ⏳      │
└─────────────────┘

Step 2: Memory Search Complete
┌─────────────────┐
│ 🔍 Memory...    │  ← Green border (complete)
│ Vector search   │
│ Status: ✅      │
└─────────────────┘

Step 3: Custom Agent Executing
┌─────────────────┐     ┌─────────────────┐
│ 🔍 Memory...    │ ──► │ ▶ Custom...     │  ← Yellow
│ Status: ✅      │     │ Status: ⏳      │
└─────────────────┘     └─────────────────┘
```

---

## **Workflow Validation in Action**

### **Valid Workflow (Gray Lines) ✅**
```
[Start Node] ─gray─► [Middle Node] ─gray─► [End Node]

Indicators:
- All lines are gray
- No error messages
- Execute button enabled
- Status: "Ready"
```

### **Invalid Workflow (Red Lines) ❌**
```
[Node A] ─red─► [Node B]
   ↑              |
   └────red───────┘
   (Circular dependency!)

Indicators:
- Lines turn red
- Error icon (!) appears on lines
- Error panel shows: "Circular dependency detected"
- Execute button disabled
- Status: "Issues Found"
```

### **Orphaned Node (Red Indicator) ❌**
```
[Connected A] ─gray─► [Connected B]

[Orphaned C]  (floating, not connected)

Error panel:
"Node 'Orphaned C' is not connected to the workflow"
```

---

## **Execution Log Examples**

### **Successful Execution:**
```
[12:34:56] 🚀 Workflow execution started (DEMO MODE)
[12:34:57] ▶️ Executing: Memory Search
[12:34:58]    ✅ Found 3 matching documents
[12:34:59] ✅ Completed: Memory Search
[12:35:00] ▶️ Executing: Custom Agent
[12:35:01]    ✅ Analysis complete: Positive sentiment
[12:35:02] ✅ Completed: Custom Agent
[12:35:03] ▶️ Executing: Generate Answer
[12:35:04]    ✅ Generated comprehensive answer (245 words)
[12:35:05] ✅ Completed: Generate Answer
[12:35:06] 🎉 Workflow completed successfully!
[12:35:06] 📊 Results: 3 nodes executed
```

### **With Real API Mode:**
```
[12:40:00] 🔧 Switched to REAL API mode
[12:40:15] 🚀 Workflow execution started
[12:40:16] ▶️ Executing: Memory Search
[12:40:18]    ⚙️ Calling /api/search/indexed...
[12:40:20]    ✅ Retrieved: 5 documents (relevance: 0.89)
[12:40:21] ✅ Completed: Memory Search
```

---

## **Pro Tips for Demo Mode**

### **1. Use for Rapid Prototyping**
- Build workflow structure first
- Test execution flow
- Verify node connections
- Then switch to real APIs

### **2. Share with Non-Technical Users**
- Demo mode shows the concept
- No setup burden
- Instant gratification
- Easy to understand

### **3. Development & Testing**
- Test workflow logic without API costs
- Verify execution order
- Check error handling
- Validate user experience

### **4. Training & Onboarding**
- New team members can see it work immediately
- No credential sharing needed
- Safe environment to experiment
- Learn by doing

---

## **Common Workflows to Try**

### **1. Simple Q&A**
```
[Custom Agent] → [Generate Answer]
```
**Demo output**: "AI responds with helpful answer"

### **2. Research Assistant**
```
[Web Search] → [Context Assembly] → [Generate Answer]
```
**Demo output**: "5 web results → Merged context → 245-word answer"

### **3. Smart Analysis**
```
[Memory Search] → [Custom Agent] → [LangStruct] → [Generate Answer]
```
**Demo output**: "3 docs → Sentiment analysis → Structured data → Final report"

### **4. Optimized Response**
```
[GEPA Optimize] → [Model Router] → [Generate Answer]
```
**Demo output**: "Improved prompt → Best model selected → Optimized answer"

---

## **🎉 You're a Workflow Pro!**

**Remember:**
1. **Demo Mode** = Instant testing, no setup
2. **Real API Mode** = Production execution
3. **Gray lines** = Valid workflow
4. **Red lines** = Fix the errors
5. **Execution log** = Your best friend

**Start building amazing AI workflows now!** 🚀
