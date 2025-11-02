# Context vs Attention: Architectural Distinction

## Fundamental Principle

**Context ≠ Attention**

This is a critical architectural distinction that must be maintained throughout the system.

## Definitions

### Context (What We Provide)

**Context** = External information we **inject** into the prompt before inference

- **Source**: External systems (databases, memory, retrieval, APIs)
- **Control**: **We control** what context is included
- **Timing**: **Pre-inference** (before the model processes)
- **Format**: Structured text/markdown added to prompt
- **Examples**:
  - ReasoningBank memories retrieved from Supabase
  - Conversation history
  - Retrieved knowledge base entries
  - User preferences
  - Domain-specific strategies

### Attention (What Model Computes)

**Attention** = Transformer's **internal mechanism** for focusing on different parts of input

- **Source**: Model's learned parameters (weights)
- **Control**: **Model controls** (we don't directly manipulate)
- **Timing**: **During inference** (inside the model)
- **Format**: Learned attention weights over tokens
- **Examples**:
  - Which tokens get more weight
  - Cross-attention between query and context
  - Self-attention within the sequence
  - Head-level attention patterns

## Why This Distinction Matters

### 1. Separation of Concerns

```
┌─────────────────────────────────────────┐
│  OUR SYSTEM (Context Engineering)       │
│  ┌───────────────────────────────────┐ │
│  │ Retrieve ReasoningBank memories  │ │
│  │ Assemble conversation history     │ │
│  │ Format structured context         │ │
│  └───────────────────────────────────┘ │
│           ↓ (inject as prompt text)    │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  MODEL INTERNAL (Attention)             │
│  ┌───────────────────────────────────┐ │
│  │ Compute attention weights        │ │
│  │ Focus on relevant tokens          │ │
│  │ Cross-attention patterns         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. We Control Context, Not Attention

**What we CAN do:**
- ✅ Retrieve relevant ReasoningBank memories
- ✅ Format them as structured text
- ✅ Inject them into the prompt
- ✅ Order them by relevance
- ✅ Include/exclude based on quality scores

**What we CANNOT do (and shouldn't try):**
- ❌ Directly set attention weights
- ❌ Force the model to focus on specific tokens
- ❌ Manipulate attention mechanisms
- ❌ Override transformer attention

### 3. Context Quality → Better Attention (Indirectly)

By providing **high-quality, well-structured context**, we indirectly influence attention:

```
Good Context = Model naturally focuses on relevant parts via attention
Bad Context = Model struggles, attention may be scattered
```

But we achieve this **indirectly** through context engineering, not by manipulating attention.

## Current Implementation Analysis

### ✅ Correct: Context Assembly

**File**: `frontend/lib/unified-permutation-pipeline.ts`

```typescript
// ✅ CORRECT: Assembling context (external information)
const retrievedMemories = await reasoningBank.retrieveRelevantMemories(
  query, 
  detectedDomain, 
  5
);

// ✅ CORRECT: Injecting context as text
const contextString = retrievedMemories
  .map(m => `Memory: ${m.title}\n${m.description}`)
  .join('\n\n');

// Then pass to model as part of prompt
const prompt = `${contextString}\n\nQuery: ${query}`;
```

This is **context engineering** - we control what information is provided.

### ✅ Correct: Model Handles Attention

The model's transformer architecture automatically:
- Computes attention over all tokens (query + context)
- Focuses on relevant parts
- Uses cross-attention between query and context

We **don't** try to control this - it's the model's internal mechanism.

## ReasoningBank: Context, Not Attention

### How ReasoningBank Works (Context)

1. **Retrieve** memories from Supabase (context source)
2. **Filter** by relevance, domain, success rate (context selection)
3. **Format** as structured text (context formatting)
4. **Inject** into prompt (context injection)
5. **Model** uses attention to process it (attention is automatic)

```typescript
// ✅ ReasoningBank provides CONTEXT
const memories = await reasoningBank.retrieveRelevantMemories(query, domain, 5);

// Format as context text
const memoryContext = memories.map(m => 
  `## ${m.title}\n${m.description}\n${m.content}`
).join('\n\n');

// Inject into prompt (context)
const fullPrompt = `${memoryContext}\n\nUser Query: ${query}`;

// Model processes this with attention (automatic)
const response = await model.generate(fullPrompt);
```

### What We're NOT Doing

```typescript
// ❌ WRONG: We don't try to control attention
model.setAttentionWeights(memories[0].id, 0.9); // ❌ This doesn't exist
model.focusOn(tokenIndex, weight); // ❌ This is not our job
```

## ACE Framework: Context Engineering

ACE (Agentic Context Engineering) is a **context engineering** framework:

1. **Curate** strategies (context selection)
2. **Generate** structured playbooks (context formatting)
3. **Inject** into prompts (context injection)

ACE does **not** manipulate attention - it provides better context that the model processes naturally.

## SWiRL: Context for Reasoning

SWiRL provides **structured reasoning context**:
- Multi-step decomposition (context structure)
- Step-by-step instructions (context content)
- Tool usage guidance (context metadata)

Model's attention processes this context, but we control what context is provided.

## RVS: Verification Context

RVS provides **verification context**:
- Previous reasoning steps (context history)
- Verification criteria (context rules)
- Iterative refinements (context evolution)

Again, context engineering, not attention manipulation.

## Best Practices

### ✅ DO: Focus on Context Quality

1. **Retrieve** relevant, high-quality information
2. **Structure** context clearly (markdown, sections)
3. **Order** by relevance (most important first)
4. **Filter** low-quality or irrelevant context
5. **Format** for clarity (models process structured text better)

### ❌ DON'T: Try to Control Attention

1. Don't assume we can manipulate attention weights
2. Don't try to force focus on specific tokens
3. Don't override transformer mechanisms
4. Don't confuse context with attention

## Research Alignment

**Retrieval-Augmented Generation (RAG)**:
- Retrieval = Context engineering (we control)
- Generation = Model uses attention (automatic)

**In-Context Learning**:
- Few-shot examples = Context (we provide)
- Learning = Model attention processes it (automatic)

**Prompt Engineering**:
- Prompt design = Context formatting (we control)
- Model understanding = Attention processes it (automatic)

## Implementation Checklist

When implementing context features:

- [ ] Is this **context** (external information we provide)?
- [ ] Are we **injecting** it into the prompt?
- [ ] Does it happen **pre-inference**?
- [ ] Are we **formatting** it as text?

If yes → ✅ Context engineering (correct)

- [ ] Are we trying to manipulate **attention weights**?
- [ ] Are we trying to control **token-level focus**?
- [ ] Are we trying to override **transformer mechanisms**?

If yes → ❌ Attention manipulation (incorrect - don't do this)

## Summary

**Context** = What we provide (external, pre-inference, text-based)
**Attention** = What model computes (internal, during inference, weight-based)

Our job: **Context engineering** (provide excellent context)
Model's job: **Attention processing** (naturally focus on relevant parts)

By maintaining this distinction, we ensure:
1. Clean architecture
2. Proper separation of concerns
3. Research-aligned implementation
4. Scalable context engineering

