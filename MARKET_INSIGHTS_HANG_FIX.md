# Market Insights Hang Fix

## Problem
Test has been running for 4+ hours with no results. The fetch call to Ollama is hanging indefinitely.

## Root Cause
The `fetch` call to Ollama may hang at the network level before the timeout can trigger. The AbortController timeout should work, but if the connection never establishes, it might not fire properly.

## Immediate Fix

### 1. Add Hard Timeout Wrapper

Wrap the entire LLM call in a Promise.race with a hard timeout:

```typescript
// In market-insights-service.ts generateMarketInsights method
const llmCallPromise = callPerplexityWithRateLimiting(messages, {
  temperature: 0.7,
  maxTokens: 1500,
  timeout: 180000
});

const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Hard timeout: LLM call exceeded 200 seconds')), 200000)
);

const llmResult = await Promise.race([llmCallPromise, timeoutPromise]);
```

### 2. Fix Ollama Fetch Timeout

The AbortController might not work if the connection hangs. Add a connection timeout:

```typescript
// In llm-helpers.ts Ollama fetch
const connectionTimeout = setTimeout(() => {
  controller.abort();
  throw new Error('Ollama connection timeout - service may not be responding');
}, 10000); // 10 second connection timeout

// Clear both timeouts
clearTimeout(timeoutId);
clearTimeout(connectionTimeout);
```

### 3. Add Request Validation

Check if Ollama is actually responding before making the full request:

```typescript
// Quick health check
const healthCheck = await fetch(`${ollamaUrl}/api/tags`, {
  signal: AbortSignal.timeout(5000)
}).catch(() => null);

if (!healthCheck || !healthCheck.ok) {
  throw new Error('Ollama is not responding - check if service is running');
}
```

### 4. Fix Regex Potential Hangs

The regex patterns could theoretically hang on malformed input. Add limits:

```typescript
// Add max iterations to regex loops
let iterations = 0;
const MAX_ITERATIONS = 1000;

while ((match = pattern.exec(text)) !== null && iterations++ < MAX_ITERATIONS) {
  // ...
}
```

## Quick Test Fix

Add timeout to the test itself:

```typescript
// In test-market-insights-fast.ts
const testPromise = marketInsightsService.generateMarketInsights(config);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Test timeout after 5 minutes')), 300000)
);

const insights = await Promise.race([testPromise, timeoutPromise]);
```

## Files to Fix

1. `frontend/lib/market-insights/market-insights-service.ts` - Add hard timeout wrapper
2. `frontend/lib/brain-skills/llm-helpers.ts` - Fix Ollama connection timeout
3. `test-market-insights-fast.ts` - Add test-level timeout
4. `frontend/lib/market-insights/market-insights-service.ts` - Add regex iteration limits


