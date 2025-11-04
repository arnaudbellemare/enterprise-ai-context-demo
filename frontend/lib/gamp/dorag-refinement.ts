/**
 * DO-RAG Grounded Refinement Module
 * 
 * Implements DO-RAG's multi-stage refinement pipeline:
 * 1. Initial Generation: Answer based on retrieved evidence
 * 2. Refinement: Restructure and validate against KG
 * 3. Condensation: Align tone, language, and style
 * 4. Hallucination Detection: Cross-verify against knowledge graph
 * 
 * Based on: "DO-RAG: A Domain-Specific QA Framework Using 
 * Knowledge Graph-Enhanced Retrieval-Augmented Generation"
 */

import type { KnowledgeGraph, GraphNode } from './graph-path-explorer';

export interface RefinementResult {
  initialAnswer: string;
  refinedAnswer: string;
  condensedAnswer: string;
  verified: boolean;
  confidence: number;
  hallucinations: Array<{
    claim: string;
    reason: string;
    corrected: string;
  }>;
  citations: Array<{
    claim: string;
    source: string;
    nodeId?: string;
  }>;
}

export interface RefinementConfig {
  model?: string;
  enableHallucinationDetection?: boolean;
  enableCondensation?: boolean;
  maxIterations?: number;
}

/**
 * DO-RAG Refinement System
 * Multi-stage answer refinement with KG grounding
 */
export class DORAGRefinement {
  private model: string;
  private config: Required<RefinementConfig>;
  
  constructor(config: RefinementConfig = {}) {
    this.model = config.model || 'gemma3:4b';
    this.config = {
      model: this.model,
      enableHallucinationDetection: config.enableHallucinationDetection ?? true,
      enableCondensation: config.enableCondensation ?? true,
      maxIterations: config.maxIterations ?? 3,
    };
  }
  
  /**
   * Complete refinement pipeline
   */
  async refine(
    initialAnswer: string,
    query: string,
    knowledgeGraph: KnowledgeGraph,
    retrievedContext: string[]
  ): Promise<RefinementResult> {
    console.log('🔄 DO-RAG Refinement: Starting multi-stage refinement...');
    
    // Stage 1: Initial generation validation
    const validatedAnswer = await this.validateAgainstKG(
      initialAnswer,
      knowledgeGraph,
      retrievedContext
    );
    
    // Stage 2: Refinement (restructure and validate)
    const refinedAnswer = await this.refineAnswer(
      validatedAnswer,
      query,
      knowledgeGraph,
      retrievedContext
    );
    
    // Stage 3: Condensation (align tone and style)
    const condensedAnswer = this.config.enableCondensation
      ? await this.condenseAnswer(refinedAnswer, query)
      : refinedAnswer;
    
    // Stage 4: Hallucination detection
    const { verified, hallucinations, citations } = this.config.enableHallucinationDetection
      ? await this.detectHallucinations(
          condensedAnswer,
          knowledgeGraph,
          retrievedContext
        )
      : { verified: true, hallucinations: [], citations: [] };
    
    const confidence = this.calculateConfidence(
      verified,
      hallucinations.length,
      retrievedContext.length
    );
    
    console.log(`✅ Refinement complete: ${verified ? 'Verified' : 'Hallucinations detected'}, confidence: ${confidence.toFixed(2)}`);
    
    return {
      initialAnswer,
      refinedAnswer,
      condensedAnswer,
      verified,
      confidence,
      hallucinations,
      citations,
    };
  }
  
  /**
   * Stage 1: Validate initial answer against KG
   */
  private async validateAgainstKG(
    answer: string,
    knowledgeGraph: KnowledgeGraph,
    context: string[]
  ): Promise<string> {
    const graphSummary = knowledgeGraph.nodes
      .slice(0, 20)
      .map(n => n.label)
      .join(', ');
    
    const prompt = `You are validating an answer against a knowledge graph.

Answer to validate:
${answer}

Knowledge Graph entities (sample):
${graphSummary}

Retrieved context:
${context.slice(0, 3).join('\n\n')}

Validate that the answer is consistent with the knowledge graph and retrieved context.
If inconsistencies are found, mark them but keep the answer structure.

Respond with the validated answer (same structure, corrected if needed):`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a validation agent. Return the validated answer." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      return data.choices[0].message.content || answer;
    } catch (error) {
      console.warn('Validation failed:', error);
      return answer;
    }
  }
  
  /**
   * Stage 2: Refine answer (restructure and enhance)
   */
  private async refineAnswer(
    answer: string,
    query: string,
    knowledgeGraph: KnowledgeGraph,
    context: string[]
  ): Promise<string> {
    const prompt = `You are refining an answer for clarity and factual accuracy.

Original query:
${query}

Current answer:
${answer}

Knowledge Graph summary:
${knowledgeGraph.nodes.slice(0, 15).map(n => `- ${n.label}`).join('\n')}

Retrieved context:
${context.slice(0, 2).join('\n\n')}

Refine the answer to:
1. Improve clarity and structure
2. Ensure all claims are supported by the knowledge graph
3. Add specific details from the context
4. Maintain accuracy and completeness

Respond with the refined answer:`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a refinement agent. Return the refined answer." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      return data.choices[0].message.content || answer;
    } catch (error) {
      console.warn('Refinement failed:', error);
      return answer;
    }
  }
  
  /**
   * Stage 3: Condense answer (align tone and style)
   */
  private async condenseAnswer(answer: string, query: string): Promise<string> {
    const prompt = `You are condensing an answer to match the query's tone and style.

Query:
${query}

Answer to condense:
${answer}

Condense the answer to:
1. Match the query's formality level
2. Align with the query's language style
3. Remove redundancy while keeping key information
4. Ensure coherence and flow

Respond with the condensed answer:`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a condensation agent. Return the condensed answer." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1500
        })
      });

      const data = await response.json();
      return data.choices[0].message.content || answer;
    } catch (error) {
      console.warn('Condensation failed:', error);
      return answer;
    }
  }
  
  /**
   * Stage 4: Detect hallucinations and generate citations
   */
  private async detectHallucinations(
    answer: string,
    knowledgeGraph: KnowledgeGraph,
    context: string[]
  ): Promise<{
    verified: boolean;
    hallucinations: Array<{ claim: string; reason: string; corrected: string }>;
    citations: Array<{ claim: string; source: string; nodeId?: string }>;
  }> {
    const graphNodes = knowledgeGraph.nodes.slice(0, 30);
    const nodeMap = new Map(graphNodes.map(n => [n.label.toLowerCase(), n]));
    
    // Extract claims from answer
    const claims = this.extractClaims(answer);
    const hallucinations: Array<{ claim: string; reason: string; corrected: string }> = [];
    const citations: Array<{ claim: string; source: string; nodeId?: string }> = [];
    
    for (const claim of claims) {
      // Check if claim is supported by KG
      const claimLower = claim.toLowerCase();
      let found = false;
      let sourceNode: GraphNode | undefined;
      
      for (const [nodeLabel, node] of nodeMap.entries()) {
        if (claimLower.includes(nodeLabel) || nodeLabel.includes(claimLower.substring(0, 20))) {
          found = true;
          sourceNode = node;
          break;
        }
      }
      
      // Check context
      const inContext = context.some(ctx => ctx.toLowerCase().includes(claimLower.substring(0, 30)));
      
      if (!found && !inContext) {
        hallucinations.push({
          claim,
          reason: 'Not found in knowledge graph or retrieved context',
          corrected: `[Unverified claim: ${claim}]`,
        });
      } else {
        citations.push({
          claim,
          source: sourceNode ? `KG: ${sourceNode.label}` : 'Retrieved context',
          nodeId: sourceNode?.id,
        });
      }
    }
    
    const verified = hallucinations.length === 0;
    
    return { verified, hallucinations, citations };
  }
  
  /**
   * Extract claims from answer text
   */
  private extractClaims(answer: string): string[] {
    // Simple extraction: split by sentences and filter meaningful claims
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 10); // Limit to 10 claims
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    verified: boolean,
    hallucinationCount: number,
    contextCount: number
  ): number {
    let confidence = 0.5;
    
    if (verified) confidence += 0.3;
    if (hallucinationCount === 0) confidence += 0.1;
    if (contextCount > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

export const doragRefinement = new DORAGRefinement();

