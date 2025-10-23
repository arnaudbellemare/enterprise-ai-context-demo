/**
 * WALT + ACE Framework Integration
 *
 * Learns tool usage patterns and evolves tool selection strategies
 */

import { createClient } from '@supabase/supabase-js';
import { getWALTStorage } from './storage';
import { WALTToolWithMetrics, WALTToolExecutionResult } from './types';

/**
 * Tool Usage Pattern
 */
export interface ToolUsagePattern {
  id: string;
  tool_name: string;
  pattern_type: 'success' | 'failure' | 'optimization';
  pattern_description: string;
  query_pattern?: string;
  domain?: string;
  parameters_pattern?: Record<string, any>;
  confidence: number;
  evidence_count: number;
  first_observed_at: Date;
  last_observed_at: Date;
}

/**
 * ACE Playbook Bullet for Tools
 */
export interface ToolPlaybookBullet {
  id: string;
  section: string;
  content: string;
  walt_tool_name?: string;
  helpful_count: number;
  harmful_count: number;
  tags: string[];
}

/**
 * WALT + ACE Integration Manager
 */
export class WALTACEIntegration {
  private storage = getWALTStorage();
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  constructor() {
    console.log('🧠 WALT + ACE Integration initialized');
  }

  /**
   * Learn from successful tool execution
   */
  async learnFromSuccess(
    toolName: string,
    execution: WALTToolExecutionResult,
    context: {
      query: string;
      domain: string;
      why_successful?: string;
    }
  ): Promise<void> {
    console.log(`✅ Learning from successful execution: ${toolName}`);

    // Extract pattern from successful execution
    const pattern = this.extractSuccessPattern(toolName, execution, context);

    // Store pattern in database
    await this.storePattern(pattern);

    // Update ACE playbook if confidence is high
    if (pattern.confidence >= 0.7) {
      await this.updateACEPlaybook(pattern, 'helpful');
    }
  }

  /**
   * Learn from failed tool execution
   */
  async learnFromFailure(
    toolName: string,
    execution: WALTToolExecutionResult,
    context: {
      query: string;
      domain: string;
      why_failed?: string;
    }
  ): Promise<void> {
    console.log(`❌ Learning from failed execution: ${toolName}`);

    // Extract pattern from failed execution
    const pattern = this.extractFailurePattern(toolName, execution, context);

    // Store pattern in database
    await this.storePattern(pattern);

    // Update ACE playbook to avoid this pattern
    if (pattern.confidence >= 0.7) {
      await this.updateACEPlaybook(pattern, 'harmful');
    }
  }

  /**
   * Get tool recommendations based on learned patterns
   */
  async getRecommendationsForQuery(
    query: string,
    domain: string,
    limit: number = 3
  ): Promise<WALTToolWithMetrics[]> {
    // Find matching success patterns
    const { data: patterns, error } = await this.supabase
      .from('walt_tool_usage_patterns')
      .select('*')
      .eq('pattern_type', 'success')
      .eq('domain', domain)
      .gte('confidence', 0.7)
      .order('confidence', { ascending: false })
      .limit(limit * 2); // Get more to filter

    if (error || !patterns) {
      console.error('❌ Failed to get patterns:', error);
      return [];
    }

    // Score tools based on pattern match
    const toolScores = new Map<string, number>();

    for (const pattern of patterns) {
      // Simple keyword matching for pattern
      const queryLower = query.toLowerCase();
      const patternLower = (pattern.query_pattern || '').toLowerCase();

      if (patternLower && queryLower.includes(patternLower)) {
        const currentScore = toolScores.get(pattern.tool_name) || 0;
        toolScores.set(
          pattern.tool_name,
          currentScore + pattern.confidence * pattern.evidence_count
        );
      }
    }

    // Get tools sorted by score
    const sortedTools = Array.from(toolScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([toolName]) => toolName);

    // Fetch full tool data
    const tools: WALTToolWithMetrics[] = [];
    for (const toolName of sortedTools) {
      const tool = await this.storage.getTool(toolName);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Get ACE playbook bullets for WALT tools
   */
  async getToolPlaybookBullets(domain?: string): Promise<ToolPlaybookBullet[]> {
    let query = this.supabase
      .from('ace_playbook_bullets')
      .select('*')
      .not('walt_tool_name', 'is', null);

    if (domain) {
      query = query.contains('tags', [domain]);
    }

    const { data, error } = await query.order('helpful_count', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as ToolPlaybookBullet[];
  }

  /**
   * Extract success pattern from execution
   */
  private extractSuccessPattern(
    toolName: string,
    execution: WALTToolExecutionResult,
    context: {
      query: string;
      domain: string;
      why_successful?: string;
    }
  ): Omit<ToolUsagePattern, 'id' | 'first_observed_at' | 'last_observed_at'> {
    // Extract key parameters that led to success
    const keyParams = this.extractKeyParameters(execution.parameters);

    // Build pattern description
    const description = context.why_successful
      ? context.why_successful
      : `Tool ${toolName} succeeded with parameters: ${JSON.stringify(keyParams)}`;

    // Extract query pattern (simplified)
    const queryPattern = this.extractQueryPattern(context.query);

    return {
      tool_name: toolName,
      pattern_type: 'success',
      pattern_description: description,
      query_pattern: queryPattern,
      domain: context.domain,
      parameters_pattern: keyParams,
      confidence: 0.8, // Initial confidence
      evidence_count: 1
    };
  }

  /**
   * Extract failure pattern from execution
   */
  private extractFailurePattern(
    toolName: string,
    execution: WALTToolExecutionResult,
    context: {
      query: string;
      domain: string;
      why_failed?: string;
    }
  ): Omit<ToolUsagePattern, 'id' | 'first_observed_at' | 'last_observed_at'> {
    const keyParams = this.extractKeyParameters(execution.parameters);

    const description = execution.error
      ? `Tool ${toolName} failed: ${execution.error}`
      : `Tool ${toolName} failed with parameters: ${JSON.stringify(keyParams)}`;

    const queryPattern = this.extractQueryPattern(context.query);

    return {
      tool_name: toolName,
      pattern_type: 'failure',
      pattern_description: description,
      query_pattern: queryPattern,
      domain: context.domain,
      parameters_pattern: keyParams,
      confidence: 0.8,
      evidence_count: 1
    };
  }

  /**
   * Store pattern in database
   */
  private async storePattern(
    pattern: Omit<ToolUsagePattern, 'id' | 'first_observed_at' | 'last_observed_at'>
  ): Promise<void> {
    // Check if similar pattern exists
    const { data: existing, error: queryError } = await this.supabase
      .from('walt_tool_usage_patterns')
      .select('*')
      .eq('tool_name', pattern.tool_name)
      .eq('pattern_type', pattern.pattern_type)
      .eq('domain', pattern.domain || '')
      .limit(1);

    if (queryError) {
      console.error('❌ Failed to query patterns:', queryError);
      return;
    }

    if (existing && existing.length > 0) {
      // Update existing pattern
      const existingPattern = existing[0];
      const newEvidenceCount = existingPattern.evidence_count + 1;
      const newConfidence = Math.min(
        (existingPattern.confidence * existingPattern.evidence_count + pattern.confidence) /
          newEvidenceCount,
        1.0
      );

      const { error } = await this.supabase
        .from('walt_tool_usage_patterns')
        .update({
          confidence: newConfidence,
          evidence_count: newEvidenceCount,
          last_observed_at: new Date().toISOString()
        })
        .eq('id', existingPattern.id);

      if (error) {
        console.error('❌ Failed to update pattern:', error);
      }
    } else {
      // Insert new pattern
      const { error } = await this.supabase.from('walt_tool_usage_patterns').insert({
        ...pattern,
        first_observed_at: new Date().toISOString(),
        last_observed_at: new Date().toISOString()
      });

      if (error) {
        console.error('❌ Failed to insert pattern:', error);
      }
    }
  }

  /**
   * Update ACE playbook with tool pattern
   */
  private async updateACEPlaybook(
    pattern: Omit<ToolUsagePattern, 'id' | 'first_observed_at' | 'last_observed_at'>,
    tag: 'helpful' | 'harmful'
  ): Promise<void> {
    // Check if ACE playbook table exists
    const { error: tableError } = await this.supabase
      .from('ace_playbook_bullets')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('⚠️ ACE playbook table not accessible, skipping bullet creation');
      return;
    }

    // Build bullet content
    const content =
      tag === 'helpful'
        ? `Use WALT tool '${pattern.tool_name}' for ${pattern.domain} queries like: ${pattern.query_pattern || 'similar queries'}`
        : `Avoid WALT tool '${pattern.tool_name}' for ${pattern.domain} queries: ${pattern.pattern_description}`;

    // Check if bullet already exists
    const { data: existing, error: queryError } = await this.supabase
      .from('ace_playbook_bullets')
      .select('*')
      .eq('walt_tool_name', pattern.tool_name)
      .eq('section', pattern.domain || 'general')
      .limit(1);

    if (queryError) {
      console.error('❌ Failed to query ACE bullets:', queryError);
      return;
    }

    if (existing && existing.length > 0) {
      // Update existing bullet
      const bullet = existing[0];
      const updateField = tag === 'helpful' ? 'helpful_count' : 'harmful_count';

      const { error } = await this.supabase
        .from('ace_playbook_bullets')
        .update({
          [updateField]: bullet[updateField] + 1
        })
        .eq('id', bullet.id);

      if (error) {
        console.error('❌ Failed to update ACE bullet:', error);
      }
    } else {
      // Insert new bullet
      const { error } = await this.supabase.from('ace_playbook_bullets').insert({
        section: pattern.domain || 'general',
        content,
        walt_tool_name: pattern.tool_name,
        helpful_count: tag === 'helpful' ? 1 : 0,
        harmful_count: tag === 'harmful' ? 1 : 0,
        tags: [pattern.domain || 'general', 'walt-tool']
      });

      if (error) {
        console.error('❌ Failed to insert ACE bullet:', error);
      } else {
        console.log(`📝 Created ACE playbook bullet for ${pattern.tool_name}`);
      }
    }
  }

  /**
   * Extract key parameters from execution
   */
  private extractKeyParameters(params: Record<string, any>): Record<string, any> {
    // TODO: Implement more sophisticated parameter extraction
    // For now, return all parameters
    return params;
  }

  /**
   * Extract query pattern from full query
   */
  private extractQueryPattern(query: string): string {
    // Simplified: extract first 50 characters
    return query.substring(0, 50).toLowerCase().trim();
  }
}

// Singleton instance
let waltACEInstance: WALTACEIntegration | undefined;

/**
 * Get singleton WALT + ACE integration instance
 */
export function getWALTACEIntegration(): WALTACEIntegration {
  if (!waltACEInstance) {
    waltACEInstance = new WALTACEIntegration();
  }
  return waltACEInstance;
}
