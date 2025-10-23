/**
 * WALT Tool Integration with ToolCallingSystem
 *
 * Extends the tool calling system with WALT-discovered tools
 */

import { getToolCallingSystem, Tool, ToolCall, ToolResult } from '../tool-calling-system';
import { getDiscoveryOrchestrator } from './discovery-orchestrator';
import { getWALTStorage } from './storage';
import { convertWALTToolToPERMUTATION } from './adapter';
import { WALTToolWithMetrics } from './types';

/**
 * WALT Tool Integration Manager
 */
export class WALTToolIntegration {
  private toolSystem = getToolCallingSystem();
  private orchestrator = getDiscoveryOrchestrator();
  private storage = getWALTStorage();
  private registeredTools: Set<string> = new Set();

  constructor() {
    console.log('🔗 WALT Tool Integration initialized');
  }

  /**
   * Initialize WALT tools for a specific domain
   */
  async initializeForDomain(domain: string, options?: {
    forceDiscovery?: boolean;
    maxTools?: number;
  }): Promise<number> {
    console.log(`🚀 Initializing WALT tools for domain: ${domain}`);

    let tools: Tool[] = [];

    // Try to load from storage first
    if (!options?.forceDiscovery) {
      const storedTools = await this.storage.getToolsForDomain(domain, options?.maxTools || 10);

      if (storedTools.length > 0) {
        console.log(`📦 Loaded ${storedTools.length} tools from storage`);
        tools = storedTools.map(waltTool =>
          convertWALTToolToPERMUTATION({
            name: waltTool.name,
            domain: waltTool.domain,
            file_path: '',
            definition: waltTool.definition
          }, [domain])
        );
      }
    }

    // Discover if no tools in storage or forced
    if (tools.length === 0 || options?.forceDiscovery) {
      console.log(`🔍 Discovering new tools for ${domain}...`);
      tools = await this.orchestrator.discoverForDomain(domain, {
        maxToolsPerSite: options?.maxTools
      });
    }

    // Register tools with ToolCallingSystem
    let registered = 0;
    for (const tool of tools) {
      if (!this.registeredTools.has(tool.name)) {
        this.toolSystem.registerTool(tool);
        this.registeredTools.add(tool.name);
        registered++;
      }
    }

    console.log(`✅ Registered ${registered} WALT tools for ${domain}`);
    return registered;
  }

  /**
   * Initialize WALT tools for all domains
   */
  async initializeAll(options?: {
    highPriorityOnly?: boolean;
    maxConcurrent?: number;
  }): Promise<Map<string, number>> {
    console.log('🌍 Initializing WALT tools for all domains...');

    const results = options?.highPriorityOnly
      ? await this.orchestrator.discoverHighPriorityDomains({ maxConcurrent: options?.maxConcurrent })
      : await this.orchestrator.discoverAllDomains({ maxConcurrent: options?.maxConcurrent });

    const registrationResults = new Map<string, number>();

    for (const [domain, tools] of results.entries()) {
      let registered = 0;
      for (const tool of tools) {
        if (!this.registeredTools.has(tool.name)) {
          this.toolSystem.registerTool(tool);
          this.registeredTools.add(tool.name);
          registered++;
        }
      }
      registrationResults.set(domain, registered);
    }

    const totalRegistered = Array.from(registrationResults.values()).reduce((sum, count) => sum + count, 0);
    console.log(`✅ Registered ${totalRegistered} WALT tools across ${registrationResults.size} domains`);

    return registrationResults;
  }

  /**
   * Get recommended tools for a query and domain
   */
  async getRecommendedToolsForQuery(
    query: string,
    domain: string,
    limit: number = 3
  ): Promise<Tool[]> {
    // Search by semantic similarity
    const waltTools = await this.storage.searchTools(query, {
      domain: [domain],
      threshold: 0.7,
      limit
    });

    // Fallback to domain recommendations
    if (waltTools.length === 0) {
      const recommended = await this.storage.getRecommendedTools(domain, limit);
      return recommended.map(waltTool =>
        convertWALTToolToPERMUTATION({
          name: waltTool.name,
          domain: waltTool.domain,
          file_path: '',
          definition: waltTool.definition
        }, [domain])
      );
    }

    return waltTools.map(waltTool =>
      convertWALTToolToPERMUTATION({
        name: waltTool.name,
        domain: waltTool.domain,
        file_path: '',
        definition: waltTool.definition
      }, [domain])
    );
  }

  /**
   * Execute a WALT tool and record metrics
   */
  async executeWALTTool(
    toolCall: ToolCall,
    context?: {
      query?: string;
      domain?: string;
      user_id?: string;
      session_id?: string;
    }
  ): Promise<ToolResult> {
    // Execute tool via ToolCallingSystem
    const result = await this.toolSystem.executeTool(toolCall);

    // Record execution in storage
    if (toolCall.tool_name.startsWith('walt_')) {
      const actualToolName = toolCall.tool_name.replace('walt_', '');

      await this.storage.recordExecution(
        actualToolName,
        {
          success: result.success,
          tool_name: actualToolName,
          parameters: toolCall.parameters,
          result: result.result,
          error: result.error,
          execution_time_ms: result.execution_time_ms,
          steps_executed: 0 // TODO: Track actual steps
        },
        context
      );
    }

    return result;
  }

  /**
   * Get WALT tool statistics
   */
  async getStats(): Promise<{
    tool_system: any;
    walt_storage: any;
    registered_tools: number;
  }> {
    return {
      tool_system: this.toolSystem.getStats(),
      walt_storage: await this.storage.getStats(),
      registered_tools: this.registeredTools.size
    };
  }

  /**
   * Refresh tools from discovery
   */
  async refreshTools(domain?: string): Promise<number> {
    console.log(`🔄 Refreshing WALT tools${domain ? ` for ${domain}` : ''}...`);

    if (domain) {
      // Clear registered tools for domain
      const domainTools = await this.storage.getToolsForDomain(domain);
      domainTools.forEach(tool => {
        this.registeredTools.delete(`walt_${tool.name}`);
      });

      // Re-initialize
      return await this.initializeForDomain(domain, { forceDiscovery: true });
    } else {
      // Clear all registered tools
      this.registeredTools.clear();

      // Re-initialize all
      const results = await this.initializeAll();
      return Array.from(results.values()).reduce((sum, count) => sum + count, 0);
    }
  }

  /**
   * Get list of registered WALT tools
   */
  getRegisteredTools(): string[] {
    return Array.from(this.registeredTools);
  }
}

// Singleton instance
let waltIntegrationInstance: WALTToolIntegration | undefined;

/**
 * Get singleton WALT integration instance
 */
export function getWALTToolIntegration(): WALTToolIntegration {
  if (!waltIntegrationInstance) {
    waltIntegrationInstance = new WALTToolIntegration();
  }
  return waltIntegrationInstance;
}

/**
 * Initialize WALT tools globally (convenience function)
 */
export async function initializeWALTTools(options?: {
  domains?: string[];
  highPriorityOnly?: boolean;
  maxConcurrent?: number;
}): Promise<void> {
  const integration = getWALTToolIntegration();

  if (options?.domains) {
    // Initialize specific domains
    for (const domain of options.domains) {
      await integration.initializeForDomain(domain);
    }
  } else {
    // Initialize all domains
    await integration.initializeAll({
      highPriorityOnly: options?.highPriorityOnly,
      maxConcurrent: options?.maxConcurrent
    });
  }
}
