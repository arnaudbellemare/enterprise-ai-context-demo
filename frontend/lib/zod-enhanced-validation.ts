/**
 * Zod-Enhanced Validation System
 * 
 * Based on Ax LLM PR #394 improvements for better type safety and validation
 * in the PERMUTATION system
 * 
 * @see https://github.com/ax-llm/ax/pull/394 - Deepen Zod integration in Ax (In Progress)
 * Note: Direct Zod schema integration in Ax is not yet available in v14.0.30
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

// Ax LLM Integration with Zod Schemas
// Based on PR #394: https://github.com/ax-llm/ax/pull/394 (In Progress)

/**
 * Ax LLM + Zod Integration Architecture
 * 
 * PR #394 introduces a sophisticated integration where Zod schemas travel with Ax signatures
 * from definition to runtime enforcement through a multi-component pipeline:
 * 
 * 1. Zod Schema Registration → AxZodRegistry (schema cache)
 * 2. AxSignatureFactory builds AxSignature with zodMeta
 * 3. AxAssertion Pipeline auto-generates ZodAssertionAdapter
 * 4. Runtime validation through Streaming Validator
 * 5. ValidationResult with success/errors/telemetry
 * 
 * When PR #394 merges, we'll be able to use:
 * 
 * ```typescript
 * import { ax } from '@ax-llm/ax';
 * 
 * const financeGenerator = ax(DomainSchemas.finance, {
 *   description: 'Expert finance domain analysis',
 *   zod: {
 *     assertionLevel: 'strict',  // strict | lenient | none
 *     mode: 'parse'              // parse | safeParse
 *   }
 * });
 * 
 * // The schema travels through the entire pipeline:
 * // Zod Schema → AxZodRegistry → AxSignature → AxAssertion → Runtime Validation
 * ```
 * 
 * For now, we use our ZodEnhancedValidator for validation
 * and standard Ax signatures for generation.
 */

/**
 * Future Ax + Zod Integration Implementation
 * 
 * This shows how our existing Zod schemas will integrate with the new architecture
 */
export class FutureAxZodIntegration {
  
  /**
   * Convert our Zod schemas to Ax signatures (current approach)
   * This bridges our existing schemas with current Ax capabilities
   */
  static createAxSignatureFromZod(domain: keyof typeof DomainSchemas): string {
    const schema = DomainSchemas[domain];
    
    // Extract field information from Zod schema
    const fields = this.extractFieldsFromZodSchema(schema, domain);
    
    // Convert to Ax signature format
    const inputFields = fields.inputs.map(f => `${f.name}:${f.type}`).join(', ');
    const outputFields = fields.outputs.map(f => `${f.name}:${f.type}`).join(', ');
    
    return `${inputFields} -> ${outputFields}`;
  }
  
  /**
   * Extract field information from Zod schema
   * This prepares our schemas for the future Ax integration
   */
  private static extractFieldsFromZodSchema(schema: any, domain: string = 'general'): {
    inputs: Array<{ name: string; type: string }>;
    outputs: Array<{ name: string; type: string }>;
  } {
    // This is a simplified extraction - in reality, we'd need to traverse the Zod schema
    // For now, we'll return the expected structure for our domain schemas
    
    const domainInputs = {
      finance: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' },
        { name: 'riskTolerance', type: 'string' },
        { name: 'timeHorizon', type: 'string' }
      ],
      legal: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' },
        { name: 'jurisdiction', type: 'string' },
        { name: 'practiceArea', type: 'string' }
      ],
      healthcare: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' },
        { name: 'clinicalContext', type: 'string' },
        { name: 'urgency', type: 'string' }
      ],
      technology: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' },
        { name: 'architecture', type: 'string' },
        { name: 'scale', type: 'string' }
      ],
      education: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' },
        { name: 'gradeLevel', type: 'string' },
        { name: 'subject', type: 'string' }
      ],
      general: [
        { name: 'query', type: 'string' },
        { name: 'complexity', type: 'string' },
        { name: 'requiresRealTimeData', type: 'boolean' }
      ]
    };
    
    return {
      inputs: domainInputs[domain as keyof typeof domainInputs] || domainInputs.general,
      outputs: [
        { name: 'analysis', type: 'string' },
        { name: 'recommendations', type: 'string[]' },
        { name: 'confidence', type: 'number' },
        { name: 'sources', type: 'string[]' }
      ]
    };
  }
  
  /**
   * Create Ax signature strings for all our domain schemas
   * This shows how our Zod schemas map to Ax signatures
   */
  static generateAllAxSignatures(): Record<string, string> {
    const signatures: Record<string, string> = {};
    
    Object.keys(DomainSchemas).forEach(domain => {
      signatures[domain] = this.createAxSignatureFromZod(domain as keyof typeof DomainSchemas);
    });
    
    return signatures;
  }
}

/**
 * Current Ax Signatures (working now)
 * These are the signatures we use with our current Ax implementation
 */
export const currentAxSignatures = {
  finance: 'query:string, complexity:string, requiresRealTimeData:boolean, riskTolerance:string, timeHorizon:string -> analysis:string, recommendations:string[], confidence:number, sources:string[]',
  legal: 'query:string, complexity:string, requiresRealTimeData:boolean, jurisdiction:string, practiceArea:string -> analysis:string, recommendations:string[], confidence:number, sources:string[]',
  healthcare: 'query:string, complexity:string, requiresRealTimeData:boolean, clinicalContext:string, urgency:string -> analysis:string, recommendations:string[], confidence:number, sources:string[]',
  technology: 'query:string, complexity:string, requiresRealTimeData:boolean, architecture:string, scale:string -> analysis:string, recommendations:string[], confidence:number, sources:string[]',
  education: 'query:string, complexity:string, requiresRealTimeData:boolean, gradeLevel:string, subject:string -> analysis:string, recommendations:string[], confidence:number, sources:string[]',
  general: 'query:string, complexity:string, requiresRealTimeData:boolean -> analysis:string, recommendations:string[], confidence:number, sources:string[]'
};

/**
 * Future Ax + Zod Integration (when PR #394 merges)
 * This shows how our Zod schemas will integrate with the new architecture
 */
export const futureAxZodIntegration = {
  // Our Zod schemas will be used directly:
  schemas: DomainSchemas,
  
  // With the new Ax integration:
  // ax(DomainSchemas.finance, { zod: { assertionLevel: 'strict', mode: 'parse' } })
  
  // The pipeline will be:
  // 1. Zod Schema → AxZodRegistry (schema cache)
  // 2. AxSignatureFactory builds AxSignature with zodMeta
  // 3. AxAssertion Pipeline auto-generates ZodAssertionAdapter
  // 4. Runtime validation through Streaming Validator
  // 5. ValidationResult with success/errors/telemetry
};
