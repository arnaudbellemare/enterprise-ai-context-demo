# 🚀 Workflow Builder Quick Start

## ✅ Production-Ready Features

Your workflow builder is now **100% customizable** with **ZERO mock data**!

---

## 🎯 How to Use

### 1. Access Workflow Builder

From main page (`http://localhost:3000/`):
- Click **"◄ VISUAL.WORKFLOW"** (blue tab)
- Or directly: `http://localhost:3000/workflow`

### 2. Add Nodes

**Click any node from the left sidebar:**
- 🧠 Memory Search - Vector similarity search
- 🌐 Web Search - Live Perplexity
- 📦 Context Assembly - Merge results
- 🤖 Model Router - Smart AI model selection
- ⚡ GEPA Optimize - Prompt evolution
- 🔍 LangStruct - Extract structured data
- ✅ Generate Answer - Final AI response

**Each click adds a node to the canvas!**

### 3. Connect Nodes (Drag & Drop)

**To connect two nodes:**
1. **Hover over a node** - you'll see circles (●) on the left and right
2. **Click and drag from the ● on the right side** of one node
3. **Drop on the ● on the left side** of another node
4. **A line appears** showing the connection!

**Example:**
```
Memory Search ● -----> ● Context Assembly
```

Drag from Memory Search's right ● to Context Assembly's left ●

### 4. Configure Nodes

**Click the ⚙️ button** on any node to open configuration panel:

**Memory Search:**
- `matchThreshold`: 0.0 to 1.0 (default: 0.8)
- `matchCount`: Number of results (default: 10)
- `collection`: Collection name (optional)

**Web Search:**
- `recencyFilter`: "day", "week", "month"
- `maxResults`: Number of results (default: 10)

**Model Router:**
- `autoSelect`: true/false
- `preferredModel`: "claude-3-haiku", "gpt-4o", etc.

**GEPA Optimize:**
- `iterations`: 1-10 (default: 3)
- `goal`: "accuracy" or "speed"

**LangStruct:**
- `useRealLangStruct`: true/false
- `refine`: true/false

**Answer:**
- `temperature`: 0.0 to 1.0 (default: 0.7)
- `maxTokens`: 100-4000 (default: 2048)

### 5. Execute Workflow

Click **"▶️ Execute"** button:
1. Workflow runs in **topological order** (based on connections)
2. Each node calls its **REAL API endpoint**
3. Data flows from node to node
4. **Visual feedback**: ready → executing (yellow, pulsing) → complete (green)
5. **Execution log** shows progress in real-time

### 6. Export/Import

**Export:**
- Click **"💾 Export"**
- Saves as JSON file
- Includes nodes, connections, and configurations

**Import:**
- Click **"📥 Import"**
- Select your .json file
- Workflow restores exactly as saved

---

## 🔥 Example Workflows

### 1. Simple RAG Pipeline

**Steps:**
1. Add **🧠 Memory Search**
2. Add **✅ Generate Answer**
3. **Drag from Memory ● to Answer ●**
4. Click **▶️ Execute**

**Result:** Searches your memory vault and generates answer!

### 2. Hybrid Search + AI

**Steps:**
1. Add **🧠 Memory Search**
2. Add **🌐 Web Search**
3. Add **📦 Context Assembly**
4. Add **✅ Generate Answer**
5. **Connect:**
   - Memory ● → Context ●
   - Web ● → Context ●
   - Context ● → Answer ●
6. Click **▶️ Execute**

**Result:** Searches both memory and web, merges results, generates answer!

### 3. Full AI Pipeline

**Steps:**
1. Add **🧠 Memory Search**
2. Add **🌐 Web Search**
3. Add **📦 Context Assembly**
4. Add **🔍 LangStruct Extract**
5. Add **🤖 Model Router**
6. Add **⚡ GEPA Optimize**
7. Add **✅ Generate Answer**
8. **Connect them in order** (Memory → Context, Web → Context, Context → LangStruct, etc.)
9. **Configure each node** (click ⚙️)
10. Click **▶️ Execute**

**Result:** Full enterprise AI pipeline with optimization!

---

## ✅ Real API Calls (No Mocks!)

Each node makes **REAL API calls**:

```typescript
// Memory Search
POST /api/search/indexed
{
  "query": "...",
  "matchThreshold": 0.8,
  "matchCount": 10
}

// Web Search
POST /api/perplexity/chat
{
  "messages": [{"role": "user", "content": "..."}]
}

// GEPA Optimize
POST /api/gepa/optimize
{
  "prompt": "...",
  "context": "..."
}

// LangStruct Extract
POST /api/langstruct/process
{
  "text": "...",
  "useRealLangStruct": true
}

// Generate Answer
POST /api/answer
{
  "query": "...",
  "documents": [...],
  "preferredModel": "claude-3-haiku"
}
```

---

## 🎨 Visual Features

### Node Status Colors

- **Gray** - Ready to execute
- **Yellow (pulsing)** - Currently executing
- **Green** - Completed successfully
- **Red** - Error occurred

### Connection Types

- **Solid animated line** - Active data flow
- **Dashed line** - Temporary/conditional (not implemented yet)

### Handles (Connection Points)

- **● Left side** - Input (receives data from previous nodes)
- **● Right side** - Output (sends data to next nodes)

---

## 🛠️ Toolbar Actions

**On each node:**
- **⚙️ Config** - Open configuration panel
- **🗑️ Delete** - Remove node (and its connections)

**Top toolbar:**
- **▶️ Execute** - Run workflow with real APIs
- **💾 Export** - Save workflow as JSON
- **📥 Import** - Load saved workflow
- **🧹 Clear** - Remove all nodes

---

## 📊 Execution Log

Watch the execution log panel (left sidebar, bottom):

```
[10:23:45] ➕ Added: 🧠 Memory Search
[10:23:47] ➕ Added: ✅ Generate Answer
[10:23:49] ✅ Connected: memorySearch-123 → answer-456
[10:23:51] 🚀 Workflow started
[10:23:52] ▶️ 🧠 Memory Search...
[10:23:53] ✅ 🧠 Memory Search done
[10:23:53] ▶️ ✅ Generate Answer...
[10:23:55] ✅ ✅ Generate Answer done
[10:23:55] 🎉 Workflow complete!
```

---

## 🚀 Ready for Production

### ✅ What's Production-Ready:

1. **No Mock Data** - All real API calls
2. **Fully Configurable** - Every parameter editable
3. **Error Handling** - Graceful degradation
4. **Visual Feedback** - Real-time status updates
5. **Export/Import** - Save and version control workflows
6. **Scalable** - Add unlimited nodes
7. **Type-Safe** - Full TypeScript
8. **Clean UI** - Professional design

### ✅ Real APIs Used:

- `/api/search/indexed` - Vector similarity search
- `/api/perplexity/chat` - Live web search
- `/api/context/assemble` - Context merging
- `/api/answer` - Multi-model AI answers
- `/api/gepa/optimize` - Prompt optimization
- `/api/langstruct/process` - Structured extraction
- `/api/workflow/execute` - Workflow execution engine

---

## 💡 Pro Tips

1. **Start Simple** - Build a 2-3 node workflow first
2. **Test Each Node** - Execute after each addition
3. **Configure Before Execute** - Adjust parameters for your use case
4. **Save Templates** - Export workflows you like
5. **Use Execution Log** - Debug issues by watching the log
6. **Check API Endpoints** - See which API each node calls

---

## 🎯 Next Steps

1. **Try the basic workflow** at `/workflow`
2. **Try Ax DSPy version** at `/workflow-ax` (auto-optimized!)
3. **Build your own workflows**
4. **Export and share** with your team
5. **Deploy to production** (all APIs ready!)

---

**🎉 You're ready to build production AI workflows!**

**No mocks. No limitations. Just drag, connect, configure, and execute!** 🚀

