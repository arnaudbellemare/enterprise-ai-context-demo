# Baseline Test Configuration Summary

## Changes Made for Baseline Testing

### 1. **Test Timeout Configuration**
- **Very High Complexity**: 5 minutes timeout
- **High Complexity**: 3 minutes timeout  
- **Medium Complexity**: 2 minutes timeout
- **Low Complexity**: 1 minute timeout

### 2. **Ollama Timeout Fix**
- Added `BASELINE_TESTING=true` environment variable
- Ollama calls now have timeout when baseline testing:
  - Complex queries: 60 seconds
  - Simple queries: 30 seconds
- Prevents infinite hangs during testing

### 3. **Optimized Component Configuration**
For baseline testing, components are selectively enabled based on query category and complexity:

**Multi-Step Reasoning Queries**:
- ✅ SWiRL enabled (for multi-step decomposition)
- ✅ TRM enabled (for verification)
- ⚠️ SWiRL/TRM disabled for "very_high" complexity (too slow)

**Verification Queries**:
- ✅ TRM enabled (for answer verification)
- ⚠️ TRM disabled for "very_high" complexity

**Refinement Queries**:
- ✅ GEPA enabled (for answer refinement)
- ⚠️ GEPA disabled for "very_high" complexity

**All Queries**:
- ✅ Perplexity (Teacher Model) - faster and more reliable
- ❌ Ollama (Student Model) - disabled to avoid timeouts
- ⚠️ Multi-Query disabled for refinement and very high complexity
- ⚠️ DSPy disabled for verification and very high complexity
- ⚠️ ACE disabled for very high complexity
- ❌ RAG disabled (for clean baseline)

### 4. **Error Handling**
- Tests continue even if individual queries fail
- Failed queries get partial credit (0.1 score) instead of zero
- Error messages captured for analysis
- Results logged for comparison

## Next Steps

1. **Run Baseline Test**: `npx tsx test-comparative-srl-ebm.ts`
2. **Review Results**: Check `test-baseline-results.log`
3. **Phase 2**: Implement SRL enhancement
4. **Phase 3**: Implement nanoEBM enhancement
5. **Phase 4**: Compare all approaches

## Expected Baseline Performance

Based on complexity:
- **Low Complexity**: Should complete in < 30s, accuracy > 70%
- **Medium Complexity**: Should complete in < 2min, accuracy > 60%
- **High Complexity**: Should complete in < 3min, accuracy > 50%
- **Very High Complexity**: May timeout, but should attempt with simplified config


