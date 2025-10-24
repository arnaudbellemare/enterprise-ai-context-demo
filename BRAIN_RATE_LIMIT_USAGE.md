# Brain API Rate Limiting - Usage Guide

## ✅ Solution Implemented

The rate limiting infrastructure is now ready to use!

**New Files Created**:
- ✅ `lib/brain-skills/llm-helpers.ts` - Rate-limited LLM wrapper
- ✅ `app/api/test-rate-limit/route.ts` - Test endpoint
- ✅ `BRAIN_RATE_LIMIT_FIX.md` - Detailed analysis

---

## 🚀 How to Use

### Option 1: Simple Replacement (Fastest)

Replace ALL direct Perplexity `fetch()` calls with the wrapper:

```typescript
// ❌ OLD CODE (moe-orchestrator.ts line 435-460):
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [{ role: 'user', content: query }],
    temperature: 0.7,
    max_tokens: 4000
  })
});

if (response.status === 429) {
  console.warn('⚠️ Perplexity rate limited');
  // Manual fallback logic...
}

const data = await response.json();
const content = data.choices[0].message.content;

// ✅ NEW CODE (automatic rate limiting + fallback):
import { callPerplexityWithRateLimiting } from './llm-helpers';

const result = await callPerplexityWithRateLimiting(
  [{ role: 'user', content: query }],
  {
    model: 'llama-3.1-sonar-large-128k-online',
    temperature: 0.7,
    maxTokens: 4000
  }
);

const content = result.content;
const usedFallback = result.fallbackUsed;  // true if rate limited
const provider = result.provider;          // 'Perplexity' or 'Ollama Local' or 'OpenRouter'
```

### Option 2: With Retry Logic (Recommended)

Use retry logic for critical requests:

```typescript
import { callLLMWithRetry } from './llm-helpers';

const result = await callLLMWithRetry(
  [{ role: 'user', content: query }],
  {
    model: 'llama-3.1-sonar-large-128k-online',
    temperature: 0.7,
    maxTokens: 4000
  },
  3  // Max retries
);
```

**Benefits**:
- Automatically retries on transient errors
- Exponential backoff (1s, 2s, 4s delays)
- Falls back to Ollama if all retries fail

---

## 🧪 Testing

### Test 1: Single Request

```bash
# Test single request (should use Perplexity)
curl -X POST http://localhost:3000/api/test-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"query":"What is 2+2?"}'
```

**Expected Response**:
```json
{
  "success": true,
  "response": "2+2 equals 4...",
  "provider": "Perplexity",
  "fallbackUsed": false,
  "cost": 0.000001,
  "tokens": { "input": 10, "output": 20 },
  "duration": 1500,
  "rateLimiterStats": {
    "providers": [...],
    "totalRequests": 1
  }
}
```

### Test 2: Rate Limit Testing

```bash
# Make 25 rapid requests (will hit Perplexity's 20/min limit)
for i in {1..25}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/test-rate-limit \
    -H "Content-Type: application/json" \
    -d '{"query":"Test request '$i'"}' &
done

# Wait for all to complete
wait

# Check rate limiter status
curl http://localhost:3000/api/test-rate-limit
```

**Expected Behavior**:
```
Request 1-20:  ✅ Perplexity (success)
Request 21:    🔄 Perplexity rate limited → Auto-fallback to OpenRouter
Request 22-25: ✅ OpenRouter or Ollama (success)
```

**Console Output You Should See**:
```
🚀 Using Perplexity for API request
🚀 Using Perplexity for API request
...
⚠️ Perplexity rate limited, marking as unavailable
🔄 Falling back to openrouter
🚀 Using OpenRouter for API request
✅ Request completed successfully
```

### Test 3: Check Rate Limiter Status

```bash
# GET endpoint to check current status
curl http://localhost:3000/api/test-rate-limit
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "providers": [
      {
        "name": "OpenRouter",
        "requestCount": 0,
        "isRateLimited": false,
        "rateLimitedUntil": null
      },
      {
        "name": "Perplexity",
        "requestCount": 20,
        "isRateLimited": true,
        "rateLimitedUntil": "2025-10-23T18:45:30.000Z"
      },
      {
        "name": "Ollama Local",
        "requestCount": 5,
        "isRateLimited": false
      }
    ],
    "totalRequests": 25
  }
}
```

---

## 📝 Files to Update

To fully integrate the rate limiter, update these files:

### 1. moe-orchestrator.ts (Priority: High)

**Location**: `lib/brain-skills/moe-orchestrator.ts`

**Find and replace** (10+ occurrences):

```typescript
// Find this pattern:
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [...],
    temperature: ...,
    max_tokens: ...
  })
});

// Replace with:
import { callPerplexityWithRateLimiting } from './llm-helpers';

const result = await callPerplexityWithRateLimiting(
  [...],  // messages array
  {
    model: 'llama-3.1-sonar-large-128k-online',
    temperature: ...,
    maxTokens: ...
  }
);

const content = result.content;
```

**Lines to Update**: 435, 503, 568, 634, 717, 808, 950, 1016, 1081, 1165

### 2. teacher-student-system.ts

**Location**: `lib/teacher-student-system.ts`

**Lines to Update**: 283, 330

### 3. gepa-teacher-student.ts

**Location**: `lib/gepa-teacher-student.ts`

**Lines to Update**: 123, 202

---

## 🎯 Quick Migration Script

Create a script to help with migration:

```bash
# In scripts/migrate-rate-limiter.sh

#!/bin/bash
echo "🔄 Migrating to rate-limited LLM calls..."

# List files that need updating
echo "Files to update:"
grep -l "fetch.*perplexity\.ai" lib/**/*.ts

echo ""
echo "⚠️  Manual Steps Required:"
echo "1. Import: import { callPerplexityWithRateLimiting } from './llm-helpers';"
echo "2. Replace fetch() calls with callPerplexityWithRateLimiting()"
echo "3. Test with: npm run dev && curl http://localhost:3000/api/test-rate-limit"
echo ""
echo "See BRAIN_RATE_LIMIT_USAGE.md for detailed instructions"
```

---

## 🔧 Configuration

### Adjust Rate Limits

If you have Perplexity Pro or custom limits:

```typescript
// In lib/api-rate-limiter.ts line 58-62

perplexity: {
  requestsPerMinute: 20,   // Free tier: 20/min
  requestsPerHour: 500,    // Free tier: 500/hour
  burstLimit: 5,
  cooldownMs: 2000
}

// For Pro tier:
perplexity: {
  requestsPerMinute: 60,   // Pro: 60/min
  requestsPerHour: 3000,   // Pro: 3000/hour
  burstLimit: 10,
  cooldownMs: 1000
}
```

### Add Custom Provider

```typescript
// In lib/api-rate-limiter.ts initializeProviders()

if (process.env.CUSTOM_API_KEY) {
  this.providers.set('custom', {
    name: 'Custom Provider',
    apiKey: process.env.CUSTOM_API_KEY,
    config: {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      burstLimit: 10,
      cooldownMs: 1500
    },
    lastUsed: 0,
    requestCount: 0,
    isRateLimited: false,
    rateLimitUntil: 0
  });
}
```

Then update llm-helpers.ts to support it:

```typescript
// In callPerplexityWithRateLimiting()
else if (provider.name === 'Custom Provider') {
  return fetch('https://custom-api.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'custom-model',
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });
}
```

---

## 📊 Monitoring

### Add Monitoring Endpoint

Create `/api/brain/rate-limit-stats`:

```typescript
// app/api/brain/rate-limit-stats/route.ts
import { NextResponse } from 'next/server';
import { getRateLimiterStats } from '../../../lib/api-rate-limiter';

export async function GET() {
  const stats = getRateLimiterStats();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stats,
    health: {
      perplexity: !stats.providers.find((p: any) => p.name === 'Perplexity')?.isRateLimited,
      openrouter: !stats.providers.find((p: any) => p.name === 'OpenRouter')?.isRateLimited,
      ollama: true
    }
  });
}
```

### Dashboard Widget

```typescript
// Example React component
function RateLimitMonitor() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/brain/rate-limit-stats');
      const data = await res.json();
      setStats(data);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Rate Limiter Status</h3>
      {stats?.stats.providers.map((p: any) => (
        <div key={p.name}>
          {p.name}: {p.requestCount} requests
          {p.isRateLimited && <span> ⚠️ Rate Limited</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎉 Benefits

### Before Fix
```
❌ 429 errors after 20 requests
❌ No automatic retry
❌ No fallback to other providers
❌ Manual error handling in every file
❌ Inconsistent behavior
```

### After Fix
```
✅ Automatic provider rotation
✅ Intelligent fallback (Perplexity → OpenRouter → Ollama)
✅ Built-in retry with exponential backoff
✅ Centralized error handling
✅ Zero user-visible errors
✅ Cost tracking per provider
✅ Monitoring and statistics
```

---

## 🚨 Important Notes

1. **Ollama Must Be Running**: For local fallback to work, ensure Ollama is running:
   ```bash
   ollama serve
   ollama pull llama3.1
   ```

2. **OpenRouter Requires API Key**: Set `OPENROUTER_API_KEY` for OpenRouter fallback

3. **Rate Limits Reset**: Perplexity rate limits reset after 2-second cooldown (configurable)

4. **Cost Tracking**: All calls now include cost calculation in response

---

## 📞 Support

**Issues?** Check:
1. Rate limiter stats: `curl http://localhost:3000/api/test-rate-limit`
2. Console logs: Look for `🚀 Using [Provider]` messages
3. Ollama status: `curl http://localhost:11434/api/tags`

**Still Having Issues?**
- Verify environment variables are set (PERPLEXITY_API_KEY, etc.)
- Check Ollama is running and accessible
- Review console logs for specific error messages

---

**Ready to integrate?** Start with the test endpoint, then update moe-orchestrator.ts!
