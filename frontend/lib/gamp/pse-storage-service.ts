/**
 * P-S-E Triplet Storage Service
 * 
 * Stores Problem-Solution-Effect triplets extracted during chunk enrichment
 * into Supabase for graph-based pathfinding.
 * 
 * Integrates with:
 * - Contextual chunk enrichment (extracts P-S-E)
 * - Knowledge graph builder (builds graph from triplets)
 * - Graph path explorer (uses stored graph for pathfinding)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { problemSolutionEffectExtractor, type ProblemSolutionEffect } from '../rag/problem-solution-effect-extractor';
import { knowledgeGraphBuilder } from './knowledge-graph-builder';
import { graphPathExplorer, type KnowledgeGraph } from './graph-path-explorer';

export interface PSETripletRecord {
  id: string;
  chunk_id: string;
  document_id: string;
  problem: string;
  solution: string;
  effect: string;
  confidence: number;
  domain: string | null;
  entities: string[];
  relations: string[];
  metadata: any;
  problem_node_id: string | null;
  solution_node_id: string | null;
  effect_node_id: string | null;
  created_at: string;
}

export interface GraphNodeRecord {
  id: string;
  label: string;
  type: 'problem' | 'solution' | 'effect' | 'entity';
  normalized_label: string | null;
  domain: string | null;
  metadata: any;
  in_degree: number;
  out_degree: number;
}

export interface GraphEdgeRecord {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relation: string;
  weight: number;
  confidence: number;
  triplet_id: string | null;
}

export class PSEStorageService {
  private supabase: SupabaseClient | null = null;
  
  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || null;
  }
  
  /**
   * Store P-S-E triplet extracted from enriched chunk
   */
  async storeTriplet(
    triplet: ProblemSolutionEffect,
    chunkId: string,
    documentId: string
  ): Promise<string | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, storing triplet in-memory only');
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('pse_triplets')
        .insert({
          chunk_id: chunkId,
          document_id: documentId,
          problem: triplet.problem,
          solution: triplet.solution,
          effect: triplet.effect,
          confidence: triplet.confidence,
          domain: triplet.metadata?.domain || null,
          entities: triplet.metadata?.entities || [],
          relations: triplet.metadata?.relations || [],
          metadata: triplet.metadata || {},
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error storing P-S-E triplet:', error);
        return null;
      }
      
      // Update document_chunks with triplet reference
      await this.supabase
        .from('document_chunks')
        .update({ pse_triplet_id: data.id })
        .eq('id', chunkId);
      
      console.log(`✅ Stored P-S-E triplet: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Error storing P-S-E triplet:', error);
      return null;
    }
  }
  
  /**
   * Batch store multiple triplets
   */
  async batchStoreTriplets(
    triplets: Array<{ triplet: ProblemSolutionEffect; chunkId: string; documentId: string }>
  ): Promise<string[]> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, skipping batch store');
      return [];
    }
    
    const storedIds: string[] = [];
    
    for (const { triplet, chunkId, documentId } of triplets) {
      const id = await this.storeTriplet(triplet, chunkId, documentId);
      if (id) {
        storedIds.push(id);
      }
    }
    
    console.log(`✅ Batch stored ${storedIds.length}/${triplets.length} P-S-E triplets`);
    return storedIds;
  }
  
  /**
   * Load knowledge graph from stored triplets
   */
  async loadKnowledgeGraph(
    domain?: string,
    minConfidence: number = 0.7
  ): Promise<KnowledgeGraph> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, returning empty graph');
      return { nodes: [], edges: [] };
    }
    
    try {
      // Load triplets
      let query = this.supabase
        .from('pse_triplets')
        .select('*')
        .gte('confidence', minConfidence);
      
      if (domain) {
        query = query.eq('domain', domain);
      }
      
      const { data: triplets, error: tripletsError } = await query;
      
      if (tripletsError) {
        console.error('Error loading triplets:', tripletsError);
        return { nodes: [], edges: [] };
      }
      
      if (!triplets || triplets.length === 0) {
        console.log('No triplets found in database');
        return { nodes: [], edges: [] };
      }
      
      // Load graph nodes
      const nodeIds = new Set<string>();
      triplets.forEach((t: PSETripletRecord) => {
        if (t.problem_node_id) nodeIds.add(t.problem_node_id);
        if (t.solution_node_id) nodeIds.add(t.solution_node_id);
        if (t.effect_node_id) nodeIds.add(t.effect_node_id);
      });
      
      const { data: nodes, error: nodesError } = await this.supabase
        .from('graph_nodes')
        .select('*')
        .in('id', Array.from(nodeIds));
      
      if (nodesError) {
        console.error('Error loading graph nodes:', nodesError);
        return { nodes: [], edges: [] };
      }
      
      // Load graph edges
      const { data: edges, error: edgesError } = await this.supabase
        .from('graph_edges')
        .select('*')
        .in('triplet_id', triplets.map(t => t.id));
      
      if (edgesError) {
        console.error('Error loading graph edges:', edgesError);
        return { nodes: [], edges: [] };
      }
      
      // Convert to KnowledgeGraph format
      const knowledgeGraph: KnowledgeGraph = {
        nodes: (nodes || []).map((n: GraphNodeRecord) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          metadata: {
            ...n.metadata,
            domain: n.domain,
            normalized_label: n.normalized_label,
            in_degree: n.in_degree,
            out_degree: n.out_degree,
          },
        })),
        edges: (edges || []).map((e: GraphEdgeRecord) => ({
          from: e.from_node_id,
          to: e.to_node_id,
          relation: e.relation,
          weight: e.weight,
          confidence: e.confidence,
        })),
      };
      
      console.log(`✅ Loaded knowledge graph: ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`);
      
      return knowledgeGraph;
    } catch (error) {
      console.error('Error loading knowledge graph:', error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Find paths between nodes using database function
   */
  async findPathsBetweenNodes(
    startNodeId: string,
    endNodeId: string,
    maxDepth: number = 3
  ): Promise<Array<{ path_id: number; node_id: string; node_label: string; node_type: string; depth: number }>> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available, returning empty paths');
      return [];
    }
    
    try {
      const { data, error } = await this.supabase
        .rpc('find_paths_between_nodes', {
          start_node_id: startNodeId,
          end_node_id: endNodeId,
          max_depth: maxDepth,
        });
      
      if (error) {
        console.error('Error finding paths:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error finding paths:', error);
      return [];
    }
  }
  
  /**
   * Get graph statistics
   */
  async getGraphStatistics(domain?: string): Promise<{
    total_nodes: number;
    total_edges: number;
    problem_nodes: number;
    solution_nodes: number;
    effect_nodes: number;
    entity_nodes: number;
    average_node_degree: number;
  } | null> {
    if (!this.supabase) {
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .rpc('get_graph_statistics', {
          domain_filter: domain || null,
        });
      
      if (error) {
        console.error('Error getting graph statistics:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting graph statistics:', error);
      return null;
    }
  }
  
  /**
   * Get neighbors of a node
   */
  async getNodeNeighbors(nodeId: string): Promise<Array<{
    neighbor_id: string;
    neighbor_label: string;
    neighbor_type: string;
    relation: string;
    edge_confidence: number;
  }>> {
    if (!this.supabase) {
      return [];
    }
    
    try {
      const { data, error } = await this.supabase
        .rpc('get_node_neighbors', {
          node_id_param: nodeId,
        });
      
      if (error) {
        console.error('Error getting node neighbors:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting node neighbors:', error);
      return [];
    }
  }
  
  /**
   * Search triplets by query
   */
  async searchTriplets(
    query: string,
    domain?: string,
    limit: number = 20
  ): Promise<PSETripletRecord[]> {
    if (!this.supabase) {
      return [];
    }
    
    try {
      let dbQuery = this.supabase
        .from('pse_triplets')
        .select('*')
        .or(`problem.ilike.%${query}%,solution.ilike.%${query}%,effect.ilike.%${query}%`)
        .order('confidence', { ascending: false })
        .limit(limit);
      
      if (domain) {
        dbQuery = dbQuery.eq('domain', domain);
      }
      
      const { data, error } = await dbQuery;
      
      if (error) {
        console.error('Error searching triplets:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error searching triplets:', error);
      return [];
    }
  }
}

// Singleton instance (will be initialized with Supabase client)
export let pseStorageService: PSEStorageService = new PSEStorageService();

/**
 * Initialize PSE storage service with Supabase client
 */
export function initializePSEStorage(supabase: SupabaseClient): void {
  pseStorageService = new PSEStorageService(supabase);
}

