# GEPA + DSPy: Runtime Feature Flags for Agents

## 🎯 **The Real Innovation**

GEPA + DSPy isn't just "prompt optimization" - it's **runtime feature flags for agents**.

### **Traditional View (Wrong)**
- ❌ Train prompts
- ❌ Static optimization
- ❌ One "best" prompt

### **Actual Implementation (Correct)**
- ✅ **Pareto bank** of instruction variants per module
- ✅ **Runtime routing** by live signals (latency, $/call, risk)
- ✅ **No weights to retrain** - just auditable text diffs + traces
- ✅ **Dynamic selection** based on context

---

## 🏗️ **Architecture**

### **1. Pareto Bank Per Module**

Each agent module maintains a **Pareto frontier** of prompt variants:

```typescript
interface PromptVariant {
  id: string;
  text: string;
  performance: {
    accuracy: number;      // 0-1
    latency_ms: number;    // milliseconds
    cost_per_call: number; // dollars
    risk_score: number;    // 0-1 (higher = riskier)
  };
  metadata: {
    created_at: string;
    tests_run: number;
    success_rate: number;
    context_适用性: string[];
  };
}

interface ParetoBank {
  module_name: string;
  variants: PromptVariant[];
  active_variant_id: string;
  routing_strategy: 'latency' | 'cost' | 'accuracy' | 'balanced' | 'adaptive';
}
```

**Pareto Frontier Example**:
```
High Accuracy, High Cost, High Latency
   ↓
Balanced Performance
   ↓
Low Cost, Fast, Lower Accuracy
```

### **2. Runtime Routing Engine**

Route traffic based on **live signals**:

```typescript
interface RoutingSignals {
  current_load: number;        // 0-1
  budget_remaining: number;    // dollars
  latency_requirement: number; // ms
  risk_tolerance: number;      // 0-1
  user_tier: 'free' | 'pro' | 'enterprise';
  task_complexity: 'low' | 'medium' | 'high';
  time_of_day: number;         // hour (0-23)
}

function selectPromptVariant(
  bank: ParetoBank,
  signals: RoutingSignals
): PromptVariant {
  // Runtime decision based on current context
  if (signals.latency_requirement < 1000 && signals.current_load > 0.8) {
    return bank.variants.find(v => v.performance.latency_ms < 500);
  }
  
  if (signals.budget_remaining < 1.0 && signals.user_tier === 'free') {
    return bank.variants.find(v => v.performance.cost_per_call < 0.001);
  }
  
  if (signals.task_complexity === 'high' && signals.risk_tolerance < 0.3) {
    return bank.variants.find(v => 
      v.performance.accuracy > 0.9 && 
      v.performance.risk_score < 0.2
    );
  }
  
  return bank.variants[0]; // Default to balanced
}
```

### **3. No Weight Retraining**

**Key Advantage**: Changes are **auditable text diffs**

```diff
- You are a financial analyst. Analyze this data.
+ You are an expert financial analyst with 20 years of experience in XBRL analysis. 
+ Carefully examine this data and provide a comprehensive analysis focusing on:
+ 1. Key financial metrics
+ 2. Risk indicators
+ 3. Compliance issues
```

**Benefits**:
- ✅ **Human readable** - anyone can review changes
- ✅ **Version controlled** - git history of all prompt variants
- ✅ **Instant deployment** - no model retraining needed
- ✅ **A/B testable** - switch between variants in production
- ✅ **Explainable** - clear causality between text change and performance

---

## 🚀 **Implementation**

### **Pareto Bank Storage**

```typescript
// Store in database or config
const PARETO_BANKS: Record<string, ParetoBank> = {
  'financial_analyst': {
    module_name: 'financial_analyst',
    variants: [
      {
        id: 'high_accuracy_v1',
        text: `You are an expert financial analyst with CFA certification...`,
        performance: {
          accuracy: 0.95,
          latency_ms: 2500,
          cost_per_call: 0.05,
          risk_score: 0.1
        },
        metadata: {
          created_at: '2024-10-01',
          tests_run: 1000,
          success_rate: 0.95,
          context_适用性: ['complex_analysis', 'regulatory', 'high_stakes']
        }
      },
      {
        id: 'balanced_v2',
        text: `You are a financial analyst. Analyze this data carefully...`,
        performance: {
          accuracy: 0.85,
          latency_ms: 1200,
          cost_per_call: 0.02,
          risk_score: 0.3
        },
        metadata: {
          created_at: '2024-10-05',
          tests_run: 2000,
          success_rate: 0.85,
          context_适用性: ['general', 'routine']
        }
      },
      {
        id: 'fast_cheap_v3',
        text: `Analyze this financial data. Be concise.`,
        performance: {
          accuracy: 0.72,
          latency_ms: 500,
          cost_per_call: 0.005,
          risk_score: 0.5
        },
        metadata: {
          created_at: '2024-10-08',
          tests_run: 5000,
          success_rate: 0.72,
          context_适用性: ['quick_scan', 'low_risk', 'free_tier']
        }
      }
    ],
    active_variant_id: 'balanced_v2',
    routing_strategy: 'adaptive'
  },
  
  'risk_assessor': {
    module_name: 'risk_assessor',
    variants: [
      // Similar structure for risk assessment module
    ],
    active_variant_id: 'high_accuracy_risk_v1',
    routing_strategy: 'accuracy'
  }
};
```

### **Runtime Routing Logic**

```typescript
class GEPARuntimeRouter {
  private banks: Map<string, ParetoBank> = new Map();
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  
  constructor() {
    // Load Pareto banks from storage
    this.loadBanks();
  }
  
  /**
   * Select optimal prompt variant based on runtime signals
   */
  async selectVariant(
    moduleName: string,
    signals: RoutingSignals
  ): Promise<PromptVariant> {
    const bank = this.banks.get(moduleName);
    if (!bank) {
      throw new Error(`No Pareto bank for module: ${moduleName}`);
    }
    
    // Calculate utility score for each variant
    const scoredVariants = bank.variants.map(variant => ({
      variant,
      score: this.calculateUtilityScore(variant, signals)
    }));
    
    // Sort by score (highest first)
    scoredVariants.sort((a, b) => b.score - a.score);
    
    // Select top variant
    const selected = scoredVariants[0].variant;
    
    // Log decision for audit trail
    await this.logRoutingDecision(moduleName, selected, signals, scoredVariants);
    
    return selected;
  }
  
  /**
   * Calculate utility score based on current context
   */
  private calculateUtilityScore(
    variant: PromptVariant,
    signals: RoutingSignals
  ): number {
    // Multi-objective optimization
    const weights = this.getWeights(signals);
    
    // Normalize metrics to 0-1 range
    const normalizedAccuracy = variant.performance.accuracy;
    const normalizedLatency = 1 - (variant.performance.latency_ms / 5000);
    const normalizedCost = 1 - (variant.performance.cost_per_call / 0.1);
    const normalizedRisk = 1 - variant.performance.risk_score;
    
    // Weighted sum
    return (
      weights.accuracy * normalizedAccuracy +
      weights.latency * normalizedLatency +
      weights.cost * normalizedCost +
      weights.risk * normalizedRisk
    );
  }
  
  /**
   * Determine weights based on runtime signals
   */
  private getWeights(signals: RoutingSignals): {
    accuracy: number;
    latency: number;
    cost: number;
    risk: number;
  } {
    // Adaptive weights based on context
    if (signals.user_tier === 'enterprise' && signals.task_complexity === 'high') {
      return { accuracy: 0.5, latency: 0.2, cost: 0.1, risk: 0.2 };
    }
    
    if (signals.budget_remaining < 1.0 || signals.user_tier === 'free') {
      return { accuracy: 0.2, latency: 0.3, cost: 0.4, risk: 0.1 };
    }
    
    if (signals.latency_requirement < 1000 || signals.current_load > 0.8) {
      return { accuracy: 0.3, latency: 0.5, cost: 0.1, risk: 0.1 };
    }
    
    // Balanced default
    return { accuracy: 0.4, latency: 0.3, cost: 0.2, risk: 0.1 };
  }
  
  /**
   * Log routing decision for audit trail
   */
  private async logRoutingDecision(
    moduleName: string,
    selected: PromptVariant,
    signals: RoutingSignals,
    allScores: Array<{ variant: PromptVariant; score: number }>
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      module: moduleName,
      selected_variant: selected.id,
      signals,
      all_scores: allScores.map(s => ({
        variant_id: s.variant.id,
        score: s.score
      })),
      reasoning: this.generateReasoning(selected, signals)
    };
    
    console.log('GEPA Routing Decision:', JSON.stringify(logEntry, null, 2));
    // Store in audit log database
  }
  
  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    selected: PromptVariant,
    signals: RoutingSignals
  ): string {
    const reasons: string[] = [];
    
    if (signals.latency_requirement < 1000) {
      reasons.push(`Low latency required (${signals.latency_requirement}ms) - selected variant with ${selected.performance.latency_ms}ms latency`);
    }
    
    if (signals.budget_remaining < 1.0) {
      reasons.push(`Budget constrained ($${signals.budget_remaining} remaining) - selected cost-efficient variant at $${selected.performance.cost_per_call}/call`);
    }
    
    if (signals.task_complexity === 'high') {
      reasons.push(`Complex task detected - selected high-accuracy variant (${selected.performance.accuracy * 100}% accuracy)`);
    }
    
    return reasons.join('; ');
  }
  
  /**
   * Update performance metrics based on actual results
   */
  async updateMetrics(
    moduleName: string,
    variantId: string,
    actualPerformance: {
      success: boolean;
      latency_ms: number;
      cost: number;
      error?: string;
    }
  ): Promise<void> {
    // Update running averages
    // Adjust Pareto bank if needed
    // Trigger re-optimization if performance degrades
  }
  
  /**
   * Add new variant to Pareto bank
   */
  async addVariant(
    moduleName: string,
    variant: PromptVariant
  ): Promise<void> {
    const bank = this.banks.get(moduleName);
    if (!bank) return;
    
    // Check if variant is Pareto-optimal
    const isDominated = bank.variants.some(existing => 
      this.dominates(existing, variant)
    );
    
    if (!isDominated) {
      bank.variants.push(variant);
      
      // Remove variants that are now dominated
      bank.variants = bank.variants.filter(v1 => 
        !bank.variants.some(v2 => v1 !== v2 && this.dominates(v2, v1))
      );
      
      await this.saveBanks();
    }
  }
  
  /**
   * Check if variant1 dominates variant2 (Pareto dominance)
   */
  private dominates(v1: PromptVariant, v2: PromptVariant): boolean {
    return (
      v1.performance.accuracy >= v2.performance.accuracy &&
      v1.performance.latency_ms <= v2.performance.latency_ms &&
      v1.performance.cost_per_call <= v2.performance.cost_per_call &&
      v1.performance.risk_score <= v2.performance.risk_score &&
      (
        v1.performance.accuracy > v2.performance.accuracy ||
        v1.performance.latency_ms < v2.performance.latency_ms ||
        v1.performance.cost_per_call < v2.performance.cost_per_call ||
        v1.performance.risk_score < v2.performance.risk_score
      )
    );
  }
  
  private async loadBanks(): Promise<void> {
    // Load from database or config file
  }
  
  private async saveBanks(): Promise<void> {
    // Save to database or config file
  }
}
```

---

## 📊 **Advantages Over Traditional Approaches**

### **1. No Model Retraining**
- ✅ **Instant deployment** - change prompts in seconds
- ✅ **No GPU costs** - no backpropagation needed
- ✅ **No downtime** - switch variants on the fly

### **2. Auditable Text Diffs**
```bash
$ git diff HEAD~1 HEAD -- pareto-banks/financial_analyst.json
```

**See exactly what changed**:
```diff
- "text": "You are a financial analyst."
+ "text": "You are a financial analyst with CFA certification and 20 years of experience."
```

### **3. Runtime Adaptability**
- **High load** → Use fast, cheap variants
- **Low budget** → Use cost-optimized variants
- **Critical task** → Use high-accuracy variants
- **Free tier user** → Use efficient variants
- **Enterprise customer** → Use premium variants

### **4. Explainable Decisions**
Every routing decision has a **clear audit trail**:
```json
{
  "timestamp": "2024-10-12T10:30:00Z",
  "module": "financial_analyst",
  "selected_variant": "balanced_v2",
  "reasoning": "Budget constrained ($0.50 remaining) - selected cost-efficient variant at $0.02/call; Task complexity: medium",
  "alternatives_considered": [
    {"variant": "high_accuracy_v1", "score": 0.75, "rejected": "too expensive"},
    {"variant": "balanced_v2", "score": 0.92, "selected": true},
    {"variant": "fast_cheap_v3", "score": 0.65, "rejected": "insufficient accuracy"}
  ]
}
```

### **5. Continuous Optimization**
- **A/B testing** built-in
- **Pareto frontier** automatically maintained
- **Live performance feedback** updates variants
- **No offline training** required

---

## 🎯 **Use Cases**

### **1. Cost Management**
```typescript
// Morning (low load): Use high-accuracy variants
// Peak hours (high load): Switch to fast, cheap variants
// Enterprise users: Always use premium variants
// Free tier: Always use cost-optimized variants
```

### **2. SLA Compliance**
```typescript
// P99 latency > 2s: Automatically switch to faster variants
// Budget exceeded: Route to cheaper variants
// Accuracy drops: Escalate to better prompts
```

### **3. Risk Management**
```typescript
// High-risk financial decision: Use most accurate variant
// Routine query: Use balanced variant
// Internal testing: Use experimental variants
```

---

## 🚀 **Integration with ACE Framework**

```typescript
// In your agent execution
const router = new GEPARuntimeRouter();

// Get runtime signals
const signals: RoutingSignals = {
  current_load: await getSystemLoad(),
  budget_remaining: await getUserBudget(userId),
  latency_requirement: taskMetadata.sla_ms,
  risk_tolerance: taskMetadata.risk_level,
  user_tier: user.tier,
  task_complexity: analyzeComplexity(task),
  time_of_day: new Date().getHours()
};

// Select optimal prompt variant
const variant = await router.selectVariant('financial_analyst', signals);

// Execute with selected variant
const result = await executeModule(variant.text, taskData);

// Update metrics for future routing
await router.updateMetrics('financial_analyst', variant.id, {
  success: result.success,
  latency_ms: result.duration,
  cost: result.cost
});
```

---

## 🎉 **Why This Is Revolutionary**

### **Traditional ML**
- ❌ Train weights → Deploy → Monitor → Retrain (days/weeks)
- ❌ Black box decisions
- ❌ Expensive retraining
- ❌ Static models

### **GEPA Runtime Routing**
- ✅ Edit text → Deploy → Instant feedback → Update (minutes)
- ✅ Transparent audit trail
- ✅ Zero retraining cost
- ✅ Dynamic adaptation

**This is how production AI should work.** 🚀
