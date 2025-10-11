import { NextRequest, NextResponse } from 'next/server';
import { runStatisticalComparison, TestResult } from '@/lib/statistical-testing';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for full benchmark

/**
 * Statistical Benchmark Suite
 * Runs multiple test cases and provides statistical significance proof
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { testSuite = 'standard' } = await request.json();

    console.log('🧪 Starting statistical benchmark suite...');

    // Define benchmark test cases
    const testCases = [
      {
        id: 'crypto-prices',
        task: 'Get current price of Bitcoin, Ethereum, and Solana',
        expectedData: ['bitcoin', 'ethereum', 'solana', 'price'],
        complexity: 'simple'
      },
      {
        id: 'liquidations',
        task: 'What are the crypto liquidations in the last 24 hours?',
        expectedData: ['liquidation', 'billion', 'long', 'short'],
        complexity: 'complex'
      },
      {
        id: 'hackernews',
        task: 'Find the top 3 trending discussions on Hacker News',
        expectedData: ['hacker', 'news', 'discussion'],
        complexity: 'simple'
      },
      {
        id: 'github-pr',
        task: 'Go to github.com/microsoft/vscode and review latest pull request',
        expectedData: ['pull', 'request', 'github'],
        complexity: 'medium'
      },
      {
        id: 'market-analysis',
        task: 'Analyze current cryptocurrency market trends',
        expectedData: ['trend', 'market', 'crypto'],
        complexity: 'medium'
      }
    ];

    const browserbaseResults: TestResult[] = [];
    const aceResults: TestResult[] = [];

    console.log(`📋 Running ${testCases.length} test cases...`);

    // Run each test case on both systems
    for (const testCase of testCases) {
      console.log(`\n🧪 Test ${testCase.id}: ${testCase.task}`);
      
      // Test Browserbase
      const bbResult = await runBrowserbaseTest(testCase);
      browserbaseResults.push(bbResult);
      
      // Test ACE
      const aceResult = await runACETest(testCase);
      aceResults.push(aceResult);
      
      console.log(`  Browserbase: ${bbResult.correct ? '✅' : '❌'} (${bbResult.responseTime}s, $${bbResult.cost})`);
      console.log(`  ACE: ${aceResult.correct ? '✅' : '❌'} (${aceResult.responseTime}s, $${aceResult.cost})`);
    }

    // Run statistical analysis
    console.log('\n📊 Running statistical significance tests...');
    const stats = runStatisticalComparison(browserbaseResults, aceResults);

    // Calculate aggregate metrics
    const bbAccuracy = browserbaseResults.filter(r => r.correct).length / browserbaseResults.length;
    const aceAccuracy = aceResults.filter(r => r.correct).length / aceResults.length;
    
    const bbAvgCost = browserbaseResults.reduce((sum, r) => sum + r.cost, 0) / browserbaseResults.length;
    const aceAvgCost = aceResults.reduce((sum, r) => sum + r.cost, 0) / aceResults.length;
    
    const bbAvgTime = browserbaseResults.reduce((sum, r) => sum + r.responseTime, 0) / browserbaseResults.length;
    const aceAvgTime = aceResults.reduce((sum, r) => sum + r.responseTime, 0) / aceResults.length;

    const totalDuration = (Date.now() - startTime) / 1000;

    console.log('\n✅ Benchmark complete!');
    console.log(`McNemar's p-value: ${stats.mcnemarsTest.pValue.toFixed(4)}`);
    console.log(`Statistical significance: ${stats.mcnemarsTest.significant ? 'YES' : 'NO'}`);

    return NextResponse.json({
      benchmark: {
        testCases: testCases.length,
        duration: parseFloat(totalDuration.toFixed(2)),
        timestamp: new Date().toISOString()
      },
      results: {
        browserbase: {
          accuracy: parseFloat((bbAccuracy * 100).toFixed(1)),
          avgCost: parseFloat(bbAvgCost.toFixed(4)),
          avgResponseTime: parseFloat(bbAvgTime.toFixed(2)),
          correctTasks: browserbaseResults.filter(r => r.correct).length,
          totalTasks: browserbaseResults.length
        },
        ace: {
          accuracy: parseFloat((aceAccuracy * 100).toFixed(1)),
          avgCost: parseFloat(aceAvgCost.toFixed(4)),
          avgResponseTime: parseFloat(aceAvgTime.toFixed(2)),
          correctTasks: aceResults.filter(r => r.correct).length,
          totalTasks: aceResults.length
        }
      },
      statisticalTests: {
        mcnemarsTest: stats.mcnemarsTest,
        pairedTTest: stats.pairedTTest,
        effectSize: stats.effectSize,
        contingencyMatrix: stats.conclusionMatrix
      },
      conclusion: {
        recommendation: stats.recommendation,
        summary: generateSummary(stats, bbAccuracy, aceAccuracy, bbAvgCost, aceAvgCost),
        statisticallySignificant: stats.mcnemarsTest.significant || stats.pairedTTest.significant,
        confidence: stats.mcnemarsTest.pValue < 0.01 ? '99%' : stats.mcnemarsTest.pValue < 0.05 ? '95%' : '<95%'
      },
      rawData: {
        browserbaseResults,
        aceResults
      }
    });

  } catch (error: any) {
    console.error('Benchmark error:', error);
    
    return NextResponse.json({
      error: error?.message || 'Benchmark failed',
      details: 'Statistical benchmark suite encountered an error'
    }, { status: 500 });
  }
}

async function runBrowserbaseTest(testCase: any): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/arena/execute-browserbase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskDescription: testCase.task }),
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();
    const duration = (Date.now() - start) / 1000;
    
    // Evaluate correctness based on expected data
    const correct = evaluateCorrectness(data.result || '', testCase.expectedData);
    
    return {
      system: 'browserbase',
      correct,
      responseTime: data.duration || duration,
      cost: data.cost || 0.15,
      taskId: testCase.id
    };
    
  } catch (error: any) {
    return {
      system: 'browserbase',
      correct: false,
      responseTime: (Date.now() - start) / 1000,
      cost: 0.15,
      taskId: testCase.id
    };
  }
}

async function runACETest(testCase: any): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/arena/execute-ace-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskDescription: testCase.task }),
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();
    const duration = (Date.now() - start) / 1000;
    
    // Evaluate correctness based on expected data
    const correct = evaluateCorrectness(data.result || '', testCase.expectedData);
    
    return {
      system: 'ace',
      correct,
      responseTime: data.duration || duration,
      cost: data.cost || 0,
      taskId: testCase.id
    };
    
  } catch (error: any) {
    return {
      system: 'ace',
      correct: false,
      responseTime: (Date.now() - start) / 1000,
      cost: 0,
      taskId: testCase.id
    };
  }
}

function evaluateCorrectness(result: string, expectedData: string[]): boolean {
  const resultLower = result.toLowerCase();
  
  // Must contain at least 60% of expected keywords
  const matches = expectedData.filter(keyword => 
    resultLower.includes(keyword.toLowerCase())
  );
  
  const matchRate = matches.length / expectedData.length;
  
  // Also check for error indicators
  const hasError = resultLower.includes('error') || 
                  resultLower.includes('failed') ||
                  resultLower.includes('wrong site') ||
                  result.length < 50;
  
  return matchRate >= 0.6 && !hasError;
}

function generateSummary(
  stats: any,
  bbAccuracy: number,
  aceAccuracy: number,
  bbCost: number,
  aceCost: number
): string {
  const accuracyDiff = ((aceAccuracy - bbAccuracy) * 100).toFixed(1);
  const costSavings = ((bbCost - aceCost) / bbCost * 100).toFixed(1);
  
  let summary = `Statistical Analysis Results:\n\n`;
  
  summary += `Accuracy: ACE ${(aceAccuracy * 100).toFixed(1)}% vs Browserbase ${(bbAccuracy * 100).toFixed(1)}%\n`;
  summary += `  → Difference: ${accuracyDiff}%\n`;
  summary += `  → Statistical Significance: ${stats.mcnemarsTest.significant ? '✅ YES (p<0.05)' : '❌ NO (p>0.05)'}\n\n`;
  
  summary += `Cost: ACE $${aceCost.toFixed(4)} vs Browserbase $${bbCost.toFixed(4)}\n`;
  summary += `  → Savings: ${costSavings}%\n`;
  summary += `  → Statistical Significance: ${stats.pairedTTest.significant ? '✅ YES (p<0.05)' : '❌ NO (p>0.05)'}\n\n`;
  
  summary += `Contingency Matrix (Where systems disagree):\n`;
  summary += `  → ACE correct, Browserbase wrong: ${stats.conclusionMatrix.ace_only} tasks\n`;
  summary += `  → Browserbase correct, ACE wrong: ${stats.conclusionMatrix.browserbase_only} tasks\n`;
  summary += `  → Both correct: ${stats.conclusionMatrix.both_correct} tasks\n`;
  summary += `  → Both wrong: ${stats.conclusionMatrix.both_wrong} tasks\n\n`;
  
  summary += `Effect Size: ${stats.effectSize.interpretation}\n\n`;
  
  summary += `${stats.recommendation}`;
  
  return summary;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Statistical Benchmark API',
    endpoints: {
      POST: 'Run full benchmark suite with statistical tests'
    },
    tests: [
      'McNemar\'s Test (accuracy significance)',
      'Paired t-test (cost/time significance)',
      'Cohen\'s d (effect size)',
      'Contingency matrix analysis'
    ]
  });
}
