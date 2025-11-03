/**
 * Integration test suite for Brain Evaluation API Route
 * Uses real implementations (no mocks)
 *
 * Tests cover:
 * - Happy path scenarios
 * - Error handling and validation
 * - Edge cases
 * - Response structure validation
 */

import { POST, GET } from '../../app/api/brain-evaluation/route';
import { NextRequest } from 'next/server';

describe('Brain Evaluation API - POST /api/brain-evaluation', () => {

  describe('Successful Evaluation Scenarios', () => {
    it('should successfully evaluate a basic query with required fields only', async () => {
      // Arrange
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
      expect(typeof data.evaluation.overallScore).toBe('number');
      expect(data.evaluation.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.evaluation.overallScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(data.evaluation.domainScores)).toBe(true);
      expect(Array.isArray(data.evaluation.recommendations)).toBe(true);
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
    });

    it('should successfully evaluate with all optional fields provided', async () => {
      // Arrange
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
      expect(data.evaluation).toBeDefined();
      expect(typeof data.evaluation.overallScore).toBe('number');
    });

    it('should handle long queries', async () => {
      // Arrange
      const longQuery = 'A'.repeat(200);
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: longQuery,
          response: 'Response text'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.query_length).toBe(200);
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
    // Note: These tests rely on actual errors occurring in the real system
    // They may not always trigger errors, so we test error handling structure
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
    });

  });

  describe('Performance and Timing', () => {
    it('should calculate processing time correctly', async () => {
      // Arrange
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
      expect(data.evaluation.processingTime).toBeGreaterThan(0);
      expect(data.evaluation.processingTime).toBeLessThan(10); // Should complete within 10 seconds
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in query and response', async () => {
      // Arrange
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
      expect(data.evaluation).toBeDefined();
    });

    it('should handle various response formats', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          query: 'Test query',
          response: 'Test response with some content'
        })
      } as unknown as NextRequest;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.evaluation).toBeDefined();
      expect(Array.isArray(data.evaluation.domainScores)).toBe(true);
      expect(Array.isArray(data.evaluation.recommendations)).toBe(true);
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
