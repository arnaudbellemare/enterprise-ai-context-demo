# 📦 Actual Modules Map - What Really Exists

This is the **REAL** module structure to avoid "Module not found" errors.

## ✅ Core Engine

### PermutationEngine
- **File**: `@/lib/permutation-engine`
- **Export**: `PermutationEngine` class
- **What it has**:
  - `execute(query)` - Main execution (returns IRT, domain, etc. in metadata)
  - Private: `detectDomain()`, `calculateIRT()`, `getLoRAParameters()`
  - Access via: `engine.execute(query).metadata.{irt_difficulty, domain}`

## ✅ LLM Clients

### ACE LLM Client
- **File**: `@/lib/ace-llm-client`
- **Export**: `ACELLMClient` class
- **Methods**: `generate(prompt, useTeacher)`

## ✅ Query Processing

### Multi-Query Expansion
- **File**: `@/lib/multi-query-expansion`
- **Export**: `createMultiQueryExpansion()` function
- **Methods**: `expandQuery(query)`

### SWiRL Decomposer
- **File**: `@/lib/swirl-decomposer`
- **Export**: `createSWiRLDecomposer()` function
- **Methods**: `decompose(query)`

## ✅ Memory & Reasoning

### ReasoningBank (ACE Version)
- **File**: `@/lib/ace-reasoningbank`
- **Exports**: 
  - `ACEReasoningBank` class
  - `createACEReasoningBank()` function ✅ Use this!
- **Methods**: `retrieveRelevant(task, topK)`

### ArcMemo ReasoningBank
- **File**: `@/lib/arcmemo-reasoning-bank`
- **Export**: `ArcMemoReasoningBank` class

## ✅ Optimization

### LoRA Auto Tuner
- **File**: `@/lib/lora-auto-tuner`
- **Export**: `LoRAAutoTuner` class

### Advanced Cache System
- **File**: `@/lib/advanced-cache-system`
- **Export**: `getAdvancedCache()` function (singleton)
- **Methods**: `get(key)`, `set(key, value, ttl, metadata)`

### Smart Router
- **File**: `@/lib/smart-router`
- **Export**: `getSmartRouter()` function (singleton)

### Parallel Execution Engine
- **File**: `@/lib/parallel-execution-engine`
- **Export**: `getParallelEngine()` function (singleton)
- **Methods**: `executeParallel(tasks)`

### Optimized Permutation Engine
- **File**: `@/lib/optimized-permutation-engine`
- **Export**: `getOptimizedEngine()` function (singleton)

### Adaptive Prompt System
- **File**: `@/lib/adaptive-prompt-system`
- **Export**: `getAdaptivePromptSystem()` function (singleton)
- **Methods**: `getAdaptivePrompt(query, context)`

## ✅ Observability

### DSPy Observability
- **File**: `@/lib/dspy-observability`
- **Export**: `getTracer()` function (singleton)
- **Methods**: `startSession()`, `endSession()`, `logTeacherCall()`, `logStudentCall()`

## ❌ Modules That DON'T Exist

These were mistakes in the code - **DO NOT IMPORT**:

- ❌ `@/lib/irt-routing` - Doesn't exist! Use `PermutationEngine.execute().metadata.irt_difficulty`
- ❌ `@/lib/lora-adapter` - Doesn't exist! Use `@/lib/lora-auto-tuner`
- ❌ `@/lib/domain-detection` - Doesn't exist! Use `PermutationEngine.execute().metadata.domain`
- ❌ `@/lib/reasoning-bank` - Doesn't exist! Use `@/lib/ace-reasoningbank`

## 🎯 Quick Reference

| Need This | Import This | Use This |
|-----------|-------------|----------|
| **IRT Score** | `@/lib/permutation-engine` | `new PermutationEngine().execute(query).metadata.irt_difficulty` |
| **Domain Detection** | `@/lib/permutation-engine` | `new PermutationEngine().execute(query).metadata.domain` |
| **LoRA Parameters** | `@/lib/lora-auto-tuner` | `new LoRAAutoTuner()` |
| **Reasoning Bank** | `@/lib/ace-reasoningbank` | `createACEReasoningBank().retrieveRelevant(query, 3)` |
| **Multi-Query** | `@/lib/multi-query-expansion` | `createMultiQueryExpansion().expandQuery(query)` |
| **SWiRL Decompose** | `@/lib/swirl-decomposer` | `createSWiRLDecomposer().decompose(query)` |
| **Teacher/Student LLM** | `@/lib/ace-llm-client` | `new ACELLMClient().generate(prompt, useTeacher)` |
| **KV Cache** | `@/lib/advanced-cache-system` | `getAdvancedCache().get(key)` or `.set(key, value, ttl, metadata)` |
| **Smart Routing** | `@/lib/smart-router` | `getSmartRouter()` |
| **Parallel Execution** | `@/lib/parallel-execution-engine` | `getParallelEngine().executeParallel(tasks)` |
| **Adaptive Prompts** | `@/lib/adaptive-prompt-system` | `getAdaptivePromptSystem().getAdaptivePrompt(query, context)` |
| **Tracing** | `@/lib/dspy-observability` | `getTracer()` |

## 📝 Verification Commands

To check if a module exists:
```bash
# Check if file exists
ls frontend/lib/[module-name].ts

# Search for exports
grep "export" frontend/lib/[module-name].ts
```

## 🚀 Usage Examples

### Get IRT Score
```typescript
const { PermutationEngine } = await import('@/lib/permutation-engine');
const engine = new PermutationEngine();
const result = await engine.execute(query);
const irtScore = result.metadata?.irt_difficulty || 0.5;
```

### Get Domain
```typescript
const { PermutationEngine } = await import('@/lib/permutation-engine');
const engine = new PermutationEngine();
const result = await engine.execute(query);
const domain = result.metadata?.domain || 'general';
```

### Use ReasoningBank
```typescript
const { createACEReasoningBank } = await import('@/lib/ace-reasoningbank');
const bank = createACEReasoningBank();
const memories = await bank.retrieveRelevant(query, 3);
```

### Use LoRA
```typescript
const { LoRAAutoTuner } = await import('@/lib/lora-auto-tuner');
const tuner = new LoRAAutoTuner();
// Use tuner methods
```

---

**Last Updated**: October 15, 2025
**Status**: ✅ Verified and Correct

