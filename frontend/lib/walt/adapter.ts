/**
 * WALT Adapter
 *
 * Converts WALT tool definitions to PERMUTATION Tool interface
 */

import { Tool } from '../tool-calling-system';
import {
  WALTToolDefinition,
  DiscoveredWALTTool,
  WALTStep,
  WALTToolExecutionResult,
} from './types';

/**
 * Convert WALT tool definition to PERMUTATION Tool interface
 */
export function convertWALTToolToPERMUTATION(
  waltTool: DiscoveredWALTTool,
  domain?: string[]
): Tool {
  const { name, definition } = waltTool;

  // Convert WALT inputs to PERMUTATION parameters
  const properties: Record<
    string,
    {
      type: string;
      description: string;
      required?: boolean;
      enum?: string[];
    }
  > = {};

  const required: string[] = [];

  for (const [inputName, inputDef] of Object.entries(definition.inputs)) {
    properties[inputName] = {
      type: inputDef.type,
      description: inputDef.description,
      required: inputDef.required,
      enum: inputDef.enum,
    };

    if (inputDef.required) {
      required.push(inputName);
    }
  }

  // Create execution function
  const execute = async (params: Record<string, any>): Promise<any> => {
    // Execute WALT tool steps
    const result = await executeWALTSteps(definition.steps, params, name);
    return result;
  };

  // Extract cost and latency from metadata if available
  const cost = definition.metadata?.avg_execution_time
    ? calculateCost(definition.metadata.avg_execution_time)
    : 0.002;

  const latency_ms = definition.metadata?.avg_execution_time || 2000;

  return {
    name: `walt_${name}`,
    description: definition.description,
    parameters: {
      type: 'object',
      properties,
      required,
    },
    execute,
    domain: domain || inferDomainFromDescription(definition.description),
    cost,
    latency_ms,
    cacheable: true, // WALT tools are cacheable by default
  };
}

/**
 * Execute WALT tool steps
 *
 * NOTE: This is a simplified implementation. In production, you would
 * integrate with Playwright or use the WALT execution engine directly.
 */
async function executeWALTSteps(
  steps: WALTStep[],
  params: Record<string, any>,
  toolName: string
): Promise<WALTToolExecutionResult> {
  const startTime = Date.now();

  try {
    // For now, return a simulated result
    // In production, integrate with Playwright or WALT's execution engine
    console.log(`🔧 Executing WALT tool: ${toolName}`);
    console.log(`📋 Steps: ${steps.length}`);
    console.log(`📥 Parameters:`, params);

    // TODO: Integrate with Playwright MCP or WALT execution engine
    // For now, simulate execution
    const result = {
      success: true,
      tool_name: toolName,
      parameters: params,
      result: {
        status: 'simulated',
        message: `Tool ${toolName} executed successfully (simulated)`,
        steps_completed: steps.length,
        data: params,
      },
      execution_time_ms: Date.now() - startTime,
      steps_executed: steps.length,
    };

    console.log(`✅ Tool execution complete: ${toolName} (${result.execution_time_ms}ms)`);
    return result;
  } catch (error: any) {
    console.error(`❌ Tool execution failed: ${toolName}`, error);
    return {
      success: false,
      tool_name: toolName,
      parameters: params,
      error: error.message,
      execution_time_ms: Date.now() - startTime,
      steps_executed: 0,
    };
  }
}

/**
 * Calculate cost based on execution time
 */
function calculateCost(avgExecutionTimeMs: number): number {
  // Cost model: base cost + time-based cost
  const baseCost = 0.001;
  const timeCostPerSecond = 0.0005;
  const timeInSeconds = avgExecutionTimeMs / 1000;

  return baseCost + timeInSeconds * timeCostPerSecond;
}

/**
 * Infer domain from tool description using keywords
 */
function inferDomainFromDescription(description: string): string[] {
  const domains: string[] = [];
  const lowerDesc = description.toLowerCase();

  // Financial keywords
  if (
    lowerDesc.includes('stock') ||
    lowerDesc.includes('price') ||
    lowerDesc.includes('finance') ||
    lowerDesc.includes('trading') ||
    lowerDesc.includes('crypto') ||
    lowerDesc.includes('investment')
  ) {
    domains.push('financial');
  }

  // E-commerce keywords
  if (
    lowerDesc.includes('shop') ||
    lowerDesc.includes('product') ||
    lowerDesc.includes('buy') ||
    lowerDesc.includes('purchase') ||
    lowerDesc.includes('cart') ||
    lowerDesc.includes('checkout')
  ) {
    domains.push('e-commerce');
  }

  // Research keywords
  if (
    lowerDesc.includes('research') ||
    lowerDesc.includes('paper') ||
    lowerDesc.includes('study') ||
    lowerDesc.includes('academic') ||
    lowerDesc.includes('article') ||
    lowerDesc.includes('journal')
  ) {
    domains.push('research');
  }

  // Travel keywords
  if (
    lowerDesc.includes('travel') ||
    lowerDesc.includes('hotel') ||
    lowerDesc.includes('flight') ||
    lowerDesc.includes('booking') ||
    lowerDesc.includes('accommodation')
  ) {
    domains.push('travel');
  }

  // Social media keywords
  if (
    lowerDesc.includes('social') ||
    lowerDesc.includes('post') ||
    lowerDesc.includes('tweet') ||
    lowerDesc.includes('share') ||
    lowerDesc.includes('follow')
  ) {
    domains.push('social');
  }

  // Default to general if no specific domain found
  if (domains.length === 0) {
    domains.push('general');
  }

  return domains;
}

/**
 * Batch convert multiple WALT tools
 */
export function batchConvertWALTTools(
  waltTools: DiscoveredWALTTool[],
  domainOverride?: string[]
): Tool[] {
  console.log(`🔄 Converting ${waltTools.length} WALT tools to PERMUTATION format...`);

  const converted = waltTools.map((waltTool) =>
    convertWALTToolToPERMUTATION(waltTool, domainOverride)
  );

  console.log(`✅ Converted ${converted.length} tools`);
  return converted;
}

/**
 * Validate WALT tool definition
 */
export function validateWALTTool(waltTool: DiscoveredWALTTool): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!waltTool.name) {
    issues.push('Tool name is required');
  }

  if (!waltTool.definition) {
    issues.push('Tool definition is required');
    return { valid: false, issues, warnings };
  }

  if (!waltTool.definition.description) {
    issues.push('Tool description is required');
  }

  if (!waltTool.definition.inputs) {
    issues.push('Tool inputs are required');
  }

  if (!waltTool.definition.steps || waltTool.definition.steps.length === 0) {
    issues.push('Tool must have at least one step');
  }

  // Check step validity
  for (let i = 0; i < waltTool.definition.steps.length; i++) {
    const step = waltTool.definition.steps[i];

    if (!step.type) {
      issues.push(`Step ${i}: Missing step type`);
    }

    // Validate step-specific requirements
    if (step.type === 'navigate' && !step.url) {
      issues.push(`Step ${i}: Navigate step requires URL`);
    }

    if (step.type === 'input' && !step.selector) {
      issues.push(`Step ${i}: Input step requires selector`);
    }

    if (step.type === 'click' && !step.selector) {
      issues.push(`Step ${i}: Click step requires selector`);
    }
  }

  // Warnings for best practices
  if (waltTool.definition.steps.length > 20) {
    warnings.push('Tool has many steps (>20), consider breaking into smaller tools');
  }

  if (!waltTool.definition.metadata) {
    warnings.push('Tool missing metadata (source URL, discovery date, etc.)');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Get tool quality score based on various factors
 */
export function calculateToolQualityScore(waltTool: DiscoveredWALTTool): number {
  let score = 1.0;

  // Deduct for validation issues
  const validation = validateWALTTool(waltTool);
  score -= validation.issues.length * 0.2;
  score -= validation.warnings.length * 0.05;

  // Bonus for metadata
  if (waltTool.definition.metadata) {
    score += 0.1;

    // Bonus for success rate
    if (waltTool.definition.metadata.success_rate) {
      score += waltTool.definition.metadata.success_rate * 0.2;
    }
  }

  // Deduct for complexity
  const stepCount = waltTool.definition.steps.length;
  if (stepCount > 10) {
    score -= (stepCount - 10) * 0.01;
  }

  // Deduct for missing description
  if (!waltTool.definition.description || waltTool.definition.description.length < 20) {
    score -= 0.15;
  }

  // Clamp score between 0 and 1
  return Math.max(0, Math.min(1, score));
}
