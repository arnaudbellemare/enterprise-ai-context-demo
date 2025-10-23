/**
 * WALT Type Definitions
 *
 * TypeScript types for WALT (Web Agents that Learn Tools) integration
 */

/**
 * WALT Tool Step Types
 */
export type WALTStepType =
  | 'navigate'
  | 'click'
  | 'input'
  | 'select_change'
  | 'key_press'
  | 'scroll'
  | 'extract_page_content'
  | 'wait_for_page_load';

/**
 * Deterministic WALT Steps (no LLM required)
 */
export type WALTDeterministicStep =
  | 'navigate'
  | 'click'
  | 'input'
  | 'select_change'
  | 'key_press'
  | 'scroll';

/**
 * Agentic WALT Steps (LLM-driven)
 */
export type WALTAgenticStep = 'extract_page_content' | 'wait_for_page_load';

/**
 * WALT Tool Step Definition
 */
export interface WALTStep {
  type: WALTStepType;
  selector?: string;
  value?: string;
  url?: string;
  description?: string;
  wait_condition?: string;
  scroll_direction?: 'up' | 'down';
  scroll_amount?: number;
}

/**
 * WALT Tool Input Parameter
 */
export interface WALTToolInput {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

/**
 * WALT Tool Definition (native format)
 */
export interface WALTToolDefinition {
  name: string;
  description: string;
  inputs: Record<string, WALTToolInput>;
  steps: WALTStep[];
  metadata?: {
    source_url: string;
    discovered_at: string;
    success_rate?: number;
    avg_execution_time?: number;
  };
}

/**
 * Discovered WALT Tool
 */
export interface DiscoveredWALTTool {
  name: string;
  domain: string;
  file_path: string;
  definition: WALTToolDefinition;
}

/**
 * Simplified WALT Tool (for native TypeScript discovery)
 */
export interface SimplifiedWALTTool {
  name: string;
  description: string;
  parameters: any;
  code: string;
  source_url: string;
  discovery_method: string;
  confidence_score?: number;
}

/**
 * Tool Discovery Request
 */
export interface ToolDiscoveryRequest {
  url: string;
  goal?: string;
  max_tools?: number;
  headless?: boolean;
}

/**
 * Tool Discovery Response
 */
export interface ToolDiscoveryResponse {
  success: boolean;
  url: string;
  domain: string;
  tools_discovered: number;
  tools: DiscoveredWALTTool[];
  output_dir: string;
  error?: string;
}

/**
 * Tool Generation Request (targeted)
 */
export interface ToolGenerationRequest {
  url: string;
  goal: string;
  headless?: boolean;
}

/**
 * Tool Generation Response
 */
export interface ToolGenerationResponse {
  success: boolean;
  url: string;
  goal: string;
  tool?: DiscoveredWALTTool;
  error?: string;
}

/**
 * Tool Quality Metrics
 */
export interface ToolQualityMetrics {
  quality_score: number; // 0.0-1.0
  success_rate: number; // 0.0-1.0
  total_executions: number;
  avg_execution_time_ms: number;
  last_used_at?: Date;
  discovered_at: Date;
}

/**
 * WALT Tool with Quality Metrics
 */
export interface WALTToolWithMetrics extends DiscoveredWALTTool {
  id: string; // UUID from database
  metrics: ToolQualityMetrics;
}

/**
 * Tool Storage Record (for database)
 */
export interface WALTToolStorageRecord {
  id: string;
  tool_name: string;
  tool_definition: WALTToolDefinition;
  source_url: string;
  domain: string[];
  quality_score: number;
  success_rate: number;
  total_executions: number;
  last_used_at?: Date;
  discovered_at: Date;
  embedding?: number[]; // Vector embedding for semantic search
  metadata?: Record<string, any>;
}

/**
 * Tool Execution Request
 */
export interface WALTToolExecutionRequest {
  tool_name: string;
  domain: string;
  parameters: Record<string, any>;
}

/**
 * Tool Execution Result
 */
export interface WALTToolExecutionResult {
  success: boolean;
  tool_name: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  execution_time_ms: number;
  steps_executed: number;
}

/**
 * WALT Service Health Check
 */
export interface WALTServiceHealth {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  walt_tools_dir: string;
}

/**
 * Tool List Response
 */
export interface ToolListResponse {
  success: boolean;
  total_tools: number;
  tools: DiscoveredWALTTool[];
  error?: string;
}

/**
 * Domain Configuration for Discovery
 */
export interface DomainDiscoveryConfig {
  domain: string;
  urls: string[];
  goals: string[];
  priority: number;
  max_tools_per_site: number;
  cache_ttl_ms: number;
}

/**
 * Validation Result
 */
export interface ToolValidationResult {
  valid: boolean;
  tool_name: string;
  issues: string[];
  warnings: string[];
  quality_score: number;
}
