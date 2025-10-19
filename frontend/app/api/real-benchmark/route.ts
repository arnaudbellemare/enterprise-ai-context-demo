import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Real Benchmark: PERMUTATION vs Plain Perplexity
 * No fake data, no mock OCR - just real performance comparison
 */
export async function POST(request: NextRequest) {
  try {
    const { query, testName } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Real Benchmark Test: ${testName || 'Unknown'}`);
    console.log(`   Query: ${query}`);

    const results: any = {
      testName: testName || 'Real Benchmark Test',
      query,
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Plain Perplexity (Direct API call)
    console.log(`   🔍 Testing Plain Perplexity...`);
    const perplexityResult = await testPlainPerplexity(query);
    results.tests.push(perplexityResult);

    // Test 2: PERMUTATION System
    console.log(`   🧠 Testing PERMUTATION System...`);
    const permutationResult = await testPermutationSystem(query);
    results.tests.push(permutationResult);

    // Calculate comparison metrics
    const comparison = calculateComparison(perplexityResult, permutationResult);

    return NextResponse.json({
      success: true,
      ...results,
      comparison,
      summary: {
        winner: comparison.winner,
        improvement: comparison.improvement,
        speedDifference: comparison.speedDifference,
        qualityDifference: comparison.qualityDifference
      }
    });

  } catch (error: any) {
    console.error('Real Benchmark error:', error);
    return NextResponse.json(
      { error: error.message || 'Real Benchmark processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Test Plain Perplexity (Direct API call)
 */
async function testPlainPerplexity(query: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Direct Perplexity API call
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    const responseText = data.choices[0]?.message?.content || '';

    return {
      system: 'Plain Perplexity',
      processingTimeMs: processingTime,
      responseLength: responseText.length,
      response: responseText,
      success: true,
      error: null
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    return {
      system: 'Plain Perplexity',
      processingTimeMs: processingTime,
      responseLength: 0,
      response: '',
      success: false,
      error: error.message
    };
  }
}

/**
 * Test PERMUTATION System
 */
async function testPermutationSystem(query: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Call our PERMUTATION system via /api/brain
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        domain: detectDomain(query),
        budget: 0.01,
        quality: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`PERMUTATION API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    const responseText = data.response || '';

    return {
      system: 'PERMUTATION',
      processingTimeMs: processingTime,
      responseLength: responseText.length,
      response: responseText,
      success: true,
      error: null
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    return {
      system: 'PERMUTATION',
      processingTimeMs: processingTime,
      responseLength: 0,
      response: '',
      success: false,
      error: error.message
    };
  }
}

/**
 * Detect domain from query
 */
function detectDomain(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('legal') || lowerQuery.includes('compliance') || lowerQuery.includes('law') || lowerQuery.includes('regulation')) {
    return 'legal';
  }
  if (lowerQuery.includes('medical') || lowerQuery.includes('health') || lowerQuery.includes('doctor') || lowerQuery.includes('patient')) {
    return 'healthcare';
  }
  if (lowerQuery.includes('finance') || lowerQuery.includes('investment') || lowerQuery.includes('banking') || lowerQuery.includes('money')) {
    return 'finance';
  }
  if (lowerQuery.includes('technology') || lowerQuery.includes('software') || lowerQuery.includes('ai') || lowerQuery.includes('tech')) {
    return 'technology';
  }
  if (lowerQuery.includes('education') || lowerQuery.includes('learning') || lowerQuery.includes('school') || lowerQuery.includes('student')) {
    return 'education';
  }
  
  return 'general';
}

/**
 * Calculate comparison metrics
 */
function calculateComparison(perplexityResult: any, permutationResult: any): any {
  if (!perplexityResult.success || !permutationResult.success) {
    return {
      winner: 'Error - Both systems failed',
      improvement: 0,
      speedDifference: 0,
      qualityDifference: 0,
      details: 'One or both systems failed'
    };
  }

  // Speed comparison (lower is better)
  const speedDifference = ((perplexityResult.processingTimeMs - permutationResult.processingTimeMs) / perplexityResult.processingTimeMs) * 100;
  
  // Content length comparison (higher is better for comprehensive responses)
  const qualityDifference = ((permutationResult.responseLength - perplexityResult.responseLength) / perplexityResult.responseLength) * 100;
  
  // Determine winner
  let winner = 'Tie';
  let improvement = 0;
  
  if (speedDifference > 0 && qualityDifference > 0) {
    winner = 'PERMUTATION';
    improvement = (speedDifference + qualityDifference) / 2;
  } else if (speedDifference < 0 && qualityDifference < 0) {
    winner = 'Plain Perplexity';
    improvement = Math.abs((speedDifference + qualityDifference) / 2);
  } else {
    winner = 'Mixed Results';
    improvement = Math.abs(speedDifference + qualityDifference) / 2;
  }

  return {
    winner,
    improvement: improvement.toFixed(2),
    speedDifference: speedDifference.toFixed(2),
    qualityDifference: qualityDifference.toFixed(2),
    details: {
      perplexityTime: perplexityResult.processingTimeMs,
      permutationTime: permutationResult.processingTimeMs,
      perplexityLength: perplexityResult.responseLength,
      permutationLength: permutationResult.responseLength
    }
  };
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Real Benchmark API is working',
    endpoints: {
      POST: '/api/real-benchmark - Compare PERMUTATION vs Plain Perplexity'
    },
    features: [
      'Real Perplexity API calls',
      'Real PERMUTATION system calls',
      'Actual performance measurement',
      'No fake data or mock results',
      'Direct speed and quality comparison'
    ]
  });
}
