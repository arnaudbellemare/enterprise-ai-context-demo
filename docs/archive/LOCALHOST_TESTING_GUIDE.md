# 🚀 Testing Your Complete System on localhost:3000

**Everything works on localhost:3000!** Here's how to test all your new features.

---

## 🏃 **STEP 1: Start the Dev Server**

```bash
# Terminal 1: Start Next.js dev server
cd frontend
npm run dev

# Server starts at: http://localhost:3000
# Wait for: "Ready in X ms"
```

---

## 🧪 **STEP 2: Test All Features**

### **A. Test Core System (Existing)**

```bash
# In browser:
http://localhost:3000

# Or test via API:
curl http://localhost:3000/api/ax-dspy/execute \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"task":"Extract revenue from this text: Q4 revenue was $3.9M"}'

# Should return: DSPy module execution result
```

---

### **B. Test Multimodal Features (NEW!)**

#### **1. Video Analysis**

```bash
curl http://localhost:3000/api/multimodal/analyze-video \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"video_url":"https://example.com/earnings-q4.mp4"}'

# Returns:
# {
#   "summary": "Strong quarterly performance...",
#   "keyMoments": [...],
#   "visualElements": [...],
#   "transcript": "...",
#   "insights": [...]
# }
```

#### **2. Audio Analysis**

```bash
curl http://localhost:3000/api/multimodal/analyze-audio \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"audio_url":"https://example.com/podcast.mp3"}'

# Returns:
# {
#   "transcript": "...",
#   "summary": "...",
#   "keyPoints": [...],
#   "speakers": [...],
#   "actionItems": [...]
# }
```

#### **3. Image Analysis**

```bash
curl http://localhost:3000/api/multimodal/analyze-image \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://example.com/chart.png"}'

# Returns:
# {
#   "description": "Financial chart showing...",
#   "type": "chart",
#   "extractedData": {...},
#   "insights": [...]
# }
```

#### **4. PDF with Images**

```bash
curl http://localhost:3000/api/multimodal/analyze-pdf \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"pdf_url":"https://example.com/report.pdf"}'

# Returns:
# {
#   "text": "...",
#   "images": [...],
#   "structured": {...},
#   "insights": [...]
# }
```

---

### **C. Test Smart Model Routing (NEW!)**

```bash
curl http://localhost:3000/api/model-router \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"task":"Analyze this complex financial derivative"}'

# Returns:
# {
#   "model": "claude-sonnet-4",
#   "reason": "Very challenging task requires best reasoning",
#   "estimatedCost": 0.002,
#   "estimatedQuality": 0.95
# }

# Try different tasks:
curl http://localhost:3000/api/model-router \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"task":"Reverse a string"}'

# Returns: "ollama/gemma3:4b" (free model for easy task!)
```

---

### **D. Test Collaborative Tools (NEW!)**

#### **1. Articulation**

```bash
curl http://localhost:3000/api/articulation/store \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id":"agent-1",
    "task_id":"task-1",
    "team_id":"team-1",
    "type":"stuck",
    "thought":"Having trouble with bowling edge case"
  }'

# Returns: { "success": true, "articulation": {...} }
```

#### **2. Social A2A**

```bash
curl http://localhost:3000/api/a2a/social/post \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id":"agent-1",
    "team_id":"team-1",
    "type":"question",
    "message":"Anyone dealt with zebra puzzle constraints?"
  }'

# Returns: { "success": true, "post": {...} }
```

#### **3. Team Memory**

```bash
curl http://localhost:3000/api/team-memory/store \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "team_id":"team-1",
    "type":"solution",
    "problem":"Bowling score calculation",
    "content":"Use lookahead for bonus calculation"
  }'

# Returns: { "success": true, "knowledge": {...} }
```

---

### **E. Test Visual Debugger (NEW!)**

```bash
# In browser, visit:
http://localhost:3000/arena/debug

# Or if you want to add it to your Arena:
http://localhost:3000/arena

# Shows:
# - Execution timeline (left column)
# - Tool usage (middle column)
# - Performance metrics (right column)
```

---

## 🧪 **STEP 3: Run Test Suites**

```bash
# Make sure dev server is running on localhost:3000
# Then in another terminal:

cd /path/to/enterprise-ai-context-demo

# Test multimodal features
npm run test:multimodal

# Test collaborative tools
npm run test:collaborative

# Test performance
npm run test:performance

# Test per-domain GEPA
npm run test:per-domain

# Full system demo
npm run demo:full-system

# All show: Features work, APIs callable, system integrated
```

---

## 🌐 **AVAILABLE ENDPOINTS ON localhost:3000**

### **Core System (Existing):**
```
POST /api/ax-dspy/execute              - DSPy module execution
POST /api/gepa/optimize                - GEPA optimization
POST /api/entities/extract             - Entity extraction
POST /api/smart-extract                - Smart extraction
POST /api/perplexity/search            - Perplexity search
GET  /api/arcmemo/reasoning-bank       - ReasoningBank
POST /api/a2a/communicate              - A2A communication
```

### **Collaborative Tools (NEW!):**
```
POST /api/articulation/store           - Store articulation
POST /api/articulation/search          - Search articulations
POST /api/a2a/social/post              - Post to team
POST /api/a2a/social/search            - Search team posts
POST /api/team-memory/store            - Store team knowledge
POST /api/team-memory/search           - Search team knowledge
```

### **Multimodal Features (NEW!):**
```
POST /api/multimodal/analyze-video     - Analyze video
POST /api/multimodal/analyze-audio     - Analyze audio
POST /api/multimodal/analyze-image     - Analyze image
POST /api/multimodal/analyze-pdf       - Analyze PDF
POST /api/model-router                 - Smart model selection
```

---

## 📱 **WEB INTERFACE**

```bash
# Main application
http://localhost:3000

# Arena (benchmarking)
http://localhost:3000/arena

# Visual Debugger (NEW!)
http://localhost:3000/arena/debug

# Agent Builder
http://localhost:3000/agent-builder-v2

# Workflow Builder
http://localhost:3000/workflows
```

---

## ✅ **QUICK VERIFICATION**

```bash
# 1. Start server
cd frontend && npm run dev

# 2. In another terminal, test an endpoint:
curl http://localhost:3000/api/multimodal/analyze-image \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"image_url":"test.png"}' | jq

# 3. Should return JSON with:
# {
#   "description": "...",
#   "type": "chart",
#   "extractedData": {...},
#   "insights": [...]
# }

# If it works: ✅ Everything is live!
```

---

## 🎯 **WHAT'S READY TO USE**

```
On localhost:3000 you have:

✅ All 43 DSPy modules
✅ GEPA optimization (20 iterations)
✅ LoRA fine-tuning integration
✅ ReasoningBank + ArcMemo
✅ A2A communication (structured + social)
✅ IRT evaluation
✅ OCR integration

NEW TODAY:
✅ Collaborative tools (5 features)
✅ Multimodal analysis (4 types)
✅ Smart model routing
✅ Visual debugger

All accessible via:
• REST APIs (curl/fetch)
• Web interface (browser)
• Test suites (npm run test:*)
```

---

## 🚀 **USAGE EXAMPLES**

### **From JavaScript/TypeScript:**

```typescript
// Import in your code
import { analyzeVideo, analyzeImage } from './frontend/lib/multimodal-analysis';
import { executeWithSmartRouting } from './frontend/lib/smart-model-router';
import { thinkOutLoud, postToTeam } from './frontend/lib/...';

// Use directly
const videoInsights = await analyzeVideo('earnings-call.mp4');
const chartData = await analyzeImage('revenue-chart.png');
const result = await executeWithSmartRouting(task);
await thinkOutLoud('agent-1', 'Stuck on edge case');
```

### **From Browser Console:**

```javascript
// Open http://localhost:3000 and in console:

// Test multimodal
fetch('/api/multimodal/analyze-image', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({image_url: 'test.png'})
}).then(r => r.json()).then(console.log);

// Test routing
fetch('/api/model-router', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({task: 'Complex analysis'})
}).then(r => r.json()).then(console.log);
```

---

## ✅ **YES, EVERYTHING WORKS ON localhost:3000!**

```
╔════════════════════════════════════════════════════════════════════╗
║         ALL FEATURES AVAILABLE ON localhost:3000 ✅                ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Start server: cd frontend && npm run dev                          ║
║  Access at: http://localhost:3000                                  ║
║                                                                    ║
║  Available:                                                        ║
║    ✅ All 43 DSPy modules                                          ║
║    ✅ GEPA optimization                                            ║
║    ✅ Collaborative tools (5 features)                             ║
║    ✅ Multimodal analysis (4 types)                                ║
║    ✅ Smart model routing                                          ║
║    ✅ Visual debugger                                              ║
║    ✅ All existing features                                        ║
║                                                                    ║
║  Test with:                                                        ║
║    • Browser (web interface)                                       ║
║    • curl (API calls)                                              ║
║    • npm run test:* (test suites)                                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**Just run `cd frontend && npm run dev` and everything is live on localhost:3000!** 🚀
