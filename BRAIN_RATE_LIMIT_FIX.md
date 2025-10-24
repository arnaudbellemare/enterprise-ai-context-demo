# Brain API Rate Limiting Issues - Fix Summary

## 🐛 Problem Identified

The Brain API is experiencing rate limiting issues because:

1. **Direct API Calls**: `moe-orchestrator.ts` and other components make direct `fetch()` calls to Perplexity API
2. **No Rate Limiter Integration**: Existing `api-rate-limiter.ts` infrastructure is NOT being used
3. **Multiple Concurrent Calls**: Brain skills system can fire multiple Perplexity requests simultaneously
4. **No Retry Logic**: When 429 errors occur, requests fail without automatic retry
5. **No Fallback**: No automatic fallback to Ollama or other providers when rate limited

### Evidence

```typescript
// From moe-orchestrator.ts line 435-438
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,  // Direct call!
    'Content-Type': 'application/json'
  },
  // ... No rate limiting, no retry, no fallback
});
```

**Found in**:
- `lib/brain-skills/moe-orchestrator.ts` - 10+ direct Perplexity calls
- `lib/teacher-student-system.ts` - 2 direct calls
- `lib/gepa-teacher-student.ts` - 2 direct calls

---

## ✅ Solution

### Quick Fix: Use Existing Rate Limiter

The `api-rate-limiter.ts` already has:
- ✅ Rate limit tracking (20 req/min, 500 req/hour for Perplexity)
- ✅ Automatic provider rotation
- ✅ Cooldown period management
- ✅ Fallback to Ollama local

**Just need to integrate it!**

---

## 🚀 Implementation Steps

### Step 1: Create Wrapper Function

```typescript
// In lib/brain-skills/llm-helpers.ts (NEW FILE)
import { apiRateLimiter } from '../api-rate-limiter';

export async function callPerplexityWithRateLimiting(
  messages: any[],
  model: string = 'llama-3.1-sonar-large-128k-online',
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  try {
    const result = await apiRateLimiter.makeRequest(
      async (provider) => {
        if (provider.name === 'Perplexity') {
          return fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.maxTokens ?? 4000
            })
          });
        } else if (provider.name === 'Ollama Local') {
          // Fallback to Ollama
          return fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.1',
              messages,
              stream: false
            })
          });
        }
        throw new Error('Unsupported provider');
      },
      'perplexity',
      ['ollama']
    );

    if (!result.response.ok) {
      throw new Error(`API call failed: ${result.response.status}`);
    }

    const data = await result.response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: result.provider.name,
      fallbackUsed: result.provider.name !== 'Perplexity'
    };

  } catch (error: any) {
    console.error('❌ LLM call failed:', error.message);

    // Final fallback: return error message
    return {
      content: `Error: Unable to generate response. ${error.message}`,
      provider: 'error',
      fallbackUsed: true
    };
  }
}
```

### Step 2: Update MoE Orchestrator

Replace all direct `fetch()` calls with:

```typescript
// OLD (line 435-460):
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [...]
  })
});

if (response.status === 429) {
  console.warn('⚠️ Perplexity rate limited');
  return { content: 'Rate limited', fallback_used: true };
}

// NEW:
const result = await callPerplexityWithRateLimiting(
  [...],
  'llama-3.1-sonar-large-128k-online'
);

// Auto-handles rate limiting, retries, and fallback!
```

### Step 3: Apply to All Files

**Files to Update**:
1. ✅ `lib/brain-skills/moe-orchestrator.ts` (10+ calls)
2. ✅ `lib/teacher-student-system.ts` (2 calls)
3. ✅ `lib/gepa-teacher-student.ts` (2 calls)
4. ✅ `lib/ace-llm-client.ts` (if applicable)

---

## 📊 Expected Improvement

### Before Fix

```
Request 1: ✅ Success (Perplexity)
Request 2: ✅ Success (Perplexity)
Request 3: ✅ Success (Perplexity)
...
Request 21: ❌ 429 Rate Limited (fails)
Request 22: ❌ 429 Rate Limited (fails)
Request 23: ❌ 429 Rate Limited (fails)
```

**Problems**:
- 429 errors start at 21st request/minute
- No retry → immediate failure
- No fallback → user sees error

### After Fix

```
Request 1: ✅ Success (Perplexity)
Request 2: ✅ Success (Perplexity)
Request 3: ✅ Success (Perplexity)
...
Request 21: 🔄 Rate limited → Auto-fallback to Ollama → ✅ Success
Request 22: ✅ Success (Ollama - local, no limits)
Request 23: ✅ Success (Ollama)
...
[Wait 2 seconds cooldown]
Request 40: ✅ Success (Perplexity - rate limit reset)
```

**Benefits**:
- ✅ Automatic fallback to Ollama
- ✅ No user-visible errors
- ✅ Graceful degradation
- ✅ Cooldown tracking
- ✅ Provider rotation

---

## 🔧 Quick Commands

### Check Current Rate Limiter Status

```typescript
// In any API route
import { getRateLimiterStats } from './lib/api-rate-limiter';

const stats = getRateLimiterStats();
console.log('Rate Limiter Stats:', stats);
```

### Reset Rate Limits (for testing)

```typescript
import { resetAllRateLimits } from './lib/api-rate-limiter';

resetAllRateLimits();
```

### Monitor Rate Limits

```bash
# Add this endpoint: /api/brain/rate-limit-status
# Returns current status of all providers
```

---

## 🎯 Implementation Priority

### Immediate (15 minutes)

1. ✅ Create `lib/brain-skills/llm-helpers.ts` with rate-limited wrapper
2. ✅ Update moe-orchestrator.ts to use wrapper (10 replacements)
3. ✅ Test with Brain API

### Short-term (30 minutes)

4. ✅ Update teacher-student-system.ts
5. ✅ Update gepa-teacher-student.ts
6. ✅ Add rate limit monitoring endpoint

### Nice-to-have (1 hour)

7. ✅ Add retry with exponential backoff
8. ✅ Add request queuing for burst traffic
9. ✅ Add metrics dashboard

---

## 🧪 Testing

### Test Rate Limiting

```bash
# Make 25 rapid requests (should hit rate limit)
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/brain \
    -H "Content-Type: application/json" \
    -d '{"query":"test","domain":"general"}' &
done

# Expected behavior:
# - First 20: Use Perplexity
# - Request 21+: Auto-fallback to Ollama
# - All succeed (no 429 errors)
```

### Verify Fallback

```bash
# Check logs for fallback messages
# Should see:
# ⚠️ Perplexity rate limited, marking as unavailable
# 🔄 Falling back to Ollama Local
# ✅ Request completed successfully with fallback
```

---

## 📈 Configuration

### Current Limits (api-rate-limiter.ts)

```typescript
perplexity: {
  requestsPerMinute: 20,   // Perplexity limit
  requestsPerHour: 500,    // Perplexity limit
  burstLimit: 5,
  cooldownMs: 2000         // 2 second cooldown after rate limit
}
```

### Adjust if Needed

```typescript
// If you have Perplexity Pro with higher limits:
perplexity: {
  requestsPerMinute: 60,   // Pro: 60/min
  requestsPerHour: 3000,   // Pro: 3000/hour
  burstLimit: 10,
  cooldownMs: 1000
}
```

---

## 🚨 Current Status

**Status**: ⚠️ **NOT FIXED YET** (Infrastructure exists but not integrated)

**Next Steps**:
1. Create llm-helpers.ts wrapper
2. Update moe-orchestrator.ts
3. Test with rapid requests
4. Deploy

**Estimated Fix Time**: 15-30 minutes

---

## 🎓 Why This Happened

**Root Cause**: The Brain API was built incrementally with multiple skills added over time. Each skill implemented its own API calling logic without using the centralized rate limiter that was created later.

**Lesson**: Always use centralized API calling infrastructure to ensure consistent rate limiting, retry, and fallback behavior.

---

## 📞 Additional Resources

- **Rate Limiter Code**: `lib/api-rate-limiter.ts`
- **MoE Orchestrator**: `lib/brain-skills/moe-orchestrator.ts`
- **Perplexity API Docs**: https://docs.perplexity.ai/reference/post_chat_completions
- **Perplexity Rate Limits**: https://docs.perplexity.ai/guides/pricing

---

**Ready to fix?** Let me know and I'll create the implementation files!
