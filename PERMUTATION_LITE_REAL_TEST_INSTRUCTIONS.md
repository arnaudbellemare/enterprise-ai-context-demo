# PERMUTATION Lite: Real Test Instructions

**Status**: ✅ Implementation Complete - Ready for Testing

---

## What Was Fixed

1. **Real LLM Integration**: Updated `generateAnswer` method in `permutation-lite-pipeline.ts` to call `/api/answer` route (uses Ollama/OpenRouter)

2. **Test Script Created**: `test-permutation-lite-real.js` - Actually executes PERMUTATION Lite and shows real results

---

## How to Run the Real Test

### Step 1: Start the Development Server

```bash
npm run dev
```

Wait for server to be ready (usually `http://localhost:3000`)

### Step 2: Run the Test

In a **separate terminal**:

```bash
node test-permutation-lite-real.js "What should the insurance premium be for a 1925 Art Deco Cartier platinum bracelet valued at $85,000?" art
```

Or test with a custom query:

```bash
node test-permutation-lite-real.js "your query here" "domain"
```

### Step 3: View Results

The test will:
- Execute PERMUTATION Lite through the API
- Show the actual answer generated
- Display metadata (quality score, layers executed, cost, time)
- Save full response to `permutation-lite-test-result.json`

---

## Expected Output

```
================================================================================
🧪 REAL TEST: PERMUTATION Lite
================================================================================
Query: What should the insurance premium be for a 1925 Art Deco Cartier platinum bracelet valued at $85,000?
Domain: art
================================================================================

✅ PERMUTATION Lite Response:

────────────────────────────────────────────────────────────────────────────────
ANSWER:
────────────────────────────────────────────────────────────────────────────────
[Actual LLM-generated answer here]

────────────────────────────────────────────────────────────────────────────────
METADATA:
────────────────────────────────────────────────────────────────────────────────
{
  "domain": "art",
  "difficulty": 0.72,
  "quality_score": 0.78,
  "layers_executed": ["routing", "optimization", "learning", "verification"],
  "performance": {
    "total_time_ms": 1200,
    "cost": 0.002
  }
}

────────────────────────────────────────────────────────────────────────────────
PERFORMANCE:
────────────────────────────────────────────────────────────────────────────────
Total Time: 1200ms
Quality Score: 0.780
Layers Executed: routing → optimization → learning → verification
Cost: $0.0020
```

---

## Troubleshooting

### "Server not running"
- **Solution**: Start dev server with `npm run dev`

### "LLM API error"
- **Solution**: Ensure Ollama is running locally OR OpenRouter API key is set in `.env`:
  ```
  OPENROUTER_API_KEY=your_key_here
  ```

### "No answer in response"
- **Check**: LLM provider configuration
- **Fallback**: System will use template answer if LLM fails

---

## Next Steps

Once you have real results:

1. **Compare with Full PERMUTATION**: Run same query through `/api/unified-pipeline`
2. **Update Test Document**: Replace theoretical answers in `PERMUTATION_LITE_ART_INSURANCE_TEST.md` with real results
3. **Analyze Quality Gap**: Measure actual quality difference between Lite and Full

---

*Ready for Real Testing - November 3, 2025*

