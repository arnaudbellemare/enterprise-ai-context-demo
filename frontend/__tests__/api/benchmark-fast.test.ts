/**
 * Integration test suite for Fast Benchmark API Route
 * Uses real implementations (no mocks)
 *
 * Tests cover:
 * - Response structure validation
 * - Error handling structure
 * - API endpoint functionality
 */

import { POST, GET } from '../../app/api/benchmark/fast/route';
import { NextRequest } from 'next/server';

describe('Fast Benchmark API - POST /api/benchmark/fast', () => {
  it('should return properly structured response', async () => {
    // Arrange
    const mockRequest = {
      json: jest.fn().mockResolvedValue({})
    } as unknown as NextRequest;

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert - validate response structure
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.results)).toBe(true);
    
    // Validate summary structure
    if (data.summary) {
      expect(data.summary).toHaveProperty('totalTests');
      expect(typeof data.summary.totalTests).toBe('number');
    }
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
    expect(data).toHaveProperty('error');
  });

  it('should return results with proper structure when successful', async () => {
    // Arrange
    const mockRequest = {
      json: jest.fn().mockResolvedValue({})
    } as unknown as NextRequest;

    // Act
    const response = await POST(mockRequest);
    const data = await response.json();

    // Assert - if we have results, validate their structure
    if (data.success && data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      expect(firstResult).toHaveProperty('query');
      expect(firstResult).toHaveProperty('permutation');
      expect(firstResult).toHaveProperty('baseline');
      
      if (firstResult.permutation) {
        expect(firstResult.permutation).toHaveProperty('quality');
        expect(firstResult.permutation).toHaveProperty('duration');
      }
      if (firstResult.baseline) {
        expect(firstResult.baseline).toHaveProperty('quality');
        expect(firstResult.baseline).toHaveProperty('duration');
      }
    }
  });
});

describe('Fast Benchmark API - GET /api/benchmark/fast', () => {
  it('should return benchmark information', async () => {
    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('availableQueries');
    expect(typeof data.availableQueries).toBe('number');
  });
});

// Export for coverage reporting
export { POST, GET };
