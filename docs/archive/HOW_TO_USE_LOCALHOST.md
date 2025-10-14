# 🚀 How to Use Your System on localhost:3000

**Quick Start**: Access Arena and Agent Builder from your browser!

---

## ⚡ **START THE SERVER** (2 minutes)

### **Option 1: Quick Start** (Recommended)

```bash
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo

# Make sure Ollama is running
ollama serve &

# Start the frontend server
cd frontend
npm install  # First time only
npm run dev
```

**Then open**: http://localhost:3000

---

### **Option 2: With Perplexity** (If you want web search)

```bash
# Set your Perplexity key first
export PERPLEXITY_API_KEY="pplx-YOUR_KEY_HERE"

# Run setup script
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
./SETUP_FOR_TESTING.sh

# Then start server
cd frontend
npm run dev
```

---

## 🎯 **WHAT YOU CAN ACCESS**

### **Main Pages**:

```
http://localhost:3000/
└─ Home page with overview

http://localhost:3000/arena
└─ Arena: Test and benchmark agents

http://localhost:3000/agent-builder
└─ Agent Builder: Create custom agents

http://localhost:3000/workflow
└─ Workflow Builder: Create workflows

http://localhost:3000/feedback-demo
└─ Feedback System: Rate strategies
```

---

## 🏟️ **THE ARENA** (Main Testing Interface)

### **What It Does**:

```
The Arena is your testing playground!

Features:
├─ Pre-built test scenarios (15+)
├─ Real-time execution
├─ Performance benchmarking
├─ Side-by-side comparison
└─ Statistical validation

Use it to:
✅ Test your system capabilities
✅ Compare against baselines
✅ Validate performance improvements
✅ Prove production-readiness
```

---

### **How to Use Arena**:

```
1. Open http://localhost:3000/arena

2. Select a Test Scenario:
   ┌─────────────────────────────────────┐
   │ 🔥 Crypto Liquidations              │
   │ 🏦 Financial LoRA Analysis          │
   │ 🚀 ACE Framework Integration Demo   │
   │ 🌐 Multi-Domain AI Platform         │
   │ ... and 11 more scenarios           │
   └─────────────────────────────────────┘

3. Click "Execute Task"

4. Watch Real-Time Execution:
   ├─ Agent reasoning steps
   ├─ Tool usage
   ├─ Performance metrics
   └─ Final results

5. See Performance Report:
   ├─ Accuracy
   ├─ Speed (latency)
   ├─ Cost
   └─ Comparison vs baseline
```

---

### **Recommended Arena Tests**:

```
Test 1: "🚀 ACE Framework Integration Demo"
Purpose: See ALL system capabilities
What it tests:
├─ Smart model routing
├─ ACE context engineering
├─ Multi-agent orchestration
├─ Statistical validation
└─ Complete integration

Expected: Shows full system working! ✅

Test 2: "🏦 Financial LoRA Analysis"
Purpose: Multi-domain performance
What it tests:
├─ LoRA adapters (4 methods)
├─ Financial tasks (XBRL, sentiment, risk)
├─ Cost comparison
└─ Deployment considerations

Expected: Shows domain expertise! ✅

Test 3: "🌐 Multi-Domain AI Platform"
Purpose: 12-domain coverage
What it tests:
├─ Domain routing
├─ Specialized prompts
├─ Compliance handling
└─ Industry benchmarks

Expected: Shows breadth! ✅

Test 4: "🧬 GEPA Evolution"
Purpose: Prompt optimization
What it tests:
├─ Reflective mutation
├─ System-aware merge
├─ Pareto filtering
└─ Evolution tracking

Expected: Shows self-improvement! ✅
```

---

## 🛠️ **THE AGENT BUILDER** (Custom Agent Creation)

### **What It Does**:

```
Create custom agents with specific capabilities!

Features:
├─ Visual agent designer
├─ Tool selection
├─ Domain configuration
├─ Prompt customization
└─ One-click deployment

Use it to:
✅ Create specialized agents
✅ Configure capabilities
✅ Test custom scenarios
✅ Deploy to production
```

---

### **How to Use Agent Builder**:

```
1. Open http://localhost:3000/agent-builder

2. Configure Your Agent:
   ┌─────────────────────────────────────┐
   │ Agent Name: [My Financial Agent]    │
   │ Domain: [Financial]                 │
   │ Model: [Ollama gemma2:2b]           │
   │ Tools: [✓] Web Search               │
   │        [✓] Calculator                │
   │        [✓] Database Access           │
   │ Capabilities: [Describe what it does]│
   └─────────────────────────────────────┘

3. Add Custom Instructions (Optional):
   - Specific domain knowledge
   - Custom workflows
   - Compliance requirements

4. Click "Create Agent"

5. Test It:
   - Enter a test query
   - See agent execute
   - Validate results

6. Deploy:
   - Agent is saved
   - Ready to use in production
   - Accessible via API
```

---

### **Example Agents to Build**:

```
Financial Analyst Agent:
├─ Domain: Financial
├─ Tools: Web search, calculator, database
├─ Capabilities: XBRL analysis, risk assessment
└─ Use: Analyze financial documents

Legal Compliance Agent:
├─ Domain: Legal
├─ Tools: Document search, citation lookup
├─ Capabilities: Contract review, compliance check
└─ Use: Legal document analysis

Medical Records Agent:
├─ Domain: Medical
├─ Tools: Database, knowledge base
├─ Capabilities: ICD-10 coding, diagnosis support
└─ Use: Medical record processing
```

---

## 📋 **QUICK START CHECKLIST**

```
Before You Start:
├─ [✅] Ollama installed (ollama.ai)
├─ [✅] Model downloaded (ollama pull gemma2:2b)
├─ [⚠️ ] Ollama running (ollama serve)
├─ [⚠️ ] Dependencies installed (npm install)
└─ [⚠️ ] Environment configured (.env files)

To Start Server:
1. cd frontend
2. npm run dev
3. Open http://localhost:3000

First Time Setup:
1. ./SETUP_FOR_TESTING.sh (auto-configure)
2. cd frontend && npm run dev
3. Open http://localhost:3000
```

---

## 🎯 **WHAT TO TRY FIRST**

### **5-Minute Demo**:

```
1. Start server:
   cd frontend && npm run dev

2. Open Arena:
   http://localhost:3000/arena

3. Select task:
   "🚀 ACE Framework Integration Demo"

4. Click "Execute Task"

5. Watch it work:
   ├─ See real-time execution
   ├─ Agent reasoning displayed
   ├─ Performance metrics shown
   └─ Results validated

Expected: Full system demonstration! ✅
Time: 5 minutes
Cost: $0 (Ollama local)
```

---

### **10-Minute Exploration**:

```
After Arena demo:

1. Try Agent Builder:
   http://localhost:3000/agent-builder
   
2. Create a simple agent:
   - Name: "Test Agent"
   - Domain: "Financial"
   - Tools: Web search
   
3. Test it:
   - Query: "What is revenue recognition?"
   - See: Agent executes and responds
   
4. Try other Arena tasks:
   - Financial analysis
   - Multi-domain
   - GEPA evolution

Expected: Understand system capabilities! ✅
```

---

## 🚨 **TROUBLESHOOTING**

### **Error: "Cannot GET /"**

```bash
# Server not running!
cd frontend
npm run dev

# Wait for: "Ready on http://localhost:3000"
```

---

### **Error: "Module not found"**

```bash
# Missing dependencies!
cd frontend
npm install

# Then try again
npm run dev
```

---

### **Error: "Ollama not available"**

```bash
# Ollama not running!
ollama serve

# In another terminal:
cd frontend
npm run dev
```

---

### **Error: "Port 3000 already in use"**

```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
# Then open: http://localhost:3001
```

---

### **Error: "Database connection failed"**

```bash
# Check .env files exist
ls frontend/.env.local

# If not, run setup:
./SETUP_FOR_TESTING.sh
```

---

## 📱 **MOBILE/BROWSER TIPS**

### **Best Experience**:

```
Browser: Chrome, Firefox, Safari (modern browsers)
Screen: Desktop (responsive, but desktop is best)
Network: Local only (no internet needed for 95% features!)

Recommended:
├─ Desktop browser (full features)
├─ 1920×1080+ resolution
├─ Multiple tabs (Arena + Builder)
└─ Dev tools open (see console logs)
```

---

## 🎯 **WHAT EACH PAGE DOES**

```
/ (Home)
└─ Overview of system capabilities

/arena
└─ Testing playground
    ├─ 15+ pre-built scenarios
    ├─ Real-time execution
    ├─ Performance benchmarking
    └─ Statistical validation

/agent-builder
└─ Create custom agents
    ├─ Visual designer
    ├─ Tool selection
    ├─ Domain configuration
    └─ One-click deployment

/workflow
└─ Build workflows
    ├─ Multi-step processes
    ├─ Agent orchestration
    └─ Visual flow builder

/feedback-demo
└─ Rate AI strategies
    ├─ Thumbs up/down
    ├─ Quality scoring
    └─ Judge training data
```

---

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Make sure Ollama is running
ollama serve

# 2. (Optional) Set Perplexity key
export PERPLEXITY_API_KEY="pplx-YOUR_KEY_HERE"

# 3. Start server
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo/frontend
npm run dev

# 4. Open browser
# http://localhost:3000/arena          ← Start here!
# http://localhost:3000/agent-builder  ← Or here!
```

**That's it!** Your system is running! 🎉

---

## 🎯 **RECOMMENDED FIRST STEPS**

```
1. Open Arena (5 min)
   http://localhost:3000/arena
   └─ Run "ACE Framework Demo"
   └─ See full system in action!

2. Try Agent Builder (5 min)
   http://localhost:3000/agent-builder
   └─ Create a simple agent
   └─ Test it!

3. Run More Arena Tests (10 min)
   └─ Financial analysis
   └─ Multi-domain
   └─ GEPA evolution

4. Explore Other Features (10 min)
   └─ Workflow builder
   └─ Feedback system
   └─ Dashboard

Total: 30 minutes to explore everything! ✅
```

---

## 📊 **WHAT YOU'LL SEE**

### **Arena Interface**:

```
[Arena Page]

Select Test Scenario:
┌────────────────────────────────────────┐
│ ▼ Choose a scenario...                 │
│   🚀 ACE Framework Integration Demo    │
│   🏦 Financial LoRA Analysis           │
│   🌐 Multi-Domain AI Platform          │
│   ... more ...                         │
└────────────────────────────────────────┘

[Execute Task]

Real-Time Execution:
├─ Step 1: Routing to domain (financial)
├─ Step 2: Loading LoRA adapter
├─ Step 3: Generating query variations (60)
├─ Step 4: GEPA reranking results
├─ Step 5: ACE playbook guidance
└─ Result: Analysis complete! ✅

Performance Metrics:
├─ Accuracy: 92%
├─ Speed: 2.3s
├─ Cost: $0 (Ollama)
└─ vs Baseline: +15% accuracy
```

---

### **Agent Builder Interface**:

```
[Agent Builder Page]

Create Your Agent:
┌────────────────────────────────────────┐
│ Agent Configuration                    │
│                                        │
│ Name: [My Custom Agent]                │
│ Domain: [▼ Financial]                  │
│ Model: [▼ Ollama gemma2:2b]            │
│                                        │
│ Tools:                                 │
│ [✓] Web Search (Perplexity)            │
│ [✓] Calculator                         │
│ [✓] Database Access                    │
│ [ ] Image Analysis                     │
│                                        │
│ Description:                           │
│ [Analyzes financial documents...]      │
│                                        │
│ [Create Agent]                         │
└────────────────────────────────────────┘

Test Your Agent:
┌────────────────────────────────────────┐
│ Query: [What is Q4 revenue?]           │
│ [Execute] [Clear]                      │
│                                        │
│ Result:                                │
│ Based on the data, Q4 revenue is...   │
└────────────────────────────────────────┘
```

---

## 🎯 **STEP-BY-STEP FIRST USE**

### **Complete First-Time Setup**:

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Setup and start server
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo

# Optional: Set Perplexity key
export PERPLEXITY_API_KEY="pplx-YOUR_KEY_HERE"

# Run setup (first time only)
./SETUP_FOR_TESTING.sh

# Start server
cd frontend
npm run dev

# Wait for: "✓ Ready on http://localhost:3000"
```

**Then in browser**:
1. Open http://localhost:3000/arena
2. Select "🚀 ACE Framework Integration Demo"
3. Click "Execute Task"
4. Watch it work! 🎉

---

## 🏟️ **ARENA SCENARIOS EXPLAINED**

### **Beginner-Friendly**:

```
1. "🔥 Crypto Liquidations"
   - Simple real-time data task
   - Good first test
   - Shows web search capability

2. "🏦 Financial LoRA Analysis"
   - Shows domain specialization
   - Compares LoRA methods
   - Educational!

3. "🚀 ACE Framework Demo"
   - Shows EVERYTHING!
   - Best comprehensive demo
   - Impressive! 🏆
```

---

### **Advanced**:

```
4. "🌐 Multi-Domain AI Platform"
   - Shows all 12 domains
   - Domain routing
   - Specialized analysis

5. "🧬 GEPA Evolution"
   - Shows prompt evolution
   - Pareto optimization
   - Self-improvement

6. "🔗 Prompt Chaining"
   - Multi-step workflows
   - Agent coordination
   - Complex tasks
```

---

## 🛠️ **AGENT BUILDER EXPLAINED**

### **What You Can Build**:

```
Simple Agents:
├─ Q&A agent (answers questions)
├─ Search agent (finds information)
├─ Calculator agent (does math)
└─ Use: Quick tasks

Complex Agents:
├─ Financial analyst (multi-step analysis)
├─ Legal reviewer (document processing)
├─ Medical coder (diagnosis to ICD-10)
└─ Use: Professional tasks

Custom Workflows:
├─ Multi-agent collaboration
├─ Sequential processing
├─ Parallel execution
└─ Use: Enterprise processes
```

---

### **Builder Steps**:

```
Step 1: Configuration
├─ Name your agent
├─ Select domain (financial, legal, etc.)
├─ Choose model (Ollama, Perplexity, etc.)
└─ Pick tools (search, calculator, etc.)

Step 2: Capabilities
├─ Describe what it does
├─ Add custom instructions
├─ Set constraints
└─ Configure output format

Step 3: Test
├─ Enter test query
├─ Execute agent
├─ Validate results
└─ Refine if needed

Step 4: Deploy
├─ Save agent configuration
├─ Generate API endpoint
├─ Use in production
└─ Monitor performance
```

---

## 🎯 **QUICK DEMO WALKTHROUGH**

### **5-Minute Arena Demo**:

```
1. Open http://localhost:3000/arena

2. Scroll down to task selector

3. Select: "🚀 ACE Framework Integration Demo"

4. Click "Execute Task" button

5. Watch the execution panel:
   [Executing...]
   ├─ Initializing ACE framework...
   ├─ Loading domain knowledge...
   ├─ Executing multi-agent orchestration...
   ├─ Applying statistical validation...
   └─ Complete!

6. See results:
   ┌────────────────────────────────────┐
   │ ✅ Task completed successfully!    │
   │ Accuracy: 92%                      │
   │ Speed: 2.3s                        │
   │ Cost: $0 (Ollama)                  │
   │ Performance: +15% vs baseline      │
   └────────────────────────────────────┘

Done! You just tested the full system! 🎉
```

---

## 💡 **WHAT TO EXPECT**

### **Arena Execution**:

```
When you run a task in Arena:

1. Task Analysis (1-2s)
   └─ Domain detection
   └─ Tool selection
   └─ Model routing

2. Execution (2-10s)
   └─ Real-time agent reasoning
   └─ Step-by-step logs
   └─ Tool usage shown

3. Results (instant)
   └─ Final answer
   └─ Performance metrics
   └─ Comparison vs baseline

Total: 3-12 seconds per task
Cost: $0 (Ollama local!)
```

---

### **Agent Builder**:

```
When you create an agent:

1. Configuration (1 min)
   └─ Fill in form fields

2. Testing (1 min)
   └─ Enter test query
   └─ See execution
   └─ Validate results

3. Deployment (instant)
   └─ Agent saved
   └─ API endpoint generated
   └─ Ready to use!

Total: 2-3 minutes to custom agent!
```

---

## 🚀 **START NOW!**

```bash
# Copy-paste this entire block:

cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo

# Start Ollama (if not running)
ollama serve &

# Optional: Set Perplexity key
export PERPLEXITY_API_KEY="pplx-YOUR_KEY_HERE"

# Start server
cd frontend
npm install  # First time only
npm run dev

# Wait for: "Ready on http://localhost:3000"
# Then open: http://localhost:3000/arena
```

**That's it!** Your system is running! 🎉

---

## 📖 **FULL DOCUMENTATION**

```
System Overview:
- README.md (main documentation)
- FINAL_COMPREHENSIVE_REPORT.md (test results)

Getting Started:
- START_HERE.txt (quick start)
- HOW_TO_USE_LOCALHOST.md (this file!)

Features:
- 95_PERCENT_SELF_HOSTED.md (architecture)
- COMPREHENSIVE_COMPETITIVE_ANALYSIS.md (vs competitors)

Testing:
- VALIDATION_CHECKLIST.md (how to validate)
- RUN_VALIDATION.sh (automated tests)
```

---

## 🎯 **BOTTOM LINE**

```
╔════════════════════════════════════════════════════════════════════╗
║              HOW TO USE YOUR SYSTEM                                ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Start Server:                                                     ║
║    cd frontend && npm run dev                                      ║
║                                                                    ║
║  Access Points:                                                    ║
║    http://localhost:3000/arena         ← Test here!               ║
║    http://localhost:3000/agent-builder ← Build here!              ║
║                                                                    ║
║  First Test:                                                       ║
║    1. Open /arena                                                  ║
║    2. Select "ACE Framework Demo"                                  ║
║    3. Click "Execute Task"                                         ║
║    4. Watch magic happen! ✨                                       ║
║                                                                    ║
║  Time: 5 minutes                                                   ║
║  Cost: $0                                                          ║
║  Result: See your world-class system in action! 🏆                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

**Ready to start?** Just run: `cd frontend && npm run dev` 🚀

