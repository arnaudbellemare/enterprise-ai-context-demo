# Comprehensive System Test Plan

## Test Scope

Verify all integrated features work together:
1. ✅ Real Ax DSPy with Ollama
2. ✅ GEPA Prompt Optimization
3. ✅ ArcMemo Continuous Learning
4. ✅ Cost-Optimized Routing
5. ✅ Dynamic Agent Routing (NEW)
6. ✅ Agent Builder (Universal Nodes)

---

## Test 1: Agent Builder - Natural Language Workflow Creation

### Test Case:
**Input:** "I want to analyze investment opportunities in commercial real estate"

### Expected Output:
- Workflow generated with relevant nodes
- Hybrid routing selects appropriate agents
- Preview shows workflow structure
- "Build Workflow" button functional

### Verification Points:
- [ ] API call to `/api/agents` succeeds
- [ ] Workflow contains DSPy or specialized nodes
- [ ] Workflow stored in Supabase temp storage
- [ ] Preview displays nodes correctly
- [ ] Cost estimate shown

---

## Test 2: Workflow Execution - All Integrations

### Test Case:
**Execute a 3-node workflow:** Market Research → DSPy Analyst → Report

### Expected Behavior:

#### Before Execution:
- [ ] ArcMemo concept retrieval (🧠)
- [ ] Log: "Retrieving learned concepts from ArcMemo..."
- [ ] Log: "Applied X learned concepts" OR "No prior concepts found"

#### During Node 1 (Market Research):
- [ ] Cost check: "Using Perplexity for web search (cost: ~$0.005)"
- [ ] GEPA optimization: "Optimizing prompt with GEPA..."
- [ ] GEPA result: "GEPA optimization applied (15-30% quality boost)"
- [ ] Execution: API call to `/api/perplexity/chat`
- [ ] Result stored in workflowData
- [ ] Dynamic routing check: "Checking if agent handoff needed..."
- [ ] Routing decision: Either "No handoff needed" OR "HANDOFF: Adding X agent(s)"

#### During Node 2 (DSPy Analyst):
- [ ] Cost check: "Using FREE Ollama (cost: $0.00)"
- [ ] GEPA optimization runs
- [ ] Execution: API call to `/api/ax-dspy`
- [ ] Uses Ollama provider
- [ ] Uses `llama3.1:latest` model
- [ ] Dynamic routing check runs
- [ ] Potential handoff to additional agents

#### During Node 3 (Report):
- [ ] Cost check: "Using FREE Ollama"
- [ ] GEPA optimization runs
- [ ] Execution completes
- [ ] Dynamic routing check runs

#### After Execution:
- [ ] Cost summary: "Total cost: $X.XXX (X free nodes, X paid nodes)"
- [ ] ArcMemo abstraction: "Learning from this execution with ArcMemo..."
- [ ] ArcMemo result: "Learned X new concepts for future use"
- [ ] Results displayed correctly

---

## Test 3: Dynamic Routing - Agent Handoffs

### Test Case:
**Create workflow with complex query that should trigger handoffs**

### Query:
"Analyze $10M multi-family property investment with complex financing structure"

### Expected Behavior:
- [ ] Initial workflow: 3-4 nodes
- [ ] After Market Research: Handoff check detects financial complexity
- [ ] Dynamic agent added: DSPy Financial Analyst
- [ ] After Financial Analysis: Handoff check detects legal needs
- [ ] Dynamic agent added: Legal/Compliance Agent
- [ ] Final execution: 5-6 nodes (2-3 added dynamically)
- [ ] Execution log shows all handoffs with blue highlighting
- [ ] Cost still low (dynamic agents use FREE Ollama)

### Verification:
- [ ] Routing API called after each node
- [ ] Reasoning logged: "Reason: [complexity description]"
- [ ] New nodes visible in UI
- [ ] New nodes execute successfully
- [ ] Total nodes count increases dynamically

---

## Test 4: ArcMemo Learning Cycle

### Test Case:
**Run same workflow twice to verify learning**

#### First Run:
- [ ] Log: "No prior concepts found - will learn from this execution"
- [ ] After execution: "Learned X new concepts"
- [ ] Concepts stored in Supabase `concept_memory` table

#### Second Run (Same workflow):
- [ ] Log: "Applied X learned concepts to improve analysis"
- [ ] Concepts retrieved from Supabase
- [ ] Injected into workflow context
- [ ] After execution: "Learned X new concepts" (refined)

### Verification:
- [ ] First run: `learnedConcepts.length === 0`
- [ ] Second run: `learnedConcepts.length > 0`
- [ ] Supabase query returns concepts
- [ ] Concepts have `domain`, `abstractionLevel`, `successRate`

---

## Test 5: GEPA Optimization

### Test Case:
**Verify GEPA is called for AI nodes**

### Expected for each AI node:
- [ ] API call to `/api/gepa/optimize`
- [ ] Request includes: `prompt`, `context`, `industry`
- [ ] Response includes: `optimizedPrompt`
- [ ] Optimized prompt used in node execution
- [ ] Log: "GEPA optimization applied"

### Verification:
- [ ] Check network tab for `/api/gepa/optimize` calls
- [ ] Verify optimized prompt differs from original
- [ ] Verify optimized prompt used in subsequent API call

---

## Test 6: Cost Optimization

### Test Case:
**Execute workflow with mixed node types**

### Expected Routing:
- [ ] Market Research → Perplexity (PAID - web search required)
- [ ] DSPy nodes → Ollama (FREE)
- [ ] Custom Agents → Ollama (FREE)
- [ ] Answer Generation → Ollama (FREE)

### Cost Summary:
- [ ] Total cost calculated correctly
- [ ] Free node count correct
- [ ] Paid node count correct
- [ ] Log shows individual node costs

### Verification:
- [ ] `totalCost` matches expected (typically $0.005 for 1 Perplexity call)
- [ ] `freeNodes` count matches Ollama nodes
- [ ] `paidNodes` count matches Perplexity nodes

---

## Test 7: Real Ax DSPy Modules

### Test Case:
**Test each DSPy module**

### Modules to Test:
1. [ ] DSPy Market Analyzer
   - Endpoint: `/api/ax-dspy`
   - Config: `moduleName: 'market_research_analyzer'`
   - Provider: `ollama`
   - Model: `llama3.1:latest`

2. [ ] DSPy Real Estate Agent
   - Endpoint: `/api/ax-dspy`
   - Config: `moduleName: 'real_estate_agent'`
   - Provider: `ollama`

3. [ ] DSPy Financial Analyst
   - Endpoint: `/api/ax-dspy`
   - Config: `moduleName: 'financial_analyst'`
   - Provider: `ollama`

4. [ ] DSPy Investment Report
   - Endpoint: `/api/ax-dspy`
   - Config: `moduleName: 'investment_report_generator'`
   - Provider: `ollama`

5. [ ] DSPy Data Synthesizer
   - Endpoint: `/api/ax-dspy`
   - Config: `moduleName: 'data_synthesizer'`
   - Provider: `ollama`

### Verification for Each:
- [ ] No 404 errors
- [ ] Response includes DSPy signature outputs
- [ ] Uses Ollama locally
- [ ] Returns structured data
- [ ] Cost is $0.00

---

## Test 8: UI Visual Indicators

### Test Case:
**Verify execution log color coding**

### Expected Colors:
- [ ] Blue + bold + border: Dynamic routing (🔀 HANDOFF)
- [ ] Purple: Handoff checks (🤔)
- [ ] Green: ArcMemo (🧠 💡)
- [ ] Yellow: GEPA (⚡)
- [ ] Orange: Cost (💰 💸)

### Verification:
- [ ] Inspect DOM elements for correct Tailwind classes
- [ ] Verify visual distinction between event types

---

## Test 9: Error Handling & Resilience

### Test Case:
**Verify system handles failures gracefully**

### Scenarios:
1. [ ] GEPA API fails → Workflow continues
2. [ ] ArcMemo retrieval fails → Workflow continues
3. [ ] Dynamic routing check fails → Workflow continues
4. [ ] Ollama unavailable → Falls back or shows clear error
5. [ ] Supabase unavailable → Uses in-memory fallback

### Expected:
- [ ] All failures log: "⚠️ [Feature] skipped (non-critical)"
- [ ] Workflow execution completes despite failures
- [ ] No unhandled exceptions

---

## Test 10: End-to-End Integration

### Test Case:
**Complete journey from Agent Builder to Results**

### Steps:
1. Open `/agent-builder`
2. Type: "Create a workflow to analyze startup investment opportunities"
3. Click send
4. Verify workflow generation
5. Click "Build Workflow"
6. Verify redirect to `/workflow` with loaded workflow
7. Click "Execute Workflow"
8. Monitor execution log for all events
9. Verify results displayed
10. Navigate to workflow chat
11. Verify results appear in chat context

### Expected Full Flow:
```
Agent Builder:
  User input → Hybrid routing → Workflow generated → Preview shown

Workflow Page:
  Workflow loaded → ArcMemo retrieval → Execute nodes:
    Node 1: Cost check → GEPA → Execute → Routing check
    Node 2: Cost check → GEPA → Execute → Routing check
    [Dynamic nodes added if needed]
  → Cost summary → ArcMemo abstraction → Results displayed

Workflow Chat:
  Results from workflow → Chat context → AI can discuss results
```

---

## Test 11: Performance & Timing

### Test Case:
**Measure overhead of each integration**

### Expected Timings:
- [ ] ArcMemo retrieval: < 500ms
- [ ] GEPA optimization: < 1000ms per node
- [ ] Dynamic routing check: < 300ms per node (keyword) or < 800ms (LLM)
- [ ] Cost calculation: < 10ms
- [ ] ArcMemo abstraction: < 2000ms

### Total Overhead:
- [ ] 3-node workflow: ~3-5 seconds total overhead
- [ ] Acceptable for production use

---

## Test 12: Data Persistence

### Test Case:
**Verify data stored correctly**

### Supabase Tables to Check:

#### `temp_workflows`:
- [ ] Workflow stored when generated
- [ ] Expires after 1 hour
- [ ] Retrieved correctly when loading workflow

#### `concept_memory`:
- [ ] Concepts created after execution
- [ ] Fields populated: `concept`, `domain`, `abstraction_level`, `embedding`
- [ ] `application_count` increments on reuse
- [ ] `success_rate` tracked
- [ ] Vector search works (pgvector)

---

## Critical Paths to Test

### Path 1: Simple Workflow (No Handoffs)
```
User → Agent Builder → Simple query
→ 3-node workflow generated
→ Execute → All optimizations apply → No handoffs
→ Complete in ~30 seconds
→ Cost: $0.005
```

### Path 2: Complex Workflow (WITH Handoffs)
```
User → Agent Builder → Complex query
→ 3-node workflow generated
→ Execute → All optimizations apply
→ Handoff triggered after node 1 → Financial agent added
→ Handoff triggered after node 3 → Legal agent added
→ Complete in ~60 seconds with 5 nodes
→ Cost: $0.005 (still!)
```

### Path 3: Learning Cycle
```
Run 1: New workflow → No concepts → Execute → Learn 3 concepts
Run 2: Same workflow → Retrieve 3 concepts → Execute → Learn 2 new (5 total)
Run 3: Same workflow → Retrieve 5 concepts → Execute → Refine concepts
```

---

## Success Criteria

### Must Pass:
- [ ] All API endpoints return 200 (or graceful error)
- [ ] No unhandled exceptions
- [ ] Build successful
- [ ] All DSPy modules work
- [ ] ArcMemo stores and retrieves concepts
- [ ] GEPA optimization applies
- [ ] Cost tracking accurate
- [ ] Dynamic routing adds agents when appropriate
- [ ] UI displays all events correctly

### Nice to Have:
- [ ] Performance within expected ranges
- [ ] All visual indicators work
- [ ] Supabase integration fully functional
- [ ] Fallbacks work when services unavailable

---

## Test Execution Plan

1. **Manual Testing** (User-driven)
   - Test Agent Builder
   - Test Workflow Execution
   - Monitor logs and network tab

2. **API Testing** (Programmatic)
   - Test each endpoint individually
   - Verify responses match expected schema

3. **Integration Testing**
   - End-to-end scenarios
   - Verify all systems work together

4. **Regression Testing**
   - Verify previous features still work
   - No breaking changes

---

## Test Reporting

For each test:
- [ ] Status: ✅ Pass / ❌ Fail / ⚠️ Partial
- [ ] Evidence: Screenshots, logs, API responses
- [ ] Issues: Any bugs or unexpected behavior
- [ ] Notes: Observations and recommendations

---

## Next Steps After Testing

1. Fix any critical failures
2. Document known issues
3. Optimize performance bottlenecks
4. Add unit tests for critical paths
5. Create demo video showing full system

