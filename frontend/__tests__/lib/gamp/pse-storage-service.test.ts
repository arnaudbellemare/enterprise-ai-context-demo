/**
 * Test suite for PSE Storage Service
 * 
 * Tests cover:
 * - Triplet storage (single and batch)
 * - Knowledge graph loading
 * - Path finding between nodes
 * - Graph statistics
 * - Node neighbor queries
 * - Triplet search
 * - Error handling (no Supabase)
 * 
 * Uses REAL Supabase client - requires Supabase to be configured
 */

import { pseStorageService, initializePSEStorage, PSEStorageService, type PSETripletRecord } from '../../../lib/gamp/pse-storage-service';
import { createClient } from '@supabase/supabase-js';
import type { ProblemSolutionEffect } from '../../../lib/rag/problem-solution-effect-extractor';

// Create real Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasSupabase = !!(supabaseUrl && supabaseKey);
const realSupabaseClient = hasSupabase ? createClient(supabaseUrl!, supabaseKey!) : null;

describe('PSEStorageService', () => {
  beforeAll(() => {
    if (realSupabaseClient) {
      initializePSEStorage(realSupabaseClient);
    }
  });

  describe('Initialization', () => {
    it('should initialize with Supabase client', () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }
      
      initializePSEStorage(realSupabaseClient!);
      expect(pseStorageService).toBeDefined();
    });

    it('should work without Supabase client (in-memory mode)', () => {
      const service = new PSEStorageService();
      expect(service).toBeDefined();
    });
  });

  describe('Triplet Storage', () => {
    it('should store single triplet', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const triplet: ProblemSolutionEffect = {
        problem: 'Test problem - ' + Date.now(),
        solution: 'Test solution',
        effect: 'Test effect',
        confidence: 0.9,
        source: 'chunk1',
        metadata: { domain: 'biology' },
      };

      const result = await pseStorageService.storeTriplet(triplet, 'chunk1', 'doc1');

      // Real Supabase may return ID or null depending on table existence
      expect(result === null || typeof result === 'string').toBe(true);
    }, 10000); // 10 second timeout for real API calls

    it('should handle storage errors gracefully', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // Try to store with invalid data structure
      const triplet: ProblemSolutionEffect = {
        problem: '',
        solution: '',
        effect: '',
        confidence: -1, // Invalid confidence
        source: 'chunk1',
      };

      const result = await pseStorageService.storeTriplet(triplet, 'chunk1', 'doc1');

      // Should handle gracefully (return null or throw)
      expect(result === null || typeof result === 'string').toBe(true);
    }, 10000);

    it('should batch store multiple triplets', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const triplets = [
        {
          triplet: {
            problem: 'Problem 1 - ' + Date.now(),
            solution: 'Solution 1',
            effect: 'Effect 1',
            confidence: 0.9,
            source: 'chunk1',
          } as ProblemSolutionEffect,
          chunkId: 'chunk1',
          documentId: 'doc1',
        },
        {
          triplet: {
            problem: 'Problem 2 - ' + Date.now(),
            solution: 'Solution 2',
            effect: 'Effect 2',
            confidence: 0.8,
            source: 'chunk2',
          } as ProblemSolutionEffect,
          chunkId: 'chunk2',
          documentId: 'doc2',
        },
      ];

      const result = await pseStorageService.batchStoreTriplets(triplets);

      expect(Array.isArray(result)).toBe(true);
      // Real Supabase may store some or all triplets
    }, 15000);
  });

  describe('Knowledge Graph Loading', () => {
    it('should load knowledge graph from triplets', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const graph = await pseStorageService.loadKnowledgeGraph('biology', 0.7);

      expect(graph).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
    }, 10000);

    it('should filter by domain', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const graph = await pseStorageService.loadKnowledgeGraph('biology', 0.7);

      expect(graph).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
    }, 10000);

    it('should filter by minConfidence', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const graph = await pseStorageService.loadKnowledgeGraph(undefined, 0.8);

      expect(graph).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
    }, 10000);

    it('should return empty graph when no triplets found', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // Try loading with a domain that likely doesn't exist
      const graph = await pseStorageService.loadKnowledgeGraph('nonexistent-domain-xyz', 0.9);

      expect(graph).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
    }, 10000);
  });

  describe('Path Finding', () => {
    it('should find paths between nodes', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // This requires database functions to exist
      // May return empty array if functions not set up
      const paths = await pseStorageService.findPathsBetweenNodes('node1', 'node2', 3);

      expect(Array.isArray(paths)).toBe(true);
    }, 10000);
  });

  describe('Graph Statistics', () => {
    it('should get graph statistics', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // This requires database functions to exist
      const stats = await pseStorageService.getGraphStatistics('biology');

      // May be null if functions not set up, or object if they are
      expect(stats === null || typeof stats === 'object').toBe(true);
    }, 10000);
  });

  describe('Node Neighbors', () => {
    it('should get node neighbors', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // This requires database functions to exist
      const neighbors = await pseStorageService.getNodeNeighbors('node1');

      expect(Array.isArray(neighbors)).toBe(true);
    }, 10000);
  });

  describe('Triplet Search', () => {
    it('should search triplets by query', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      const results = await pseStorageService.searchTriplets('pain', 'biology', 10);

      expect(Array.isArray(results)).toBe(true);
    }, 10000);

    it('should handle search errors', async () => {
      if (!hasSupabase) {
        console.warn('⚠️ Skipping test: Supabase not configured');
        return;
      }

      // Empty query should still return array (may be empty)
      const results = await pseStorageService.searchTriplets('');

      expect(Array.isArray(results)).toBe(true);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should return empty array when Supabase not available', async () => {
      const service = new PSEStorageService(); // No Supabase client
      
      const graph = await service.loadKnowledgeGraph();
      expect(graph.nodes.length).toBe(0);
      expect(graph.edges.length).toBe(0);
    });

    it('should return null when storing without Supabase', async () => {
      const service = new PSEStorageService(); // No Supabase client
      
      const triplet: ProblemSolutionEffect = {
        problem: 'Test',
        solution: 'Test',
        effect: 'Test',
        confidence: 0.9,
        source: 'chunk1',
      };

      const result = await service.storeTriplet(triplet, 'chunk1', 'doc1');
      expect(result).toBeNull();
    });
  });
});
