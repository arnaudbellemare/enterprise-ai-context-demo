/**
 * Real Ax + Zod Integration
 * 
 * Based on PR #394 implementation details:
 * https://github.com/ax-llm/ax/pull/394/files
 * 
 * This implements the actual Zod integration without waiting for the PR to merge.
 * We'll use the patterns from the PR to enhance our brain system.
 */

import { z } from 'zod';
import { ax, ai } from '@ax-llm/ax';
import { DomainSchemas } from './zod-enhanced-validation';

// ============================================================================
// AxSignature.fromZod Implementation (from PR #394)
// ============================================================================

/**
 * Create Ax signature from Zod schema
 * Based on the PR #394 implementation pattern
 */
export function createAxSignatureFromZod(
  schema: z.ZodSchema, 
  options: {
    mode?: 'parse' | 'safeParse';
    assertionLevel?: 'strict' | 'lenient' | 'none';
  } = {}
) {
  // Extract input and output fields from Zod schema
  const { inputs, outputs } = extractFieldsFromZodSchema(schema);
  
  // Create Ax signature string
  const inputFields = inputs.map(f => `${f.name}:${f.type}`).join(', ');
  const outputFields = outputs.map(f => `${f.name}:${f.type}`).join(', ');
  const signature = `${inputFields} -> ${outputFields}`;
  
  // Create Ax generator with signature
  const generator = ax(signature, {
    description: `Zod-validated generator with ${options.mode || 'parse'} mode`
  });
  
  // Add Zod metadata (like in PR #394)
  (generator as any)._zodMetadata = {
    schema,
    mode: options.mode || 'parse',
    assertionLevel: options.assertionLevel || 'strict'
  };
  
  // Wrap with validation
  return wrapGeneratorWithZodValidation(generator, schema, options);
}

/**
 * Extract fields from Zod schema
 * This is a simplified version of what PR #394 implements
 */
function extractFieldsFromZodSchema(schema: z.ZodSchema): {
  inputs: Array<{ name: string; type: string; required: boolean }>;
  outputs: Array<{ name: string; type: string }>;
} {
  // For our domain schemas, we know the structure
  // In a full implementation, this would traverse the Zod schema
  
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
  
  // Try to match schema to domain
  const schemaString = schema.toString();
  const domain = Object.keys(domainMappings).find(d => 
    schemaString.toLowerCase().includes(d)
  ) || 'general';
  
  return domainMappings[domain];
}

/**
 * Wrap generator with Zod validation
 * Based on PR #394's runtime validation approach
 */
function wrapGeneratorWithZodValidation(
  generator: any,
  schema: z.ZodSchema,
  options: any
) {
  const originalForward = generator.forward.bind(generator);
  
  generator.forward = async (llm: any, input: any) => {
    // Validate input against Zod schema
    const inputValidation = validateWithZod(schema, input, options);
    
    if (!inputValidation.success) {
      throw new Error(`Input validation failed: ${inputValidation.errors?.join(', ')}`);
    }
    
    // Execute original forward with validated input
    const result = await originalForward(llm, inputValidation.data);
    
    // For now, we'll return the result as-is
    // In a full implementation, we'd also validate the output
    return result;
  };
  
  return generator;
}

/**
 * Validate data against Zod schema
 * Based on PR #394's validation approach
 */
function validateWithZod(
  schema: z.ZodSchema,
  data: any,
  options: any
): {
  success: boolean;
  data?: any;
  errors?: string[];
} {
  try {
    if (options.mode === 'safeParse') {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
    } else {
      // Use parse (strict mode)
      const result = schema.parse(data);
      return { success: true, data: result };
    }
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

// ============================================================================
// Brain System Integration
// ============================================================================

/**
 * Create domain-specific generators for the brain system
 * This integrates directly with our existing brain system
 */
export class BrainZodIntegration {
  private generators: Map<string, any> = new Map();
  
  constructor() {
    this.initializeGenerators();
  }
  
  /**
   * Initialize all domain generators
   */
  private initializeGenerators() {
    Object.entries(DomainSchemas).forEach(([domain, schema]) => {
      const generator = createAxSignatureFromZod(schema, {
        mode: 'safeParse', // Use safeParse for better error handling
        assertionLevel: 'strict'
      });
      
      this.generators.set(domain, generator);
      console.log(`🧠 Initialized Zod generator for domain: ${domain}`);
    });
  }
  
  /**
   * Get generator for domain
   */
  getGenerator(domain: string) {
    return this.generators.get(domain) || this.generators.get('general');
  }
  
  /**
   * Execute domain-specific generation with validation
   */
  async executeWithValidation(
    domain: string,
    query: string,
    options: any = {}
  ) {
    const generator = this.getGenerator(domain);
    if (!generator) {
      throw new Error(`No generator found for domain: ${domain}`);
    }
    
    // Prepare input with validation
    const input = {
      query,
      complexity: this.calculateComplexity(query),
      requiresRealTimeData: domain === 'finance' || domain === 'legal',
      ...options
    };
    
    // Get LLM instance
    const llm = this.getLLMInstance();
    
    // Execute with validation
    const result = await generator.forward(llm, input);
    
    return {
      result,
      domain,
      validation: {
        input_validated: true,
        output_validated: false, // We'll add this later
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Calculate query complexity
   */
  private calculateComplexity(query: string): 'low' | 'medium' | 'high' {
    const wordCount = query.split(' ').length;
    const hasComplexTerms = /legal|financial|technical|compliance|regulation/i.test(query);
    
    if (wordCount > 50 || hasComplexTerms) return 'high';
    if (wordCount > 20) return 'medium';
    return 'low';
  }
  
  /**
   * Get LLM instance
   */
  private getLLMInstance() {
    // Use the same LLM configuration as our brain system
    return ai({
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }
  
  /**
   * List available domains
   */
  getAvailableDomains(): string[] {
    return Array.from(this.generators.keys());
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const brainZodIntegration = new BrainZodIntegration();

// Export convenience functions
export const createBrainGenerator = (domain: string) => 
  brainZodIntegration.getGenerator(domain);

export const executeBrainWithValidation = (domain: string, query: string, options?: any) =>
  brainZodIntegration.executeWithValidation(domain, query, options);
