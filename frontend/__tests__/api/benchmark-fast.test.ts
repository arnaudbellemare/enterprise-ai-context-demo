/**
 * Comprehensive test suite for Fast Benchmark API Route
 * Target Coverage: 90%+
 *
 * Tests cover:
 * - Happy path benchmark execution
 * - Performance measurement accuracy
 * - Comparison logic (PERMUTATION vs baseline)
 * - Error handling and fallbacks
 * - Edge cases and boundary conditions
 * - Logging behavior
 */

// Mock dependencies using factory functions with singleton instances
jest.mock('../../lib/walt/logger', () => {
  const mockInstance = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };
  return {
    createLogger: jest.fn(() => mockInstance),
    __mockLoggerInstance: mockInstance
  };
});

jest.mock('../../lib/enhanced-unified-pipeline', () => ({
  EnhancedUnifiedPipeline: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));

jest.mock('ollama-ai-provider', () => ({
  generateText: jest.fn()
}));

// Import modules and get mock instances
import { POST, GET } from '../../app/api/benchmark/fast/route';
import { NextRequest } from 'next/server';
import { EnhancedUnifiedPipeline } from '../../lib/enhanced-unified-pipeline';

const mockLogger = (require('../../lib/walt/logger') as any).__mockLoggerInstance;
const mockPermutationEngine = new EnhancedUnifiedPipeline({}) as any;
const mockOllamaBaseline = { generate: require('ollama-ai-provider').generateText };

// Fast query test dataset
const FAST_QUERIES = [
  {
    query: 'What is TypeScript?',
    expectedKeywords: ['typescript', 'javascript', 'types']
  },
  {
    query: 'Explain React hooks',
    expectedKeywords: ['react', 'hooks', 'state']
  },
  {
    query: 'What is Docker?',
    expectedKeywords: ['docker', 'container', 'virtualization']
  }
];

describe('Fast Benchmark API - POST /api/benchmark/fast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Benchmark Scenarios', () => {
    it('should successfully run benchmark and return comparison results', async () => {
      // Arrange
      const permutationResponse = {
        response: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
        quality: 0.92,
        processingTime: 2.5
      };

      const baselineResponse = {
        text: 'TypeScript is a programming language developed by Microsoft.',
        quality: 0.75,
        processingTime: 1.8
      };

      mockPermutationEngine.execute.mockResolvedValue(permutationResponse);
      mockOllamaBaseline.generate.mockResolvedValue(baselineResponse);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.length).toBe(FAST_QUERIES.length);

      // Verify first result structure
      const firstResult = data.results[0];
      expect(firstResult.query).toBeDefined();
      expect(firstResult.permutation).toBeDefined();
      expect(firstResult.baseline).toBeDefined();
      expect(firstResult.improvement).toBeGreaterThan(0);
      expect(firstResult.winner).toBe('permutation');

      // Verify summary statistics
      expect(data.summary).toBeDefined();
      expect(data.summary.totalTests).toBe(FAST_QUERIES.length);
      expect(data.summary.avgImprovementPercent).toBeGreaterThan(0);
      expect(data.summary.permutationWins).toBeGreaterThan(0);
      expect(data.summary.baselineWins).toBeGreaterThanOrEqual(0);
    });

    it('should calculate improvement percentage correctly', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'High quality response',
        quality: 0.90,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Lower quality response',
        quality: 0.60,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      const result = data.results[0];
      // Improvement = ((0.90 - 0.60) / 0.60) * 100 = 50%
      expect(result.improvement).toBeCloseTo(50, 0);
      expect(result.winner).toBe('permutation');
    });

    it('should identify baseline wins when baseline scores higher', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'Lower quality response',
        quality: 0.65,
        processingTime: 3.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Higher quality response',
        quality: 0.85,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      const result = data.results[0];
      expect(result.winner).toBe('baseline');
      expect(result.improvement).toBeLessThan(0);
      expect(data.summary.baselineWins).toBeGreaterThan(0);
    });

    it('should log benchmark progress for each test', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'Test response',
        quality: 0.80,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Test baseline',
        quality: 0.70,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      await POST(mockRequest);

      // Assert - verify logs for each test
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting FAST benchmark run',
        expect.objectContaining({
          queryCount: FAST_QUERIES.length
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Running benchmark test',
        expect.objectContaining({
          testNumber: expect.any(Number),
          totalTests: FAST_QUERIES.length,
          query: expect.any(String)
        })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith('Testing PERMUTATION system');
      expect(mockLogger.debug).toHaveBeenCalledWith('Testing Ollama baseline');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Test completed successfully',
        expect.objectContaining({
          query: expect.any(String),
          permutationQuality: expect.any(Number),
          baselineQuality: expect.any(Number),
          improvement: expect.any(Number)
        })
      );
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle PERMUTATION system failures gracefully', async () => {
      // Arrange
      mockPermutationEngine.execute.mockRejectedValue(
        new Error('PERMUTATION execution failed')
      );

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Baseline response',
        quality: 0.75,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200); // Still succeeds with partial results
      expect(data.results[0].permutation.error).toBe('PERMUTATION execution failed');
      expect(data.results[0].baseline.quality).toBe(0.75);
    });

    it('should handle baseline system failures gracefully', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'PERMUTATION response',
        quality: 0.85,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockRejectedValue(
        new Error('Ollama baseline failed')
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results[0].baseline.error).toBe('Ollama baseline failed');
      expect(data.results[0].permutation.quality).toBe(0.85);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Baseline test failed',
        expect.objectContaining({
          error: 'Ollama baseline failed'
        })
      );
    });

    it('should handle both systems failing', async () => {
      // Arrange
      mockPermutationEngine.execute.mockRejectedValue(
        new Error('PERMUTATION failed')
      );

      mockOllamaBaseline.generate.mockRejectedValue(
        new Error('Baseline failed')
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results[0].permutation.error).toBeDefined();
      expect(data.results[0].baseline.error).toBeDefined();
      expect(data.results[0].winner).toBe('none');
    });

    it('should return 500 on catastrophic failure', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Request parsing failed'))
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Performance Measurement', () => {
    it('should accurately measure processing time for both systems', async () => {
      // Arrange
      mockPermutationEngine.execute.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({
            response: 'Test',
            quality: 0.85,
            processingTime: 0 // Will be measured by benchmark
          }), 100)
        )
      );

      mockOllamaBaseline.generate.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({
            text: 'Test',
            quality: 0.75,
            processingTime: 0
          }), 50)
        )
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      const result = data.results[0];
      expect(result.permutation.processingTime).toBeGreaterThanOrEqual(0.1); // At least 100ms
      expect(result.baseline.processingTime).toBeGreaterThanOrEqual(0.05); // At least 50ms
    });

    it('should calculate total benchmark duration', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'Test',
        quality: 0.85,
        processingTime: 1.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Test',
        quality: 0.75,
        processingTime: 0.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const startTime = Date.now();
      const response = await POST(mockRequest);
      const endTime = Date.now();
      const data = await response.json();

      // Assert
      expect(data.summary.totalDuration).toBeDefined();
      expect(data.summary.totalDuration).toBeGreaterThan(0);
      expect(data.summary.totalDuration).toBeLessThanOrEqual((endTime - startTime) / 1000);
    });
  });

  describe('Quality Assessment', () => {
    it('should validate quality scores are within 0-1 range', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'Test',
        quality: 0.92,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Test',
        quality: 0.78,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      data.results.forEach((result: any) => {
        if (result.permutation.quality !== undefined) {
          expect(result.permutation.quality).toBeGreaterThanOrEqual(0);
          expect(result.permutation.quality).toBeLessThanOrEqual(1);
        }
        if (result.baseline.quality !== undefined) {
          expect(result.baseline.quality).toBeGreaterThanOrEqual(0);
          expect(result.baseline.quality).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should handle edge case of identical quality scores', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'Test',
        quality: 0.80,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'Test',
        quality: 0.80,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      const result = data.results[0];
      expect(result.improvement).toBe(0);
      expect(result.winner).toBe('tie');
    });

    it('should check for expected keywords in responses', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: 'TypeScript is a typed superset of JavaScript with static typing.',
        quality: 0.90,
        processingTime: 2.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: 'TypeScript is a programming language.',
        quality: 0.70,
        processingTime: 1.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      const result = data.results[0];
      const expectedKeywords = FAST_QUERIES[0].expectedKeywords;

      const permutationHasKeywords = expectedKeywords.some(keyword =>
        result.permutation.response.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(permutationHasKeywords).toBe(true);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate average improvement percentage correctly', async () => {
      // Arrange
      mockPermutationEngine.execute
        .mockResolvedValueOnce({ response: 'Test1', quality: 0.90, processingTime: 2.0 })
        .mockResolvedValueOnce({ response: 'Test2', quality: 0.85, processingTime: 2.0 })
        .mockResolvedValueOnce({ response: 'Test3', quality: 0.95, processingTime: 2.0 });

      mockOllamaBaseline.generate
        .mockResolvedValueOnce({ text: 'Test1', quality: 0.60, processingTime: 1.5 })
        .mockResolvedValueOnce({ text: 'Test2', quality: 0.70, processingTime: 1.5 })
        .mockResolvedValueOnce({ text: 'Test3', quality: 0.80, processingTime: 1.5 });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.summary.avgImprovementPercent).toBeGreaterThan(0);
      expect(data.summary.avgImprovementPercent).toBeLessThan(100);
    });

    it('should count wins correctly', async () => {
      // Arrange
      mockPermutationEngine.execute
        .mockResolvedValueOnce({ response: 'Win', quality: 0.90, processingTime: 2.0 })
        .mockResolvedValueOnce({ response: 'Loss', quality: 0.60, processingTime: 2.0 })
        .mockResolvedValueOnce({ response: 'Win', quality: 0.85, processingTime: 2.0 });

      mockOllamaBaseline.generate
        .mockResolvedValueOnce({ text: 'Loss', quality: 0.70, processingTime: 1.5 })
        .mockResolvedValueOnce({ text: 'Win', quality: 0.80, processingTime: 1.5 })
        .mockResolvedValueOnce({ text: 'Loss', quality: 0.75, processingTime: 1.5 });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.summary.permutationWins).toBe(2);
      expect(data.summary.baselineWins).toBe(1);
      expect(data.summary.totalTests).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty responses', async () => {
      // Arrange
      mockPermutationEngine.execute.mockResolvedValue({
        response: '',
        quality: 0.10,
        processingTime: 0.5
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: '',
        quality: 0.10,
        processingTime: 0.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results[0].permutation.response).toBe('');
      expect(data.results[0].baseline.text).toBe('');
    });

    it('should handle very long responses', async () => {
      // Arrange
      const longResponse = 'A'.repeat(100000);

      mockPermutationEngine.execute.mockResolvedValue({
        response: longResponse,
        quality: 0.85,
        processingTime: 3.0
      });

      mockOllamaBaseline.generate.mockResolvedValue({
        text: longResponse,
        quality: 0.75,
        processingTime: 2.5
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results[0].permutation.response.length).toBe(100000);
    });
  });
});

describe('Fast Benchmark API - GET /api/benchmark/fast', () => {
  it('should return benchmark information', async () => {
    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.message).toBe('Fast Benchmark System');
    expect(data.description).toBeDefined();
    expect(data.queryCount).toBe(FAST_QUERIES.length);
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints.POST).toBe('/api/benchmark/fast');
  });

  it('should include query examples in GET response', async () => {
    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.exampleQueries).toBeDefined();
    expect(Array.isArray(data.exampleQueries)).toBe(true);
    expect(data.exampleQueries.length).toBeGreaterThan(0);
  });
});

// Export for coverage reporting
export { POST, GET };
