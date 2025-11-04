/**
 * Test suite for Novelty Scorer
 * 
 * Tests cover:
 * - Novelty calculation formula (1 / (1 + log(freq)))
 * - Frequency calculation
 * - Sub-path generation and frequency
 * - Path matching (exact match, sub-path)
 * - Batch operations
 * - Edge cases (empty paths, no history, etc.)
 */

import { noveltyScorer, type Path, type NoveltyScore } from '../../../lib/gamp/novelty-scorer';

describe('NoveltyScorer', () => {
  beforeEach(() => {
    noveltyScorer.clearHistory();
  });

  describe('Novelty Formula', () => {
    it('should return 1.0 for paths with frequency 0 (never seen)', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score.novelty).toBe(1.0);
      expect(score.frequency).toBe(0);
      expect(score.breakdown.fullPathNovelty).toBe(1.0);
    });

    it('should calculate novelty correctly for frequency 1', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B'],
      };

      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B'] },
      ];

      const score = noveltyScorer.calculateNovelty(path, historicalPaths);
      
      // Novelty = 1 / (1 + log(1+1)) = 1 / (1 + log(2)) ≈ 0.59
      expect(score.novelty).toBeCloseTo(0.59, 1);
      expect(score.frequency).toBe(1);
    });

    it('should decrease novelty as frequency increases', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B'],
      };

      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B'] },
        { id: 'hist2', nodes: ['A', 'B'] },
        { id: 'hist3', nodes: ['A', 'B'] },
      ];

      const score = noveltyScorer.calculateNovelty(path, historicalPaths);
      
      // Higher frequency = lower novelty
      expect(score.novelty).toBeLessThan(0.59);
      expect(score.frequency).toBe(3);
    });
  });

  describe('Frequency Calculation', () => {
    it('should count exact matches correctly', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
      };

      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B', 'C'] },
        { id: 'hist2', nodes: ['A', 'B', 'C'] },
        { id: 'hist3', nodes: ['X', 'Y', 'Z'] },
      ];

      const score = noveltyScorer.calculateNovelty(path, historicalPaths);
      
      expect(score.frequency).toBe(2);
    });

    it('should count sub-path matches correctly', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B'],
      };

      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B', 'C', 'D'] },
        { id: 'hist2', nodes: ['X', 'A', 'B', 'Y'] },
        { id: 'hist3', nodes: ['A', 'B'] },
      ];

      const score = noveltyScorer.calculateNovelty(path, historicalPaths);
      
      // Should match all 3 (sub-path in first two, exact match in third)
      expect(score.frequency).toBe(3);
    });

    it('should handle empty historical paths', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score.frequency).toBe(0);
      expect(score.novelty).toBe(1.0);
    });
  });

  describe('Sub-Path Generation', () => {
    it('should generate all sub-paths correctly', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
      };

      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B'] },
        { id: 'hist2', nodes: ['B', 'C'] },
      ];

      const score = noveltyScorer.calculateNovelty(path, historicalPaths);
      
      // Should calculate sub-path frequencies
      expect(score.subPathFrequency.size).toBeGreaterThan(0);
      expect(score.breakdown.subPathNovelty).toBeGreaterThan(0);
    });

    it('should handle paths with single node', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      // Single node paths should have no sub-paths (need at least 2 nodes)
      expect(score.novelty).toBe(1.0);
    });
  });

  describe('Path Matching', () => {
    it('should detect exact matches', () => {
      const path1: Path = { id: 'p1', nodes: ['A', 'B', 'C'] };
      const path2: Path = { id: 'p2', nodes: ['A', 'B', 'C'] };

      const score = noveltyScorer.calculateNovelty(path1, [path2]);
      
      expect(score.frequency).toBe(1);
    });

    it('should detect sub-path matches at start', () => {
      const path1: Path = { id: 'p1', nodes: ['A', 'B'] };
      const path2: Path = { id: 'p2', nodes: ['A', 'B', 'C', 'D'] };

      const score = noveltyScorer.calculateNovelty(path1, [path2]);
      
      expect(score.frequency).toBe(1);
    });

    it('should detect sub-path matches in middle', () => {
      const path1: Path = { id: 'p1', nodes: ['B', 'C'] };
      const path2: Path = { id: 'p2', nodes: ['A', 'B', 'C', 'D'] };

      const score = noveltyScorer.calculateNovelty(path1, [path2]);
      
      expect(score.frequency).toBe(1);
    });

    it('should not match non-consecutive nodes', () => {
      const path1: Path = { id: 'p1', nodes: ['A', 'C'] };
      const path2: Path = { id: 'p2', nodes: ['A', 'B', 'C'] };

      const score = noveltyScorer.calculateNovelty(path1, [path2]);
      
      // Should not match because A and C are not consecutive
      expect(score.frequency).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should batch calculate novelty for multiple paths', () => {
      const paths: Path[] = [
        { id: 'p1', nodes: ['A', 'B'] },
        { id: 'p2', nodes: ['C', 'D'] },
        { id: 'p3', nodes: ['E', 'F'] },
      ];

      const scores = noveltyScorer.batchCalculateNovelty(paths);
      
      expect(scores).toHaveLength(3);
      scores.forEach(score => {
        expect(score.novelty).toBeGreaterThanOrEqual(0);
        expect(score.novelty).toBeLessThanOrEqual(1);
      });
    });

    it('should get most novel paths correctly', () => {
      const historicalPaths: Path[] = [
        { id: 'hist1', nodes: ['A', 'B'] },
        { id: 'hist2', nodes: ['A', 'B'] },
        { id: 'hist3', nodes: ['C', 'D'] },
      ];

      noveltyScorer.addHistoricalPaths(historicalPaths);

      const paths: Path[] = [
        { id: 'p1', nodes: ['A', 'B'] }, // Seen twice
        { id: 'p2', nodes: ['C', 'D'] }, // Seen once
        { id: 'p3', nodes: ['E', 'F'] }, // Never seen
      ];

      const mostNovel = noveltyScorer.getMostNovelPaths(paths, 2);
      
      expect(mostNovel).toHaveLength(2);
      // Most novel should be p3 (never seen), then p2, then p1
      expect(mostNovel[0].path.id).toBe('p3');
      expect(mostNovel[0].novelty).toBeGreaterThan(mostNovel[1].novelty);
    });
  });

  describe('Historical Path Management', () => {
    it('should add historical paths correctly', () => {
      const paths: Path[] = [
        { id: 'p1', nodes: ['A', 'B'] },
        { id: 'p2', nodes: ['C', 'D'] },
      ];

      noveltyScorer.addHistoricalPaths(paths);

      const testPath: Path = { id: 'test', nodes: ['A', 'B'] };
      const score = noveltyScorer.calculateNovelty(testPath);
      
      expect(score.frequency).toBe(1);
    });

    it('should clear history correctly', () => {
      const paths: Path[] = [
        { id: 'p1', nodes: ['A', 'B'] },
      ];

      noveltyScorer.addHistoricalPaths(paths);
      noveltyScorer.clearHistory();

      const testPath: Path = { id: 'test', nodes: ['A', 'B'] };
      const score = noveltyScorer.calculateNovelty(testPath);
      
      expect(score.frequency).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty node arrays', () => {
      const path: Path = {
        id: 'path1',
        nodes: [],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score.novelty).toBeGreaterThanOrEqual(0);
      expect(score.frequency).toBe(0);
    });

    it('should handle paths with duplicate nodes', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'A', 'B'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score.novelty).toBe(1.0);
    });

    it('should handle very long paths', () => {
      const path: Path = {
        id: 'path1',
        nodes: Array.from({ length: 20 }, (_, i) => `Node${i}`),
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score.novelty).toBe(1.0);
      expect(score.subPathFrequency.size).toBeGreaterThan(0);
    });

    it('should handle paths with different types', () => {
      const path1: Path = {
        id: 'p1',
        nodes: ['A', 'B'],
        type: 'problem-solution-effect',
      };

      const path2: Path = {
        id: 'p2',
        nodes: ['A', 'B'],
        type: 'memory',
      };

      const score = noveltyScorer.calculateNovelty(path1, [path2]);
      
      // Note: Implementation matches by node sequence, not type
      // Same node sequence = match, regardless of type
      expect(score.frequency).toBe(1);
      expect(score.novelty).toBeLessThan(1.0); // Lower novelty due to frequency
    });
  });

  describe('Novelty Score Structure', () => {
    it('should return complete novelty score structure', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      expect(score).toHaveProperty('path');
      expect(score).toHaveProperty('novelty');
      expect(score).toHaveProperty('frequency');
      expect(score).toHaveProperty('subPathFrequency');
      expect(score).toHaveProperty('breakdown');
      
      expect(score.breakdown).toHaveProperty('fullPathNovelty');
      expect(score.breakdown).toHaveProperty('subPathNovelty');
      expect(score.breakdown).toHaveProperty('averageNovelty');
    });

    it('should calculate overall novelty as weighted average', () => {
      const path: Path = {
        id: 'path1',
        nodes: ['A', 'B', 'C'],
      };

      const score = noveltyScorer.calculateNovelty(path, []);
      
      // Overall = 0.6 * fullPathNovelty + 0.4 * subPathNovelty
      const expected = 0.6 * score.breakdown.fullPathNovelty + 0.4 * score.breakdown.subPathNovelty;
      expect(score.novelty).toBeCloseTo(expected, 5);
    });
  });
});

