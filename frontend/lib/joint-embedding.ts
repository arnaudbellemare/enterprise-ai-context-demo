/**
 * Joint-Embedding Architecture
 * 
 * Creates joint query-context embeddings with energy-based scoring.
 * Aligns with modern ML: "joint-embedding architectures" (not probabilistic).
 * 
 * Key features:
 * - Joint representation of query and context (not separate)
 * - Energy-based scoring (not probabilistic)
 * - Captures query-context relationships
 */

export interface JointEmbeddingResult {
  embedding: number[];
  energy: number;           // Lower = better alignment
  queryComponent: number[]; // Query component (for analysis)
  contextComponent: number[]; // Context component (for analysis)
  similarity: number;       // Query-context similarity (0-1)
}

/**
 * Create joint embedding from query and context
 * Uses energy-based scoring (not probabilistic)
 */
export async function createJointEmbedding(
  query: string,
  context: string,
  dimension: number = 768
): Promise<JointEmbeddingResult> {
  // Extract query and context embeddings separately first
  const queryEmbedding = await embedText(query, dimension / 2);
  const contextEmbedding = await embedText(context, dimension / 2);

  // Joint embedding: concatenate and project to joint space
  const concatenated = [...queryEmbedding, ...contextEmbedding];
  
  // Project to joint space (simplified - real implementation would use learned projection)
  const jointEmbedding = projectToJointSpace(concatenated, dimension);

  // Compute energy-based score (lower = better alignment)
  const energy = computeJointEnergy(queryEmbedding, contextEmbedding);

  // Compute similarity for analysis
  const similarity = cosineSimilarity(queryEmbedding, contextEmbedding);

  return {
    embedding: jointEmbedding,
    energy,
    queryComponent: queryEmbedding,
    contextComponent: contextEmbedding,
    similarity
  };
}

/**
 * Embed text to vector representation
 * In real implementation, would use actual embedding model (e.g., OpenAI embeddings)
 */
async function embedText(text: string, dimension: number): Promise<number[]> {
  // Simulated embedding - real implementation would call embedding API
  const tokens = text.split(/\s+/).slice(0, dimension);
  return Array.from({ length: dimension }, (_, i) => {
    const token = tokens[i] || '';
    const hash = simpleHash(token + i.toString());
    return (hash % 2000) / 2000 - 0.5; // Normalized to [-0.5, 0.5]
  });
}

/**
 * Project concatenated embeddings to joint space
 * Joint space captures query-context relationships
 */
function projectToJointSpace(
  concatenated: number[],
  targetDimension: number
): number[] {
  // Simplified projection - real implementation would use learned linear/non-linear projection
  if (concatenated.length === targetDimension) {
    return normalize(concatenated);
  }

  // Interpolate or pad to target dimension
  const result: number[] = [];
  const step = concatenated.length / targetDimension;
  
  for (let i = 0; i < targetDimension; i++) {
    const idx = Math.floor(i * step);
    result.push(concatenated[idx] || 0);
  }

  return normalize(result);
}

/**
 * Compute joint energy (lower = better query-context alignment)
 * Energy-based scoring (not probabilistic)
 */
function computeJointEnergy(
  queryEmbedding: number[],
  contextEmbedding: number[]
): number {
  // Energy = 1 - similarity (lower energy = better alignment)
  const similarity = cosineSimilarity(queryEmbedding, contextEmbedding);
  return 1.0 - similarity;
}

/**
 * Cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize vector to unit length
 */
function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Simple hash function for text
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Compute energy-based similarity between joint embeddings
 * Lower energy = more similar
 */
export function jointEmbeddingEnergy(
  embedding1: JointEmbeddingResult,
  embedding2: JointEmbeddingResult
): number {
  const similarity = cosineSimilarity(embedding1.embedding, embedding2.embedding);
  return 1.0 - similarity; // Energy: 0 = identical, 1 = completely different
}

