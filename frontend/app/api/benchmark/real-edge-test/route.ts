import { NextRequest, NextResponse } from 'next/server';

/**
 * REAL EDGE TEST - No Mocks, No Bullshit
 * 
 * This benchmark answers ONE question:
 * Does PERMUTATION actually have an edge over vanilla LLM calls?
 * 
 * Test Setup:
 * 1. Baseline: Direct LLM call (Teacher Model only)
 * 2. PERMUTATION: Full system with all 11 components
 * 3. Real queries that require: reasoning, real-time data, domain expertise
 * 4. Measure: Accuracy, Latency, Cost, Quality
 */

interface TestResult {
  query: string;
  baseline: {
    answer: string;
    latency_ms: number;
    cost: number;
    accuracy_score: number;
    quality_score: number;
  };
  permutation: {
    answer: string;
    latency_ms: number;
    cost: number;
    accuracy_score: number;
    quality_score: number;
    components_used: string[];
  };
  winner: 'baseline' | 'permutation' | 'tie';
  edge_metrics: {
    latency_difference_ms: number;
    cost_difference: number;
    accuracy_improvement: number;
    quality_improvement: number;
  };
}

interface BenchmarkReport {
  test_date: string;
  total_tests: number;
  permutation_wins: number;
  baseline_wins: number;
  ties: number;
  avg_accuracy_improvement: number;
  avg_quality_improvement: number;
  avg_latency_overhead_ms: number;
  avg_cost_overhead: number;
  edge_confirmed: boolean;
  results: TestResult[];
}

// REAL TEST QUERIES - Diverse, challenging, require multiple capabilities
const REAL_TEST_QUERIES = [
  {
    query: "Calculate 10% of $1000 and explain the result",
    domain: "general",
    requires: ["calculation", "reasoning"]
  },
  {
    query: "If Bitcoin drops 20% from $50,000, what's the new price?",
    domain: "crypto",
    requires: ["calculation", "reasoning"]
  },
  {
    query: "What's better for a small business: LLC or S-Corp?",
    domain: "financial",
    requires: ["domain_expertise", "comparison", "recommendation"]
  }
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  console.log('\n🔥 ===============================================');
  console.log('🔥 REAL EDGE TEST - NO MOCKS, NO BULLSHIT');
  console.log('🔥 Testing: PERMUTATION vs Baseline (Direct LLM)');
  console.log('🔥 ===============================================\n');

  try {
    // Dynamically import to avoid SSR issues
    const { PermutationEngine } = await import('@/lib/permutation-engine');
    const { ACELLMClient } = await import('@/lib/ace-llm-client');

    const llmClient = new ACELLMClient();
    const permutationEngine = new PermutationEngine();

    const results: TestResult[] = [];

    // Run tests on all queries
    for (let i = 0; i < REAL_TEST_QUERIES.length; i++) {
      const testCase = REAL_TEST_QUERIES[i];
      console.log(`\n📊 TEST ${i + 1}/${REAL_TEST_QUERIES.length}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Domain: ${testCase.domain}`);
      console.log(`Requires: ${testCase.requires.join(', ')}`);
      console.log('─'.repeat(80));

      // ============================================
      // BASELINE: Direct Teacher Model Call (No PERMUTATION)
      // ============================================
      console.log('\n🔹 Testing BASELINE (Direct LLM)...');
      const baselineStart = performance.now();
      
      let baselineAnswer = '';
      let baselineCost = 0;
      
      try {
        // Add timeout to prevent hanging
        const baselinePromise = llmClient.generate(testCase.query, true);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
        );
        
        const baselineResponse = await Promise.race([baselinePromise, timeoutPromise]) as any;
        baselineAnswer = baselineResponse.text || 'No response from LLM';
        baselineCost = baselineResponse.cost || 0;
      } catch (error: any) {
        console.log(`⚠️ Baseline failed: ${error.message}`);
        baselineAnswer = `Baseline LLM call failed: ${error.message}`;
      }

      const baselineLatency = performance.now() - baselineStart;
      
      // Calculate baseline quality metrics
      const baselineAccuracy = calculateAccuracyScore(baselineAnswer, testCase.requires);
      const baselineQuality = calculateQualityScore(baselineAnswer);
      
      console.log(`✅ Baseline complete: ${baselineLatency.toFixed(0)}ms, $${baselineCost.toFixed(4)}`);
      console.log(`   Accuracy: ${baselineAccuracy}%, Quality: ${baselineQuality}%`);

      // ============================================
      // PERMUTATION: Full System with All Components
      // ============================================
      console.log('\n🔸 Testing PERMUTATION (Full System)...');
      const permutationStart = performance.now();
      
      let permutationAnswer = '';
      let permutationCost = 0;
      let componentsUsed: string[] = [];
      
      try {
        // Add timeout to prevent hanging (30s for full system)
        const permutationPromise = permutationEngine.execute(testCase.query, testCase.domain);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
        );
        
        const permutationResponse = await Promise.race([permutationPromise, timeoutPromise]) as any;
        permutationAnswer = permutationResponse.answer || 'No answer from PERMUTATION';
        permutationCost = permutationResponse.metadata?.cost || 0;
        componentsUsed = permutationResponse.metadata?.components_used || [];
      } catch (error: any) {
        console.log(`⚠️ PERMUTATION failed: ${error.message}`);
        permutationAnswer = `PERMUTATION system failed: ${error.message}`;
      }

      const permutationLatency = performance.now() - permutationStart;
      
      // Calculate PERMUTATION quality metrics
      const permutationAccuracy = calculateAccuracyScore(permutationAnswer, testCase.requires);
      const permutationQuality = calculateQualityScore(permutationAnswer);
      
      console.log(`✅ PERMUTATION complete: ${permutationLatency.toFixed(0)}ms, $${permutationCost.toFixed(4)}`);
      console.log(`   Accuracy: ${permutationAccuracy}%, Quality: ${permutationQuality}%`);
      console.log(`   Components: ${componentsUsed.length} (${componentsUsed.slice(0, 3).join(', ')}...)`);

      // ============================================
      // DETERMINE WINNER
      // ============================================
      const accuracyDiff = permutationAccuracy - baselineAccuracy;
      const qualityDiff = permutationQuality - baselineQuality;
      
      // Winner is determined by combined accuracy + quality improvement
      const combinedImprovement = accuracyDiff + qualityDiff;
      
      let winner: 'baseline' | 'permutation' | 'tie';
      if (combinedImprovement > 5) {
        winner = 'permutation';
        console.log(`\n🏆 WINNER: PERMUTATION (+${combinedImprovement.toFixed(1)}% improvement)`);
      } else if (combinedImprovement < -5) {
        winner = 'baseline';
        console.log(`\n🏆 WINNER: BASELINE (+${Math.abs(combinedImprovement).toFixed(1)}% better)`);
      } else {
        winner = 'tie';
        console.log(`\n🤝 TIE (difference < 5%)`);
      }

      results.push({
        query: testCase.query,
        baseline: {
          answer: baselineAnswer,
          latency_ms: baselineLatency,
          cost: baselineCost,
          accuracy_score: baselineAccuracy,
          quality_score: baselineQuality
        },
        permutation: {
          answer: permutationAnswer,
          latency_ms: permutationLatency,
          cost: permutationCost,
          accuracy_score: permutationAccuracy,
          quality_score: permutationQuality,
          components_used: componentsUsed
        },
        winner,
        edge_metrics: {
          latency_difference_ms: permutationLatency - baselineLatency,
          cost_difference: permutationCost - baselineCost,
          accuracy_improvement: accuracyDiff,
          quality_improvement: qualityDiff
        }
      });
    }

    // ============================================
    // GENERATE FINAL REPORT
    // ============================================
    const permutationWins = results.filter(r => r.winner === 'permutation').length;
    const baselineWins = results.filter(r => r.winner === 'baseline').length;
    const ties = results.filter(r => r.winner === 'tie').length;

    const avgAccuracyImprovement = results.reduce((sum, r) => sum + r.edge_metrics.accuracy_improvement, 0) / results.length;
    const avgQualityImprovement = results.reduce((sum, r) => sum + r.edge_metrics.quality_improvement, 0) / results.length;
    const avgLatencyOverhead = results.reduce((sum, r) => sum + r.edge_metrics.latency_difference_ms, 0) / results.length;
    const avgCostOverhead = results.reduce((sum, r) => sum + r.edge_metrics.cost_difference, 0) / results.length;

    // Edge is confirmed if:
    // 1. PERMUTATION wins more than baseline
    // 2. Average quality improvement > 10%
    // 3. OR average accuracy improvement > 15%
    const edgeConfirmed = (
      permutationWins > baselineWins ||
      avgQualityImprovement > 10 ||
      avgAccuracyImprovement > 15
    );

    const report: BenchmarkReport = {
      test_date: new Date().toISOString(),
      total_tests: results.length,
      permutation_wins: permutationWins,
      baseline_wins: baselineWins,
      ties,
      avg_accuracy_improvement: Math.round(avgAccuracyImprovement * 10) / 10,
      avg_quality_improvement: Math.round(avgQualityImprovement * 10) / 10,
      avg_latency_overhead_ms: Math.round(avgLatencyOverhead),
      avg_cost_overhead: Math.round(avgCostOverhead * 10000) / 10000,
      edge_confirmed: edgeConfirmed,
      results
    };

    const totalTime = Date.now() - startTime;

    console.log('\n\n🎯 ===============================================');
    console.log('🎯 FINAL VERDICT');
    console.log('🎯 ===============================================');
    console.log(`\n📊 Test Results:`);
    console.log(`   Total Tests: ${report.total_tests}`);
    console.log(`   PERMUTATION Wins: ${permutationWins} (${Math.round(permutationWins/report.total_tests*100)}%)`);
    console.log(`   Baseline Wins: ${baselineWins} (${Math.round(baselineWins/report.total_tests*100)}%)`);
    console.log(`   Ties: ${ties}`);
    console.log(`\n📈 Performance Metrics:`);
    console.log(`   Avg Accuracy Improvement: ${avgAccuracyImprovement > 0 ? '+' : ''}${avgAccuracyImprovement.toFixed(1)}%`);
    console.log(`   Avg Quality Improvement: ${avgQualityImprovement > 0 ? '+' : ''}${avgQualityImprovement.toFixed(1)}%`);
    console.log(`   Avg Latency Overhead: ${avgLatencyOverhead.toFixed(0)}ms`);
    console.log(`   Avg Cost Overhead: $${avgCostOverhead.toFixed(4)}`);
    console.log(`\n🔥 EDGE CONFIRMED: ${edgeConfirmed ? 'YES ✅' : 'NO ❌'}`);
    console.log(`\n⏱️ Total benchmark time: ${(totalTime/1000).toFixed(1)}s`);
    console.log('🎯 ===============================================\n');

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('❌ Benchmark failed:', error);
    return NextResponse.json(
      { error: 'Benchmark failed', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// SCORING FUNCTIONS - Based on Real Criteria
// ============================================

function calculateAccuracyScore(answer: string, requirements: string[]): number {
  if (!answer || answer.length < 50) return 0;
  
  let score = 50; // Base score for non-empty answer
  
  // Check if answer addresses the requirements
  const lowerAnswer = answer.toLowerCase();
  
  requirements.forEach(req => {
    switch(req) {
      case 'calculation':
        // Check for numbers, percentages, calculations
        if (/\d+%|\$[\d,]+|[\d.]+x|ratio|profit|loss/i.test(answer)) {
          score += 10;
        }
        break;
      case 'real-time_data':
      case 'real-time_price':
        // Check for recent data indicators
        if (/current|today|recent|latest|2025|this week/i.test(answer)) {
          score += 10;
        }
        break;
      case 'domain_knowledge':
      case 'domain_expertise':
        // Check for domain-specific terms
        if (answer.length > 200 && /technical|specific|specialized|expert/i.test(answer)) {
          score += 10;
        }
        break;
      case 'analysis':
      case 'comparison':
        // Check for analytical language
        if (/compare|versus|better|worse|advantage|disadvantage|pros|cons/i.test(answer)) {
          score += 10;
        }
        break;
      case 'reasoning':
        // Check for reasoning indicators
        if (/because|therefore|thus|hence|as a result|due to/i.test(answer)) {
          score += 10;
        }
        break;
      case 'recommendation':
      case 'strategy':
        // Check for actionable advice
        if (/should|recommend|suggest|strategy|approach|best to/i.test(answer)) {
          score += 10;
        }
        break;
    }
  });
  
  return Math.min(100, score);
}

function calculateQualityScore(answer: string): number {
  if (!answer || answer.length < 50) return 0;
  
  let score = 40; // Base score
  
  // Length quality (more comprehensive = better)
  if (answer.length > 200) score += 10;
  if (answer.length > 500) score += 10;
  if (answer.length > 1000) score += 10;
  
  // Structure quality
  if (answer.includes('\n') || answer.includes('- ') || answer.includes('1.')) {
    score += 10; // Has structure/formatting
  }
  
  // Data quality (has numbers/specifics)
  if (/\d+%|\$[\d,]+|[\d.]+ [a-z]+/i.test(answer)) {
    score += 10; // Contains specific data
  }
  
  // Explanation quality
  if (/because|therefore|thus|this means|as a result/i.test(answer)) {
    score += 10; // Contains reasoning
  }
  
  return Math.min(100, score);
}

