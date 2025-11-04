/**
 * GAMP E2E Test with REAL API Integration
 *
 * This test makes REAL calls to Ollama API to verify GAMP works end-to-end.
 *
 * Requirements:
 * - Ollama must be running (http://localhost:11434)
 * - Model must be available (llama3.2:latest or similar)
 * - Set ENABLE_OLLAMA_TESTS=true to run
 *
 * Run with:
 * ```bash
 * ENABLE_OLLAMA_TESTS=true npm run test:e2e
 * ```
 */

import { gampAgentSystem } from '../../../lib/gamp/gamp-agent-system';
import { knowledgeGraphBuilder } from '../../../lib/gamp/knowledge-graph-builder';
import type { KnowledgeGraph } from '../../../lib/gamp/graph-path-explorer';
import type { ProblemSolutionEffect } from '../../../lib/rag/problem-solution-effect-extractor';

// Skip these tests unless explicitly enabled
const describeIfEnabled = process.env.ENABLE_OLLAMA_TESTS === 'true' ? describe : describe.skip;

describeIfEnabled('GAMP Real API Integration (E2E)', () => {
  let knowledgeGraph: KnowledgeGraph;
  let sourceDocuments: any[];

  beforeAll(async () => {
    console.log('🚀 Starting GAMP E2E test with REAL Ollama API');

    // Verify Ollama is available
    try {
      const healthCheck = await fetch('http://localhost:11434/api/tags');
      if (!healthCheck.ok) {
        throw new Error('Ollama not responding');
      }
      console.log('✅ Ollama is running');
    } catch (error) {
      console.error('❌ Ollama not available:', error);
      throw new Error('Ollama must be running for E2E tests. Start with: ollama serve');
    }

    // Create knowledge graph with P-S-E triplets (using manual triplets to avoid LLM dependency)
    const triplets: ProblemSolutionEffect[] = [
      {
        problem: 'Understanding how pain receptors work in the human body',
        solution: 'Study TRPV1 ion channels using electrophysiological techniques',
        effect: 'Discovering that capsaicin activates TRPV1, leading to pain sensation',
        confidence: 0.9,
        metadata: {
          domain: 'biology',
          chunkId: 'doc1',
          entities: ['TRPV1', 'capsaicin', 'pain receptors']
        }
      },
      {
        problem: 'How cold temperatures are sensed by the body',
        solution: 'Use calcium imaging to track TRPM8 receptor activation',
        effect: 'Identifying cold-sensitive neurons in the skin',
        confidence: 0.85,
        metadata: {
          domain: 'biology',
          chunkId: 'doc2',
          entities: ['TRPM8', 'cold receptors']
        }
      }
    ];

    const chunks = triplets.map((triplet, i) => ({
      id: `chunk${i}`,
      content: `${triplet.problem} ${triplet.solution} ${triplet.effect}`,
      problemSolutionEffect: triplet,
      metadata: { domain: 'biology' },
    }));

    knowledgeGraph = await knowledgeGraphBuilder.buildFromEnrichedChunks(chunks, false);
    console.log(`✅ Knowledge graph built: ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`);

    sourceDocuments = chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        problemSolutionEffect: chunk.problemSolutionEffect,
      },
    }));
  });

  describe('GAMP with Real LLM Calls', () => {
    it('should decompose query using real Ollama API', async () => {
      const query = 'How do pain receptors work?';

      console.log('🔍 Testing query decomposition with real Ollama...');

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      console.log(`✅ Discovered ${paths.length} paths using real LLM`);

      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);

      if (paths.length > 0) {
        const path = paths[0];

        // Verify path structure
        expect(path).toHaveProperty('id');
        expect(path).toHaveProperty('nodes');
        expect(path).toHaveProperty('problem');
        expect(path).toHaveProperty('solution');
        expect(path).toHaveProperty('effect');
        expect(path).toHaveProperty('novelty');
        expect(path).toHaveProperty('scientificRationality');
        expect(path).toHaveProperty('factuality');
        expect(path).toHaveProperty('overallScore');
        expect(path).toHaveProperty('evaluations');

        // Verify scores
        expect(path.novelty).toBeGreaterThanOrEqual(0);
        expect(path.novelty).toBeLessThanOrEqual(1);
        expect(path.scientificRationality).toBeGreaterThanOrEqual(0);
        expect(path.scientificRationality).toBeLessThanOrEqual(1);
        expect(path.factuality).toBeGreaterThanOrEqual(0);
        expect(path.factuality).toBeLessThanOrEqual(1);

        console.log('📊 Path scores:', {
          novelty: path.novelty.toFixed(2),
          scientificRationality: path.scientificRationality.toFixed(2),
          factuality: path.factuality.toFixed(2),
          overall: path.overallScore.toFixed(2),
        });
      }
    }, 90000); // 90 second timeout for real API calls

    it('should evaluate paths with domain experts using real LLM', async () => {
      const query = 'What are pain receptors?';

      console.log('🔍 Testing domain expert evaluation with real Ollama...');

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      expect(paths.length).toBeGreaterThan(0);

      if (paths.length > 0) {
        const path = paths[0];

        // Verify evaluations from multiple agents
        expect(Array.isArray(path.evaluations)).toBe(true);
        expect(path.evaluations.length).toBeGreaterThan(0);

        console.log(`✅ Path evaluated by ${path.evaluations.length} agents`);

        // Log agent evaluation details
        path.evaluations.forEach(eval => {
          console.log(`  - ${eval.agentId}: score=${eval.score.toFixed(2)}, feedback="${eval.feedback.substring(0, 100)}..."`);
        });

        // Should have innovation assessor evaluation
        const innovationEval = path.evaluations.find(e => e.agentId === 'innovation_assessor');
        expect(innovationEval).toBeDefined();

        // Should have fact checker evaluation
        const factCheckerEval = path.evaluations.find(e => e.agentId === 'fact_checker');
        expect(factCheckerEval).toBeDefined();
      }
    }, 90000);

    it('should rank paths correctly using real LLM scoring', async () => {
      const query = 'How are pain receptors studied?';

      console.log('🔍 Testing path ranking with real Ollama...');

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      if (paths.length > 1) {
        console.log(`✅ Found ${paths.length} paths, verifying ranking...`);

        // Paths should be ranked (highest score first)
        for (let i = 0; i < paths.length - 1; i++) {
          expect(paths[i].overallScore).toBeGreaterThanOrEqual(paths[i + 1].overallScore);
        }

        // Log ranking
        paths.forEach((path, i) => {
          console.log(`  ${i + 1}. Score: ${path.overallScore.toFixed(2)}, Problem: "${path.problem.substring(0, 60)}..."`);
        });
      }
    }, 90000);
  });

  describe('GAMP Performance with Real API', () => {
    it('should complete discovery within reasonable time', async () => {
      const query = 'What are ion channels?';

      const startTime = Date.now();

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      const duration = Date.now() - startTime;

      console.log(`⏱️ Discovery completed in ${(duration / 1000).toFixed(2)}s`);

      // Should complete within 60 seconds with real API
      expect(duration).toBeLessThan(60000);
      expect(paths.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe('Error Handling with Real API', () => {
    it('should handle API failures gracefully', async () => {
      // Use a model that doesn't exist to trigger failure
      const originalModel = process.env.OLLAMA_MODEL;
      process.env.OLLAMA_MODEL = 'nonexistent-model-xyz';

      const query = 'Test query';

      try {
        const paths = await gampAgentSystem.discoverPaths(
          query,
          knowledgeGraph,
          sourceDocuments,
          'biology'
        );

        // Should fall back to simple decomposition
        expect(Array.isArray(paths)).toBe(true);
        console.log('✅ Graceful fallback worked with nonexistent model');
      } finally {
        // Restore original model
        if (originalModel) {
          process.env.OLLAMA_MODEL = originalModel;
        } else {
          delete process.env.OLLAMA_MODEL;
        }
      }
    }, 90000);
  });
});

// Run a quick smoke test even without ENABLE_OLLAMA_TESTS
describe('GAMP Smoke Test (Always Run)', () => {
  it('should import GAMP modules without errors', () => {
    expect(gampAgentSystem).toBeDefined();
    expect(knowledgeGraphBuilder).toBeDefined();
    expect(typeof gampAgentSystem.discoverPaths).toBe('function');
    expect(typeof knowledgeGraphBuilder.buildFromEnrichedChunks).toBe('function');
  });
});
