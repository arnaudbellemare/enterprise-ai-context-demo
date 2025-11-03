# Self-Discovery Prompting vs PERMUTATION: Technical Comparison

**Date**: 2025-11-02  
**Source**: Self-Discovery Prompting (arxiv.org/pdf/2402.03620.pdf)  
**Purpose**: Compare with PERMUTATION system and identify improvements

---

## 📊 Architecture Comparison

### Self-Discovery Prompting Framework

```
Query → SelectModules → AdaptModules → ImplementStructure → Solver → Evaluation
  ↓           ↓              ↓                ↓              ↓          ↓
Task    Select relevant   Adapt to task   Create JSON    Execute   LLM-as-Judge
      reasoning modules   context  reasoning plan  step-by-step
```

**Key Components**:
1. **Reasoning Module Library**: 37+ predefined heuristics/strategies
2. **SelectModules**: Task-aware module selection
3. **AdaptModules**: Context-specific adaptation
4. **ImplementStructure**: Explicit JSON reasoning plan
5. **Solver**: Step-by-step execution
6. **LLMAnswerEvaluation**: Solution validation

### PERMUTATION System

```
Query → IRT Routing → Component Selection → Unified Pipeline → Answer → Judge
  ↓           ↓              ↓                    ↓             ↓        ↓
Task    Difficulty calc  Multi-component    ACE+GEPA+DSPy   Response Evaluation
                          orchestration      +RVS+SWiRL+EBM
```

**Key Components**:
1. **IRT Calculator**: Query difficulty assessment
2. **Component Router**: ACE, GEPA, DSPy, RVS, SWiRL, EBM selection
3. **Unified Pipeline**: Parallel/sequential execution
4. **Dynamic Optimization**: GEPA genetic algorithms
5. **Teacher-Student**: Knowledge distillation
6. **Enhanced Judge**: Multi-faceted evaluation

---

## 🔍 Detailed Comparison

### 1. Module Selection vs Component Routing

| Aspect | Self-Discovery | PERMUTATION |
|--------|---------------|-------------|
| **Selection Method** | DSPy ChainOfThought based on task description | IRT difficulty + domain detection |
| **Modules Available** | 37 predefined reasoning heuristics | 11+ AI components (ACE, GEPA, DSPy, etc.) |
| **Selection Criteria** | Semantic similarity to task | Query difficulty (IRT score) |
| **Granularity** | Fine-grained (reasoning strategies) | Coarse-grained (entire components) |
| **Adaptability** | Static library, dynamic selection | Dynamic component orchestration |

**Key Insight**: Self-Discovery uses **reasoning heuristics** while PERMUTATION uses **full AI components**. Self-Discovery is more granular.

### 2. Module Adaptation

| Aspect | Self-Discovery | PERMUTATION |
|--------|---------------|-------------|
| **Adaptation Step** | ✅ Explicit AdaptModules component | ❌ No explicit adaptation step |
| **Mechanism** | Re-phrases reasoning modules for task context | Component configuration (GEPA optimization) |
| **Output** | Task-specific adapted reasoning modules | Optimized component prompts |
| **Granularity** | Per-module adaptation | Per-component optimization |

**Key Insight**: PERMUTATION **lacks explicit adaptation** of selected components to task context.

### 3. Reasoning Structure

| Aspect | Self-Discovery | PERMUTATION |
|--------|---------------|-------------|
| **Structure Format** | ✅ Explicit JSON reasoning plan | ⚠️ Implicit pipeline execution |
| **Structure Content** | Step-by-step plan with actions | Component execution trace |
| **Explicitness** | High (each step defined) | Low (orchestration-driven) |
| **Traceability** | Clear reasoning path | Component-level traces |

**Key Insight**: Self-Discovery creates **explicit reasoning structures** while PERMUTATION uses **implicit orchestration**.

### 4. Execution Model

| Aspect | Self-Discovery | PERMUTATION |
|--------|---------------|-------------|
| **Execution Type** | Sequential step-by-step | Parallel + sequential phases |
| **Control Flow** | Follows JSON reasoning plan | Dynamic component routing |
| **Flexibility** | Rigid (follows plan) | Flexible (adapts to needs) |
| **Transparency** | High (explicit steps) | Medium (component-level) |

**Key Insight**: PERMUTATION is more **flexible but less transparent** than Self-Discovery.

### 5. Evaluation

| Aspect | Self-Discovery | PERMUTATION |
|--------|---------------|-------------|
| **Evaluation Method** | LLM-as-Judge (DSPy module) | Multi-faceted judge system |
| **Evaluation Scope** | Solution correctness | Quality, confidence, effectiveness |
| **Evaluation Granularity** | Per-answer evaluation | Component + overall evaluation |

---

## 🎯 Key Improvements to Adopt from Self-Discovery

### 1. Explicit Reasoning Structure Generation ⭐⭐⭐

**What Self-Discovery Does**:
- Creates explicit JSON reasoning plans with steps, descriptions, and actions
- Makes reasoning process transparent and traceable

**What PERMUTATION Currently Does**:
- Uses implicit component orchestration
- Reasoning path is less explicit

**Improvement Opportunity**:
```typescript
// Add to unified-pipeline.ts
interface ReasoningStructure {
  steps: Array<{
    step: number;
    description: string;
    action: string;
    component: string;
  }>;
  conclusion: {
    description: string;
    action: string;
  };
}

class ImplementReasoningStructure {
  async generate(
    query: string,
    selectedComponents: string[],
    context: any
  ): Promise<ReasoningStructure> {
    // Generate explicit step-by-step reasoning plan
    // Similar to Self-Discovery's ImplementStructure
  }
}
```

**Impact**: Better explainability, debugging, and user trust

---

### 2. Reasoning Module Library ⭐⭐⭐

**What Self-Discovery Does**:
- 37 predefined reasoning heuristics:
  - "How can I simplify the problem?"
  - "What are the key assumptions?"
  - "Let's think step by step"
  - "Use systems thinking"
  - etc.

**What PERMUTATION Currently Does**:
- Has component-level strategies (ACE, GEPA, etc.)
- No fine-grained reasoning heuristics library

**Improvement Opportunity**:
```typescript
// Create reasoning-modules.ts
export const REASONING_MODULES = [
  "How could I devise an experiment to help solve that problem?",
  "Make a list of ideas for solving this problem...",
  "How could I measure progress on this problem?",
  "How can I simplify the problem so that it is easier to solve?",
  "What are the key assumptions underlying this problem?",
  "What are the potential risks and drawbacks of each solution?",
  "Critical Thinking: Analyze from different perspectives...",
  "Creative thinking: Generate innovative ideas...",
  "Systems thinking: Consider as part of larger system...",
  // ... 37 total modules
];

class ReasoningModuleSelector {
  async select(query: string, domain: string): Promise<string[]> {
    // Select relevant reasoning modules for task
    // Use DSPy ChainOfThought or semantic similarity
  }
}
```

**Impact**: More granular reasoning control, better problem-solving strategies

---

### 3. Module Adaptation Step ⭐⭐

**What Self-Discovery Does**:
- Adapts selected reasoning modules to specific task context
- Re-phrases generic modules for task-specific use

**What PERMUTATION Currently Does**:
- Optimizes component prompts (GEPA)
- But doesn't explicitly adapt selected components

**Improvement Opportunity**:
```typescript
// Add to unified-pipeline.ts
class ComponentAdapter {
  async adapt(
    selectedComponents: string[],
    query: string,
    domain: string,
    context: any
  ): Promise<AdaptedComponent[]> {
    // Adapt component strategies to specific task
    // Similar to Self-Discovery's AdaptModules
    // Example: ACE strategy "analyze context" → 
    // "analyze customer satisfaction metrics for online store"
  }
}
```

**Impact**: Better component-task alignment, improved relevance

---

### 4. Structured Step-by-Step Execution ⭐⭐

**What Self-Discovery Does**:
- Executes reasoning structure step-by-step
- Each step produces intermediate results
- Clear progression through reasoning plan

**What PERMUTATION Currently Does**:
- Executes components but not always step-by-step
- Parallel execution reduces step visibility

**Improvement Opportunity**:
```typescript
// Enhance unified-pipeline.ts
interface StepExecution {
  step: number;
  description: string;
  component: string;
  input: any;
  output: any;
  timestamp: number;
}

class StructuredExecutor {
  async execute(
    reasoningStructure: ReasoningStructure,
    query: string
  ): Promise<StepExecution[]> {
    // Execute each step explicitly
    // Track intermediate results
  }
}
```

**Impact**: Better debugging, progress tracking, user experience

---

## 🔄 Integration Strategy

### Option 1: Hybrid Approach (Recommended)

Combine Self-Discovery's structure with PERMUTATION's flexibility:

```
Query 
  ↓
IRT Difficulty Assessment
  ↓
SelectComponents (PERMUTATION) + SelectReasoningModules (Self-Discovery)
  ↓
AdaptComponents + AdaptModules
  ↓
ImplementReasoningStructure (Self-Discovery)
  ↓
Execute with PERMUTATION Pipeline (with explicit steps)
  ↓
Enhanced Evaluation (PERMUTATION's multi-faceted judge)
```

### Option 2: Add Self-Discovery as a Component

Make Self-Discovery one of PERMUTATION's components:

```typescript
// Add to unified-pipeline.ts config
enableSelfDiscovery: boolean;
selfDiscoveryThreshold?: number; // IRT threshold to activate

// In pipeline execution
if (config.enableSelfDiscovery && irtDifficulty > config.selfDiscoveryThreshold) {
  const selfDiscovery = new SelfDiscoveryModule();
  const reasoningPlan = await selfDiscovery.generatePlan(query);
  const solution = await selfDiscovery.execute(reasoningPlan);
}
```

---

## 📈 Expected Improvements

| Improvement | Impact | Effort | Priority |
|------------|--------|--------|-----------|
| **Explicit Reasoning Structures** | 🔥🔥🔥 High | Medium | P0 |
| **Reasoning Module Library** | 🔥🔥 Medium | Low-Medium | P1 |
| **Module Adaptation** | 🔥🔥 Medium | Medium | P1 |
| **Structured Execution** | 🔥 Low-Medium | Medium | P2 |

---

## 💡 Recommendations

### Immediate (P0)
1. **Add Reasoning Structure Generation**
   - Implement `ImplementReasoningStructure` module
   - Generate explicit JSON reasoning plans
   - Integrate with existing pipeline

### Short-term (P1)
2. **Create Reasoning Module Library**
   - Extract 37 reasoning heuristics from Self-Discovery
   - Implement `ReasoningModuleSelector`
   - Add to ACE framework or as separate component

3. **Add Module Adaptation Step**
   - Implement `ComponentAdapter`
   - Adapt selected components to task context
   - Bridge between selection and execution

### Long-term (P2)
4. **Enhanced Structured Execution**
   - Track step-by-step execution
   - Provide intermediate results
   - Improve debugging and transparency

---

## 🎓 Key Learnings

1. **Explicitness > Implicitness**: Explicit reasoning structures improve transparency and debugging
2. **Granularity Matters**: Fine-grained reasoning modules provide better control than component-level selection
3. **Adaptation is Critical**: Selected components should be adapted to task context before execution
4. **Structure Enables Execution**: Explicit reasoning plans enable better step-by-step execution

---

## 📝 Implementation Notes

### Compatibility with PERMUTATION
- ✅ Works with existing DSPy-GEPA optimizer
- ✅ Compatible with IRT routing
- ✅ Can integrate with ACE framework
- ✅ Enhances existing judge system

### Technical Considerations
- Reasoning structures can be stored in ReasoningBank
- Module selection can use existing semantic similarity
- Adaptation can leverage GEPA optimization
- Execution can use existing component infrastructure

---

## 🔗 References

- Self-Discovery Prompting: https://arxiv.org/pdf/2402.03620.pdf
- DSPy Documentation: https://dspy-docs.vercel.app/
- PERMUTATION Architecture: See `PERMUTATION_ARCHITECTURE.md`




