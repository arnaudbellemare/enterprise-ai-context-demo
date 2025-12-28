/**
 * PALIMPZEST-style Declarative Schemas for Property Management Emails
 * Based on arXiv:2405.14696v2 - "A Declarative System for Optimizing AI Workloads"
 * 
 * These schemas enable declarative query optimization, model selection, and token trimming
 */

export interface TenantEmailSchema {
  id: string;
  sender: string;
  content: string;
  attachments?: string[];
  class: 'maintenance' | 'billing' | 'violation' | 'move-in-out' | 'eviction' | 'water-damage' | 'general';
  extracted_slots: {
    unit?: string;
    issue_type?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    amount?: number;
    date?: string;
    tenant_id?: string;
    violation_type?: string;
  };
  confidence: number;
  requires_human_review: boolean;
  processing_cost: number; // Estimated cost in USD
  processing_time: number; // Estimated time in ms
}

export interface PropertyDocSchema {
  unit: string;
  lease_clauses: string[];
  maintenance_history: string[];
  payment_history: string[];
  violations: string[];
}

export interface ResponseSchema {
  template_id: string;
  subject: string;
  body: string;
  slots_filled: Record<string, any>;
  confidence: number;
  cost_estimate: number; // Token cost in USD
  latency_estimate: number; // Milliseconds
  model_used: string;
  optimization_applied: string[];
}

/**
 * Model selection strategy based on email complexity
 * Using Perplexity (teacher) and Gemma3:4b (student) - NO GPT models
 */
export interface ModelSelection {
  model: 'perplexity-sonar-pro' | 'perplexity-sonar' | 'gemma3:4b' | 'ollama-gemma';
  reasoning: string;
  cost_estimate: number;
  latency_estimate: number;
}

/**
 * Token trimming configuration
 */
export interface TokenTrimmingConfig {
  max_tokens: number;
  preserve_context: boolean;
  remove_boilerplate: boolean;
  preserve_entities: boolean;
}

