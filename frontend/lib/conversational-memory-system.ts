/**
 * Conversational Memory System (inspired by mem0-dspy)
 * 
 * Provides user-scoped, persistent conversational memory with:
 * - Vector similarity search for semantic retrieval
 * - ReAct agent for intelligent memory management (ADD/UPDATE/DELETE/NOOP)
 * - Category-based organization
 * - Cross-session persistence
 * - Automatic memory deduplication and merging
 * 
 * Architecture inspired by: https://github.com/avbiswas/mem0-dspy
 * Paper: https://arxiv.org/abs/2504.19413
 */

import { createLogger } from '../../lib/walt/logger';
import { z } from 'zod';
import { embeddingService, type EmbeddingResult } from './embedding-service';
import { callLLMWithRetry } from './brain-skills/llm-helpers';

const logger = createLogger('ConversationalMemory');

// ============================================================
// MEMORY TYPES
// ============================================================

export const MemorySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  content: z.string(),
  category: z.enum(['personal', 'preferences', 'facts', 'relationships', 'work', 'goals', 'events', 'other']),
  embedding: z.array(z.number()).optional(),
  metadata: z.object({
    created_at: z.string(),
    updated_at: z.string(),
    source: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    importance: z.number().min(0).max(1).optional(),
  }),
  tags: z.array(z.string()).optional(),
});

export type Memory = z.infer<typeof MemorySchema>;

export const MemoryOperationSchema = z.object({
  operation: z.enum(['ADD', 'UPDATE', 'DELETE', 'MERGE', 'NOOP']),
  memory_id: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(['personal', 'preferences', 'facts', 'relationships', 'work', 'goals', 'events', 'other']).optional(),
  merge_ids: z.array(z.string()).optional(),
  reasoning: z.string(),
});

export type MemoryOperation = z.infer<typeof MemoryOperationSchema>;

// ============================================================
// VECTOR DATABASE INTERFACE
// ============================================================

export interface VectorDBClient {
  upsert(memories: Memory[]): Promise<void>;
  search(userId: string, queryEmbedding: number[], limit: number, scoreThreshold: number): Promise<Memory[]>;
  delete(memoryIds: string[]): Promise<void>;
  getById(memoryId: string): Promise<Memory | null>;
  getAllForUser(userId: string): Promise<Memory[]>;
}

// ============================================================
// IN-MEMORY VECTOR DB (Development)
// ============================================================

export class InMemoryVectorDB implements VectorDBClient {
  private memories: Map<string, Memory> = new Map();

  async upsert(memories: Memory[]): Promise<void> {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
    logger.info('Memories upserted to in-memory DB', { count: memories.length });
  }

  async search(
    userId: string, 
    queryEmbedding: number[], 
    limit: number = 5,
    scoreThreshold: number = 0.7
  ): Promise<Memory[]> {
    const userMemories = Array.from(this.memories.values())
      .filter(m => m.user_id === userId && m.embedding);

    // Calculate cosine similarity
    const scored = userMemories.map(memory => ({
      memory,
      score: this.cosineSimilarity(queryEmbedding, memory.embedding!)
    }));

    // Filter by threshold and sort by score
    return scored
      .filter(s => s.score >= scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
  }

  async delete(memoryIds: string[]): Promise<void> {
    for (const id of memoryIds) {
      this.memories.delete(id);
    }
    logger.info('Memories deleted', { count: memoryIds.length });
  }

  async getById(memoryId: string): Promise<Memory | null> {
    return this.memories.get(memoryId) || null;
  }

  async getAllForUser(userId: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(m => m.user_id === userId);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================
// EMBEDDING GENERATION
// ============================================================

export class EmbeddingGenerator {
  async generate(text: string): Promise<number[]> {
    try {
      const result = await embeddingService.generate(text);
      logger.info('Embedding generated successfully', { 
        provider: result.provider, 
        dimensions: result.dimensions,
        textLength: text.length 
      });
      return result.embedding;
    } catch (error: any) {
      logger.error('Embedding generation failed', { error: error.message });
      // Return zero vector as fallback
      return new Array(512).fill(0);
    }
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    try {
      const results = await embeddingService.generateBatch(texts);
      logger.info('Batch embedding generation completed', { 
        count: results.length,
        providers: results.map(r => r.provider)
      });
      return results.map(r => r.embedding);
    } catch (error: any) {
      logger.error('Batch embedding generation failed', { error: error.message });
      // Return zero vectors as fallback
      return texts.map(() => new Array(512).fill(0));
    }
  }
}

// ============================================================
// MEMORY MANAGEMENT REACT AGENT
// ============================================================

export class MemoryManagementAgent {
  private embeddingGenerator: EmbeddingGenerator;

  constructor() {
    this.embeddingGenerator = new EmbeddingGenerator();
  }

  /**
   * ReAct agent that decides what memory operation to perform
   * Based on conversation context and existing memories
   */
  async decide(
    userId: string,
    conversationText: string,
    existingMemories: Memory[]
  ): Promise<MemoryOperation[]> {
    logger.info('Memory management agent analyzing conversation', {
      userId,
      conversationLength: conversationText.length,
      existingMemoriesCount: existingMemories.length
    });

    try {
      // Use LLM to decide on memory operations
      const prompt = this.buildMemoryManagementPrompt(conversationText, existingMemories);
      
      const response = await this.callLLM(prompt);
      
      // Parse structured output
      const operations = this.parseMemoryOperations(response);
      
      logger.info('Memory operations decided', { 
        operations: operations.map(op => op.operation)
      });
      
      return operations;
    } catch (error: any) {
      logger.error('Memory management decision failed', { error });
      return [{ operation: 'NOOP', reasoning: 'Error in decision making - using fallback' }];
    }
  }

  private buildMemoryManagementPrompt(conversation: string, memories: Memory[]): string {
    const memoriesText = memories.length > 0
      ? memories.map((m, i) => `${i + 1}. [${m.category}] ${m.content} (ID: ${m.id})`).join('\n')
      : 'No existing memories.';

    return `You are a memory management agent. Analyze this conversation and decide what memory operations to perform.

CONVERSATION:
${conversation}

EXISTING MEMORIES:
${memoriesText}

Your task: Decide whether to ADD new memories, UPDATE existing ones, DELETE outdated ones, MERGE similar ones, or take NO OPERATION (NOOP).

OPERATIONS:
- ADD: When new information is shared that's not already stored
- UPDATE: When existing memory needs to be enhanced with new details
- DELETE: When memory is outdated or incorrect
- MERGE: When multiple memories describe the same thing
- NOOP: When existing memories are already accurate

Respond with JSON array of operations:
[
  {
    "operation": "ADD|UPDATE|DELETE|MERGE|NOOP",
    "memory_id": "id (for UPDATE/DELETE)",
    "content": "memory content (for ADD/UPDATE)",
    "category": "personal|preferences|facts|relationships|work|goals|events|other",
    "merge_ids": ["id1", "id2"] (for MERGE),
    "reasoning": "why this operation"
  }
]

Be conservative - only add truly important information. Prioritize quality over quantity.`;
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      const response = await callLLMWithRetry([
        { role: 'system', content: 'You are a memory management agent that outputs valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      });

      return response.content;
    } catch (error: any) {
      logger.error('LLM call failed', { error });
      // Return a valid JSON fallback response
      return JSON.stringify([{
        operation: 'NOOP',
        reasoning: 'LLM call failed, defaulting to no operation'
      }]);
    }
  }

  private parseMemoryOperations(jsonString: string): MemoryOperation[] {
    try {
      // Check if the response is an error string
      if (jsonString.startsWith('Error:') || jsonString.includes('Failed after')) {
        logger.info('Received error response, using fallback');
        return [{ operation: 'NOOP', reasoning: 'Error response received' }];
      }

      // Clean up markdown formatting if present
      let cleanJson = jsonString;
      if (jsonString.includes('```json')) {
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          cleanJson = match[1].trim();
        }
      }

      const parsed = JSON.parse(cleanJson);
      const operations = Array.isArray(parsed) ? parsed : parsed.operations || [parsed];
      
      return operations.map((op: any) => ({
        operation: op.operation || 'NOOP',
        memory_id: op.memory_id,
        content: op.content,
        category: op.category || 'other',
        merge_ids: op.merge_ids,
        reasoning: op.reasoning || 'No reasoning provided'
      }));
    } catch (error: any) {
      logger.error('Failed to parse memory operations', { error: error.message, jsonString: jsonString.substring(0, 200) });
      return [{ operation: 'NOOP', reasoning: 'Parse error - using fallback' }];
    }
  }
}

// ============================================================
// CONVERSATIONAL MEMORY SYSTEM
// ============================================================

export class ConversationalMemorySystem {
  private vectorDB: VectorDBClient;
  private embeddingGenerator: EmbeddingGenerator;
  private memoryAgent: MemoryManagementAgent;

  constructor(vectorDB?: VectorDBClient) {
    this.vectorDB = vectorDB || new InMemoryVectorDB();
    this.embeddingGenerator = new EmbeddingGenerator();
    this.memoryAgent = new MemoryManagementAgent();
    
    logger.info('Conversational Memory System initialized');
  }

  /**
   * Main method: Process conversation and update memories
   */
  async processConversation(
    userId: string,
    conversationText: string
  ): Promise<{
    operations: MemoryOperation[];
    updatedMemories: Memory[];
  }> {
    logger.info('Processing conversation for memory updates', { userId });

    // 1. Retrieve relevant existing memories
    const queryEmbedding = await this.embeddingGenerator.generate(conversationText);
    const existingMemories = await this.vectorDB.search(userId, queryEmbedding, 10, 0.7);

    // 2. Use ReAct agent to decide operations
    const operations = await this.memoryAgent.decide(userId, conversationText, existingMemories);

    // 3. Execute operations
    const updatedMemories = await this.executeOperations(userId, operations);

    logger.info('Conversation processed', {
      userId,
      operationsCount: operations.length,
      updatedMemoriesCount: updatedMemories.length
    });

    return { operations, updatedMemories };
  }

  /**
   * Search memories semantically
   */
  async searchMemories(
    userId: string,
    query: string,
    limit: number = 5,
    category?: Memory['category']
  ): Promise<Memory[]> {
    const queryEmbedding = await this.embeddingGenerator.generate(query);
    const memories = await this.vectorDB.search(userId, queryEmbedding, limit * 2, 0.6);

    // Filter by category if specified
    const filtered = category 
      ? memories.filter(m => m.category === category)
      : memories;

    return filtered.slice(0, limit);
  }

  /**
   * Get all memories for a user
   */
  async getAllMemories(userId: string): Promise<Memory[]> {
    return await this.vectorDB.getAllForUser(userId);
  }

  /**
   * Delete specific memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    await this.vectorDB.delete([memoryId]);
    logger.info('Memory deleted', { memoryId });
  }

  /**
   * Execute memory operations from ReAct agent
   */
  private async executeOperations(
    userId: string,
    operations: MemoryOperation[]
  ): Promise<Memory[]> {
    const updatedMemories: Memory[] = [];

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'ADD':
            if (op.content) {
              const memory = await this.addMemory(userId, op.content, op.category || 'other');
              updatedMemories.push(memory);
            }
            break;

          case 'UPDATE':
            if (op.memory_id && op.content) {
              const memory = await this.updateMemory(op.memory_id, op.content);
              if (memory) updatedMemories.push(memory);
            }
            break;

          case 'DELETE':
            if (op.memory_id) {
              await this.vectorDB.delete([op.memory_id]);
            }
            break;

          case 'MERGE':
            if (op.merge_ids && op.merge_ids.length > 1) {
              const merged = await this.mergeMemories(userId, op.merge_ids, op.content);
              if (merged) updatedMemories.push(merged);
            }
            break;

          case 'NOOP':
            // No operation
            break;
        }
      } catch (error: any) {
        logger.error('Failed to execute operation', { operation: op, error });
      }
    }

    return updatedMemories;
  }

  private async addMemory(
    userId: string,
    content: string,
    category: Memory['category']
  ): Promise<Memory> {
    const embedding = await this.embeddingGenerator.generate(content);
    
    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      content,
      category,
      embedding,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence: 0.8,
        importance: 0.5
      },
      tags: []
    };

    await this.vectorDB.upsert([memory]);
    logger.info('Memory added', { memoryId: memory.id, category });
    
    return memory;
  }

  private async updateMemory(memoryId: string, newContent: string): Promise<Memory | null> {
    const existing = await this.vectorDB.getById(memoryId);
    if (!existing) return null;

    const embedding = await this.embeddingGenerator.generate(newContent);
    
    const updated: Memory = {
      ...existing,
      content: newContent,
      embedding,
      metadata: {
        ...existing.metadata,
        updated_at: new Date().toISOString()
      }
    };

    await this.vectorDB.upsert([updated]);
    logger.info('Memory updated', { memoryId });
    
    return updated;
  }

  private async mergeMemories(
    userId: string,
    memoryIds: string[],
    mergedContent?: string
  ): Promise<Memory | null> {
    const memories = await Promise.all(
      memoryIds.map(id => this.vectorDB.getById(id))
    );
    
    const validMemories = memories.filter((m): m is Memory => m !== null);
    if (validMemories.length === 0) return null;

    // Merge content
    const content = mergedContent || validMemories.map(m => m.content).join(' | ');
    const embedding = await this.embeddingGenerator.generate(content);

    const merged: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      content,
      category: validMemories[0].category,
      embedding,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence: Math.max(...validMemories.map(m => m.metadata.confidence || 0)),
        importance: Math.max(...validMemories.map(m => m.metadata.importance || 0))
      },
      tags: Array.from(new Set(validMemories.flatMap(m => m.tags || [])))
    };

    // Delete old memories and add merged one
    await this.vectorDB.delete(memoryIds);
    await this.vectorDB.upsert([merged]);
    
    logger.info('Memories merged', { count: memoryIds.length, newId: merged.id });
    
    return merged;
  }
}

// Export singleton instance
export const conversationalMemory = new ConversationalMemorySystem();

