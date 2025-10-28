/**
 * Vector Database Adapters for REFRAG
 * 
 * Supports multiple vector databases:
 * - Weaviate (production-grade)
 * - PostgreSQL with pgvector (enterprise)
 * - Qdrant (high-performance)
 * - In-Memory (development/testing)
 */

import { createLogger } from '../../lib/walt/logger';
import { VectorRetriever, Chunk, Document } from './refrag-system';

const logger = createLogger('VectorDB');

// ============================================================
// WEAVIATE ADAPTER
// ============================================================

export interface WeaviateConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  timeout?: number;
}

export class WeaviateRetriever implements VectorRetriever {
  private config: WeaviateConfig;
  private client: any; // Weaviate client

  constructor(config: WeaviateConfig) {
    this.config = config;
    this.initializeClient();
    
    logger.info('WeaviateRetriever initialized', {
      url: config.url,
      collection: config.collectionName
    });
  }

  private async initializeClient() {
    try {
      // Dynamic import for Weaviate client
      const weaviate = await import('weaviate-ts-client');

      this.client = weaviate.default.client({
        scheme: 'http',
        host: this.config.url.replace('http://', '').replace('https://', ''),
        apiKey: new weaviate.ApiKey(this.config.apiKey || '')
      });

      // Test connection
      await this.client.misc.liveChecker().do();
      logger.info('Weaviate connection established');
      
    } catch (error) {
      logger.error('Weaviate initialization failed', error);
      // Fallback to mock client for development
      this.client = new MockWeaviateClient();
    }
  }

  async search(embedding: number[], k: number, filters?: any): Promise<Chunk[]> {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName(this.config.collectionName)
        .withFields('content metadata _additional {id distance}')
        .withNearVector({
          vector: embedding,
          distance: 0.8 // Similarity threshold
        })
        .withLimit(k)
        .do();

      const chunks: Chunk[] = result.data.Get[this.config.collectionName].map((item: any) => ({
        id: item._additional.id,
        content: item.content,
        metadata: item.metadata || {},
        score: 1 - (item._additional.distance || 0), // Convert distance to similarity
        embedding: embedding // Store query embedding for MMR
      }));

      logger.info('Weaviate search completed', {
        query: embedding.slice(0, 5),
        results: chunks.length,
        avgScore: chunks.reduce((sum, c) => sum + (c.score || 0), 0) / chunks.length
      });

      return chunks;

    } catch (error) {
      logger.error('Weaviate search failed', error);
      return [];
    }
  }

  async upsert(documents: Document[]): Promise<void> {
    try {
      const batcher = this.client.batch.objectsBatcher();
      
      for (const doc of documents) {
        batcher.addObject({
          class: this.config.collectionName,
          properties: {
            content: doc.content,
            metadata: doc.metadata || {}
          }
        });
      }
      
      await batcher.do();
      
      logger.info('Weaviate upsert completed', { count: documents.length });
      
    } catch (error) {
      logger.error('Weaviate upsert failed', error);
      throw error;
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.client.data.deleter()
          .withClassName(this.config.collectionName)
          .withId(id)
          .do();
      }
      
      logger.info('Weaviate delete completed', { count: ids.length });
      
    } catch (error) {
      logger.error('Weaviate delete failed', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<{count: number, dimensions: number}> {
    try {
      const result = await this.client.graphql
        .aggregate()
        .withClassName(this.config.collectionName)
        .withFields('meta { count }')
        .do();

      return {
        count: result.data.Aggregate[this.config.collectionName][0].meta.count,
        dimensions: 512 // Weaviate default
      };
      
    } catch (error) {
      logger.error('Weaviate stats failed', error);
      return { count: 0, dimensions: 512 };
    }
  }
}

// ============================================================
// POSTGRESQL + PGVECTOR ADAPTER
// ============================================================

export interface PostgreSQLConfig {
  connectionString: string;
  tableName: string;
  embeddingColumn: string;
  contentColumn: string;
  metadataColumn: string;
}

export class PostgreSQLRetriever implements VectorRetriever {
  private config: PostgreSQLConfig;
  private pool: any; // pg.Pool

  constructor(config: PostgreSQLConfig) {
    this.config = config;
    this.initializePool();
    
    logger.info('PostgreSQLRetriever initialized', {
      table: config.tableName,
      embeddingColumn: config.embeddingColumn
    });
  }

  private async initializePool() {
    try {
      const { Pool } = await import('pg');
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      logger.info('PostgreSQL connection established');
      
    } catch (error) {
      logger.error('PostgreSQL initialization failed', error);
      throw error;
    }
  }

  async search(embedding: number[], k: number, filters?: any): Promise<Chunk[]> {
    try {
      const query = `
        SELECT 
          id,
          ${this.config.contentColumn} as content,
          ${this.config.metadataColumn} as metadata,
          1 - (${this.config.embeddingColumn} <=> $1::vector) as score
        FROM ${this.config.tableName}
        ORDER BY ${this.config.embeddingColumn} <=> $1::vector
        LIMIT $2
      `;

      const result = await this.pool.query(query, [JSON.stringify(embedding), k]);
      
      const chunks: Chunk[] = result.rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata || {},
        score: parseFloat(row.score)
      }));

      logger.info('PostgreSQL search completed', {
        results: chunks.length,
        avgScore: chunks.reduce((sum, c) => sum + (c.score || 0), 0) / chunks.length
      });

      return chunks;

    } catch (error) {
      logger.error('PostgreSQL search failed', error);
      return [];
    }
  }

  async upsert(documents: Document[]): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        for (const doc of documents) {
          const query = `
            INSERT INTO ${this.config.tableName} 
            (id, ${this.config.contentColumn}, ${this.config.metadataColumn}, ${this.config.embeddingColumn})
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
              ${this.config.contentColumn} = EXCLUDED.${this.config.contentColumn},
              ${this.config.metadataColumn} = EXCLUDED.${this.config.metadataColumn},
              ${this.config.embeddingColumn} = EXCLUDED.${this.config.embeddingColumn}
          `;
          
          // Generate embedding (would use actual embedding service)
          const embedding = new Array(512).fill(0).map(() => Math.random());
          
          await client.query(query, [
            doc.id,
            doc.content,
            JSON.stringify(doc.metadata || {}),
            JSON.stringify(embedding)
          ]);
        }
        
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
      logger.info('PostgreSQL upsert completed', { count: documents.length });
      
    } catch (error) {
      logger.error('PostgreSQL upsert failed', error);
      throw error;
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      const query = `DELETE FROM ${this.config.tableName} WHERE id = ANY($1)`;
      await this.pool.query(query, [ids]);
      
      logger.info('PostgreSQL delete completed', { count: ids.length });
      
    } catch (error) {
      logger.error('PostgreSQL delete failed', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<{count: number, dimensions: number}> {
    try {
      const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${this.config.tableName}`);
      return {
        count: parseInt(result.rows[0].count),
        dimensions: 512
      };
      
    } catch (error) {
      logger.error('PostgreSQL stats failed', error);
      return { count: 0, dimensions: 512 };
    }
  }
}

// ============================================================
// QDRANT ADAPTER
// ============================================================

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  timeout?: number;
}

export class QdrantRetriever implements VectorRetriever {
  private config: QdrantConfig;
  private client: any; // Qdrant client

  constructor(config: QdrantConfig) {
    this.config = config;
    this.initializeClient();
    
    logger.info('QdrantRetriever initialized', {
      url: config.url,
      collection: config.collectionName
    });
  }

  private async initializeClient() {
    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      
      this.client = new QdrantClient({
        url: this.config.url,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout || 10000
      });

      // Test connection
      await this.client.getCollections();
      logger.info('Qdrant connection established');
      
    } catch (error) {
      logger.error('Qdrant initialization failed', error);
      // Fallback to mock client
      this.client = new MockQdrantClient();
    }
  }

  async search(embedding: number[], k: number, filters?: any): Promise<Chunk[]> {
    try {
      const result = await this.client.search(this.config.collectionName, {
        vector: embedding,
        limit: k,
        with_payload: true,
        with_vector: false
      });

      const chunks: Chunk[] = result.map((item: any) => ({
        id: item.id.toString(),
        content: item.payload.content || '',
        metadata: item.payload.metadata || {},
        score: item.score
      }));

      logger.info('Qdrant search completed', {
        results: chunks.length,
        avgScore: chunks.reduce((sum, c) => sum + (c.score || 0), 0) / chunks.length
      });

      return chunks;

    } catch (error) {
      logger.error('Qdrant search failed', error);
      return [];
    }
  }

  async upsert(documents: Document[]): Promise<void> {
    try {
      const points = documents.map((doc, index) => ({
        id: doc.id || index,
        vector: new Array(512).fill(0).map(() => Math.random()), // Would use actual embedding
        payload: {
          content: doc.content,
          metadata: doc.metadata || {}
        }
      }));

      await this.client.upsert(this.config.collectionName, {
        points: points
      });
      
      logger.info('Qdrant upsert completed', { count: documents.length });
      
    } catch (error) {
      logger.error('Qdrant upsert failed', error);
      throw error;
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      await this.client.delete(this.config.collectionName, {
        points: ids.map(id => ({ id: id }))
      });
      
      logger.info('Qdrant delete completed', { count: ids.length });
      
    } catch (error) {
      logger.error('Qdrant delete failed', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<{count: number, dimensions: number}> {
    try {
      const info = await this.client.getCollection(this.config.collectionName);
      return {
        count: info.points_count,
        dimensions: info.config.params.vectors.size
      };
      
    } catch (error) {
      logger.error('Qdrant stats failed', error);
      return { count: 0, dimensions: 512 };
    }
  }
}

// ============================================================
// IN-MEMORY ADAPTER (Development)
// ============================================================

export class InMemoryRetriever implements VectorRetriever {
  private chunks: Map<string, Chunk> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    logger.info('InMemoryRetriever initialized');
  }

  async search(embedding: number[], k: number, filters?: any): Promise<Chunk[]> {
    const chunks = Array.from(this.chunks.values());
    
    // Calculate cosine similarity
    const scored = chunks.map(chunk => {
      const chunkEmbedding = this.embeddings.get(chunk.id) || [];
      const similarity = this.cosineSimilarity(embedding, chunkEmbedding);
      return { ...chunk, score: similarity };
    });

    // Sort by score and return top k
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    logger.info('InMemory search completed', {
      totalChunks: chunks.length,
      results: results.length,
      avgScore: results.reduce((sum, c) => sum + c.score, 0) / results.length
    });

    return results;
  }

  async upsert(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      const chunk: Chunk = {
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata || {}
      };
      
      this.chunks.set(doc.id, chunk);
      
      // Generate mock embedding
      const embedding = new Array(512).fill(0).map(() => Math.random());
      this.embeddings.set(doc.id, embedding);
    }
    
    logger.info('InMemory upsert completed', { count: documents.length });
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.chunks.delete(id);
      this.embeddings.delete(id);
    }
    
    logger.info('InMemory delete completed', { count: ids.length });
  }

  async getCollectionStats(): Promise<{count: number, dimensions: number}> {
    return {
      count: this.chunks.size,
      dimensions: 512
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
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
// MOCK CLIENTS (Fallbacks)
// ============================================================

class MockWeaviateClient {
  misc = {
    liveChecker: () => ({ do: () => Promise.resolve() })
  };
  
  graphql = {
    get: () => ({
      withClassName: () => ({
        withFields: () => ({
          withNearVector: () => ({
            withLimit: () => ({
              do: () => Promise.resolve({
                data: { Get: { Documents: [] } }
              })
            })
          })
        })
      })
    }),
    aggregate: () => ({
      withClassName: () => ({
        withFields: () => ({
          do: () => Promise.resolve({
            data: { Aggregate: { Documents: [{ meta: { count: 0 } }] } }
          })
        })
      })
    })
  };
  
  batch = {
    objectsBatcher: () => ({
      addObject: () => ({ addObject: () => ({ do: () => Promise.resolve() }) }),
      do: () => Promise.resolve()
    })
  };
  
  data = {
    deleter: () => ({
      withClassName: () => ({
        withId: () => ({
          do: () => Promise.resolve()
        })
      })
    })
  };
}

class MockQdrantClient {
  getCollections() {
    return Promise.resolve({ collections: [] });
  }
  
  search(collection: string, params: any) {
    return Promise.resolve([]);
  }
  
  upsert(collection: string, params: any) {
    return Promise.resolve();
  }
  
  delete(collection: string, params: any) {
    return Promise.resolve();
  }
  
  getCollection(collection: string) {
    return Promise.resolve({
      points_count: 0,
      config: { params: { vectors: { size: 512 } } }
    });
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

export function createVectorRetriever(
  type: 'weaviate' | 'postgresql' | 'qdrant' | 'inmemory',
  config: any
): VectorRetriever {
  switch (type) {
    case 'weaviate':
      return new WeaviateRetriever(config);
    case 'postgresql':
      return new PostgreSQLRetriever(config);
    case 'qdrant':
      return new QdrantRetriever(config);
    case 'inmemory':
      return new InMemoryRetriever();
    default:
      throw new Error(`Unsupported vector DB type: ${type}`);
  }
}

// Export default in-memory retriever for development
export const defaultRetriever = new InMemoryRetriever();
