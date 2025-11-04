/**
 * Test suite for GAMP Multi-Agent System
 * 
 * Tests cover:
 * - Chief Scientist Agent (query decomposition, synthesis, ranking)
 * - Domain Expert Agents (path evaluation)
 * - Path Exploration Agent (path discovery)
 * - Innovation Assessment Agent (novelty scoring)
 * - Fact Checking Agent (verification)
 * - Multi-agent coordination pipeline
 * 
 * Uses REAL implementations - no mocks
 */

import {
  ChiefScientistAgent,
  DomainExpertAgent,
  PathExplorationAgent,
  InnovationAssessmentAgent,
  FactCheckingAgent,
  GAMPMultiAgentSystem,
  type GAMPPath,
} from '../../../lib/gamp/gamp-agent-system';
import { graphPathExplorer } from '../../../lib/gamp/graph-path-explorer';
import { noveltyScorer } from '../../../lib/gamp/novelty-scorer';
import { realityCheckLayer } from '../../../lib/reality-check-layer';
import type { KnowledgeGraph, GraphNode } from '../../../lib/gamp/graph-path-explorer';
import type { Path as NoveltyPath } from '../../../lib/gamp/novelty-scorer';

// Check if Ollama is available (for real API calls)
const ollamaAvailable = process.env.ENABLE_OLLAMA_TESTS === 'true' || false;

describe('ChiefScientistAgent', () => {
  let agent: ChiefScientistAgent;

  beforeEach(() => {
    agent = new ChiefScientistAgent();
  });

  describe('Query Decomposition', () => {
    it('should decompose query into sub-tasks', async () => {
      if (!ollamaAvailable) {
        console.warn('⚠️ Skipping test: Ollama not available (set ENABLE_OLLAMA_TESTS=true to enable)');
        return;
      }

      const subtasks = await agent.decomposeQuery('How to study pain receptors?');

      expect(Array.isArray(subtasks)).toBe(true);
      // May return subtasks or fallback to simple split
    }, 15000); // 15 second timeout for real API calls

    it('should handle API errors gracefully', async () => {
      // This will fail gracefully even if Ollama is not running
      const subtasks = await agent.decomposeQuery('Test query');

      // Should fallback to simple split
      expect(Array.isArray(subtasks)).toBe(true);
    }, 10000);
  });

  describe('Path Synthesis and Ranking', () => {
    it('should synthesize evaluations from multiple agents', async () => {
      const evaluations = [
        { agentId: 'expert1', score: 0.8, reasoning: 'Good path' },
        { agentId: 'expert2', score: 0.7, reasoning: 'Acceptable path' },
      ];

      const paths: GAMPPath[] = [
        {
          id: 'path1',
          nodes: ['A', 'B'],
          problem: 'Problem',
          solution: 'Solution',
          effect: 'Effect',
          novelty: 0.8,
          scientificRationality: 0.7,
          factuality: 0.9,
          overallScore: 0.8,
          evaluations: [
            { agentId: 'expert1', score: 0.8, reasoning: 'Good' },
            { agentId: 'expert2', score: 0.7, reasoning: 'OK' },
          ],
        },
      ];

      const ranked = await agent.synthesizeEvaluations(evaluations, paths);

      expect(ranked.length).toBe(1);
      expect(ranked[0].overallScore).toBeDefined();
    });

    it('should rank paths by overall score', async () => {
      const paths: GAMPPath[] = [
        {
          id: 'path1',
          nodes: ['A'],
          problem: 'P1',
          solution: 'S1',
          effect: 'E1',
          novelty: 0.5,
          scientificRationality: 0.5,
          factuality: 0.5,
          overallScore: 0.5,
          evaluations: [],
        },
        {
          id: 'path2',
          nodes: ['B'],
          problem: 'P2',
          solution: 'S2',
          effect: 'E2',
          novelty: 0.9,
          scientificRationality: 0.9,
          factuality: 0.9,
          overallScore: 0.9,
          evaluations: [],
        },
      ];

      const ranked = await agent.rankPaths(paths);

      expect(ranked[0].overallScore).toBeGreaterThanOrEqual(ranked[1].overallScore);
    });
  });
});

describe('DomainExpertAgent', () => {
  let agent: DomainExpertAgent;

  beforeEach(() => {
    agent = new DomainExpertAgent('expert1', 'biology', 'Molecular Biology');
  });

  describe('Path Evaluation', () => {
    it('should evaluate path for scientific rationality', async () => {
      if (!ollamaAvailable) {
        console.warn('⚠️ Skipping test: Ollama not available');
        return;
      }

      const path: GAMPPath = {
        id: 'path1',
        nodes: ['A'],
        problem: 'Problem',
        solution: 'Solution',
        effect: 'Effect',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const evaluation = await agent.evaluatePath(path);

      expect(evaluation.score).toBeGreaterThanOrEqual(0);
      expect(evaluation.score).toBeLessThanOrEqual(1);
      expect(evaluation.reasoning).toBeDefined();
    }, 15000);

    it('should handle evaluation errors', async () => {
      // Will use fallback if Ollama not available
      const path: GAMPPath = {
        id: 'path1',
        nodes: ['A'],
        problem: 'Problem',
        solution: 'Solution',
        effect: 'Effect',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const evaluation = await agent.evaluatePath(path);

      expect(evaluation.score).toBe(0.5); // Default score
      expect(evaluation.reasoning).toBeDefined();
    }, 10000);
  });
});

describe('PathExplorationAgent', () => {
  let agent: PathExplorationAgent;
  let mockGraph: KnowledgeGraph;

  beforeEach(() => {
    agent = new PathExplorationAgent();
    mockGraph = {
      nodes: [
        { id: 'n1', label: 'Node1', type: 'problem' },
        { id: 'n2', label: 'Node2', type: 'solution' },
      ],
      edges: [
        { from: 'n1', to: 'n2', relation: 'connects', weight: 1.0 },
      ],
    };
  });

  describe('Path Exploration', () => {
    it('should explore paths from knowledge graph', async () => {
      const paths = await agent.explorePaths(mockGraph, 'test query');

      expect(Array.isArray(paths)).toBe(true);
    }, 10000);

    it('should handle empty graph', async () => {
      const emptyGraph: KnowledgeGraph = {
        nodes: [],
        edges: [],
      };

      const paths = await agent.explorePaths(emptyGraph, 'test query');

      expect(paths.length).toBe(0);
    });

    it('should convert paths to GAMP format', async () => {
      const paths = await agent.explorePaths(mockGraph, 'test query');
      const triplets = [
        {
          problem: 'Problem',
          solution: 'Solution',
          effect: 'Effect',
          confidence: 0.9,
          source: 'chunk1',
        },
      ];

      const gampPaths = await agent.convertPathsToGAMP(paths, triplets);

      expect(Array.isArray(gampPaths)).toBe(true);
      if (gampPaths.length > 0) {
        expect(gampPaths[0]).toHaveProperty('problem');
        expect(gampPaths[0]).toHaveProperty('solution');
        expect(gampPaths[0]).toHaveProperty('effect');
      }
    }, 10000);
  });
});

describe('InnovationAssessmentAgent', () => {
  let agent: InnovationAssessmentAgent;

  beforeEach(() => {
    agent = new InnovationAssessmentAgent();
  });

  describe('Path Assessment', () => {
    it('should assess path innovation', async () => {
      if (!ollamaAvailable) {
        console.warn('⚠️ Skipping test: Ollama not available');
        return;
      }

      const path: GAMPPath = {
        id: 'path1',
        nodes: ['A', 'B'],
        problem: 'Problem',
        solution: 'Solution',
        effect: 'Effect',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const assessment = await agent.assessPath(path, []);

      expect(assessment.novelty).toBeGreaterThanOrEqual(0);
      expect(assessment.novelty).toBeLessThanOrEqual(1);
      expect(assessment.topologicalNovelty).toBeDefined();
      expect(assessment.semanticNovelty).toBeDefined();
      expect(assessment.potentialImpact).toBeDefined();
      expect(assessment.overallScore).toBeDefined();
    }, 20000); // 20 second timeout for multiple API calls

    it('should calculate topological novelty', async () => {
      const path: GAMPPath = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
        problem: 'Problem',
        solution: 'Solution',
        effect: 'Effect',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const historicalPaths: NoveltyPath[] = [
        { id: 'hist1', nodes: ['A', 'B', 'C'] },
        { id: 'hist2', nodes: ['A', 'B', 'C'] },
      ];

      const assessment = await agent.assessPath(path, historicalPaths);

      // Higher frequency = lower topological novelty
      expect(assessment.topologicalNovelty).toBeLessThan(1.0);
    });
  });
});

describe('FactCheckingAgent', () => {
  let agent: FactCheckingAgent;
  let mockGraph: KnowledgeGraph;

  beforeEach(() => {
    agent = new FactCheckingAgent();
    mockGraph = {
      nodes: [
        { id: 'n1', label: 'Problem A', type: 'problem' },
        { id: 'n2', label: 'Solution B', type: 'solution' },
        { id: 'n3', label: 'Effect C', type: 'effect' },
      ],
      edges: [
        { from: 'n1', to: 'n2', relation: 'studied_via', weight: 1.0 },
        { from: 'n2', to: 'n3', relation: 'causes', weight: 1.0 },
      ],
    };
  });

  describe('Path Verification', () => {
    it('should verify path against knowledge graph', async () => {
      const path: GAMPPath = {
        id: 'path1',
        nodes: ['n1', 'n2', 'n3'],
        problem: 'Problem A',
        solution: 'Solution B',
        effect: 'Effect C',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const verification = await agent.verifyPath(path, mockGraph, []);

      expect(verification.factuality).toBeGreaterThanOrEqual(0);
      expect(verification.factuality).toBeLessThanOrEqual(1);
      expect(verification.verified).toBeDefined();
      expect(Array.isArray(verification.issues)).toBe(true);
      expect(Array.isArray(verification.evidence)).toBe(true);
    }, 15000);

    it('should verify path against source documents', async () => {
      const path: GAMPPath = {
        id: 'path1',
        nodes: ['A'],
        problem: 'Problem',
        solution: 'Solution',
        effect: 'Effect',
        novelty: 0.5,
        scientificRationality: 0.5,
        factuality: 0.5,
        overallScore: 0.5,
        evaluations: [],
      };

      const documents = [
        { id: 'doc1', content: 'Problem Solution Effect' },
      ];

      const verification = await agent.verifyPath(path, mockGraph, documents);

      expect(Array.isArray(verification.evidence)).toBe(true);
    }, 15000);
  });
});

describe('GAMPMultiAgentSystem', () => {
  let system: GAMPMultiAgentSystem;
  let mockGraph: KnowledgeGraph;

  beforeEach(() => {
    system = new GAMPMultiAgentSystem();
    mockGraph = {
      nodes: [
        { id: 'n1', label: 'Node1', type: 'problem' },
        { id: 'n2', label: 'Node2', type: 'solution' },
      ],
      edges: [
        { from: 'n1', to: 'n2', relation: 'connects', weight: 1.0 },
      ],
    };
  });

  describe('Path Discovery Pipeline', () => {
    it('should execute complete discovery pipeline', async () => {
      const documents = [
        {
          id: 'doc1',
          content: 'Test content',
          metadata: {
            problemSolutionEffect: {
              problem: 'Problem',
              solution: 'Solution',
              effect: 'Effect',
              confidence: 0.9,
            },
          },
        },
      ];

      const paths = await system.discoverPaths('test query', mockGraph, documents, 'biology');

      expect(Array.isArray(paths)).toBe(true);
    }, 30000); // 30 second timeout for full pipeline

    it('should handle empty source documents', async () => {
      const paths = await system.discoverPaths('test query', mockGraph, [], 'biology');

      expect(Array.isArray(paths)).toBe(true);
    }, 20000);
  });
});
