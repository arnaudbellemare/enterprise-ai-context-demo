# 🧪 **TEST THE MULTI-DOMAIN EVOLUTION API**

## **Step 1: Start the Dev Server**

```bash
cd frontend
npm run dev
```

Wait for it to show:
```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

## **Step 2: Test the Simple Endpoint First**

Open a new terminal and run:
```bash
curl -X POST http://localhost:3000/api/benchmark/test-simple \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Expected Response:**
```json
{
  "message": "Simple test successful",
  "timestamp": "2025-01-15T...",
  "test": "API is working"
}
```

## **Step 3: Test the Multi-Domain Evolution**

### **Option A: Browser Test**
1. Go to: http://localhost:3000/multi-domain-evolution
2. Click: **"RUN MULTI-DOMAIN EVOLUTION TEST"**
3. Wait: Should complete in 30-60 seconds
4. Check: Should show 25 iterations completed

### **Option B: API Test**
```bash
curl -X POST http://localhost:3000/api/benchmark/multi-domain-evolution \
  -H "Content-Type: application/json" \
  -d "{}" \
  -w "\nTime: %{time_total}s\n"
```

**Expected Response:**
```json
{
  "optimization_evolution": {
    "iterations": [0, 1, 2, 3, 4],
    "accuracy_progression": [85.2, 86.1, 87.3, 88.7, 90.1],
    "speed_gains": [0, 5.2, 12.1, 18.7, 25.3],
    "cost_reductions": [0, 15.2, 28.1, 42.7, 58.3]
  },
  "multi_domain_breakdown": {
    "domains": ["Financial", "Legal", "Real Estate", "Healthcare", "Manufacturing"],
    "baseline_performance": [85.2, 87.1, 83.8, 89.3, 84.7],
    "gepa_optimized_performance": [92.1, 94.2, 90.5, 95.8, 91.3],
    "improvements": [6.9, 7.1, 6.7, 6.5, 6.6]
  },
  "detailed_metrics": {
    "total_iterations": 25,
    "domains_tested": 5,
    "iterations_per_domain": 5,
    "overall_improvement": 6.8,
    "speed_gain": 25.3,
    "cost_reduction": 58.3
  }
}
```

## **Step 4: Check for Errors**

If you get an error, check the terminal where `npm run dev` is running for error messages like:

```
❌ Multi-domain evolution error: [error details]
MQE fallback: [error details]
SWiRL fallback: [error details]
```

## **Step 5: Verify Results**

✅ **Success Indicators:**
- No error dialogs
- 25 iterations completed
- 5 domains tested
- Results show evolution progression
- Different domains have different performance

❌ **Failure Indicators:**
- "Internal Server Error" dialog
- Less than 25 iterations
- All domains show identical results
- No evolution progression

## **Expected Timeline:**
- **Simple test**: < 1 second
- **Multi-domain test**: 30-60 seconds
- **25 iterations**: 5 domains × 5 iterations each

## **Troubleshooting:**

### **If Server Won't Start:**
```bash
cd frontend
rm -rf .next
npm run dev
```

### **If API Returns 500 Error:**
Check the dev server terminal for specific error messages. The try-catch blocks should show which component is failing.

### **If Test Takes Too Long:**
The test should complete in under 60 seconds. If it takes longer, there might be an infinite loop or hanging promise.

---

## **🎯 What We're Testing:**

1. **Real Component Execution**: Not hardcoded values
2. **Error Handling**: Graceful fallbacks if modules fail
3. **Performance**: 25 iterations in 30-60 seconds
4. **Evolution**: Shows improvement across iterations
5. **Domain Differences**: Each domain has unique characteristics

**Go ahead and test it! Let me know what happens!** 🚀
