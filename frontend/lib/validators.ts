/**
 * Centralized Runtime Validators using ArkType
 * TypeScript-native runtime validation optimized from editor to runtime
 */

import { type } from 'arktype';

// ============================================================================
// ARENA API VALIDATORS
// ============================================================================

export const ArenaExecuteRequest = type({
  taskDescription: 'string',
  'useRealExecution?': 'boolean'
});

export const BenchmarkRequest = type({
  'testSuite?': '"standard" | "comprehensive" | "quick"'
});

// ============================================================================
// SMART EXTRACT API VALIDATORS
// ============================================================================

export const SmartExtractRequest = type({
  text: 'string',
  userId: 'string',
  'schema?': 'unknown',
  'options?': {
    'preferSpeed?': 'boolean',
    'preferAccuracy?': 'boolean',
    'autoDetect?': 'boolean',
    'forceMethod?': '"kg" | "langstruct"'
  }
});

// ============================================================================
// CONTEXT & MEMORY API VALIDATORS
// ============================================================================

export const ContextEnrichRequest = type({
  query: 'string',
  userId: 'string',
  'conversationHistory?': 'unknown[]',
  'userPreferences?': 'unknown',
  'includeSources?': 'string[]'
});

export const EntityExtractRequest = type({
  text: 'string',
  userId: 'string',
  'options?': {
    'extractRelationships?': 'boolean',
    'confidenceThreshold?': 'number'
  }
});

export const InstantAnswerRequest = type({
  query: 'string',
  userId: 'string',
  'options?': {
    'includeRelationships?': 'boolean',
    'maxResults?': 'number'
  }
});

export const MemoryAddRequest = type({
  userId: 'string',
  content: 'string',
  'metadata?': 'unknown'
});

export const MemorySearchRequest = type({
  query: 'string',
  userId: 'string',
  'matchThreshold?': 'number',
  'matchCount?': 'number'
});

// ============================================================================
// MODEL ROUTING API VALIDATORS
// ============================================================================

export const ModelRouterRequest = type({
  query: 'string',
  'taskComplexity?': '"simple" | "medium" | "complex"',
  'costConstraint?': '"minimize" | "balance" | "quality"',
  'speedRequirement?': '"fast" | "medium" | "slow"'
});

export const SemanticRouteRequest = type({
  query: 'string',
  'threshold?': 'number',
  'returnCount?': 'number'
});

// ============================================================================
// WORKFLOW API VALIDATORS
// ============================================================================

export const WorkflowNode = type({
  id: 'string',
  type: 'string',
  label: 'string',
  'apiEndpoint?': 'string',
  'config?': 'unknown'
});

export const WorkflowEdge = type({
  id: 'string',
  source: 'string',
  target: 'string'
});

export const WorkflowExecuteRequest = type({
  nodes: WorkflowNode.array(),
  edges: WorkflowEdge.array(),
  'input?': 'unknown'
});

export const AgentBuilderRequest = type({
  userRequest: 'string',
  'conversationHistory?': 'unknown[]',
  'useACE?': 'boolean',
  'strategy?': '"auto" | "manual"'
});

// ============================================================================
// OPTIMIZATION API VALIDATORS
// ============================================================================

export const GEPAOptimizeRequest = type({
  systemModules: 'Record<string, string>',
  'trainingData?': 'unknown[]',
  'options?': {
    'budget?': 'number',
    'minibatch_size?': 'number',
    'pareto_set_size?': 'number'
  }
});

export const OptimizerImportRequest = type({
  source: '"google_vertex" | "microsoft_copilot" | "openai_assistant" | "custom_json"',
  agentConfig: 'unknown'
});

export const OptimizerOptimizeRequest = type({
  agentId: 'string',
  iterations: 'number',
  'optimizationGoals?': 'string[]'
});

// ============================================================================
// LLM & CHAT API VALIDATORS
// ============================================================================

export const PerplexityRequest = type({
  query: 'string',
  'useRealAI?': 'boolean',
  'maxTokens?': 'number',
  'temperature?': 'number'
});

export const LLMCallRequest = type({
  prompt: 'string',
  'model?': 'string',
  'temperature?': 'number',
  'maxTokens?': 'number'
});

// ============================================================================
// CEL (Context Execution Language) VALIDATORS
// ============================================================================

export const CELExecuteRequest = type({
  expression: 'string',
  'variables?': 'Record<string, unknown>',
  'state?': 'Record<string, unknown>',
  'previousData?': 'unknown',
  'workflowContext?': 'Record<string, unknown>'
});

// ============================================================================
// HELPER FUNCTION - Validate and Return Errors
// ============================================================================

export function validateRequest<T>(
  validator: any,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: any } {
  const result = validator(data);
  
  if (result.problems) {
    return {
      success: false,
      error: 'Validation failed',
      details: result.problems
    };
  }
  
  return {
    success: true,
    data: result.data as T
  };
}

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type ArenaExecuteRequestType = typeof ArenaExecuteRequest.infer;
export type SmartExtractRequestType = typeof SmartExtractRequest.infer;
export type ContextEnrichRequestType = typeof ContextEnrichRequest.infer;
export type ModelRouterRequestType = typeof ModelRouterRequest.infer;
export type WorkflowExecuteRequestType = typeof WorkflowExecuteRequest.infer;
export type AgentBuilderRequestType = typeof AgentBuilderRequest.infer;

