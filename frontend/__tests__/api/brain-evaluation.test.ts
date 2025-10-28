/**
 * Comprehensive test suite for Brain Evaluation API Route
 * Target Coverage: 90%+
 *
 * Tests cover:
 * - Happy path scenarios
 * - Error handling and validation
 * - Edge cases
 * - Logging behavior
 * - Response structure validation
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

jest.mock('../../lib/brain-evaluation-system', () => ({
  brainEvaluationSystem: {
    evaluateBrainResponse: jest.fn()
  }
}));

// Import modules and get mock instances
import { POST, GET } from '../../app/api/brain-evaluation/route';
import { NextRequest } from 'next/server';
import { brainEvaluationSystem } from '../../lib/brain-evaluation-system';

const mockLogger = (require('../../lib/walt/logger') as any).__mockLoggerInstance;
const mockBrainEvaluationSystem = brainEvaluationSystem;

describe('Brain Evaluation API - POST /api/brain-evaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Evaluation Scenarios', () => {
    it('should successfully evaluate a basic query with required fields only', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 0.85,
        domainScores: [
          { name: 'technical', score: 0.90, reason: 'Good technical accuracy' },
          { name: 'clarity', score: 0.80, reason: 'Clear explanation' }
        ],
        recommendations: ['Consider adding examples', 'Expand on edge cases']
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const requestBody = {
        query: 'What is TypeScript?',
        response: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.'
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.evaluation).toBeDefined();
      expect(data.evaluation.overallScore).toBe(0.85);
      expect(data.evaluation.domainScores).toHaveLength(2);
      expect(data.evaluation.recommendations).toHaveLength(2);
      expect(data.evaluation.processingTime).toBeGreaterThan(0);
      expect(data.evaluation.timestamp).toBeDefined();

      // Verify metadata
      expect(data.metadata).toBeDefined();
      expect(data.metadata.query_length).toBe(requestBody.query.length);
      expect(data.metadata.response_length).toBe(requestBody.response.length);
      expect(data.metadata.domain).toBe('general');
      expect(data.metadata.reasoning_mode).toBe('standard');
      expect(data.metadata.patterns_activated).toEqual([]);
      expect(data.metadata.evaluation_framework).toBe('open-evals');

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting brain evaluation',
        expect.objectContaining({
          query: 'What is TypeScript?',
          domain: 'general',
          responseLength: requestBody.response.length
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Brain evaluation completed',
        expect.objectContaining({
          processingTime: expect.any(Number),
          overallScore: 0.85,
          domainScoresCount: 2,
          recommendationsCount: 2
        })
      );
    });

    it('should successfully evaluate with all optional fields provided', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 0.92,
        domainScores: [
          { name: 'financial', score: 0.95, reason: 'Excellent financial analysis' },
          { name: 'legal', score: 0.89, reason: 'Strong legal reasoning' }
        ],
        recommendations: ['Add regulatory references']
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const requestBody = {
        query: 'Analyze the financial implications of this legal case',
        response: 'Based on the case details, there are significant financial liabilities...',
        domain: 'financial-legal',
        reasoningMode: 'advanced',
        patternsActivated: ['legal-analysis', 'financial-modeling'],
        metadata: {
          userId: 'test-user-123',
          sessionId: 'session-456'
        }
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.domain).toBe('financial-legal');
      expect(data.metadata.reasoning_mode).toBe('advanced');
      expect(data.metadata.patterns_activated).toEqual(['legal-analysis', 'financial-modeling']);

      // Verify evaluation system was called with correct sample
      expect(mockBrainEvaluationSystem.evaluateBrainResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          query: requestBody.query,
          response: requestBody.response,
          domain: 'financial-legal',
          reasoningMode: 'advanced',
          patternsActivated: ['legal-analysis', 'financial-modeling'],
          metadata: { userId: 'test-user-123', sessionId: 'session-456' }
        })
      );

      // Verify logger was called with domain
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting brain evaluation',
        expect.objectContaining({
          domain: 'financial-legal'
        })
      );
    });

    it('should handle long queries by truncating in logs', async () => {
      // Arrange
      const longQuery = 'A'.repeat(200);
      const mockEvaluation = {
        overallScore: 0.75,
        domainScores: [],
        recommendations: []
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: longQuery,
          response: 'Response text'
        })
      } as unknown as NextRequest;

      // Act
      await POST(mockRequest);

      // Assert - verify query was truncated to 100 characters in log
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting brain evaluation',
        expect.objectContaining({
          query: longQuery.substring(0, 100)
        })
      );
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should return 400 error when query is missing', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          response: 'Some response without query'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Query and response are required');
      expect(mockBrainEvaluationSystem.evaluateBrainResponse).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should return 400 error when response is missing', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Some query without response'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Query and response are required');
      expect(mockBrainEvaluationSystem.evaluateBrainResponse).not.toHaveBeenCalled();
    });

    it('should return 400 error when both query and response are missing', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Query and response are required');
    });

    it('should return 400 error when query is empty string', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: '',
          response: 'Some response'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Query and response are required');
    });

    it('should return 400 error when response is empty string', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Some query',
          response: ''
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Query and response are required');
    });
  });

  describe('Error Handling and Fallback Scenarios', () => {
    it('should return 500 with fallback data when evaluation system throws Error', async () => {
      // Arrange
      const errorMessage = 'Evaluation system temporarily unavailable';
      mockBrainEvaluationSystem.evaluateBrainResponse.mockRejectedValue(
        new Error(errorMessage)
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test query',
          response: 'Test response'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(errorMessage);
      expect(data.fallback).toBeDefined();
      expect(data.fallback.overallScore).toBe(0.5);
      expect(data.fallback.domainScores).toHaveLength(1);
      expect(data.fallback.domainScores[0].name).toBe('error_evaluation');
      expect(data.fallback.recommendations).toContain('Fix evaluation system');
      expect(data.fallback.recommendations).toContain('Check error logs');

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Brain evaluation failed',
        { error: errorMessage }
      );
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      mockBrainEvaluationSystem.evaluateBrainResponse.mockRejectedValue(
        'String error message'
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test query',
          response: 'Test response'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Brain evaluation failed',
        { error: 'Unknown error' }
      );
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include fallback data with correct structure on error', async () => {
      // Arrange
      mockBrainEvaluationSystem.evaluateBrainResponse.mockRejectedValue(
        new Error('Test error')
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test',
          response: 'Test'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert - verify fallback structure
      expect(data.fallback).toEqual({
        overallScore: 0.5,
        domainScores: [{
          name: 'error_evaluation',
          score: 0.5,
          reason: 'Evaluation failed, using fallback score'
        }],
        recommendations: ['Fix evaluation system', 'Check error logs'],
        processingTime: 0.1
      });
    });
  });

  describe('Performance and Timing', () => {
    it('should calculate processing time correctly', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 0.88,
        domainScores: [],
        recommendations: []
      };

      // Simulate slow evaluation (100ms)
      mockBrainEvaluationSystem.evaluateBrainResponse.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockEvaluation), 100))
      );

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test query',
          response: 'Test response'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(data.evaluation.processingTime).toBeGreaterThanOrEqual(0.1); // At least 100ms
      expect(data.evaluation.processingTime).toBeLessThan(1); // Less than 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in query and response', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 0.75,
        domainScores: [],
        recommendations: []
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const requestBody = {
        query: 'Query with special chars: <>&"\' and emojis 🚀💡',
        response: 'Response with {json: "like"} syntax & more'
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle extremely long responses', async () => {
      // Arrange
      const longResponse = 'A'.repeat(100000); // 100KB response
      const mockEvaluation = {
        overallScore: 0.70,
        domainScores: [],
        recommendations: []
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test',
          response: longResponse
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.metadata.response_length).toBe(100000);
    });

    it('should handle evaluation with empty domain scores', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 0.60,
        domainScores: [], // Empty array
        recommendations: ['Improve response']
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test',
          response: 'Test'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.evaluation.domainScores).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Brain evaluation completed',
        expect.objectContaining({
          domainScoresCount: 0
        })
      );
    });

    it('should handle evaluation with empty recommendations', async () => {
      // Arrange
      const mockEvaluation = {
        overallScore: 1.0,
        domainScores: [{ name: 'perfect', score: 1.0, reason: 'Flawless' }],
        recommendations: [] // Perfect response needs no recommendations
      };
      mockBrainEvaluationSystem.evaluateBrainResponse.mockResolvedValue(mockEvaluation);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test',
          response: 'Test'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.evaluation.recommendations).toEqual([]);
    });
  });
});

describe('Brain Evaluation API - GET /api/brain-evaluation', () => {
  it('should return API information', async () => {
    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.message).toBe('Brain Evaluation System');
    expect(data.description).toBe('Real-time quality assessment using open-evals framework');
    expect(data.capabilities).toHaveLength(5);
    expect(data.capabilities).toContain('Creative reasoning evaluation');
    expect(data.capabilities).toContain('Legal analysis assessment');
    expect(data.capabilities).toContain('Technology optimization evaluation');
    expect(data.capabilities).toContain('Domain-specific quality metrics');
    expect(data.capabilities).toContain('Automated recommendations');
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints.POST).toBe('/api/brain-evaluation');
    expect(data.endpoints.description).toBe('Evaluate brain system response quality');
  });

  it('should not require authentication for GET endpoint', async () => {
    // Act
    const response = await GET();

    // Assert
    expect(response.status).toBe(200);
  });
});

// Export for coverage reporting
export { POST, GET };
