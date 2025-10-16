/**
 * Zod-Enhanced Validation System
 * 
 * Based on Ax LLM PR #388 improvements for better type safety and validation
 * in the PERMUTATION system
 */

import { z } from 'zod';

// Domain-specific validation schemas
export const DomainSchemas = {
  finance: z.object({
    query: z.string().min(10, "Finance queries must be at least 10 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
    timeHorizon: z.enum(['short', 'medium', 'long']).optional()
  }),

  technology: z.object({
    query: z.string().min(10, "Technology queries must be at least 10 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false),
    architecture: z.enum(['monolithic', 'microservices', 'serverless']).optional(),
    scale: z.enum(['small', 'medium', 'large', 'enterprise']).optional()
  }),

  healthcare: z.object({
    query: z.string().min(10, "Healthcare queries must be at least 10 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false),
    clinicalContext: z.enum(['diagnostic', 'therapeutic', 'research', 'administrative']).optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional()
  }),

  legal: z.object({
    query: z.string().min(10, "Legal queries must be at least 10 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false),
    jurisdiction: z.string().optional(),
    practiceArea: z.enum(['corporate', 'litigation', 'regulatory', 'compliance']).optional()
  }),

  education: z.object({
    query: z.string().min(10, "Education queries must be at least 10 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false),
    gradeLevel: z.enum(['elementary', 'middle', 'high', 'college', 'graduate']).optional(),
    subject: z.string().optional()
  }),

  general: z.object({
    query: z.string().min(5, "General queries must be at least 5 characters"),
    complexity: z.enum(['low', 'medium', 'high']),
    requiresRealTimeData: z.boolean().default(false)
  })
};

// Component routing validation schema
export const RoutingDecisionSchema = z.object({
  primary_component: z.enum([
    'Teacher Model (Perplexity)',
    'ACE Framework', 
    'TRM Engine',
    'Ollama Student',
    'GEPA Optimizer'
  ]),
  fallback_component: z.enum([
    'Teacher Model (Perplexity)',
    'ACE Framework',
    'TRM Engine', 
    'Ollama Student',
    'GEPA Optimizer'
  ]).optional(),
  use_cache: z.boolean(),
  cache_key: z.string().optional(),
  cache_ttl_seconds: z.number().positive().optional(),
  estimated_cost: z.number().min(0),
  estimated_latency_ms: z.number().positive(),
  reasoning: z.string().min(10, "Reasoning must be at least 10 characters")
});

// TRM Engine validation schema
export const TRMEngineSchema = z.object({
  query: z.string().min(1, "Query is required"),
  domain: z.enum(['general', 'finance', 'technology', 'healthcare', 'legal', 'education', 'crypto']),
  optimizationLevel: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  useRealTimeData: z.boolean().default(false)
});

// GEPA Optimization validation schema
export const GEPAOptimizationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  domain: z.enum(['general', 'finance', 'technology', 'healthcare', 'legal', 'education', 'creative']),
  maxIterations: z.number().int().min(1).max(10).default(3),
  optimizationType: z.enum(['comprehensive', 'focused', 'domain-specific', 'performance-optimized']).default('comprehensive')
});

// Performance monitoring validation schema
export const PerformanceMetricsSchema = z.object({
  component: z.string().min(1, "Component name is required"),
  success: z.boolean(),
  latency: z.number().min(0),
  cost: z.number().min(0),
  timestamp: z.number().optional(),
  error: z.string().optional()
});

// Enhanced validation functions
export class ZodEnhancedValidator {
  private static instance: ZodEnhancedValidator;
  
  static getInstance(): ZodEnhancedValidator {
    if (!ZodEnhancedValidator.instance) {
      ZodEnhancedValidator.instance = new ZodEnhancedValidator();
    }
    return ZodEnhancedValidator.instance;
  }

  /**
   * Validate domain-specific input with enhanced error reporting
   */
  validateDomainInput(domain: string, input: any): { success: boolean; data?: any; errors?: string[] } {
    try {
      const schema = DomainSchemas[domain as keyof typeof DomainSchemas];
      if (!schema) {
        return {
          success: false,
          errors: [`Unknown domain: ${domain}. Supported domains: ${Object.keys(DomainSchemas).join(', ')}`]
        };
      }

      const result = schema.parse(input);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        success: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate routing decision with enhanced diagnostics
   */
  validateRoutingDecision(decision: any): { success: boolean; data?: any; errors?: string[] } {
    try {
      const result = RoutingDecisionSchema.parse(decision);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        success: false,
        errors: [`Routing validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate TRM Engine input
   */
  validateTRMInput(input: any): { success: boolean; data?: any; errors?: string[] } {
    try {
      const result = TRMEngineSchema.parse(input);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        success: false,
        errors: [`TRM validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate GEPA Optimization input
   */
  validateGEPAInput(input: any): { success: boolean; data?: any; errors?: string[] } {
    try {
      const result = GEPAOptimizationSchema.parse(input);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        success: false,
        errors: [`GEPA validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate performance metrics
   */
  validatePerformanceMetrics(metrics: any): { success: boolean; data?: any; errors?: string[] } {
    try {
      const result = PerformanceMetricsSchema.parse(metrics);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        success: false,
        errors: [`Performance metrics validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get validation diagnostics for debugging
   */
  getValidationDiagnostics(domain: string, input: any): {
    domain: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const validation = this.validateDomainInput(domain, input);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Add domain-specific warnings and suggestions
    if (domain === 'finance' && input.query && !input.query.toLowerCase().includes('risk')) {
      warnings.push('Finance queries typically benefit from risk analysis');
      suggestions.push('Consider including risk assessment in your query');
    }

    if (domain === 'healthcare' && input.query && !input.query.toLowerCase().includes('clinical')) {
      warnings.push('Healthcare queries may need clinical context');
      suggestions.push('Consider specifying clinical context or urgency level');
    }

    if (domain === 'technology' && input.query && !input.query.toLowerCase().includes('architecture')) {
      warnings.push('Technology queries often benefit from architectural context');
      suggestions.push('Consider specifying system architecture or scale requirements');
    }

    return {
      domain,
      isValid: validation.success,
      errors: validation.errors || [],
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const zodValidator = ZodEnhancedValidator.getInstance();
