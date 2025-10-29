/**
 * Type Definitions for MoE Brain Orchestrator
 * Replaces all 'any' types with proper TypeScript interfaces
 */

// ============================================================================
// Core Context Types
// ============================================================================

export interface BrainContext {
  domain?: string;
  skillsRequired?: string[];
  metadata?: Record<string, unknown>;
  reasoningBankMemories?: ReasoningMemory[];
  userPreferences?: UserPreferences;
  sessionState?: SessionState;
  sessionId?: string;
  memoryCount?: number;
  complexity?: number;
  requirements?: string[];
  userProfile?: Record<string, unknown>;
  brandGuidelines?: Record<string, unknown>;
  safetyRequirements?: Record<string, unknown>;
  culturalContext?: Record<string, unknown>;
  expectedTone?: 'professional' | 'friendly' | 'authoritative' | 'empathetic' | string;
  expectedStyle?: 'detailed' | 'concise' | 'conversational' | 'technical' | string;
  expectedFocus?: 'problem-solving' | 'education' | 'support' | 'sales' | string;
  query?: string;
  needsRealTime?: boolean;
  [key: string]: unknown; // Allow additional properties
}

export interface ReasoningMemory {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  preferredSkills?: string[];
  qualityThreshold?: number;
  maxLatency?: number;
  costSensitive?: boolean;
}

export interface SessionState {
  previousQueries: string[];
  skillUsageHistory: Map<string, number>;
  totalCost: number;
  averageQuality: number;
}

// ============================================================================
// Skill Types
// ============================================================================

export interface SkillExecutor {
  execute: (query: string, context: BrainContext) => Promise<SkillResult>;
  executeBatch?: (queries: string[], context: BrainContext) => Promise<SkillResult[]>;
  supportsBatching?: boolean;
  implementations?: Record<string, { cost: number; latency: number; accuracy: number }>;
}

export interface SkillResult {
  response: string;
  confidence: number;
  cost: number | undefined;
  latency: number;
  metadata?: Record<string, unknown>;
  success?: boolean;
  error?: string;
}

export interface SkillWithScore {
  name: string;
  skill: SkillExecutor;
  score: number;
}

// ============================================================================
// Router Types
// ============================================================================

export interface SkillRouter {
  selectExperts: (query: string, context: BrainContext, topK?: number) => Promise<RouterResult>;
  experts: Map<string, SkillExecutor>;
  routeQuery?: (request: {
    query: string;
    domain: string;
    complexity: number;
    requirements: string[];
    budget?: number;
    maxLatency?: number;
  }) => Promise<{
    selectedExperts: Array<{ id: string }>;
    metrics: { relevanceScores: Record<string, number> };
  }>;
}

export interface RouterResult {
  selectedExperts: Array<{
    name: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  allScores: Record<string, number>;
}

// ============================================================================
// Evaluation Types
// ============================================================================

export interface EvaluationResult {
  score: number;
  confidence: number;
  feedback: string;
  metrics?: {
    accuracy?: number;
    coherence?: number;
    relevance?: number;
    completeness?: number;
  };
}

export interface PerformanceMetric {
  score: number;
  feedback: string;
  timestamp: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface MoEError extends Error {
  code: string;
  skillId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Priority = 'low' | 'normal' | 'high';

export interface ResourceAllocation {
  cpuLimit: number;
  memoryLimit: number;
  concurrencyLimit: number;
}

export interface PromptHistoryEntry {
  prompt: string;
  timestamp: number;
  performance: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface MoERequest {
  query: string;
  context: BrainContext;
  sessionId?: string;
  priority?: Priority;
  budget?: number;
  maxLatency?: number;
  requiredQuality?: number;
}

export interface MoEResponse {
  response: string;
  metadata: {
    skillsActivated: string[];
    skillScores: Record<string, number>;
    implementations: Record<string, string>;
    totalCost: number;
    averageQuality: number;
    totalLatency: number;
    moeOptimized: boolean;
    batchOptimized: boolean;
    loadBalanced: boolean;
    resourceOptimized: boolean;
    openEvalsEnabled?: boolean;
    combinedScore?: number;
    evaluationRecommendations?: string[];
    brainEvaluationEnabled?: boolean;
    behavioralEvaluationEnabled?: boolean;
    behavioralScore?: number;
    behavioralDimensions?: Array<{ dimension: string; score: number }>;
    behavioralInsights?: string[];
    improvementRecommendations?: string[];
    continualLearningEnabled?: boolean;
    memorySlotsUpdated?: boolean;
    learningRate?: number;
    sparseUpdates?: boolean;
    [key: string]: unknown; // Allow additional properties
  };
  performance: {
    selectionTime: number;
    executionTime: number;
    synthesisTime: number;
    totalTime: number;
    evaluationTime?: number;
    [key: string]: unknown; // Allow additional properties
  };
}

// ============================================================================
// Execution Types
// ============================================================================

export interface SkillExecutionResult {
  skillName: string;
  result: SkillResult;
  executionTime: number;
  success?: boolean;
  error?: string;
  cost?: number;
  quality?: number;
}

export interface BatchExecutionResult {
  results: SkillExecutionResult[];
  totalTime: number;
  successCount: number;
  failureCount: number;
  skillName?: string;
  metadata?: Record<string, unknown>;
}

export interface LoadBalancingResult {
  assignedSkills?: Map<string, SkillWithScore[]>;
  resourceUtilization?: Record<string, number>;
  skillName?: string;
  result?: SkillResult;
  executionTime?: number;
  cost?: number;
  quality?: number;
  loadBalanced?: boolean;
}

export interface ResourceOptimizationResult {
  optimizedSchedule?: SkillExecutionResult[];
  savedTime?: number;
  savedCost?: number;
  skillName?: string;
  result?: SkillResult;
  executionTime?: number;
  cost?: number;
  quality?: number;
  resourceOptimized?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MoEConfiguration {
  maxConcurrentSkills?: number;
  maxSkills?: number;
  maxConcurrency?: number;
  batchingThreshold?: number;
  batchSize?: number;
  batchTimeout?: number;
  loadBalancingEnabled?: boolean;
  enableLoadBalancing?: boolean;
  resourceOptimizationEnabled?: boolean;
  enableResourceOptimization?: boolean;
  enableBatching?: boolean;
  enableDynamicImplementation?: boolean;
  qualityThreshold?: number;
  costLimit?: number;
  costThreshold?: number;
  latencyLimit?: number;
  latencyThreshold?: number;
  minRelevanceScore?: number;
}

export interface MoEMetrics {
  totalQueries: number;
  totalRequests?: number;
  successfulRequests?: number;
  failedRequests?: number;
  averageLatency: number;
  averageCost: number;
  averageQuality: number;
  skillUsageCount: Record<string, number>;
  errorRate: number;
  [key: string]: unknown;
}

export interface MoEOptimizationResult {
  optimizedPrompt: string;
  improvements: string[];
  expectedGains: {
    quality: number;
    cost: number;
    latency: number;
  };
}

export interface MoEHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, unknown>;
  timestamp: number;
  components?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  lastUpdated?: number;
}

export interface PromptEvolutionData {
  skillId: string;
  originalPrompt: string;
  evolvedPrompt: string;
  performanceGain: number;
  timestamp: number;
}

export interface PerformanceTrackingData {
  skillId: string;
  averageScore: number;
  totalExecutions: number;
  recentTrend: 'improving' | 'stable' | 'degrading';
}

export interface SelfImprovementConfig {
  evolutionThreshold: number;
  minSamplesForEvolution: number;
  performanceWindow: number;
  axLLMEnabled: boolean;
  enablePromptEvolution?: boolean;
  enablePerformanceTracking?: boolean;
  enableAdaptiveRouting?: boolean;
  trackingWindow?: number;
  adaptationRate?: number;
}
