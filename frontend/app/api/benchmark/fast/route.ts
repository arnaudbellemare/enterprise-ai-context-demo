/**
 * FAST BENCHMARK API
 * 
 * Quick benchmark using simple queries that actually work
 */

import { NextRequest, NextResponse } from 'next/server';

// Fast, simple queries that don't take forever
const FAST_QUERIES = [
  {
    domain: "general",
    query: "What is 2+2?",
    expected_complexity: "simple"
  },
  {
    domain: "general", 
    query: "What is the capital of France?",
    expected_complexity: "simple"
  },
  {
    domain: "general",
    query: "Explain photosynthesis in one sentence.",
    expected_complexity: "simple"
  },
  {
    domain: "general",
    query: "What is machine learning?",
    expected_complexity: "medium"
  },
  {
    domain: "general",
    query: "How do you make coffee?",
    expected_complexity: "simple"
  }
];

function evaluateResponseQuality(response: string): number {
  if (!response || typeof response !== 'string') {
    return 0;
  }

  const text = response.toLowerCase();
  const words = text.split(/\s+/).length;
  
  let qualityScore = 0;
  
  // Length factor (0-30 points)
  if (words >= 20) qualityScore += 30;
  else if (words >= 10) qualityScore += 20;
  else if (words >= 5) qualityScore += 10;
  
  // Accuracy indicators (0-40 points)
  if (text.includes('4') && text.includes('2+2')) qualityScore += 40;
  else if (text.includes('paris') && text.includes('france')) qualityScore += 40;
  else if (text.includes('photosynthesis') && text.includes('sunlight')) qualityScore += 40;
  else if (text.includes('machine learning') && text.includes('algorithm')) qualityScore += 40;
  else if (text.includes('coffee') && (text.includes('water') || text.includes('bean'))) qualityScore += 40;
  else qualityScore += 20; // Partial credit for any response
  
  // Clarity (0-30 points)
  if (words >= 10 && !text.includes('error')) qualityScore += 30;
  else if (words >= 5) qualityScore += 20;
  else qualityScore += 10;
  
  return Math.min(qualityScore, 100) / 100;
}

async function callPermutationAPI(query: string) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/chat/permutation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }]
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.answer || data.response || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0
    };
  }
}

async function callOllamaBaseline(query: string) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: query }],
        stream: false
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.message?.content || data.response || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting FAST benchmark run...');
    
    const results = [];
    
    for (let i = 0; i < FAST_QUERIES.length; i++) {
      const test = FAST_QUERIES[i];
      console.log(`📊 Running test ${i + 1}/${FAST_QUERIES.length}: ${test.query}`);
      
      // Test PERMUTATION
      console.log('🤖 Testing PERMUTATION system...');
      const permutationResult = await callPermutationAPI(test.query);
      
      // Test Baseline
      console.log('🔵 Testing Ollama baseline...');
      const baselineResult = await callOllamaBaseline(test.query);
      
      if (baselineResult.success) {
        const improvement = ((permutationResult.quality - baselineResult.quality) / baselineResult.quality * 100);
        
        results.push({
          domain: test.domain,
          query: test.query,
          permutation: {
            quality: Math.round(permutationResult.quality * 100),
            duration: permutationResult.duration,
            tokens: permutationResult.tokens,
            success: permutationResult.success
          },
          baseline: {
            quality: Math.round(baselineResult.quality * 100),
            duration: baselineResult.duration,
            tokens: baselineResult.tokens,
            success: baselineResult.success
          },
          improvement: Math.round(improvement),
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.query.substring(0, 30)}...: PERMUTATION=${Math.round(permutationResult.quality * 100)}%, Baseline=${Math.round(baselineResult.quality * 100)}%, Improvement=${Math.round(improvement)}%`);
      } else {
        console.log(`❌ ${test.query.substring(0, 30)}...: Baseline failed - ${baselineResult.error}`);
        results.push({
          domain: test.domain,
          query: test.query,
          permutation: {
            quality: Math.round(permutationResult.quality * 100),
            duration: permutationResult.duration,
            tokens: permutationResult.tokens,
            success: permutationResult.success
          },
          baseline: {
            quality: 0,
            duration: 0,
            tokens: 0,
            success: false,
            error: baselineResult.error
          },
          improvement: 0,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Calculate summary statistics
    const successfulTests = results.filter(r => r.baseline.success);
    const avgPermutationQuality = results.reduce((sum, r) => sum + r.permutation.quality, 0) / results.length;
    const avgBaselineQuality = successfulTests.reduce((sum, r) => sum + r.baseline.quality, 0) / Math.max(successfulTests.length, 1);
    const avgImprovement = successfulTests.reduce((sum, r) => sum + r.improvement, 0) / Math.max(successfulTests.length, 1);
    const avgPermutationDuration = results.reduce((sum, r) => sum + r.permutation.duration, 0) / results.length;
    const avgBaselineDuration = successfulTests.reduce((sum, r) => sum + r.baseline.duration, 0) / Math.max(successfulTests.length, 1);

    const summary = {
      totalTests: results.length,
      successfulTests: successfulTests.length,
      avgPermutationQuality: Math.round(avgPermutationQuality),
      avgBaselineQuality: Math.round(avgBaselineQuality),
      avgImprovement: Math.round(avgImprovement),
      avgPermutationDuration: Math.round(avgPermutationDuration / 1000),
      avgBaselineDuration: Math.round(avgBaselineDuration / 1000),
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Fast benchmark completed:', summary);

    return NextResponse.json({
      success: true,
      message: 'Fast benchmarks completed',
      summary: summary,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Fast benchmark error:', error);
    return NextResponse.json({
      error: 'Benchmark failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fast benchmark runner - use POST to run benchmarks',
    availableQueries: FAST_QUERIES.length,
    domains: FAST_QUERIES.map(q => q.domain)
  });
}


