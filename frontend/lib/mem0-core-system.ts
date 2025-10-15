/**
 * Mem0 Core System - Advanced Memory Management
 * 
 * Built with DSPy principles for modular, testable memory operations:
 * - Episodic memory (conversations, experiences)
 * - Semantic memory (knowledge, facts)
 * - Working memory (current context)
 * - Memory consolidation and retrieval
 * - Memory-based learning and adaptation
 */

import { getQdrantDB } from './qdrant-vector-db';
import { getToolCallingSystem } from './tool-calling-system';

export interface Memory {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'working' | 'procedural';
  domain: string;
  timestamp: number;
  importance: number; // 0-1 scale
  access_count: number;
  last_accessed: number;
  metadata: {
    source: string;
    confidence: number;
    tags: string[];
    related_memories: string[];
    embedding?: number[];
  };
}

export interface MemoryQuery {
  query: string;
  type?: Memory['type'];
  domain?: string;
  limit?: number;
  min_importance?: number;
  include_related?: boolean;
}

export interface MemoryConsolidation {
  memories_to_consolidate: string[];
  consolidation_strategy: 'merge' | 'summarize' | 'extract_key_facts';
  result_memory_id: string;
}

export interface MemoryStats {
  total_memories: number;
  by_type: Record<Memory['type'], number>;
  by_domain: Record<string, number>;
  avg_importance: number;
  most_accessed: Memory[];
  recent_memories: Memory[];
}

export class Mem0CoreSystem {
  private qdrantDB: any;
  private toolSystem: any;
  private workingMemory: Map<string, Memory> = new Map();
  private memoryIndex: Map<string, Memory> = new Map();
  private consolidationQueue: MemoryConsolidation[] = [];

  constructor() {
    this.qdrantDB = getQdrantDB();
    this.toolSystem = getToolCallingSystem();
    console.log('🧠 Mem0 Core System initialized');
  }

  /**
   * Store a new memory
   */
  async storeMemory(
    content: string,
    type: Memory['type'],
    domain: string,
    importance: number = 0.5,
    metadata: Partial<Memory['metadata']> = {}
  ): Promise<string> {
    const memoryId = this.generateMemoryId();
    const timestamp = Date.now();
    
    const memory: Memory = {
      id: memoryId,
      content,
      type,
      domain,
      timestamp,
      importance,
      access_count: 0,
      last_accessed: timestamp,
      metadata: {
        source: metadata.source || 'user_input',
        confidence: metadata.confidence || 0.8,
        tags: metadata.tags || [],
        related_memories: metadata.related_memories || [],
        embedding: metadata.embedding
      }
    };

    // Store in local index
    this.memoryIndex.set(memoryId, memory);

    // Store in working memory if type is 'working'
    if (type === 'working') {
      this.workingMemory.set(memoryId, memory);
    }

    // Store in vector database for semantic search
    if (memory.metadata.embedding) {
      await this.qdrantDB.storeDocument(
        memoryId,
        content,
        memory.metadata.embedding,
        {
          domain,
          timestamp,
          source: memory.metadata.source,
          type: 'memory',
          confidence: memory.metadata.confidence,
          tags: memory.metadata.tags
        }
      );
    }

    console.log(`🧠 Stored ${type} memory: ${memoryId} (${domain})`);
    return memoryId;
  }

  /**
   * Retrieve memories based on query
   */
  async retrieveMemories(query: MemoryQuery): Promise<Memory[]> {
    const {
      query: searchQuery,
      type,
      domain,
      limit = 10,
      min_importance = 0.0,
      include_related = false
    } = query;

    let memories: Memory[] = [];

    // Get embeddings for semantic search
    const embedding = await this.getEmbedding(searchQuery);
    
    // Search in vector database
    const vectorResults = await this.qdrantDB.searchSimilar(
      searchQuery,
      embedding,
      {
        limit: limit * 2,
        filter: {
          domain,
          type: 'memory',
          min_confidence: 0.5
        },
        hybrid_search: true
      }
    );

    // Convert to Memory objects
    memories = vectorResults
      .map((result: any) => this.memoryIndex.get(result.id))
      .filter(Boolean) as Memory[];

    // Filter by type and importance
    memories = memories.filter((memory: any) => {
      if (type && memory.type !== type) return false;
      if (memory.importance < min_importance) return false;
      return true;
    });

    // Sort by relevance and importance
    memories.sort((a, b) => {
      const aScore = a.importance * 0.7 + (a.access_count / 100) * 0.3;
      const bScore = b.importance * 0.7 + (b.access_count / 100) * 0.3;
      return bScore - aScore;
    });

    // Limit results
    memories = memories.slice(0, limit);

    // Include related memories if requested
    if (include_related) {
      const relatedMemories = await this.getRelatedMemories(memories);
      memories = [...memories, ...relatedMemories].slice(0, limit);
    }

    // Update access statistics
    memories.forEach(memory => {
      memory.access_count++;
      memory.last_accessed = Date.now();
    });

    console.log(`🔍 Retrieved ${memories.length} memories for query: "${searchQuery}"`);
    return memories;
  }

  /**
   * Get working memory (current context)
   */
  getWorkingMemory(): Memory[] {
    return Array.from(this.workingMemory.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear working memory
   */
  clearWorkingMemory(): void {
    this.workingMemory.clear();
    console.log('🧹 Cleared working memory');
  }

  /**
   * Consolidate memories (merge, summarize, or extract key facts)
   */
  async consolidateMemories(
    memoryIds: string[],
    strategy: MemoryConsolidation['consolidation_strategy'] = 'summarize'
  ): Promise<string> {
    const memories = memoryIds
      .map((id: any) => this.memoryIndex.get(id))
      .filter(Boolean) as Memory[];

    if (memories.length === 0) {
      throw new Error('No memories found for consolidation');
    }

    const consolidationId = this.generateMemoryId();
    
    let consolidatedContent = '';
    
    switch (strategy) {
      case 'merge':
        consolidatedContent = await this.mergeMemories(memories);
        break;
      case 'summarize':
        consolidatedContent = await this.summarizeMemories(memories);
        break;
      case 'extract_key_facts':
        consolidatedContent = await this.extractKeyFacts(memories);
        break;
    }

    // Create consolidated memory
    const consolidatedMemory = await this.storeMemory(
      consolidatedContent,
      'semantic',
      memories[0].domain,
      Math.max(...memories.map((m: any) => m.importance)),
      {
        source: 'consolidation',
        confidence: 0.9,
        tags: ['consolidated', ...memories.flatMap(m => m.metadata.tags)],
        related_memories: memoryIds
      }
    );

    // Remove original memories
    memoryIds.forEach(id => {
      this.memoryIndex.delete(id);
      this.workingMemory.delete(id);
    });

    console.log(`🔄 Consolidated ${memories.length} memories into: ${consolidatedMemory}`);
    return consolidatedMemory;
  }

  /**
   * Learn from memory patterns
   */
  async learnFromMemories(): Promise<{
    patterns: string[];
    insights: string[];
    recommendations: string[];
  }> {
    const allMemories = Array.from(this.memoryIndex.values());
    
    // Analyze patterns
    const patterns = this.analyzeMemoryPatterns(allMemories);
    
    // Generate insights
    const insights = await this.generateInsights(allMemories);
    
    // Create recommendations
    const recommendations = await this.generateRecommendations(allMemories, patterns, insights);

    return { patterns, insights, recommendations };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    const allMemories = Array.from(this.memoryIndex.values());
    
    const byType = allMemories.reduce((acc: any, memory: any) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<Memory['type'], number>);

    const byDomain = allMemories.reduce((acc: any, memory: any) => {
      acc[memory.domain] = (acc[memory.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgImportance = allMemories.length > 0 
      ? allMemories.reduce((sum: number, m: any) => sum + m.importance, 0) / allMemories.length 
      : 0;

    const mostAccessed = allMemories
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 5);

    const recentMemories = allMemories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    return {
      total_memories: allMemories.length,
      by_type: byType,
      by_domain: byDomain,
      avg_importance: avgImportance,
      most_accessed: mostAccessed,
      recent_memories: recentMemories
    };
  }

  /**
   * Merge memories into one
   */
  private async mergeMemories(memories: Memory[]): Promise<string> {
    const contents = memories.map(m => m.content);
    return contents.join('\n\n---\n\n');
  }

  /**
   * Summarize memories
   */
  private async summarizeMemories(memories: Memory[]): Promise<string> {
    // Use tool system for summarization
    const summaryTool = this.toolSystem.getTool('text_analysis');
    if (summaryTool) {
      const combinedContent = memories.map(m => m.content).join('\n');
      const result = await summaryTool.execute({
        text: combinedContent,
        analysis_type: 'key_phrases'
      });
      
      return `Summary of ${memories.length} memories:\n${result.key_phrases.join(', ')}`;
    }
    
    // Fallback to simple concatenation
    return `Summary: ${memories.length} memories about ${memories[0].domain}`;
  }

  /**
   * Extract key facts from memories
   */
  private async extractKeyFacts(memories: Memory[]): Promise<string> {
    const facts: string[] = [];
    
    memories.forEach(memory => {
      // Simple fact extraction (replace with more sophisticated NLP)
      const sentences = memory.content.split('.').filter(s => s.trim().length > 10);
      facts.push(...sentences.slice(0, 2)); // Take first 2 sentences as facts
    });
    
    return `Key Facts:\n${facts.map(f => `• ${f.trim()}`).join('\n')}`;
  }

  /**
   * Get related memories
   */
  private async getRelatedMemories(memories: Memory[]): Promise<Memory[]> {
    const relatedIds = new Set<string>();
    
    memories.forEach(memory => {
      memory.metadata.related_memories.forEach(id => relatedIds.add(id));
    });
    
    return Array.from(relatedIds)
      .map(id => this.memoryIndex.get(id))
      .filter(Boolean) as Memory[];
  }

  /**
   * Analyze memory patterns
   */
  private analyzeMemoryPatterns(memories: Memory[]): string[] {
    const patterns: string[] = [];
    
    // Domain patterns
    const domainCounts = memories.reduce((acc, m) => {
      acc[m.domain] = (acc[m.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    patterns.push(`Most active domains: ${topDomains.map(([domain, count]) => `${domain} (${count})`).join(', ')}`);
    
    // Type patterns
    const typeCounts = memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    patterns.push(`Memory types: ${Object.entries(typeCounts).map(([type, count]) => `${type} (${count})`).join(', ')}`);
    
    return patterns;
  }

  /**
   * Generate insights from memories
   */
  private async generateInsights(memories: Memory[]): Promise<string[]> {
    const insights: string[] = [];
    
    // Importance insights
    const highImportanceMemories = memories.filter(m => m.importance > 0.8);
    if (highImportanceMemories.length > 0) {
      insights.push(`${highImportanceMemories.length} high-importance memories identified`);
    }
    
    // Access pattern insights
    const frequentlyAccessed = memories.filter(m => m.access_count > 5);
    if (frequentlyAccessed.length > 0) {
      insights.push(`${frequentlyAccessed.length} memories accessed frequently`);
    }
    
    // Temporal insights
    const recentMemories = memories.filter(m => Date.now() - m.timestamp < 86400000); // Last 24h
    if (recentMemories.length > 0) {
      insights.push(`${recentMemories.length} memories created in last 24 hours`);
    }
    
    return insights;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    memories: Memory[],
    patterns: string[],
    insights: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Consolidation recommendations
    const similarMemories = this.findSimilarMemories(memories);
    if (similarMemories.length > 0) {
      recommendations.push(`Consider consolidating ${similarMemories.length} similar memories`);
    }
    
    // Cleanup recommendations
    const oldMemories = memories.filter(m => Date.now() - m.timestamp > 2592000000); // 30 days
    if (oldMemories.length > 0) {
      recommendations.push(`Consider archiving ${oldMemories.length} old memories`);
    }
    
    // Importance recommendations
    const lowImportanceMemories = memories.filter(m => m.importance < 0.3 && m.access_count < 2);
    if (lowImportanceMemories.length > 0) {
      recommendations.push(`Consider removing ${lowImportanceMemories.length} low-importance memories`);
    }
    
    return recommendations;
  }

  /**
   * Find similar memories
   */
  private findSimilarMemories(memories: Memory[]): Memory[] {
    // Simple similarity based on domain and tags
    const similar: Memory[] = [];
    
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const mem1 = memories[i];
        const mem2 = memories[j];
        
        if (mem1.domain === mem2.domain) {
          const commonTags = mem1.metadata.tags.filter(tag => 
            mem2.metadata.tags.includes(tag)
          );
          
          if (commonTags.length > 0) {
            similar.push(mem1, mem2);
          }
        }
      }
    }
    
    return similar;
  }

  /**
   * Get embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Use local embeddings (replace with actual implementation)
    // For now, return a dummy embedding
    return Array.from({ length: 384 }, () => Math.random() - 0.5);
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let mem0Instance: Mem0CoreSystem | undefined;

export function getMem0CoreSystem(): Mem0CoreSystem {
  if (!mem0Instance) {
    mem0Instance = new Mem0CoreSystem();
  }
  return mem0Instance;
}
