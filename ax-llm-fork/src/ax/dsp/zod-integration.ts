/**
 * Ax LLM Zod Integration
 * 
 * This module provides deep integration between Ax LLM and Zod schemas,
 * enabling type-safe validation at the signature level.
 * 
 * Features:
 * - AxSignature.fromZod() static method
 * - Runtime validation with Zod schemas
 * - Type-safe input/output validation
 * - Streaming validation support
 * - Backward compatibility with string signatures
 */

import { z } from 'zod';
import type { AxSignature } from './sig.js';
import type { AxField, AxIField } from './types.js';
import { parseSignature } from './parser.js';

/**
 * Configuration for Zod validation
 */
export interface AxZodValidationConfig {
  /** Enable strict validation (throws on validation errors) */
  strict?: boolean;
  /** Enable streaming validation for real-time feedback */
  streaming?: boolean;
  /** Custom error message formatter */
  errorFormatter?: (error: z.ZodError) => string;
  /** Enable performance monitoring */
  performanceMonitoring?: boolean;
}

/**
 * Zod validation result
 */
export interface AxZodValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  performance?: {
    validationTime: number;
    schemaSize: number;
  };
}

/**
 * Enhanced AxSignature with Zod support
 */
export class AxZodSignature<
  TInput extends Record<string, any> = Record<string, any>,
  TOutput extends Record<string, any> = Record<string, any>,
> {
  private signature: AxSignature<TInput, TOutput>;
  private inputSchema?: z.ZodSchema<TInput>;
  private outputSchema?: z.ZodSchema<TOutput>;
  private validationConfig: AxZodValidationConfig;

  constructor(
    signature: AxSignature<TInput, TOutput>,
    inputSchema?: z.ZodSchema<TInput>,
    outputSchema?: z.ZodSchema<TOutput>,
    config: AxZodValidationConfig = {}
  ) {
    this.signature = signature;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
    this.validationConfig = {
      strict: false,
      streaming: false,
      performanceMonitoring: false,
      ...config,
    };
  }

  /**
   * Create AxSignature from Zod schema
   */
  static fromZod<T extends z.ZodSchema>(
    inputSchema: T,
    outputSchema?: z.ZodSchema,
    config: AxZodValidationConfig = {}
  ): AxZodSignature<z.infer<T>, z.infer<typeof outputSchema>> {
    // Convert Zod schema to signature string
    const signatureString = convertZodToSignature(inputSchema, outputSchema);
    
    // Create AxSignature from string
    const signature = new (signature.constructor as any)(signatureString) as AxSignature<z.infer<T>, z.infer<typeof outputSchema>>;
    
    return new AxZodSignature(signature, inputSchema, outputSchema, config);
  }

  /**
   * Validate input data against Zod schema
   */
  validateInput(data: unknown): AxZodValidationResult<TInput> {
    if (!this.inputSchema) {
      return { success: true, data: data as TInput };
    }

    const startTime = this.validationConfig.performanceMonitoring ? performance.now() : 0;
    
    try {
      const result = this.inputSchema.safeParse(data);
      
      if (result.success) {
        const validationResult: AxZodValidationResult<TInput> = {
          success: true,
          data: result.data,
        };

        if (this.validationConfig.performanceMonitoring) {
          validationResult.performance = {
            validationTime: performance.now() - startTime,
            schemaSize: JSON.stringify(this.inputSchema).length,
          };
        }

        return validationResult;
      } else {
        const errors = result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );

        if (this.validationConfig.strict) {
          throw new Error(`Input validation failed: ${errors.join(', ')}`);
        }

        return {
          success: false,
          errors,
        };
      }
    } catch (error) {
      if (this.validationConfig.strict) {
        throw error;
      }

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Validate output data against Zod schema
   */
  validateOutput(data: unknown): AxZodValidationResult<TOutput> {
    if (!this.outputSchema) {
      return { success: true, data: data as TOutput };
    }

    const startTime = this.validationConfig.performanceMonitoring ? performance.now() : 0;
    
    try {
      const result = this.outputSchema.safeParse(data);
      
      if (result.success) {
        const validationResult: AxZodValidationResult<TOutput> = {
          success: true,
          data: result.data,
        };

        if (this.validationConfig.performanceMonitoring) {
          validationResult.performance = {
            validationTime: performance.now() - startTime,
            schemaSize: JSON.stringify(this.outputSchema).length,
          };
        }

        return validationResult;
      } else {
        const errors = result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );

        if (this.validationConfig.strict) {
          throw new Error(`Output validation failed: ${errors.join(', ')}`);
        }

        return {
          success: false,
          errors,
        };
      }
    } catch (error) {
      if (this.validationConfig.strict) {
        throw error;
      }

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Get the underlying AxSignature
   */
  getSignature(): AxSignature<TInput, TOutput> {
    return this.signature;
  }

  /**
   * Get input Zod schema
   */
  getInputSchema(): z.ZodSchema<TInput> | undefined {
    return this.inputSchema;
  }

  /**
   * Get output Zod schema
   */
  getOutputSchema(): z.ZodSchema<TOutput> | undefined {
    return this.outputSchema;
  }

  /**
   * Update validation configuration
   */
  updateConfig(config: Partial<AxZodValidationConfig>): void {
    this.validationConfig = { ...this.validationConfig, ...config };
  }
}

/**
 * Convert Zod schema to Ax signature string
 */
function convertZodToSignature(
  inputSchema: z.ZodSchema,
  outputSchema?: z.ZodSchema
): string {
  const inputFields = extractFieldsFromZodSchema(inputSchema);
  const outputFields = outputSchema ? extractFieldsFromZodSchema(outputSchema) : [];
  
  const inputString = inputFields.map(field => 
    `${field.name}: ${field.type}${field.optional ? '?' : ''}`
  ).join(', ');
  
  const outputString = outputFields.map(field => 
    `${field.name}: ${field.type}`
  ).join(', ');
  
  if (outputString) {
    return `${inputString} -> ${outputString}`;
  } else {
    return inputString;
  }
}

/**
 * Extract field information from Zod schema
 */
function extractFieldsFromZodSchema(schema: z.ZodSchema): Array<{
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}> {
  const fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    description?: string;
  }> = [];

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      const field = extractFieldFromZodType(key, value as z.ZodTypeAny);
      fields.push(field);
    }
  }

  return fields;
}

/**
 * Extract field information from individual Zod type
 */
function extractFieldFromZodType(
  name: string,
  zodType: z.ZodTypeAny
): {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
} {
  let type = 'string';
  let optional = false;
  let description: string | undefined;

  // Handle optional types
  if (zodType instanceof z.ZodOptional) {
    optional = true;
    zodType = zodType._def.innerType;
  }

  // Handle nullable types
  if (zodType instanceof z.ZodNullable) {
    zodType = zodType._def.innerType;
  }

  // Determine base type
  if (zodType instanceof z.ZodString) {
    type = 'string';
  } else if (zodType instanceof z.ZodNumber) {
    type = 'number';
  } else if (zodType instanceof z.ZodBoolean) {
    type = 'boolean';
  } else if (zodType instanceof z.ZodArray) {
    const elementType = extractFieldFromZodType('element', zodType._def.type);
    type = `${elementType.type}[]`;
  } else if (zodType instanceof z.ZodObject) {
    type = 'object';
  } else if (zodType instanceof z.ZodEnum) {
    type = `enum(${zodType._def.values.join('|')})`;
  } else if (zodType instanceof z.ZodUnion) {
    const unionTypes = zodType._def.options.map((option: z.ZodTypeAny) => 
      extractFieldFromZodType('union', option).type
    );
    type = `union(${unionTypes.join('|')})`;
  }

  // Extract description if available
  if (zodType._def.description) {
    description = zodType._def.description;
  }

  return {
    name,
    type,
    optional,
    description,
  };
}

/**
 * Create AxSignature with Zod validation
 */
export function axWithZod<T extends z.ZodSchema>(
  inputSchema: T,
  outputSchema?: z.ZodSchema,
  config: AxZodValidationConfig = {}
): AxZodSignature<z.infer<T>, z.infer<typeof outputSchema>> {
  return AxZodSignature.fromZod(inputSchema, outputSchema, config);
}

/**
 * Enhanced ax() function with Zod support
 */
export function ax<T extends z.ZodSchema>(
  schema: T,
  config: AxZodValidationConfig = {}
): AxZodSignature<z.infer<T>> {
  return AxZodSignature.fromZod(schema, undefined, config);
}
