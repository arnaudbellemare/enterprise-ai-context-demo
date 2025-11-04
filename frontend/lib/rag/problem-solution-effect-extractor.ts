/**
 * Problem-Solution-Effect Extractor
 * 
 * Based on GAMP framework: "A Framework for Identifying New Idea Generation Paths
 * Integrating Graph Reasoning and Multi-Agent Collaboration"
 * 
 * Extracts structured Problem-Solution-Effect triplets from text chunks,
 * enabling graph-based reasoning and scientific discovery pathfinding.
 */

export interface ProblemSolutionEffect {
  problem: string;      // Core scientific question or challenge
  solution: string;      // Methods, technologies, compounds, tools, or theories
  effect: string;        // Results, discoveries, biological functions, or performance indicators
  confidence: number;    // 0-1: Extraction confidence
  source: string;        // Chunk/document ID
  metadata?: {
    domain?: string;
    entities?: string[];
    relations?: string[];
  };
}

export interface ExtractionConfig {
  model?: string;
  minConfidence?: number;
  enableEntityNormalization?: boolean;
}

export class ProblemSolutionEffectExtractor {
  private model: string;
  private minConfidence: number;
  
  constructor(
    model: string = 'gemma3:4b',
    minConfidence: number = 0.7
  ) {
    this.model = model;
    this.minConfidence = minConfidence;
  }
  
  /**
   * Extract Problem-Solution-Effect triplets from a chunk
   */
  async extractFromChunk(
    chunk: string,
    chunkId?: string,
    domain?: string
  ): Promise<ProblemSolutionEffect | null> {
    try {
      const prompt = this.buildExtractionPrompt(chunk, domain);
      
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are a scientific knowledge engineer. Extract Problem-Solution-Effect triplets from scientific text. Respond only with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 500,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const extracted = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize
      const triplet = this.validateAndNormalize(extracted, chunk, chunkId, domain);
      
      if (triplet.confidence < this.minConfidence) {
        console.warn(`Low confidence extraction (${triplet.confidence.toFixed(2)}), skipping`);
        return null;
      }
      
      return triplet;
    } catch (error) {
      console.warn(`Failed to extract Problem-Solution-Effect from chunk:`, error);
      return null;
    }
  }
  
  /**
   * Build extraction prompt based on GAMP framework
   */
  private buildExtractionPrompt(chunk: string, domain?: string): string {
    return `You are a scientific knowledge engineer. Please accurately identify the [research problem], [core method or substance used], and [most critical research finding or effect] from the following text.

${domain ? `Domain: ${domain}\n\n` : ''}Text:
${chunk}

Extract:
1. **Problem**: The core scientific question or challenge that the research attempts to solve (e.g., "How to identify the molecular receptors for noxious heat stimuli?")
2. **Solution**: The specific methods, technologies, compounds, tools, or theories used to solve the problem (e.g., "capsaicin," "gene knockout technology," "calcium imaging technology")
3. **Effect**: The results, discoveries, biological functions, or performance indicators produced after the solution is implemented (e.g., "activated the TRPV1 ion channel," "caused an increase in intracellular calcium ion concentration")

Ensure the extracted content comes directly from the text and avoid speculation.

Output format (JSON only):
{
  "problem": "exact problem statement from text",
  "solution": "exact solution/method from text",
  "effect": "exact effect/result from text",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of extraction"
}`;
  }
  
  /**
   * Validate and normalize extracted triplet
   */
  private validateAndNormalize(
    extracted: any,
    originalChunk: string,
    chunkId?: string,
    domain?: string
  ): ProblemSolutionEffect {
    // Validate required fields
    const problem = (extracted.problem || '').trim();
    const solution = (extracted.solution || '').trim();
    const effect = (extracted.effect || '').trim();
    
    // Calculate confidence based on extraction quality
    let confidence = extracted.confidence || 0.5;
    
    // Boost confidence if all fields present and non-empty
    if (problem && solution && effect) {
      confidence = Math.min(1.0, confidence + 0.2);
    } else {
      // Reduce confidence if fields missing
      const missingFields = [problem, solution, effect].filter(f => !f).length;
      confidence = Math.max(0.0, confidence - missingFields * 0.3);
    }
    
    // Check if extracted content appears in original chunk (faithfulness)
    const problemInText = problem.length > 0 && originalChunk.toLowerCase().includes(problem.toLowerCase().substring(0, 20));
    const solutionInText = solution.length > 0 && originalChunk.toLowerCase().includes(solution.toLowerCase().substring(0, 20));
    const effectInText = effect.length > 0 && originalChunk.toLowerCase().includes(effect.toLowerCase().substring(0, 20));
    
    if (problemInText && solutionInText && effectInText) {
      confidence = Math.min(1.0, confidence + 0.1);
    }
    
    // Extract entities (simple heuristic: capitalize words)
    const entities = this.extractEntities(problem, solution, effect);
    
    return {
      problem,
      solution,
      effect,
      confidence: Math.max(0.0, Math.min(1.0, confidence)),
      source: chunkId || `chunk_${Date.now()}`,
      metadata: {
        domain,
        entities,
        relations: this.inferRelations(problem, solution, effect),
      },
    };
  }
  
  /**
   * Extract entities from triplet (simple heuristic)
   */
  private extractEntities(problem: string, solution: string, effect: string): string[] {
    const text = `${problem} ${solution} ${effect}`;
    // Extract capitalized words/phrases (potential entities)
    const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    return [...new Set(matches || [])].slice(0, 10); // Limit to 10 unique entities
  }
  
  /**
   * Infer relations between Problem-Solution-Effect
   */
  private inferRelations(problem: string, solution: string, effect: string): string[] {
    const relations: string[] = [];
    
    // Problem-Solution relations
    relations.push('studied_via');
    
    // Solution-Effect relations
    if (effect.toLowerCase().includes('activate') || effect.toLowerCase().includes('enhance')) {
      relations.push('causes');
    } else if (effect.toLowerCase().includes('inhibit') || effect.toLowerCase().includes('reduce')) {
      relations.push('inhibits');
    } else {
      relations.push('produces');
    }
    
    return relations;
  }
  
  /**
   * Batch extract from multiple chunks
   */
  async batchExtract(
    chunks: Array<{ content: string; id?: string; domain?: string }>
  ): Promise<Array<{ chunkId: string; triplet: ProblemSolutionEffect | null }>> {
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const triplet = await this.extractFromChunk(
          chunk.content,
          chunk.id,
          chunk.domain
        );
        return {
          chunkId: chunk.id || `chunk_${Date.now()}`,
          triplet,
        };
      })
    );
    
    return results;
  }
  
  /**
   * Build knowledge graph structure from triplets
   */
  buildKnowledgeGraph(
    triplets: ProblemSolutionEffect[]
  ): {
    nodes: Array<{ id: string; type: 'problem' | 'solution' | 'effect'; label: string }>;
    edges: Array<{ from: string; to: string; relation: string; confidence: number }>;
  } {
    const nodes: Map<string, { id: string; type: 'problem' | 'solution' | 'effect'; label: string }> = new Map();
    const edges: Array<{ from: string; to: string; relation: string; confidence: number }> = [];
    
    triplets.forEach((triplet, index) => {
      const problemId = `problem_${index}`;
      const solutionId = `solution_${index}`;
      const effectId = `effect_${index}`;
      
      // Add nodes
      nodes.set(problemId, { id: problemId, type: 'problem', label: triplet.problem });
      nodes.set(solutionId, { id: solutionId, type: 'solution', label: triplet.solution });
      nodes.set(effectId, { id: effectId, type: 'effect', label: triplet.effect });
      
      // Add edges
      edges.push({
        from: problemId,
        to: solutionId,
        relation: 'studied_via',
        confidence: triplet.confidence,
      });
      
      edges.push({
        from: solutionId,
        to: effectId,
        relation: triplet.metadata?.relations?.[1] || 'produces',
        confidence: triplet.confidence,
      });
    });
    
    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }
}

// Singleton instance
export const problemSolutionEffectExtractor = new ProblemSolutionEffectExtractor();

