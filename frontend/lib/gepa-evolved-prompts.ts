/**
 * GEPA Evolved Prompts Storage and Management
 *
 * Stores prompts evolved by GEPA Algorithms for use in RAG Pipeline.
 * Two-tier optimization:
 * 1. GEPA Algorithms: Offline prompt evolution (quality/cost/speed)
 * 2. Inference Sampling: Online query optimization (diversity/quality)
 */

import type { PromptIndividual } from './gepa-algorithms';

export interface EvolvedRAGPrompts {
  reformulation: {
    expansion: string;
    clarification: string;
    simplification: string;
    decomposition: string;
  };
  retrieval: {
    hybrid_search: string;
    semantic_search: string;
    keyword_search: string;
  };
  reranking: {
    listwise: string;
    pairwise: string;
    pointwise: string;
  };
  synthesis: {
    delta_rule: string;
    uniform: string;
    data_dependent: string;
  };
  generation: {
    concise: string;
    detailed: string;
    factual: string;
  };
  metadata: {
    evolved_at: Date;
    gepa_generations: number;
    domain: string;
    version: string;
  };
}

/**
 * Default prompts (baseline before GEPA evolution)
 */
export const DEFAULT_RAG_PROMPTS: EvolvedRAGPrompts = {
  reformulation: {
    expansion: `Given the query below, expand it with relevant context and related concepts to improve retrieval.

Query: "{query}"

Provide an expanded version that maintains the original intent while adding:
- Related terminology and synonyms
- Contextual details
- Potential subconcepts

Expanded Query:`,

    clarification: `Given the ambiguous query below, clarify it to improve precision.

Query: "{query}"

Provide a clarified version that:
- Resolves ambiguities
- Specifies implicit assumptions
- Narrows the scope appropriately

Clarified Query:`,

    simplification: `Given the complex query below, simplify it while preserving core intent.

Query: "{query}"

Provide a simplified version that:
- Uses simpler language
- Focuses on the core question
- Removes unnecessary complexity

Simplified Query:`,

    decomposition: `Given the multi-part query below, decompose it into atomic sub-queries.

Query: "{query}"

Break this down into 2-4 simpler queries that together answer the original. Each should be independently answerable.

Sub-queries:
1.`
  },

  retrieval: {
    hybrid_search: `Execute a hybrid search combining semantic and keyword matching.

Query: "{query}"
Context: {context}

Return relevant documents ranked by combined relevance score.`,

    semantic_search: `Execute semantic search for conceptually similar content.

Query: "{query}"

Find documents that match the semantic meaning, even if exact terms differ.`,

    keyword_search: `Execute keyword search for exact term matches.

Query: "{query}"

Find documents containing key terms from the query.`
  },

  reranking: {
    listwise: `Given a query and list of documents, rank ALL documents by relevance.

Query: "{query}"

Documents:
{documents}

Return a ranked list from most to least relevant. Use format: [doc_index_1, doc_index_2, ...]

Ranking:`,

    pairwise: `Given a query and two documents, determine which is more relevant.

Query: "{query}"

Document A: {doc_a}
Document B: {doc_b}

Which document better answers the query? Respond with "A" or "B".

More relevant:`,

    pointwise: `Given a query and a document, score the document's relevance.

Query: "{query}"

Document: {document}

Rate relevance from 0.0 (not relevant) to 1.0 (highly relevant).

Relevance score:`
  },

  synthesis: {
    delta_rule: `Synthesize information from documents with adaptive gating.

Query: "{query}"

Documents:
{documents}

Synthesize a coherent response that:
- Integrates information from all relevant documents
- Adapts importance weights based on content overlap
- Handles redundancy gracefully

Synthesized Context:`,

    uniform: `Synthesize information from documents with equal weighting.

Query: "{query}"

Documents:
{documents}

Create a unified context treating all documents equally.

Synthesized Context:`,

    data_dependent: `Synthesize information from documents with data-dependent gating.

Query: "{query}"

Documents:
{documents}

Weight documents based on their information content and query relevance.

Synthesized Context:`
  },

  generation: {
    concise: `Given the query and context, provide a concise answer.

Query: "{query}"

Context:
{context}

Provide a brief, direct answer (2-3 sentences). Only use information from the context.

Answer:`,

    detailed: `Given the query and context, provide a comprehensive answer.

Query: "{query}"

Context:
{context}

Provide a detailed answer that:
- Addresses all aspects of the query
- Cites specific information from context
- Is well-structured and coherent

Answer:`,

    factual: `Given the query and context, provide a factual answer using ONLY information from context.

Query: "{query}"

Context:
{context}

Provide a FACTUAL answer. Do not add information not present in the context.

Answer:`
  },

  metadata: {
    evolved_at: new Date(),
    gepa_generations: 0,
    domain: 'general',
    version: '1.0.0-baseline'
  }
};

/**
 * In-memory cache for evolved prompts
 * In production: Replace with Supabase or Redis
 */
class EvolvedPromptsCache {
  private cache: Map<string, EvolvedRAGPrompts> = new Map();

  constructor() {
    // Initialize with default prompts
    this.cache.set('general', DEFAULT_RAG_PROMPTS);
  }

  async get(domain: string = 'general'): Promise<EvolvedRAGPrompts> {
    if (this.cache.has(domain)) {
      return this.cache.get(domain)!;
    }

    // Fall back to general domain
    return this.cache.get('general') || DEFAULT_RAG_PROMPTS;
  }

  async set(domain: string, prompts: EvolvedRAGPrompts): Promise<void> {
    this.cache.set(domain, prompts);
    console.log(`✅ Evolved prompts cached for domain: ${domain}`);
  }

  async update(domain: string, stage: keyof Omit<EvolvedRAGPrompts, 'metadata'>, prompts: any): Promise<void> {
    const current = await this.get(domain);
    const updated: EvolvedRAGPrompts = {
      ...current,
      [stage]: prompts,
      metadata: {
        ...current.metadata,
        evolved_at: new Date(),
        version: this.incrementVersion(current.metadata.version)
      }
    };
    await this.set(domain, updated);
  }

  private incrementVersion(version: string): string {
    const parts = version.split('-')[0].split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}-evolved`;
  }

  async has(domain: string): Promise<boolean> {
    return this.cache.has(domain);
  }
}

export const evolvedPromptsCache = new EvolvedPromptsCache();

/**
 * Get evolved prompts for a domain
 */
export async function getEvolvedPrompts(domain: string = 'general'): Promise<EvolvedRAGPrompts> {
  return evolvedPromptsCache.get(domain);
}

/**
 * Store evolved prompts from GEPA optimization
 */
export async function storeEvolvedPrompts(
  domain: string,
  evolvedIndividuals: PromptIndividual[],
  stage: keyof Omit<EvolvedRAGPrompts, 'metadata'>
): Promise<void> {
  // Select best prompts from GEPA evolution
  const qualityLeader = evolvedIndividuals.find(ind =>
    ind.fitness.quality === Math.max(...evolvedIndividuals.map(i => i.fitness.quality))
  );

  const costLeader = evolvedIndividuals.find(ind =>
    ind.fitness.cost === Math.max(...evolvedIndividuals.map(i => i.fitness.cost))
  );

  const speedLeader = evolvedIndividuals.find(ind =>
    ind.fitness.speed === Math.max(...evolvedIndividuals.map(i => i.fitness.speed))
  );

  // Use quality leader for production
  if (qualityLeader) {
    await evolvedPromptsCache.update(domain, stage, {
      primary: qualityLeader.prompt,
      quality_optimized: qualityLeader.prompt,
      cost_optimized: costLeader?.prompt || qualityLeader.prompt,
      speed_optimized: speedLeader?.prompt || qualityLeader.prompt
    });
  }
}
