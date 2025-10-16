/**
 * Tool Calling System
 * 
 * Dynamic function calling capabilities for PERMUTATION:
 * - Tool discovery and registration
 * - Dynamic tool execution
 * - Tool result caching
 * - Tool chaining and composition
 * - Domain-specific tool routing
 */

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
      enum?: string[];
    }>;
    required: string[];
  };
  execute: (params: any) => Promise<any>;
  domain?: string[];
  cost?: number;
  latency_ms?: number;
  cacheable?: boolean;
}

export interface ToolCall {
  tool_name: string;
  parameters: any;
  call_id: string;
  timestamp: number;
  domain?: string;
}

export interface ToolResult {
  call_id: string;
  tool_name: string;
  result: any;
  success: boolean;
  error?: string;
  execution_time_ms: number;
  cost: number;
  cached: boolean;
}

export interface ToolChain {
  id: string;
  tools: ToolCall[];
  dependencies: Record<string, string[]>; // tool_id -> depends_on[]
  parallel_execution: boolean;
}

export class ToolCallingSystem {
  private tools: Map<string, Tool> = new Map();
  private toolCache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private executionHistory: ToolResult[] = [];
  private domainTools: Map<string, string[]> = new Map(); // domain -> tool_names[]

  constructor() {
    this.registerBuiltinTools();
    console.log('🔧 Tool Calling System initialized');
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    
    // Update domain mapping
    if (tool.domain) {
      for (const domain of tool.domain) {
        if (!this.domainTools.has(domain)) {
          this.domainTools.set(domain, []);
        }
        this.domainTools.get(domain)!.push(tool.name);
      }
    }
    
    console.log(`✅ Registered tool: ${tool.name} (${tool.domain?.join(', ') || 'general'})`);
  }

  /**
   * Execute a tool call
   */
  async executeTool(call: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(call.tool_name);
    
    if (!tool) {
      return {
        call_id: call.call_id,
        tool_name: call.tool_name,
        result: null,
        success: false,
        error: `Tool '${call.tool_name}' not found`,
        execution_time_ms: Date.now() - startTime,
        cost: 0,
        cached: false
      };
    }

    // Check cache if tool is cacheable
    if (tool.cacheable) {
      const cacheKey = this.getCacheKey(call);
      const cached = this.toolCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          call_id: call.call_id,
          tool_name: call.tool_name,
          result: cached.result,
          success: true,
          execution_time_ms: 1, // Cached result
          cost: 0.0001, // Minimal cost for cache hit
          cached: true
        };
      }
    }

    try {
      // Execute tool
      const result = await tool.execute(call.parameters);
      const executionTime = Date.now() - startTime;
      
      // Cache result if cacheable
      if (tool.cacheable) {
        const cacheKey = this.getCacheKey(call);
        this.toolCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          ttl: this.getCacheTTL(call.tool_name)
        });
      }

      const toolResult: ToolResult = {
        call_id: call.call_id,
        tool_name: call.tool_name,
        result,
        success: true,
        execution_time_ms: executionTime,
        cost: tool.cost || 0.001,
        cached: false
      };

      this.executionHistory.push(toolResult);
      return toolResult;

    } catch (error: any) {
      const toolResult: ToolResult = {
        call_id: call.call_id,
        tool_name: call.tool_name,
        result: null,
        success: false,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
        cost: 0,
        cached: false
      };

      this.executionHistory.push(toolResult);
      return toolResult;
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeParallel(calls: ToolCall[]): Promise<ToolResult[]> {
    console.log(`🔧 Executing ${calls.length} tools in parallel`);
    
    const promises = calls.map(call => this.executeTool(call));
    const results = await Promise.all(promises);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Parallel execution complete: ${successCount}/${calls.length} successful`);
    
    return results;
  }

  /**
   * Execute tool chain with dependencies
   */
  async executeToolChain(chain: ToolChain): Promise<ToolResult[]> {
    console.log(`🔗 Executing tool chain: ${chain.id} (${chain.tools.length} tools)`);
    
    const results: ToolResult[] = [];
    const completed = new Set<string>();
    
    // Execute tools respecting dependencies
    while (completed.size < chain.tools.length) {
      const readyTools = chain.tools.filter(tool => {
        const dependencies = chain.dependencies[tool.call_id] || [];
        return dependencies.every(dep => completed.has(dep));
      });
      
      if (readyTools.length === 0) {
        throw new Error('Circular dependency detected in tool chain');
      }
      
      // Execute ready tools
      if (chain.parallel_execution) {
        const parallelResults = await this.executeParallel(readyTools);
        results.push(...parallelResults);
        readyTools.forEach(tool => completed.add(tool.call_id));
      } else {
        for (const tool of readyTools) {
          const result = await this.executeTool(tool);
          results.push(result);
          completed.add(tool.call_id);
        }
      }
    }
    
    return results;
  }

  /**
   * Get tools for specific domain
   */
  getToolsForDomain(domain: string): Tool[] {
    const toolNames = this.domainTools.get(domain) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  /**
   * Get all available tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    total_tools: number;
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
    total_cost: number;
    cache_hit_rate: number;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(r => r.success).length;
    const cachedExecutions = this.executionHistory.filter(r => r.cached).length;
    
    return {
      total_tools: this.tools.size,
      total_executions: totalExecutions,
      success_rate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      avg_execution_time: totalExecutions > 0 ? 
        this.executionHistory.reduce((sum, r) => sum + r.execution_time_ms, 0) / totalExecutions : 0,
      total_cost: this.executionHistory.reduce((sum, r) => sum + r.cost, 0),
      cache_hit_rate: totalExecutions > 0 ? (cachedExecutions / totalExecutions) * 100 : 0
    };
  }

  /**
   * Register built-in tools
   */
  private registerBuiltinTools(): void {
    // Calculator tool
    this.registerTool({
      name: 'calculator',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate'
          }
        },
        required: ['expression']
      },
      execute: async (params: { expression: string }) => {
        try {
          // Safe evaluation of mathematical expressions
          const result = eval(params.expression.replace(/[^0-9+\-*/().\s]/g, ''));
          return { result, expression: params.expression };
        } catch (error) {
          throw new Error(`Invalid expression: ${params.expression}`);
        }
      },
      domain: ['financial', 'general'],
      cost: 0.0001,
      latency_ms: 10,
      cacheable: true
    });

    // Web search tool
    this.registerTool({
      name: 'web_search',
      description: 'Search the web for real-time information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results',
            required: false
          }
        },
        required: ['query']
      },
      execute: async (params: { query: string; max_results?: number }) => {
        // Simulate web search (replace with actual implementation)
        return {
          query: params.query,
          results: [
            {
              title: `Search result for: ${params.query}`,
              url: 'https://example.com',
              snippet: `This is a simulated search result for "${params.query}"`
            }
          ],
          total_results: 1
        };
      },
      domain: ['general', 'research'],
      cost: 0.002,
      latency_ms: 2000,
      cacheable: true
    });

    // SQL query tool
    this.registerTool({
      name: 'sql_query',
      description: 'Execute SQL queries on structured data',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL query to execute'
          },
          database: {
            type: 'string',
            description: 'Database name',
            required: false
          }
        },
        required: ['query']
      },
      execute: async (params: { query: string; database?: string }) => {
        // Simulate SQL execution (replace with actual implementation)
        return {
          query: params.query,
          database: params.database || 'default',
          results: [
            { id: 1, name: 'Sample Result', value: 100 }
          ],
          row_count: 1
        };
      },
      domain: ['financial', 'analytics', 'data'],
      cost: 0.001,
      latency_ms: 500,
      cacheable: true
    });

    // Text analysis tool
    this.registerTool({
      name: 'text_analysis',
      description: 'Analyze text for sentiment, entities, and key phrases',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to analyze'
          },
          analysis_type: {
            type: 'string',
            description: 'Type of analysis to perform',
            enum: ['sentiment', 'entities', 'key_phrases', 'all']
          }
        },
        required: ['text']
      },
      execute: async (params: { text: string; analysis_type?: string }) => {
        const analysisType = params.analysis_type || 'all';
        
        // Simulate text analysis (replace with actual implementation)
        return {
          text: params.text,
          analysis_type: analysisType,
          sentiment: { score: 0.5, label: 'neutral' },
          entities: ['PERMUTATION', 'AI', 'system'],
          key_phrases: ['artificial intelligence', 'machine learning'],
          word_count: params.text.split(' ').length
        };
      },
      domain: ['general', 'marketing', 'research'],
      cost: 0.0015,
      latency_ms: 300,
      cacheable: true
    });

    // Domain-specific tools
    this.registerTool({
      name: 'financial_calculator',
      description: 'Perform financial calculations (ROI, NPV, etc.)',
      parameters: {
        type: 'object',
        properties: {
          calculation_type: {
            type: 'string',
            description: 'Type of financial calculation',
            enum: ['roi', 'npv', 'irr', 'payback_period']
          },
          parameters: {
            type: 'object',
            description: 'Calculation parameters'
          }
        },
        required: ['calculation_type', 'parameters']
      },
      execute: async (params: { calculation_type: string; parameters: any }) => {
        // Simulate financial calculations
        const { calculation_type, parameters } = params;
        
        switch (calculation_type) {
          case 'roi':
            const roi = ((parameters.gain - parameters.cost) / parameters.cost) * 100;
            return { calculation_type, result: roi, unit: 'percentage' };
          
          case 'npv':
            const npv = parameters.cash_flows.reduce((sum: number, cf: number, i: number) => 
              sum + cf / Math.pow(1 + parameters.discount_rate, i), 0);
            return { calculation_type, result: npv, unit: 'currency' };
          
          default:
            return { calculation_type, result: 0, unit: 'unknown' };
        }
      },
      domain: ['financial', 'investment'],
      cost: 0.0005,
      latency_ms: 50,
      cacheable: true
    });
  }

  /**
   * Get cache key for tool call
   */
  private getCacheKey(call: ToolCall): string {
    return `${call.tool_name}:${JSON.stringify(call.parameters)}`;
  }

  /**
   * Get cache TTL for tool
   */
  private getCacheTTL(toolName: string): number {
    const ttlMap: Record<string, number> = {
      calculator: 3600000, // 1 hour
      web_search: 1800000, // 30 minutes
      sql_query: 1800000, // 30 minutes
      text_analysis: 3600000, // 1 hour
      financial_calculator: 3600000 // 1 hour
    };
    
    return ttlMap[toolName] || 1800000; // Default 30 minutes
  }
}

// Singleton instance
let toolSystemInstance: ToolCallingSystem | undefined;

export function getToolCallingSystem(): ToolCallingSystem {
  if (!toolSystemInstance) {
    toolSystemInstance = new ToolCallingSystem();
  }
  return toolSystemInstance;
}

