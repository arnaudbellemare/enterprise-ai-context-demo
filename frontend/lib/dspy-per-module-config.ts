/**
 * DSPy Per-Module Configuration with Ax LLM
 * 
 * Demonstrates best practices for per-module LLM configuration in DSPy
 * using Ax LLM instead of global dspy.configure()
 */

// ============================================================================
// 1. PER-MODULE LLM CONFIGURATION (Best Practice)
// ============================================================================

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

// Example DSPy Modules using per-module configuration
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

export class StudentModule {
  private llm: any;

  constructor() {
    this.llm = PerModuleLLMConfig.studentLLM;
  }

  set_lm(llm: any) {
    this.llm = llm;
  }

  forward(query: string, teacherResponse: string) {
    // Student learning logic using this.llm
    return `Student's learned response based on teacher: ${teacherResponse} for query: ${query}`;
  }
}

export class JudgeModule {
  private llm: any;

  constructor() {
    this.llm = PerModuleLLMConfig.judgeLLM;
  }

  set_lm(llm: any) {
    this.llm = llm;
  }

  forward(originalResponse: string, optimizedResponse: string) {
    // Judge evaluation logic using this.llm
    return `Evaluation: Original score 0.7, Optimized score 0.9`;
  }
}

// ============================================================================
// 2. MULTI-DOMAIN SYSTEM EXAMPLE
// ============================================================================

export class MultiDomainSystem {
  private modules: Map<string, any> = new Map();

  constructor() {
    // Initialize modules with different LLMs
    this.modules.set('legal', new TeacherModule());
    this.modules.set('finance', new StudentModule());
    this.modules.set('tech', new JudgeModule());
  }

  processQuery(domain: string, query: string) {
    const module = this.modules.get(domain);
    if (!module) {
      throw new Error(`No module found for domain: ${domain}`);
    }
    return module.forward(query);
  }
}

// ============================================================================
// 3. RUNTIME CONFIGURATION UPDATES
// ============================================================================

export class RuntimeLLMConfig {
  private static configs: Map<string, any> = new Map();

  static setLLM(moduleId: string, llmConfig: any) {
    this.configs.set(moduleId, llmConfig);
  }

  static getLLM(moduleId: string) {
    return this.configs.get(moduleId);
  }

  static updateLLM(moduleId: string, updates: Partial<any>) {
    const current = this.configs.get(moduleId);
    if (current) {
      this.configs.set(moduleId, { ...current, ...updates });
    }
  }
}

// ============================================================================
// 4. USAGE EXAMPLES
// ============================================================================

export function demonstratePerModuleConfig() {
  // Example 1: Basic per-module configuration
  const teacher = new TeacherModule();
  const student = new StudentModule();
  const judge = new JudgeModule();

  // Each module uses its own LLM configuration
  const teacherResponse = teacher.forward("What is machine learning?");
  const studentResponse = student.forward("What is machine learning?", teacherResponse);
  const judgeResponse = judge.forward(teacherResponse, studentResponse);

  // Example 2: Multi-domain system
  const multiDomain = new MultiDomainSystem();
  const legalResponse = multiDomain.processQuery('legal', 'What are the legal implications?');
  const financeResponse = multiDomain.processQuery('finance', 'What is the ROI?');

  // Example 3: Runtime configuration updates
  RuntimeLLMConfig.setLLM('custom', {
    model: 'gpt-4',
    temperature: 0.8,
    systemPrompt: 'Custom system prompt'
  });

  return {
    teacherResponse,
    studentResponse,
    judgeResponse,
    legalResponse,
    financeResponse
  };
}
