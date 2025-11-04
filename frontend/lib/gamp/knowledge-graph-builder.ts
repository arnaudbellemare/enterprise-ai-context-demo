/**
 * Knowledge Graph Builder
 * 
 * Builds and maintains a knowledge graph from enriched chunks with
 * Problem-Solution-Effect triplets.
 * 
 * Supports:
 * - Graph construction from enriched chunks
 * - Node/edge deduplication and normalization
 * - Graph persistence and retrieval
 * - Query-time graph augmentation
 */

import { problemSolutionEffectExtractor, type ProblemSolutionEffect } from '../rag/problem-solution-effect-extractor';
import { graphPathExplorer, type KnowledgeGraph, type GraphNode, type GraphEdge } from './graph-path-explorer';
import { pseStorageService } from './pse-storage-service';

export interface EnrichedChunkWithPSE {
  id: string;
  content: string;
  enrichedContent?: string;
  problemSolutionEffect?: ProblemSolutionEffect;
  metadata?: {
    domain?: string;
    documentId?: string;
    chunkIndex?: number;
  };
}

export interface GraphStatistics {
  totalNodes: number;
  totalEdges: number;
  problemNodes: number;
  solutionNodes: number;
  effectNodes: number;
  entityNodes: number;
  domains: string[];
  averageNodeDegree: number;
}

export class KnowledgeGraphBuilder {
  private graph: KnowledgeGraph = {
    nodes: [],
    edges: [],
  };
  private nodeIndex: Map<string, GraphNode> = new Map(); // nodeId -> node
  private edgeIndex: Map<string, GraphEdge> = new Map(); // "from->to" -> edge
  private entityNormalization: Map<string, string> = new Map(); // alias -> canonical
  
  /**
   * Build knowledge graph from enriched chunks
   * Optionally loads from database if triplets are already stored
   */
  async buildFromEnrichedChunks(
    chunks: EnrichedChunkWithPSE[],
    useStoredTriplets: boolean = true
  ): Promise<KnowledgeGraph> {
    console.log(`📊 Building knowledge graph from ${chunks.length} enriched chunks...`);
    
    let validTriplets: ProblemSolutionEffect[] = [];
    
    // Try to load from database first (if enabled)
    if (useStoredTriplets) {
      try {
        const domain = chunks[0]?.metadata?.domain;
        const storedGraph = await pseStorageService.loadKnowledgeGraph(domain, 0.7);
        
        if (storedGraph.nodes.length > 0) {
          console.log(`   ✅ Loaded ${storedGraph.nodes.length} nodes from database`);
          this.graph = storedGraph;
          return storedGraph;
        }
      } catch (error) {
        console.warn('⚠️ Failed to load from database, building from chunks:', error);
      }
    }
    
    // Extract P-S-E triplets if not already present
    const triplets = await Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.problemSolutionEffect) {
          return chunk.problemSolutionEffect;
        }
        
        // Extract from chunk content
        const triplet = await problemSolutionEffectExtractor.extractFromChunk(
          chunk.content,
          chunk.id,
          chunk.metadata?.domain
        );
        
        return triplet;
      })
    );
    
    validTriplets = triplets.filter(t => t !== null) as ProblemSolutionEffect[];
    console.log(`   ✅ Extracted ${validTriplets.length} valid P-S-E triplets`);
    
    // Build graph from triplets
    await this.addTripletsToGraph(validTriplets);
    
    // Normalize entities (handle aliases like "VR1" -> "TRPV1")
    this.normalizeEntities();
    
    // Deduplicate nodes and edges
    this.deduplicateGraph();
    
    console.log(`   ✅ Knowledge graph built: ${this.graph.nodes.length} nodes, ${this.graph.edges.length} edges`);
    
    return this.graph;
  }
  
  /**
   * Load knowledge graph from database
   */
  async loadFromDatabase(domain?: string, minConfidence: number = 0.7): Promise<KnowledgeGraph> {
    const graph = await pseStorageService.loadKnowledgeGraph(domain, minConfidence);
    this.graph = graph;
    return graph;
  }
  
  /**
   * Add Problem-Solution-Effect triplets to graph
   */
  private async addTripletsToGraph(triplets: ProblemSolutionEffect[]): Promise<void> {
    for (let i = 0; i < triplets.length; i++) {
      const triplet = triplets[i];
      
      // Create nodes
      const problemNode = this.createOrGetNode(
        `problem_${i}`,
        triplet.problem,
        'problem',
        triplet.metadata
      );
      
      const solutionNode = this.createOrGetNode(
        `solution_${i}`,
        triplet.solution,
        'solution',
        triplet.metadata
      );
      
      const effectNode = this.createOrGetNode(
        `effect_${i}`,
        triplet.effect,
        'effect',
        triplet.metadata
      );
      
      // Create edges
      this.createOrGetEdge(
        problemNode.id,
        solutionNode.id,
        'studied_via',
        triplet.confidence
      );
      
      // Determine solution-effect relation
      const relation = this.inferSolutionEffectRelation(triplet.solution, triplet.effect);
      this.createOrGetEdge(
        solutionNode.id,
        effectNode.id,
        relation,
        triplet.confidence
      );
      
      // Add entity nodes from metadata
      if (triplet.metadata?.entities) {
        for (const entity of triplet.metadata.entities) {
          const entityNode = this.createOrGetNode(
            `entity_${entity.replace(/\s+/g, '_')}`,
            entity,
            'entity',
            triplet.metadata
          );
          
          // Link entities to relevant nodes
          if (triplet.solution.includes(entity)) {
            this.createOrGetEdge(entityNode.id, solutionNode.id, 'is_part_of', 0.8);
          }
          if (triplet.effect.includes(entity)) {
            this.createOrGetEdge(solutionNode.id, entityNode.id, 'affects', 0.8);
          }
        }
      }
    }
  }
  
  /**
   * Create or get existing node
   */
  private createOrGetNode(
    id: string,
    label: string,
    type: 'problem' | 'solution' | 'effect' | 'entity',
    metadata?: any
  ): GraphNode {
    // Check if node with same label already exists
    const existingNode = Array.from(this.nodeIndex.values()).find(
      n => n.label.toLowerCase() === label.toLowerCase() && n.type === type
    );
    
    if (existingNode) {
      return existingNode;
    }
    
    const node: GraphNode = {
      id,
      label: label.trim(),
      type,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };
    
    this.nodeIndex.set(id, node);
    this.graph.nodes.push(node);
    
    return node;
  }
  
  /**
   * Create or get existing edge
   */
  private createOrGetEdge(
    from: string,
    to: string,
    relation: string,
    confidence: number = 1.0
  ): GraphEdge {
    const edgeKey = `${from}->${to}`;
    
    // Check if edge already exists
    if (this.edgeIndex.has(edgeKey)) {
      const existing = this.edgeIndex.get(edgeKey)!;
      // Update confidence if higher
      if (confidence > (existing.confidence || 0)) {
        existing.confidence = confidence;
      }
      return existing;
    }
    
    const edge: GraphEdge = {
      from,
      to,
      relation,
      confidence,
      weight: confidence, // Use confidence as weight
    };
    
    this.edgeIndex.set(edgeKey, edge);
    this.graph.edges.push(edge);
    
    return edge;
  }
  
  /**
   * Infer solution-effect relation from text
   */
  private inferSolutionEffectRelation(solution: string, effect: string): string {
    const effectLower = effect.toLowerCase();
    
    if (effectLower.includes('activate') || effectLower.includes('enhance') || effectLower.includes('increase')) {
      return 'causes';
    } else if (effectLower.includes('inhibit') || effectLower.includes('reduce') || effectLower.includes('decrease')) {
      return 'inhibits';
    } else if (effectLower.includes('discover') || effectLower.includes('identify') || effectLower.includes('find')) {
      return 'reveals';
    } else {
      return 'produces';
    }
  }
  
  /**
   * Normalize entities (handle aliases and synonyms)
   */
  private normalizeEntities(): void {
    // Common scientific aliases
    const aliases: Record<string, string> = {
      'VR1': 'TRPV1',
      'VR-1': 'TRPV1',
      'vanilloid receptor 1': 'TRPV1',
      'TRPM8': 'TRPM8',
      'CMR1': 'TRPM8',
      'cold receptor': 'TRPM8',
    };
    
    for (const [alias, canonical] of Object.entries(aliases)) {
      this.entityNormalization.set(alias.toLowerCase(), canonical);
    }
    
    // Apply normalization to nodes
    for (const node of this.graph.nodes) {
      const normalized = this.normalizeEntityName(node.label);
      if (normalized !== node.label) {
        // Update node label if normalized
        node.label = normalized;
        node.metadata = {
          ...node.metadata,
          originalLabel: node.label,
          normalized: true,
        };
      }
    }
  }
  
  /**
   * Normalize a single entity name
   */
  private normalizeEntityName(name: string): string {
    const lower = name.toLowerCase();
    
    // Check normalization map
    if (this.entityNormalization.has(lower)) {
      return this.entityNormalization.get(lower)!;
    }
    
    // Check if name contains any alias
    for (const [alias, canonical] of this.entityNormalization.entries()) {
      if (lower.includes(alias)) {
        return canonical;
      }
    }
    
    return name; // Return original if no normalization found
  }
  
  /**
   * Deduplicate nodes and edges
   */
  private deduplicateGraph(): void {
    // Deduplicate nodes by label and type
    const nodeMap = new Map<string, GraphNode>();
    
    for (const node of this.graph.nodes) {
      const key = `${node.type}:${node.label.toLowerCase()}`;
      
      if (!nodeMap.has(key)) {
        nodeMap.set(key, node);
      } else {
        // Merge metadata
        const existing = nodeMap.get(key)!;
        existing.metadata = {
          ...existing.metadata,
          ...node.metadata,
        };
      }
    }
    
    this.graph.nodes = Array.from(nodeMap.values());
    
    // Update node index
    this.nodeIndex.clear();
    for (const node of this.graph.nodes) {
      this.nodeIndex.set(node.id, node);
    }
    
    // Deduplicate edges
    const edgeMap = new Map<string, GraphEdge>();
    
    for (const edge of this.graph.edges) {
      const key = `${edge.from}->${edge.to}:${edge.relation}`;
      
      if (!edgeMap.has(key)) {
        edgeMap.set(key, edge);
      } else {
        // Update confidence if higher
        const existing = edgeMap.get(key)!;
        if ((edge.confidence || 0) > (existing.confidence || 0)) {
          existing.confidence = edge.confidence;
          existing.weight = edge.weight;
        }
      }
    }
    
    this.graph.edges = Array.from(edgeMap.values());
    
    // Update edge index
    this.edgeIndex.clear();
    for (const edge of this.graph.edges) {
      this.edgeIndex.set(`${edge.from}->${edge.to}`, edge);
    }
  }
  
  /**
   * Get graph statistics
   */
  getStatistics(): GraphStatistics {
    const problemNodes = this.graph.nodes.filter(n => n.type === 'problem').length;
    const solutionNodes = this.graph.nodes.filter(n => n.type === 'solution').length;
    const effectNodes = this.graph.nodes.filter(n => n.type === 'effect').length;
    const entityNodes = this.graph.nodes.filter(n => n.type === 'entity').length;
    
    const domains = new Set<string>();
    for (const node of this.graph.nodes) {
      if (node.metadata?.domain) {
        domains.add(node.metadata.domain);
      }
    }
    
    // Calculate average node degree
    const nodeDegrees = new Map<string, number>();
    for (const edge of this.graph.edges) {
      nodeDegrees.set(edge.from, (nodeDegrees.get(edge.from) || 0) + 1);
      nodeDegrees.set(edge.to, (nodeDegrees.get(edge.to) || 0) + 1);
    }
    
    const avgDegree = this.graph.nodes.length > 0
      ? Array.from(nodeDegrees.values()).reduce((a, b) => a + b, 0) / this.graph.nodes.length
      : 0;
    
    return {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
      problemNodes,
      solutionNodes,
      effectNodes,
      entityNodes,
      domains: Array.from(domains),
      averageNodeDegree: avgDegree,
    };
  }
  
  /**
   * Get the built graph
   */
  getGraph(): KnowledgeGraph {
    return this.graph;
  }
  
  /**
   * Clear graph
   */
  clearGraph(): void {
    this.graph = { nodes: [], edges: [] };
    this.nodeIndex.clear();
    this.edgeIndex.clear();
    this.entityNormalization.clear();
  }
  
  /**
   * Export graph to JSON
   */
  exportGraph(): string {
    return JSON.stringify({
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      statistics: this.getStatistics(),
      normalizedEntities: Array.from(this.entityNormalization.entries()),
    }, null, 2);
  }
  
  /**
   * Find nodes by query
   */
  findNodes(query: string, type?: string): GraphNode[] {
    const queryLower = query.toLowerCase();
    
    return this.graph.nodes.filter(node => {
      const matchesType = !type || node.type === type;
      const matchesQuery = node.label.toLowerCase().includes(queryLower);
      return matchesType && matchesQuery;
    });
  }
  
  /**
   * Get neighbors of a node
   */
  getNeighbors(nodeId: string): { node: GraphNode; edge: GraphEdge }[] {
    const neighbors: { node: GraphNode; edge: GraphEdge }[] = [];
    
    for (const edge of this.graph.edges) {
      if (edge.from === nodeId) {
        const node = this.nodeIndex.get(edge.to);
        if (node) {
          neighbors.push({ node, edge });
        }
      } else if (edge.to === nodeId) {
        const node = this.nodeIndex.get(edge.from);
        if (node) {
          neighbors.push({ node, edge });
        }
      }
    }
    
    return neighbors;
  }
}

// Singleton instance
export const knowledgeGraphBuilder = new KnowledgeGraphBuilder();

