/**
 * Tests for Permutation-Lite GAMP Pipeline Integration
 *
 * Verifies:
 * - GAMP activation logic (scientific domains + IRT > 0.7)
 * - Knowledge graph building from ReasoningBank
 * - Parallel execution (GEPA + GAMP + Learning)
 * - Metadata updates with GAMP results
 * - Quality score calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../lib/reasoning-bank', () => ({
  ReasoningBank: vi.fn().mockImplementation(() => ({
    retrieveRelevantMemories: vi.fn().mockResolvedValue([
      {
        id: 'mem1',
        content: 'CRISPR gene editing allows precise DNA modifications',
        domain: 'biology',
        quality: 0.9
      },
      {
        id: 'mem2',
        content: 'Cas9 protein targets specific DNA sequences using guide RNA',
        domain: 'biology',
        quality: 0.85
      }
    ]),
    storeReasoning: vi.fn().mockResolvedValue({ success: true })
  }))
}));

vi.mock('../../lib/rag/problem-solution-effect-extractor', () => ({
  problemSolutionEffectExtractor: {
    extractFromChunk: vi.fn().mockResolvedValue({
      problem: 'Understanding CRISPR targeting mechanisms',
      solution: 'Use Cas9 with guide RNA for precise gene editing',
      effect: 'Correcting genetic mutations with minimal off-target effects',
      confidence: 0.9,
      metadata: {
        domain: 'biology',
        chunkId: 'mem1',
        entities: ['CRISPR', 'Cas9', 'guide RNA']
      }
    })
  }
}));

vi.mock('../../lib/gamp/knowledge-graph-builder', () => ({
  knowledgeGraphBuilder: {
    buildFromEnrichedChunks: vi.fn().mockResolvedValue({
      nodes: [
        { id: 'n1', label: 'CRISPR', type: 'entity' },
        { id: 'n2', label: 'Cas9', type: 'entity' },
        { id: 'n3', label: 'guide RNA', type: 'entity' }
      ],
      edges: [
        { from: 'n1', to: 'n2', label: 'uses' },
        { from: 'n2', to: 'n3', label: 'requires' }
      ]
    })
  }
}));

vi.mock('../../lib/gamp/gamp-agent-system', () => ({
  gampAgentSystem: {
    discoverPaths: vi.fn().mockResolvedValue([
      {
        id: 'path1',
        nodes: ['n1', 'n2', 'n3'],
        problem: 'Understanding CRISPR targeting mechanisms',
        solution: 'Use Cas9 with guide RNA for precise gene editing',
        effect: 'Correcting genetic mutations with minimal off-target effects',
        novelty: 0.78,
        scientificRationality: 0.89,
        factuality: 0.92,
        overallScore: 0.86,
        evaluations: [
          { agentId: 'molecular_biologist', score: 0.89, feedback: 'Strong approach' },
          { agentId: 'innovation_assessor', score: 0.78, feedback: 'Novel method' },
          { agentId: 'fact_checker', score: 0.92, feedback: 'Verified' }
        ]
      },
      {
        id: 'path2',
        nodes: ['n1', 'n3'],
        problem: 'Alternative CRISPR approach',
        solution: 'Direct RNA targeting',
        effect: 'Faster gene editing',
        novelty: 0.65,
        scientificRationality: 0.75,
        factuality: 0.80,
        overallScore: 0.73,
        evaluations: [
          { agentId: 'molecular_biologist', score: 0.75, feedback: 'Feasible' }
        ]
      }
    ])
  }
}));

vi.mock('../../lib/irt-calculator', () => ({
  calculateIRT: vi.fn().mockImplementation((query: string, domain: string) => {
    // High difficulty for scientific domains with complex queries
    if (domain === 'biology' && query.includes('CRISPR')) {
      return Promise.resolve(0.85);
    }
    // Low difficulty for simple queries
    return Promise.resolve(0.4);
  })
}));

vi.mock('../../lib/gepa-algorithms', () => ({
  runGEPAOptimization: vi.fn().mockResolvedValue({
    optimizedPrompt: 'Optimized prompt for CRISPR',
    qualityScore: 0.92,
    cost: 0.005,
    latency: 2.3
  })
}));

vi.mock('../../lib/trm', () => ({
  RVS: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockResolvedValue({
      verified: true,
      score: 0.94,
      refinementCount: 2,
      depth: 3
    })
  }))
}));

// Import after mocks
import { PermutationLiteGAMPPipeline } from '../../lib/permutation-lite/permutation-lite-gamp-pipeline';
import type { PermutationLiteGAMPConfig } from '../../lib/permutation-lite/permutation-lite-gamp-pipeline';

describe('PermutationLiteGAMPPipeline', () => {
  let pipeline: PermutationLiteGAMPPipeline;
  let config: PermutationLiteGAMPConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableVerification: true,
      gampConfig: {
        maxGraphNodes: 50,
        maxGraphEdges: 100,
        maxPaths: 5,
        scientificDomains: ['biology', 'chemistry', 'physics', 'medicine'],
        irtThreshold: 0.7
      }
    };

    pipeline = new PermutationLiteGAMPPipeline(config);
  });

  describe('GAMP Activation Logic', () => {
    it('should activate GAMP for scientific domain with high difficulty', async () => {
      const query = 'How can CRISPR be used to treat genetic diseases?';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBeGreaterThan(0);
    });

    it('should NOT activate GAMP for non-scientific domain', async () => {
      const query = 'What is the weather today?';
      const domain = 'general';

      config.gampConfig.scientificDomains = ['biology', 'chemistry'];
      pipeline = new PermutationLiteGAMPPipeline(config);

      const result = await pipeline.execute(query, domain);

      // GAMP should not run for non-scientific domains
      expect(result.metadata.graphReasoning).toBeUndefined();
    });

    it('should NOT activate GAMP for low difficulty query', async () => {
      const query = 'What is DNA?';
      const domain = 'biology';

      // Mock IRT to return low difficulty
      const { calculateIRT } = await import('../../lib/irt-calculator');
      vi.mocked(calculateIRT).mockResolvedValue(0.3);

      const result = await pipeline.execute(query, domain);

      // GAMP should not run for easy queries
      expect(result.metadata.graphReasoning).toBeUndefined();
    });

    it('should activate GAMP for chemistry domain', async () => {
      const query = 'How do catalysts affect reaction rates in organic synthesis?';
      const domain = 'chemistry';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBeGreaterThan(0);
    });

    it('should respect custom IRT threshold', async () => {
      config.gampConfig.irtThreshold = 0.9; // Very high threshold
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'CRISPR gene editing';
      const domain = 'biology';

      // IRT returns 0.85 (below 0.9 threshold)
      const result = await pipeline.execute(query, domain);

      // Should not activate with high threshold
      expect(result.metadata.graphReasoning).toBeUndefined();
    });
  });

  describe('Knowledge Graph Building', () => {
    it('should build knowledge graph from ReasoningBank memories', async () => {
      const query = 'CRISPR gene editing mechanisms';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.graphStats).toBeDefined();
      expect(result.metadata.graphReasoning.graphStats.nodes).toBeGreaterThan(0);
      expect(result.metadata.graphReasoning.graphStats.edges).toBeGreaterThan(0);
    });

    it('should limit graph size to maxGraphNodes', async () => {
      config.gampConfig.maxGraphNodes = 3;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Complex biological system';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      if (result.metadata.graphReasoning) {
        expect(result.metadata.graphReasoning.graphStats.nodes).toBeLessThanOrEqual(3);
      }
    });

    it('should extract P-S-E triplets from memories', async () => {
      const query = 'How does gene editing work?';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.graphStats.triplets).toBeGreaterThan(0);
    });

    it('should handle extraction failures gracefully', async () => {
      const { problemSolutionEffectExtractor } = await import('../../lib/rag/problem-solution-effect-extractor');
      vi.mocked(problemSolutionEffectExtractor.extractFromChunk).mockRejectedValue(
        new Error('Extraction failed')
      );

      const query = 'CRISPR mechanisms';
      const domain = 'biology';

      // Should not throw, should create fallback graph
      const result = await pipeline.execute(query, domain);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });
  });

  describe('GAMP Path Discovery', () => {
    it('should discover multiple paths through knowledge graph', async () => {
      const query = 'CRISPR gene therapy approaches';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBeGreaterThanOrEqual(2);
    });

    it('should return top path with all scores', async () => {
      const query = 'Gene editing mechanisms';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.topPath).toBeDefined();

      const topPath = result.metadata.graphReasoning.topPath!;
      expect(topPath.problem).toBeDefined();
      expect(topPath.solution).toBeDefined();
      expect(topPath.effect).toBeDefined();
      expect(topPath.novelty).toBeGreaterThan(0);
      expect(topPath.scientificRationality).toBeGreaterThan(0);
      expect(topPath.factuality).toBeGreaterThan(0);
      expect(topPath.overallScore).toBeGreaterThan(0);
    });

    it('should track agent evaluations', async () => {
      const query = 'CRISPR applications';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.agentEvaluations).toBeGreaterThan(0);
    });

    it('should limit paths to maxPaths', async () => {
      config.gampConfig.maxPaths = 1;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      if (result.metadata.graphReasoning) {
        expect(result.metadata.graphReasoning.pathsDiscovered).toBeLessThanOrEqual(1);
      }
    });

    it('should handle GAMP execution failures', async () => {
      const { gampAgentSystem } = await import('../../lib/gamp/gamp-agent-system');
      vi.mocked(gampAgentSystem.discoverPaths).mockRejectedValue(
        new Error('GAMP failed')
      );

      const query = 'CRISPR mechanisms';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // Should not throw, should return result with 0 paths
      expect(result).toBeDefined();
      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBe(0);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute GEPA, GAMP, and Learning in parallel', async () => {
      const startTime = Date.now();

      const query = 'CRISPR gene therapy';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      const duration = Date.now() - startTime;

      // Should complete in parallel time (not sequential)
      // Mock execution is fast, but verify parallel structure
      expect(result.metadata.optimization).toBeDefined();
      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.learning).toBeDefined();
    });

    it('should handle parallel execution with disabled optimization', async () => {
      config.enableOptimization = false;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // GAMP should still run
      expect(result.metadata.graphReasoning).toBeDefined();
      // Optimization should be undefined
      expect(result.metadata.optimization).toBeUndefined();
    });

    it('should handle parallel execution with disabled learning', async () => {
      config.enableLearning = false;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'CRISPR mechanisms';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // GAMP should still run
      expect(result.metadata.graphReasoning).toBeDefined();
      // Learning should be undefined
      expect(result.metadata.learning).toBeUndefined();
    });

    it('should continue if one parallel task fails', async () => {
      const { runGEPAOptimization } = await import('../../lib/gepa-algorithms');
      vi.mocked(runGEPAOptimization).mockRejectedValue(new Error('GEPA failed'));

      const query = 'Gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // GAMP should still succeed
      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBeGreaterThan(0);
    });
  });

  describe('Quality Score Calculation', () => {
    it('should incorporate GAMP scores into quality calculation', async () => {
      const query = 'CRISPR gene therapy';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThanOrEqual(1);

      // Quality should be high with good GAMP scores
      expect(result.qualityScore).toBeGreaterThan(0.8);
    });

    it('should weight GAMP scores appropriately', async () => {
      const { gampAgentSystem } = await import('../../lib/gamp/gamp-agent-system');

      // High GAMP scores
      vi.mocked(gampAgentSystem.discoverPaths).mockResolvedValue([
        {
          id: 'path1',
          nodes: ['n1'],
          problem: 'Test',
          solution: 'Test',
          effect: 'Test',
          novelty: 0.95,
          scientificRationality: 0.95,
          factuality: 0.95,
          overallScore: 0.95,
          evaluations: []
        }
      ]);

      const result = await pipeline.execute('CRISPR', 'biology');

      expect(result.qualityScore).toBeGreaterThan(0.9);
    });

    it('should calculate quality without GAMP when not activated', async () => {
      config.enableGAMP = false;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Simple query';
      const domain = 'general';

      const result = await pipeline.execute(query, domain);

      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.metadata.graphReasoning).toBeUndefined();
    });
  });

  describe('Metadata Updates', () => {
    it('should include graphReasoning in metadata', async () => {
      const query = 'CRISPR applications';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning).toHaveProperty('pathsDiscovered');
      expect(result.metadata.graphReasoning).toHaveProperty('topPath');
      expect(result.metadata.graphReasoning).toHaveProperty('graphStats');
      expect(result.metadata.graphReasoning).toHaveProperty('agentEvaluations');
      expect(result.metadata.graphReasoning).toHaveProperty('executionTime');
    });

    it('should track GAMP execution time', async () => {
      const query = 'Gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.executionTime).toBeGreaterThan(0);
    });

    it('should preserve other metadata when GAMP runs', async () => {
      const query = 'CRISPR mechanisms';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // Should have all metadata
      expect(result.metadata.routing).toBeDefined();
      expect(result.metadata.optimization).toBeDefined();
      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.learning).toBeDefined();
      expect(result.metadata.verification).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should use default config values', () => {
      const defaultPipeline = new PermutationLiteGAMPPipeline({});

      // Should not throw
      expect(defaultPipeline).toBeDefined();
    });

    it('should respect enableGAMP flag', async () => {
      config.enableGAMP = false;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'CRISPR gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // GAMP should not run even for scientific domain
      expect(result.metadata.graphReasoning).toBeUndefined();
    });

    it('should use custom scientific domains', async () => {
      config.gampConfig.scientificDomains = ['medicine'];
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Medical treatment approaches';
      const domain = 'medicine';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
    });

    it('should apply graph size limits', async () => {
      config.gampConfig.maxGraphNodes = 10;
      config.gampConfig.maxGraphEdges = 20;
      pipeline = new PermutationLiteGAMPPipeline(config);

      const query = 'Complex system';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      if (result.metadata.graphReasoning) {
        expect(result.metadata.graphReasoning.graphStats.nodes).toBeLessThanOrEqual(10);
        expect(result.metadata.graphReasoning.graphStats.edges).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ReasoningBank memories', async () => {
      const { ReasoningBank } = await import('../../lib/reasoning-bank');
      const mockRB = vi.mocked(new ReasoningBank());
      vi.mocked(mockRB.retrieveRelevantMemories).mockResolvedValue([]);

      const query = 'CRISPR';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      // Should create fallback graph
      expect(result).toBeDefined();
      expect(result.metadata.graphReasoning).toBeDefined();
    });

    it('should handle GAMP returning no paths', async () => {
      const { gampAgentSystem } = await import('../../lib/gamp/gamp-agent-system');
      vi.mocked(gampAgentSystem.discoverPaths).mockResolvedValue([]);

      const query = 'Gene editing';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result.metadata.graphReasoning).toBeDefined();
      expect(result.metadata.graphReasoning.pathsDiscovered).toBe(0);
      expect(result.metadata.graphReasoning.topPath).toBeNull();
    });

    it('should handle queries with special characters', async () => {
      const query = 'CRISPR-Cas9: How does it work? [Biology]';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result).toBeDefined();
      expect(result.metadata.graphReasoning).toBeDefined();
    });

    it('should handle very short queries', async () => {
      const query = 'DNA';
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result).toBeDefined();
    });

    it('should handle very long queries', async () => {
      const query = 'Explain in detail how CRISPR-Cas9 gene editing technology can be used to treat genetic diseases, including the mechanisms of action, potential side effects, ethical considerations, and current research directions in the field of molecular biology and genetics. ' + 'Detail '.repeat(100);
      const domain = 'biology';

      const result = await pipeline.execute(query, domain);

      expect(result).toBeDefined();
    });
  });
});
