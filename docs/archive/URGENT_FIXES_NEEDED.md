# Urgent Fixes Needed

## Issues Reported

### 1. ❌ DSPy Module Error
```
DSPy Financial Analyst
• DSPy module error: {"error":"Cannot read properties of undefined (reading 'type')","success":false}
```

**Root Cause**: 
- File `frontend/lib/dspy-workflows.ts` doesn't exist
- DSPy route imports from non-existent file
- Module classes are undefined when instantiated

**Fix Required**:
Create mock DSPy workflow implementations OR route DSPy calls to real Perplexity API

---

### 2. ❌ Markdown `**` Still Showing
```
DSPy Investment Report Generator showed "**" in output
```

**Root Cause**:
- `stripMarkdown` function exists but not applied to all response paths
- Perplexity API returns markdown-formatted text
- Need to strip markdown from ALL workflow node outputs

**Fix Required**:
Apply `stripMarkdown` consistently across all workflow result displays

---

### 3. ❌ Missing Ollama API Key
```
Answer Generator
• Processing error: {"error":"No LLM provider configured. Set OLLAMA_API_KEY or OPENROUTER_API_KEY"}
```

**Root Cause**:
- Ollama API key not in environment variables
- Answer API checks for keys but doesn't find them

**Fix Applied**: ✅
```bash
OLLAMA_API_KEY=bfb2b3001101489ba2be2aea61ca7901.qJVq5kFmiSAkcf-qHnC6AEy9
```
Added to `frontend/.env.local`

---

## Recommended Solutions

### Option 1: Quick Fix (Mock DSPy)
Replace DSPy API with simple Perplexity proxy:
```typescript
// frontend/app/api/dspy/execute/route.ts
export async function POST(req: NextRequest) {
  const { moduleName, inputs } = await req.json();
  
  // Route to Perplexity instead of DSPy
  const response = await fetch('/api/perplexity/chat', {
    method: 'POST',
    body: JSON.stringify({
      query: inputs.query,
      context: inputs.context,
      useRealAI: true
    })
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    success: true,
    moduleName,
    outputs: data,
    executionTime: 0,
    dspy: { optimized: false }
  });
}
```

### Option 2: Proper Fix (Implement DSPy Classes)
Create actual DSPy workflow classes with proper structure

---

## Next Steps

1. ✅ Ollama API key added
2. ⏳ Fix DSPy module error (in progress)
3. ⏳ Apply stripMarkdown consistently
4. ⏳ Restart dev server
5. ⏳ Test workflow execution

---

## Testing After Fixes

Test workflow: "Analyze investment opportunities in Miami real estate"

Expected:
- ✅ All nodes execute without errors
- ✅ No markdown formatting in outputs (`**`, `##`, etc.)
- ✅ Ollama/Perplexity routing works correctly
- ✅ Final answer generates successfully

