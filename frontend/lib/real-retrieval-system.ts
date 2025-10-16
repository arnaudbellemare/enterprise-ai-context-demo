/**
 * REAL RETRIEVAL SYSTEM
 * 
 * Implements actual retrieval without mock data or Weaviate dependency
 * Uses real embeddings, similarity search, and reranking algorithms
 */

export interface Document {
  id: string;
  content: string;
  metadata?: any;
  embedding?: number[];
  score?: number;
}

export interface SearchResult {
  documents: Document[];
  query: string;
  totalResults: number;
  searchTime: number;
  method: string;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

/**
 * Real Embedding Generator using Ollama
 */
export class RealEmbeddingGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate real embeddings using Ollama's embedding endpoint
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text', // Use a real embedding model
          prompt: text
        })
      });

      if (!response.ok) {
        // Fallback to a simple hash-based embedding if Ollama doesn't support embeddings
        return this.generateFallbackEmbedding(text);
      }

      const data = await response.json();
      return {
        embedding: data.embedding || data.embeddings?.[0] || [],
        tokens: data.tokens || text.split(' ').length,
        model: 'nomic-embed-text'
      };
    } catch (error) {
      // Fallback to hash-based embedding
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding using text hash and basic vectorization
   */
  private generateFallbackEmbedding(text: string): EmbeddingResult {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding dimension
    
    // Simple word-based embedding
    words.forEach(word => {
      const hash = this.simpleHash(word);
      const index = hash % 384;
      embedding[index] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => magnitude > 0 ? val / magnitude : 0);

    return {
      embedding: normalizedEmbedding,
      tokens: words.length,
      model: 'hash-based-fallback'
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }
}

/**
 * Real Document Store with In-Memory Storage
 */
export class RealDocumentStore {
  private documents: Map<string, Document> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private embeddingGenerator: RealEmbeddingGenerator;

  constructor() {
    this.embeddingGenerator = new RealEmbeddingGenerator();
  }

  /**
   * Add a document to the store with real embedding
   */
  async addDocument(doc: Document): Promise<void> {
    const embedding = await this.embeddingGenerator.generateEmbedding(doc.content);
    
    this.documents.set(doc.id, {
      ...doc,
      embedding: embedding.embedding
    });
    
    this.embeddings.set(doc.id, embedding.embedding);
  }

  /**
   * Search documents using real vector similarity
   */
  async searchDocuments(query: string, limit: number = 10, threshold: number = 0.1): Promise<Document[]> {
    const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query);
    
    const results: Array<Document & { similarity: number }> = [];

    for (const [docId, docEmbedding] of this.embeddings) {
      const similarity = this.embeddingGenerator.cosineSimilarity(queryEmbedding.embedding, docEmbedding);
      
      if (similarity >= threshold) {
        const document = this.documents.get(docId);
        if (document) {
          results.push({
            ...document,
            similarity,
            score: similarity
          });
        }
      }
    }

    // Sort by similarity score (highest first)
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit).map(({ similarity, ...doc }) => doc);
  }

  /**
   * Keyword search using real text matching
   */
  async keywordSearch(query: string, limit: number = 10): Promise<Document[]> {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const results: Array<Document & { keywordScore: number }> = [];

    for (const [docId, document] of this.documents) {
      const content = document.content.toLowerCase();
      let score = 0;
      
      queryWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      });

      if (score > 0) {
        results.push({
          ...document,
          keywordScore: score,
          score: score / queryWords.length // Normalize by query length
        });
      }
    }

    // Sort by keyword score (highest first)
    results.sort((a, b) => b.keywordScore - a.keywordScore);
    
    return results.slice(0, limit).map(({ keywordScore, ...doc }) => doc);
  }

  /**
   * Get document count
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
    this.embeddings.clear();
  }
}

/**
 * Real Query Expansion using Ollama
 */
export class RealQueryExpansion {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * Expand query using real LLM reasoning
   */
  async expandQuery(query: string, method: 'synonyms' | 'context' | 'reasoning' = 'synonyms'): Promise<string[]> {
    try {
      let expansionPrompt = '';
      
      switch (method) {
        case 'synonyms':
          expansionPrompt = `Generate 3-5 synonyms or alternative ways to express this query: "${query}". Return only the variations, one per line.`;
          break;
        case 'context':
          expansionPrompt = `Generate 3-5 contextual variations of this query that would find related information: "${query}". Return only the variations, one per line.`;
          break;
        case 'reasoning':
          expansionPrompt = `Break down this query into 3-5 sub-questions that would help answer it: "${query}". Return only the sub-questions, one per line.`;
          break;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: expansionPrompt,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.response || '';
        
        // Parse the response into individual queries
        const expandedQueries = responseText
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.includes('I cannot') && !line.includes('I don\'t'))
          .slice(0, 5);

        return [query, ...expandedQueries]; // Include original query
      } else {
        throw new Error('LLM expansion failed');
      }
    } catch (error) {
      // Fallback to simple expansion
      return this.simpleExpansion(query);
    }
  }

  /**
   * Simple fallback expansion
   */
  private simpleExpansion(query: string): string[] {
    const expansions = [query];
    
    // Add basic variations
    if (!query.includes('?')) {
      expansions.push(`${query}?`);
    }
    
    expansions.push(`What is ${query.toLowerCase()}`);
    expansions.push(`How does ${query.toLowerCase()} work`);
    expansions.push(`${query} explained`);
    
    return expansions;
  }
}

/**
 * Real Reranking using LLM-based relevance scoring
 */
export class RealReranker {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * Rerank documents using real LLM relevance scoring
   */
  async rerankDocuments(documents: Document[], query: string): Promise<Document[]> {
    if (documents.length === 0) return documents;

    try {
      // Create a prompt for relevance scoring
      const documentList = documents.map((doc, index) => 
        `${index + 1}. ${doc.content.substring(0, 200)}...`
      ).join('\n');

      const scoringPrompt = `Rate the relevance of each document to this query: "${query}"

Documents:
${documentList}

Rate each document from 1-10 (10 = most relevant). Respond with only the numbers in order, separated by commas.
Example: 8,6,9,7,5`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: scoringPrompt,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.response || '';
        
        // Parse scores
        const scores = responseText
          .split(',')
          .map((score: string) => parseFloat(score.trim()))
          .filter((score: number) => !isNaN(score) && score >= 1 && score <= 10);

        if (scores.length === documents.length) {
          // Apply scores and sort
          const scoredDocs = documents.map((doc, index) => ({
            ...doc,
            score: scores[index] / 10 // Normalize to 0-1
          }));

          return scoredDocs.sort((a, b) => b.score! - a.score!);
        }
      }
    } catch (error) {
      console.warn('LLM reranking failed, using original order:', error);
    }

    // Fallback: return documents in original order
    return documents;
  }
}

/**
 * Main Real Retrieval System
 */
export class RealRetrievalSystem {
  private documentStore: RealDocumentStore;
  private queryExpansion: RealQueryExpansion;
  private reranker: RealReranker;

  constructor() {
    this.documentStore = new RealDocumentStore();
    this.queryExpansion = new RealQueryExpansion();
    this.reranker = new RealReranker();
  }

  /**
   * Add documents to the real document store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      await this.documentStore.addDocument(doc);
    }
  }

  /**
   * Real hybrid search combining vector and keyword search
   */
  async hybridSearch(query: string, limit: number = 10): Promise<SearchResult> {
    const startTime = Date.now();

    // Get vector search results
    const vectorResults = await this.documentStore.searchDocuments(query, limit);
    
    // Get keyword search results
    const keywordResults = await this.documentStore.keywordSearch(query, limit);
    
    // Combine and deduplicate results
    const combinedResults = this.combineSearchResults(vectorResults, keywordResults);
    
    // Rerank using real LLM scoring
    const rerankedResults = await this.reranker.rerankDocuments(combinedResults, query);
    
    const searchTime = Date.now() - startTime;

    return {
      documents: rerankedResults.slice(0, limit),
      query,
      totalResults: rerankedResults.length,
      searchTime,
      method: 'hybrid-search'
    };
  }

  /**
   * Real query expansion search
   */
  async expandedSearch(query: string, limit: number = 10, expansionMethod: 'synonyms' | 'context' | 'reasoning' = 'synonyms'): Promise<SearchResult> {
    const startTime = Date.now();

    // Expand the query
    const expandedQueries = await this.queryExpansion.expandQuery(query, expansionMethod);
    
    // Search with each expanded query
    const allResults: Document[] = [];
    
    for (const expandedQuery of expandedQueries) {
      const results = await this.documentStore.searchDocuments(expandedQuery, Math.ceil(limit / expandedQueries.length));
      allResults.push(...results);
    }
    
    // Combine and deduplicate
    const combinedResults = this.combineSearchResults(allResults, []);
    
    // Rerank
    const rerankedResults = await this.reranker.rerankDocuments(combinedResults, query);
    
    const searchTime = Date.now() - startTime;

    return {
      documents: rerankedResults.slice(0, limit),
      query,
      totalResults: rerankedResults.length,
      searchTime,
      method: `expanded-search-${expansionMethod}`
    };
  }

  /**
   * Combine search results and remove duplicates
   */
  private combineSearchResults(vectorResults: Document[], keywordResults: Document[]): Document[] {
    const seen = new Set<string>();
    const combined: Document[] = [];

    // Add vector results first (usually higher quality)
    for (const doc of vectorResults) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        combined.push(doc);
      }
    }

    // Add keyword results that aren't already included
    for (const doc of keywordResults) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        combined.push(doc);
      }
    }

    return combined;
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      documentCount: this.documentStore.getDocumentCount(),
      embeddingModel: 'nomic-embed-text (with hash fallback)',
      rerankingModel: 'gemma3:4b',
      expansionModel: 'gemma3:4b'
    };
  }
}

export default RealRetrievalSystem;
