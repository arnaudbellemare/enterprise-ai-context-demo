/**
 * Graph-Based Path Explorer
 * 
 * Based on GAMP framework: Combines graph algorithms (BFS, genetic algorithms)
 * with LLM semantic guidance for discovering non-obvious paths.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'problem' | 'solution' | 'effect' | 'entity';
  metadata?: any;
  embedding?: number[]; // For hybrid retrieval
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
  weight?: number;
  confidence?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Path {
  nodes: GraphNode[];
  edges: GraphEdge[];
  score: number;
  novelty?: number;
  length: number;
}

export interface ExplorationConfig {
  maxDepth: number;
  maxPaths: number;
  useBFS: boolean;
  useLLMGuided: boolean;
  useGeneticAlgorithm: boolean;
  noveltyWeight: number; // 0-1: How much to weight novelty vs. relevance
}

export class GraphPathExplorer {
  private model: string = 'gemma3:4b';
  private graph: KnowledgeGraph | null = null;
  
  /**
   * Set the knowledge graph to explore
   */
  setKnowledgeGraph(graph: KnowledgeGraph): void {
    this.graph = graph;
  }
  
  /**
   * Get graph context for a node (neighbors, similar nodes) to help LLM predictions
   */
  private getGraphContextForNode(node: GraphNode): string {
    if (!this.graph) return '';
    
    // Get direct neighbors
    const outgoingEdges = this.graph.edges.filter(e => e.from === node.id);
    const incomingEdges = this.graph.edges.filter(e => e.to === node.id);
    
    const neighbors: string[] = [];
    
    for (const edge of outgoingEdges.slice(0, 5)) {
      const neighbor = this.graph.nodes.find(n => n.id === edge.to);
      if (neighbor) {
        neighbors.push(`${neighbor.label} (via ${edge.relation})`);
      }
    }
    
    for (const edge of incomingEdges.slice(0, 5)) {
      const neighbor = this.graph.nodes.find(n => n.id === edge.from);
      if (neighbor) {
        neighbors.push(`${neighbor.label} (via ${edge.relation})`);
      }
    }
    
    // Get similar nodes (same type)
    const similarNodes = this.graph.nodes
      .filter(n => n.type === node.type && n.id !== node.id)
      .slice(0, 5)
      .map(n => n.label);
    
    return `Direct Neighbors: ${neighbors.join(', ')}\nSimilar Nodes: ${similarNodes.join(', ')}`;
  }
  
  /**
   * Explore paths from a starting node using multiple strategies
   */
  async explorePaths(
    startNodeId: string,
    query: string,
    config: ExplorationConfig = {
      maxDepth: 3,
      maxPaths: 20,
      useBFS: true,
      useLLMGuided: true,
      useGeneticAlgorithm: false,
      noveltyWeight: 0.3,
    }
  ): Promise<Path[]> {
    if (!this.graph) {
      throw new Error('Knowledge graph not set. Call setKnowledgeGraph() first.');
    }
    
    const startNode = this.graph.nodes.find(n => n.id === startNodeId);
    if (!startNode) {
      throw new Error(`Start node ${startNodeId} not found in graph`);
    }
    
    const allPaths: Path[] = [];
    
    // 1. BFS for direct associations
    if (config.useBFS) {
      const bfsPaths = this.breadthFirstSearch(startNodeId, config.maxDepth, config.maxPaths);
      allPaths.push(...bfsPaths);
    }
    
    // 2. LLM-guided semantic exploration
    if (config.useLLMGuided) {
      const semanticPaths = await this.llmGuidedSearch(startNodeId, query, config.maxDepth);
      allPaths.push(...semanticPaths);
    }
    
    // 3. Genetic algorithm for optimization (if enabled)
    if (config.useGeneticAlgorithm && allPaths.length > 0) {
      const optimizedPaths = this.geneticAlgorithmOptimization(allPaths, config);
      allPaths.push(...optimizedPaths);
    }
    
    // Deduplicate and rank paths
    const uniquePaths = this.deduplicatePaths(allPaths);
    const rankedPaths = this.rankPaths(uniquePaths, query, config.noveltyWeight);
    
    return rankedPaths.slice(0, config.maxPaths);
  }
  
  /**
   * Breadth-first search for direct associations
   */
  private breadthFirstSearch(
    startNodeId: string,
    maxDepth: number,
    maxPaths: number
  ): Path[] {
    if (!this.graph) return [];
    
    const paths: Path[] = [];
    const queue: Array<{ nodeId: string; path: GraphNode[]; depth: number }> = [
      { nodeId: startNodeId, path: [this.graph.nodes.find(n => n.id === startNodeId)!], depth: 0 }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0 && paths.length < maxPaths) {
      const { nodeId, path, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      
      const visitedKey = `${nodeId}_${depth}`;
      if (visited.has(visitedKey)) continue;
      visited.add(visitedKey);
      
      // Find all edges from this node
      const outgoingEdges = this.graph.edges.filter(e => e.from === nodeId);
      
      for (const edge of outgoingEdges) {
        const nextNode = this.graph.nodes.find(n => n.id === edge.to);
        if (!nextNode) continue;
        
        const newPath = [...path, nextNode];
        const pathEdges = this.getPathEdges(newPath);
        
        paths.push({
          nodes: newPath,
          edges: pathEdges,
          score: this.calculatePathScore(newPath, pathEdges),
          length: newPath.length,
        });
        
        // Add to queue for next depth
        if (depth < maxDepth - 1) {
          queue.push({ nodeId: edge.to, path: newPath, depth: depth + 1 });
        }
      }
    }
    
    return paths;
  }
  
  /**
   * LLM-guided semantic search for non-obvious connections
   * Enhanced to find indirect paths (2-3 hops) that represent novel connections
   */
  private async llmGuidedSearch(
    startNodeId: string,
    query: string,
    maxDepth: number
  ): Promise<Path[]> {
    if (!this.graph) return [];
    
    const startNode = this.graph.nodes.find(n => n.id === startNodeId);
    if (!startNode) return [];
    
    try {
      // Ask LLM to predict related entities (non-obvious connections)
      const predictions = await this.llmPredictRelatedEntities(startNode, query);
      
      console.log(`   🤖 LLM predicted ${predictions.length} non-obvious connections`);
      
      // Search graph for predicted entities and find paths
      const paths: Path[] = [];
      const foundEntities = new Set<string>(); // Track found entities to avoid duplicates
      
      for (const predictedEntity of predictions.slice(0, 15)) { // Limit to top 15 predictions
        // Flexible matching: check if any node label contains predicted entity or vice versa
        const targetNodes = this.graph.nodes.filter(n => {
          const nodeLower = n.label.toLowerCase();
          const predLower = predictedEntity.toLowerCase();
          
          // Check for substring match or similarity
          return nodeLower.includes(predLower) || 
                 predLower.includes(nodeLower) ||
                 nodeLower.split(/\s+/).some(word => predLower.includes(word)) ||
                 predLower.split(/\s+/).some(word => nodeLower.includes(word));
        });
        
        for (const targetNode of targetNodes) {
          if (foundEntities.has(targetNode.id)) continue;
          
          // Find paths from start to target (prefer 2-3 hop paths for non-obvious connections)
          const path = this.findShortestPath(startNodeId, targetNode.id, maxDepth);
          
          if (path && path.length >= 2) { // Prefer paths with at least 2 hops
            paths.push(path);
            foundEntities.add(targetNode.id);
            
            // Add novelty score based on path length (longer = more novel)
            path.novelty = Math.min(1.0, 0.5 + (path.length - 2) * 0.2);
          }
        }
      }
      
      // Also try finding paths through intermediate nodes (2-hop exploration)
      const indirectPaths = await this.findIndirectPaths(startNodeId, query, maxDepth);
      paths.push(...indirectPaths);
      
      console.log(`   ✅ LLM-guided search found ${paths.length} paths`);
      
      return paths;
    } catch (error) {
      console.warn('LLM-guided search failed:', error);
      return [];
    }
  }
  
  /**
   * Find indirect paths (2-3 hops) that might represent novel connections
   */
  private async findIndirectPaths(
    startNodeId: string,
    query: string,
    maxDepth: number
  ): Promise<Path[]> {
    if (!this.graph) return [];
    
    const paths: Path[] = [];
    const startNode = this.graph.nodes.find(n => n.id === startNodeId);
    if (!startNode) return paths;
    
    // Get neighbors of start node (1-hop)
    const oneHopNeighbors = this.graph.edges
      .filter(e => e.from === startNodeId)
      .map(e => this.graph!.nodes.find(n => n.id === e.to))
      .filter(n => n !== undefined) as GraphNode[];
    
    // For each 1-hop neighbor, explore 2-hop connections
    for (const neighbor of oneHopNeighbors.slice(0, 5)) { // Limit to avoid explosion
      const twoHopNeighbors = this.graph.edges
        .filter(e => e.from === neighbor.id)
        .map(e => this.graph!.nodes.find(n => n.id === e.to))
        .filter(n => n !== undefined && n.id !== startNodeId) as GraphNode[];
      
      // Ask LLM if any of these 2-hop neighbors are interesting given the query
      for (const twoHopNode of twoHopNeighbors.slice(0, 3)) {
        const isInteresting = await this.llmAssessConnectionInterest(
          startNode,
          twoHopNode,
          query
        );
        
        if (isInteresting) {
          const path = this.findShortestPath(startNodeId, twoHopNode.id, maxDepth);
          if (path) {
            paths.push(path);
          }
        }
      }
    }
    
    return paths;
  }
  
  /**
   * LLM assesses if a connection is interesting/non-obvious
   */
  private async llmAssessConnectionInterest(
    startNode: GraphNode,
    targetNode: GraphNode,
    query: string
  ): Promise<boolean> {
    const prompt = `Assess if this connection represents a non-obvious or interesting scientific relationship.

Start Node: ${startNode.label} (${startNode.type})
Target Node: ${targetNode.label} (${targetNode.type})
Query: ${query}

Is this connection:
1. Non-obvious (not immediately apparent)?
2. Scientifically interesting given the query?
3. Potentially novel or unexpected?

Respond with JSON:
{
  "interesting": true/false,
  "reasoning": "brief explanation"
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert at assessing scientific connections. Respond only with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 150,
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return false;
      
      const result = JSON.parse(jsonMatch[0]);
      return result.interesting === true;
    } catch (error) {
      console.warn('Connection interest assessment failed:', error);
      return false; // Default to not interesting if assessment fails
    }
  }
  
  /**
   * LLM predicts related entities based on semantic understanding
   * Enhanced with context from graph structure
   */
  private async llmPredictRelatedEntities(
    node: GraphNode,
    query: string
  ): Promise<string[]> {
    // Get graph context (neighbors, similar nodes)
    const graphContext = this.getGraphContextForNode(node);
    
    const prompt = `You are an expert at discovering non-obvious connections in scientific knowledge graphs.

Given a node and its context, predict entities that might be functionally related through NON-OBVIOUS connections (not direct neighbors).

Node: ${node.label} (Type: ${node.type})
${graphContext ? `Graph Context:\n${graphContext}\n` : ''}
Query: ${query}

Think creatively about:
1. Functionally complementary entities (e.g., if node is a receptor, what ligands might interact?)
2. Entities in the same pathway but not directly connected
3. Entities that might be discovered through similar mechanisms
4. Entities that could be investigated using similar methods
5. Entities that might have synergistic effects

Predict 5-10 entities that represent NON-OBVIOUS connections (avoid predicting direct neighbors):
- Focus on entities that require reasoning to connect
- Consider indirect relationships (2-3 hops away)
- Think about what a scientist might discover through creative exploration

Respond with JSON array:
["entity1", "entity2", ...]

Each entity should be a specific, concrete scientific term (e.g., "TRPV1 ion channel", not just "ion channel").`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert at predicting knowledge graph connections. Respond only with valid JSON arrays."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Extract JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found');
      }
      
      const entities = JSON.parse(jsonMatch[0]);
      return Array.isArray(entities) ? entities : [];
    } catch (error) {
      console.warn('LLM prediction failed:', error);
      return [];
    }
  }
  
  /**
   * Find shortest path between two nodes using Dijkstra-like algorithm
   */
  private findShortestPath(
    startId: string,
    targetId: string,
    maxDepth: number
  ): Path | null {
    if (!this.graph) return null;
    
    const queue: Array<{ nodeId: string; path: GraphNode[]; depth: number }> = [
      { nodeId: startId, path: [this.graph.nodes.find(n => n.id === startId)!], depth: 0 }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { nodeId, path, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      
      if (nodeId === targetId) {
        const pathEdges = this.getPathEdges(path);
        return {
          nodes: path,
          edges: pathEdges,
          score: this.calculatePathScore(path, pathEdges),
          length: path.length,
        };
      }
      
      const visitedKey = `${nodeId}_${depth}`;
      if (visited.has(visitedKey)) continue;
      visited.add(visitedKey);
      
      // Find outgoing edges
      const outgoingEdges = this.graph.edges.filter(e => e.from === nodeId);
      
      for (const edge of outgoingEdges) {
        const nextNode = this.graph.nodes.find(n => n.id === edge.to);
        if (!nextNode) continue;
        
        queue.push({
          nodeId: edge.to,
          path: [...path, nextNode],
          depth: depth + 1,
        });
      }
    }
    
    return null; // No path found
  }
  
  /**
   * Genetic algorithm optimization (simplified)
   */
  private geneticAlgorithmOptimization(
    initialPaths: Path[],
    config: ExplorationConfig
  ): Path[] {
    // Simplified GA: mutate paths by swapping nodes or adding connections
    const mutatedPaths: Path[] = [];
    
    for (const path of initialPaths.slice(0, 5)) { // Take top 5 paths
      // Mutation: try adding a connected node
      if (path.nodes.length < config.maxDepth && this.graph) {
        const lastNode = path.nodes[path.nodes.length - 1];
        const connectedEdges = this.graph.edges.filter(e => e.from === lastNode.id);
        
        if (connectedEdges.length > 0) {
          const randomEdge = connectedEdges[Math.floor(Math.random() * connectedEdges.length)];
          const nextNode = this.graph.nodes.find(n => n.id === randomEdge.to);
          
          if (nextNode && !path.nodes.some(n => n.id === nextNode.id)) {
            const newPath = {
              nodes: [...path.nodes, nextNode],
              edges: [...path.edges, randomEdge],
              score: this.calculatePathScore([...path.nodes, nextNode], [...path.edges, randomEdge]),
              length: path.length + 1,
            };
            mutatedPaths.push(newPath);
          }
        }
      }
    }
    
    return mutatedPaths;
  }
  
  /**
   * Get edges for a path of nodes
   */
  private getPathEdges(path: GraphNode[]): GraphEdge[] {
    if (!this.graph || path.length < 2) return [];
    
    const edges: GraphEdge[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = this.graph.edges.find(
        e => e.from === path[i].id && e.to === path[i + 1].id
      );
      if (edge) {
        edges.push(edge);
      }
    }
    
    return edges;
  }
  
  /**
   * Calculate path score based on edge weights and confidence
   */
  private calculatePathScore(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (edges.length === 0) return 0.5; // Default score
    
    const avgWeight = edges.reduce((sum, e) => sum + (e.weight || 1.0), 0) / edges.length;
    const avgConfidence = edges.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / edges.length;
    
    return (avgWeight * 0.6 + avgConfidence * 0.4);
  }
  
  /**
   * Deduplicate paths
   */
  private deduplicatePaths(paths: Path[]): Path[] {
    const seen = new Set<string>();
    const unique: Path[] = [];
    
    for (const path of paths) {
      const key = path.nodes.map(n => n.id).join('->');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(path);
      }
    }
    
    return unique;
  }
  
  /**
   * Rank paths by relevance and novelty
   */
  private rankPaths(
    paths: Path[],
    query: string,
    noveltyWeight: number
  ): Path[] {
    return paths
      .map(path => {
        // Calculate relevance score (simple keyword matching)
        const relevance = this.calculateRelevance(path, query);
        
        // Combine relevance and novelty
        const finalScore = (1 - noveltyWeight) * relevance + noveltyWeight * (path.novelty || 0.5);
        
        return {
          ...path,
          score: finalScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Calculate relevance score for a path based on query
   */
  private calculateRelevance(path: Path, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let matches = 0;
    
    for (const node of path.nodes) {
      const nodeText = node.label.toLowerCase();
      for (const term of queryTerms) {
        if (nodeText.includes(term)) {
          matches++;
        }
      }
    }
    
    return Math.min(1.0, matches / queryTerms.length);
  }
}

// Singleton instance
export const graphPathExplorer = new GraphPathExplorer();

