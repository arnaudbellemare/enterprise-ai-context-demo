/**
 * WALT Tool Storage
 *
 * Integrates with Supabase and ReasoningBank for persistent tool storage
 */

import { createClient } from '@supabase/supabase-js';
import { Tool } from '../tool-calling-system';
import {
  WALTToolDefinition,
  DiscoveredWALTTool,
  WALTToolStorageRecord,
  ToolQualityMetrics,
  WALTToolWithMetrics,
  WALTToolExecutionResult
} from './types';
import { calculateToolQualityScore } from './adapter';

/**
 * Initialize Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * WALT Tool Storage Manager
 */
export class WALTToolStorage {
  private supabase = getSupabaseClient();

  constructor() {
    console.log('📦 WALT Tool Storage initialized');
  }

  /**
   * Store a discovered tool
   */
  async storeTool(
    waltTool: DiscoveredWALTTool,
    qualityScore?: number
  ): Promise<string> {
    const quality = qualityScore || calculateToolQualityScore(waltTool);

    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(
      `${waltTool.definition.description} ${waltTool.definition.inputs ? Object.keys(waltTool.definition.inputs).join(' ') : ''}`
    );

    const record: Partial<WALTToolStorageRecord> = {
      tool_name: waltTool.name,
      tool_definition: waltTool.definition as any,
      source_url: waltTool.definition.metadata?.source_url || waltTool.file_path,
      domain: [waltTool.domain],
      quality_score: quality,
      success_rate: 0.0,
      total_executions: 0,
      discovered_at: new Date(),
      embedding: embedding as any,
      metadata: {
        file_path: waltTool.file_path,
        discovered_by: 'walt-orchestrator'
      }
    };

    const { data, error } = await this.supabase
      .from('walt_discovered_tools')
      .upsert(record as any, { onConflict: 'tool_name' })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store tool:', error);
      throw error;
    }

    console.log(`✅ Stored tool: ${waltTool.name} (quality: ${quality.toFixed(2)})`);
    return data.id;
  }

  /**
   * Store multiple tools in batch
   */
  async storeBatch(tools: DiscoveredWALTTool[]): Promise<string[]> {
    console.log(`📦 Storing ${tools.length} tools in batch...`);

    const ids: string[] = [];

    for (const tool of tools) {
      try {
        const id = await this.storeTool(tool);
        ids.push(id);
      } catch (error: any) {
        console.error(`❌ Failed to store ${tool.name}:`, error.message);
      }
    }

    console.log(`✅ Stored ${ids.length}/${tools.length} tools`);
    return ids;
  }

  /**
   * Retrieve a tool by name
   */
  async getTool(toolName: string): Promise<WALTToolWithMetrics | null> {
    const { data, error } = await this.supabase
      .from('walt_discovered_tools')
      .select('*')
      .eq('tool_name', toolName)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToToolWithMetrics(data);
  }

  /**
   * Search tools by semantic similarity
   */
  async searchTools(
    query: string,
    options?: {
      domain?: string[];
      threshold?: number;
      limit?: number;
    }
  ): Promise<WALTToolWithMetrics[]> {
    const embedding = await this.generateEmbedding(query);
    const threshold = options?.threshold || 0.7;
    const limit = options?.limit || 10;

    const { data, error } = await this.supabase.rpc('search_walt_tools_by_embedding', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_domain: options?.domain || null
    });

    if (error) {
      console.error('❌ Search failed:', error);
      return [];
    }

    // Fetch full tool data
    const toolIds = data.map((row: any) => row.id);
    const { data: tools, error: toolsError } = await this.supabase
      .from('walt_discovered_tools')
      .select('*')
      .in('id', toolIds);

    if (toolsError || !tools) {
      return [];
    }

    return tools.map(this.mapToToolWithMetrics);
  }

  /**
   * Get tools for a specific domain
   */
  async getToolsForDomain(domain: string, limit: number = 10): Promise<WALTToolWithMetrics[]> {
    const { data, error } = await this.supabase
      .from('walt_discovered_tools')
      .select('*')
      .contains('domain', [domain])
      .eq('status', 'active')
      .order('quality_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to get domain tools:', error);
      return [];
    }

    return (data || []).map(this.mapToToolWithMetrics);
  }

  /**
   * Get recommended tools for a domain
   */
  async getRecommendedTools(domain: string, limit: number = 5): Promise<WALTToolWithMetrics[]> {
    const { data, error } = await this.supabase.rpc('get_walt_tool_recommendations', {
      p_domain: domain,
      p_limit: limit
    });

    if (error) {
      console.error('❌ Failed to get recommendations:', error);
      return [];
    }

    // Fetch full tool data
    const toolIds = data.map((row: any) => row.id);
    const { data: tools, error: toolsError } = await this.supabase
      .from('walt_discovered_tools')
      .select('*')
      .in('id', toolIds);

    if (toolsError || !tools) {
      return [];
    }

    return tools.map(this.mapToToolWithMetrics);
  }

  /**
   * Record tool execution
   */
  async recordExecution(
    toolName: string,
    execution: WALTToolExecutionResult,
    context?: {
      query?: string;
      domain?: string;
      user_id?: string;
      session_id?: string;
    }
  ): Promise<void> {
    // Get tool ID
    const tool = await this.getTool(toolName);
    if (!tool) {
      console.error(`❌ Tool not found: ${toolName}`);
      return;
    }

    const record = {
      tool_id: tool.id,
      tool_name: toolName,
      parameters: execution.parameters,
      result: execution.result,
      execution_time_ms: execution.execution_time_ms,
      cost: 0.001, // TODO: Calculate actual cost
      success: execution.success,
      error: execution.error,
      error_type: execution.error ? 'execution_error' : null,
      query: context?.query,
      domain: context?.domain,
      user_id: context?.user_id,
      session_id: context?.session_id,
      executed_at: new Date()
    };

    const { error } = await this.supabase
      .from('walt_tool_executions')
      .insert(record);

    if (error) {
      console.error('❌ Failed to record execution:', error);
    }

    // Metrics will be updated automatically by database trigger
  }

  /**
   * Get tool execution history
   */
  async getExecutionHistory(
    toolName: string,
    limit: number = 100
  ): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('walt_tool_executions')
      .select('*')
      .eq('tool_name', toolName)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to get execution history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update tool quality score
   */
  async updateQualityScore(toolName: string, qualityScore: number): Promise<void> {
    const { error } = await this.supabase
      .from('walt_discovered_tools')
      .update({ quality_score: qualityScore, updated_at: new Date() })
      .eq('tool_name', toolName);

    if (error) {
      console.error('❌ Failed to update quality score:', error);
    }
  }

  /**
   * Delete a tool
   */
  async deleteTool(toolName: string): Promise<void> {
    const { error } = await this.supabase
      .from('walt_discovered_tools')
      .delete()
      .eq('tool_name', toolName);

    if (error) {
      console.error('❌ Failed to delete tool:', error);
      throw error;
    }

    console.log(`🗑️ Deleted tool: ${toolName}`);
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    total_tools: number;
    active_tools: number;
    total_executions: number;
    avg_quality_score: number;
    avg_success_rate: number;
    domains: Record<string, number>;
  }> {
    const { data: tools, error: toolsError } = await this.supabase
      .from('walt_discovered_tools')
      .select('domain, quality_score, success_rate, total_executions, status');

    if (toolsError || !tools) {
      return {
        total_tools: 0,
        active_tools: 0,
        total_executions: 0,
        avg_quality_score: 0,
        avg_success_rate: 0,
        domains: {}
      };
    }

    const activateTools = tools.filter((t: any) => t.status === 'active');
    const domains: Record<string, number> = {};

    tools.forEach((tool: any) => {
      if (tool.domain) {
        tool.domain.forEach((d: string) => {
          domains[d] = (domains[d] || 0) + 1;
        });
      }
    });

    return {
      total_tools: tools.length,
      active_tools: activateTools.length,
      total_executions: tools.reduce((sum: number, t: any) => sum + (t.total_executions || 0), 0),
      avg_quality_score: tools.reduce((sum: number, t: any) => sum + (t.quality_score || 0), 0) / tools.length,
      avg_success_rate: tools.reduce((sum: number, t: any) => sum + (t.success_rate || 0), 0) / tools.length,
      domains
    };
  }

  /**
   * Generate embedding for text using Xenova
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use Xenova transformers for embeddings
      const { pipeline } = await import('@xenova/transformers');
      const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      const output = await embedder(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      // Pad or truncate to 1536 dimensions (OpenAI ada-002 compatible)
      while (embedding.length < 1536) {
        embedding.push(0);
      }

      return embedding.slice(0, 1536);
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Map database record to WALTToolWithMetrics
   */
  private mapToToolWithMetrics(data: any): WALTToolWithMetrics {
    return {
      id: data.id,
      name: data.tool_name,
      domain: data.domain[0] || 'general',
      file_path: data.metadata?.file_path || '',
      definition: data.tool_definition,
      metrics: {
        quality_score: data.quality_score,
        success_rate: data.success_rate,
        total_executions: data.total_executions,
        avg_execution_time_ms: data.avg_execution_time_ms,
        last_used_at: data.last_used_at ? new Date(data.last_used_at) : undefined,
        discovered_at: new Date(data.discovered_at)
      }
    };
  }
}

// Singleton instance
let waltStorageInstance: WALTToolStorage | undefined;

/**
 * Get singleton WALT storage instance
 */
export function getWALTStorage(): WALTToolStorage {
  if (!waltStorageInstance) {
    waltStorageInstance = new WALTToolStorage();
  }
  return waltStorageInstance;
}
