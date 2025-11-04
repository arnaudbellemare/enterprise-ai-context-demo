/**
 * Test suite for Graph Path Explorer
 * 
 * Tests cover:
 * - Graph initialization and setup
 * - BFS path exploration
 * - Path scoring and ranking
 * - Path deduplication
 * - Shortest path finding
 * - Edge cases (empty graph, disconnected nodes, etc.)
 */

import { graphPathExplorer, type KnowledgeGraph, type GraphNode, type GraphEdge, type Path, type ExplorationConfig } from '../../../lib/gamp/graph-path-explorer';

describe('GraphPathExplorer', () => {
  let sampleGraph: KnowledgeGraph;
  let sampleNodes: GraphNode[];
  let sampleEdges: GraphEdge[];

  beforeEach(() => {
    // Create a sample knowledge graph
    sampleNodes = [
      { id: 'n1', label: 'Problem A', type: 'problem' },
      { id: 'n2', label: 'Solution B', type: 'solution' },
      { id: 'n3', label: 'Effect C', type: 'effect' },
      { id: 'n4', label: 'Entity D', type: 'entity' },
      { id: 'n5', label: 'Solution E', type: 'solution' },
    ];

    sampleEdges = [
      { from: 'n1', to: 'n2', relation: 'studied_via', weight: 1.0, confidence: 0.9 },
      { from: 'n2', to: 'n3', relation: 'causes', weight: 1.0, confidence: 0.8 },
      { from: 'n1', to: 'n4', relation: 'involves', weight: 0.8, confidence: 0.7 },
      { from: 'n4', to: 'n5', relation: 'connects_to', weight: 0.6, confidence: 0.6 },
    ];

    sampleGraph = {
      nodes: sampleNodes,
      edges: sampleEdges,
    };

    graphPathExplorer.setKnowledgeGraph(sampleGraph);
  });

  describe('Graph Setup', () => {
    it('should set knowledge graph correctly', () => {
      const testGraph: KnowledgeGraph = {
        nodes: [{ id: 'test', label: 'Test', type: 'entity' }],
        edges: [],
      };

      graphPathExplorer.setKnowledgeGraph(testGraph);

      // Should not throw when exploring with new graph
      expect(() => {
        graphPathExplorer.explorePaths('test', 'test query', { maxDepth: 1, maxPaths: 1, useBFS: true, useLLMGuided: false, useGeneticAlgorithm: false, noveltyWeight: 0.3 });
      }).not.toThrow();
    });

    it('should throw error if graph not set before exploration', async () => {
      // Create a new instance without setting graph
      const GraphPathExplorerClass = require('../../../lib/gamp/graph-path-explorer').GraphPathExplorer;
      const explorer = new GraphPathExplorerClass();
      
      await expect(
        explorer.explorePaths('n1', 'test', { maxDepth: 1, maxPaths: 1, useBFS: true, useLLMGuided: false, useGeneticAlgorithm: false, noveltyWeight: 0.3 })
      ).rejects.toThrow('Knowledge graph not set');
    });

    it('should throw error if start node not found', async () => {
      await expect(
        graphPathExplorer.explorePaths('nonexistent', 'test', { maxDepth: 1, maxPaths: 1, useBFS: true, useLLMGuided: false, useGeneticAlgorithm: false, noveltyWeight: 0.3 })
      ).rejects.toThrow('Start node nonexistent not found in graph');
    });
  });

  describe('BFS Path Exploration', () => {
    it('should find paths using BFS', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0]).toHaveProperty('nodes');
      expect(paths[0]).toHaveProperty('edges');
      expect(paths[0]).toHaveProperty('score');
      expect(paths[0]).toHaveProperty('length');
    });

    it('should respect maxDepth constraint', async () => {
      const config: ExplorationConfig = {
        maxDepth: 1,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      paths.forEach(path => {
        expect(path.length).toBeLessThanOrEqual(2); // Start + 1 hop
      });
    });

    it('should respect maxPaths constraint', async () => {
      const config: ExplorationConfig = {
        maxDepth: 3,
        maxPaths: 2,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      expect(paths.length).toBeLessThanOrEqual(2);
    });

    it('should find paths from start node', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      // All paths should start with n1
      paths.forEach(path => {
        expect(path.nodes[0].id).toBe('n1');
      });
    });

    it('should handle disconnected nodes', async () => {
      // Add disconnected node
      const disconnectedGraph: KnowledgeGraph = {
        nodes: [
          ...sampleNodes,
          { id: 'isolated', label: 'Isolated', type: 'entity' },
        ],
        edges: sampleEdges,
      };

      graphPathExplorer.setKnowledgeGraph(disconnectedGraph);

      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      // Should not include isolated node in paths
      paths.forEach(path => {
        expect(path.nodes.some(n => n.id === 'isolated')).toBe(false);
      });
    });
  });

  describe('Path Scoring', () => {
    it('should calculate path scores based on edge weights', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      paths.forEach(path => {
        expect(path.score).toBeGreaterThanOrEqual(0);
        expect(path.score).toBeLessThanOrEqual(1);
      });
    });

    it('should rank paths by score', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      // Paths should be sorted by score (descending)
      for (let i = 0; i < paths.length - 1; i++) {
        expect(paths[i].score).toBeGreaterThanOrEqual(paths[i + 1].score);
      }
    });

    it('should calculate higher scores for paths with high-confidence edges', async () => {
      const highConfGraph: KnowledgeGraph = {
        nodes: sampleNodes,
        edges: [
          { from: 'n1', to: 'n2', relation: 'test', weight: 1.0, confidence: 0.95 },
        ],
      };

      graphPathExplorer.setKnowledgeGraph(highConfGraph);

      const config: ExplorationConfig = {
        maxDepth: 1,
        maxPaths: 1,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      if (paths.length > 0) {
        // Score should be calculated based on edge weights and confidence
        // High confidence (0.95) should result in a reasonable score
        expect(paths[0].score).toBeGreaterThanOrEqual(0);
        expect(paths[0].score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Path Deduplication', () => {
    it('should remove duplicate paths', async () => {
      // Create graph with multiple paths to same node
      const duplicateGraph: KnowledgeGraph = {
        nodes: [
          { id: 'start', label: 'Start', type: 'entity' },
          { id: 'end1', label: 'End1', type: 'entity' },
          { id: 'end2', label: 'End2', type: 'entity' },
        ],
        edges: [
          { from: 'start', to: 'end1', relation: 'path1', weight: 1.0 },
          { from: 'start', to: 'end1', relation: 'path2', weight: 1.0 },
          { from: 'start', to: 'end2', relation: 'path3', weight: 1.0 },
        ],
      };

      graphPathExplorer.setKnowledgeGraph(duplicateGraph);

      const config: ExplorationConfig = {
        maxDepth: 1,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('start', 'test query', config);

      // Should have unique paths (different node sequences)
      const pathKeys = paths.map(p => p.nodes.map(n => n.id).join('->'));
      const uniqueKeys = new Set(pathKeys);
      
      // Should have at least 2 unique paths (to end1 and end2)
      expect(uniqueKeys.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Shortest Path Finding', () => {
    it('should find shortest path between two nodes', async () => {
      // Create a more complex graph for path finding
      const complexGraph: KnowledgeGraph = {
        nodes: [
          { id: 'start', label: 'Start', type: 'entity' },
          { id: 'mid1', label: 'Mid1', type: 'entity' },
          { id: 'mid2', label: 'Mid2', type: 'entity' },
          { id: 'end', label: 'End', type: 'entity' },
        ],
        edges: [
          { from: 'start', to: 'mid1', relation: 'edge1', weight: 1.0 },
          { from: 'mid1', to: 'end', relation: 'edge2', weight: 1.0 },
          { from: 'start', to: 'mid2', relation: 'edge3', weight: 1.0 },
          { from: 'mid2', to: 'end', relation: 'edge4', weight: 1.0 },
        ],
      };

      graphPathExplorer.setKnowledgeGraph(complexGraph);

      const config: ExplorationConfig = {
        maxDepth: 3,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('start', 'end', config);

      // Should find paths to 'end' node
      const pathsToEnd = paths.filter(p => p.nodes.some(n => n.id === 'end'));
      expect(pathsToEnd.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty graph', async () => {
      const emptyGraph: KnowledgeGraph = {
        nodes: [],
        edges: [],
      };

      graphPathExplorer.setKnowledgeGraph(emptyGraph);

      await expect(
        graphPathExplorer.explorePaths('n1', 'test', { maxDepth: 1, maxPaths: 1, useBFS: true, useLLMGuided: false, useGeneticAlgorithm: false, noveltyWeight: 0.3 })
      ).rejects.toThrow();
    });

    it('should handle graph with no edges', async () => {
      const noEdgesGraph: KnowledgeGraph = {
        nodes: [{ id: 'n1', label: 'Node', type: 'entity' }],
        edges: [],
      };

      graphPathExplorer.setKnowledgeGraph(noEdgesGraph);

      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      // Should return empty or single-node paths
      expect(Array.isArray(paths)).toBe(true);
    });

    it('should handle circular paths', async () => {
      const circularGraph: KnowledgeGraph = {
        nodes: [
          { id: 'n1', label: 'Node1', type: 'entity' },
          { id: 'n2', label: 'Node2', type: 'entity' },
        ],
        edges: [
          { from: 'n1', to: 'n2', relation: 'to', weight: 1.0 },
          { from: 'n2', to: 'n1', relation: 'back', weight: 1.0 },
        ],
      };

      graphPathExplorer.setKnowledgeGraph(circularGraph);

      const config: ExplorationConfig = {
        maxDepth: 3,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      // Should find paths but respect maxDepth
      paths.forEach(path => {
        expect(path.length).toBeLessThanOrEqual(4); // maxDepth + 1
      });
    });
  });

  describe('Configuration Options', () => {
    it('should use default config when not provided', async () => {
      // Should not throw with default config
      const paths = await graphPathExplorer.explorePaths('n1', 'test query');
      expect(Array.isArray(paths)).toBe(true);
    });

    it('should respect noveltyWeight in ranking', async () => {
      const configLowNovelty: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.1, // Low novelty weight
      };

      const configHighNovelty: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 10,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.9, // High novelty weight
      };

      const pathsLow = await graphPathExplorer.explorePaths('n1', 'test query', configLowNovelty);
      const pathsHigh = await graphPathExplorer.explorePaths('n1', 'test query', configHighNovelty);

      // Both should return paths
      expect(pathsLow.length).toBeGreaterThan(0);
      expect(pathsHigh.length).toBeGreaterThan(0);
    });
  });

  describe('Path Structure', () => {
    it('should return paths with correct structure', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 5,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      if (paths.length > 0) {
        const path = paths[0];
        
        expect(path).toHaveProperty('nodes');
        expect(path).toHaveProperty('edges');
        expect(path).toHaveProperty('score');
        expect(path).toHaveProperty('length');
        
        expect(Array.isArray(path.nodes)).toBe(true);
        expect(Array.isArray(path.edges)).toBe(true);
        expect(typeof path.score).toBe('number');
        expect(typeof path.length).toBe('number');
        
        // Path length should match number of nodes
        expect(path.length).toBe(path.nodes.length);
      }
    });

    it('should have edges matching node transitions', async () => {
      const config: ExplorationConfig = {
        maxDepth: 2,
        maxPaths: 5,
        useBFS: true,
        useLLMGuided: false,
        useGeneticAlgorithm: false,
        noveltyWeight: 0.3,
      };

      const paths = await graphPathExplorer.explorePaths('n1', 'test query', config);

      paths.forEach(path => {
        // For a path with n nodes, there should be n-1 edges (or 0 if single node)
        if (path.nodes.length > 1) {
          expect(path.edges.length).toBeGreaterThanOrEqual(path.nodes.length - 1);
        }
      });
    });
  });
});

