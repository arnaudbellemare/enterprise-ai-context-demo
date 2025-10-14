# ✅ Verified API Endpoints & Pages

## 🌐 Accessible from `localhost:3000`

All endpoints listed below are **confirmed accessible** on your Next.js server.

---

## 📄 Pages (Frontend Routes)

### ✅ Main Application
```
http://localhost:3000/
```
**File:** `frontend/app/page.tsx`
**What it shows:** Main multi-industry AI agent dashboard

### ✅ Visual Workflow Builder
```
http://localhost:3000/workflow
```
**File:** `frontend/app/workflow/page.tsx`
**What it shows:** Basic visual workflow with memory + web search + GEPA

### ✅ Ax DSPy Workflow Builder
```
http://localhost:3000/workflow-ax
```
**File:** `frontend/app/workflow-ax/page.tsx`
**What it shows:** Auto-optimized workflow with Ax DSPy signatures

---

## 🔌 API Endpoints (Next.js Routes)

### Memory System APIs

#### ✅ Add Memory
```
POST http://localhost:3000/api/memories/add
```
**File:** `frontend/app/api/memories/add/route.ts`
```json
{
  "text": "Your content",
  "collection": "my-collection",
  "userId": "user-id"
}
```

#### ✅ Search Memories
```
POST http://localhost:3000/api/memories/search
```
**File:** `frontend/app/api/memories/search/route.ts`
```json
{
  "query": "search query",
  "sources": ["vault"],
  "userId": "user-id",
  "answer": true
}
```

### Search APIs

#### ✅ Indexed Search (Vector)
```
POST http://localhost:3000/api/search/indexed
```
**File:** `frontend/app/api/search/indexed/route.ts`
```json
{
  "query": "AI developments",
  "userId": "user-id",
  "matchThreshold": 0.8
}
```

#### ✅ Unified Search (Hybrid)
```
POST http://localhost:3000/api/search/unified
```
**File:** `frontend/app/api/search/unified/route.ts`
```json
{
  "query": "latest research",
  "sources": ["indexed", "web"],
  "userId": "user-id"
}
```

### AI & Optimization APIs

#### ✅ Multi-Model Answer
```
POST http://localhost:3000/api/answer
GET  http://localhost:3000/api/answer  (list models)
```
**File:** `frontend/app/api/answer/route.ts`
```json
{
  "query": "solve: 2x + 5 = 15",
  "autoSelectModel": true
}
```

#### ✅ GEPA Optimize
```
POST http://localhost:3000/api/gepa/optimize
```
**File:** `frontend/app/api/gepa/optimize/route.ts`
```json
{
  "prompt": "original prompt",
  "context": "context data"
}
```

#### ✅ GEPA DSPy Optimize
```
POST http://localhost:3000/api/gepa-dspy/optimize
```
**File:** `frontend/app/api/gepa-dspy/optimize/route.ts`

#### ✅ Ax Execute
```
POST http://localhost:3000/api/ax/execute
```
**File:** `frontend/app/api/ax/execute/route.ts`
```json
{
  "nodeType": "memorySearch",
  "input": {"query": "...", "userId": "..."}
}
```

#### ✅ Ax Demo
```
POST http://localhost:3000/api/ax-demo
```
**File:** `frontend/app/api/ax-demo/route.ts`

### Data Processing APIs

#### ✅ LangStruct Process
```
POST http://localhost:3000/api/langstruct/process
```
**File:** `frontend/app/api/langstruct/process/route.ts`
```json
{
  "text": "Extract data from this...",
  "useRealLangStruct": true
}
```

#### ✅ Embeddings Generate
```
POST http://localhost:3000/api/embeddings/generate
```
**File:** `frontend/app/api/embeddings/generate/route.ts`
```json
{
  "text": "Generate embedding for this"
}
```

### Live Search APIs

#### ✅ Perplexity Chat
```
POST http://localhost:3000/api/perplexity/chat
```
**File:** `frontend/app/api/perplexity/chat/route.ts`
```json
{
  "messages": [{"role": "user", "content": "search query"}]
}
```

### Agent & Chat APIs

#### ✅ Agent Chat
```
POST http://localhost:3000/api/agent/chat
```
**File:** `frontend/app/api/agent/chat/route.ts`
```json
{
  "messages": [{"role": "user", "content": "your message"}]
}
```

### Collections & Documents

#### ✅ Collections CRUD
```
GET    http://localhost:3000/api/collections?userId=user-id
POST   http://localhost:3000/api/collections
PATCH  http://localhost:3000/api/collections
DELETE http://localhost:3000/api/collections?id=...&userId=...
```
**File:** `frontend/app/api/collections/route.ts`

#### ✅ Document Upload
```
POST http://localhost:3000/api/documents/upload
```
**File:** `frontend/app/api/documents/upload/route.ts`
```
FormData {
  file: File,
  userId: "user-id",
  collection: "my-collection"
}
```

### Context Assembly

#### ✅ Context Assemble
```
POST http://localhost:3000/api/context/assemble
```
**File:** `frontend/app/api/context/assemble/route.ts`
```json
{
  "user_query": "...",
  "conversation_history": [],
  "user_preferences": {}
}
```

---

## ❌ NOT on localhost:3000

These are **backend-only** (Python) or **Supabase Edge Functions**:

### Backend APIs (Python FastAPI)
**NOT accessible unless backend is running separately**
- GraphRAG (Python only)
- Backend GEPA (Python only)
- Real AI Processor (Python only)

**Location:** `backend/app.py`
**Port:** Usually `localhost:8000` (if running)

### Supabase Edge Functions
**NOT on localhost:3000** - These run on Supabase infrastructure:
- `assemble-context` - RAG context assembly
- `ingest-document` - Document processing
- `gepa-optimize` - GEPA optimization (edge function version)
- `perplexity-chat` - Perplexity search (edge function version)

**Access:** Via Supabase client or direct edge function URLs

---

## 🧪 Quick Test Commands

### Test Main Page
```bash
curl http://localhost:3000/
```

### Test Workflow Pages
```bash
curl http://localhost:3000/workflow
curl http://localhost:3000/workflow-ax
```

### Test Memory API
```bash
curl -X POST http://localhost:3000/api/memories/add \
  -H "Content-Type: application/json" \
  -d '{"text": "Test memory", "userId": "test-user"}'
```

### Test Search API
```bash
curl -X POST http://localhost:3000/api/search/indexed \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "userId": "test-user"}'
```

### Test LangStruct
```bash
curl -X POST http://localhost:3000/api/langstruct/process \
  -H "Content-Type: application/json" \
  -d '{"text": "Extract data from this text", "useRealLangStruct": true}'
```

### Test Answer API
```bash
curl -X POST http://localhost:3000/api/answer \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?", "autoSelectModel": true}'
```

### Test Ax Execute
```bash
curl -X POST http://localhost:3000/api/ax/execute \
  -H "Content-Type: application/json" \
  -d '{"nodeType": "memorySearch", "input": {"query": "test", "userId": "user"}}'
```

---

## 📊 Summary

### ✅ ON localhost:3000 (Next.js)
- 3 Pages (/, /workflow, /workflow-ax)
- 16+ API Routes (all in `frontend/app/api/`)
- Full memory system
- Search APIs
- AI/ML APIs
- Workflow APIs

### ❌ NOT on localhost:3000
- Backend Python APIs (need separate server)
- Supabase Edge Functions (run on Supabase)
- GraphRAG (Python backend only)

---

## 🚀 Start Server

```bash
cd frontend
npm run dev
```

Then access:
- **Main App:** http://localhost:3000/
- **Workflow:** http://localhost:3000/workflow
- **Ax Workflow:** http://localhost:3000/workflow-ax

---

## 🔑 Environment Variables Needed

For APIs to work, ensure you have:

```bash
# .env.local in frontend/
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
PERPLEXITY_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

**✅ All listed endpoints are verified and accessible on localhost:3000 when Next.js dev server is running!**

