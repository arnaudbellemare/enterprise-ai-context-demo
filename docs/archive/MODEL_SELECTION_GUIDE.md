# Model Selection Guide - Fast vs Reasoning Models

## 🎯 Overview

Choosing the right model is critical for user experience. Fast models provide immediate responses, while reasoning models deliver higher quality through deliberate "thinking time."

**Key Insight**: Model choice should match user expectations and use case requirements.

---

## ⚡ Fast Models vs 🧠 Reasoning Models

### **Fast Models (e.g., gpt-4.1, gpt-3.5-turbo)**

**Characteristics**:
- Response time: 1-3 seconds
- Streams immediately
- Lower cost per token
- Good for straightforward tasks
- Real-time interaction

**When to Use**:
- ✅ Building chatbots or conversational UI
- ✅ Users expect immediate responses
- ✅ Tasks are straightforward
- ✅ Streaming responses improve UX
- ✅ Cost efficiency is important

**Use Cases in Our System**:
- Agent Builder chat interface
- Entity extraction
- Simple classification
- Instant answers from knowledge graph
- Workflow node execution

---

### **Reasoning Models (e.g., gpt-5-mini, o1-preview)**

**Characteristics**:
- Response time: 10-15+ seconds
- Delayed start (thinking time)
- Higher cost per token
- Better quality for complex tasks
- Requires loading states

**When to Use**:
- ✅ Complex problem-solving required
- ✅ Accuracy is more important than speed
- ✅ Users can wait for better results
- ✅ Task benefits from "thinking time"
- ✅ Good loading states available

**Use Cases in Our System**:
- Complex workflow planning
- Fluid benchmarking analysis
- Multi-step reasoning (CoT prompts)
- Detailed report generation
- Code debugging and architecture reviews

---

## 🔄 Decision Framework

```
User Request
    ↓
Real-time interaction needed?
├─ YES → Fast Model (gpt-4.1)
└─ NO → Complex reasoning needed?
    ├─ YES → High accuracy critical?
    │   ├─ YES → Reasoning Model (gpt-5-mini)
    │   └─ NO → Consider UX trade-off
    │       ├─ Can provide good loading UI? → Reasoning Model
    │       └─ Otherwise → Fast model + follow-up option
    └─ NO → Fast Model
```

---

## 🛠️ Implementation in Our System

### **Model Router** (`frontend/lib/model-router.ts`)

Create a smart router that selects the optimal model based on task characteristics:

```typescript
import { z } from 'zod';

// Model capabilities and characteristics
export interface ModelProfile {
  provider: string;
  model: string;
  avgLatencyMs: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  capabilities: {
    reasoning: 'low' | 'medium' | 'high' | 'very_high';
    speed: 'slow' | 'medium' | 'fast' | 'very_fast';
    contextWindow: number;
    maxOutput: number;
  };
  bestFor: string[];
}

// Available models in our system
export const MODEL_PROFILES: Record<string, ModelProfile> = {
  'gpt-4.1': {
    provider: 'openai',
    model: 'gpt-4.1',
    avgLatencyMs: 2000,
    costPer1kTokens: {
      input: 0.03,
      output: 0.06
    },
    capabilities: {
      reasoning: 'high',
      speed: 'fast',
      contextWindow: 128000,
      maxOutput: 4096
    },
    bestFor: ['chat', 'classification', 'extraction', 'general']
  },
  
  'gpt-5-mini': {
    provider: 'openai',
    model: 'gpt-5-mini',
    avgLatencyMs: 12000,
    costPer1kTokens: {
      input: 0.05,
      output: 0.15
    },
    capabilities: {
      reasoning: 'very_high',
      speed: 'slow',
      contextWindow: 128000,
      maxOutput: 16384
    },
    bestFor: ['reasoning', 'complex_analysis', 'debugging', 'planning']
  },
  
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    avgLatencyMs: 1200,
    costPer1kTokens: {
      input: 0.0015,
      output: 0.002
    },
    capabilities: {
      reasoning: 'medium',
      speed: 'very_fast',
      contextWindow: 16385,
      maxOutput: 4096
    },
    bestFor: ['simple_chat', 'quick_classification', 'basic_extraction']
  },
  
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    avgLatencyMs: 2500,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015
    },
    capabilities: {
      reasoning: 'high',
      speed: 'fast',
      contextWindow: 200000,
      maxOutput: 4096
    },
    bestFor: ['writing', 'analysis', 'creative']
  },
  
  'perplexity-online': {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-small-128k-online',
    avgLatencyMs: 3000,
    costPer1kTokens: {
      input: 0.0002,
      output: 0.0002
    },
    capabilities: {
      reasoning: 'medium',
      speed: 'fast',
      contextWindow: 128000,
      maxOutput: 4096
    },
    bestFor: ['web_search', 'current_events', 'factual']
  }
};

// Task configuration
export const RouterConfigSchema = z.object({
  task: z.enum([
    'chat',
    'classification',
    'summarization',
    'extraction',
    'reasoning',
    'complex_analysis',
    'code_generation',
    'web_search',
    'creative_writing'
  ]),
  priority: z.enum(['cost', 'speed', 'quality', 'balanced']),
  maxLatencyMs: z.number().optional(),
  estimatedTokens: z.number().optional(),
  requiresStreaming: z.boolean().default(true),
  userWillWait: z.boolean().default(false)
});

export type RouterConfig = z.infer<typeof RouterConfigSchema>;

// Telemetry data
interface ModelTelemetry {
  modelKey: string;
  calls: number;
  avgLatency: number;
  successRate: number;
  avgCost: number;
  lastUsed: Date;
}

class ModelRouter {
  private telemetry: Map<string, ModelTelemetry> = new Map();
  
  /**
   * Select the optimal model based on task and constraints
   */
  selectModel(config: RouterConfig): string {
    const { task, priority, maxLatencyMs, userWillWait } = config;
    
    // Filter models by capability
    const candidateModels = Object.entries(MODEL_PROFILES).filter(([_, profile]) => {
      return profile.bestFor.includes(task);
    });
    
    if (candidateModels.length === 0) {
      // Fallback to general-purpose model
      return 'openai/gpt-4.1';
    }
    
    // Score each model based on priority
    const scoredModels = candidateModels.map(([key, profile]) => {
      let score = 0;
      
      switch (priority) {
        case 'cost':
          // Lower cost = higher score
          score = 1 / ((profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2);
          break;
          
        case 'speed':
          // Lower latency = higher score
          score = 1 / profile.avgLatencyMs * 10000;
          // Bonus for fast models
          if (profile.capabilities.speed === 'very_fast') score *= 1.5;
          if (profile.capabilities.speed === 'fast') score *= 1.2;
          break;
          
        case 'quality':
          // Higher reasoning = higher score
          const reasoningScores = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'very_high': 4
          };
          score = reasoningScores[profile.capabilities.reasoning];
          break;
          
        case 'balanced':
          // Balance all factors
          const costScore = 1 / ((profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2);
          const speedScore = 1 / profile.avgLatencyMs * 10000;
          const qualityScore = reasoningScores[profile.capabilities.reasoning];
          score = (costScore + speedScore + qualityScore) / 3;
          break;
      }
      
      // Apply constraints
      if (maxLatencyMs && profile.avgLatencyMs > maxLatencyMs) {
        score *= 0.5; // Penalize slow models if latency constraint
      }
      
      if (!userWillWait && profile.avgLatencyMs > 5000) {
        score *= 0.3; // Heavy penalty for slow models if user won't wait
      }
      
      // Apply telemetry bonus
      const telemetry = this.telemetry.get(key);
      if (telemetry && telemetry.successRate > 0.9) {
        score *= 1.1; // Bonus for reliable models
      }
      
      return { key, profile, score };
    });
    
    // Sort by score and return best
    scoredModels.sort((a, b) => b.score - a.score);
    const selected = scoredModels[0];
    
    console.log(`🎯 Selected model: ${selected.key} (score: ${selected.score.toFixed(2)})`);
    
    return `${selected.profile.provider}/${selected.profile.model}`;
  }
  
  /**
   * Log telemetry data for a model call
   */
  logCall(modelKey: string, latency: number, success: boolean, cost: number) {
    const current = this.telemetry.get(modelKey) || {
      modelKey,
      calls: 0,
      avgLatency: 0,
      successRate: 1,
      avgCost: 0,
      lastUsed: new Date()
    };
    
    // Update running averages
    const totalCalls = current.calls + 1;
    current.avgLatency = (current.avgLatency * current.calls + latency) / totalCalls;
    current.avgCost = (current.avgCost * current.calls + cost) / totalCalls;
    current.successRate = (current.successRate * current.calls + (success ? 1 : 0)) / totalCalls;
    current.calls = totalCalls;
    current.lastUsed = new Date();
    
    this.telemetry.set(modelKey, current);
  }
  
  /**
   * Get telemetry stats for visualization
   */
  getStats() {
    return Array.from(this.telemetry.values()).map(t => ({
      model: t.modelKey,
      calls: t.calls,
      avgLatency: Math.round(t.avgLatency),
      successRate: (t.successRate * 100).toFixed(1) + '%',
      avgCost: t.avgCost.toFixed(4),
      lastUsed: t.lastUsed.toISOString()
    }));
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();

// Helper function for common use cases
export function selectModelForTask(
  task: RouterConfig['task'],
  options: Partial<Omit<RouterConfig, 'task'>> = {}
): string {
  return modelRouter.selectModel({
    task,
    priority: options.priority || 'balanced',
    maxLatencyMs: options.maxLatencyMs,
    estimatedTokens: options.estimatedTokens,
    requiresStreaming: options.requiresStreaming ?? true,
    userWillWait: options.userWillWait ?? false
  });
}
```

---

### **API Endpoint** (`frontend/app/api/model-router/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { modelRouter, selectModelForTask, RouterConfigSchema } from '@/lib/model-router';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = RouterConfigSchema.parse(body);
    
    const selectedModel = modelRouter.selectModel(config);
    
    return NextResponse.json({
      success: true,
      selectedModel,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const stats = modelRouter.getStats();
    
    return NextResponse.json({
      success: true,
      stats,
      totalCalls: stats.reduce((sum, s) => sum + s.calls, 0),
      models: stats.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### **Stats Visualization Endpoint** (`frontend/app/api/model-router/stats/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { modelRouter } from '@/lib/model-router';

export async function GET(req: NextRequest) {
  try {
    const stats = modelRouter.getStats();
    
    // Last 100 calls (for visualization)
    const recentStats = stats.slice(-100);
    
    // Aggregate data for charts
    const modelUsage = recentStats.reduce((acc, stat) => {
      acc[stat.model] = (acc[stat.model] || 0) + stat.calls;
      return acc;
    }, {} as Record<string, number>);
    
    const avgLatencyByModel = recentStats.reduce((acc, stat) => {
      if (!acc[stat.model]) {
        acc[stat.model] = [];
      }
      acc[stat.model].push(stat.avgLatency);
      return acc;
    }, {} as Record<string, number[]>);
    
    // Calculate averages
    const latencyAverages = Object.entries(avgLatencyByModel).map(([model, latencies]) => ({
      model,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length
    }));
    
    return NextResponse.json({
      success: true,
      visualization: {
        modelUsage,
        latencyAverages,
        totalCalls: recentStats.reduce((sum, s) => sum + s.calls, 0),
        timeRange: {
          from: recentStats[0]?.lastUsed || new Date(),
          to: recentStats[recentStats.length - 1]?.lastUsed || new Date()
        }
      },
      rawData: recentStats
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🎨 UX Patterns for Different Models

### **Fast Model UX (1-3 seconds)**

```typescript
// frontend/app/agent-builder/page.tsx

const handleFastQuery = async () => {
  setIsLoading(true);
  
  // Select fast model
  const model = selectModelForTask('chat', {
    priority: 'speed',
    maxLatencyMs: 3000
  });
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message: input,
        model // Fast model
      })
    });
    
    // Stream immediately visible
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], content: prev[prev.length - 1].content + chunk }
      ]);
    }
  } finally {
    setIsLoading(false);
  }
};
```

### **Reasoning Model UX (10-15 seconds)**

```typescript
// frontend/app/agent-builder/page.tsx

const handleComplexAnalysis = async () => {
  setIsAnalyzing(true);
  setAnalysisProgress(0);
  
  // Select reasoning model
  const model = selectModelForTask('complex_analysis', {
    priority: 'quality',
    userWillWait: true
  });
  
  // Show thinking indicator
  setThinkingMessage('Analyzing your request... This might take 10-15 seconds');
  
  try {
    // Simulate progress (since we don't get actual progress from reasoning models)
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 1500);
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ 
        query: input,
        model // Reasoning model
      })
    });
    
    clearInterval(progressInterval);
    setAnalysisProgress(100);
    
    const result = await response.json();
    setAnalysisResult(result);
    
  } catch (error) {
    console.error('Analysis failed:', error);
    setError('Analysis failed. Please try again.');
  } finally {
    setIsAnalyzing(false);
    setAnalysisProgress(0);
  }
};

// UI Component
{isAnalyzing && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        <span className="font-medium text-black" style={{ fontFamily: 'monospace' }}>
          Thinking...
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'monospace' }}>
        {thinkingMessage}
      </p>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-black h-2 rounded-full transition-all duration-300"
          style={{ width: `${analysisProgress}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'monospace' }}>
        {analysisProgress}% complete
      </p>
    </div>
  </div>
)}
```

---

## 💡 Hybrid Approaches

### **Fast Response + Optional Deep Analysis**

```typescript
const handleQuery = async () => {
  // Step 1: Fast initial response
  const fastModel = selectModelForTask('chat', { priority: 'speed' });
  const quickResponse = await getQuickAnswer(query, fastModel);
  
  setMessages(prev => [...prev, quickResponse]);
  
  // Step 2: Offer detailed analysis
  setShowDeepAnalysisOption(true);
};

const handleDeepAnalysis = async () => {
  // User opts in for better analysis
  const reasoningModel = selectModelForTask('complex_analysis', {
    priority: 'quality',
    userWillWait: true
  });
  
  setIsDeepAnalyzing(true);
  const detailedResponse = await getDetailedAnalysis(query, reasoningModel);
  setMessages(prev => [...prev, detailedResponse]);
  setIsDeepAnalyzing(false);
};

// UI
{showDeepAnalysisOption && (
  <button
    onClick={handleDeepAnalysis}
    className="mt-2 px-4 py-2 bg-gray-100 text-black rounded hover:bg-gray-200"
    style={{ fontFamily: 'monospace' }}
  >
    Get Detailed Analysis (10-15s)
  </button>
)}
```

---

## 📊 Cost Considerations

### **Cost Tracking**

```typescript
interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  model: string;
}

function estimateCost(
  inputText: string,
  expectedOutputTokens: number,
  modelKey: string
): CostEstimate {
  const profile = MODEL_PROFILES[modelKey];
  
  // Rough token estimation (4 chars ≈ 1 token)
  const inputTokens = Math.ceil(inputText.length / 4);
  const outputTokens = expectedOutputTokens;
  
  const inputCost = (inputTokens / 1000) * profile.costPer1kTokens.input;
  const outputCost = (outputTokens / 1000) * profile.costPer1kTokens.output;
  
  return {
    inputTokens,
    outputTokens,
    totalCost: inputCost + outputCost,
    model: modelKey
  };
}

// Usage
const fastCost = estimateCost(query, 500, 'gpt-4.1');
const reasoningCost = estimateCost(query, 500, 'gpt-5-mini');

console.log(`Fast model: $${fastCost.totalCost.toFixed(4)}`);
console.log(`Reasoning model: $${reasoningCost.totalCost.toFixed(4)}`);
console.log(`Cost difference: ${((reasoningCost.totalCost / fastCost.totalCost - 1) * 100).toFixed(0)}% more expensive`);
```

---

## 🎯 Real-World Application Examples

### **1. E-commerce Chatbot**

```typescript
// Product questions → Fast model
if (query.includes('product') || query.includes('price') || query.includes('stock')) {
  model = selectModelForTask('chat', { priority: 'speed' });
}

// Complex recommendations → Reasoning model
if (query.includes('recommend') || query.includes('best for')) {
  model = selectModelForTask('reasoning', {
    priority: 'quality',
    userWillWait: true
  });
}
```

### **2. Code Editor Assistant**

```typescript
// Autocomplete → Very fast model
if (action === 'autocomplete') {
  model = selectModelForTask('code_generation', {
    priority: 'speed',
    maxLatencyMs: 1000
  });
}

// Debugging → Reasoning model
if (action === 'debug') {
  model = selectModelForTask('reasoning', {
    priority: 'quality',
    userWillWait: true
  });
}
```

### **3. Educational Platform**

```typescript
// Quick definitions → Fast model
if (questionType === 'definition') {
  model = selectModelForTask('chat', { priority: 'speed' });
}

// Math problem solving → Reasoning model with steps
if (questionType === 'math_problem') {
  model = selectModelForTask('reasoning', {
    priority: 'quality',
    userWillWait: true
  });
  // Show step-by-step thinking
  setShowThinkingSteps(true);
}
```

---

## ✅ Implementation in Our System

### **Current Usage**

Our system already intelligently selects models:

1. **Agent Builder**: Fast model (gpt-4.1) for chat
2. **Workflow Planning**: Reasoning when complex
3. **Entity Extraction**: Fast pattern-based or fast LLM
4. **Fluid Benchmarking**: Reasoning for analysis
5. **Instant Answers**: No LLM (knowledge graph) for speed

### **Enhancements Needed**

Add the model router to:
- Dynamically select models based on query complexity
- Track telemetry for optimization
- Provide cost estimates to users
- Allow user preference (speed vs quality)

---

## 🚀 Next Steps

1. **Implement Model Router**: Use the code above
2. **Add Telemetry**: Track model performance
3. **Create UI Controls**: Let users choose speed vs quality
4. **Optimize Costs**: Monitor spending by model
5. **A/B Test**: Compare model performance

---

**Model selection is critical for UX and cost optimization!** 🎯

