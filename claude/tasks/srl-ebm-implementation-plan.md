# Implementation Plan: SRL + nanoEBM with ElizaOS Patterns

**Created**: 2025-10-31
**Status**: Design Phase - 3 Approaches Evaluated
**Selected Approach**: Approach 2 (Hybrid ElizaOS Patterns)

## Overview

Following ElizaOS Step 3: Design multiple approaches, evaluate comprehensively, select optimal.

## Approach 1: Full ElizaOS Package Integration

### Description

Install `@elizaos/core` package and implement full ElizaOS runtime with agents, characters, and complete plugin system.

### Files to Add

```
frontend/lib/eliza/
├── runtime.ts                      # IAgentRuntime initialization
├── characters/
│   └── permutation-agent.ts        # Character definition with SRL/EBM config
├── plugins/
│   ├── srl-plugin.ts               # Full SRL plugin (actions, providers, evaluators, services)
│   ├── ebm-plugin.ts               # Full EBM plugin
│   └── permutation-plugin.ts       # Main PERMUTATION plugin wrapper
└── adapters/
    └── permutation-adapter.ts      # Adapter to existing PERMUTATION engine
```

### Files to Modify

```
frontend/lib/permutation-engine.ts
- Add: ElizaOS runtime initialization
- Add: Plugin registration
- Add: Message processing via runtime.processActions()
- Change: Query execution to use runtime.composeState()

frontend/lib/srl/swirl-srl-enhancer.ts
- Remove: Direct implementation
- Add: Import from srl-plugin

frontend/lib/ebm/answer-refiner-simple.ts
- Remove: Direct implementation
- Add: Import from ebm-plugin
```

### Strengths

- ✅ **Official Patterns**: Use exact ElizaOS interfaces and types
- ✅ **Future-Proof**: Easy to adopt new ElizaOS features
- ✅ **Community**: Access ElizaOS examples and community support
- ✅ **Type Safety**: Full TypeScript support from @elizaos/core
- ✅ **Testing**: Can use ElizaOS test utilities

### Weaknesses

- ❌ **Dependency Weight**: Adds significant package dependency (~2MB)
- ❌ **Learning Curve**: Team needs to learn ElizaOS runtime concepts
- ❌ **Overhead**: Runtime abstraction layer adds latency (~50-100ms)
- ❌ **Complexity**: More files, more interfaces, more concepts
- ❌ **Migration Cost**: Significant refactor of existing code

### Risks

- **High**: Breaking changes in @elizaos/core affect our system
- **Medium**: Performance overhead from runtime layer
- **Medium**: Team unfamiliar with ElizaOS debugging
- **Low**: Package maintenance/security issues

### Complexity Score: 8/10

- Setup complexity: High (runtime initialization, character config)
- Implementation complexity: Medium (clear patterns to follow)
- Maintenance complexity: Medium (dependency updates, version management)

### Performance Impact

| Metric | Change | Reason |
|--------|--------|--------|
| Latency | +5-10% | Runtime layer overhead |
| Memory | +20-30MB | ElizaOS runtime + plugins |
| Bundle Size | +2MB | @elizaos/core package |
| Startup Time | +200-300ms | Runtime initialization |

### Cost: 8-12 hours

- ElizaOS learning: 2 hours
- Runtime setup: 2 hours
- Plugin development: 3 hours
- Adapter development: 2 hours
- Testing: 2 hours
- Debugging/iteration: 1-3 hours

---

## Approach 2: Hybrid ElizaOS Patterns (No Package)

### Description

Implement ElizaOS architectural patterns (Providers, Actions, Evaluators, Services, Plugins) without installing the package. Use TypeScript interfaces that match ElizaOS patterns for future compatibility.

### Files to Add

```
frontend/lib/eliza-patterns/
├── types.ts                        # ElizaOS-compatible interfaces (no package import)
├── runtime-simple.ts               # Minimal runtime implementation
└── plugin-loader.ts                # Simple plugin registration

frontend/lib/srl/
├── srl-provider.ts                 # Expert trajectory provider
├── srl-actions.ts                  # SRL enhancement actions
├── srl-evaluators.ts               # Step reward evaluators
├── srl-service.ts                  # Expert trajectory service
└── srl-plugin.ts                   # Plugin definition

frontend/lib/ebm/
├── ebm-provider.ts                 # Refinement suggestion provider
├── ebm-actions.ts                  # Refinement actions
├── ebm-evaluators.ts               # Energy evaluators
├── ebm-service.ts                  # Energy calculation service
└── ebm-plugin.ts                   # Plugin definition

frontend/lib/eliza-integration.ts   # Integration layer for PERMUTATION
```

### Files to Modify

```
frontend/lib/permutation-engine.ts
- Add: Plugin registration (srl-plugin, ebm-plugin)
- Add: Provider composition before query execution
- Add: Evaluator execution after responses
- Change: Minimal - just add plugin hooks

frontend/lib/srl/swirl-srl-enhancer.ts
- Refactor: Move logic to srl-actions.ts
- Keep: As thin wrapper for backward compatibility

frontend/lib/ebm/answer-refiner-simple.ts
- Refactor: Move logic to ebm-actions.ts
- Keep: As thin wrapper for backward compatibility
```

### Strengths

- ✅ **No Dependencies**: Zero additional packages
- ✅ **Clean Architecture**: ElizaOS patterns enforce separation of concerns
- ✅ **Future Compatible**: Easy migration to full ElizaOS if needed
- ✅ **Performance**: No runtime overhead
- ✅ **Control**: Full control over implementations
- ✅ **Learning**: Team learns patterns without package complexity

### Weaknesses

- ❌ **Pattern Fidelity**: May diverge from official ElizaOS if patterns change
- ❌ **No Type Safety**: Missing @elizaos/core type definitions (but can copy)
- ❌ **Manual Updates**: Need to track ElizaOS pattern changes manually

### Risks

- **Low**: Pattern divergence (mitigated by documentation)
- **Low**: Missing ElizaOS features (we implement only what we need)
- **Very Low**: Performance issues (simpler = faster)

### Complexity Score: 5/10

- Setup complexity: Low (simple interfaces, minimal runtime)
- Implementation complexity: Medium (still need to implement patterns correctly)
- Maintenance complexity: Low (no external dependency to track)

### Performance Impact

| Metric | Change | Reason |
|--------|--------|--------|
| Latency | +0-2% | Minimal abstraction |
| Memory | +5-10MB | Pattern implementations |
| Bundle Size | +50-100KB | New modules |
| Startup Time | +50-100ms | Plugin registration |

### Cost: 4-6 hours

- Interface design: 1 hour
- Provider implementation: 1 hour
- Action implementation: 1 hour
- Evaluator implementation: 30 min
- Service implementation: 30 min
- Plugin packaging: 30 min
- Testing: 1.5 hours

---

## Approach 3: Minimal Refactor (Clean Structure Only)

### Description

Keep existing SRL and EBM implementations, just reorganize for better structure. No ElizaOS patterns, just cleaner code.

### Files to Add

```
frontend/lib/srl/
├── expert-provider.ts              # Extract expert trajectory fetching
└── reward-calculator.ts            # Extract reward calculation

frontend/lib/ebm/
├── energy-calculator.ts            # Extract energy calculation
└── refinement-engine.ts            # Extract refinement logic
```

### Files to Modify

```
frontend/lib/srl/swirl-srl-enhancer.ts
- Refactor: Use extracted modules
- Improve: Better error handling
- Add: More configuration options

frontend/lib/ebm/answer-refiner-simple.ts
- Refactor: Use extracted modules
- Improve: Better convergence detection
- Add: Domain-specific energy functions

frontend/lib/permutation-engine.ts
- Add: Auto-detection of when to use SRL/EBM
- Add: Configuration management
```

### Strengths

- ✅ **Minimal Change**: Least disruption to existing code
- ✅ **Fast**: Quickest to implement
- ✅ **Low Risk**: Small, focused refactor
- ✅ **Familiar**: Team knows existing code

### Weaknesses

- ❌ **Technical Debt**: Doesn't address architectural issues
- ❌ **Not Scalable**: Hard to add new enhancement strategies
- ❌ **Poor Separation**: Logic still coupled
- ❌ **Testing**: Harder to test without clear interfaces
- ❌ **Future Migration**: No path to better architecture

### Risks

- **Medium**: Code becomes harder to maintain over time
- **Medium**: Difficult to add new enhancement strategies
- **Low**: Performance issues (no significant changes)

### Complexity Score: 3/10

- Setup complexity: Very Low (just extract functions)
- Implementation complexity: Low (familiar code)
- Maintenance complexity: Medium-High (debt accumulates)

### Performance Impact

| Metric | Change | Reason |
|--------|--------|--------|
| Latency | 0% | No architectural changes |
| Memory | 0% | Same implementation |
| Bundle Size | 0% | Same code, reorganized |
| Startup Time | 0% | No changes |

### Cost: 2-3 hours

- Extract modules: 1 hour
- Refactor existing: 1 hour
- Testing: 1 hour

---

## Evaluation Matrix

| Criterion | Weight | Approach 1 | Approach 2 | Approach 3 |
|-----------|--------|------------|------------|------------|
| **Architecture Quality** | 20% | 9/10 | 8/10 | 4/10 |
| **Maintainability** | 20% | 7/10 | 9/10 | 5/10 |
| **Performance** | 15% | 6/10 | 9/10 | 10/10 |
| **Implementation Speed** | 15% | 4/10 | 7/10 | 9/10 |
| **Future Scalability** | 15% | 9/10 | 8/10 | 4/10 |
| **Learning Curve** | 10% | 4/10 | 7/10 | 9/10 |
| **Risk Level** | 5% | 5/10 | 8/10 | 7/10 |
| **Total Score** | - | **6.75** | **7.95** | **6.20** |

## Decision: Approach 2 (Hybrid ElizaOS Patterns)

### Rationale

**Approach 2 wins** with highest composite score (7.95/10).

**Why Approach 2?**

1. **Best Balance**: Good architecture without dependency overhead
2. **Clean Patterns**: ElizaOS patterns enforce best practices
3. **Performance**: No runtime overhead (pure TypeScript)
4. **Future-Proof**: Easy migration to full ElizaOS later
5. **Maintainability**: Clear separation of concerns
6. **Cost-Effective**: 4-6 hours vs 8-12 hours (Approach 1)
7. **Team Learning**: Teaches patterns without package complexity

**Why Not Approach 1?**

- Dependency weight not justified for current needs
- Runtime overhead (+5-10% latency) unacceptable
- 8-12 hours vs 4-6 hours (2x cost)
- Team doesn't need full ElizaOS features yet

**Why Not Approach 3?**

- Doesn't solve architectural issues
- Accumulates technical debt
- No clear path to better architecture
- Harder to add future enhancements

### Calculated Risk

**Accepted Risks**:
- Pattern divergence from official ElizaOS (Low probability, Medium impact)
  - **Mitigation**: Document patterns from ElizaOS docs, review quarterly

**Rejected Risks**:
- Dependency on @elizaos/core breaking changes (Approach 1)
- Technical debt accumulation (Approach 3)

## Selected Implementation Plan (Approach 2)

### Phase 1: Core Interfaces (30 min)

**File**: `frontend/lib/eliza-patterns/types.ts`

```typescript
// ElizaOS-compatible interfaces (no package dependency)

export interface Provider {
  name: string;
  description?: string;
  dynamic?: boolean;
  position?: number;
  private?: boolean;
  get: (runtime: Runtime, message: Message, state: State) => Promise<ProviderResult>;
}

export interface Action {
  name: string;
  description: string;
  validate: (runtime: Runtime, message: Message, state: State) => Promise<boolean>;
  handler: Handler;
  examples?: any[];
  effects?: {
    provides: string[];
    requires: string[];
    modifies: string[];
  };
}

export interface Evaluator {
  name: string;
  description: string;
  alwaysRun?: boolean;
  handler: Handler;
  validate: (runtime: Runtime, message: Message, state: State) => Promise<boolean>;
}

export abstract class Service {
  static serviceName: string;
  abstract capabilityDescription: string;
  abstract stop(): Promise<void>;
  static async start(runtime: Runtime): Promise<Service> {
    throw new Error('Not implemented');
  }
}

export interface Plugin {
  name: string;
  description: string;
  providers?: Provider[];
  actions?: Action[];
  evaluators?: Evaluator[];
  services?: (typeof Service)[];
  init?: (runtime: Runtime) => Promise<void>;
}

// Supporting types...
export interface Runtime {
  agentId: string;
  getSetting(key: string): string | undefined;
  getService<T extends Service>(name: string): T | null;
  logger: Logger;
}

export interface Message {
  id: string;
  content: { text: string; [key: string]: any };
  entityId: string;
  roomId: string;
}

export interface State {
  values: { [key: string]: any };
  data: { [key: string]: any };
  text: string;
}

export interface ProviderResult {
  text?: string;
  values?: { [key: string]: any };
  data?: { [key: string]: any };
}

export type Handler = (
  runtime: Runtime,
  message: Message,
  state?: State,
  options?: { [key: string]: unknown },
  callback?: (content: any) => Promise<void>
) => Promise<any>;
```

### Phase 2: SRL Components (2 hours)

**SRL Provider**: `frontend/lib/srl/srl-provider.ts`
**SRL Actions**: `frontend/lib/srl/srl-actions.ts`
**SRL Evaluators**: `frontend/lib/srl/srl-evaluators.ts`
**SRL Service**: `frontend/lib/srl/srl-service.ts`
**SRL Plugin**: `frontend/lib/srl/srl-plugin.ts`

### Phase 3: EBM Components (1.5 hours)

**EBM Provider**: `frontend/lib/ebm/ebm-provider.ts`
**EBM Actions**: `frontend/lib/ebm/ebm-actions.ts`
**EBM Evaluators**: `frontend/lib/ebm/ebm-evaluators.ts`
**EBM Service**: `frontend/lib/ebm/ebm-service.ts`
**EBM Plugin**: `frontend/lib/ebm/ebm-plugin.ts`

### Phase 4: Integration (1 hour)

**Integration Layer**: `frontend/lib/eliza-integration.ts`
**PERMUTATION Engine Update**: `frontend/lib/permutation-engine.ts`

### Phase 5: Testing (1.5 hours)

**Unit Tests**: Mock runtime, test each component
**E2E Tests**: Real execution with plugins
**Benchmarks**: Compare vs baseline

## Implementation Details

### File-by-File Breakdown

See implementation details in next section...

---

**Decision Approved**: Approach 2 (Hybrid ElizaOS Patterns)
**Next Step**: Implementation (4-6 hours estimated)
**Document Version**: 1.0
**Last Updated**: 2025-10-31 01:40AM
