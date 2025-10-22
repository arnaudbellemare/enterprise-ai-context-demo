/**
 * MoE Types and Interfaces
 * 
 * Core type definitions for the MoE (Mixture of Experts) system
 * Extracted from moe-orchestrator.ts for better organization
 */

export interface MoERequest {
  query: string;
  context: any;
  sessionId?: string;
  priority?: 'low' | 'normal' | 'high';
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
  };
  performance: {
    selectionTime: number;
    executionTime: number;
    synthesisTime: number;
    totalTime: number;
  };
}

export interface SkillExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  skillName: string;
  executionTime: number;
  cost: number;
  quality: number;
}

export interface BatchExecutionResult {
  skillName: string;
  results: Array<{
    success: boolean;
    result?: any;
    error?: string;
  }>;
  metadata: {
    batchSize: number;
    processingTime: number;
    cost: number;
  };
}

export interface LoadBalancingResult {
  skillName: string;
  result: any;
  executionTime: number;
  cost: number;
  quality: number;
  loadBalanced: boolean;
}

export interface ResourceOptimizationResult {
  skillName: string;
  result: any;
  executionTime: number;
  cost: number;
  quality: number;
  resourceOptimized: boolean;
}

export interface MoEConfiguration {
  maxSkills: number;
  minRelevanceScore: number;
  enableBatching: boolean;
  enableLoadBalancing: boolean;
  enableResourceOptimization: boolean;
  enableDynamicImplementation: boolean;
  batchSize: number;
  batchTimeout: number;
  maxConcurrency: number;
  costThreshold: number;
  qualityThreshold: number;
  latencyThreshold: number;
}

export interface MoEMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageCost: number;
  averageQuality: number;
  cacheHitRate: number;
  batchEfficiency: number;
  loadBalancingEfficiency: number;
  resourceOptimizationEfficiency: number;
}

export interface MoEHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    router: boolean;
    batcher: boolean;
    loadBalancer: boolean;
    resourceManager: boolean;
    dynamicRouter: boolean;
  };
  metrics: MoEMetrics;
  lastUpdated: string;
}

export interface PromptEvolutionData {
  skillId: string;
  originalPrompt: string;
  evolvedPrompt: string;
  performanceImprovement: number;
  feedback: string;
  timestamp: string;
}

export interface PerformanceTrackingData {
  skillId: string;
  query: string;
  response: any;
  evaluation: any;
  score: number;
  feedback: string;
  timestamp: string;
}

export interface SelfImprovementConfig {
  enablePromptEvolution: boolean;
  enablePerformanceTracking: boolean;
  enableAdaptiveRouting: boolean;
  evolutionThreshold: number;
  trackingWindow: number;
  adaptationRate: number;
}

export interface MoEOptimizationResult {
  optimized: boolean;
  optimizations: string[];
  performanceGain: number;
  costSavings: number;
  qualityImprovement: number;
  metadata: Record<string, any>;
}
