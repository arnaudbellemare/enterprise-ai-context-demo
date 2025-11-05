# GAMP Value Analysis: Is It Actually Helping?

## Problem Statement

User question: "Does GAMP really help in lite-gamp?"

Example output shows:
- **GAMP Analysis**: Novelty: 0.64, Scientific Rationality: 0.30, Factuality: 0.26
- **Answer quality**: Generic/descriptive, not significantly enhanced by GAMP
- **Performance cost**: GAMP adds 15-25 seconds of execution time

## Current Implementation Analysis

### What GAMP Does Currently

1. **Builds Knowledge Graph** (10-15s)
   - Extracts P-S-E triplets from ReasoningBank memories
   - Creates graph structure with nodes/edges
   - Uses DO-RAG multi-level extraction

2. **Discovers Paths** (5-10s)
   - Multi-agent pathfinding (Chief Scientist, Domain Expert, Path Explorer, etc.)
   - Evaluates paths for novelty, scientific rationality, factuality
   - Returns top path with scores

3. **Integrates into Answer** (lines 1561-1570)
   ```typescript
   // Add GAMP insights
   if (graphResult?.topPath) {
     context += `## Research Insights from Graph Analysis (GAMP):\n`;
     context += `Problem Identified: ${graphResult.topPath.problem}\n`;
     context += `Solution Approach: ${graphResult.topPath.solution}\n`;
     context += `Expected Effect: ${graphResult.topPath.effect}\n`;
     context += `Novelty Score: ${graphResult.topPath.novelty.toFixed(2)}\n`;
     context += `Scientific Rationality: ${graphResult.topPath.scientificRationality.toFixed(2)}\n`;
     context += `Factuality Score: ${graphResult.topPath.factuality.toFixed(2)}\n\n`;
   }
   ```

### The Problem

**For art insurance queries:**
- ❌ Low scientific rationality (0.30) - makes sense, it's not scientific
- ❌ Low factuality (0.26) - concerning, GAMP might be hallucinating
- ⚠️ Moderate novelty (0.64) - not novel enough to justify cost
- ❌ Generic P-S-E triplets don't add much value to factual queries

**GAMP is designed for:**
- ✅ Scientific discovery (biology, chemistry, physics)
- ✅ Multi-step reasoning problems
- ✅ Novel path discovery
- ✅ Research-oriented questions

**Art insurance is:**
- ❌ Domain-specific factual lookup
- ❌ Not scientific
- ❌ Doesn't need novel paths
- ❌ Needs accurate, specific information (not generic P-S-E triplets)

## Root Cause Analysis

### 1. GAMP Activation Too Broad

Current activation (line 591-608):
```typescript
private shouldActivateGAMP(routingResult: RoutingResult): boolean {
  const isHighDifficulty = routingResult.difficulty >= (gampConfig.irtThreshold ?? 0.5);
  
  // If scientific domains are specified, check domain match
  if (gampConfig.scientificDomains && gampConfig.scientificDomains.length > 0) {
    const isScientificDomain = gampConfig.scientificDomains.some(
      domain => routingResult.domain.toLowerCase().includes(domain.toLowerCase())
    );
    return isScientificDomain && isHighDifficulty;
  }
  
  // No scientific domain restriction - activate based on difficulty only
  return isHighDifficulty;
}
```

**Problem**: In `lite-gamp` mode, `scientificDomains: []` means GAMP activates for ANY domain if difficulty > 0.3. Art insurance queries can have high difficulty (0.5-0.7) but don't benefit from GAMP.

### 2. GAMP Results Not Filtered by Quality

Even if GAMP runs, we should only use results if they're high quality:
- Novelty > 0.7 (truly novel insights)
- Scientific Rationality > 0.5 (for scientific queries)
- Factuality > 0.6 (reliable information)

**Current**: GAMP results are always included, even if scores are low.

### 3. GAMP Context Integration is Weak

Current integration just adds scores and P-S-E triplets as text. For non-scientific queries, this doesn't enhance the answer - it just adds noise.

## Solutions

### Solution 1: Smart GAMP Activation (Recommended)

Only activate GAMP when it will actually help:

```typescript
private shouldActivateGAMP(routingResult: RoutingResult): boolean {
  const gampConfig = this.config.gampConfig;
  if (!gampConfig) return false;
  
  const isHighDifficulty = routingResult.difficulty >= (gampConfig.irtThreshold ?? 0.5);
  
  // Scientific domains ALWAYS benefit from GAMP
  if (gampConfig.scientificDomains && gampConfig.scientificDomains.length > 0) {
    const isScientificDomain = gampConfig.scientificDomains.some(
      domain => routingResult.domain.toLowerCase().includes(domain.toLowerCase())
    );
    if (isScientificDomain && isHighDifficulty) {
      return true; // Scientific + high difficulty = GAMP valuable
    }
  }
  
  // For non-scientific domains, be more selective
  // Only activate if:
  // 1. Very high difficulty (> 0.7) AND
  // 2. Query suggests multi-step reasoning OR
  // 3. Query suggests research/exploration
  if (isHighDifficulty && routingResult.difficulty > 0.7) {
    // Check if query suggests research/exploration
    const researchKeywords = ['investigate', 'explore', 'discover', 'analyze', 'research', 'study'];
    const queryLower = routingResult.query?.toLowerCase() || '';
    const hasResearchIntent = researchKeywords.some(keyword => queryLower.includes(keyword));
    
    if (hasResearchIntent) {
      return true; // Research-oriented queries benefit from GAMP
    }
  }
  
  return false; // Default: don't activate for non-scientific, non-research queries
}
```

### Solution 2: GAMP Value Threshold

Only use GAMP results if they meet quality thresholds:

```typescript
// In generateAnswer()
if (graphResult?.topPath) {
  // Only include GAMP insights if they meet quality thresholds
  const noveltyThreshold = 0.7;
  const factualityThreshold = 0.6;
  
  const hasHighNovelty = graphResult.topPath.novelty >= noveltyThreshold;
  const hasHighFactuality = graphResult.topPath.factuality >= factualityThreshold;
  
  // For scientific queries, also check scientific rationality
  const isScientificDomain = ['biology', 'chemistry', 'physics', 'medicine'].some(
    domain => domain.toLowerCase().includes(domain)
  );
  const hasHighScientificRationality = isScientificDomain 
    ? graphResult.topPath.scientificRationality >= 0.5
    : true; // Don't require for non-scientific
  
  if (hasHighNovelty || hasHighFactuality) {
    // Only add if GAMP provides real value
    context += `## Research Insights from Graph Analysis (GAMP):\n`;
    // ... add GAMP context
  } else {
    console.log('⚠️ GAMP results below quality threshold - skipping integration');
    // Don't add low-quality GAMP results
  }
}
```

### Solution 3: Make GAMP Optional Based on Query Type

Add query type detection:

```typescript
enum QueryType {
  FACTUAL_LOOKUP = 'factual_lookup',      // "What is the premium for X?"
  RESEARCH_EXPLORATION = 'research',       // "Investigate the relationship between X and Y"
  SCIENTIFIC_DISCOVERY = 'scientific',    // "How does protein folding work?"
  ANALYSIS = 'analysis',                   // "Analyze the impact of X on Y"
}

function detectQueryType(query: string, domain: string): QueryType {
  // Factual lookup keywords
  const factualKeywords = ['what is', 'how much', 'premium', 'cost', 'price', 'rate'];
  if (factualKeywords.some(kw => query.toLowerCase().includes(kw))) {
    return QueryType.FACTUAL_LOOKUP;
  }
  
  // Research keywords
  const researchKeywords = ['investigate', 'explore', 'discover', 'research', 'study'];
  if (researchKeywords.some(kw => query.toLowerCase().includes(kw))) {
    return QueryType.RESEARCH_EXPLORATION;
  }
  
  // Scientific domains
  const scientificDomains = ['biology', 'chemistry', 'physics', 'medicine', 'science'];
  if (scientificDomains.some(sd => domain.toLowerCase().includes(sd))) {
    return QueryType.SCIENTIFIC_DISCOVERY;
  }
  
  return QueryType.ANALYSIS;
}

// In shouldActivateGAMP:
const queryType = detectQueryType(query, routingResult.domain);
if (queryType === QueryType.FACTUAL_LOOKUP) {
  return false; // Don't use GAMP for factual lookups
}
```

## Recommended Implementation

**Immediate fix**: Add GAMP value threshold check

1. Only activate GAMP for:
   - Scientific domains (always if high difficulty)
   - Research-oriented queries (high difficulty + research keywords)
   - Very high difficulty (> 0.7) with exploration intent

2. Only use GAMP results if:
   - Novelty > 0.7 OR
   - Factuality > 0.6 (for non-scientific queries)
   - Scientific Rationality > 0.5 (for scientific queries)

3. For art insurance and similar queries:
   - Skip GAMP entirely (save 15-25 seconds)
   - Rely on Teacher-Student (Perplexity) + Context Engineering 2.0

## Expected Impact

**Before**:
- Art insurance query: ~150s (includes 20s GAMP overhead)
- GAMP provides low-value generic insights
- Answer quality: Moderate

**After**:
- Art insurance query: ~130s (GAMP skipped)
- Teacher-Student + Context Engineering 2.0 provide specific, accurate information
- Answer quality: Better (no noise from low-quality GAMP results)

**For scientific/research queries**:
- GAMP still activates when valuable
- Higher quality threshold ensures only good insights are used
- Answer quality: Improved (only high-quality GAMP insights)

## Code Changes Required

1. **Enhance `shouldActivateGAMP()`** (lines 591-608)
   - Add query type detection
   - Add research intent detection
   - Be more selective for non-scientific domains

2. **Add GAMP value threshold** (lines 1561-1570)
   - Check quality scores before including GAMP results
   - Skip low-quality results

3. **Add query type detection** (new function)
   - Detect factual lookup vs research vs scientific
   - Use in GAMP activation decision

This will make GAMP only activate when it actually helps, and only use results when they're high quality.

