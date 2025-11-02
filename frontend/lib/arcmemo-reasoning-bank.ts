/**
 * ArcMemo Enhanced with ReasoningBank Concepts
 * 
 * Based on: "ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory"
 * Paper: Learns from both successes AND failures, structured memory, test-time scaling
 * 
 * Key Enhancements:
 * 1. Structured Memory Schema (Title + Description + Content)
 * 2. Learning from Failures (not just successes)
 * 3. Memory-Aware Test-Time Scaling (MaTTS)
 * 4. Self-Contrast (parallel scaling)
 * 5. Self-Refinement (sequential scaling)
 * 6. Emergent Strategy Tracking
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// STRUCTURED MEMORY SCHEMA (ReasoningBank)
// ============================================================================

export interface ReasoningMemoryItem {
  // ReasoningBank schema: Title + Description + Content
  id: string;
  title: string;  // Concise identifier summarizing core strategy
  description: string;  // One-sentence summary
  content: string;  // Distilled reasoning steps, decision rationales
  
  // Metadata
  domain: string;  // e.g., "financial", "legal", "ocr"
  success: boolean;  // True for successful experiences, false for failures
  createdFrom: "success" | "failure";  // Track source
  abstractionLevel: "procedural" | "adaptive" | "compositional";  // Emergent evolution
  
  // IRT parameters (for scientific evaluation)
  difficulty?: number;  // IRT difficulty (b parameter)
  discrimination?: number;  // IRT discrimination (a parameter)
  
  // Tracking
  usageCount: number;  // How often retrieved and used
  successRate: number;  // Success rate when this memory is used
  lastUsed: Date;
  createdAt: Date;
  
  // Relationships
  derivedFrom?: string[];  // IDs of parent memory items
  evolvedInto?: string[];  // IDs of child memory items (emergent)
  
  // Vector embedding for retrieval
  embedding?: number[];
}

// ============================================================================
// EXPERIENCE/TRAJECTORY (for memory extraction)
// ============================================================================

export interface Experience {
  taskId: string;
  query: string;
  domain: string;
  
  // Trajectory
  steps: Array<{
    thought: string;
    action: string;
    observation: string;
    timestamp: Date;
  }>;
  
  // Outcome
  success: boolean;
  finalResult: any;
  
  // IRT evaluation
  irtAbility?: number;
  irtConfidence?: number;
  
  // Self-judgment (LLM-as-judge)
  selfJudgment?: {
    success: boolean;
    reasoning: string;
    confidence: number;
  };
}

// Export Experience type for use in other modules
export type { Experience as ReasoningBankExperience };

// ============================================================================
// ARCMEMO REASONING BANK CLASS
// ============================================================================

export class ArcMemoReasoningBank {
  private memoryBank: Map<string, ReasoningMemoryItem> = new Map();
  private anthropic: Anthropic;
  private supabase: any = null;
  
  constructor(anthropicApiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
    });
    
    // Initialize Supabase client if available
    this.initSupabase();
  }
  
  private async initSupabase(): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ ReasoningBank: Supabase client initialized');
      }
    } catch (error) {
      console.warn('⚠️ ReasoningBank: Supabase not available, using in-memory storage');
    }
  }
  
  // =========================================================================
  // 1. MEMORY RETRIEVAL (ReasoningBank Step 1)
  // =========================================================================
  
  async retrieveRelevantMemories(
    query: string,
    domain: string,
    topK: number = 5
  ): Promise<ReasoningMemoryItem[]> {
    /**
     * Retrieve top-K relevant memory items using embedding similarity
     * 
     * Uses Supabase pgvector for similarity search if available
     * Falls back to in-memory search
     * 
     * Returns memories with their database IDs for tracking usage
     */
    
    // Try Supabase vector search first
    if (this.supabase) {
      try {
        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Use Supabase function for similarity search
        const { data, error } = await this.supabase.rpc('find_similar_memories', {
          query_embedding: queryEmbedding,
          target_domain: domain,
          similarity_threshold: 0.7,
          max_results: topK
        });
        
        if (!error && data && data.length > 0) {
          // Convert Supabase results to ReasoningMemoryItem
          // Also load current usage stats from database
          const memoryIds = data.map((r: any) => r.id);
          const { data: memoryStats } = await this.supabase
            .from('reasoning_memory_items')
            .select('id, usage_count, success_rate, last_used')
            .in('id', memoryIds);
          
          interface MemoryStats {
            usage_count: number;
            success_rate: number;
            last_used: string | null;
          }
          
          const statsMap = new Map<string, MemoryStats>(
            (memoryStats || []).map((s: any) => [s.id.toString(), {
              usage_count: s.usage_count || 0,
              success_rate: s.success_rate || 0,
              last_used: s.last_used
            }])
          );
          
          const defaultStats: MemoryStats = {
            usage_count: 0,
            success_rate: 0,
            last_used: null
          };
          
          const memories = data.map((record: any): ReasoningMemoryItem => {
            const stats: MemoryStats = statsMap.get(record.id.toString()) || defaultStats;
            return {
              id: record.id.toString(),
              title: record.title,
              description: record.description,
              content: record.content,
              domain: record.domain,
              success: record.created_from === 'success',
              createdFrom: record.created_from,
              abstractionLevel: record.abstraction_level,
              usageCount: stats.usage_count,
              successRate: stats.success_rate,
              lastUsed: stats.last_used ? new Date(stats.last_used) : new Date(),
              createdAt: new Date(),
              derivedFrom: [],
              evolvedInto: [],
              embedding: undefined // Don't store full embedding in memory
            };
          });
          
          console.log(`✅ Retrieved ${memories.length} memories from Supabase (vector search)`);
          return memories;
        }
      } catch (error) {
        console.warn('⚠️ Supabase vector search failed, falling back to in-memory:', error);
      }
    }
    
    // Fallback: In-memory search
    const domainMemories = Array.from(this.memoryBank.values())
      .filter(m => m.domain === domain || m.domain === "general")
      .sort((a, b) => {
        // Score by: success rate * usage count * recency
        const scoreA = a.successRate * Math.log(a.usageCount + 1) / 
          (Date.now() - a.lastUsed.getTime());
        const scoreB = b.successRate * Math.log(b.usageCount + 1) / 
          (Date.now() - b.lastUsed.getTime());
        return scoreB - scoreA;
      });
    
    return domainMemories.slice(0, topK);
  }
  
  /**
   * Update memory success rate empirically after task completion
   * This is the key method for empirical quality scoring
   */
  async updateMemorySuccessRate(
    memoryId: string,
    taskSucceeded: boolean
  ): Promise<void> {
    /**
     * Empirically update memory success rate based on actual usage
     * 
     * Uses Supabase function update_memory_usage() for atomic update
     * Calculates moving average: (current_rate * count + success) / (count + 1)
     */
    
    if (!this.supabase) {
      // Fallback: Update in-memory
      const memory = this.memoryBank.get(memoryId);
      if (memory) {
        const total = memory.usageCount + 1;
        memory.successRate = (
          (memory.successRate * memory.usageCount) + 
          (taskSucceeded ? 1.0 : 0.0)
        ) / total;
        memory.usageCount = total;
        memory.lastUsed = new Date();
      }
      return;
    }
    
    try {
      // Use Supabase function for atomic update
      const { error } = await this.supabase.rpc('update_memory_usage', {
        memory_id: parseInt(memoryId),
        was_successful: taskSucceeded
      });
      
      if (error) {
        console.error(`❌ Failed to update memory ${memoryId} success rate:`, error);
        
        // Fallback: Manual update
        const memory = this.memoryBank.get(memoryId);
        if (memory) {
          const total = memory.usageCount + 1;
          memory.successRate = (
            (memory.successRate * memory.usageCount) + 
            (taskSucceeded ? 1.0 : 0.0)
          ) / total;
          memory.usageCount = total;
          memory.lastUsed = new Date();
        }
      } else {
        console.log(`✅ Updated memory ${memoryId}: ${taskSucceeded ? 'success' : 'failure'} (empirical tracking)`);
      }
    } catch (error) {
      console.error(`❌ Error updating memory success rate:`, error);
    }
  }
  
  /**
   * Track memory usage across multiple memories (batch update)
   */
  async updateMemoryUsageBatch(
    memoryIds: string[],
    taskSucceeded: boolean
  ): Promise<void> {
    /**
     * Update success rates for all memories used in a task
     * 
     * Called after task completion to empirically track effectiveness
     */
    
    if (memoryIds.length === 0) return;
    
    console.log(`📊 Updating empirical success rates for ${memoryIds.length} memories (task ${taskSucceeded ? 'succeeded' : 'failed'})`);
    
    // Update all memories in parallel
    await Promise.all(
      memoryIds.map(id => this.updateMemorySuccessRate(id, taskSucceeded))
    );
  }
  
  // =========================================================================
  // 2. MEMORY EXTRACTION (ReasoningBank Step 2)
  // =========================================================================
  
  async extractMemoryFromExperience(
    experience: Experience
  ): Promise<ReasoningMemoryItem[]> {
    /**
     * Extract structured memory items from experience
     * LEARNS FROM BOTH SUCCESSES AND FAILURES!
     * 
     * Uses exact prompts from ReasoningBank paper (Appendix A.1)
     */
    
    console.log(`🧠 ReasoningBank: Extracting memories from ${experience.success ? 'SUCCESS' : 'FAILURE'} experience`);
    
    // First, save experience to Supabase
    await this.saveExperienceToSupabase(experience);
    
    // Self-judge the experience if not already done
    if (!experience.selfJudgment) {
      experience.selfJudgment = await this.selfJudgeExperience(experience);
      // Update experience.success based on self-judgment
      experience.success = experience.selfJudgment.success;
    }
    
    const extractionPrompt = this.buildExtractionPrompt(experience, '');
    
    // Call LLM for extraction (temperature 1.0 as per paper)
    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          messages: [
            {
              role: "system",
              content: experience.success 
                ? "You are an expert in web navigation. Extract insights from successful trajectories."
                : "You are an expert in web navigation. Extract lessons from failed trajectories."
            },
            {
              role: "user",
              content: extractionPrompt
            }
          ],
          temperature: 1.0, // As per paper Appendix A.2
          max_tokens: 1500
        })
      });
      
      const data = await response.json();
      const extractedItems = this.parseExtractedMemories(
        data.choices[0].message.content,
        experience
      );
      
      console.log(`✅ Extracted ${extractedItems.length} memory items from experience`);
      
      // Update experience record to mark memories as extracted
      if (this.supabase) {
        const memoryIds = extractedItems.map(m => m.id);
        await this.supabase
          .from('reasoning_experiences')
          .update({ 
            memories_extracted: true,
            memory_item_ids: memoryIds
          })
          .eq('task_id', experience.taskId);
      }
      
      return extractedItems;
    } catch (error) {
      console.error('❌ Memory extraction failed:', error);
      return [];
    }
  }
  
  private buildExtractionPrompt(
    experience: Experience,
    strategy: string
  ): string {
    // Exact prompts from ReasoningBank paper Appendix A.1 (Figure 8)
    
    const trajectory = experience.steps.map((s, i) => 
      `<think> ${s.thought} </think>\n<action> ${s.action} </action>`
    ).join('\n');
    
    if (experience.success) {
      // SUCCESS extraction prompt (left panel, Figure 8)
      return `You are an expert in web navigation. You will be given a user query, the corresponding trajectory that represents how an agent successfully accomplished the task.

## Guidelines

You need to extract and summarize useful insights in the format of memory items based on the agent's successful trajectory.

The goal of summarized memory items is to be helpful and generalizable for future similar tasks.

## Important notes

- You must first think why the trajectory is successful, and then summarize the insights.
- You can extract at most 3 memory items from the trajectory.
- You must not repeat similar or overlapping items.
- Do not mention specific websites, queries, or string contents, but rather focus on the generalizable insights.

## Output Format

Your output must strictly follow the Markdown format shown below:

\`\`\`
# Memory Item i

## Title <the title of the memory item>

## Description <one sentence summary of the memory item>

## Content <1-3 sentences describing the insights learned to successfully accomplishing the task>
\`\`\`

Query: ${experience.query}

Trajectory: ${trajectory}`;
    } else {
      // FAILURE extraction prompt (right panel, Figure 8)
      return `You are an expert in web navigation. You will be given a user query, the corresponding trajectory that represents how an agent attempted to resolve the task but failed.

## Guidelines

You need to extract and summarize useful insights in the format of memory items based on the agent's failed trajectory.

The goal of summarized memory items is to be helpful and generalizable for future similar tasks.

## Important notes

- You must first reflect and think why the trajectory failed, and then summarize what lessons you have learned or strategies to prevent the failure in the future.
- You can extract at most 3 memory items from the trajectory.
- You must not repeat similar or overlapping items.
- Do not mention specific websites, queries, or string contents, but rather focus on the generalizable insights.

## Output Format

Your output must strictly follow the Markdown format shown below:

\`\`\`
# Memory Item i

## Title <the title of the memory item>

## Description <one sentence summary of the memory item>

## Content <1-3 sentences describing the insights learned to successfully accomplishing the task>
\`\`\`

Query: ${experience.query}

Trajectory: ${trajectory}`;
    }
  }
  
  private parseExtractedMemories(
    response: string,
    experience: Experience
  ): ReasoningMemoryItem[] {
    // Parse Markdown format from paper (Figure 8)
    const memories: ReasoningMemoryItem[] = [];
    
    try {
      // Split by "# Memory Item" markers
      const itemMatches = response.split(/# Memory Item \d+/i);
      
      for (let i = 1; i < itemMatches.length; i++) {
        const itemText = itemMatches[i];
        
        // Extract title
        const titleMatch = itemText.match(/## Title\s+(.+?)(?=\n##|$)/s);
        const title = titleMatch ? titleMatch[1].trim() : `Memory Item ${i}`;
        
        // Extract description
        const descMatch = itemText.match(/## Description\s+(.+?)(?=\n##|$)/s);
        const description = descMatch ? descMatch[1].trim() : "";
        
        // Extract content
        const contentMatch = itemText.match(/## Content\s+(.+?)(?=\n##|$)/s);
        const content = contentMatch ? contentMatch[1].trim() : "";
        
        if (title && description && content) {
          // Infer abstraction level from content
          let abstractionLevel: "procedural" | "adaptive" | "compositional" = "procedural";
          const contentLower = content.toLowerCase();
          
          if (contentLower.includes("cross-reference") || 
              contentLower.includes("systematically") ||
              contentLower.includes("composition")) {
            abstractionLevel = "compositional";
          } else if (contentLower.includes("reassess") ||
                     contentLower.includes("adapt") ||
                     contentLower.includes("alternative")) {
            abstractionLevel = "adaptive";
          }
          
          memories.push({
            id: `${experience.taskId}_${i}_${Date.now()}`,
            title,
            description,
            content,
            domain: experience.domain,
            success: experience.success,
            createdFrom: experience.success ? "success" : "failure",
            abstractionLevel,
            usageCount: 0,
            successRate: experience.success ? 1.0 : 0.0,
            lastUsed: new Date(),
            createdAt: new Date(),
            derivedFrom: [],
            evolvedInto: []
          });
        }
      }
      
      console.log(`✅ Parsed ${memories.length} memory items from extraction response`);
      return memories;
    } catch (error) {
      console.error("Error parsing extracted memories:", error);
      return [];
    }
  }
  
  private async selfJudgeExperience(
    experience: Experience
  ): Promise<{ success: boolean; reasoning: string; confidence: number }> {
    /**
     * LLM-as-judge: Exact prompt from ReasoningBank paper (Figure 9)
     */
    
    const trajectory = experience.steps.map((s, i) => 
      `Step ${i + 1}: ${s.thought}\nAction: ${s.action}\nObservation: ${s.observation}`
    ).join('\n\n');
    
    // Exact prompt from paper Figure 9
    const prompt = `You are an expert in evaluating the performance of a web navigation agent. The agent is designed to help a human user navigate a website to complete a task. Given the user's intent, the agent's action history, the final state of the webpage, and the agent's response to the user, your goal is to decide whether the agent's execution is successful or not.

There are three types of tasks:

1. Information seeking: The user wants to obtain certain information from the webpage, such as the information of a product, reviews, map info, comparison of map routes, etc. The bot's response must contain the information the user wants, or explicitly state that the information is not available. Otherwise, e.g. the bot encounters an exception and respond with the error content, the task is considered a failure. Besides, be careful about the sufficiency of the agent's actions. For example, when asked to list the top-searched items in a shop, the agent should order the items by the number of searches, and then return the top items. If the ordering action is missing, the task is likely to fail.

2. Site navigation: The user wants to navigate to a specific page. Carefully examine the bot's action history and the final state of the webpage to determine whether the bot successfully completes the task. No need to consider the bot's response.

3. Content modification: The user wants to modify the content of a webpage or configuration. Carefully examine the bot's action history and the final state of the webpage to determine whether the bot successfully completes the task. No need to consider the bot's response.

*IMPORTANT*

Format your response into two lines as shown below:

Thoughts: <your thoughts and reasoning process>

Status: "success" or "failure"

User Intent: ${experience.query}

Trajectory: ${trajectory}

The detailed final state of the webpage: \`\`\`md ${JSON.stringify(experience.finalResult)} \`\`\`

Bot response to the user: ${JSON.stringify(experience.finalResult)}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          messages: [
            { role: "system", content: "You are an expert evaluator of web navigation agent performance." },
            { role: "user", content: prompt }
          ],
          temperature: 0.0, // Deterministic as per paper
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse response
      const statusMatch = content.match(/Status:\s*["']?(success|failure)["']?/i);
      const thoughtsMatch = content.match(/Thoughts:\s*(.+?)(?=Status:|$)/s);
      
      const success = statusMatch ? statusMatch[1].toLowerCase() === "success" : experience.success;
      const reasoning = thoughtsMatch ? thoughtsMatch[1].trim() : "Self-judgment completed";
      
      return {
        success,
        reasoning,
        confidence: success ? 0.8 : 0.7
      };
    } catch (error) {
      console.warn("Self-judgment failed, using experience.success:", error);
      return {
        success: experience.success,
        reasoning: "Self-judgment unavailable",
        confidence: 0.5
      };
    }
  }
  
  // =========================================================================
  // 3. MEMORY CONSOLIDATION (ReasoningBank Step 3)
  // =========================================================================
  
  async consolidateMemories(newMemories: ReasoningMemoryItem[]): Promise<void> {
    /**
     * Consolidate new memories into ReasoningBank
     * 
     * Strategies:
     * 1. Simple addition (current)
     * 2. Deduplication (check for similar existing)
     * 3. Merging (combine similar strategies)
     * 4. Evolution tracking (detect emergent patterns)
     * 5. Persist to Supabase (new)
     */
    
    for (const memory of newMemories) {
      // Check for similar existing memories
      const similar = await this.findSimilarMemories(memory);
      
      if (similar.length > 0) {
        // Merge or evolve
        await this.mergeOrEvolveMemory(memory, similar);
      } else {
        // Add new
        this.memoryBank.set(memory.id, memory);
        
        // Persist to Supabase
        await this.persistMemoryToSupabase(memory);
      }
    }
  }
  
  /**
   * Persist structured memory item to Supabase
   */
  private async persistMemoryToSupabase(memory: ReasoningMemoryItem): Promise<void> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, memory only stored in-memory');
      return;
    }
    
    try {
      // Generate embedding if not present
      let embedding = memory.embedding;
      if (!embedding) {
        embedding = await this.generateEmbedding(memory.title + ' ' + memory.description);
      }
      
      const { data, error } = await this.supabase
        .from('reasoning_memory_items')
        .insert({
          title: memory.title,
          description: memory.description,
          content: memory.content,
          domain: memory.domain,
          created_from: memory.createdFrom,
          abstraction_level: memory.abstractionLevel,
          usage_count: memory.usageCount,
          success_rate: memory.successRate,
          last_used: memory.lastUsed?.toISOString(),
          derived_from: memory.derivedFrom || [],
          evolved_into: memory.evolvedInto || [],
          embedding: embedding,
          created_at: memory.createdAt.toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to persist memory to Supabase:', error);
      } else {
        console.log(`✅ Persisted memory item to Supabase: ${memory.title}`);
        // Update local memory with database ID
        memory.id = data.id.toString();
      }
    } catch (error) {
      console.error('❌ Error persisting memory:', error);
    }
  }
  
  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI embeddings (1536 dimensions)
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data[0].embedding;
        }
      }
    } catch (error) {
      console.warn('⚠️ Embedding generation failed, using zero vector:', error);
    }
    
    // Fallback: zero vector (will need to be updated later)
    return new Array(1536).fill(0);
  }
  
  /**
   * Load memories from Supabase
   */
  async loadMemoriesFromSupabase(domain?: string, limit: number = 50): Promise<void> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, cannot load memories');
      return;
    }
    
    try {
      let query = this.supabase
        .from('reasoning_memory_items')
        .select('*')
        .order('success_rate', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(limit);
      
      if (domain) {
        query = query.eq('domain', domain).or(`domain.eq.general`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Failed to load memories from Supabase:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Convert Supabase records to ReasoningMemoryItem format
        for (const record of data) {
          const memory: ReasoningMemoryItem = {
            id: record.id.toString(),
            title: record.title,
            description: record.description,
            content: record.content,
            domain: record.domain,
            success: record.created_from === 'success',
            createdFrom: record.created_from,
            abstractionLevel: record.abstraction_level,
            usageCount: record.usage_count || 0,
            successRate: record.success_rate || 0,
            lastUsed: record.last_used ? new Date(record.last_used) : new Date(),
            createdAt: new Date(record.created_at),
            derivedFrom: record.derived_from || [],
            evolvedInto: record.evolved_into || [],
            embedding: record.embedding
          };
          
          this.memoryBank.set(memory.id, memory);
        }
        
        console.log(`✅ Loaded ${data.length} memories from Supabase`);
      }
    } catch (error) {
      console.error('❌ Error loading memories from Supabase:', error);
    }
  }
  
  /**
   * Save experience trajectory to Supabase
   */
  async saveExperienceToSupabase(experience: Experience): Promise<string | null> {
    if (!this.supabase) {
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('reasoning_experiences')
        .insert({
          task_id: experience.taskId,
          query: experience.query,
          domain: experience.domain,
          trajectory: experience.steps,
          success: experience.success,
          final_result: experience.finalResult,
          self_judgment: experience.selfJudgment,
          irt_ability: experience.irtAbility,
          irt_confidence: experience.irtConfidence,
          memories_extracted: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to save experience:', error);
        return null;
      }
      
      console.log(`✅ Saved experience to Supabase: ${experience.taskId}`);
      return data.id.toString();
    } catch (error) {
      console.error('❌ Error saving experience:', error);
      return null;
    }
  }
  
  private async findSimilarMemories(
    memory: ReasoningMemoryItem
  ): Promise<ReasoningMemoryItem[]> {
    // Simple similarity: same domain + similar title
    return Array.from(this.memoryBank.values()).filter(m => 
      m.domain === memory.domain &&
      this.titleSimilarity(m.title, memory.title) > 0.7
    );
  }
  
  private titleSimilarity(a: string, b: string): number {
    // Simple word overlap
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }
  
  private async mergeOrEvolveMemory(
    newMemory: ReasoningMemoryItem,
    similarMemories: ReasoningMemoryItem[]
  ): Promise<void> {
    /**
     * Merge similar memories or track evolution
     * 
     * Evolution detection (ReasoningBank emergent behaviors):
     * procedural → adaptive → compositional
     */
    
    const existing = similarMemories[0];
    
    // Check if new memory is more advanced (emergent evolution)
    const newLevel = this.abstractionLevelScore(newMemory.abstractionLevel);
    const existingLevel = this.abstractionLevelScore(existing.abstractionLevel);
    
    if (newLevel > existingLevel) {
      // Evolution detected!
      newMemory.derivedFrom = [existing.id];
      existing.evolvedInto = [...(existing.evolvedInto || []), newMemory.id];
      this.memoryBank.set(newMemory.id, newMemory);
      console.log(`🔄 Memory evolved: ${existing.title} → ${newMemory.title}`);
    } else {
      // Merge: update existing with new insights
      existing.content += `\n\n## Additional Insight:\n${newMemory.content}`;
      existing.usageCount += newMemory.usageCount;
      existing.successRate = (existing.successRate + newMemory.successRate) / 2;
    }
  }
  
  private abstractionLevelScore(level: string): number {
    const scores: Record<string, number> = {
      procedural: 1,
      adaptive: 2,
      compositional: 3
    };
    return scores[level] || 1;
  }
  
  // =========================================================================
  // 4. MEMORY-AWARE TEST-TIME SCALING (MaTTS)
  // =========================================================================
  
  async mattsParallelScaling(
    query: string,
    domain: string,
    k: number = 3
  ): Promise<{ bestResult: any; allExperiences: Experience[]; newMemories: ReasoningMemoryItem[] }> {
    /**
     * MaTTS Parallel Scaling
     * 
     * Generate K trajectories in parallel, then:
     * 1. Self-contrast across all trajectories
     * 2. Extract memories using contrastive signals
     * 3. Return best result + enriched memories
     */
    
    console.log(`🔄 MaTTS Parallel Scaling (k=${k})...`);
    
    // Retrieve relevant memories
    const memories = await this.retrieveRelevantMemories(query, domain);
    const memoryContext = this.formatMemoriesForAgent(memories);
    
    // Generate K trajectories in parallel
    const trajectories = await Promise.all(
      Array.from({ length: k }, (_, i) => 
        this.executeTaskWithMemory(query, domain, memoryContext, i)
      )
    );
    
    // Self-contrast: Compare trajectories to find consistent patterns
    const contrastiveSignals = await this.selfContrast(trajectories, query);
    
    // Extract memories using contrastive insights
    const newMemories = await this.extractMemoriesWithContrast(
      trajectories,
      contrastiveSignals
    );
    
    // Consolidate
    await this.consolidateMemories(newMemories);
    
    // Return best result (Best-of-N)
    const bestTrajectory = trajectories.reduce((best, curr) => 
      (curr.selfJudgment?.confidence || 0) > (best.selfJudgment?.confidence || 0) ? curr : best
    );
    
    return {
      bestResult: bestTrajectory.finalResult,
      allExperiences: trajectories,
      newMemories
    };
  }
  
  async mattsSequentialScaling(
    query: string,
    domain: string,
    k: number = 3
  ): Promise<{ finalResult: any; allExperiences: Experience[]; newMemories: ReasoningMemoryItem[] }> {
    /**
     * MaTTS Sequential Scaling
     * 
     * Generate trajectory, then refine K times:
     * 1. Execute initial trajectory
     * 2. Self-refine based on intermediate notes
     * 3. Extract memories from refinement process
     * 4. Return final refined result + memories
     */
    
    console.log(`🔄 MaTTS Sequential Scaling (k=${k})...`);
    
    const memories = await this.retrieveRelevantMemories(query, domain);
    const memoryContext = this.formatMemoriesForAgent(memories);
    
    // Initial execution
    let currentExperience = await this.executeTaskWithMemory(query, domain, memoryContext, 0);
    const allExperiences = [currentExperience];
    
    // K refinement iterations
    for (let i = 1; i < k; i++) {
      const refinedExperience = await this.selfRefine(currentExperience, memoryContext);
      allExperiences.push(refinedExperience);
      currentExperience = refinedExperience;
    }
    
    // Extract memories from refinement trajectory
    const newMemories = await this.extractMemoriesFromRefinement(allExperiences);
    
    // Consolidate
    await this.consolidateMemories(newMemories);
    
    return {
      finalResult: currentExperience.finalResult,
      allExperiences,
      newMemories
    };
  }
  
  private async selfContrast(
    trajectories: Experience[],
    query: string
  ): Promise<string> {
    /**
     * Self-contrast: Compare multiple trajectories to find patterns
     * Similar to ReasoningBank's parallel scaling aggregation
     */
    
    const prompt = `Compare these ${trajectories.length} attempts at the same task and identify:
1. Consistent patterns across successful attempts
2. Common mistakes in failed attempts
3. Key decision points that led to different outcomes

Task: ${query}

${trajectories.map((t, i) => `
Attempt ${i + 1} (${t.success ? "SUCCESS" : "FAILURE"}):
${t.steps.slice(0, 3).map(s => `- ${s.thought}`).join("\n")}
Result: ${JSON.stringify(t.finalResult).substring(0, 200)}
`).join("\n\n")}

Provide contrastive insights for memory extraction.`;

    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        messages: [
          { role: "system", content: "You are an expert at comparing and contrasting agent strategies." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  private async extractMemoriesWithContrast(
    trajectories: Experience[],
    contrastiveSignals: string
  ): Promise<ReasoningMemoryItem[]> {
    // Extract memories enriched with contrastive insights
    const allMemories: ReasoningMemoryItem[] = [];
    
    for (const trajectory of trajectories) {
      const memories = await this.extractMemoryFromExperience(trajectory);
      // Enrich with contrastive context
      memories.forEach(m => {
        m.content += `\n\n## Contrastive Insight:\n${contrastiveSignals.substring(0, 500)}`;
      });
      allMemories.push(...memories);
    }
    
    return allMemories;
  }
  
  private async selfRefine(
    experience: Experience,
    memoryContext: string
  ): Promise<Experience> {
    /**
     * Self-refine: Improve trajectory based on self-criticism
     * Similar to ReasoningBank's sequential scaling
     */
    
    // This would call the agent again with refinement instructions
    // For now, return a mock refined experience
    return {
      ...experience,
      taskId: experience.taskId + "_refined",
      steps: [...experience.steps]  // Would have refined steps
    };
  }
  
  private async extractMemoriesFromRefinement(
    experiences: Experience[]
  ): Promise<ReasoningMemoryItem[]> {
    // Extract from refinement trajectory
    const allMemories: ReasoningMemoryItem[] = [];
    
    for (const exp of experiences) {
      const memories = await this.extractMemoryFromExperience(exp);
      allMemories.push(...memories);
    }
    
    return allMemories;
  }
  
  // =========================================================================
  // HELPER METHODS
  // =========================================================================
  
  private formatMemoriesForAgent(memories: ReasoningMemoryItem[]): string {
    if (memories.length === 0) return "";
    
    return `## Relevant Past Experiences:\n\n${memories.map(m => `
### ${m.title}
**Type**: ${m.createdFrom === "success" ? "✅ Successful Strategy" : "⚠️ Lesson from Failure"}
**Description**: ${m.description}
**Strategy**:
${m.content}
`).join("\n")}`;
  }
  
  private async executeTaskWithMemory(
    query: string,
    domain: string,
    memoryContext: string,
    attemptNumber: number
  ): Promise<Experience> {
    // This would actually execute the task with the agent
    // For now, return a mock experience
    return {
      taskId: `task_${Date.now()}_${attemptNumber}`,
      query,
      domain,
      steps: [
        {
          thought: "Analyzing task...",
          action: "analyze",
          observation: "Task understood",
          timestamp: new Date()
        }
      ],
      success: Math.random() > 0.3,
      finalResult: { completed: true },
      selfJudgment: {
        success: Math.random() > 0.3,
        reasoning: "Task appears complete",
        confidence: 0.8
      }
    };
  }
  
  // =========================================================================
  // PUBLIC API
  // =========================================================================
  
  getMemoryBank(): ReasoningMemoryItem[] {
    return Array.from(this.memoryBank.values());
  }
  
  getMemoryStats(): any {
    const memories = this.getMemoryBank();
    return {
      total: memories.length,
      byDomain: this.groupBy(memories, m => m.domain),
      bySource: this.groupBy(memories, m => m.createdFrom),
      byLevel: this.groupBy(memories, m => m.abstractionLevel),
      avgSuccessRate: memories.reduce((sum, m) => sum + m.successRate, 0) / memories.length
    };
  }
  
  private groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, number> {
    return arr.reduce((acc, item) => {
      const key = fn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  async trackEmergentEvolution(): Promise<Array<{
    from: string;
    to: string;
    evolutionType: string;
  }>> {
    /**
     * Track emergent strategy evolution
     * procedural → adaptive → compositional
     */
    
    const evolutions: Array<{ from: string; to: string; evolutionType: string }> = [];
    
    for (const memory of this.memoryBank.values()) {
      if (memory.derivedFrom && memory.derivedFrom.length > 0) {
        const parent = this.memoryBank.get(memory.derivedFrom[0]);
        if (parent) {
          evolutions.push({
            from: `${parent.title} (${parent.abstractionLevel})`,
            to: `${memory.title} (${memory.abstractionLevel})`,
            evolutionType: `${parent.abstractionLevel} → ${memory.abstractionLevel}`
          });
        }
      }
    }
    
    return evolutions;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ArcMemoReasoningBank;

