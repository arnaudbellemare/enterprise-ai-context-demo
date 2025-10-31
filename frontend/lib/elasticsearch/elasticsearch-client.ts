/**
 * Elasticsearch Client for PERMUTATION
 * 
 * Provides vector search, hybrid search, and semantic retrieval capabilities.
 * Integrates with SRL expert trajectories, knowledge base, and reasoning patterns.
 * 
 * Based on: https://github.com/elastic/elasticsearch
 */

import { Client } from '@elastic/elasticsearch';

export interface ElasticsearchConfig {
  node?: string;
  cloud?: {
    id: string;
    apiKey: string;
  } | undefined;
  auth?: {
    username: string;
    password: string;
  } | undefined;
  enableVectorSearch?: boolean;
  enableHybridSearch?: boolean;
}

export interface VectorSearchParams {
  query: string;
  queryVector?: number[];
  index: string;
  size?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface HybridSearchParams extends VectorSearchParams {
  fullTextQuery?: string;
  boost?: {
    vector?: number;
    text?: number;
  };
}

export interface SearchResult<T = any> {
  id: string;
  score: number;
  document: T;
  explanation?: string;
}

/**
 * Elasticsearch client wrapper for PERMUTATION
 */
export class PERMUTATIONElasticsearchClient {
  private client: Client | null = null;
  private config: {
    node: string;
    cloud?: { id: string; apiKey: string };
    auth?: { username: string; password: string };
    enableVectorSearch: boolean;
    enableHybridSearch: boolean;
  };
  private initialized = false;

  constructor(config: ElasticsearchConfig = {}) {
    // Determine auth - prioritize config, then env vars, then defaults
    const defaultAuth = process.env.ELASTICSEARCH_USERNAME || process.env.ELASTICSEARCH_PASSWORD
      ? {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || ''
        }
      : undefined; // No auth if no env vars (for dev setups without security)

    // Determine cloud config
    const cloudConfig = config.cloud || (process.env.ELASTICSEARCH_CLOUD_ID && process.env.ELASTICSEARCH_API_KEY
      ? {
          id: process.env.ELASTICSEARCH_CLOUD_ID,
          apiKey: process.env.ELASTICSEARCH_API_KEY
        }
      : undefined);

    this.config = {
      node: config.node || process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      cloud: cloudConfig,
      auth: config.auth || defaultAuth,
      enableVectorSearch: config.enableVectorSearch ?? true,
      enableHybridSearch: config.enableHybridSearch ?? true
    };
  }

  /**
   * Initialize Elasticsearch client
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.client) {
      return;
    }

    try {
      if (this.config.cloud?.id && this.config.cloud?.apiKey) {
        // Elastic Cloud connection
        this.client = new Client({
          cloud: {
            id: this.config.cloud.id,
          },
          auth: {
            apiKey: this.config.cloud.apiKey
          }
        });
      } else {
        // Self-hosted connection
        const clientConfig: any = {
          node: this.config.node
        };
        
        // Only add auth if provided (some dev setups disable security)
        if (this.config.auth?.username || this.config.auth?.password) {
          clientConfig.auth = this.config.auth;
        }
        
        this.client = new Client(clientConfig);
      }

      // Test connection
      const info = await this.client.info();
      console.log(`✅ Elasticsearch connected: ${info.name} v${info.version.number}`);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Elasticsearch initialization failed:', error);
      this.client = null;
      throw error;
    }
  }

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.client) {
      await this.initialize();
    }
    if (!this.client) {
      throw new Error('Elasticsearch client not available');
    }
  }

  /**
   * Create index with vector search mapping
   */
  async createIndex(
    indexName: string,
    vectorDimension: number = 1536,
    settings?: any
  ): Promise<void> {
    await this.ensureInitialized();

    const exists = await this.client!.indices.exists({ index: indexName });
    
    if (!exists) {
      await this.client!.indices.create({
        index: indexName,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          ...settings
        },
        mappings: {
          properties: {
            content: {
              type: 'text',
              analyzer: 'standard'
            },
            domain: {
              type: 'keyword'
            },
            embedding: {
              type: 'dense_vector',
              dims: vectorDimension,
              index: true,
              similarity: 'cosine'
            },
            metadata: {
              type: 'object',
              enabled: true
            },
            created_at: {
              type: 'date'
            },
            updated_at: {
              type: 'date'
            }
          }
        }
      });
      
      console.log(`✅ Created Elasticsearch index: ${indexName}`);
    }
  }

  /**
   * Index document with vector embedding
   */
  async indexDocument<T extends Record<string, any>>(
    indexName: string,
    document: T & {
      id?: string;
      embedding?: number[];
      content: string;
      domain?: string;
    }
  ): Promise<string> {
    await this.ensureInitialized();

    const docId = document.id || `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await this.client!.index({
      index: indexName,
      id: docId,
      document: {
        ...document,
        updated_at: new Date().toISOString(),
        created_at: document.created_at || new Date().toISOString()
      }
    });

    return docId;
  }

  /**
   * Vector similarity search
   */
  async vectorSearch<T = any>(
    params: VectorSearchParams
  ): Promise<SearchResult<T>[]> {
    await this.ensureInitialized();

    if (!params.queryVector) {
      throw new Error('queryVector is required for vector search');
    }

    const query: any = {
      script_score: {
        query: { match_all: {} },
        script: {
          source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
          params: {
            query_vector: params.queryVector
          }
        }
      }
    };

    // Add filters if provided
    if (params.filter) {
      query.script_score.query = {
        bool: {
          must: [{ match_all: {} }],
          filter: Object.entries(params.filter).map(([key, value]) => ({
            term: { [key]: value }
          }))
        }
      };
    }

    const response = await this.client!.search<T>({
      index: params.index,
      size: params.size || 10,
      min_score: params.minScore || 0.5,
      query
    });

    return response.hits.hits.map(hit => ({
      id: hit._id!,
      score: hit._score || 0,
      document: hit._source as T
    }));
  }

  /**
   * Hybrid search (vector + full-text)
   */
  async hybridSearch<T = any>(
    params: HybridSearchParams
  ): Promise<SearchResult<T>[]> {
    await this.ensureInitialized();

    const vectorBoost = params.boost?.vector || 0.7;
    const textBoost = params.boost?.text || 0.3;

    const queries: any[] = [];

    // Vector similarity query
    if (params.queryVector && this.config.enableVectorSearch) {
      queries.push({
        script_score: {
          query: { match_all: {} },
          script: {
            source: "(cosineSimilarity(params.query_vector, 'embedding') + 1.0) * params.boost",
            params: {
              query_vector: params.queryVector,
              boost: vectorBoost
            }
          }
        }
      });
    }

    // Full-text query
    if (params.fullTextQuery || params.query) {
      queries.push({
        multi_match: {
          query: params.fullTextQuery || params.query,
          fields: ['content^2', 'domain'],
          type: 'best_fields',
          boost: textBoost
        }
      });
    }

    const boolQuery: any = {
      bool: {
        should: queries,
        minimum_should_match: 1
      }
    };

    // Add filters
    if (params.filter) {
      boolQuery.bool.filter = Object.entries(params.filter).map(([key, value]) => ({
        term: { [key]: value }
      }));
    }

    const response = await this.client!.search<T>({
      index: params.index,
      size: params.size || 10,
      min_score: params.minScore || 0.3,
      query: boolQuery
    });

    return response.hits.hits.map(hit => ({
      id: hit._id!,
      score: hit._score || 0,
      document: hit._source as T,
      explanation: hit._explanation?.description
    }));
  }

  /**
   * Bulk index documents
   */
  async bulkIndex<T extends Record<string, any>>(
    indexName: string,
    documents: Array<T & {
      id?: string;
      embedding?: number[];
      content: string;
    }>
  ): Promise<{ indexed: number; errors: number }> {
    await this.ensureInitialized();

    const body = documents.flatMap(doc => {
      const docId = doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return [
        { index: { _index: indexName, _id: docId } },
        {
          ...doc,
          updated_at: new Date().toISOString(),
          created_at: doc.created_at || new Date().toISOString()
        }
      ];
    });

    const response = await this.client!.bulk({ body });

    const errors = response.items.filter(item => item.index?.error).length;
    const indexed = documents.length - errors;

    return { indexed, errors };
  }

  /**
   * Delete document
   */
  async deleteDocument(indexName: string, docId: string): Promise<void> {
    await this.ensureInitialized();
    await this.client!.delete({ index: indexName, id: docId });
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.client!.indices.exists({ index: indexName });
  }

  /**
   * Get client instance (for advanced usage)
   */
  getClient(): Client {
    if (!this.client) {
      throw new Error('Elasticsearch client not initialized. Call initialize() first.');
    }
    return this.client;
  }
}

// Singleton instance
let elasticsearchClient: PERMUTATIONElasticsearchClient | null = null;

export function getElasticsearchClient(config?: ElasticsearchConfig): PERMUTATIONElasticsearchClient {
  if (!elasticsearchClient) {
    elasticsearchClient = new PERMUTATIONElasticsearchClient(config);
  }
  return elasticsearchClient;
}

