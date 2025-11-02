# ReasoningBank: Empirical Memory Quality Scoring

**Status**: ✅ Fully Implemented

## What Was Added

### Empirical Success Rate Tracking

Memory quality is now tracked **empirically** based on actual usage, not static initialization.

### How It Works

```
1. Memory Retrieval (before task)
   → retrieveRelevantMemories() gets top-K memories
   → Returns memories with database IDs

2. Task Execution
   → Pipeline executes query
   → Determines success/failure (qualityScore > 0.7 = success)

3. Empirical Update (after task)
   → updateMemoryUsageBatch(usedMemoryIds, taskSucceeded)
   → Updates success_rate for each memory used
   → Uses Supabase update_memory_usage() function

4. Moving Average Calculation
   success_rate = (current_rate * usage_count + success) / (usage_count + 1)
```

### Implementation Details

#### 1. Memory Retrieval with Stats

**File**: `frontend/lib/arcmemo-reasoning-bank.ts` → `retrieveRelevantMemories()`

**Changes**:
- Now loads current `usage_count` and `success_rate` from Supabase
- Returns memories with up-to-date statistics
- Memory IDs are preserved for tracking

#### 2. Empirical Update Method

**File**: `frontend/lib/arcmemo-reasoning-bank.ts` → `updateMemorySuccessRate()`

**Function**:
```typescript
async updateMemorySuccessRate(
  memoryId: string,
  taskSucceeded: boolean
): Promise<void>
```

**What it does**:
- Calls Supabase `update_memory_usage()` function
- Atomically updates:
  - `usage_count = usage_count + 1`
  - `success_rate = moving_average`
  - `last_used = NOW()`

**Moving Average Formula**:
```sql
success_rate = CASE 
  WHEN usage_count = 0 THEN 
    CASE WHEN was_successful THEN 1.0 ELSE 0.0 END
  ELSE 
    (success_rate * usage_count + CASE WHEN was_successful THEN 1.0 ELSE 0.0 END) / (usage_count + 1)
END
```

#### 3. Batch Update

**File**: `frontend/lib/arcmemo-reasoning-bank.ts` → `updateMemoryUsageBatch()`

**Function**:
```typescript
async updateMemoryUsageBatch(
  memoryIds: string[],
  taskSucceeded: boolean
): Promise<void>
```

Updates all memories used in a task in parallel.

#### 4. Pipeline Integration

**File**: `frontend/lib/unified-permutation-pipeline.ts` → Lines 710-763

**Flow**:
1. **Before execution**: Retrieve relevant memories (track IDs)
2. **After execution**: 
   - Determine task success (qualityScore > 0.7)
   - Update empirical success rates for all used memories
   - Extract new memories from experience

**Metadata Added**:
- `reasoningbank_memories_used`: Number of memories used
- `reasoningbank_memories_used_ids`: Array of memory IDs used

## Database Function

The Supabase migration already includes `update_memory_usage()`:

```sql
CREATE OR REPLACE FUNCTION update_memory_usage(
  memory_id BIGINT,
  was_successful BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE reasoning_memory_items
  SET 
    usage_count = usage_count + 1,
    success_rate = CASE 
      WHEN usage_count = 0 THEN 
        CASE WHEN was_successful THEN 1.0 ELSE 0.0 END
      ELSE 
        (success_rate * usage_count + CASE WHEN was_successful THEN 1.0 ELSE 0.0 END) / (usage_count + 1)
    END,
    last_used = NOW()
  WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;
```

## Example Flow

### Task 1: Uses Memory A (successRate: 0.0, usageCount: 0)
- Task succeeds
- Update: `successRate = 1.0, usageCount = 1`

### Task 2: Uses Memory A (successRate: 1.0, usageCount: 1)
- Task fails
- Update: `successRate = (1.0 * 1 + 0.0) / 2 = 0.5, usageCount = 2`

### Task 3: Uses Memory A (successRate: 0.5, usageCount: 2)
- Task succeeds
- Update: `successRate = (0.5 * 2 + 1.0) / 3 = 0.667, usageCount = 3`

## Retrieval Scoring

Memories are now ranked by **actual empirical performance**:

```typescript
score = successRate * log(usageCount + 1) / recency
```

Where:
- `successRate`: Moving average of actual task successes (0.0 - 1.0)
- `usageCount`: Number of times memory was used
- `recency`: Time since last use

## Benefits

1. **Self-Improving**: Memories with high success rates rise to top
2. **Empirical**: Based on real usage, not assumptions
3. **Adaptive**: Poor memories naturally deprioritized
4. **Paper-Aligned**: Matches ReasoningBank's empirical tracking approach

## Monitoring

The system logs:
- `✅ Updated memory {id}: {success|failure} (empirical tracking)`
- `📊 Updating empirical success rates for {N} memories (task {succeeded|failed})`
- Metadata includes `reasoningbank_memories_used` count

## Next Steps

To fully utilize this:
1. Inject retrieved memories into agent's context (currently only tracked)
2. Use memories to guide decision-making during execution
3. Monitor success rate trends over time

The empirical tracking infrastructure is now complete and operational.

