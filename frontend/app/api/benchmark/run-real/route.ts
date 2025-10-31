/**
 * REAL BENCHMARK RUNNER API
 * 
 * Runs actual benchmarks and stores real results in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { PermutationEngine } from '../../../../lib/permutation-engine';

// Real benchmark queries with expected complexity
const REAL_BENCHMARK_QUERIES = [
  {
    domain: "financial",
    query: "Analyze the risk-return profile of a diversified portfolio consisting of 60% S&P 500 index funds, 30% international equity funds, and 10% corporate bonds. Consider the impact of inflation, interest rate changes, and market volatility over a 10-year investment horizon.",
    expected_complexity: "high"
  },
  {
    domain: "crypto", 
    query: "Evaluate the technical and fundamental analysis of Bitcoin's current market position. Analyze on-chain metrics including active addresses, transaction volume, hash rate, and whale movements.",
    expected_complexity: "high"
  },
  {
    domain: "real_estate",
    query: "Conduct a comprehensive market analysis for residential real estate investment in Austin, Texas. Evaluate current market conditions, rental yields, property appreciation trends, and local economic factors.",
    expected_complexity: "high"
  },
  {
    domain: "legal",
    query: "Analyze the legal implications of implementing AI-powered hiring systems in a multinational corporation. Consider employment law compliance across different jurisdictions.",
    expected_complexity: "high"
  },
  {
    domain: "healthcare",
    query: "Evaluate the clinical efficacy and cost-effectiveness of implementing a machine learning-based diagnostic system for early detection of diabetic retinopathy.",
    expected_complexity: "high"
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
  if (words >= 200) qualityScore += 30;
  else if (words >= 100) qualityScore += 20;
  else if (words >= 50) qualityScore += 10;
  
  // Technical depth (0-25 points)
  const technicalTerms = ['analysis', 'evaluate', 'assess', 'consider', 'recommend', 'strategy', 'implementation', 'optimization', 'risk', 'performance'];
  const technicalCount = technicalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(technicalCount * 2.5, 25);
  
  // Structure and organization (0-20 points)
  if (text.includes('1.') || text.includes('•') || text.includes('-')) qualityScore += 10;
  if (text.includes('conclusion') || text.includes('summary')) qualityScore += 5;
  if (text.includes('recommend') || text.includes('suggest')) qualityScore += 5;
  
  // Professional language (0-15 points)
  const professionalTerms = ['however', 'furthermore', 'moreover', 'consequently', 'therefore', 'specifically', 'particularly', 'comprehensive', 'systematic'];
  const professionalCount = professionalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(professionalCount * 2, 15);
  
  // Completeness (0-10 points)
  if (words >= 150 && technicalCount >= 5) qualityScore += 10;
  else if (words >= 100 && technicalCount >= 3) qualityScore += 7;
  else if (words >= 50 && technicalCount >= 2) qualityScore += 5;
  
  return Math.min(qualityScore, 100) / 100;
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
    console.log('🚀 Starting REAL benchmark run...');
    
    const results = [];
    const permutationEngine = new PermutationEngine();
    
    for (let i = 0; i < REAL_BENCHMARK_QUERIES.length; i++) {
      const test = REAL_BENCHMARK_QUERIES[i];
      console.log(`📊 Running test ${i + 1}/${REAL_BENCHMARK_QUERIES.length}: ${test.domain}`);
      
      // Test PERMUTATION
      console.log('🤖 Testing PERMUTATION system...');
      const permutationStart = Date.now();
      const permutationResult = await permutationEngine.execute(test.query);
      const permutationDuration = Date.now() - permutationStart;
      
      const permutationQuality = evaluateResponseQuality(permutationResult.answer);
      
      // Test Baseline
      console.log('🔵 Testing Ollama baseline...');
      const baselineResult = await callOllamaBaseline(test.query);
      
      if (baselineResult.success) {
        const improvement = ((permutationQuality - baselineResult.quality) / baselineResult.quality * 100);
        
        results.push({
          domain: test.domain,
          query: test.query,
          permutation: {
            quality: Math.round(permutationQuality * 100),
            duration: permutationDuration,
            tokens: permutationResult.answer.split(' ').length,
            success: true
          },
          baseline: {
            quality: Math.round(baselineResult.quality * 100),
            duration: baselineResult.duration,
            tokens: baselineResult.tokens,
            success: true
          },
          improvement: Math.round(improvement),
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.domain}: PERMUTATION=${Math.round(permutationQuality * 100)}%, Baseline=${Math.round(baselineResult.quality * 100)}%, Improvement=${Math.round(improvement)}%`);
      } else {
        console.log(`❌ ${test.domain}: Baseline failed - ${baselineResult.error}`);
        results.push({
          domain: test.domain,
          query: test.query,
          permutation: {
            quality: Math.round(permutationQuality * 100),
            duration: permutationDuration,
            tokens: permutationResult.answer.split(' ').length,
            success: true
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

    console.log('🏁 Real benchmark completed:', summary);

    return NextResponse.json({
      success: true,
      message: 'Real benchmarks completed',
      summary: summary,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Real benchmark error:', error);
    return NextResponse.json({
      error: 'Benchmark failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Real benchmark runner - use POST to run benchmarks',
    availableQueries: REAL_BENCHMARK_QUERIES.length,
    domains: REAL_BENCHMARK_QUERIES.map(q => q.domain)
  });
}





