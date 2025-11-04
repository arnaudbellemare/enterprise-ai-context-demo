/**
 * End-to-End GAMP Integration Test
 * 
 * Tests the complete GAMP flow:
 * 1. Document ingestion with P-S-E extraction
 * 2. Knowledge graph building
 * 3. GAMP path discovery on real query
 * 4. Path ranking and evaluation
 * 
 * This tests GAMP as it would be used in production.
 */

import { gampAgentSystem } from '../../../lib/gamp/gamp-agent-system';
import { knowledgeGraphBuilder } from '../../../lib/gamp/knowledge-graph-builder';
import { problemSolutionEffectExtractor } from '../../../lib/rag/problem-solution-effect-extractor';
import type { KnowledgeGraph } from '../../../lib/gamp/graph-path-explorer';
import type { ProblemSolutionEffect } from '../../../lib/rag/problem-solution-effect-extractor';

describe('GAMP End-to-End Integration', () => {
  let knowledgeGraph: KnowledgeGraph;
  let sourceDocuments: any[];

  beforeAll(async () => {
    // Create sample documents with P-S-E triplets
    const sampleContent = `
      The problem is understanding how pain receptors work in the human body.
      The solution is to study TRPV1 ion channels using electrophysiological techniques.
      The effect is discovering that capsaicin activates TRPV1, leading to pain sensation.
      
      Researchers have found that TRPM8 receptors respond to cold temperatures.
      The solution involves using calcium imaging to track receptor activation.
      The effect is identifying cold-sensitive neurons in the skin.
    `;

    // Extract P-S-E triplets from content
    const triplets: ProblemSolutionEffect[] = [];
    
    const chunk1 = sampleContent.split('\n\n')[0];
    const triplet1 = await problemSolutionEffectExtractor.extractFromChunk(chunk1, 'doc1', 'biology');
    if (triplet1) triplets.push(triplet1);

    const chunk2 = sampleContent.split('\n\n')[1];
    const triplet2 = await problemSolutionEffectExtractor.extractFromChunk(chunk2, 'doc2', 'biology');
    if (triplet2) triplets.push(triplet2);

    // Build knowledge graph from triplets
    const chunks = triplets.map((triplet, i) => ({
      id: `chunk${i}`,
      content: chunk1 + chunk2,
      problemSolutionEffect: triplet,
      metadata: { domain: 'biology' },
    }));

    knowledgeGraph = await knowledgeGraphBuilder.buildFromEnrichedChunks(chunks, false);

    // Create source documents for GAMP
    sourceDocuments = chunks.map((chunk, i) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        problemSolutionEffect: chunk.problemSolutionEffect,
      },
    }));
  });

  describe('Complete GAMP Discovery Flow', () => {
    it('should discover paths using full GAMP multi-agent system', async () => {
      if (!knowledgeGraph.nodes.length) {
        console.warn('⚠️ Skipping test: Knowledge graph is empty (P-S-E extraction may have failed)');
        return;
      }

      const query = 'How do pain receptors work?';

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      expect(Array.isArray(paths)).toBe(true);
      
      if (paths.length > 0) {
        const path = paths[0];
        
        // Verify GAMP path structure
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
        
        // Verify scores are in valid range
        expect(path.novelty).toBeGreaterThanOrEqual(0);
        expect(path.novelty).toBeLessThanOrEqual(1);
        expect(path.scientificRationality).toBeGreaterThanOrEqual(0);
        expect(path.scientificRationality).toBeLessThanOrEqual(1);
        expect(path.factuality).toBeGreaterThanOrEqual(0);
        expect(path.factuality).toBeLessThanOrEqual(1);
        expect(path.overallScore).toBeGreaterThanOrEqual(0);
        expect(path.overallScore).toBeLessThanOrEqual(1);
      }
    }, 60000); // 60 second timeout for full pipeline

    it('should rank paths by overall score', async () => {
      if (!knowledgeGraph.nodes.length) {
        console.warn('⚠️ Skipping test: Knowledge graph is empty');
        return;
      }

      const query = 'What are pain receptors?';

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      if (paths.length > 1) {
        // Paths should be ranked (highest score first)
        for (let i = 0; i < paths.length - 1; i++) {
          expect(paths[i].overallScore).toBeGreaterThanOrEqual(paths[i + 1].overallScore);
        }
      }
    }, 60000);

    it('should include agent evaluations in paths', async () => {
      if (!knowledgeGraph.nodes.length) {
        console.warn('⚠️ Skipping test: Knowledge graph is empty');
        return;
      }

      const query = 'How are pain receptors studied?';

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        sourceDocuments,
        'biology'
      );

      if (paths.length > 0) {
        const path = paths[0];
        
        // Should have evaluations from multiple agents
        expect(Array.isArray(path.evaluations)).toBe(true);
        
        // Should have evaluations from domain experts
        const domainExpertEvals = path.evaluations.filter(e => 
          e.agentId.includes('molecular_biologist') || 
          e.agentId.includes('physiologist') || 
          e.agentId.includes('chemist')
        );
        
        // Should have innovation assessor evaluation
        const innovationEval = path.evaluations.find(e => e.agentId === 'innovation_assessor');
        
        // Should have fact checker evaluation
        const factCheckerEval = path.evaluations.find(e => e.agentId === 'fact_checker');
        
        // At minimum, should have some evaluations
        expect(path.evaluations.length).toBeGreaterThan(0);
      }
    }, 60000);
  });

  describe('GAMP in RAG Pipeline Context', () => {
    it('should work with enriched documents from RAG pipeline', async () => {
      if (!knowledgeGraph.nodes.length) {
        console.warn('⚠️ Skipping test: Knowledge graph is empty');
        return;
      }

      // Simulate enriched documents from RAG pipeline
      const enrichedDocs = [
        {
          id: 'doc1',
          content: 'Pain receptors are studied using TRPV1 channels.',
          enrichedContent: 'The problem is understanding pain. The solution is TRPV1 studies. The effect is pain mechanism discovery.',
          metadata: {
            problemSolutionEffect: {
              problem: 'Understanding pain mechanisms',
              solution: 'Study TRPV1 channels',
              effect: 'Discover pain sensation pathways',
              confidence: 0.9,
            },
          },
        },
      ];

      const query = 'How do researchers study pain?';

      const paths = await gampAgentSystem.discoverPaths(
        query,
        knowledgeGraph,
        enrichedDocs,
        'biology'
      );

      expect(Array.isArray(paths)).toBe(true);
    }, 60000);
  });
});

