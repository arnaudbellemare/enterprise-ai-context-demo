/**
 * TypeScript Types for Brain Skills System
 *
 * Provides type safety for the brain's subconscious memory system
 */

export interface BrainContext {
  // Query analysis
  query: string;
  domain: string;
  complexity: number;

  // Skill activation flags
  needsReasoning: boolean;
  needsOptimization: boolean;
  needsContext: boolean;
  needsRealTime: boolean;
  needsInformation: boolean;
  requiresSources: boolean;
  needsCostOptimization: boolean;
  needsAdvancedReasoning: boolean;
  needsValidation: boolean;
  requiresWebData: boolean;

  // Context-specific flags
  hasCreativePrompts?: boolean;
  needsAlternativePerspective?: boolean;
  requiresMetaCognition?: boolean;
  needsSemanticUnderstanding?: boolean;
  requiresSpeed?: boolean;
  hasComplexQuery?: boolean;

  // Budget and constraints
  budget?: number;
  quality?: number;

  // Domain-specific context
  groundTruth?: any;

  // Advanced analysis (optional)
  difficulty?: number;
  intent?: 'question' | 'command' | 'analysis' | 'comparison' | 'creative';
  semanticEmbedding?: number[];
  estimatedTokens?: number;
  suggestedSkills?: string[];
}

export interface SkillMetadata {
  processingTime: number;
  model?: string;
  cost?: number;
  quality?: number;
  tokensUsed?: number;
  cacheHit?: boolean;
  fallback?: boolean;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  result?: any;
  message?: string;
  metadata: SkillMetadata;
  timestamp: string;
  fallback?: boolean;
}

export interface BrainSkill {
  name: string;
  description: string;
  priority: number; // 1 = highest, 10 = lowest
  dependencies?: string[]; // Run after these skills
  maxParallel?: number; // Max concurrent executions (default: unlimited)
  activation: (context: BrainContext) => boolean;
  execute: (query: string, context: BrainContext) => Promise<SkillResult>;

  // Optional configuration
  timeout?: number; // Milliseconds
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number; // Milliseconds
}

export interface SkillExecutionResult {
  skillName: string;
  result: SkillResult;
  success: boolean;
  duration: number;
}

export interface BrainProcessingMetrics {
  totalDuration: number;
  skillsActivated: number;
  skillsSucceeded: number;
  skillsFailed: number;
  totalCost: number;
  cacheHits: number;
  parallelExecutions: number;
}

export interface BrainResponse {
  success: boolean;
  query: string;
  domain: string;
  brain_processing: {
    context_analysis: BrainContext;
    activated_skills: string[];
    skill_results: Record<string, SkillResult>;
    synthesis_method: string;
  };
  response: string;
  metadata: {
    processing_time_ms: number;
    skills_activated: number;
    subconscious_memory_used: boolean;
    human_like_cognition: boolean;
  };
  performance_metrics: BrainProcessingMetrics;
  skills: string[];
}

export interface SkillCacheEntry {
  result: SkillResult;
  timestamp: number;
  query: string;
  context: BrainContext;
}

export interface SkillMetricsRow {
  id?: string;
  skill_name: string;
  execution_time_ms: number;
  success: boolean;
  activated_at: string;
  query_hash?: string;
  domain?: string;
  cost?: number;
  quality_score?: number;
  cache_hit?: boolean;
}
