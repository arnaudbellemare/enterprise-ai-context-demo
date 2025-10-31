# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Requirements

### Before Starting Work

**ALWAYS start in plan mode to make a plan.**

1. **Create a detailed plan** that includes:
   - Implementation steps broken down into tasks
   - Reasoning behind architectural decisions
   - External dependencies or packages needed
   - **Think MVP** - don't over-plan

2. **Research when needed**:
   - If the task requires external knowledge or specific packages, use the Task tool for research
   - Get latest documentation and best practices
   - Verify package compatibility

3. **Document the plan**:
   - Write the plan to `claude/tasks/TASK_NAME.md`
   - Use a descriptive TASK_NAME (e.g., `brain-skills-migration.md`, `add-caching-system.md`)

4. **Get approval**:
   - Ask the user to review the plan
   - **Do NOT continue until the plan is approved**

### While Implementing

1. **Update the plan as you work**:
   - Mark completed tasks with ✅
   - Update tasks that change during implementation
   - Add new tasks if discovered during work

2. **Document changes thoroughly**:
   - After completing each task, append detailed descriptions to the plan
   - Include file paths, line numbers, and what was changed
   - Explain why changes were made (for handover to other engineers)
   - Note any blockers, workarounds, or technical decisions

3. **Example plan structure**:
   ```markdown
   # Task: [Name]

   ## Plan
   - [ ] Task 1: Description
   - [ ] Task 2: Description

   ## Implementation Log

   ### Task 1: [Name] ✅
   **Files Changed:**
   - `path/to/file.ts:123-145` - Added feature X
   - `path/to/other.ts:50` - Updated import

   **Changes:**
   - Implemented Y because Z
   - Used package A instead of B due to compatibility

   **Next Engineer Notes:**
   - Important: Feature X depends on ENV_VAR being set
   - Known issue: Edge case with null values (see TODO)
   ```

## Project Overview

PERMUTATION is an advanced AI research stack that integrates multiple cutting-edge research frameworks into a unified execution engine. It combines ACE (Agentic Context Engineering), GEPA (Genetic-Pareto optimization), DSPy (programmatic LLM composition), IRT (Item Response Theory routing), LoRA adaptation, and ReasoningBank memory systems.

**Key Philosophy**: This is a research-grade system that prioritizes quality, optimization, and real-world benchmarking over simplicity. Code implements actual academic research papers, not simplified versions.

## ElizaOS Integration

PERMUTATION can be enhanced with [ElizaOS](https://github.com/elizaOS/eliza) agent framework patterns. ElizaOS provides:
- **Actions**: Structured tool definitions and multi-step workflows
- **Providers**: Dynamic context injection (maps to ACE playbooks)
- **Services**: Long-running integrations (Perplexity, Ollama, Supabase)
- **Evaluators**: Post-response quality validation (TRM verification)
- **Memory**: Persistent conversation history (complements ReasoningBank)
- **Plugins**: Modular capability packaging

**Integration Guides:**
- [ELIZA_INTEGRATION.md](~/.claude/ELIZA_INTEGRATION.md) - Architecture mapping and patterns
- [ELIZA_RULES.md](~/.claude/ELIZA_RULES.md) - Development workflow from ElizaOS
- [MCP_ElizaOS.md](~/.claude/MCP_ElizaOS.md) - ElizaOS component usage patterns

**Key Mappings:**
- PERMUTATION Tools → Eliza Actions
- ACE Playbook Bullets → Eliza Providers
- External APIs (Perplexity, Ollama) → Eliza Services
- TRM Verification → Eliza Evaluators
- ReasoningBank → Eliza Memory

See integration guides for complete implementation examples.

## Commands

### Development
```bash
# Frontend development (from root)
npm run dev          # Start Next.js dev server (runs `cd frontend && npm run dev`)
npm run build        # Build for production
npm run lint         # Run ESLint

# Frontend development (from frontend/)
cd frontend
npm run dev          # Start on http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint code
```

### Testing & Benchmarking
```bash
# From root directory
npm test                      # Run main test suite (npx tsx test-permutation-complete.ts)
npm run benchmark             # Run complete system benchmark
npm run benchmark:gepa        # Run GEPA optimizer (Python benchmarking/gepa_optimizer_full_system.py)

# Examples
npm run example:basic         # Basic query example
npm run example:multi-domain  # Multi-domain analysis
npm run example:config        # Custom configuration
```

### Database
```bash
# Supabase migrations are in supabase/migrations/
# Run migrations in Supabase SQL Editor in this order:
# 1. 001_initial_schema.sql
# 2. 002_vector_memory_system.sql
# 3. 20250114_permutation_simple.sql (recommended for quick start)
# OR 20250114_permutation_complete.sql (full feature set)
```

## Architecture

### Core Execution Flow

PERMUTATION uses a layered architecture where each query flows through:

1. **Input Processing** → Domain Detection → Smart Routing → Cache Check
2. **Optimization Layer** → ACE Framework + GEPA + DSPy + IRT + LoRA + ReasoningBank (run in parallel)
3. **Execution Engine** → Multi-Query Generation, Memory Retrieval, IRT Scoring, LoRA Application, SWiRL Steps
4. **Model Orchestration** → Teacher Model (Perplexity) or Student Model (Ollama) based on IRT difficulty
5. **Verification** → TRM Verification, Quality Scoring, Cost Tracking, Cache Storage

### Key Architectural Patterns

**Teacher-Student Architecture** (`frontend/lib/teacher-student-system.ts`):
- Teacher Model (Perplexity): High-accuracy, real-time data, used for difficult queries (IRT > 0.7)
- Student Model (Ollama): Fast, local, cost-effective, used for easier queries
- Routing based on IRT (Item Response Theory) difficulty assessment
- Knowledge distillation from teacher to student over time

**ACE Framework** (`frontend/lib/ace-framework.ts`):
- Generator: Produces reasoning trajectories using curated playbooks
- Reflector: Analyzes failures and identifies helpful/harmful context bullets
- Curator: Evolves playbooks by adding/removing/updating bullets
- Uses KV cache optimization for reusable context prefixes
- Concise action space (10-15 tokens per action)

**GEPA Optimization** (`frontend/lib/gepa-algorithms.ts`):
- Genetic-Pareto prompt evolution (based on arXiv:2507.19457)
- Multi-objective optimization: quality vs. cost vs. latency
- Population-based search with crossover and mutation
- Pareto frontier tracking for non-dominated solutions

**DSPy Integration** (`frontend/lib/dspy-observability.ts`, `frontend/lib/dspy-refine-with-feedback.ts`):
- **SCOPE**: Basic observability and feedback collection
- **LIMITATION**: Not full DSPy implementation - uses Ax LLM for orchestration
- Structured output generation (supports Zod schemas)
- Feedback-driven refinement loops
- Integration with Ax LLM orchestrator (`@ax-llm/ax` package)

**IRT Routing** (`frontend/lib/irt-calculator.ts`):
- 2PL (Two-Parameter Logistic) model: P(θ, b, a) = 1 / (1 + exp(-a(θ - b)))
- Calculates query difficulty (b) based on domain, complexity, word count, multi-step requirements
- Routes easy queries (IRT < 0.5) to student model, hard queries (IRT > 0.7) to teacher model
- PERMUTATION ability parameter θ = 0.85

**ReasoningBank** (`frontend/lib/reasoning-bank.ts`):
- Semantic memory system for past solutions
- Embedding-based similarity search
- Pattern recognition and solution retrieval
- Auto-learning from successful executions

**RVS (Recursive Verification System)** (`frontend/lib/trm.ts`):
- **IMPORTANT**: This is NOT the TRM paper's 7M neural network
- **APPROACH**: LLM-based recursive verification inspired by TRM concept
- Recursive refinement with confidence thresholds
- Adaptive computation time (ACT)
- Multi-scale reasoning with verification loops

### Critical Implementation Details

**BAML Integration** (`docs/architecture/baml-integration.md`):
- 60% token reduction vs JSON Schema
- Used for structured LLM outputs
- Human-readable type definitions
- Significant cost savings at scale ($32K+/year for 1M queries)

**Parallel Execution** (`frontend/lib/parallel-agent-system.ts`):
- Multi-query expansion runs in parallel
- Memory retrieval and embedding generation parallelized
- 2-3x speedup on multi-step queries

**Advanced Caching** (`frontend/lib/advanced-cache-system.ts`, `frontend/lib/kv-cache-manager.ts`):
- KV cache for reusable prompt prefixes (ACE playbooks)
- Semantic cache for similar queries
- Production-grade TTL and invalidation
- 45% cache hit rate impact on performance

**Real-Time Observability** (`frontend/lib/dspy-observability.ts`):
- Full trace logging for every component
- Teacher vs Student comparison metrics
- Cost tracking per query
- Quality score monitoring

### API Route Structure

API routes in `frontend/app/api/` follow this pattern:
- `/api/optimized/execute/route.ts` - Main PERMUTATION execution endpoint
- `/api/prompts/adaptive/route.ts` - ACE adaptive prompting
- `/api/dspy/*` - DSPy-specific endpoints (test-rag, etc.)
- `/api/benchmark/*` - Benchmarking endpoints (fast, run-real, test-simple)
- `/api/trace/inspect/route.ts` - Trace inspection for debugging

Each route uses Next.js 14 App Router conventions (`route.ts` files with `GET`, `POST` exports).

### Key Pages

- `/chat-reasoning` - Real-time reasoning visualization with step-by-step traces
- `/optimized-system` - Main PERMUTATION execution UI
- `/trace-viewer` - Detailed trace inspection for debugging
- `/real-edge-test` - Edge case testing interface
- `/tech-stack-benchmark` - Comparative benchmarking UI

## Environment Setup

Required environment variables (create `.env.local` in `frontend/`):
```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...              # For teacher model (optional if using Perplexity)
PERPLEXITY_API_KEY=pplx-...        # Recommended for teacher model
ANTHROPIC_API_KEY=sk-ant-...       # Optional, for Claude models

# Optional
OLLAMA_HOST=http://localhost:11434 # For local student model
```

## Testing Guidelines

**Benchmark Files**:
- `test-permutation-complete.ts` - Full system integration test
- `test-complete-system-benchmark.ts` - Comprehensive benchmarks vs LangChain/LangGraph
- `simple-benchmark-test.js` - Quick sanity checks
- `test-complex-queries.js` - Edge case testing

**Running Specific Tests**:
```bash
# Single test file
npx tsx test-permutation-complete.ts

# Python benchmarks (GEPA)
cd benchmarking
python gepa_optimizer_full_system.py
```

**Key Metrics to Track**:
- Quality Score (target: > 0.90)
- IRT Difficulty (0.0-1.0 scale)
- Latency (p50, p95, p99)
- Cost per query (target: < $0.01)
- Cache hit rate (target: > 40%)

## Code Patterns

### Creating New API Routes

```typescript
// frontend/app/api/your-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, domain } = await req.json();

    // Use PERMUTATION components
    const result = await engine.execute(query, domain);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Integrating with DSPy

```typescript
import { AX } from '@ax-llm/ax';

// Define signature
const signature = "query: str, context: str -> answer: str, confidence: float";

// Use with Ax LLM
const ax = new AX({ apiKey: process.env.OPENAI_API_KEY });
const result = await ax.generate({
  prompt: signature,
  input: { query, context }
});
```

### Adding ACE Playbook Bullets

Playbooks are stored in Supabase (`ace_playbook_bullets` table). To add programmatically:

```typescript
import { supabase } from './lib/supabase';

await supabase.from('ace_playbook_bullets').insert({
  section: 'financial_analysis',
  content: 'Always verify stock prices from real-time sources',
  helpful_count: 0,
  harmful_count: 0,
  tags: ['financial', 'verification', 'real-time']
});
```

### Implementing Tool Calling

```typescript
import { getToolCallingSystem } from './lib/tool-calling-system';

const toolSystem = getToolCallingSystem();
await toolSystem.initialize();

const result = await toolSystem.executeTool('search_web', {
  query: 'latest stock price',
  maxResults: 5
});
```

## Common Pitfalls

1. **Don't modify core algorithms without understanding the research**: ACE, GEPA, IRT, and TRM implement specific academic papers. Changes should align with the research or be clearly marked as extensions.

2. **Teacher-Student routing is IRT-based**: Don't route queries manually. Use `calculateIRT()` to determine difficulty, then let the system route automatically.

3. **Supabase migrations order matters**: Run migrations in numeric order. The "simple" migration is sufficient for most use cases.

4. **DSPy signatures are type-safe**: Use Zod schemas for structured outputs, not plain JSON Schema. The system supports Ax LLM's Zod integration.

5. **Cache invalidation**: KV cache keys are playbook-hash based. If you update ACE playbooks, the cache automatically updates. Don't manually invalidate unless necessary.

6. **Cost tracking is built-in**: Every query logs cost. Don't add separate tracking unless you need per-component granularity.

## Component Interoperability

Key integrations to understand:

- **ACE + DSPy**: ACE generates prompts, DSPy refines them with feedback
- **GEPA + IRT**: GEPA evolves prompts, IRT determines which model to use
- **ReasoningBank + TRM**: ReasoningBank retrieves past solutions, TRM verifies them
- **Teacher + Student**: Teacher (Perplexity) trains Student (Ollama) via knowledge distillation
- **Qdrant + Mem0**: Vector storage (Qdrant) + Memory management (Mem0 Core)

## Research Papers Implemented

- ACE Framework: "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models"
- GEPA: "Genetic-Pareto Prompt Evolution" (arXiv:2507.19457)
- DSPy: "Declarative Self-improving Python" (dspy.ai)
- IRT: Item Response Theory (2PL model for difficulty calibration)
- RVS: "Recursive Verification System" (inspired by TRM paper, but LLM-based implementation)
- LoRA: "Low-Rank Adaptation of Large Language Models"

When modifying components based on these papers, maintain fidelity to the original research unless explicitly implementing an extension.

## Performance Targets

Based on benchmarks in `docs/archive/BENCHMARK_RESULTS_FINAL.md`:

- Quality Score: 0.94 (vs 0.72 LangChain, 0.78 LangGraph)
- Latency p50: 3.2s (vs 4.1s LangChain, 3.8s LangGraph)
- Cost per 1K queries: $5.20 (vs $8.40 LangChain, $7.10 LangGraph)
- Hard Query Accuracy: 85% (vs 67% LangChain, 71% LangGraph)

When making changes, run benchmarks to ensure these targets are maintained or improved.

## Brain Skills System (Migration Complete ✅)

The Brain API (`/api/brain`) now supports BOTH the original subconscious memory system AND a new modular skills architecture. Both systems coexist with a feature flag toggle.

### Migration Status

**Current State**: ✅ Production Ready
- Original system: Default (no breaking changes)
- New system: Available via `BRAIN_USE_NEW_SKILLS=true`
- Rollback time: Instant (unset env var)
- See: `BRAIN_MIGRATION_COMPLETE.md` for full details

### Switching Between Systems

```bash
# Use original system (default)
npm run dev

# Use new modular system (opt-in)
export BRAIN_USE_NEW_SKILLS=true
npm run dev
```

### Testing Both Systems

```bash
# Test current configuration
node test-brain-migration.js

# Test new system performance
export BRAIN_USE_NEW_SKILLS=true
npm run dev
node test-brain-improvements.js
```

### Architecture

**Location**: `frontend/lib/brain-skills/`

**Core Components**:
- `skill-registry.ts` - Central registry for all brain skills
- `skill-cache.ts` - LRU cache with TTL (40-60% hit rate expected)
- `skill-metrics.ts` - Metrics tracking to Supabase
- `base-skill.ts` - Abstract base class for all skills

**Available Skills** (New System):
- `trm-skill.ts` - Multi-phase recursive reasoning (priority: 2)
- `gepa-skill.ts` - Genetic-Pareto optimization (priority: 3)
- `ace-skill.ts` - Agentic Context Engineering (priority: 1)
- `kimi-k2-skill.ts` - Advanced reasoning with OpenRouter (priority: 1)

**Available Skills** (Original System):
- 13 skills in `subconsciousMemory` object (frontend/app/api/brain/route.ts:56)
- Includes: TRM, GEPA, ACE, teacherStudent, RAG, costOptimization, kimiK2, zodValidation, creativeReasoning, multilingualBusiness, advancedRAG, advancedReranking, brainEvaluation

### Using Brain Skills (New System)

```typescript
import { getSkillRegistry } from './lib/brain-skills';

const registry = getSkillRegistry();
const context = await analyzeContext(query, domain);
const results = await registry.executeActivatedSkills(query, context);
```

### Performance Features

- **Automatic Caching**: Skills cache results with configurable TTL
- **Parallel Execution**: All activated skills run simultaneously
- **Metrics Tracking**: Every execution logged to `brain_skill_metrics` table
- **Type Safety**: Full TypeScript types, no `any`
- **Error Handling**: Graceful fallbacks and automatic retries

### Database Table

Run migration: `supabase/migrations/012_brain_skill_metrics.sql`

Table: `brain_skill_metrics` tracks execution time, success rate, cost, quality scores, and cache hits.

### Metrics API

```bash
# View metrics
GET /api/brain/metrics?hours=24&skill=kimiK2

# Clear cache
DELETE /api/brain/metrics?action=clear_cache

# Cleanup old metrics
DELETE /api/brain/metrics?action=cleanup_metrics&days=30
```

### Creating Custom Skills

```typescript
import { BaseSkill, BrainContext, SkillResult } from './lib/brain-skills';

export class MySkill extends BaseSkill {
  name = 'My Skill';
  description = 'Custom functionality';
  priority = 4;
  cacheEnabled = true;
  cacheTTL = 3600000; // 1 hour

  activation(context: BrainContext): boolean {
    return context.domain === 'myDomain';
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    // Implementation
    return this.createSuccessResult(data);
  }
}

// Register it
getSkillRegistry().register('mySkill', new MySkill());
```

### Performance Expectations

- Cache hit rate: 40-60%
- Response time: 0.5-2s (with cache), 2-5s (without)
- Cost reduction: 50-90% on cached queries
- Success rate: 95%+

### Documentation

- Full guide: `frontend/lib/brain-skills/README.md`
- Integration: `frontend/lib/brain-skills/INTEGRATION_GUIDE.md`
- Quick ref: `frontend/lib/brain-skills/QUICK_REFERENCE.md`
- Summary: `BRAIN_IMPROVEMENTS_SUMMARY.md`
