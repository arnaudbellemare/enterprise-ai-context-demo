# Task: SRL + nanoEBM Integration with ElizaOS Patterns

**Created**: 2025-10-31
**Status**: Step 1 - Research Complete ✅
**Next**: Waiting for baseline test results (est. 10-15 min)

## Overview

Integrate SRL (Supervised Reinforcement Learning) and nanoEBM (Energy-Based Model) refinement into PERMUTATION using ElizaOS architectural patterns for clean, maintainable, testable agent-based integration.

## Phase 1: Research Findings ✅

### Current System Architecture

**Test File**: `test-comparative-srl-ebm.ts`

**Testing 4 Approaches:**
1. **Current System**: SWiRL + TRM + GEPA (baseline)
2. **SRL-Enhanced**: SWiRL + Step-wise Supervision
3. **nanoEBM-Enhanced**: Energy-Based Refinement
4. **Combined**: SRL + nanoEBM

**Test Queries** (7 total across 3 categories):
- **Multi-Step** (3): Financial ROI calculation, legal analysis, scientific experiment design
- **Verification** (2): Insurance policy lookup, financial calculation verification
- **Refinement** (2): Market trend analysis, email copywriting

**Metrics Tracked**:
- Accuracy, Faithfulness, Completeness
- Latency, Cost, Iterations, Convergence

### SRL Implementation Analysis

**File**: `frontend/lib/srl/swirl-srl-enhancer.ts`

**Key Components**:

```typescript
interface SWiRLSRLEnhancer {
  enhanceWithSRL(): Promise<SRLEnhancedDecomposition>
  findBestExpertTrajectory(): ExpertTrajectory | null
  computeStepReward(): number
  generateInternalReasoning(): Promise<string>
  calculateSRLLoss(): number
  executeWithSRL(): Promise<SRLEnhancedDecomposition>
}
```

**Architecture**:
- Uses expert trajectories for step-wise supervision
- Computes similarity-based rewards (action, tool, reasoning, type)
- Generates internal reasoning monologues
- Enhances SWiRL steps with expert guidance

**Strengths**:
- ✅ Well-structured interfaces
- ✅ Modular design (enhancer wraps decomposer)
- ✅ Expert trajectory system for learning
- ✅ Step-wise reward computation
- ✅ Jaccard similarity for matching

**Weaknesses / ElizaOS Integration Opportunities**:
- ❌ No clear separation of concerns (mixing logic)
- ❌ Hard-coded similarity thresholds
- ❌ No provider pattern for expert trajectories
- ❌ No service pattern for LLM calls
- ❌ No evaluator pattern for quality checking
- ❌ Limited error handling
- ❌ No action chaining support

**Expert Trajectories**: `frontend/lib/srl/expert-trajectories.ts`
- 2 expert trajectories (financial, legal)
- 4-6 steps each with detailed reasoning
- Quality scores: 0.9, 0.85

### nanoEBM Implementation Analysis

**File**: `frontend/lib/ebm/answer-refiner-simple.ts`

**Key Components**:

```typescript
class SimpleEBMAnswerRefiner {
  refine(query, context, initialAnswer): Promise<EBMRefinementResult>
  computeEnergy(query, context, answer): number
  generateRefinementSuggestions(query, context, answer): string[]
  applySuggestion(answer, suggestion): string
}
```

**Architecture**:
- Iterative refinement using energy minimization
- Energy function based on relevance, faithfulness, completeness
- Text-based suggestions (not embedding-based)
- Early stopping on convergence

**Energy Function**:
```
E = relevanceEnergy * 0.4 + faithfulnessEnergy * 0.4 + completenessEnergy * 0.2

relevanceEnergy = 1 - (query-answer overlap)
faithfulnessEnergy = 1 - (context-answer overlap)
completenessEnergy = 1 - (length + structure score)
```

**Strengths**:
- ✅ Simple, understandable energy function
- ✅ Convergence detection
- ✅ No TensorFlow dependency (easier to test)
- ✅ Modular refinement suggestions

**Weaknesses / ElizaOS Integration Opportunities**:
- ❌ No action pattern for refinement steps
- ❌ No provider pattern for context injection
- ❌ No evaluator pattern for energy calculation
- ❌ Suggestions are hard-coded (should be configurable)
- ❌ No memory of successful refinements
- ❌ Limited to text-based improvements

### Integration Points with PERMUTATION

**Current Usage** (from test file):

```typescript
// SRL: Wraps SWiRL decomposer
const srlEnhancer = new SWiRLSRLEnhancer({ expertTrajectories, ... });
const enhanced = await srlEnhancer.executeWithSRL(query, domain, tools, decomposer);

// EBM: Refines final answer
const ebmRefiner = new EBMAnswerRefiner({ refinementSteps: 3, ... });
const result = await ebmRefiner.refine(query, context, initialAnswer);

// Combined: SRL decomposition → Execute → EBM refinement
```

**PERMUTATION Components**:
- ✅ **PermutationEngine**: Main orchestrator (`frontend/lib/permutation-engine.ts`)
- ✅ **SWiRL**: Decomposition (`frontend/lib/swirl-decomposer.ts`)
- ✅ **TRM**: Verification (`frontend/lib/trm.ts`)
- ✅ **GEPA**: Prompt optimization (`frontend/lib/gepa-algorithms.ts`)
- ✅ **ACE**: Context engineering (`frontend/lib/ace-framework.ts`)
- ✅ **IRT**: Routing (`frontend/lib/irt-calculator.ts`)
- ✅ **ReasoningBank**: Memory (`frontend/lib/reasoning-bank.ts`)

## ElizaOS Architecture Mapping

### SRL → ElizaOS Components

| SRL Component | ElizaOS Pattern | Integration Approach |
|---------------|-----------------|----------------------|
| Expert Trajectories | **Provider** | Dynamic provider fetches expert steps based on domain/query |
| Step Reward Calculation | **Evaluator** | Post-step evaluator computes similarity scores |
| Reasoning Generation | **Action** | Action generates internal reasoning monologue |
| SRL Enhancement | **Service** | Long-running service manages expert trajectory DB |
| Trajectory Execution | **Action Chain** | Multi-step action execution with context passing |

### nanoEBM → ElizaOS Components

| EBM Component | ElizaOS Pattern | Integration Approach |
|---------------|-----------------|----------------------|
| Energy Calculation | **Evaluator** | Evaluator computes energy after each refinement |
| Refinement Suggestions | **Provider** | Provider suggests improvements based on energy |
| Refinement Application | **Action** | Action applies specific refinement |
| Convergence Detection | **Evaluator** | Evaluator triggers stop when converged |
| Refinement Loop | **Action Chain** | Iterative action chain until convergence |

### Combined Architecture

```
User Query
    ↓
IRT Routing (existing)
    ↓
ACE Playbook Provider (existing)
    ↓
SRL Expert Provider (NEW) ← Fetches expert trajectories
    ↓
SWiRL Decomposition Action (existing)
    ↓
SRL Enhancement Action (NEW) ← Adds step-wise supervision
    ↓
Step Execution Chain (existing)
    ↓
SRL Reward Evaluator (NEW) ← Computes step similarity
    ↓
Initial Answer
    ↓
EBM Refinement Action Chain (NEW) ← Iterative energy minimization
    ↓
EBM Energy Evaluator (NEW) ← Checks convergence
    ↓
Final Answer
    ↓
TRM Verification (existing)
```

## File Organization

**Existing Files** (No changes needed):
```
frontend/lib/
├── permutation-engine.ts        # Main orchestrator
├── swirl-decomposer.ts          # SWiRL decomposition
├── trm.ts                       # TRM verification
├── gepa-algorithms.ts           # GEPA optimization
├── ace-framework.ts             # ACE context
├── irt-calculator.ts            # IRT routing
└── reasoning-bank.ts            # Memory
```

**SRL Files** (Enhance with ElizaOS):
```
frontend/lib/srl/
├── swirl-srl-enhancer.ts        # REFACTOR → ElizaOS patterns
├── expert-trajectories.ts       # ENHANCE → Provider pattern
└── srl-actions.ts               # NEW: SRL action definitions
└── srl-providers.ts             # NEW: Expert trajectory provider
└── srl-evaluators.ts            # NEW: Step reward evaluators
└── srl-service.ts               # NEW: Expert trajectory service
```

**EBM Files** (Enhance with ElizaOS):
```
frontend/lib/ebm/
├── answer-refiner-simple.ts     # REFACTOR → ElizaOS patterns
├── ebm-actions.ts               # NEW: Refinement actions
├── ebm-providers.ts             # NEW: Suggestion providers
├── ebm-evaluators.ts            # NEW: Energy evaluators
└── ebm-service.ts               # NEW: Energy calculation service
```

**Plugin Structure** (NEW):
```
frontend/lib/eliza/
├── srl-plugin.ts                # SRL as ElizaOS plugin
├── ebm-plugin.ts                # EBM as ElizaOS plugin
└── combined-plugin.ts           # SRL + EBM combined plugin
```

## Dependencies

**Existing**:
- `@elizaos/core` types (if using full ElizaOS) - OR -
- Just implement patterns (no package needed)

**Current PERMUTATION Dependencies**:
- Next.js, React, TypeScript
- Supabase (database, storage)
- Ollama, Perplexity (LLM providers)
- Ax LLM (DSPy integration)

**No New Dependencies Needed** for ElizaOS patterns!

## Baseline Test Status

**Running**: Process ID 1797
**Started**: 2025-10-31 01:09AM
**Expected Duration**: 10-15 minutes
**Test Queries**: 7 queries across 3 categories
**Approaches**: Current, SRL, EBM, Combined

**Monitoring Command**:
```bash
ps aux | grep test-comparative | grep -v grep
```

## Next Steps (After Baseline Completes)

Following **ElizaOS Standard Workflow**:

### Step 2: Write Detailed PRD
- [ ] Analyze baseline test results
- [ ] Identify performance gaps by category (multi-step, verification, refinement)
- [ ] Define success criteria for SRL integration
- [ ] Define success criteria for nanoEBM integration
- [ ] Document real-world scenarios and UX improvements
- [ ] Specify performance requirements (latency, accuracy, cost)

### Step 3: Create Implementation Plan (3+ Approaches)
- [ ] **Approach 1**: Full ElizaOS integration (Actions, Providers, Evaluators, Services, Plugins)
- [ ] **Approach 2**: Hybrid (ElizaOS patterns without package dependency)
- [ ] **Approach 3**: Minimal refactor (just clean up existing code with better structure)
- [ ] Evaluate each approach (strengths, weaknesses, risks, complexity, performance)
- [ ] Select optimal approach

### Step 4: Implementation (Production Code Only)
- [ ] Implement selected approach
- [ ] Write unit tests (mocked runtime for ElizaOS patterns)
- [ ] Write E2E tests (real runtime)
- [ ] Document all changes

### Step 5: Testing
- [ ] Run new comparative tests
- [ ] Benchmark vs baseline
- [ ] Ensure all tests pass
- [ ] Verify performance targets met

### Step 6: Critical Review & Iteration
- [ ] Review implementation for issues
- [ ] Iterate until production-ready
- [ ] Final performance validation

## Research Insights

### What Works Well

1. **SRL for Multi-Step Reasoning**:
   - Expert trajectories provide clear supervision
   - Step-wise rewards guide decomposition
   - Internal reasoning enhances interpretability

2. **nanoEBM for Refinement**:
   - Energy-based optimization is intuitive
   - Convergence detection prevents over-refinement
   - Works well for verification and refinement tasks

3. **Combined Approach**:
   - SRL handles decomposition + supervision
   - EBM handles final answer refinement
   - Complementary strengths

### Potential Issues

1. **Expert Trajectory Coverage**:
   - Only 2 expert trajectories currently
   - Need more domains (science, marketing, etc.)
   - Quality of trajectories critical

2. **Simplified Energy Function**:
   - Text overlap is crude approximation
   - Could benefit from embedding similarity
   - Hard-coded weights (0.4, 0.4, 0.2)

3. **Performance Overhead**:
   - SRL adds processing time (trajectory matching, reward calculation)
   - EBM adds refinement iterations (3 steps default)
   - Combined approach could be slow

4. **Testing Complexity**:
   - 4 approaches × 7 queries = 28 test runs
   - Each run can take minutes (timeout: 1-5 min per query)
   - Total test time: 10-15 minutes for baseline alone

## Open Questions

1. **ElizaOS Integration Level?**
   - Full package integration vs pattern-only?
   - How much refactoring is acceptable?
   - Performance impact of abstraction layers?

2. **Expert Trajectory Storage?**
   - Store in Supabase or file system?
   - How to curate and improve over time?
   - User-contributed trajectories?

3. **Energy Function Design?**
   - Keep simple or use embeddings?
   - Domain-specific energy functions?
   - Learned energy functions?

4. **Testing Strategy?**
   - Keep comparative test structure?
   - Add ElizaOS-specific tests?
   - How to test action chains?

## Baseline Test Output (Monitoring)

```bash
# Check test progress
tail -f test-comparative-srl-ebm.log

# Check if still running
ps aux | grep test-comparative

# Expected output format:
# 🔬 COMPARATIVE TEST: SRL vs nanoEBM vs Current System
# 🎯 Phase 1: BASELINE TESTING (Current System Only)
# Testing 7 queries to establish baseline performance
#
# Query 1/7: msr-1
#   Category: multi_step
#   Complexity: very_high
#   1️⃣  Testing Current System...
#   2️⃣  Testing SRL-Enhanced...
#   3️⃣  Testing nanoEBM-Enhanced...
#   4️⃣  Testing Combined...
#
# ... (continues for all 7 queries)
#
# 📊 COMPARATIVE TEST REPORT
# (Results summary)
```

## Implementation Readiness

**Status**: READY for Step 2 (PRD) after baseline completes

**Research Complete**: ✅
- Codebase structure understood
- Integration points identified
- ElizaOS mapping designed
- File organization planned
- Dependencies assessed

**Awaiting**:
- [ ] Baseline test results
- [ ] Performance metrics by category
- [ ] Winner analysis by approach

**Estimated Timeline**:
- Research: ✅ Complete (30 min)
- Baseline Test: 🔄 Running (10-15 min remaining)
- PRD Writing: ⏳ Pending (30-60 min)
- Implementation Plan: ⏳ Pending (1-2 hours)
- Implementation: ⏳ Pending (3-5 hours)
- Testing: ⏳ Pending (1-2 hours)
- Review: ⏳ Pending (1 hour)

**Total Estimated**: 7-11 hours for complete integration

---

## Notes for Next Engineer

### Key Decisions Made

1. **ElizaOS Integration**: Decided to use patterns (not full package) for flexibility
2. **File Organization**: Keep existing structure, add ElizaOS wrappers in `frontend/lib/eliza/`
3. **Testing Approach**: Extend existing comparative test with ElizaOS validation

### Important Context

- This is a research-grade system implementing academic papers
- Performance benchmarks are critical (accuracy > 0.9, latency < 4s, cost < $6/1K queries)
- Code should match ElizaOS workflow (no stubs, production-ready, full tests)
- Expert trajectories are the key to SRL success (need more domains)

### Blockers to Watch For

1. **Baseline Test Failures**: If test timeout or errors, may need to adjust complexity settings
2. **Expert Trajectory Coverage**: Limited to 2 domains currently, will affect SRL results
3. **Ollama Timeout**: Baseline skips student model to avoid timeouts, may affect cost analysis
4. **Energy Function**: Simplified version may not show significant improvements

### Resources

- [ELIZA_INTEGRATION.md](~/.claude/ELIZA_INTEGRATION.md) - ElizaOS architecture mapping
- [ELIZA_RULES.md](~/.claude/ELIZA_RULES.md) - Development workflow
- [MCP_ElizaOS.md](~/.claude/MCP_ElizaOS.md) - Component usage patterns
- [CLAUDE.md](./CLAUDE.md) - PERMUTATION architecture

---

**Last Updated**: 2025-10-31 01:10AM
**Next Update**: After baseline test completes (est. 01:20-01:25AM)
