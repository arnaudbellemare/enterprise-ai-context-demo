/**
 * Common Type Definitions for PERMUTATION
 *
 * Centralized type definitions to replace `any` types throughout the codebase.
 * Organized by domain for easy discovery and maintenance.
 *
 * Usage:
 * ```typescript
 * import { Query, ExecutionResult, ACEPlaybookBullet } from './common-types';
 * ```
 */

// =============================================================================
// CORE QUERY TYPES
// =============================================================================

export interface Query {
  text: string;
  domain?: Domain;
  metadata?: QueryMetadata;
}

export interface QueryMetadata {
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  priority?: 'low' | 'normal' | 'high';
}

export type Domain =
  | 'general'
  | 'financial'
  | 'technical'
  | 'medical'
  | 'legal'
  | 'business'
  | 'creative'
  | 'multilingual';

// =============================================================================
// EXECUTION RESULT TYPES
// =============================================================================

export interface ExecutionResult {
  answer: string;
  confidence: number;
  reasoning?: ReasoningStep[];
  metadata: ExecutionMetadata;
}

export interface ReasoningStep {
  step: number;
  description: string;
  result: string;
  confidence: number;
}

export interface ExecutionMetadata {
  queryId: string;
  executionTimeMs: number;
  model: string;
  domain: Domain;
  irtDifficulty?: number;
  cacheHit: boolean;
  cost?: number;
  qualityScore?: number;
}

// =============================================================================
// ACE FRAMEWORK TYPES
// =============================================================================

export interface ACEPlaybookBullet {
  id: string;
  section: string;
  content: string;
  helpful_count: number;
  harmful_count: number;
  tags: string[];
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface ACEContext {
  query: string;
  domain: Domain;
  playbooks: ACEPlaybookBullet[];
  previousFailures?: string[];
}

export interface ACETrajectory {
  prompt: string;
  response: string;
  success: boolean;
  reflection?: string;
}

// =============================================================================
// GEPA OPTIMIZATION TYPES
// =============================================================================

export interface GEPAIndividual {
  prompt: string;
  fitness: GEPAFitness;
  generation: number;
  id: string;
}

export interface GEPAFitness {
  quality: number;
  cost: number;
  latency: number;
  paretoRank?: number;
}

export interface GEPAPopulation {
  individuals: GEPAIndividual[];
  generation: number;
  paretoFront: GEPAIndividual[];
}

// =============================================================================
// IRT ROUTING TYPES
// =============================================================================

export interface IRTParameters {
  difficulty: number; // b parameter (0-1)
  discrimination: number; // a parameter (typically 0.5-2.0)
  systemAbility: number; // θ parameter (PERMUTATION's ability, ~0.85)
}

export interface IRTRoutingDecision {
  useTeacherModel: boolean;
  probability: number;
  difficulty: number;
  reasoning: string;
}

// =============================================================================
// TEACHER-STUDENT TYPES
// =============================================================================

export interface TeacherStudentConfig {
  teacherModel: ModelConfig;
  studentModel: ModelConfig;
  irtThreshold: number;
  distillationEnabled: boolean;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'perplexity' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

// =============================================================================
// MEMORY AND CACHING TYPES
// =============================================================================

export interface MemoryRecord {
  id: string;
  query: string;
  response: string;
  embedding: number[];
  domain: Domain;
  quality_score: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  created_at: number;
  hit_count: number;
}

export interface SemanticCacheQuery {
  query: string;
  similarityThreshold: number;
  maxResults: number;
}

// =============================================================================
// REASONING AND VERIFICATION TYPES
// =============================================================================

export interface TRMVerificationResult {
  verified: boolean;
  confidence: number;
  iterations: number;
  refinedAnswer?: string;
  reasoning: string[];
}

export interface ReasoningBankEntry {
  query: string;
  solution: string;
  pattern: string;
  domain: Domain;
  success_rate: number;
  usage_count: number;
}

// =============================================================================
// DSPy INTEGRATION TYPES
// =============================================================================

export interface DSPyModule {
  name: string;
  signature: string;
  config: DSPyModuleConfig;
}

export interface DSPyModuleConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  validation?: ValidationConfig;
}

export interface ValidationConfig {
  schema?: Record<string, unknown>;
  rules?: ValidationRule[];
  strict?: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'pattern' | 'range' | 'custom';
  value?: string | number | ((val: unknown) => boolean);
  message?: string;
}

// =============================================================================
// MULTI-QUERY EXPANSION TYPES
// =============================================================================

export interface ExpandedQuery {
  original: string;
  variations: string[];
  domain: Domain;
  expansionStrategy: 'semantic' | 'syntactic' | 'hybrid';
}

export interface QueryVariation {
  text: string;
  type: 'paraphrase' | 'decomposition' | 'specification' | 'generalization';
  confidence: number;
}

// =============================================================================
// PARALLEL EXECUTION TYPES
// =============================================================================

export interface ParallelExecutionResult<T = unknown> {
  results: T[];
  errors: ParallelExecutionError[];
  executionTimeMs: number;
  successRate: number;
}

export interface ParallelExecutionError {
  index: number;
  error: Error;
  input: unknown;
}

// =============================================================================
// OBSERVABILITY AND MONITORING TYPES
// =============================================================================

export interface TraceEntry {
  id: string;
  query: string;
  domain: Domain;
  steps: TraceStep[];
  result: ExecutionResult;
  created_at: string;
}

export interface TraceStep {
  name: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  success: boolean;
  error?: string;
}

export interface MetricPoint {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  labels?: Record<string, string>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  executionTimeMs: number;
  version: string;
}

// =============================================================================
// SUPABASE DATABASE TYPES
// =============================================================================

export interface Database {
  public: {
    Tables: {
      ace_playbook_bullets: {
        Row: ACEPlaybookBullet;
        Insert: Omit<ACEPlaybookBullet, 'id' | 'created_at'>;
        Update: Partial<Omit<ACEPlaybookBullet, 'id'>>;
      };
      memories: {
        Row: MemoryRecord;
        Insert: Omit<MemoryRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<MemoryRecord, 'id'>>;
      };
      traces: {
        Row: TraceEntry;
        Insert: Omit<TraceEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<TraceEntry, 'id'>>;
      };
    };
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make specific properties required in a type
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional in a type
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract promise return type
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;

/**
 * Non-nullable type
 */
export type NonNullable<T> = Exclude<T, null | undefined>;

/**
 * Deep partial (make all nested properties optional)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isQuery(value: unknown): value is Query {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    typeof (value as Query).text === 'string'
  );
}

export function isExecutionResult(value: unknown): value is ExecutionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'answer' in value &&
    'confidence' in value &&
    'metadata' in value
  );
}

export function isDomain(value: unknown): value is Domain {
  const validDomains: Domain[] = [
    'general',
    'financial',
    'technical',
    'medical',
    'legal',
    'business',
    'creative',
    'multilingual'
  ];
  return typeof value === 'string' && validDomains.includes(value as Domain);
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_DOMAIN: Domain = 'general';

export const IRT_THRESHOLDS = {
  EASY: 0.3,
  MEDIUM: 0.5,
  HARD: 0.7,
  VERY_HARD: 0.85
} as const;

export const MODEL_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  PERPLEXITY: 'perplexity',
  OLLAMA: 'ollama'
} as const;

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000 // 24 hours
} as const;
