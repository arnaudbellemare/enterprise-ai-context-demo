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

// ============================================================================
// ARCMEMO REASONING BANK CLASS
// ============================================================================

export class ArcMemoReasoningBank {
  private memoryBank: Map<string, ReasoningMemoryItem> = new Map();
  private anthropic: Anthropic;
  
  constructor(anthropicApiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
    });
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
     * In production, use vector database (Supabase pgvector)
     * For now, simple filtering by domain + usage stats
     */
    
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
     * Uses Ollama/Claude to distill reasoning patterns
     */
    
    // First, self-judge the experience if not already done
    if (!experience.selfJudgment) {
      experience.selfJudgment = await this.selfJudgeExperience(experience);
    }
    
    const extractionStrategy = experience.success 
      ? "validated_strategies"  // From successes
      : "counterfactual_signals_and_pitfalls";  // From failures
    
    const extractionPrompt = this.buildExtractionPrompt(experience, extractionStrategy);
    
    // Call Ollama/Claude for extraction
    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        messages: [
          {
            role: "system",
            content: "You are an expert at distilling reasoning strategies from agent experiences."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    const extractedItems = this.parseExtractedMemories(
      data.choices[0].message.content,
      experience
    );
    
    return extractedItems;
  }
  
  private buildExtractionPrompt(
    experience: Experience,
    strategy: string
  ): string {
    const successOrFailure = experience.success ? "successful" : "failed";
    
    return `Analyze this ${successOrFailure} agent experience and extract REUSABLE reasoning strategies.

Task: ${experience.query}
Domain: ${experience.domain}
Outcome: ${experience.success ? "SUCCESS" : "FAILURE"}

Trajectory:
${experience.steps.map((s, i) => `
Step ${i + 1}:
  Thought: ${s.thought}
  Action: ${s.action}
  Observation: ${s.observation}
`).join("\n")}

${experience.success ? `
Extract VALIDATED STRATEGIES that led to success:
- What reasoning patterns worked well?
- What decision-making strategies were effective?
- What can be reused for similar tasks?
` : `
Extract LESSONS FROM FAILURE:
- What went wrong and why?
- What reasoning patterns should be avoided?
- What alternative strategies could work?
- What pitfalls to watch out for?
`}

For each extracted strategy, provide:
1. Title: Concise identifier (5-10 words)
2. Description: One-sentence summary
3. Content: Detailed reasoning steps and rationales (2-3 paragraphs)
4. Abstraction Level: procedural | adaptive | compositional

Return as JSON array of memory items.`;
  }
  
  private parseExtractedMemories(
    response: string,
    experience: Experience
  ): ReasoningMemoryItem[] {
    // Parse LLM response into structured memory items
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn("No JSON found in extraction response");
        return [];
      }
      
      const extracted = JSON.parse(jsonMatch[0]);
      
      return extracted.map((item: any, index: number) => ({
        id: `${experience.taskId}_${index}_${Date.now()}`,
        title: item.title || "Unnamed Strategy",
        description: item.description || "",
        content: item.content || "",
        domain: experience.domain,
        success: experience.success,
        createdFrom: experience.success ? "success" : "failure",
        abstractionLevel: item.abstractionLevel || "procedural",
        usageCount: 0,
        successRate: experience.success ? 1.0 : 0.0,
        lastUsed: new Date(),
        createdAt: new Date(),
        derivedFrom: [],
        evolvedInto: []
      }));
    } catch (error) {
      console.error("Error parsing extracted memories:", error);
      return [];
    }
  }
  
  private async selfJudgeExperience(
    experience: Experience
  ): Promise<{ success: boolean; reasoning: string; confidence: number }> {
    /**
     * LLM-as-judge: Self-evaluate experience without ground truth
     * Similar to ReasoningBank's self-judgment
     */
    
    const prompt = `Evaluate if this agent successfully completed the task.

Task: ${experience.query}
Final Result: ${JSON.stringify(experience.finalResult)}

Did the agent successfully complete the task? Provide:
1. Success: true/false
2. Reasoning: Why you think it succeeded or failed
3. Confidence: 0.0-1.0

Return as JSON: { "success": boolean, "reasoning": string, "confidence": number }`;

    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        messages: [
          { role: "system", content: "You are an expert evaluator of agent task completion." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    
    // Fallback
    return {
      success: experience.success,
      reasoning: "Unable to self-judge",
      confidence: 0.5
    };
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
      }
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
  
  async mattsPar​allelScaling(
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

