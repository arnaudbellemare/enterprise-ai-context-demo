# Brain Systems Optimization Using MoE Patterns
**Inspired by**: vLLM Fused MoE Modular Kernel
**Application**: PERMUTATION Brain Skills Architecture
**Date**: 2025-10-21

## Executive Summary

vLLM's Mixture of Experts (MoE) architecture provides proven patterns for efficiently orchestrating multiple specialized models. These patterns can be adapted to optimize our Brain Skills system, which conceptually operates as an MoE at the **application orchestration level** rather than the model architecture level.

**Key Insight**: Our brain skills system (TRM, GEPA, ACE, Kimi K2) is functionally similar to MoE experts - we route queries to specialized skills based on context, just as MoE routes tokens to specialized expert networks.

---

## Current Brain System Architecture

### How It Works Now

```
Query → Context Analysis → Skill Activation → Parallel Execution → Synthesis
                            ↓
                     ALL matching skills activate
                     (no load balancing)
                     (no top-k selection)
                     (no batching optimization)
```

**Current Implementation**:
```typescript
// frontend/lib/brain-skills/skill-registry.ts
getActivatedSkills(context: BrainContext): [string, BrainSkill][] {
  return Array.from(this.skills.entries())
    .filter(([_, skill]) => skill.activation(context))  // All matching
    .sort((a, b) => a[1].priority - b[1].priority);
}
```

**Issues**:
1. ❌ Activates ALL matching skills (no top-k)
2. ❌ No load balancing across skills
3. ❌ No query batching for similar contexts
4. ❌ No dynamic skill selection optimization
5. ❌ No pre-allocated resource management

---

## MoE Patterns Applied to Brain Skills

### Pattern 1: Top-K Skill Selection ⭐

**vLLM Approach**: Select only top-k most relevant experts per token
**Brain Application**: Select only top-k most relevant skills per query

**Benefits**:
- Reduce API costs (fewer skill activations)
- Faster response times (less parallel overhead)
- Better resource utilization (focus on best skills)
- Improved quality (best skills only, not all skills)

**Implementation**:

```typescript
// frontend/lib/brain-skills/moe-skill-router.ts
export class MoESkillRouter {
  private readonly topK: number = 3;  // Top-3 skills per query

  selectTopKSkills(
    context: BrainContext,
    skills: Map<string, BrainSkill>
  ): SkillWithScore[] {
    // Score each skill based on context relevance
    const scored = Array.from(skills.entries()).map(([name, skill]) => ({
      name,
      skill,
      score: this.calculateRelevanceScore(skill, context),
      priority: skill.priority
    }));

    // Filter activated skills
    const activated = scored.filter(s => s.score > 0);

    // Sort by score (weighted with priority)
    const sorted = activated.sort((a, b) => {
      const scoreA = a.score * (1 / a.priority);  // Higher priority = lower number
      const scoreB = b.score * (1 / b.priority);
      return scoreB - scoreA;
    });

    // Return top-K
    return sorted.slice(0, this.topK);
  }

  private calculateRelevanceScore(
    skill: BrainSkill,
    context: BrainContext
  ): number {
    if (!skill.activation(context)) return 0;

    let score = 1.0;

    // Domain match bonus
    if (skill.preferredDomains?.includes(context.domain)) {
      score += 0.3;
    }

    // Complexity alignment bonus
    const complexityDiff = Math.abs(skill.optimalComplexity - context.complexity);
    score += Math.max(0, 0.5 - complexityDiff * 0.1);

    // Recent success rate bonus
    const successRate = this.getRecentSuccessRate(skill.name);
    score *= (0.7 + successRate * 0.3);

    return score;
  }
}
```

**Configuration**:
```typescript
// Allow dynamic top-k based on query complexity
const topK = context.complexity > 7 ? 5 : 3;  // More skills for complex queries
```

---

### Pattern 2: Query Batching & Permutation 🔄

**vLLM Approach**: Group tokens routed to same expert for batched computation
**Brain Application**: Batch similar queries to same skills for efficient processing

**Benefits**:
- Amortize API overhead across multiple queries
- Better cache utilization (similar queries hit cache)
- Reduced cold start costs
- Improved throughput (10-50% faster)

**Implementation**:

```typescript
// frontend/lib/brain-skills/query-batcher.ts
export class QueryBatcher {
  private batches: Map<string, QueryBatch> = new Map();
  private batchWindow: number = 100;  // 100ms batching window

  async executeWithBatching(
    query: string,
    context: BrainContext,
    skills: SkillWithScore[]
  ): Promise<SkillResult[]> {
    const batchKey = this.getBatchKey(context, skills);

    // Create or get existing batch
    let batch = this.batches.get(batchKey);
    if (!batch) {
      batch = new QueryBatch(skills, this.batchWindow);
      this.batches.set(batchKey, batch);

      // Schedule batch execution
      setTimeout(() => this.executeBatch(batchKey), this.batchWindow);
    }

    // Add query to batch and wait for result
    return batch.addQuery(query, context);
  }

  private getBatchKey(context: BrainContext, skills: SkillWithScore[]): string {
    const skillNames = skills.map(s => s.name).sort().join(',');
    return `${context.domain}:${skillNames}:${Math.floor(context.complexity)}`;
  }

  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    console.log(`🔄 Executing batch: ${batchKey} (${batch.size} queries)`);

    // Execute all skills with batched queries
    await batch.execute();

    // Cleanup
    this.batches.delete(batchKey);
  }
}

class QueryBatch {
  private queries: Array<{
    query: string;
    context: BrainContext;
    resolve: (results: SkillResult[]) => void;
  }> = [];

  constructor(
    private skills: SkillWithScore[],
    private window: number
  ) {}

  addQuery(query: string, context: BrainContext): Promise<SkillResult[]> {
    return new Promise((resolve) => {
      this.queries.push({ query, context, resolve });
    });
  }

  async execute(): Promise<void> {
    // Execute each skill once with all queries
    const skillResults = await Promise.all(
      this.skills.map(async ({ skill, name }) => {
        // Batch API call with multiple queries
        const results = await skill.executeBatch?.(
          this.queries.map(q => q.query),
          this.queries[0].context  // Use representative context
        );
        return { name, results };
      })
    );

    // Distribute results back to individual queries
    this.queries.forEach((q, idx) => {
      const results = skillResults.map(sr => sr.results[idx]);
      q.resolve(results);
    });
  }

  get size(): number {
    return this.queries.length;
  }
}
```

**API Adaptation Required**:
```typescript
// Skills need to support batch execution
interface BrainSkill {
  execute(query: string, context: BrainContext): Promise<SkillResult>;

  // NEW: Batch execution method
  executeBatch?(
    queries: string[],
    context: BrainContext
  ): Promise<SkillResult[]>;
}
```

---

### Pattern 3: Load Balancing & Expert Utilization 📊

**vLLM Approach**: Balance token distribution across experts
**Brain Application**: Balance query distribution across skills

**Benefits**:
- Prevent skill overload (too many concurrent executions)
- Better API rate limit management
- Improved cost distribution
- Reduced cold start penalties

**Implementation**:

```typescript
// frontend/lib/brain-skills/load-balancer.ts
export class SkillLoadBalancer {
  private activeExecutions: Map<string, number> = new Map();
  private maxConcurrent: Map<string, number> = new Map();
  private queues: Map<string, QueryQueue> = new Map();

  constructor() {
    // Configure per-skill concurrency limits
    this.maxConcurrent.set('kimiK2', 5);      // OpenRouter has rate limits
    this.maxConcurrent.set('trm', 10);        // Internal, can handle more
    this.maxConcurrent.set('gepa', 3);        // Expensive, limit carefully
    this.maxConcurrent.set('ace', 8);
  }

  async executeWithLoadBalancing(
    skillName: string,
    skill: BrainSkill,
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;

    if (current >= max) {
      // Skill is at capacity, queue the request
      console.log(`⏳ ${skillName} at capacity (${current}/${max}), queueing`);
      return this.enqueue(skillName, skill, query, context);
    }

    // Track execution
    this.activeExecutions.set(skillName, current + 1);

    try {
      const result = await skill.execute(query, context);
      return result;
    } finally {
      // Release and process queue
      const newCurrent = (this.activeExecutions.get(skillName) || 1) - 1;
      this.activeExecutions.set(skillName, newCurrent);
      this.processQueue(skillName);
    }
  }

  private async enqueue(
    skillName: string,
    skill: BrainSkill,
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    let queue = this.queues.get(skillName);
    if (!queue) {
      queue = new QueryQueue();
      this.queues.set(skillName, queue);
    }

    return queue.enqueue(query, context, skill);
  }

  private processQueue(skillName: string): void {
    const queue = this.queues.get(skillName);
    if (!queue || queue.isEmpty()) return;

    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;

    if (current < max) {
      const next = queue.dequeue();
      if (next) {
        this.executeWithLoadBalancing(
          skillName,
          next.skill,
          next.query,
          next.context
        ).then(result => next.resolve(result));
      }
    }
  }

  getUtilization(skillName: string): number {
    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;
    return current / max;
  }

  getQueueDepth(skillName: string): number {
    return this.queues.get(skillName)?.size() || 0;
  }
}
```

**Monitoring Dashboard**:
```typescript
// GET /api/brain/load-balancing
export async function GET() {
  const balancer = getSkillLoadBalancer();

  return NextResponse.json({
    utilization: {
      kimiK2: balancer.getUtilization('kimiK2'),
      trm: balancer.getUtilization('trm'),
      gepa: balancer.getUtilization('gepa'),
      ace: balancer.getUtilization('ace'),
    },
    queueDepth: {
      kimiK2: balancer.getQueueDepth('kimiK2'),
      trm: balancer.getQueueDepth('trm'),
      gepa: balancer.getQueueDepth('gepa'),
      ace: balancer.getQueueDepth('ace'),
    }
  });
}
```

---

### Pattern 4: Pre-allocated Resource Management 💾

**vLLM Approach**: Pre-allocate workspace buffers to reduce allocation overhead
**Brain Application**: Pre-allocate and reuse API clients, caches, and buffers

**Benefits**:
- Eliminate cold start penalties
- Reduce memory churn
- Faster execution (10-20% improvement)
- Better resource predictability

**Implementation**:

```typescript
// frontend/lib/brain-skills/resource-manager.ts
export class SkillResourceManager {
  private apiClients: Map<string, any> = new Map();
  private workspaces: Map<string, WorkspaceBuffer> = new Map();
  private warmupComplete: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    console.log('🔥 Warming up skill resources...');

    // Pre-allocate API clients
    await Promise.all([
      this.initializeKimiK2Client(),
      this.initializeTRMClient(),
      this.initializeGEPAClient(),
      this.initializeACEClient(),
    ]);

    // Pre-allocate workspace buffers
    this.workspaces.set('kimiK2', new WorkspaceBuffer(1024 * 1024));  // 1MB
    this.workspaces.set('trm', new WorkspaceBuffer(512 * 1024));      // 512KB
    this.workspaces.set('gepa', new WorkspaceBuffer(2 * 1024 * 1024)); // 2MB
    this.workspaces.set('ace', new WorkspaceBuffer(1024 * 1024));      // 1MB

    console.log('✅ Resource warmup complete');
  }

  private async initializeKimiK2Client(): Promise<void> {
    const client = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY,
      keepAlive: true,  // Reuse connections
      maxSockets: 5,     // Connection pool
    });

    // Warmup request
    await client.healthCheck();

    this.apiClients.set('kimiK2', client);
    this.warmupComplete.set('kimiK2', true);
  }

  getClient(skillName: string): any {
    const client = this.apiClients.get(skillName);
    if (!client || !this.warmupComplete.get(skillName)) {
      console.warn(`⚠️  ${skillName} client not warmed up, using cold client`);
      return this.createColdClient(skillName);
    }
    return client;
  }

  getWorkspace(skillName: string): WorkspaceBuffer {
    return this.workspaces.get(skillName) || new WorkspaceBuffer(1024 * 1024);
  }
}

class WorkspaceBuffer {
  private buffer: Buffer;
  private inUse: boolean = false;

  constructor(size: number) {
    this.buffer = Buffer.allocUnsafe(size);
  }

  acquire(): Buffer {
    if (this.inUse) {
      // Buffer busy, allocate temporary
      return Buffer.allocUnsafe(this.buffer.length);
    }
    this.inUse = true;
    return this.buffer;
  }

  release(): void {
    this.inUse = false;
    // Buffer can be reused
  }
}
```

**Server Initialization**:
```typescript
// frontend/app/api/brain/route.ts
import { getSkillResourceManager } from '../../../lib/brain-skills';

// Initialize on server start
let initialized = false;

export async function POST(request: NextRequest) {
  if (!initialized) {
    const manager = getSkillResourceManager();
    await manager.initialize();
    initialized = true;
  }

  // ... rest of handler
}
```

---

### Pattern 5: Dynamic Implementation Selection 🎯

**vLLM Approach**: `select_gemm_impl()` chooses optimal compute kernel
**Brain Application**: Choose optimal skill backend based on context

**Benefits**:
- Use cheaper models for simple queries
- Use advanced models only when needed
- Adaptive cost optimization
- Better quality/cost tradeoff

**Implementation**:

```typescript
// frontend/lib/brain-skills/dynamic-router.ts
export class DynamicSkillRouter {
  selectOptimalImplementation(
    skillName: string,
    context: BrainContext
  ): SkillImplementation {
    const implementations = this.getAvailableImplementations(skillName);

    // Score each implementation
    const scored = implementations.map(impl => ({
      impl,
      score: this.scoreImplementation(impl, context)
    }));

    // Select best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].impl;
  }

  private scoreImplementation(
    impl: SkillImplementation,
    context: BrainContext
  ): number {
    let score = 0;

    // Quality requirement
    if (impl.qualityScore >= context.requiredQuality) {
      score += 100;
    } else {
      return 0;  // Doesn't meet minimum quality
    }

    // Cost efficiency (inverse relationship)
    score += (1 / impl.costPerQuery) * 10;

    // Speed bonus
    score += (1000 / impl.avgLatency) * 5;

    // Complexity alignment
    const complexityMatch = 1 - Math.abs(impl.optimalComplexity - context.complexity) / 10;
    score += complexityMatch * 20;

    return score;
  }

  private getAvailableImplementations(skillName: string): SkillImplementation[] {
    // Example for Kimi K2 skill
    if (skillName === 'kimiK2') {
      return [
        {
          name: 'tongyi-deepresearch',
          qualityScore: 0.95,
          costPerQuery: 0.05,
          avgLatency: 2000,
          optimalComplexity: 8,
        },
        {
          name: 'nvidia-nemotron',
          qualityScore: 0.90,
          costPerQuery: 0.02,
          avgLatency: 1500,
          optimalComplexity: 6,
        },
        {
          name: 'gemini-flash',
          qualityScore: 0.85,
          costPerQuery: 0.01,
          avgLatency: 800,
          optimalComplexity: 4,
        },
      ];
    }

    // Default
    return [this.getDefaultImplementation(skillName)];
  }
}
```

**Usage**:
```typescript
const router = new DynamicSkillRouter();
const impl = router.selectOptimalImplementation('kimiK2', context);

console.log(`Using ${impl.name} for complexity ${context.complexity}`);
// Simple query → gemini-flash (cheap, fast)
// Complex query → tongyi-deepresearch (expensive, high quality)
```

---

## Integration Architecture

### Complete MoE-Optimized Flow

```typescript
// frontend/lib/brain-skills/moe-orchestrator.ts
export class MoEBrainOrchestrator {
  private router: MoESkillRouter;
  private batcher: QueryBatcher;
  private loadBalancer: SkillLoadBalancer;
  private resourceManager: SkillResourceManager;
  private dynamicRouter: DynamicSkillRouter;

  constructor() {
    this.router = new MoESkillRouter();
    this.batcher = new QueryBatcher();
    this.loadBalancer = new SkillLoadBalancer();
    this.resourceManager = getSkillResourceManager();
    this.dynamicRouter = new DynamicSkillRouter();
  }

  async executeQuery(
    query: string,
    context: BrainContext
  ): Promise<BrainResponse> {
    // 1. Top-K Skill Selection
    const registry = getSkillRegistry();
    const topSkills = this.router.selectTopKSkills(context, registry.skills);

    console.log(`🎯 Selected top-${topSkills.length} skills:`,
      topSkills.map(s => `${s.name}(${s.score.toFixed(2)})`));

    // 2. Dynamic Implementation Selection
    const implementations = topSkills.map(({ name, skill }) => ({
      name,
      skill,
      impl: this.dynamicRouter.selectOptimalImplementation(name, context)
    }));

    // 3. Query Batching (if applicable)
    const results = await this.batcher.executeWithBatching(
      query,
      context,
      implementations
    );

    // 4. Load-Balanced Execution
    const skillResults = await Promise.all(
      implementations.map(({ name, skill }) =>
        this.loadBalancer.executeWithLoadBalancing(
          name,
          skill,
          query,
          context
        )
      )
    );

    // 5. Synthesis
    return this.synthesizeResults(skillResults, topSkills);
  }

  private synthesizeResults(
    results: SkillResult[],
    skills: SkillWithScore[]
  ): BrainResponse {
    // Weighted synthesis based on skill scores
    const totalScore = skills.reduce((sum, s) => sum + s.score, 0);

    let synthesized = '';
    let totalCost = 0;
    let maxQuality = 0;

    results.forEach((result, idx) => {
      if (!result.success) return;

      const weight = skills[idx].score / totalScore;
      synthesized += `\n\n### ${skills[idx].name} (weight: ${weight.toFixed(2)})\n`;
      synthesized += result.data;

      totalCost += result.metadata?.cost || 0;
      maxQuality = Math.max(maxQuality, result.metadata?.quality || 0);
    });

    return {
      response: synthesized,
      metadata: {
        skillsActivated: skills.map(s => s.name),
        skillScores: Object.fromEntries(skills.map(s => [s.name, s.score])),
        totalCost,
        averageQuality: maxQuality,
        moeOptimized: true,
      }
    };
  }
}
```

---

## Performance Projections

### Expected Improvements

| Metric | Current | With MoE Patterns | Improvement |
|--------|---------|------------------|-------------|
| Avg Response Time | 508ms | 300-350ms | 30-40% faster |
| Cost per Query | $0.01-0.05 | $0.005-0.02 | 50-60% cheaper |
| Throughput (qps) | 10-20 | 30-50 | 2-3x higher |
| P99 Latency | 2000ms | 800-1000ms | 50-60% reduction |
| Skill Utilization | 60% | 85%+ | Better balance |

### Cost Breakdown

**Before MoE Optimization**:
```
Query → All 4 skills activate
Cost: $0.05 + $0.02 + $0.02 + $0.01 = $0.10 per query
```

**After MoE Optimization** (Top-3, dynamic impl):
```
Query → Top 3 skills, optimal implementations
Cost: $0.01 + $0.01 + $0.005 = $0.025 per query
Savings: 75%
```

---

## Implementation Roadmap

### Phase 1: Core MoE Router (Week 1)

**Priority**: ⭐⭐⭐ HIGH

1. Implement `MoESkillRouter` with top-k selection
2. Add relevance scoring algorithm
3. Integrate with existing skill registry
4. A/B test top-3 vs all-skills activation

**Files to Create**:
- `frontend/lib/brain-skills/moe-skill-router.ts`
- `frontend/lib/brain-skills/relevance-scorer.ts`

**Success Criteria**:
- Top-k selection working
- Cost reduction: 30-50%
- Quality maintained: > 90% of current

### Phase 2: Load Balancing (Week 2)

**Priority**: ⭐⭐ MEDIUM

1. Implement `SkillLoadBalancer` with per-skill limits
2. Add queue management
3. Add utilization monitoring
4. Dashboard for load metrics

**Files to Create**:
- `frontend/lib/brain-skills/load-balancer.ts`
- `frontend/app/api/brain/load-balancing/route.ts`

**Success Criteria**:
- No skill overload (< 100% utilization)
- Smooth throughput (no spikes)
- Queue depth < 10 per skill

### Phase 3: Query Batching (Week 3)

**Priority**: ⭐ LOW (nice to have)

1. Implement `QueryBatcher` with time windows
2. Add batch execution to skills
3. Optimize batch sizes
4. Measure batching effectiveness

**Files to Create**:
- `frontend/lib/brain-skills/query-batcher.ts`
- Update skill interfaces for batch support

**Success Criteria**:
- 10-30% throughput increase
- Cache hit rate improvement
- Batch window optimization complete

### Phase 4: Resource Management (Week 4)

**Priority**: ⭐⭐ MEDIUM

1. Implement `SkillResourceManager` with pre-allocation
2. Add warmup on server start
3. Connection pooling for all APIs
4. Workspace buffer management

**Files to Create**:
- `frontend/lib/brain-skills/resource-manager.ts`
- Update server initialization

**Success Criteria**:
- Zero cold starts after warmup
- 10-20% latency improvement
- Memory usage predictable

### Phase 5: Dynamic Implementation Selection (Week 5)

**Priority**: ⭐⭐ MEDIUM

1. Implement `DynamicSkillRouter` for impl selection
2. Add quality/cost/latency scoring
3. Configure multiple implementations per skill
4. A/B test dynamic vs static selection

**Files to Create**:
- `frontend/lib/brain-skills/dynamic-router.ts`
- Configuration for skill implementations

**Success Criteria**:
- Quality maintained on all queries
- Cost reduction: 20-40% additional
- Latency optimization: 10-20% improvement

---

## Testing Strategy

### Unit Tests

```typescript
// frontend/lib/brain-skills/__tests__/moe-skill-router.test.ts
describe('MoESkillRouter', () => {
  it('should select top-k most relevant skills', () => {
    const router = new MoESkillRouter();
    const context = createTestContext({ complexity: 8, domain: 'legal' });

    const selected = router.selectTopKSkills(context, mockSkills);

    expect(selected).toHaveLength(3);
    expect(selected[0].score).toBeGreaterThan(selected[1].score);
    expect(selected[1].score).toBeGreaterThan(selected[2].score);
  });

  it('should apply priority weighting correctly', () => {
    // Test that priority influences selection
  });

  it('should consider recent success rates', () => {
    // Test success rate factor
  });
});
```

### Integration Tests

```typescript
// test-moe-optimization.js
async function testMoEOptimization() {
  const queries = [
    { query: 'Simple math', complexity: 2, expected: 2 },  // Expect 2 skills
    { query: 'Complex legal', complexity: 8, expected: 4 }, // Expect 4 skills
  ];

  for (const test of queries) {
    const response = await fetch('/api/brain', {
      method: 'POST',
      body: JSON.stringify(test)
    });

    const data = await response.json();

    console.log(`Query: "${test.query}"`);
    console.log(`  Skills activated: ${data.skillsActivated.length}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Skills: ${data.skillsActivated.join(', ')}`);
    console.log(`  Total cost: $${data.totalCost.toFixed(4)}`);

    assert(data.skillsActivated.length <= test.expected);
  }
}
```

### Performance Benchmarks

```bash
# Compare MoE vs non-MoE
node test-moe-benchmark.js

# Expected output:
# Non-MoE: 508ms avg, $0.10 per query
# MoE:     350ms avg, $0.025 per query
# Improvement: 31% faster, 75% cheaper
```

---

## Monitoring & Observability

### Metrics to Track

```typescript
// New metrics table
CREATE TABLE brain_moe_metrics (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  query_hash TEXT,

  -- Selection metrics
  skills_considered INT,
  skills_selected INT,
  top_skill TEXT,
  top_skill_score FLOAT,

  -- Performance metrics
  selection_time_ms FLOAT,
  execution_time_ms FLOAT,
  total_time_ms FLOAT,

  -- Cost metrics
  total_cost FLOAT,
  cost_saved FLOAT,  -- vs activating all skills

  -- Quality metrics
  quality_score FLOAT,
  synthesis_quality FLOAT,

  -- Load balancing
  max_utilization FLOAT,
  avg_queue_depth FLOAT
);
```

### Dashboard

```typescript
// GET /api/brain/moe-metrics
export async function GET() {
  const last24h = await supabase
    .from('brain_moe_metrics')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000));

  return NextResponse.json({
    avgSkillsSelected: average(last24h.data, 'skills_selected'),
    avgCostPerQuery: average(last24h.data, 'total_cost'),
    avgCostSaved: average(last24h.data, 'cost_saved'),
    avgResponseTime: average(last24h.data, 'total_time_ms'),
    avgQuality: average(last24h.data, 'quality_score'),

    skillDistribution: getSkillDistribution(last24h.data),
    hourlyTrends: getHourlyTrends(last24h.data),
  });
}
```

---

## Configuration

### Environment Variables

```bash
# .env.local

# MoE Configuration
BRAIN_MOE_ENABLED=true
BRAIN_MOE_TOP_K=3
BRAIN_MOE_BATCHING_WINDOW_MS=100
BRAIN_MOE_MAX_CONCURRENT_PER_SKILL=10

# Dynamic routing
BRAIN_DYNAMIC_ROUTING_ENABLED=true
BRAIN_QUALITY_THRESHOLD=0.85

# Load balancing
BRAIN_LOAD_BALANCING_ENABLED=true
BRAIN_MAX_QUEUE_DEPTH=50
```

### Feature Flags

```typescript
// frontend/lib/brain-skills/config.ts
export const MOE_CONFIG = {
  enabled: process.env.BRAIN_MOE_ENABLED === 'true',
  topK: parseInt(process.env.BRAIN_MOE_TOP_K || '3'),
  batchingWindow: parseInt(process.env.BRAIN_MOE_BATCHING_WINDOW_MS || '100'),
  loadBalancingEnabled: process.env.BRAIN_LOAD_BALANCING_ENABLED === 'true',
  dynamicRoutingEnabled: process.env.BRAIN_DYNAMIC_ROUTING_ENABLED === 'true',
};
```

---

## Risks & Mitigations

### Risk 1: Top-K Selection Misses Important Skills

**Risk**: Top-k selection might exclude skills that would have provided valuable insights

**Mitigation**:
- Start with top-5 and gradually reduce to top-3
- A/B test against all-skills activation
- Monitor quality scores closely
- Allow fallback to all-skills for critical queries

### Risk 2: Batching Increases Latency

**Risk**: Waiting for batch window adds latency to individual queries

**Mitigation**:
- Keep batch window small (50-100ms)
- Make batching optional (bypass for high-priority queries)
- Monitor P50 and P99 latencies
- Adaptive batch windows based on load

### Risk 3: Load Balancing Queue Buildup

**Risk**: Queues could grow unbounded under high load

**Mitigation**:
- Set max queue depth (e.g., 50 queries)
- Implement queue timeout (reject after X seconds)
- Add circuit breakers
- Scale horizontally if needed

### Risk 4: Dynamic Routing Chooses Poor Implementation

**Risk**: Scoring algorithm might select suboptimal implementation

**Mitigation**:
- Validate implementation selection against ground truth
- A/B test dynamic vs static selection
- Allow manual override for specific queries
- Continuous learning from quality feedback

---

## Next Steps

### Immediate Actions

1. **Review this document** with team
2. **Prioritize phases** based on business needs
3. **Set up MoE metrics tracking** (create table)
4. **Start Phase 1** (Top-K Selection)

### Quick Win

Implement just **Pattern 1 (Top-K Selection)** this week:
- Expected: 30-50% cost reduction
- Risk: Low (easy rollback)
- Effort: 1-2 days
- Impact: HIGH

```bash
# Quick implementation
cd frontend/lib/brain-skills
# Create moe-skill-router.ts
# Integrate with skill-registry.ts
# Add feature flag
# A/B test for 1 week
```

---

## References

- [vLLM MoE Kernel Design](https://docs.vllm.ai/en/latest/design/fused_moe_modular_kernel.html)
- [Mixture of Experts Explained](https://arxiv.org/abs/2101.03961)
- [Brain Skills System README](frontend/lib/brain-skills/README.md)
- [Current Performance Results](BRAIN_TEST_RESULTS.txt)

---

**Document Status**: ✅ Ready for Implementation
**Estimated Impact**: 🚀 30-40% faster, 50-75% cheaper
**Implementation Time**: 4-5 weeks for all phases
**Quick Win Available**: ⭐ Phase 1 (Top-K) in 1-2 days
