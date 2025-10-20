# DSPy Per-Module Configuration with Ax LLM

## Overview

This document explains the best practices for per-module LLM configuration in DSPy using Ax LLM, demonstrating how to use `module.set_lm()` instead of global `dspy.configure()`.

## Key Benefits

### 1. **Flexibility**
- Each module can use different LLMs optimized for its specific role
- Easy to swap models per module without affecting others
- Better cost optimization by using cheaper models where appropriate

### 2. **Performance Optimization**
- Use faster models for simple tasks, slower but better models for complex tasks
- Optimize latency per component
- Enable A/B testing of different models per module

### 3. **Cost Control**
- Teacher modules can use premium models (Perplexity, Claude)
- Student modules can use cost-effective models (Ollama, local)
- Judge modules can use specialized evaluation models

## Implementation

### Basic Per-Module Configuration

```typescript
// Define static LLM instances for different roles
export class PerModuleLLMConfig {
  // Teacher LLM (Perplexity for web search)
  static teacherLLM = {
    model: 'perplexity/sonar-pro',
    apiKey: process.env.PERPLEXITY_API_KEY,
    temperature: 0.7,
    systemPrompt: 'You are an expert teacher with web search capabilities.'
  };

  // Student LLM (Local Ollama for cost efficiency)
  static studentLLM = {
    model: 'ollama/gemma3:4b',
    baseURL: 'http://localhost:11434',
    temperature: 0.5,
    systemPrompt: 'You are a learning student model.'
  };

  // Judge LLM (OpenRouter free model for evaluation - using best performer!)
  static judgeLLM = {
    model: 'nvidia/nemotron-nano-9b-v2:free',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    temperature: 0.3,
    systemPrompt: 'You are an expert judge for evaluating AI responses.'
  };
}
```

### Module Implementation

```typescript
export class TeacherModule {
  private llm: any;

  constructor() {
    this.llm = PerModuleLLMConfig.teacherLLM;
  }

  set_lm(llm: any) {
    this.llm = llm;
  }

  forward(query: string) {
    // Teacher logic using this.llm
    return `Teacher's comprehensive answer for: ${query}`;
  }
}
```

## Comparison: Global vs Per-Module

### Global Configuration (Traditional)
```typescript
// All modules use the same LLM
dspy.configure({
  lm: 'gpt-4',
  temperature: 0.7
});

// Problems:
// - All modules use identical configuration
// - No flexibility for different use cases
// - Hard to optimize individual modules
// - More expensive when using premium models everywhere
```

### Per-Module Configuration (Best Practice)
```typescript
// Each module gets its own optimized LLM
const teacher = new TeacherModule(); // Uses Perplexity
const student = new StudentModule(); // Uses Ollama
const judge = new JudgeModule();     // Uses OpenRouter free model

// Benefits:
// - Each module optimized for its specific role
// - Better cost control per component
// - Easier A/B testing and experimentation
// - Runtime configuration updates possible
```

## Cost Optimization Example

```typescript
const expensiveLLM = {
  model: 'perplexity/sonar-pro',
  cost_per_1k_tokens: 0.005
};

const cheapLLM = {
  model: 'nvidia/nemotron-nano-9b-v2:free',
  cost_per_1k_tokens: 0.000 // Free OpenRouter model
};

// Global approach - all modules use expensive LLM
const globalCost = expensiveLLM.cost_per_1k_tokens * 3; // 0.015

// Per-module approach - optimize cost per role
const perModuleCost = (expensiveLLM.cost_per_1k_tokens * 2) + cheapLLM.cost_per_1k_tokens; // 0.010

// Savings: 33% cost reduction
```

## Performance Optimization Example

```typescript
const fastLLM = {
  model: 'nvidia/nemotron-nano-9b-v2:free',
  latency_ms: 1264
};

const slowLLM = {
  model: 'perplexity/sonar-pro',
  latency_ms: 2000
};

// Global approach - all modules use same performance
const globalLatency = slowLLM.latency_ms * 3; // 6000ms

// Per-module approach - optimize performance per role
const perModuleLatency = (slowLLM.latency_ms * 2) + fastLLM.latency_ms; // 5200ms

// Speed improvement: 13% faster
```

## Runtime Configuration Updates

```typescript
export class RuntimeLLMConfig {
  private static configs: Map<string, any> = new Map();

  static setLLM(moduleId: string, llmConfig: any) {
    this.configs.set(moduleId, llmConfig);
  }

  static updateLLM(moduleId: string, updates: Partial<any>) {
    const current = this.configs.get(moduleId);
    if (current) {
      this.configs.set(moduleId, { ...current, ...updates });
    }
  }
}

// Usage
RuntimeLLMConfig.setLLM('student', {
  model: 'gpt-3.5-turbo',
  temperature: 0.6
});
```

## Integration with PERMUTATION System

The per-module configuration is integrated into the PERMUTATION system through:

1. **GEPA Module**: Uses Ollama for optimization tasks
2. **ACE Module**: Uses Perplexity for context adaptation
3. **Enhanced Judge**: Uses OpenRouter free model for evaluation
4. **Teacher-Student**: Uses Perplexity as teacher, Ollama as student

## Best Practices

1. **Start with per-module configuration** for new projects
2. **Use global configuration** only for simple, uniform systems
3. **Consider cost and performance trade-offs** per module
4. **Implement monitoring** to track per-module performance
5. **Use feature flags** to enable easy LLM switching
6. **Maintain type safety** with TypeScript interfaces

## Files

- `frontend/lib/dspy-per-module-config.ts` - Core per-module configuration
- `frontend/lib/dspy-configuration-comparison.ts` - Global vs per-module comparison
- `frontend/lib/real-dspy-integration.ts` - Integration with PERMUTATION system

## Conclusion

Per-module LLM configuration with Ax LLM provides:
- **Better flexibility** and optimization
- **Cost savings** through targeted model selection
- **Performance improvements** through role-specific optimization
- **Easier experimentation** and A/B testing

This approach is essential for building scalable, cost-effective AI systems with the PERMUTATION framework.