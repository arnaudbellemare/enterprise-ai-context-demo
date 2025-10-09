import { NextResponse } from 'next/server';

/**
 * INTELLIGENT MODEL ROUTER
 * Routes requests to optimal model based on:
 * - Task complexity
 * - Required capabilities
 * - Cost optimization
 * - Latency requirements
 */

const MODEL_TIERS = {
  // FREE - Local Ollama models
  local: {
    name: 'Ollama (Local)',
    models: ['llama3.2', 'gemma2', 'mistral'],
    cost: 0,
    latency: 'fast',
    capabilities: ['general', 'analysis', 'synthesis', 'simple_reasoning'],
    limitations: ['no_web_search', 'no_citations', 'limited_context'],
    bestFor: ['data_transformation', 'simple_analysis', 'synthesis', 'formatting']
  },
  
  // PAID - Perplexity with web search
  perplexity: {
    name: 'Perplexity AI',
    models: ['sonar-pro', 'sonar'],
    cost: 0.003, // per 1k tokens
    latency: 'medium',
    capabilities: ['web_search', 'citations', 'real_time_data', 'deep_research'],
    limitations: [],
    bestFor: ['research', 'market_analysis', 'current_events', 'fact_checking']
  },
  
  // PREMIUM - GPT-4 for complex reasoning
  premium: {
    name: 'GPT-4',
    models: ['gpt-4', 'gpt-4-turbo'],
    cost: 0.03, // per 1k tokens
    latency: 'slow',
    capabilities: ['complex_reasoning', 'planning', 'code_generation', 'multi_step'],
    limitations: ['no_web_search'],
    bestFor: ['workflow_planning', 'complex_analysis', 'code_generation']
  }
};

/**
 * Analyze task to determine optimal model tier
 */
function selectOptimalModel(task: {
  type: string; // 'research', 'analysis', 'synthesis', 'planning', 'transform'
  complexity: 'low' | 'medium' | 'high';
  requiresWebSearch?: boolean;
  requiresCitations?: boolean;
  requiresRealTimeData?: boolean;
  budgetConstraint?: 'minimize' | 'balanced' | 'quality';
}): {
  tier: keyof typeof MODEL_TIERS;
  model: string;
  reasoning: string;
  estimatedCost: number;
} {
  
  const { type, complexity, requiresWebSearch, requiresCitations, requiresRealTimeData, budgetConstraint = 'balanced' } = task;
  
  console.log('🧠 Model Router - Analyzing task:', task);
  
  // Rule 1: Web search/real-time data REQUIRES Perplexity
  if (requiresWebSearch || requiresCitations || requiresRealTimeData) {
    return {
      tier: 'perplexity',
      model: 'sonar-pro',
      reasoning: 'Task requires web search or real-time data - using Perplexity',
      estimatedCost: MODEL_TIERS.perplexity.cost
    };
  }
  
  // Rule 2: Complex planning/reasoning → Premium (GPT-4)
  if (complexity === 'high' && type === 'planning' && budgetConstraint === 'quality') {
    return {
      tier: 'premium',
      model: 'gpt-4-turbo',
      reasoning: 'Complex planning task requires advanced reasoning',
      estimatedCost: MODEL_TIERS.premium.cost
    };
  }
  
  // Rule 3: Simple tasks → Free (Ollama)
  if (complexity === 'low' || type === 'transform' || type === 'synthesis') {
    return {
      tier: 'local',
      model: 'llama3.2',
      reasoning: 'Simple task can be handled by local model - zero cost',
      estimatedCost: 0
    };
  }
  
  // Rule 4: Medium complexity analysis → Try local first, fallback to Perplexity
  if (complexity === 'medium' && budgetConstraint === 'minimize') {
    return {
      tier: 'local',
      model: 'gemma2',
      reasoning: 'Medium complexity with budget constraint - trying local model',
      estimatedCost: 0
    };
  }
  
  // Rule 5: Default balanced approach → Perplexity for quality
  return {
    tier: 'perplexity',
    model: 'sonar-pro',
    reasoning: 'Balanced quality-cost tradeoff - using Perplexity',
    estimatedCost: MODEL_TIERS.perplexity.cost
  };
}

/**
 * Determine task characteristics from agent config
 */
function analyzeAgentTask(agentConfig: {
  apiEndpoint: string;
  role: string;
  label: string;
  config?: any;
}): {
  type: string;
  complexity: 'low' | 'medium' | 'high';
  requiresWebSearch: boolean;
  requiresCitations: boolean;
  requiresRealTimeData: boolean;
} {
  
  const { apiEndpoint, role, label, config } = agentConfig;
  
  // Web search agents
  if (apiEndpoint === '/api/perplexity/chat' || label.includes('Web Search')) {
    return {
      type: 'research',
      complexity: 'medium',
      requiresWebSearch: true,
      requiresCitations: true,
      requiresRealTimeData: true
    };
  }
  
  // DSPy agents (self-optimizing - use local for cost efficiency)
  if (apiEndpoint === '/api/dspy/execute' || label.includes('DSPy')) {
    return {
      type: 'analysis',
      complexity: 'medium',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealTimeData: false
    };
  }
  
  // GEPA optimizer (can use local)
  if (apiEndpoint === '/api/gepa/optimize' || label.includes('GEPA')) {
    return {
      type: 'synthesis',
      complexity: 'low',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealTimeData: false
    };
  }
  
  // CEL expressions (always local)
  if (apiEndpoint === '/api/cel/execute' || label.includes('CEL')) {
    return {
      type: 'transform',
      complexity: 'low',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealTimeData: false
    };
  }
  
  // LangStruct (structured extraction - local)
  if (apiEndpoint === '/api/langstruct/process') {
    return {
      type: 'transform',
      complexity: 'low',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealTimeData: false
    };
  }
  
  // Custom agents (can use local if task is simple)
  if (apiEndpoint === '/api/agent/chat') {
    // Check role for complexity hints
    const roleLower = role.toLowerCase();
    if (roleLower.includes('research') || roleLower.includes('market')) {
      return {
        type: 'research',
        complexity: 'medium',
        requiresWebSearch: true,
        requiresCitations: false,
        requiresRealTimeData: false
      };
    }
    return {
      type: 'analysis',
      complexity: 'medium',
      requiresWebSearch: false,
      requiresCitations: false,
      requiresRealTimeData: false
    };
  }
  
  // Default
  return {
    type: 'analysis',
    complexity: 'medium',
    requiresWebSearch: false,
    requiresCitations: false,
    requiresRealTimeData: false
  };
}

/**
 * API Route - Get optimal model for agent
 */
export async function POST(request: Request) {
  try {
    const { agentConfig, budgetConstraint = 'balanced' } = await request.json();
    
    // Analyze task
    const taskAnalysis = analyzeAgentTask(agentConfig);
    
    // Select optimal model
    const modelSelection = selectOptimalModel({
      ...taskAnalysis,
      budgetConstraint
    });
    
    return NextResponse.json({
      success: true,
      taskAnalysis,
      modelSelection,
      recommendation: {
        useModel: modelSelection.model,
        useTier: modelSelection.tier,
        reasoning: modelSelection.reasoning,
        estimatedCost: modelSelection.estimatedCost,
        apiEndpoint: getAPIEndpoint(modelSelection.tier, agentConfig.apiEndpoint)
      }
    });
    
  } catch (error) {
    console.error('Model router error:', error);
    return NextResponse.json({ error: 'Model routing failed' }, { status: 500 });
  }
}

/**
 * Determine API endpoint based on tier
 */
function getAPIEndpoint(tier: keyof typeof MODEL_TIERS, originalEndpoint: string): string {
  // If already using specialized endpoint (DSPy, GEPA, etc), keep it
  if (originalEndpoint !== '/api/perplexity/chat' && originalEndpoint !== '/api/agent/chat') {
    return originalEndpoint;
  }
  
  switch (tier) {
    case 'local':
      return '/api/ollama/chat'; // Local Ollama
    case 'perplexity':
      return '/api/perplexity/chat'; // Perplexity with web search
    case 'premium':
      return '/api/openai/chat'; // GPT-4
    default:
      return originalEndpoint;
  }
}

/**
 * Calculate cost for workflow
 */
function estimateWorkflowCost(nodes: any[]): {
  totalEstimatedCost: number;
  breakdown: Array<{
    nodeId: string;
    role: string;
    tier: string;
    cost: number;
  }>;
  optimization: string;
} {
  const breakdown = nodes.map(node => {
    const taskAnalysis = analyzeAgentTask(node);
    const modelSelection = selectOptimalModel({ ...taskAnalysis, budgetConstraint: 'balanced' });
    
    return {
      nodeId: node.id,
      role: node.role || node.label,
      tier: modelSelection.tier,
      cost: modelSelection.estimatedCost
    };
  });
  
  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  const localCount = breakdown.filter(b => b.tier === 'local').length;
  const perplexityCount = breakdown.filter(b => b.tier === 'perplexity').length;
  
  return {
    totalEstimatedCost: totalCost,
    breakdown,
    optimization: `Using ${localCount} local (free) and ${perplexityCount} paid API calls. Estimated cost: $${totalCost.toFixed(4)}`
  };
}

