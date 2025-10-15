/**
 * DSPy RAG Modules for PERMUTATION
 * 
 * "RAG isn't a blackbox" - Break it into testable pieces
 * 
 * Modules:
 * 1. Retrieve - Get likely spans from documents
 * 2. Extract - Extract keywords/entities
 * 3. Decide - Which insights hold up against text
 * 
 * Each module:
 * - Clear input/output signature
 * - Testable with metrics
 * - Swappable (prompt, model, or rule-based)
 * - Works with AX LLM
 * 
 * "Like writing tests for traditional apps"
 */


// ============================================
// MODULE SIGNATURES (Clear Contracts)
// ============================================

export interface RetrieveSignature {
  input: {
    query: string;
    documents: string[];
    k: number;
  };
  output: {
    spans: Array<{
      text: string;
      document_id: number;
      score: number;
      start_idx: number;
      end_idx: number;
    }>;
  };
}

export interface ExtractSignature {
  input: {
    query: string;
    spans: string[];
  };
  output: {
    keywords: string[];
    entities: Array<{
      text: string;
      type: 'person' | 'org' | 'location' | 'product' | 'concept';
      confidence: number;
    }>;
  };
}

export interface DecideSignature {
  input: {
    query: string;
    insights: string[];
    source_text: string;
  };
  output: {
    validated_insights: Array<{
      insight: string;
      holds_up: boolean;
      evidence: string;
      confidence: number;
    }>;
  };
}

// ============================================
// MODULE 1: RETRIEVE
// Testable, swappable retrieval
// ============================================

export class RetrieveModule {
  private method: 'bm25' | 'embedding' | 'llm';

  constructor(method: 'bm25' | 'embedding' | 'llm' = 'embedding') {
    this.method = method;
    
    if (method === 'llm') {
      // Using direct OpenRouter API calls instead of Ax client
      console.log('🔍 LLM method enabled - using OpenRouter API');
    }
    
    console.log(`🔍 Retrieve Module initialized (method: ${method})`);
  }

  async execute(input: RetrieveSignature['input']): Promise<RetrieveSignature['output']> {
    console.log(`🔍 Retrieving spans for: "${input.query.substring(0, 50)}..."`);
    
    switch (this.method) {
      case 'bm25':
        return this.retrieveBM25(input);
      case 'embedding':
        return this.retrieveEmbedding(input);
      case 'llm':
        return this.retrieveLLM(input);
      default:
        return this.retrieveBM25(input);
    }
  }

  /**
   * BM25 retrieval (rule-based, no LLM!)
   */
  private async retrieveBM25(input: RetrieveSignature['input']): Promise<RetrieveSignature['output']> {
    const queryTerms = input.query.toLowerCase().split(' ');
    const scored: Array<{ text: string; score: number; doc_id: number; start: number; end: number }> = [];

    // Score each document using BM25-like scoring
    input.documents.forEach((doc, docIdx) => {
      const docLower = doc.toLowerCase();
      let score = 0;
      
      // Simple BM25: count term matches
      queryTerms.forEach(term => {
        const matches = (docLower.match(new RegExp(term, 'g')) || []).length;
        score += matches * Math.log(1 + input.documents.length / (matches + 1));
      });

      // Extract spans (paragraphs or sentences)
      const sentences = doc.match(/[^.!?]+[.!?]+/g) || [doc];
      sentences.forEach((sentence, sentIdx) => {
        const sentenceLower = sentence.toLowerCase();
        let sentenceScore = 0;
        
        queryTerms.forEach(term => {
          if (sentenceLower.includes(term)) {
            sentenceScore += 1;
          }
        });

        if (sentenceScore > 0) {
          scored.push({
            text: sentence.trim(),
            score: sentenceScore,
            doc_id: docIdx,
            start: doc.indexOf(sentence),
            end: doc.indexOf(sentence) + sentence.length
          });
        }
      });
    });

    // Sort by score and take top k
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, input.k);

    return {
      spans: topK.map(s => ({
        text: s.text,
        document_id: s.doc_id,
        score: s.score,
        start_idx: s.start,
        end_idx: s.end
      }))
    };
  }

  /**
   * Embedding-based retrieval (vector similarity)
   */
  private async retrieveEmbedding(input: RetrieveSignature['input']): Promise<RetrieveSignature['output']> {
    // Use local embeddings (@xenova/transformers)
    const { createLocalEmbeddings } = await import('./local-embeddings');
    const embedder = createLocalEmbeddings();

    const queryEmbedding = await embedder.embed(input.query);
    const scored: Array<{ text: string; score: number; doc_id: number; start: number; end: number }> = [];

    // Embed and score each span
    for (let docIdx = 0; docIdx < input.documents.length; docIdx++) {
      const doc = input.documents[docIdx];
      const sentences = doc.match(/[^.!?]+[.!?]+/g) || [doc];
      
      for (const sentence of sentences) {
        const sentenceEmbedding = await embedder.embed(sentence);
        const similarity = this.cosineSimilarity(queryEmbedding, sentenceEmbedding);
        
        scored.push({
          text: sentence.trim(),
          score: similarity,
          doc_id: docIdx,
          start: doc.indexOf(sentence),
          end: doc.indexOf(sentence) + sentence.length
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, input.k);

    return {
      spans: topK.map(s => ({
        text: s.text,
        document_id: s.doc_id,
        score: s.score,
        start_idx: s.start,
        end_idx: s.end
      }))
    };
  }

  /**
   * LLM-based retrieval (using AX LLM)
   */
  private async retrieveLLM(input: RetrieveSignature['input']): Promise<RetrieveSignature['output']> {
    // Using direct OpenRouter API calls

    // Use AX LLM to select relevant spans
    const prompt = `Given this query: "${input.query}"

Select the ${input.k} most relevant spans from these documents:

${input.documents.map((doc, idx) => `Document ${idx}:\n${doc}\n`).join('\n')}

Return a JSON array of the most relevant spans.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'perplexity/llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.status}`);
      }

      const result = await response.json();

      // Parse result (simplified - real implementation would be more robust)
      return {
        spans: [] // Would parse from LLM response
      };
    } catch (error) {
      console.error('LLM retrieval failed, falling back to BM25');
      return this.retrieveBM25(input);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// ============================================
// MODULE 2: EXTRACT
// Extract keywords and entities
// ============================================

export class ExtractModule {
  private method: 'rule' | 'llm';

  constructor(method: 'rule' | 'llm' = 'rule') {
    this.method = method;
    
    if (method === 'llm') {
      // Using direct OpenRouter API calls instead of Ax client
      console.log('🔍 LLM method enabled - using OpenRouter API');
    }
    
    console.log(`🔍 Extract Module initialized (method: ${method})`);
  }

  async execute(input: ExtractSignature['input']): Promise<ExtractSignature['output']> {
    console.log(`🔍 Extracting from ${input.spans.length} spans...`);
    
    if (this.method === 'llm') {
      return this.extractLLM(input);
    } else {
      return this.extractRule(input);
    }
  }

  /**
   * Rule-based extraction (no LLM!)
   */
  private async extractRule(input: ExtractSignature['input']): Promise<ExtractSignature['output']> {
    const allText = input.spans.join(' ');
    const words = allText.toLowerCase().split(/\s+/);
    
    // Extract keywords (simple frequency-based)
    const wordFreq = new Map<string, number>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    
    words.forEach(word => {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Extract entities (rule-based: capitalized words)
    const entities: ExtractSignature['output']['entities'] = [];
    const capitalizedWords = allText.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    
    capitalizedWords.forEach(entity => {
      if (entity.length > 2) {
        entities.push({
          text: entity,
          type: 'concept', // Default type
          confidence: 0.7
        });
      }
    });

    return { keywords, entities: entities.slice(0, 10) };
  }

  /**
   * LLM-based extraction (using AX LLM)
   */
  private async extractLLM(input: ExtractSignature['input']): Promise<ExtractSignature['output']> {
    // Using direct OpenRouter API calls

    const prompt = `Extract keywords and entities from these text spans related to: "${input.query}"

Spans:
${input.spans.join('\n\n')}

Return JSON with:
{
  "keywords": ["keyword1", "keyword2", ...],
  "entities": [{"text": "Entity Name", "type": "person|org|location|product|concept", "confidence": 0.9}, ...]
}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'perplexity/llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.status}`);
      }

      const result = await response.json();

      // Parse JSON response
      const parsed = JSON.parse(result.choices[0].message.content || '{}');
      return {
        keywords: parsed.keywords || [],
        entities: parsed.entities || []
      };
    } catch (error) {
      console.error('LLM extraction failed, falling back to rules');
      return this.extractRule(input);
    }
  }
}

// ============================================
// MODULE 3: DECIDE
// Validate insights against source text
// ============================================

export class DecideModule {
  private method: 'rule' | 'llm';

  constructor(method: 'rule' | 'llm' = 'rule') {
    this.method = method;
    
    if (method === 'llm') {
      // Using direct OpenRouter API calls instead of Ax client
      console.log('🔍 LLM method enabled - using OpenRouter API');
    }
    
    console.log(`🔍 Decide Module initialized (method: ${method})`);
  }

  async execute(input: DecideSignature['input']): Promise<DecideSignature['output']> {
    console.log(`🔍 Validating ${input.insights.length} insights...`);
    
    if (this.method === 'llm') {
      return this.decideLLM(input);
    } else {
      return this.decideRule(input);
    }
  }

  /**
   * Rule-based validation (no LLM!)
   */
  private async decideRule(input: DecideSignature['input']): Promise<DecideSignature['output']> {
    const validated: DecideSignature['output']['validated_insights'] = [];

    for (const insight of input.insights) {
      // Rule: Check if key terms from insight appear in source text
      const insightTerms = insight.toLowerCase().split(' ').filter(w => w.length > 3);
      const sourceTextLower = input.source_text.toLowerCase();
      
      let matchCount = 0;
      let evidence: string[] = [];
      
      insightTerms.forEach(term => {
        if (sourceTextLower.includes(term)) {
          matchCount++;
          // Find sentence containing this term
          const sentences = input.source_text.match(/[^.!?]+[.!?]+/g) || [];
          const matchingSentence = sentences.find(s => s.toLowerCase().includes(term));
          if (matchingSentence && !evidence.includes(matchingSentence)) {
            evidence.push(matchingSentence);
          }
        }
      });

      const holdsUp = matchCount / insightTerms.length > 0.5;
      const confidence = matchCount / insightTerms.length;

      validated.push({
        insight,
        holds_up: holdsUp,
        evidence: evidence.slice(0, 2).join(' '),
        confidence
      });
    }

    return { validated_insights: validated };
  }

  /**
   * LLM-based validation (using AX LLM)
   */
  private async decideLLM(input: DecideSignature['input']): Promise<DecideSignature['output']> {
    // Using direct OpenRouter API calls

    const prompt = `Validate these insights against the source text.

Query: ${input.query}

Source Text:
${input.source_text}

Proposed Insights:
${input.insights.map((ins, idx) => `${idx + 1}. ${ins}`).join('\n')}

For each insight, determine:
1. Does it hold up against the source text?
2. What evidence supports or contradicts it?
3. Confidence score (0-1)

Return JSON array.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'perplexity/llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.status}`);
      }

      const result = await response.json();

      const parsed = JSON.parse(result.choices[0].message.content || '[]');
      return { validated_insights: parsed };
    } catch (error) {
      console.error('LLM validation failed, falling back to rules');
      return this.decideRule(input);
    }
  }
}

// ============================================
// COMPOSED RAG PIPELINE
// "Small, swappable modules with simple contracts"
// ============================================

export class DSPyRAGPipeline {
  private retrieveModule: RetrieveModule;
  private extractModule: ExtractModule;
  private decideModule: DecideModule;

  constructor(config?: {
    retrieve_method?: 'bm25' | 'embedding' | 'llm';
    extract_method?: 'rule' | 'llm';
    decide_method?: 'rule' | 'llm';
  }) {
    this.retrieveModule = new RetrieveModule(config?.retrieve_method || 'embedding');
    this.extractModule = new ExtractModule(config?.extract_method || 'rule');
    this.decideModule = new DecideModule(config?.decide_method || 'rule');
    
    console.log('🔗 DSPy RAG Pipeline initialized');
  }

  async execute(query: string, documents: string[]): Promise<{
    spans: RetrieveSignature['output']['spans'];
    keywords: string[];
    entities: ExtractSignature['output']['entities'];
    validated_insights: DecideSignature['output']['validated_insights'];
    metrics: {
      retrieve_latency_ms: number;
      extract_latency_ms: number;
      decide_latency_ms: number;
      total_latency_ms: number;
    };
  }> {
    const overallStart = performance.now();
    
    // Step 1: Retrieve
    const retrieveStart = performance.now();
    const retrieved = await this.retrieveModule.execute({
      query,
      documents,
      k: 5
    });
    const retrieveLatency = performance.now() - retrieveStart;
    console.log(`✅ Retrieved ${retrieved.spans.length} spans in ${retrieveLatency.toFixed(2)}ms`);

    // Step 2: Extract
    const extractStart = performance.now();
    const extracted = await this.extractModule.execute({
      query,
      spans: retrieved.spans.map(s => s.text)
    });
    const extractLatency = performance.now() - extractStart;
    console.log(`✅ Extracted ${extracted.keywords.length} keywords, ${extracted.entities.length} entities in ${extractLatency.toFixed(2)}ms`);

    // Step 3: Decide (validate insights)
    const decideStart = performance.now();
    const candidateInsights = this.generateCandidateInsights(query, extracted);
    const decided = await this.decideModule.execute({
      query,
      insights: candidateInsights,
      source_text: retrieved.spans.map(s => s.text).join('\n')
    });
    const decideLatency = performance.now() - decideStart;
    console.log(`✅ Validated ${decided.validated_insights.length} insights in ${decideLatency.toFixed(2)}ms`);

    const totalLatency = performance.now() - overallStart;

    return {
      spans: retrieved.spans,
      keywords: extracted.keywords,
      entities: extracted.entities,
      validated_insights: decided.validated_insights,
      metrics: {
        retrieve_latency_ms: retrieveLatency,
        extract_latency_ms: extractLatency,
        decide_latency_ms: decideLatency,
        total_latency_ms: totalLatency
      }
    };
  }

  /**
   * Generate candidate insights from extracted data
   */
  private generateCandidateInsights(query: string, extracted: ExtractSignature['output']): string[] {
    const insights: string[] = [];
    
    // Insight from top keywords
    if (extracted.keywords.length > 0) {
      insights.push(`Key topics include: ${extracted.keywords.slice(0, 5).join(', ')}`);
    }

    // Insight from entities
    const orgs = extracted.entities.filter(e => e.type === 'org');
    if (orgs.length > 0) {
      insights.push(`Relevant organizations: ${orgs.map(e => e.text).join(', ')}`);
    }

    const people = extracted.entities.filter(e => e.type === 'person');
    if (people.length > 0) {
      insights.push(`Key individuals: ${people.map(e => e.text).join(', ')}`);
    }

    return insights;
  }

  /**
   * Swap out any module (key feature!)
   */
  swapModule(moduleType: 'retrieve' | 'extract' | 'decide', newModule: any): void {
    switch (moduleType) {
      case 'retrieve':
        this.retrieveModule = newModule;
        console.log('🔄 Swapped Retrieve module');
        break;
      case 'extract':
        this.extractModule = newModule;
        console.log('🔄 Swapped Extract module');
        break;
      case 'decide':
        this.decideModule = newModule;
        console.log('🔄 Swapped Decide module');
        break;
    }
  }
}

// Singleton
let ragPipelineInstance: DSPyRAGPipeline | undefined;

export function getDSPyRAGPipeline(config?: any): DSPyRAGPipeline {
  if (typeof window === 'undefined') {
    return new DSPyRAGPipeline(config);
  }
  
  if (!ragPipelineInstance) {
    ragPipelineInstance = new DSPyRAGPipeline(config);
  }
  return ragPipelineInstance;
}

