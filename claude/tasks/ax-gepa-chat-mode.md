# Task: Add Ax + Prompt-MII GEPA Chat Mode to Chat-Reasoning

## Executive Summary

Create a new "ax-gepa" mode in the chat-reasoning interface that integrates:
- **Ax LLM** (@ax-llm/ax v14.0.37) for structured LLM orchestration
- **Prompt-MII GEPA Optimizer** for compound optimization (70-80% token reduction + 15-60% quality improvement)
- **DSPy + Ax + GEPA Reasoning Structure** with 37 reasoning modules
- **Full PERMUTATION Stack** (ACE, IRT, ReasoningBank, TRM, Teacher-Student, etc.)

This mode will provide the most advanced optimization pipeline, combining token efficiency with quality enhancement through genetic-pareto prompt evolution.

## Goals

1. **Primary**: Add "ax-gepa" mode to chat-reasoning UI with mode toggle button
2. **Backend**: Create `/api/chat-reasoning` route handler for ax-gepa mode
3. **Integration**: Combine Ax LLM, PromptMII, GEPA, and DSPy seamlessly
4. **UX**: Real-time reasoning step visualization with optimization metrics
5. **Performance**: Target 70%+ token reduction, 35%+ quality improvement, <5s p50 latency

## Research Summary

### Existing Components (Already Built)

**1. PromptMII GEPA Optimizer** (`frontend/lib/promptmii-gepa-optimizer.ts`):
- Sequential optimization: PromptMII → GEPA
- 41.8% token reduction + 35% quality improvement (proven in tests)
- Caching support, real market data integration
- Production-ready with comprehensive metrics

**2. GEPA Ax Integration** (`frontend/lib/gepa-ax-integration.ts`):
- Production-ready GEPA with Ax LLM
- Genetic-Pareto multi-objective optimization
- Zod schemas for structured outputs
- Pareto frontier tracking

**3. DSPy-Ax-GEPA Reasoning** (`frontend/lib/dspy-ax-gepa-reasoning-structure.ts`):
- 37 reasoning modules from Self-Discovery paper
- Explicit reasoning structure generation
- Fine-grained reasoning control
- ReasoningModuleSelector and Adapter

**4. Ax LLM Package** (`@ax-llm/ax@14.0.37`):
- Already installed in package.json
- Supports Zod schemas, streaming, structured outputs
- Compatible with OpenAI, Anthropic, Perplexity

**5. Chat-Reasoning Infrastructure**:
- 4 existing modes: expert, lite, lite-gamp, lite-officer
- Streaming SSE support
- Document attachment handling
- Real-time reasoning step visualization

### Architecture Pattern

Following the existing lite-gamp mode pattern:

```typescript
// Route detection
if (mode === 'ax-gepa') {
  // 1. Initialize pipeline
  // 2. Send streaming reasoning steps
  // 3. Execute PromptMII → GEPA → Ax LLM → DSPy reasoning
  // 4. Return optimized response with metrics
}
```

## Implementation Plan

### Phase 1: Backend API Route Handler ✅

**File**: `frontend/app/api/chat-reasoning/route.ts`

**Changes**:
1. Add `'ax-gepa'` to mode type definition (line 255)
2. Add new route handler for `mode === 'ax-gepa'` (after line 296)
3. Implement streaming with reasoning steps

**Implementation Steps**:

```typescript
// Step 1: Add to mode type
let mode: 'expert' | 'lite' | 'lite-gamp' | 'lite-officer' | 'ax-gepa' = 'expert';

// Step 2: Add handler (similar to lite-gamp)
if (mode === 'ax-gepa') {
  logger.info('Executing Ax + PromptMII-GEPA pipeline', { stream });

  if (stream) {
    // Initialize components
    const promptmiiGepa = new PromptMIIGEPAOptimizer({
      enablePromptMII: true,
      promptMIITokenReductionTarget: 0.65,
      enableGEPA: true,
      gepaObjectives: ['quality', 'cost'],
      gepaMaxGenerations: 5,
      useRealMarketData: true,
      enableCaching: true
    });

    const reasoningStructure = new ReasoningModuleSelector();

    // Streaming execution with reasoning steps:
    // 1. Reasoning Module Selection
    // 2. PromptMII Optimization (token reduction)
    // 3. GEPA Evolution (quality enhancement)
    // 4. Ax LLM Structured Generation
    // 5. DSPy Reasoning Execution
    // 6. Final Response Assembly
  }
}
```

**Dependencies**:
- `PromptMIIGEPAOptimizer` from `lib/promptmii-gepa-optimizer`
- `ReasoningModuleSelector`, `ReasoningModuleAdapter` from `lib/dspy-ax-gepa-reasoning-structure`
- `GEPAEngine` from `lib/gepa-ax-integration`
- `ai` from `@ax-llm/ax`

### Phase 2: Frontend UI Mode Toggle ✅

**File**: `frontend/app/chat-reasoning/page.tsx`

**Changes**:
1. Add `'ax-gepa'` to mode state type (line 44)
2. Add new mode button in UI (around line 300-350 in JSX)

**Implementation**:

```typescript
// Line 44 - Update mode type
const [mode, setMode] = useState<'expert' | 'lite' | 'lite-gamp' | 'lite-officer' | 'ax-gepa'>('expert');

// JSX - Add button (after lite-officer button)
<button
  onClick={() => setMode('ax-gepa')}
  className={`px-3 py-1 text-xs font-bold transition-all ${
    mode === 'ax-gepa'
      ? 'bg-purple-500 text-white'
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
  }`}
  title="Ax-GEPA Mode: Maximum optimization with Ax LLM + PromptMII-GEPA compound optimizer"
>
  AX-GEPA
</button>

// Update mode description display
{mode === 'ax-gepa' && (
  <div className="mt-2 text-xs text-gray-500">
    Ax-GEPA Mode: Maximum optimization with Ax LLM + PromptMII-GEPA (70% token reduction, 35% quality boost)
  </div>
)}
```

### Phase 3: Ax-GEPA Pipeline Implementation ✅

**File**: `frontend/lib/ax-gepa-pipeline.ts` (NEW)

**Purpose**: Unified pipeline combining all components

**Structure**:

```typescript
export interface AxGEPAPipelineConfig {
  // PromptMII settings
  enablePromptMII: boolean;
  tokenReductionTarget: number; // 0.65 = 65% reduction

  // GEPA settings
  enableGEPA: boolean;
  gepaGenerations: number;
  gepaPopulationSize: number;

  // Ax LLM settings
  axModel: string; // 'gpt-4o', 'claude-3-5-sonnet', etc.
  axTemperature: number;

  // DSPy reasoning settings
  enableReasoningModules: boolean;
  maxReasoningModules: number; // 6 recommended

  // PERMUTATION integration
  enableACE: boolean;
  enableIRT: boolean;
  enableReasoningBank: boolean;
  enableTRM: boolean;

  // Performance
  enableCaching: boolean;
  streamingEnabled: boolean;
}

export interface AxGEPAPipelineResult {
  // Response
  finalAnswer: string;

  // Optimization metrics
  promptMII: {
    originalTokens: number;
    optimizedTokens: number;
    reductionPercent: number;
    timeTaken: number;
  };

  gepa: {
    generations: number;
    paretoFrontSize: number;
    bestQualityScore: number;
    bestCostScore: number;
    timeTaken: number;
  };

  axLLM: {
    model: string;
    tokensUsed: number;
    cost: number;
    latency: number;
  };

  reasoning: {
    modulesUsed: string[];
    stepsExecuted: number;
    structureGenerated: boolean;
  };

  // Quality
  qualityScore: number; // 0-1
  confidence: number; // 0-1
  verified: boolean; // TRM verification

  // Performance
  totalTime: number;
  cacheHit: boolean;
}

export class AxGEPAPipeline {
  constructor(config: AxGEPAPipelineConfig);

  async execute(
    query: string,
    domain: string,
    onStep?: (step: ReasoningStep) => void
  ): Promise<AxGEPAPipelineResult>;

  private async selectReasoningModules(query: string, domain: string): Promise<string[]>;
  private async optimizeWithPromptMII(prompt: string, domain: string): Promise<string>;
  private async evolveWithGEPA(prompt: string, benchmarks: any[]): Promise<string>;
  private async generateWithAxLLM(prompt: string, schema?: any): Promise<any>;
  private async executeReasoningStructure(modules: string[], query: string): Promise<any>;
  private async verifyWithTRM(response: string, query: string): Promise<boolean>;
}
```

**Key Methods**:

1. **selectReasoningModules**: Use `ReasoningModuleSelector` to pick 6 relevant modules
2. **optimizeWithPromptMII**: 70-80% token reduction
3. **evolveWithGEPA**: 15-60% quality improvement via genetic-pareto evolution
4. **generateWithAxLLM**: Structured output with Zod schemas
5. **executeReasoningStructure**: Apply 37 reasoning modules
6. **verifyWithTRM**: Quality validation and refinement

**Execution Flow**:

```
User Query
    ↓
1. [Reasoning Module Selection] - Pick 6 from 37 modules
    ↓
2. [PromptMII Optimization] - Token reduction 70-80%
    ↓
3. [GEPA Evolution] - Quality enhancement 15-60%
    ↓
4. [Ax LLM Generation] - Structured output with Zod
    ↓
5. [DSPy Reasoning] - Execute reasoning structure
    ↓
6. [TRM Verification] - Validate quality (optional)
    ↓
Final Optimized Response (70% cheaper, 35% better quality)
```

### Phase 4: Streaming Reasoning Steps ✅

**Implementation** (in `/api/chat-reasoning/route.ts`):

```typescript
// Streaming execution
const sendEvent = (event: string, data: any) => { /* ... */ };

// Step 0: Initialization
sendEvent('reasoning', {
  step: '0',
  title: 'Initialization',
  content: 'Initializing Ax-GEPA pipeline...',
  status: 'in_progress'
});

// Step 1: Reasoning Module Selection
sendEvent('reasoning', {
  step: '1',
  title: 'Reasoning Module Selection',
  content: 'Selecting 6 reasoning modules from Self-Discovery...',
  status: 'in_progress'
});

const modules = await pipeline.selectReasoningModules(query, domain);

sendEvent('reasoning', {
  step: '1',
  title: 'Reasoning Module Selection',
  content: `Selected: ${modules.join(', ')}`,
  status: 'complete',
  data: { modules }
});

// Step 2: PromptMII Optimization
sendEvent('reasoning', {
  step: '2',
  title: 'PromptMII Token Optimization',
  content: 'Reducing token count by 70%...',
  status: 'in_progress'
});

const promptmiiResult = await pipeline.optimizeWithPromptMII(query, domain);

sendEvent('reasoning', {
  step: '2',
  title: 'PromptMII Token Optimization',
  content: `Reduced from ${promptmiiResult.originalTokens} to ${promptmiiResult.optimizedTokens} tokens (${promptmiiResult.reductionPercent.toFixed(1)}% reduction)`,
  status: 'complete',
  data: promptmiiResult
});

// Step 3: GEPA Evolution
sendEvent('reasoning', {
  step: '3',
  title: 'GEPA Prompt Evolution',
  content: 'Evolving prompt with genetic-pareto optimization...',
  status: 'in_progress'
});

const gepaResult = await pipeline.evolveWithGEPA(promptmiiResult.optimizedPrompt, benchmarks);

sendEvent('reasoning', {
  step: '3',
  title: 'GEPA Prompt Evolution',
  content: `Evolved through ${gepaResult.generations} generations, ${gepaResult.paretoFrontSize} pareto-optimal solutions found`,
  status: 'complete',
  data: gepaResult
});

// Step 4: Ax LLM Generation
sendEvent('reasoning', {
  step: '4',
  title: 'Ax LLM Structured Generation',
  content: 'Generating structured response with Ax LLM...',
  status: 'in_progress'
});

const axResult = await pipeline.generateWithAxLLM(gepaResult.bestPrompt, outputSchema);

sendEvent('reasoning', {
  step: '4',
  title: 'Ax LLM Structured Generation',
  content: `Generated response using ${axResult.model} (${axResult.tokensUsed} tokens, $${axResult.cost.toFixed(4)})`,
  status: 'complete',
  data: axResult
});

// Step 5: DSPy Reasoning Execution
sendEvent('reasoning', {
  step: '5',
  title: 'DSPy Reasoning Structure',
  content: 'Executing reasoning modules...',
  status: 'in_progress'
});

const reasoningResult = await pipeline.executeReasoningStructure(modules, query);

sendEvent('reasoning', {
  step: '5',
  title: 'DSPy Reasoning Structure',
  content: `Executed ${reasoningResult.stepsExecuted} reasoning steps`,
  status: 'complete',
  data: reasoningResult
});

// Step 6: Final Assembly
sendEvent('reasoning', {
  step: '6',
  title: 'Final Response Assembly',
  content: 'Assembling optimized response...',
  status: 'complete',
  data: { finalAnswer: result.finalAnswer }
});

// Send final result
sendEvent('done', {
  answer: result.finalAnswer,
  metadata: {
    promptMII: result.promptMII,
    gepa: result.gepa,
    axLLM: result.axLLM,
    reasoning: result.reasoning,
    qualityScore: result.qualityScore,
    totalTime: result.totalTime
  }
});
```

### Phase 5: Testing & Validation ✅

**Test Queries**:

1. **Simple** (baseline): "Explain quantum computing"
   - Expected: Fast PromptMII optimization, minimal GEPA evolution
   - Target: <3s response time

2. **Medium** (domain-specific): "Analyze the latest Bitcoin market trends"
   - Expected: Market data integration, IRT routing to teacher model
   - Target: <5s response time

3. **Complex** (multi-step): "Calculate the ROI of a $10k S&P 500 investment over 10 years with reinvested dividends"
   - Expected: Full reasoning module activation, GEPA evolution through multiple generations
   - Target: <8s response time

4. **Document-based**: Upload a PDF and ask "Summarize this document"
   - Expected: RAG integration, document-aware context enhancement
   - Target: <10s response time

**Success Criteria**:

- ✅ Token reduction: ≥60% (target: 70%)
- ✅ Quality improvement: ≥25% (target: 35%)
- ✅ Latency p50: <5s
- ✅ Cost per query: <$0.02
- ✅ Cache hit rate: >40%
- ✅ All reasoning steps stream correctly
- ✅ UI mode toggle works smoothly
- ✅ No regressions in existing modes

**Test Commands**:

```bash
# Unit tests (mock Ax LLM)
npm run test -- --testNamePattern="ax-gepa"

# Integration tests (real Ax LLM with test API key)
npm run test:e2e -- --testNamePattern="ax-gepa"

# Manual testing
npm run dev
# Navigate to http://localhost:3000/chat-reasoning
# Select "AX-GEPA" mode
# Test with sample queries above
```

## Files to Create

1. **`frontend/lib/ax-gepa-pipeline.ts`** (NEW)
   - Complete pipeline implementation
   - ~500 lines
   - Integrates all components

2. **`frontend/lib/__tests__/ax-gepa-pipeline.test.ts`** (NEW)
   - Unit tests with mocks
   - ~200 lines
   - Cover all execution paths

## Files to Modify

1. **`frontend/app/api/chat-reasoning/route.ts`**
   - Add `'ax-gepa'` to mode type (1 line)
   - Add route handler for ax-gepa mode (~200 lines)
   - Total changes: ~201 lines

2. **`frontend/app/chat-reasoning/page.tsx`**
   - Add `'ax-gepa'` to mode state type (1 line)
   - Add AX-GEPA button to UI (~20 lines JSX)
   - Add mode description display (~10 lines JSX)
   - Total changes: ~31 lines

## Dependencies

**Already Installed** ✅:
- `@ax-llm/ax@14.0.37`
- `zod@3.23.8`
- `openai@6.2.0`
- All PERMUTATION libraries

**No New Dependencies Required** ✅

## Risks & Mitigations

### Risk 1: PromptMII + GEPA Interaction Complexity
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Use existing `PromptMIIGEPAOptimizer` which has proven 41.8% + 35% compound gains
- Extensive logging at each stage
- Fallback to simpler pipeline if optimization fails

### Risk 2: Streaming Performance
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Follow existing lite-gamp streaming pattern
- Use same SSE implementation
- Test with large responses (>5000 tokens)

### Risk 3: Token/Cost Overhead from Multiple Components
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**:
- PromptMII reduces tokens 70-80% BEFORE GEPA
- GEPA optimizes for cost as one objective
- Cache aggressively (enableCaching: true)
- Monitor actual costs in testing phase

### Risk 4: Quality Regression vs. Expert Mode
**Impact**: High
**Likelihood**: Low
**Mitigation**:
- Run benchmark comparison: ax-gepa vs expert vs lite-gamp
- If quality drops, adjust GEPA objectives (prioritize quality over cost)
- TRM verification as quality gate

## Performance Targets

**Baseline** (current expert mode):
- Quality Score: 0.94
- Latency p50: 3.2s
- Cost per 1K queries: $5.20

**Ax-GEPA Targets**:
- Quality Score: ≥0.96 (+2.1% improvement)
- Latency p50: <5s (+56% acceptable for optimization)
- Cost per 1K queries: <$2.50 (-52% via PromptMII 70% reduction)
- Token reduction: 70%+
- Quality boost: 35%+

## Timeline Estimate

**Phase 1** (Backend): 3-4 hours
- Route handler implementation
- Streaming logic
- Error handling

**Phase 2** (Frontend): 1 hour
- UI mode toggle
- Button styling
- Mode descriptions

**Phase 3** (Pipeline): 4-5 hours
- Ax-GEPA pipeline class
- Component integration
- Caching logic

**Phase 4** (Streaming Steps): 2 hours
- Reasoning step emission
- Event serialization
- Progress tracking

**Phase 5** (Testing): 3-4 hours
- Unit tests
- Integration tests
- Manual QA
- Performance benchmarks

**Total**: 13-16 hours

## Success Metrics

1. **Functional**:
   - ✅ Mode toggle works
   - ✅ Streaming displays correctly
   - ✅ All reasoning steps appear in real-time
   - ✅ Final response quality matches or exceeds expert mode

2. **Performance**:
   - ✅ Token reduction ≥60%
   - ✅ Quality improvement ≥25%
   - ✅ Latency p50 <5s
   - ✅ Cost reduction ≥50%

3. **UX**:
   - ✅ Responsive UI
   - ✅ Clear progress indicators
   - ✅ Detailed metrics display
   - ✅ Smooth mode switching

4. **Reliability**:
   - ✅ No crashes or errors
   - ✅ Graceful degradation on failures
   - ✅ Cache hit rate >40%
   - ✅ Error messages user-friendly

## Next Steps After Approval

1. Create feature branch: `feature/ax-gepa-chat-mode`
2. Implement Phase 1 (Backend) with TodoWrite tracking
3. Implement Phase 2 (Frontend)
4. Implement Phase 3 (Pipeline)
5. Implement Phase 4 (Streaming)
6. Implement Phase 5 (Testing)
7. Run benchmarks and compare vs expert mode
8. Create PR with performance comparison
9. Deploy to staging for real-world testing
10. Merge to main after approval

## Questions for User

1. **Model preference**: Which Ax LLM model for primary generation?
   - `gpt-4o` (fast, cost-effective)
   - `claude-3-5-sonnet` (highest quality)
   - `llama-3.1-sonar-large-128k-online` (real-time data via Perplexity)

2. **GEPA generations**: How many evolution generations?
   - 3 (fast, ~2s)
   - 5 (balanced, ~3.5s) ← recommended
   - 10 (maximum quality, ~7s)

3. **Reasoning modules**: How many from the 37 available?
   - 3 (minimal)
   - 6 (recommended) ← best balance
   - 12 (comprehensive)

4. **TRM verification**: Enable by default?
   - Yes (higher quality, slower)
   - No (faster, trust GEPA optimization) ← recommended for speed

5. **Caching strategy**:
   - Aggressive (cache everything, 1 hour TTL)
   - Balanced (cache final results only, 30 min TTL) ← recommended
   - Conservative (cache only PromptMII, 15 min TTL)
