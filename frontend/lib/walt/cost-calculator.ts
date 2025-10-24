/**
 * WALT Cost Calculator
 *
 * Estimates execution costs based on:
 * - LLM API calls (OpenAI, Anthropic)
 * - Browser automation (Playwright time)
 * - Discovery method complexity
 */

export interface CostBreakdown {
  llm_cost: number;
  browser_cost: number;
  total_cost: number;
  currency: 'USD';
}

/**
 * LLM pricing per 1K tokens (as of 2025)
 */
export const LLM_PRICING = {
  'gpt-4o': {
    input: 0.0025, // $2.50 per 1M input tokens
    output: 0.01, // $10 per 1M output tokens
  },
  'gpt-4o-mini': {
    input: 0.00015, // $0.15 per 1M input tokens
    output: 0.0006, // $0.60 per 1M output tokens
  },
  'claude-3-5-sonnet': {
    input: 0.003, // $3 per 1M input tokens
    output: 0.015, // $15 per 1M output tokens
  },
} as const;

/**
 * Browser automation costs (per minute of execution)
 */
export const BROWSER_PRICING = {
  costPerMinute: 0.001, // $0.001 per minute
};

/**
 * Estimate discovery method costs
 */
const DISCOVERY_METHOD_COSTS = {
  search_form: 0.002, // Simple form detection
  api_endpoint: 0.005, // API endpoint discovery with LLM
  javascript_heavy: 0.01, // Complex JavaScript analysis
  multi_step_workflow: 0.015, // Multi-step discovery workflows
} as const;

/**
 * Calculate LLM cost based on token usage
 */
export function calculateLLMCost(
  model: keyof typeof LLM_PRICING,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = LLM_PRICING[model];
  if (!pricing) {
    // Unknown model, use gpt-4o-mini as fallback
    return calculateLLMCost('gpt-4o-mini', inputTokens, outputTokens);
  }

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Calculate browser automation cost based on execution time
 */
export function calculateBrowserCost(executionTimeMs: number): number {
  const minutes = executionTimeMs / 60000;
  return minutes * BROWSER_PRICING.costPerMinute;
}

/**
 * Estimate cost for tool execution
 *
 * Uses heuristics when exact token counts unavailable:
 * - Execution time as proxy for complexity
 * - Discovery method indicates LLM usage
 */
export function estimateToolExecutionCost(params: {
  executionTimeMs: number;
  discoveryMethod?: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: keyof typeof LLM_PRICING;
}): CostBreakdown {
  const { executionTimeMs, discoveryMethod, inputTokens, outputTokens, model = 'gpt-4o-mini' } =
    params;

  let llmCost = 0;
  let browserCost = 0;

  // Calculate LLM cost if token data available
  if (inputTokens && outputTokens) {
    llmCost = calculateLLMCost(model, inputTokens, outputTokens);
  } else if (discoveryMethod) {
    // Estimate based on discovery method
    const methodKey = discoveryMethod as keyof typeof DISCOVERY_METHOD_COSTS;
    llmCost = DISCOVERY_METHOD_COSTS[methodKey] || DISCOVERY_METHOD_COSTS.search_form;
  } else {
    // Fallback: estimate based on execution time
    // Assume ~500 tokens per second of execution
    const estimatedTokens = (executionTimeMs / 1000) * 500;
    llmCost = calculateLLMCost(model, estimatedTokens * 0.7, estimatedTokens * 0.3);
  }

  // Calculate browser cost
  browserCost = calculateBrowserCost(executionTimeMs);

  return {
    llm_cost: llmCost,
    browser_cost: browserCost,
    total_cost: llmCost + browserCost,
    currency: 'USD',
  };
}

/**
 * Calculate average cost per tool in a discovery operation
 */
export function calculateDiscoveryCost(params: {
  toolsDiscovered: number;
  totalExecutionTimeMs: number;
  discoveryMethod: string;
}): number {
  const { toolsDiscovered, totalExecutionTimeMs, discoveryMethod } = params;

  if (toolsDiscovered === 0) {
    return 0;
  }

  const breakdown = estimateToolExecutionCost({
    executionTimeMs: totalExecutionTimeMs,
    discoveryMethod,
  });

  return breakdown.total_cost / toolsDiscovered;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number, decimals: number = 4): string {
  return `$${cost.toFixed(decimals)}`;
}

/**
 * Get cost summary for reporting
 */
export interface CostSummary {
  total_executions: number;
  total_cost: number;
  average_cost: number;
  cost_by_method: Record<string, number>;
}

/**
 * Calculate cost summary from execution records
 */
export function calculateCostSummary(executions: Array<{
  cost?: number;
  execution_time_ms?: number;
  discovery_method?: string;
}>): CostSummary {
  let totalCost = 0;
  const costByMethod: Record<string, number> = {};

  for (const exec of executions) {
    const cost =
      exec.cost ||
      estimateToolExecutionCost({
        executionTimeMs: exec.execution_time_ms || 1000,
        discoveryMethod: exec.discovery_method,
      }).total_cost;

    totalCost += cost;

    const method = exec.discovery_method || 'unknown';
    costByMethod[method] = (costByMethod[method] || 0) + cost;
  }

  return {
    total_executions: executions.length,
    total_cost: totalCost,
    average_cost: executions.length > 0 ? totalCost / executions.length : 0,
    cost_by_method: costByMethod,
  };
}
