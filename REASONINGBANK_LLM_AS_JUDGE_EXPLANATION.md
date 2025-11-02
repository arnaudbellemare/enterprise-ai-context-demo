# ReasoningBank: LLM-as-Judge Usage

## Current Implementation

### 1. **Self-Judgment (Experience Labeling)**

**Purpose**: Determine if an agent trajectory was successful or failed
**Location**: `frontend/lib/arcmemo-reasoning-bank.ts` → `selfJudgeExperience()`

**What it does**:
- Uses LLM-as-judge with exact prompt from ReasoningBank paper (Figure 9)
- Evaluates agent execution without ground truth labels
- Classifies trajectory as "success" or "failure"
- Returns confidence score (0.0-1.0)

**When it's called**:
- Before memory extraction from an experience
- If `experience.selfJudgment` is not already present

**Prompt Details**:
```
Temperature: 0.0 (deterministic)
Model: gemma3:4b (Ollama)
Output Format:
  Thoughts: <reasoning process>
  Status: "success" or "failure"
```

**Task Types Evaluated**:
1. Information seeking - Bot must contain requested info
2. Site navigation - Examines action history + final state
3. Content modification - Examines action history + final state

### 2. **Memory Success Rate Tracking**

**Current State**: Static initialization
- Success experience → `successRate: 1.0`
- Failure experience → `successRate: 0.0`
- **NOT updated** when memory is actually used

**Issue**: We're not tracking whether using a memory item actually leads to success in future tasks.

**Retrieval Scoring**:
Memories are ranked by:
```typescript
score = successRate * log(usageCount + 1) / recency
```

But `successRate` doesn't reflect actual effectiveness!

## What's Missing

### Memory Quality Evaluation

According to ReasoningBank paper, we should:
1. Track when a memory is retrieved and used
2. Evaluate if the task succeeded when that memory was used
3. Update `successRate` based on empirical performance

**Proposed Addition**:

```typescript
async updateMemorySuccessRate(
  memoryId: string,
  taskSucceeded: boolean
): Promise<void> {
  const memory = this.memoryBank.get(memoryId);
  if (!memory) return;
  
  // Update success rate (moving average)
  const total = memory.usageCount + 1;
  memory.successRate = (
    (memory.successRate * memory.usageCount) + 
    (taskSucceeded ? 1.0 : 0.0)
  ) / total;
  memory.usageCount = total;
  memory.lastUsed = new Date();
  
  // Persist to Supabase
  await this.updateMemoryInSupabase(memory);
}
```

### LLM-as-Judge for Memory Quality

We could also use LLM-as-judge to evaluate:
- Whether a memory item is still relevant/useful
- Whether the extracted memory quality is high
- Whether a memory should be deprecated

But the paper doesn't specify this - it relies on empirical tracking.

## Summary

**Current Usage of LLM-as-Judge**:
✅ **Experience Labeling**: Binary success/failure classification
- Exact prompt from paper (Figure 9)
- Temperature 0.0 for deterministic results
- Used before memory extraction

**NOT Currently Using LLM-as-Judge For**:
❌ Memory quality scoring (relies on empirical success_rate)
❌ Ongoing evaluation of memory effectiveness
❌ Memory relevance assessment

**Current Scoring Mechanism**:
- **Experience Judgment**: LLM-as-judge (binary: success/failure)
- **Memory Retrieval Scoring**: `successRate * log(usageCount) / recency` (empirical)
- **Memory Quality**: Static (1.0 for success experiences, 0.0 for failures)

The system needs to update `successRate` based on actual usage results to make retrieval scoring meaningful.

