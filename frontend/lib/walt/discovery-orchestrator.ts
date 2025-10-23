/**
 * WALT Discovery Orchestrator
 *
 * Intelligent tool discovery system with:
 * - Domain-based discovery
 * - Priority-based scheduling
 * - Aggressive caching (24h TTL)
 * - Error handling and retry logic
 * - Background discovery jobs
 */

import { getWALTClient } from './client';
import { convertWALTToolToPERMUTATION, validateWALTTool, calculateToolQualityScore } from './adapter';
import { getDomainConfig, getHighPriorityDomains, getDomainsByPriority } from './domain-configs';
import { getWALTStorage } from './storage';
import { Tool } from '../tool-calling-system';
import {
  DiscoveredWALTTool,
  DomainDiscoveryConfig,
  ToolDiscoveryResponse,
  WALTToolWithMetrics
} from './types';

/**
 * Discovery Cache Entry
 */
interface DiscoveryCacheEntry {
  tools: Tool[];
  discovered_at: Date;
  expires_at: Date;
  domain: string;
  url: string;
}

/**
 * Discovery Job
 */
interface DiscoveryJob {
  id: string;
  domain: string;
  url: string;
  goal: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  error?: string;
  tools_discovered?: number;
}

/**
 * Discovery Statistics
 */
interface DiscoveryStats {
  total_discoveries: number;
  successful_discoveries: number;
  failed_discoveries: number;
  total_tools_discovered: number;
  cache_hits: number;
  cache_misses: number;
  avg_discovery_time_ms: number;
}

export class DiscoveryOrchestrator {
  private client = getWALTClient();
  private storage = getWALTStorage();
  private cache: Map<string, DiscoveryCacheEntry> = new Map();
  private jobs: Map<string, DiscoveryJob> = new Map();
  private stats: DiscoveryStats = {
    total_discoveries: 0,
    successful_discoveries: 0,
    failed_discoveries: 0,
    total_tools_discovered: 0,
    cache_hits: 0,
    cache_misses: 0,
    avg_discovery_time_ms: 0
  };

  constructor() {
    console.log('🎯 Discovery Orchestrator initialized with storage');
  }

  /**
   * Discover tools for a specific domain
   */
  async discoverForDomain(domain: string, options?: {
    force?: boolean; // Skip cache
    maxToolsPerSite?: number;
  }): Promise<Tool[]> {
    const config = getDomainConfig(domain);
    if (!config) {
      throw new Error(`Unknown domain: ${domain}`);
    }

    console.log(`🔍 Discovering tools for domain: ${domain}`);
    console.log(`   Sites: ${config.urls.length}`);
    console.log(`   Goals: ${config.goals.length}`);

    const allTools: Tool[] = [];

    // Discover tools from each URL
    for (const url of config.urls) {
      try {
        const tools = await this.discoverFromUrl(url, config, options);
        allTools.push(...tools);
      } catch (error: any) {
        console.error(`❌ Failed to discover from ${url}:`, error.message);
      }
    }

    console.log(`✅ Discovered ${allTools.length} tools for domain: ${domain}`);
    return allTools;
  }

  /**
   * Discover tools from a specific URL
   */
  async discoverFromUrl(
    url: string,
    config: DomainDiscoveryConfig,
    options?: {
      force?: boolean;
      maxToolsPerSite?: number;
    }
  ): Promise<Tool[]> {
    const cacheKey = this.getCacheKey(url, config.domain);

    // Check cache (unless force is true)
    if (!options?.force) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires_at > new Date()) {
        console.log(`📦 Cache hit: ${url} (${cached.tools.length} tools)`);
        this.stats.cache_hits++;
        return cached.tools;
      }
    }

    this.stats.cache_misses++;
    const startTime = Date.now();

    try {
      // Discover tools
      console.log(`🔧 Discovering from ${url}...`);
      const maxTools = options?.maxToolsPerSite || config.max_tools_per_site;

      const result = await this.client.discoverTools({
        url,
        max_tools: maxTools,
        headless: true
      });

      if (!result.success) {
        throw new Error(result.error || 'Discovery failed');
      }

      // Validate and convert tools
      const tools = this.processDiscoveredTools(result.tools, config.domain);

      // Store tools in database
      try {
        await this.storage.storeBatch(result.tools);
      } catch (error: any) {
        console.error('❌ Failed to store tools in database:', error.message);
        // Continue even if storage fails
      }

      // Cache results
      const expiresAt = new Date(Date.now() + config.cache_ttl_ms);
      this.cache.set(cacheKey, {
        tools,
        discovered_at: new Date(),
        expires_at: expiresAt,
        domain: config.domain,
        url
      });

      // Update stats
      const discoveryTime = Date.now() - startTime;
      this.updateStats(true, tools.length, discoveryTime);

      console.log(`✅ Discovered ${tools.length} tools from ${url} (${discoveryTime}ms)`);
      return tools;

    } catch (error: any) {
      this.updateStats(false, 0, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Discover tools using a specific goal
   */
  async discoverWithGoal(url: string, goal: string, domain?: string): Promise<Tool[]> {
    console.log(`🎯 Targeted discovery: "${goal}" from ${url}`);

    try {
      const result = await this.client.generateTool({
        url,
        goal,
        headless: true
      });

      if (!result.success || !result.tool) {
        throw new Error(result.error || 'Tool generation failed');
      }

      // Convert to PERMUTATION format
      const inferredDomain = domain || 'general';
      const tool = convertWALTToolToPERMUTATION(result.tool, [inferredDomain]);

      console.log(`✅ Generated tool: ${tool.name}`);
      return [tool];

    } catch (error: any) {
      console.error(`❌ Goal-based discovery failed:`, error.message);
      throw error;
    }
  }

  /**
   * Discover tools for all high-priority domains
   */
  async discoverHighPriorityDomains(options?: {
    maxConcurrent?: number;
  }): Promise<Map<string, Tool[]>> {
    const configs = getHighPriorityDomains();
    console.log(`🚀 Discovering tools for ${configs.length} high-priority domains`);

    const results = new Map<string, Tool[]>();
    const maxConcurrent = options?.maxConcurrent || 2;

    // Process domains in batches to avoid overwhelming the system
    for (let i = 0; i < configs.length; i += maxConcurrent) {
      const batch = configs.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map(config => this.discoverForDomain(config.domain))
      );

      // Collect results
      batchResults.forEach((result, index) => {
        const config = batch[index];
        if (result.status === 'fulfilled') {
          results.set(config.domain, result.value);
        } else {
          console.error(`❌ Failed to discover ${config.domain}:`, result.reason);
          results.set(config.domain, []);
        }
      });
    }

    return results;
  }

  /**
   * Discover tools for all domains (background job)
   */
  async discoverAllDomains(options?: {
    maxConcurrent?: number;
  }): Promise<Map<string, Tool[]>> {
    const configs = getDomainsByPriority();
    console.log(`🌍 Discovering tools for all ${configs.length} domains`);

    const results = new Map<string, Tool[]>();
    const maxConcurrent = options?.maxConcurrent || 2;

    // Process domains in batches by priority
    for (let i = 0; i < configs.length; i += maxConcurrent) {
      const batch = configs.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map(config => this.discoverForDomain(config.domain))
      );

      // Collect results
      batchResults.forEach((result, index) => {
        const config = batch[index];
        if (result.status === 'fulfilled') {
          results.set(config.domain, result.value);
        } else {
          console.error(`❌ Failed to discover ${config.domain}:`, result.reason);
          results.set(config.domain, []);
        }
      });
    }

    return results;
  }

  /**
   * Process discovered tools (validate, score, convert)
   */
  private processDiscoveredTools(
    waltTools: DiscoveredWALTTool[],
    domain: string
  ): Tool[] {
    const tools: Tool[] = [];

    for (const waltTool of waltTools) {
      try {
        // Validate tool
        const validation = validateWALTTool(waltTool);
        if (!validation.valid) {
          console.warn(`⚠️ Tool validation failed: ${waltTool.name}`, validation.issues);
          continue;
        }

        // Calculate quality score
        const qualityScore = calculateToolQualityScore(waltTool);
        if (qualityScore < 0.5) {
          console.warn(`⚠️ Low quality tool skipped: ${waltTool.name} (score: ${qualityScore.toFixed(2)})`);
          continue;
        }

        // Convert to PERMUTATION format
        const tool = convertWALTToolToPERMUTATION(waltTool, [domain]);
        tools.push(tool);

        console.log(`✅ Processed tool: ${tool.name} (quality: ${qualityScore.toFixed(2)})`);

      } catch (error: any) {
        console.error(`❌ Failed to process tool ${waltTool.name}:`, error.message);
      }
    }

    return tools;
  }

  /**
   * Get cache key for URL and domain
   */
  private getCacheKey(url: string, domain: string): string {
    return `${domain}:${url}`;
  }

  /**
   * Update discovery statistics
   */
  private updateStats(success: boolean, toolsDiscovered: number, timeMs: number): void {
    this.stats.total_discoveries++;

    if (success) {
      this.stats.successful_discoveries++;
      this.stats.total_tools_discovered += toolsDiscovered;
    } else {
      this.stats.failed_discoveries++;
    }

    // Update average discovery time
    const totalTime = this.stats.avg_discovery_time_ms * (this.stats.total_discoveries - 1) + timeMs;
    this.stats.avg_discovery_time_ms = totalTime / this.stats.total_discoveries;
  }

  /**
   * Get discovery statistics
   */
  getStats(): DiscoveryStats {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Discovery cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get cached tools
   */
  getCachedTools(): DiscoveryCacheEntry[] {
    return Array.from(this.cache.values());
  }
}

// Singleton instance
let discoveryOrchestratorInstance: DiscoveryOrchestrator | undefined;

/**
 * Get singleton discovery orchestrator instance
 */
export function getDiscoveryOrchestrator(): DiscoveryOrchestrator {
  if (!discoveryOrchestratorInstance) {
    discoveryOrchestratorInstance = new DiscoveryOrchestrator();
  }
  return discoveryOrchestratorInstance;
}
