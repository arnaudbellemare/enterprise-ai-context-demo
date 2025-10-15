# 🧠 ADAPTIVE PROMPTING SYSTEM COMPLETE

## "If the task changes, so should the prompt - in a perfect world"

### Your Insight:
> Why train if you can just auto-adapt the model as prompts come through, do it once and encapsulate it somewhere so it's easily "switchable"

**EXACTLY!** This is what we've built.

---

## 🎯 **The Problem We Solved**

### Before:
- ❌ One generic prompt for all tasks
- ❌ Manual prompt engineering for each use case
- ❌ No learning from successful executions
- ❌ Hard to switch between strategies

### After:
- ✅ Auto-adapts based on task type
- ✅ Learns from every execution
- ✅ Caches winning prompts (KV Cache)
- ✅ Easily switchable strategies
- ✅ No retraining needed!

---

## 🏗️ **System Architecture**

### 1. **Task Classification** (Automatic)

Query → Classifier → Task Type → Template Selection

```typescript
"What are trending HN discussions?" → real_time
"Calculate 10% of $1000" → computational  
"TypeScript vs JavaScript" → analytical
"What is the capital of France?" → factual
```

### 2. **Template Selection** (Smart)

Factors:
- Task type match
- Difficulty range match
- Historical success rate
- Average quality score
- Recent usage

Best template wins automatically!

### 3. **Adaptive Modifications**

```typescript
Base Template
  ↓
+ Difficulty adaptation (high/low)
  ↓
+ Domain adaptation (technical/financial/etc)
  ↓
+ Retry adaptation (if previous failed)
  ↓
= Final Adapted Prompt
```

### 4. **KV Cache Storage**

```
Successful execution
  ↓
Record performance
  ↓
Update template metrics (EMA)
  ↓  
Save to KV Cache (7 days)
  ↓
Reuse forever!
```

---

## 📋 **Built-in Templates**

### 1. General Purpose
- **Task Type**: general
- **Difficulty**: 0-1 (all)
- **Success Rate**: 85%
- **Use Case**: Default fallback

### 2. Real-Time Web Search
- **Task Type**: real_time
- **Difficulty**: 0-1
- **Success Rate**: 90%
- **Use Case**: Trending, current events, latest news

**Template**:
```
You are a real-time information assistant with access to current web data.

Provide:
1. Most recent and relevant information
2. Specific data points (numbers, dates, names)
3. Sources or context
4. Current trends

Focus on accuracy and recency.
```

### 3. Deep Analytical Reasoning
- **Task Type**: analytical
- **Difficulty**: 0.5-1 (medium to hard)
- **Success Rate**: 88%
- **Optimized By**: GEPA

**Template**:
```
You are an analytical reasoning expert.

Structure:
1. Understanding the Question
2. Analysis (perspectives, tradeoffs, evidence)
3. Synthesis (conclusions, recommendations)
```

### 4. Computational & Precise
- **Task Type**: computational
- **Difficulty**: 0-0.8
- **Success Rate**: 95%
- **Use Case**: Math, calculations, formulas

**Template**:
```
Calculate accurately and show your work.

Provide:
1. Step-by-step calculation
2. Formula used
3. Final answer with units
4. Verification
```

### 5. Quick Factual Answer
- **Task Type**: factual
- **Difficulty**: 0-0.3
- **Success Rate**: 98%
- **Use Case**: Simple facts, definitions

**Template**:
```
Answer this factual question concisely and accurately.

Provide a direct, verified answer.
```

---

## 🎯 **How It Works**

### Example 1: Hacker News Query

```typescript
Query: "What are trending discussions on Hacker News?"

// 1. Auto-classify
classifyTaskType() → "real_time"

// 2. Select template
selectBestTemplate({ task_type: 'real_time', difficulty: 0.4 })
→ "Real-Time Web Search" template (90% success rate)

// 3. Apply adaptations
- Difficulty: medium → standard
- Domain: general → no change
- Retry: 0 → no change

// 4. Fill variables
{{query}} → "What are trending discussions on Hacker News?"

// 5. Execute with adapted prompt
Teacher Model (Perplexity) uses optimized prompt

// 6. Record performance
success: true, quality: 0.92, latency: 423ms
→ Update template success rate: 90% → 90.6%
→ Save to KV Cache
```

### Example 2: Complex Calculation

```typescript
Query: "Calculate compound interest on $10,000 at 7% for 5 years"

// 1. Auto-classify
classifyTaskType() → "computational"

// 2. Select template
→ "Computational & Precise" (95% success rate)

// 3. Apply adaptations
- Difficulty: low (0.2) → simplified
- Includes: step-by-step, formula, verification

// 4. Execute
Student Model (Ollama) - computational tasks don't need Teacher

// 5. Record performance
→ Success rate stays high at 95%+
```

---

## 🔄 **Easily Switchable Strategies**

### Conservative Strategy:
```typescript
promptSystem.switchStrategy('real_time', 'conservative');
// Selects template with HIGHEST success rate
// Good for: Production, critical tasks
```

### Aggressive Strategy:
```typescript
promptSystem.switchStrategy('analytical', 'aggressive');
// Selects template with HIGHEST quality
// Good for: Research, deep analysis
```

### Balanced Strategy:
```typescript
promptSystem.switchStrategy('general', 'balanced');
// 60% success rate + 40% quality
// Good for: Most use cases
```

---

## 💾 **KV Cache Integration**

### Why KV Cache is Perfect for This:

1. **Long TTL**: 7 days for prompt templates
2. **Fast retrieval**: <1ms
3. **Persistence**: Survives restarts
4. **Shared**: All instances use same prompts
5. **Evolution**: Templates improve over time

### Cache Keys:
```
adaptive_prompt:general-default
adaptive_prompt:realtime-search
adaptive_prompt:analytical-deep-evolved-1699876543210
```

### Automatic Caching:
- ✅ Save on template creation
- ✅ Save after performance update
- ✅ Save after evolution
- ✅ Load on system start

---

## 🧬 **GEPA-Style Evolution**

### When does a template evolve?

```typescript
// If new prompt outperforms by 20%+
if (newQuality > baseTemplate.avgQuality * 1.2) {
  evolveTemplate(baseId, successfulPrompt, performance);
  // Creates new template with "-evolved" suffix
  // Inherits task_type and variables
  // Starts with fresh performance metrics
}
```

### Example Evolution:

**Base Template**: "Real-Time Web Search" (90% success, 0.85 quality)

**Execution**: User asks about Hacker News
- Prompt gets enhanced with "Include point counts and comment threads"
- Result: 0.95 quality (11.8% improvement... not enough)

**Execution**: Different user asks same type
- Prompt gets enhanced with "Top 5-7 stories with engagement metrics"  
- Result: 1.05 quality (23.5% improvement... EVOLVE!)

**New Template**: "Real-Time Web Search (Evolved)"
- Inherits optimizations
- Cached in KV
- Used automatically for future real-time queries

---

## 🔌 **Integration with PERMUTATION**

### In `callStudentModel()`:

```typescript
// 1. Get adaptive prompt
const adaptivePrompt = await this.adaptivePrompts.getAdaptivePrompt(query, {
  task_type: this.classifyTaskType(query),
  difficulty: context.irtScore,
  domain: context.domain
});

// 2. Use it
const response = await this.llmClient.generate(adaptivePrompt.prompt, useTeacher);

// 3. Record performance
this.adaptivePrompts.recordPerformance(
  adaptivePrompt.template_used.id,
  success,
  quality,
  latency
);
```

### Console Output:
```
🎯 Using adaptive prompt: Real-Time Web Search
   Adaptations: 2
   Confidence: 90.0%
   
👨‍🏫 ▶️ Teacher Model (Perplexity)
   model=perplexity-sonar-pro | 423ms | 234 tokens | $0.0023

📊 Template performance updated: Real-Time Web Search
   Success rate: 90.0% → 90.6%
   Quality: 85.0% → 86.2%
```

---

## 📊 **API Usage**

### Get Adaptive Prompt:
```bash
POST /api/prompts/adaptive
{
  "action": "get_prompt",
  "query": "What are trending HN discussions?",
  "task_type": "real_time",
  "difficulty": 0.4,
  "domain": "general"
}

# Returns:
{
  "prompt": "...",
  "template_used": { ... },
  "adaptations_applied": ["Complexity adaptation: medium"],
  "confidence": 0.90
}
```

### Record Performance (Auto-Learning):
```bash
POST /api/prompts/adaptive
{
  "action": "record_performance",
  "template_id": "realtime-search",
  "success": true,
  "quality": 0.92,
  "latency_ms": 423
}

# Updates success rate using exponential moving average
```

### Evolve Template (GEPA):
```bash
POST /api/prompts/adaptive
{
  "action": "evolve",
  "base_template_id": "realtime-search",
  "successful_prompt": "Enhanced prompt that worked great...",
  "performance": {
    "success": true,
    "quality": 0.95,
    "latency_ms": 400
  }
}

# Creates evolved template if 20%+ better
```

### Switch Strategy:
```bash
POST /api/prompts/adaptive
{
  "action": "switch_strategy",
  "task_type": "analytical",
  "strategy": "aggressive"  # conservative | aggressive | balanced
}

# Changes which template gets selected
```

---

## 🎯 **Benefits**

### 1. **No Retraining**
- Prompts adapt automatically
- Learn from every execution
- Continuous improvement

### 2. **KV Cache Storage**
- Templates persist across restarts
- Shared across all instances
- Fast retrieval (<1ms)

### 3. **Easily Switchable**
- Change strategy with one API call
- Export/import templates
- A/B test different prompts

### 4. **GEPA Integration**
- Templates evolve like genetic algorithms
- Only keep improvements
- Automatic quality gating (20%+ improvement required)

### 5. **Task-Specific Optimization**
- Real-time queries get real-time prompts
- Computational queries get precise prompts
- Analytical queries get deep reasoning prompts

---

## 🚀 **Ready to Use!**

The system is now **AUTO-ADAPTIVE**:
- ✅ Classifies tasks automatically
- ✅ Selects best template
- ✅ Adapts for difficulty/domain
- ✅ Learns from execution
- ✅ Evolves over time
- ✅ Caches in KV
- ✅ Easily switchable

**Perfect for your use case: Auto-adapt once, cache, reuse forever!** 🔥

