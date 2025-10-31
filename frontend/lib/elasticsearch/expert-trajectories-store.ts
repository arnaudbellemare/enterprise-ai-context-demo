/**
 * Expert Trajectories Store with Elasticsearch
 * 
 * Replaces simple keyword matching with semantic vector search.
 * Provides better trajectory matching for SRL enhancement.
 */

import { getElasticsearchClient, type PERMUTATIONElasticsearchClient } from './elasticsearch-client';
import type { ExpertTrajectory, ExpertStep } from '../srl/swirl-srl-enhancer';

const EXPERT_TRAJECTORIES_INDEX = 'expert_trajectories';

export interface ExpertTrajectoryDocument {
  id: string;
  query: string;
  domain: string;
  steps: ExpertStep[];
  finalAnswer: string;
  quality: number;
  embedding?: number[];
  metadata?: {
    created_at: string;
    updated_at: string;
    usage_count?: number;
    success_rate?: number;
  };
}

/**
 * Elasticsearch-backed expert trajectories store
 */
export class ExpertTrajectoriesElasticsearchStore {
  private client: PERMUTATIONElasticsearchClient;
  private initialized = false;

  constructor() {
    this.client = getElasticsearchClient();
  }

  /**
   * Initialize index
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.client.initialize();
      await this.client.createIndex(EXPERT_TRAJECTORIES_INDEX, 1536);
      this.initialized = true;
      console.log('✅ Expert Trajectories Elasticsearch store initialized (100% local)');
    } catch (error) {
      console.warn('⚠️  Elasticsearch not available, will fallback to Supabase:', error);
      // Don't throw - allow fallback to Supabase
      // This ensures the system works even if Elasticsearch isn't running
    }
  }

  /**
   * Store expert trajectory with embedding
   */
  async storeTrajectory(
    trajectory: ExpertTrajectory,
    embedding?: number[]
  ): Promise<string> {
    await this.initialize();

    const doc: ExpertTrajectoryDocument = {
      id: trajectory.query.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_') + '_' + trajectory.domain,
      query: trajectory.query,
      domain: trajectory.domain,
      steps: trajectory.steps,
      finalAnswer: trajectory.finalAnswer,
      quality: trajectory.quality,
      embedding,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    try {
      const docId = await this.client.indexDocument(EXPERT_TRAJECTORIES_INDEX, doc);
      console.log(`💾 Stored expert trajectory in Elasticsearch: ${docId}`);
      return docId;
    } catch (error) {
      console.error('❌ Failed to store trajectory in Elasticsearch:', error);
      throw error;
    }
  }

  /**
   * Find best matching trajectory using semantic search
   */
  async findBestTrajectory(
    query: string,
    domain: string,
    queryEmbedding?: number[]
  ): Promise<ExpertTrajectory | null> {
    await this.initialize();

    try {
      let results;

      if (queryEmbedding && this.client.getClient) {
        // Use hybrid search (vector + full-text)
        results = await this.client.hybridSearch<ExpertTrajectoryDocument>({
          query,
          queryVector: queryEmbedding,
          fullTextQuery: query,
          index: EXPERT_TRAJECTORIES_INDEX,
          size: 5,
          minScore: 0.6,
          filter: { domain },
          boost: {
            vector: 0.7, // Prioritize semantic similarity
            text: 0.3
          }
        });
      } else {
        // Fallback to full-text only
        results = await this.client.hybridSearch<ExpertTrajectoryDocument>({
          query,
          index: EXPERT_TRAJECTORIES_INDEX,
          size: 5,
          minScore: 0.5,
          filter: { domain }
        });
      }

      if (results.length === 0) {
        return null;
      }

      // Convert top result back to ExpertTrajectory format
      const best = results[0];
      return {
        query: best.document.query,
        domain: best.document.domain,
        steps: best.document.steps,
        finalAnswer: best.document.finalAnswer,
        quality: best.document.quality
      };
    } catch (error) {
      console.error('❌ Elasticsearch trajectory search failed:', error);
      return null; // Fallback to Supabase
    }
  }

  /**
   * Load all trajectories for a domain
   */
  async loadTrajectoriesForDomain(domain: string): Promise<ExpertTrajectory[]> {
    await this.initialize();

    try {
      const response = await this.client.getClient().search<ExpertTrajectoryDocument>({
        index: EXPERT_TRAJECTORIES_INDEX,
        size: 100,
        query: {
          term: { domain }
        }
      });

      return response.hits.hits.map(hit => ({
        query: hit._source.query,
        domain: hit._source.domain,
        steps: hit._source.steps,
        finalAnswer: hit._source.finalAnswer,
        quality: hit._source.quality
      }));
    } catch (error) {
      console.error('❌ Failed to load trajectories from Elasticsearch:', error);
      return []; // Fallback to Supabase
    }
  }

  /**
   * Check if Elasticsearch is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return await this.client.indexExists(EXPERT_TRAJECTORIES_INDEX);
    } catch {
      return false;
    }
  }
}

// Singleton instance
let trajectoriesStore: ExpertTrajectoriesElasticsearchStore | null = null;

export function getExpertTrajectoriesStore(): ExpertTrajectoriesElasticsearchStore {
  if (!trajectoriesStore) {
    trajectoriesStore = new ExpertTrajectoriesElasticsearchStore();
  }
  return trajectoriesStore;
}

