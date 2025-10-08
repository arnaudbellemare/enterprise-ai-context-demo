# 🔧 DSPy Integration Guide

## What is DSPy?

**DSPy (Declarative Self-improving Python)** is a framework for **automatically optimizing LLM prompts and workflows**. Think of it as:
- **Type-safe LLM programming** (like TypeScript for AI)
- **Automatic prompt engineering** (no manual prompt tuning)
- **Self-improving AI systems** (gets better with usage)
- **Metric-driven optimization** (optimizes for YOUR goals)

## 🚀 Why DSPy is the Best Framework

### 1. **Automatic Prompt Optimization**
- No more manual prompt engineering
- Automatically finds the best prompts for your task
- Uses machine learning to improve over time

### 2. **Type-Safe AI Programming**
- Define input/output contracts (Signatures)
- Catch errors before runtime
- Better IDE support and documentation

### 3. **Composable Modules**
- Build complex workflows from simple components
- Reuse optimized modules across projects
- Easy to test and debug

### 4. **Self-Improvement**
- Learns from successful executions
- Auto-optimizes with feedback
- Gets better without manual tuning

---

## 📦 Core DSPy Abstractions

### 1. **Signatures** (Type Contracts)

Define what goes in and what comes out:

```typescript
const signature = createSignature(
  'Market Analysis',
  {
    marketData: 'Raw market research data',
    industry: 'Industry to analyze',
  },
  {
    keyTrends: 'Top 3-5 market trends',
    opportunities: 'Investment opportunities',
    risks: 'Potential risks',
  },
  'You are a senior market analyst. Provide actionable insights.'
);
```

### 2. **Modules** (Composable Components)

Modules execute tasks with optimization:

```typescript
// Chain of Thought module (adds reasoning)
class MarketAnalyzer extends ChainOfThought {
  constructor() {
    super(marketAnalysisSignature);
  }
}

// Use it
const analyzer = new MarketAnalyzer();
const result = await analyzer.forward({
  marketData: '...',
  industry: 'Real Estate'
});
```

### 3. **Optimizers** (Auto-Improvement)

Optimizers improve modules automatically:

```typescript
// Bootstrap Few-Shot Optimizer
const optimizer = new BootstrapFewShot(metric, 4, 16);
const optimizedModule = await optimizer.optimize(
  module,
  trainingData
);

// MIPRO Optimizer (Multi-prompt optimization)
const mipro = new MIPRO(metric, 10);
const optimized = await mipro.optimize(module, trainingData);
```

### 4. **Self-Optimizing Workflows**

Workflows that improve with every execution:

```typescript
const workflow = new SelfOptimizingWorkflow(10); // Auto-optimize after 10 examples

// Register modules
workflow.registerModule('analyzer', new MarketAnalyzer());
workflow.registerModule('reporter', new ReportGenerator());

// Execute and learn
const result = await workflow.executeModule(
  'analyzer',
  inputs,
  expectedOutputs // Optional: for learning
);
```

---

## 🎯 Available DSPy Modules

### Market Analysis
- **DSPy Market Analyzer**: Self-optimizing market research analysis
- **DSPy Competitive Analyzer**: Competitive landscape analysis
- **DSPy Investment Report**: Comprehensive investment reports

### Industry-Specific Agents
- **DSPy Real Estate Agent**: Specialized real estate analysis
- **DSPy Financial Analyst**: Financial metrics and analysis
- **DSPy Legal Analyst**: Legal and regulatory analysis

### Data Processing
- **DSPy Data Synthesizer**: Merge data from multiple sources
- **DSPy Entity Extractor**: Extract structured data from text

---

## 🔧 Using DSPy in Workflows

### Method 1: Via Workflow Builder

1. **Open**: `localhost:3000/workflow`
2. **Drag**: Any DSPy module (marked with 🔧) onto the canvas
3. **Configure**: Set inputs in the config panel
4. **Connect**: Link to other nodes
5. **Execute**: Run the workflow

### Method 2: Via API

```typescript
const response = await fetch('/api/dspy/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    moduleName: 'market_research_analyzer',
    inputs: {
      marketData: 'Miami luxury real estate...',
      industry: 'Real Estate'
    },
    optimize: true // Enable auto-optimization
  })
});

const result = await response.json();
console.log(result.outputs);
console.log(result.metrics);
```

### Method 3: Direct Integration

```typescript
import { MarketResearchAnalyzer } from '@/lib/dspy-workflows';

const analyzer = new MarketResearchAnalyzer();
const result = await analyzer.forward({
  marketData: '...',
  industry: 'Real Estate'
});
```

---

## 📊 Optimization Strategies

### Bootstrap Few-Shot
**Best for**: Quick optimization with labeled data

```typescript
const optimizer = new BootstrapFewShot(
  metric,        // Scoring function
  4,             // Max bootstrapped demos
  16             // Max labeled demos
);
```

**How it works**:
1. Runs module on training examples
2. Scores results with metric function
3. Selects best examples as few-shot demos
4. Injects demos into future prompts

### MIPRO (Multi-Prompt Instruction Proposal)
**Best for**: Finding the perfect instruction/prompt

```typescript
const optimizer = new MIPRO(
  metric,        // Scoring function
  10             // Number of candidates to test
);
```

**How it works**:
1. Generates instruction variants
2. Tests each on training data
3. Selects best-performing instruction
4. Returns optimized module

---

## 🎯 Metrics (How to Measure Success)

### Built-in Metrics

```typescript
import { Metrics } from '@/lib/dspy-core';

// Exact match
const metric1 = Metrics.exactMatch;

// Contains expected output
const metric2 = Metrics.contains;

// Just checks if succeeded
const metric3 = Metrics.success;
```

### Custom Metrics

```typescript
const customMetric = (example: any, prediction: any): number => {
  // Your custom scoring logic
  // Return 0-1 score (higher is better)
  
  const expectedKeys = Object.keys(example.outputs);
  const predictionKeys = Object.keys(prediction);
  
  const matchedKeys = expectedKeys.filter(key => 
    predictionKeys.includes(key)
  );
  
  return matchedKeys.length / expectedKeys.length;
};
```

---

## 🔄 Example: Real Estate Workflow with DSPy

### Step 1: Create the Workflow

```typescript
import { createOptimizedRealEstateWorkflow } from '@/lib/dspy-workflows';

const workflow = await createOptimizedRealEstateWorkflow();
```

### Step 2: Execute with Auto-Learning

```typescript
// First execution
const analysis = await workflow.executeModule(
  'market_research',
  { 
    marketData: 'Miami luxury condos...',
    industry: 'Real Estate' 
  }
);

// Execute agent
const agentResult = await workflow.executeModule(
  'real_estate_agent',
  {
    propertyData: analysis.outputs.keyTrends,
    location: 'Miami Beach',
    investmentType: 'buy'
  }
);

// Generate report
const report = await workflow.executeModule(
  'investment_report',
  {
    marketAnalysis: agentResult.outputs.recommendation,
    investmentGoals: 'Long-term appreciation'
  }
);
```

### Step 3: Check Optimization Metrics

```typescript
const metrics = workflow.getWorkflowMetrics();
console.log(metrics);
// {
//   market_research: { callCount: 10, avgLatency: 2.3s, successRate: 1.0 },
//   real_estate_agent: { callCount: 10, avgLatency: 3.1s, successRate: 0.95 },
//   investment_report: { callCount: 10, avgLatency: 2.8s, successRate: 1.0 }
// }
```

---

## 🎨 Example Workflow Configurations

### 1. **Market Research → DSPy Analyzer → DSPy Report**

**Best for**: Quick market insights with automatic optimization

```
Web Search → DSPy Market Analyzer → DSPy Investment Report
```

### 2. **Multi-Source Analysis**

**Best for**: Comprehensive analysis from multiple sources

```
Web Search ─┐
            ├→ DSPy Data Synthesizer → DSPy Financial Analyst → DSPy Report
Memory Search┘
```

### 3. **Industry-Specific Deep Dive**

**Best for**: Specialized industry analysis

```
Perplexity Search → DSPy Real Estate Agent → DSPy Investment Report
```

---

## ⚡ Performance Tips

### 1. **Use Appropriate Modules**
- `Predict`: For simple tasks (faster)
- `ChainOfThought`: For complex reasoning (better quality)

### 2. **Optimize Regularly**
- Set `optimizationThreshold` to auto-optimize after N examples
- Lower threshold = faster optimization but more API calls
- Higher threshold = slower optimization but more stable

### 3. **Cache Results**
- DSPy modules track optimization history
- Reuse optimized modules across sessions
- Save metrics for monitoring

---

## 🔬 Advanced: Creating Custom DSPy Modules

```typescript
import { ChainOfThought, createSignature } from '@/lib/dspy-core';

export class CustomAnalyzer extends ChainOfThought {
  constructor() {
    const signature = createSignature(
      'Custom Task',
      {
        input1: 'Description of input 1',
        input2: 'Description of input 2',
      },
      {
        output1: 'Description of output 1',
        output2: 'Description of output 2',
      },
      'Your custom instructions here'
    );
    
    super(signature, 'meta-llama/llama-3.1-8b-instruct:free', 0.7);
  }
}
```

---

## 📈 Monitoring & Analytics

### Get Module Metrics

```typescript
const module = new MarketResearchAnalyzer();

// After some executions
const metrics = module.getMetrics();
console.log({
  callCount: metrics.callCount,        // Total calls
  avgLatency: metrics.averageLatency,  // Avg response time
  successRate: metrics.successRate     // Success percentage
});
```

### Track Optimization History

```typescript
// Access optimization history
const history = module['optimizationHistory'];

history.forEach(entry => {
  console.log({
    inputs: entry.inputs,
    outputs: entry.outputs,
    latency: entry.latency,
    success: entry.success,
    timestamp: entry.timestamp
  });
});
```

---

## 🚀 Quick Start Checklist

- [x] ✅ DSPy core abstractions integrated
- [x] ✅ Pre-built modules available (8+ modules)
- [x] ✅ Auto-optimization enabled
- [x] ✅ API endpoint created (`/api/dspy/execute`)
- [x] ✅ Workflow builder integration
- [x] ✅ Self-optimizing workflows
- [x] ✅ Bootstrap Few-Shot optimizer
- [x] ✅ MIPRO optimizer
- [x] ✅ Metrics & monitoring
- [x] ✅ Type-safe signatures

---

## 🎯 Why This Makes Us the Best Framework

### 1. **Automatic Optimization**
- ❌ Other frameworks: Manual prompt engineering
- ✅ Our framework: Automatic prompt optimization with DSPy

### 2. **Type Safety**
- ❌ Other frameworks: String-based prompts (error-prone)
- ✅ Our framework: Type-safe signatures (catch errors early)

### 3. **Self-Improvement**
- ❌ Other frameworks: Static performance
- ✅ Our framework: Gets better with every execution

### 4. **Composability**
- ❌ Other frameworks: Monolithic agents
- ✅ Our framework: Modular, reusable components

### 5. **Metrics & Monitoring**
- ❌ Other frameworks: Black box execution
- ✅ Our framework: Full visibility into performance

---

## 📚 Additional Resources

- **API Endpoint**: `/api/dspy/execute`
- **Workflow Builder**: `localhost:3000/workflow`
- **Core Library**: `frontend/lib/dspy-core.ts`
- **Workflow Modules**: `frontend/lib/dspy-workflows.ts`

## 🔗 Related Files

- `frontend/lib/dspy-core.ts` - Core DSPy abstractions
- `frontend/lib/dspy-workflows.ts` - Pre-built modules
- `frontend/app/api/dspy/execute/route.ts` - API endpoint
- `frontend/app/workflow/page.tsx` - Workflow builder

---

**🎉 You now have a self-optimizing, enterprise-grade AI workflow system powered by DSPy!**

