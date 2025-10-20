/**
 * DSPy Configuration Comparison: Global vs Per-Module
 * 
 * Demonstrates the benefits of per-module LLM configuration
 * over global dspy.configure() approach
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION (Traditional Approach)
// ============================================================================

export class GlobalDSPyConfig {
  private static globalLLM: any = null;

  static configure(llm: any) {
    this.globalLLM = llm;
  }

  static getGlobalLLM() {
    return this.globalLLM;
  }

  // Problems with global configuration:
  // 1. All modules use the same LLM
  // 2. No flexibility for different use cases
  // 3. Hard to optimize individual modules
  // 4. Difficult to A/B test different models
}

// ============================================================================
// 2. PER-MODULE CONFIGURATION (Best Practice)
// ============================================================================

export class PerModuleDSPyConfig {
  private llm: any;

  constructor(llm: any) {
    this.llm = llm;
  }

  set_lm(llm: any) {
    this.llm = llm;
  }

  get_lm() {
    return this.llm;
  }

  // Benefits of per-module configuration:
  // 1. Each module can use different LLMs
  // 2. Easy to optimize individual modules
  // 3. Better cost control per component
  // 4. Easier A/B testing and experimentation
}

// ============================================================================
// 3. COMPARISON EXAMPLES
// ============================================================================

export class ConfigurationComparison {
  
  // Global approach - all modules use same LLM
  static globalApproach() {
    // Set global LLM once
    GlobalDSPyConfig.configure({
      model: 'gpt-4',
      temperature: 0.7
    });

    // All modules use the same configuration
    const teacher = new PerModuleDSPyConfig(GlobalDSPyConfig.getGlobalLLM());
    const student = new PerModuleDSPyConfig(GlobalDSPyConfig.getGlobalLLM());
    const judge = new PerModuleDSPyConfig(GlobalDSPyConfig.getGlobalLLM());

    return {
      teacher: teacher.get_lm(),
      student: student.get_lm(),
      judge: judge.get_lm(),
      problem: 'All modules use identical configuration'
    };
  }

  // Per-module approach - each module optimized
  static perModuleApproach() {
    // Each module gets its own optimized LLM
    const teacher = new PerModuleDSPyConfig({
      model: 'perplexity/sonar-pro',
      temperature: 0.7,
      systemPrompt: 'You are an expert teacher with web search capabilities.'
    });

    const student = new PerModuleDSPyConfig({
      model: 'ollama/gemma3:4b',
      temperature: 0.5,
      systemPrompt: 'You are a learning student model.'
    });

    const judge = new PerModuleDSPyConfig({
      model: 'nvidia/nemotron-nano-9b-v2:free',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      temperature: 0.3,
      systemPrompt: 'You are an expert judge for evaluating AI responses.'
    });

    return {
      teacher: teacher.get_lm(),
      student: student.get_lm(),
      judge: judge.get_lm(),
      benefit: 'Each module optimized for its specific role'
    };
  }

  // Cost optimization example
  static costOptimizationExample() {
    const expensiveLLM = {
      model: 'perplexity/sonar-pro',
      cost_per_1k_tokens: 0.005
    };

    const cheapLLM = {
      model: 'google/gemma-2-9b-it:free',
      cost_per_1k_tokens: 0.000 // Free OpenRouter model
    };

    // Global approach - all modules use expensive LLM
    const globalCost = {
      teacher: expensiveLLM,
      student: expensiveLLM,
      judge: expensiveLLM,
      totalCost: expensiveLLM.cost_per_1k_tokens * 3
    };

    // Per-module approach - optimize cost per role
    const perModuleCost = {
      teacher: expensiveLLM, // Teacher needs best quality
      student: cheapLLM,     // Student can use cheaper model
      judge: expensiveLLM,   // Judge needs best quality
      totalCost: (expensiveLLM.cost_per_1k_tokens * 2) + cheapLLM.cost_per_1k_tokens
    };

    return {
      globalApproach: globalCost,
      perModuleApproach: perModuleCost,
      savings: globalCost.totalCost - perModuleCost.totalCost
    };
  }

  // Performance optimization example
  static performanceOptimizationExample() {
    const fastLLM = {
      model: 'google/gemma-2-9b-it:free',
      latency_ms: 1200
    };

    const slowLLM = {
      model: 'perplexity/sonar-pro',
      latency_ms: 2000
    };

    // Global approach - all modules use same performance
    const globalPerformance = {
      teacher: slowLLM,
      student: slowLLM,
      judge: slowLLM,
      totalLatency: slowLLM.latency_ms * 3
    };

    // Per-module approach - optimize performance per role
    const perModulePerformance = {
      teacher: slowLLM,  // Teacher needs best quality
      student: fastLLM,  // Student can be faster
      judge: slowLLM,    // Judge needs best quality
      totalLatency: (slowLLM.latency_ms * 2) + fastLLM.latency_ms
    };

    return {
      globalApproach: globalPerformance,
      perModuleApproach: perModulePerformance,
      speedImprovement: globalPerformance.totalLatency - perModulePerformance.totalLatency
    };
  }
}

// ============================================================================
// 4. BEST PRACTICES SUMMARY
// ============================================================================

export const BestPractices = {
  perModuleConfiguration: [
    'Use module.set_lm() instead of global dspy.configure()',
    'Assign different LLMs based on module requirements',
    'Optimize cost by using cheaper models where appropriate',
    'Optimize performance by using faster models where possible',
    'Enable A/B testing by easily swapping LLMs per module',
    'Maintain type safety with TypeScript interfaces'
  ],

  globalConfiguration: [
    'Only use when all modules have identical requirements',
    'Simpler setup but less flexible',
    'Harder to optimize individual components',
    'More expensive when using premium models everywhere'
  ],

  recommendations: [
    'Start with per-module configuration for new projects',
    'Use global configuration only for simple, uniform systems',
    'Consider cost and performance trade-offs per module',
    'Implement monitoring to track per-module performance',
    'Use feature flags to enable easy LLM switching'
  ]
};
