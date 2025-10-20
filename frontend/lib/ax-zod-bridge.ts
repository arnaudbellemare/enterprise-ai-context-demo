/**
 * Ax + Zod Bridge Implementation
 * 
 * This implements the Ax + Zod integration architecture from PR #394
 * while working with the current Ax LLM version (14.0.30)
 * 
 * Architecture:
 * Zod Schema → AxZodRegistry → AxSignatureFactory → AxAssertion Pipeline → Runtime Validation
 */

import { z } from 'zod';
import { ax, ai } from '@ax-llm/ax';
import { DomainSchemas, RoutingDecisionSchema, TRMEngineSchema, GEPAOptimizationSchema, PerformanceMetricsSchema } from './zod-enhanced-validation';

// ============================================================================
// AxZodRegistry - Schema Cache and Management
// ============================================================================

class AxZodRegistry {
  private static instance: AxZodRegistry;
  private schemaCache: Map<string, z.ZodSchema> = new Map();
  private signatureCache: Map<string, string> = new Map();
  
  static getInstance(): AxZodRegistry {
    if (!AxZodRegistry.instance) {
      AxZodRegistry.instance = new AxZodRegistry();
    }
    return AxZodRegistry.instance;
  }
  
  /**
   * Register a Zod schema with the registry
   */
  registerSchema(name: string, schema: z.ZodSchema): void {
    this.schemaCache.set(name, schema);
    console.log(`📝 Registered Zod schema: ${name}`);
  }
  
  /**
   * Get a registered schema
   */
  getSchema(name: string): z.ZodSchema | undefined {
    return this.schemaCache.get(name);
  }
  
  /**
   * Cache an Ax signature for a schema
   */
  cacheSignature(schemaName: string, signature: string): void {
    this.signatureCache.set(schemaName, signature);
    console.log(`🔗 Cached Ax signature for ${schemaName}: ${signature}`);
  }
  
  /**
   * Get cached signature
   */
  getSignature(schemaName: string): string | undefined {
    return this.signatureCache.get(schemaName);
  }
  
  /**
   * List all registered schemas
   */
  listSchemas(): string[] {
    return Array.from(this.schemaCache.keys());
  }
}

// ============================================================================
// AxSignatureFactory - Build Ax Signatures from Zod Schemas
// ============================================================================

class AxSignatureFactory {
  private registry: AxZodRegistry;
  
  constructor() {
    this.registry = AxZodRegistry.getInstance();
  }
  
  /**
   * Build Ax signature from Zod schema
   */
  buildSignature(schemaName: string, schema: z.ZodSchema): string {
    // Check cache first
    const cached = this.registry.getSignature(schemaName);
    if (cached) {
      return cached;
    }
    
    // Extract fields from Zod schema
    const fields = this.extractFieldsFromZodSchema(schema);
    
    // Convert to Ax signature format
    const inputFields = fields.inputs.map(f => `${f.name}:${f.type}`).join(', ');
    const outputFields = fields.outputs.map(f => `${f.name}:${f.type}`).join(', ');
    
    const signature = `${inputFields} -> ${outputFields}`;
    
    // Cache the signature
    this.registry.cacheSignature(schemaName, signature);
    
    return signature;
  }
  
  /**
   * Extract field information from Zod schema
   */
  private extractFieldsFromZodSchema(schema: z.ZodSchema): {
    inputs: Array<{ name: string; type: string; required: boolean }>;
    outputs: Array<{ name: string; type: string }>;
  } {
    // For now, we'll use predefined mappings for our domain schemas
    // In the future, this would traverse the Zod schema automatically
    
    const domainMappings: Record<string, any> = {
      finance: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false },
          { name: 'riskTolerance', type: 'string', required: false },
          { name: 'timeHorizon', type: 'string', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      },
      legal: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false },
          { name: 'jurisdiction', type: 'string', required: false },
          { name: 'practiceArea', type: 'string', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      },
      healthcare: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false },
          { name: 'clinicalContext', type: 'string', required: false },
          { name: 'urgency', type: 'string', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      },
      technology: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false },
          { name: 'architecture', type: 'string', required: false },
          { name: 'scale', type: 'string', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      },
      education: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false },
          { name: 'gradeLevel', type: 'string', required: false },
          { name: 'subject', type: 'string', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      },
      general: {
        inputs: [
          { name: 'query', type: 'string', required: true },
          { name: 'complexity', type: 'string', required: true },
          { name: 'requiresRealTimeData', type: 'boolean', required: false }
        ],
        outputs: [
          { name: 'analysis', type: 'string' },
          { name: 'recommendations', type: 'string[]' },
          { name: 'confidence', type: 'number' },
          { name: 'sources', type: 'string[]' }
        ]
      }
    };
    
    // Try to match schema name to domain
    const domain = Object.keys(domainMappings).find(d => 
      schema.toString().toLowerCase().includes(d)
    ) || 'general';
    
    return domainMappings[domain];
  }
}

// ============================================================================
// ZodAssertionAdapter - Runtime Validation
// ============================================================================

class ZodAssertionAdapter {
  private registry: AxZodRegistry;
  
  constructor() {
    this.registry = AxZodRegistry.getInstance();
  }
  
  /**
   * Validate input against Zod schema
   */
  validateInput(schemaName: string, input: any): {
    success: boolean;
    data?: any;
    errors?: string[];
  } {
    const schema = this.registry.getSchema(schemaName);
    if (!schema) {
      return {
        success: false,
        errors: [`Schema ${schemaName} not found in registry`]
      };
    }
    
    try {
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
   * Safe parse input against Zod schema
   */
  safeParseInput(schemaName: string, input: any): {
    success: boolean;
    data?: any;
    error?: z.ZodError;
  } {
    const schema = this.registry.getSchema(schemaName);
    if (!schema) {
      return {
        success: false,
        error: new z.ZodError([{
          code: 'custom',
          message: `Schema ${schemaName} not found in registry`,
          path: []
        }])
      };
    }
    
    const result = schema.safeParse(input);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error
    };
  }
}

// ============================================================================
// StreamingValidator - Real-time Validation
// ============================================================================

class StreamingValidator {
  private adapter: ZodAssertionAdapter;
  
  constructor() {
    this.adapter = new ZodAssertionAdapter();
  }
  
  /**
   * Validate streaming response against expected output schema
   */
  validateStreamingOutput(
    schemaName: string, 
    output: any, 
    options: {
      assertionLevel: 'strict' | 'lenient' | 'none';
      mode: 'parse' | 'safeParse';
    } = { assertionLevel: 'strict', mode: 'parse' }
  ): {
    success: boolean;
    data?: any;
    errors?: string[];
    telemetry?: {
      validationTime: number;
      fieldCount: number;
      errorCount: number;
    };
  } {
    const startTime = Date.now();
    
    if (options.assertionLevel === 'none') {
      return {
        success: true,
        data: output,
        telemetry: {
          validationTime: Date.now() - startTime,
          fieldCount: 0,
          errorCount: 0
        }
      };
    }
    
    const result = options.mode === 'parse' 
      ? this.adapter.validateInput(schemaName, output)
      : this.adapter.safeParseInput(schemaName, output);
    
    const validationTime = Date.now() - startTime;
    const fieldCount = result.success ? Object.keys(result.data || {}).length : 0;
    
    // Handle both error types (errors array or error object)
    const errorCount = result.success ? 0 : 
      ('errors' in result && result.errors ? result.errors.length : 
       'error' in result && result.error ? result.error.issues.length : 0);
    
    return {
      success: result.success,
      data: result.data,
      errors: 'errors' in result ? result.errors : undefined,
      telemetry: {
        validationTime,
        fieldCount,
        errorCount
      }
    };
  }
}

// ============================================================================
// AxZodIntegration - Main Integration Class
// ============================================================================

export class AxZodIntegration {
  private registry: AxZodRegistry;
  private signatureFactory: AxSignatureFactory;
  public validator: StreamingValidator;
  
  constructor() {
    this.registry = AxZodRegistry.getInstance();
    this.signatureFactory = new AxSignatureFactory();
    this.validator = new StreamingValidator();
    
    // Register all our domain schemas
    this.registerDomainSchemas();
  }
  
  /**
   * Register all domain schemas with the registry
   */
  private registerDomainSchemas(): void {
    Object.entries(DomainSchemas).forEach(([domain, schema]) => {
      this.registry.registerSchema(domain, schema);
    });
    
    // Register other schemas
    this.registry.registerSchema('routing', RoutingDecisionSchema);
    this.registry.registerSchema('trm', TRMEngineSchema);
    this.registry.registerSchema('gepa', GEPAOptimizationSchema);
    this.registry.registerSchema('performance', PerformanceMetricsSchema);
  }
  
  /**
   * Create Ax generator from Zod schema
   */
  createGenerator(
    schemaName: string, 
    options: {
      description?: string;
      assertionLevel?: 'strict' | 'lenient' | 'none';
      mode?: 'parse' | 'safeParse';
    } = {}
  ) {
    const schema = this.registry.getSchema(schemaName);
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found in registry`);
    }
    
    // Build Ax signature from Zod schema
    const signature = this.signatureFactory.buildSignature(schemaName, schema);
    
    // Create Ax generator
    const generator = ax(signature, {
      description: options.description || `Expert ${schemaName} domain analysis`
    });
    
    // Store Zod metadata on the generator for future use (when PR #394 merges)
    (generator as any)._zodMetadata = {
      schemaName,
      assertionLevel: options.assertionLevel || 'strict',
      mode: options.mode || 'parse'
    };
    
    // Add validation wrapper
    return this.wrapGeneratorWithValidation(generator, schemaName, options);
  }
  
  /**
   * Wrap Ax generator with Zod validation
   */
  private wrapGeneratorWithValidation(
    generator: any, 
    schemaName: string, 
    options: any
  ) {
    const originalForward = generator.forward.bind(generator);
    
    generator.forward = async (llm: any, input: any) => {
      // Validate input
      const inputValidation = this.validator.validateStreamingOutput(
        schemaName, 
        input, 
        { assertionLevel: options.assertionLevel || 'strict', mode: 'parse' }
      );
      
      if (!inputValidation.success) {
        throw new Error(`Input validation failed: ${inputValidation.errors?.join(', ')}`);
      }
      
      // Execute original forward
      const result = await originalForward(llm, inputValidation.data);
      
      // Validate output (if we have an output schema)
      // For now, we'll just return the result
      // In the future, we'd validate against an output schema
      
      return result;
    };
    
    return generator;
  }
  
  /**
   * Get all available generators
   */
  getAvailableGenerators(): string[] {
    return this.registry.listSchemas();
  }
  
  /**
   * Create domain-specific generator
   */
  createDomainGenerator(domain: keyof typeof DomainSchemas, options?: any) {
    return this.createGenerator(domain, {
      description: `Expert ${domain} domain analysis and response generation`,
      ...options
    });
  }
}

// ============================================================================
// Export singleton instance and utilities
// ============================================================================

export const axZodIntegration = new AxZodIntegration();

// Export individual components for advanced usage
export {
  AxZodRegistry,
  AxSignatureFactory,
  ZodAssertionAdapter,
  StreamingValidator
};

// Export convenience functions
export const createAxGenerator = (schemaName: string, options?: any) => 
  axZodIntegration.createGenerator(schemaName, options);

export const createDomainGenerator = (domain: keyof typeof DomainSchemas, options?: any) => 
  axZodIntegration.createDomainGenerator(domain, options);

export const validateInput = (schemaName: string, input: any) => 
  axZodIntegration.validator.validateStreamingOutput(schemaName, input);
