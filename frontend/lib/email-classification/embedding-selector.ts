/**
 * Embedding-Based Example Selection
 *
 * Uses semantic similarity to select the most relevant few-shot examples
 * for email classification. Based on SetFit research (Tunstall et al., 2022).
 */

import { supabase } from '../supabase';
import { FewShotExample } from '../email-template-classifier';

/**
 * Embedding provider types
 */
export type EmbeddingProvider = 'ollama' | 'openai';

/**
 * Get configured embedding provider (defaults to Ollama for local, free embeddings)
 */
function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase() as EmbeddingProvider;

  // Default to Ollama if available, otherwise OpenAI
  if (!provider) {
    return process.env.OLLAMA_HOST ? 'ollama' : 'openai';
  }

  return provider;
}

/**
 * Generate embedding for text using configured provider
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = getEmbeddingProvider();

  switch (provider) {
    case 'ollama':
      return generateOllamaEmbedding(text);
    case 'openai':
      return generateOpenAIEmbedding(text);
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Generate embedding using Ollama (local, free)
 *
 * Supported models (best to worst):
 * - bge-large (1024 dims) - BEST, beats OpenAI ada-002 by 5%
 * - e5-large (1024 dims) - Excellent, on par with ada-002
 * - gte-large (1024 dims) - Very good, comparable to ada-002
 * - nomic-embed-text (768 dims) - Good, smaller/faster
 */
async function generateOllamaEmbedding(text: string): Promise<number[]> {
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

  // Get model from env or use best available
  const ollamaModel = process.env.OLLAMA_EMBEDDING_MODEL || 'bge-large';

  try {
    const response = await fetch(`${ollamaHost}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: text.substring(0, 8000)
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Ollama embedding error:', error);
    throw error;
  }
}

/**
 * Generate embedding using OpenAI (1536 dimensions)
 * Fallback option if Ollama is not available
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000)
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Select most similar examples for a given email using vector search
 *
 * @param emailText - The email text to find similar examples for
 * @param k - Number of examples to return per template (default: 3)
 * @param matchThreshold - Minimum similarity threshold (default: 0.7)
 * @returns Array of few-shot examples sorted by relevance
 */
export async function selectSimilarExamples(
  emailText: string,
  k: number = 3,
  matchThreshold: number = 0.7
): Promise<FewShotExample[]> {
  try {
    // Generate embedding for the query email
    const queryEmbedding = await generateEmbedding(emailText);

    // Use Supabase RPC to find similar examples
    const { data, error } = await supabase.rpc('match_email_examples', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: k * 5 // Get more examples to ensure diversity across templates
    });

    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('No similar examples found, using fallback');
      return [];
    }

    // Convert to FewShotExample format
    const examples: FewShotExample[] = data.map((row: any) => ({
      email: row.email_text,
      template: row.template_name,
      entities: row.entities || {},
      confidence: row.confidence || 1.0,
      similarity: row.similarity
    }));

    // Group by template and take top K per template
    const byTemplate = new Map<string, FewShotExample[]>();

    for (const example of examples) {
      if (!byTemplate.has(example.template)) {
        byTemplate.set(example.template, []);
      }
      const templateExamples = byTemplate.get(example.template)!;
      if (templateExamples.length < k) {
        templateExamples.push(example);
      }
    }

    // Flatten and sort by similarity
    const selectedExamples = Array.from(byTemplate.values())
      .flat()
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, 15); // Max 15 examples total

    return selectedExamples;
  } catch (error) {
    console.error('Error selecting similar examples:', error);
    return []; // Return empty array on error (will fall back to rule-based)
  }
}

/**
 * Select diverse examples across multiple templates
 * Ensures we have representation from different categories
 *
 * @param emailText - The email text to find examples for
 * @param examplesPerTemplate - Number of examples per template (default: 2)
 * @param templateIds - Optional list of template IDs to filter by
 * @returns Array of diverse few-shot examples
 */
export async function selectDiverseExamples(
  emailText: string,
  examplesPerTemplate: number = 2,
  templateIds?: string[]
): Promise<FewShotExample[]> {
  try {
    const queryEmbedding = await generateEmbedding(emailText);

    const { data, error } = await supabase.rpc('get_diverse_examples', {
      query_embedding: queryEmbedding,
      examples_per_template: examplesPerTemplate,
      template_ids: templateIds || null
    });

    if (error) {
      console.error('Diverse selection error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      email: row.email_text,
      template: row.template_name,
      entities: row.entities || {},
      confidence: row.confidence || 1.0,
      similarity: row.similarity
    }));
  } catch (error) {
    console.error('Error selecting diverse examples:', error);
    return [];
  }
}

/**
 * Hybrid selection: Combine similarity and diversity
 *
 * @param emailText - The email to classify
 * @param totalExamples - Total number of examples to return
 * @returns Optimally selected few-shot examples
 */
export async function selectOptimalExamples(
  emailText: string,
  totalExamples: number = 10
): Promise<FewShotExample[]> {
  try {
    // Get similar examples (70% of total)
    const similarCount = Math.ceil(totalExamples * 0.7);
    const similarExamples = await selectSimilarExamples(emailText, 3, 0.7);

    // Get diverse examples (30% of total)
    const diverseCount = totalExamples - similarExamples.length;
    const diverseExamples = await selectDiverseExamples(emailText, 1);

    // Combine and deduplicate
    const combined = [...similarExamples];
    const seenEmails = new Set(similarExamples.map(ex => ex.email));

    for (const example of diverseExamples) {
      if (!seenEmails.has(example.email) && combined.length < totalExamples) {
        combined.push(example);
        seenEmails.add(example.email);
      }
    }

    return combined.slice(0, totalExamples);
  } catch (error) {
    console.error('Error selecting optimal examples:', error);
    return [];
  }
}

/**
 * Cache wrapper for embedding generation
 * Caches embeddings for 1 hour to reduce API calls
 */
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export async function generateEmbeddingCached(text: string): Promise<number[]> {
  const cacheKey = text.substring(0, 500); // Use first 500 chars as key
  const now = Date.now();

  // Check cache
  const cached = embeddingCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.embedding;
  }

  // Generate new embedding
  const embedding = await generateEmbedding(text);

  // Store in cache
  embeddingCache.set(cacheKey, { embedding, timestamp: now });

  // Clean old cache entries (simple LRU)
  if (embeddingCache.size > 100) {
    const oldestKey = Array.from(embeddingCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    embeddingCache.delete(oldestKey);
  }

  return embedding;
}
