# 🧠 ArcMemo Integration - Quick Start Guide

## ✅ What's Been Implemented

### 1. **Database Layer** ✅
- `supabase/migrations/005_concept_memory.sql`
- Vector storage with pgvector
- Semantic search function `match_concepts()`
- Automatic cleanup of low-performing concepts

### 2. **API Endpoints** ✅
- `/api/embeddings` - Generate vector embeddings
- `/api/arcmemo` - Abstract, retrieve, update concepts

### 3. **Core Functions** ✅
- `abstractConcepts()` - Extract insights from workflows
- `retrieveRelevantConcepts()` - Semantic + keyword search
- `enrichPromptWithConcepts()` - Inject into prompts
- `updateConceptFeedback()` - Track performance

---

## 🚀 Next Step: Integrate into Workflow Executor

### Add to `frontend/app/workflow/page.tsx`:

```typescript
// At the top of the file, add:
const [learnedConcepts, setLearnedConcepts] = useState<any[]>([]);

// BEFORE workflow execution:
const executeWorkflow = async () => {
  setIsExecuting(true);
  
  // 1. RETRIEVE relevant concepts
  console.log('🧠 Retrieving learned concepts...');
  const conceptsResponse = await fetch('/api/arcmemo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'retrieve',
      query: {
        userRequest: currentWorkflowName,
        domain: detectDomain(currentWorkflowName),
        maxConcepts: 3
      }
    })
  });
  const conceptsData = await conceptsResponse.json();
  const concepts = conceptsData.concepts || [];
  setLearnedConcepts(concepts);
  
  if (concepts.length > 0) {
    add Log(`🧠 Applying ${concepts.length} learned concepts from previous workflows`);
  }
  
  // 2. ENRICH prompts with concepts
  for (const node of sortedNodes) {
    const nodeConfig = nodeConfigs[node.id] || {};
    
    // Inject concepts into system prompt
    if (concepts.length > 0) {
      const conceptText = concepts.map((c, i) => 
        `${i + 1}. ${c.concept} (${(c.successRate * 100).toFixed(0)}% success rate)`
      ).join('\n');
      
      nodeConfig.systemPrompt = `📚 LEARNED INSIGHTS:\n${conceptText}\n\n${nodeConfig.systemPrompt || ''}`;
    }
    
    // ... execute node with enriched config
  }
  
  // 3. After successful execution: ABSTRACT new concepts
  if (workflowSuccess) {
    console.log('🧠 Abstracting new concepts from this workflow...');
    await fetch('/api/arcmemo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'abstract',
        workflow: {
          name: currentWorkflowName,
          domain: detectDomain(currentWorkflowName),
          nodes: nodes,
          results: workflowResults,
          userQuery: currentWorkflowName,
          success: true
        }
      }
    });
    addLog('✅ New insights learned and stored for future workflows');
  }
};

// Helper function to detect domain
function detectDomain(workflowName: string): string {
  const name = workflowName.toLowerCase();
  if (name.includes('real estate') || name.includes('property')) return 'property';
  if (name.includes('finance') || name.includes('investment')) return 'finance';
  if (name.includes('market')) return 'market_research';
  return 'general';
}
```

---

## 🎯 Testing the Integration

### 1. Run Migration
```bash
# In Supabase SQL Editor, run:
supabase/migrations/005_concept_memory.sql
```

### 2. Test Embedding API
```bash
curl http://localhost:3000/api/embeddings \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"Always verify property tax records before valuation"}'
```

### 3. Execute a Workflow
```
1. Go to /workflow
2. Execute "Real Estate Market Analysis"
3. Check logs for: "🧠 Abstracting new concepts..."
4. Execute another real estate workflow
5. Check logs for: "🧠 Applying X learned concepts..."
```

### 4. Verify Concepts Stored
```bash
curl http://localhost:3000/api/arcmemo | jq '.stats'
```

---

## 📊 Expected Results

### First Workflow (No Memory):
```
[Workflow: Miami Real Estate]
🧠 Retrieving learned concepts...
✅ Retrieved 0 concepts (no memory yet)
▶ Executing workflow normally...
✅ Workflow completed
🧠 Abstracting new concepts...
✅ Stored 3 concepts:
   - "Always verify property tax records before valuation"
   - "Cross-reference MLS with county records"
   - "Check HOA fees for luxury properties"
```

### Second Workflow (With Memory!):
```
[Workflow: Austin Real Estate]
🧠 Retrieving learned concepts...
✅ Retrieved 3 relevant concepts (94% similarity)
📚 LEARNED INSIGHTS applied to workflow:
   1. Always verify property tax records before valuation (100% success rate)
   2. Cross-reference MLS with county records (100% success rate)
   3. Check HOA fees for luxury properties (100% success rate)
▶ Executing workflow with learned insights...
✅ Workflow completed (IMPROVED by concepts!)
🧠 Abstracting new concepts...
✅ Stored 2 new concepts
```

---

## 🔥 Benefits You'll See

1. **Performance**: 7.5%+ improvement (from paper)
2. **Quality**: Workflows learn from mistakes
3. **Efficiency**: Reuse successful patterns
4. **Scalability**: Memory grows with experience

---

## 📋 Integration Checklist

- [x] Database schema created
- [x] Embedding API implemented
- [x] ArcMemo API implemented
- [ ] Integrated into workflow executor
- [ ] Test with multiple workflows
- [ ] Monitor concept performance
- [ ] Add UI display

---

## 🎨 Optional: Add Memory Display to UI

```typescript
// Add to workflow page sidebar:
{learnedConcepts.length > 0 && (
  <Card>
    <CardHeader>🧠 Learned Insights</CardHeader>
    <CardContent>
      {learnedConcepts.map((concept, i) => (
        <div key={i} className="mb-2 p-2 bg-purple-50 rounded">
          <div className="text-sm font-medium">{concept.concept}</div>
          <div className="text-xs text-gray-600">
            {(concept.successRate * 100).toFixed(0)}% success rate • 
            Used {concept.applicationCount} times
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

---

## 🚀 You're Ready!

The foundation is complete. Just add the integration code to your workflow executor and watch your system learn from experience! 🎉
