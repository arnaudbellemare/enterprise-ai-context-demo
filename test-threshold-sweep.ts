/**
 * IRT Threshold Sweep Tests
 * 
 * Tests different IRT thresholds for ACE, SWiRL, and RVS to find optimal values.
 */

const TEST_QUERIES = {
  easy: {
    query: "What is the capital of France?",
    domain: "general",
    expectedIRT: 0.2
  },
  medium: {
    query: "Analyze the impact of interest rate changes on a diversified investment portfolio over the next 12 months, considering inflation trends and market volatility.",
    domain: "financial",
    expectedIRT: 0.5
  },
  hard: {
    query: "As an insurance appraiser, I need a comprehensive valuation of a 1919 Claude Monet Water Lilies painting including: (1) Current market value with 95% confidence interval, (2) Recent comparable sales at Christie's and Sotheby's, (3) Market trend analysis post-pandemic, (4) Insurance replacement cost calculation, (5) Risk assessment for climate and security, (6) USPAP-compliant documentation structure, and (7) Strategic recommendations for policy structure.",
    domain: "art",
    expectedIRT: 0.8
  }
};

const THRESHOLD_RANGES = {
  ace: [0.5, 0.6, 0.7, 0.8],
  swirl: [0.4, 0.5, 0.6, 0.7],
  rvs: [0.4, 0.5, 0.6, 0.7]
};

interface TestResult {
  threshold: number;
  component: string;
  difficulty: keyof typeof TEST_QUERIES;
  quality: number;
  latency: number;
  cost: number;
  componentsActivated: number;
}

async function runThresholdTest() {
  console.log('🧪 Testing IRT Thresholds\n');
  console.log('═'.repeat(80));
  
  const results: TestResult[] = [];
  
  // Test ACE thresholds
  for (const aceThreshold of THRESHOLD_RANGES.ace) {
    console.log(`\n🔬 Testing ACE threshold: ${aceThreshold.toFixed(1)}`);
    
    for (const [difficulty, testQuery] of Object.entries(TEST_QUERIES)) {
      const startTime = Date.now();
      
      try {
        const response = await fetch('http://localhost:3000/api/unified-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: testQuery.query,
            domain: testQuery.domain,
            config: {
              enableACE: true,
              enableSWiRL: true,
              enableSRL: true,
              enableEBM: true,
              enableIRT: true,
              aceThreshold: aceThreshold,
              swirlThreshold: 0.6,
              rvsThreshold: 0.6
            }
          })
        });
        
        const result = await response.json();
        const latency = Date.now() - startTime;
        
        if (result.success && result.result) {
          const data = result.result;
          results.push({
            threshold: aceThreshold,
            component: 'ACE',
            difficulty: difficulty as keyof typeof TEST_QUERIES,
            quality: data.metadata?.quality_score || 0,
            latency,
            cost: data.metadata?.performance?.cost || 0,
            componentsActivated: data.metadata?.components_used?.length || 0
          });
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error);
      }
    }
  }
  
  // Test SWiRL thresholds
  for (const swirlThreshold of THRESHOLD_RANGES.swirl) {
    console.log(`\n🔬 Testing SWiRL threshold: ${swirlThreshold.toFixed(1)}`);
    
    for (const [difficulty, testQuery] of Object.entries(TEST_QUERIES)) {
      const startTime = Date.now();
      
      try {
        const response = await fetch('http://localhost:3000/api/unified-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: testQuery.query,
            domain: testQuery.domain,
            config: {
              enableACE: true,
              enableSWiRL: true,
              enableSRL: true,
              enableEBM: true,
              enableIRT: true,
              aceThreshold: 0.7,
              swirlThreshold: swirlThreshold,
              rvsThreshold: 0.6
            }
          })
        });
        
        const result = await response.json();
        const latency = Date.now() - startTime;
        
        if (result.success && result.result) {
          const data = result.result;
          results.push({
            threshold: swirlThreshold,
            component: 'SWiRL',
            difficulty: difficulty as keyof typeof TEST_QUERIES,
            quality: data.metadata?.quality_score || 0,
            latency,
            cost: data.metadata?.performance?.cost || 0,
            componentsActivated: data.metadata?.components_used?.length || 0
          });
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error);
      }
    }
  }
  
  // Generate report
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('═'.repeat(80));
  
  generateReport(results);
  
  return results;
}

function generateReport(results: TestResult[]) {
  // Group by component and threshold
  const byComponent: Record<string, Record<string, TestResult[]>> = {};
  
  for (const result of results) {
    if (!byComponent[result.component]) {
      byComponent[result.component] = {};
    }
    if (!byComponent[result.component][result.threshold.toString()]) {
      byComponent[result.component][result.threshold.toString()] = [];
    }
    byComponent[result.component][result.threshold.toString()].push(result);
  }
  
  for (const [component, thresholdResults] of Object.entries(byComponent)) {
    console.log(`\n🔬 ${component} Results:`);
    console.log('\nThreshold │ Easy (Q/L/C) │ Medium (Q/L/C) │ Hard (Q/L/C)');
    console.log('──────────┼──────────────┼────────────────┼──────────────');
    
    const thresholds = Object.keys(thresholdResults).map(Number).sort((a, b) => a - b);
    
    for (const threshold of thresholds) {
      const thresholdData = thresholdResults[threshold.toString()];
      const easy = thresholdData.filter(r => r.difficulty === 'easy')[0];
      const medium = thresholdData.filter(r => r.difficulty === 'medium')[0];
      const hard = thresholdData.filter(r => r.difficulty === 'hard')[0];
      
      const format = (r: TestResult) => r ? `${r.quality.toFixed(2)}/${r.latency}/${r.cost.toFixed(4)}` : 'N/A';
      
      console.log(`${threshold.toFixed(1).padEnd(10)}│ ${format(easy).padEnd(14)}│ ${format(medium).padEnd(16)}│ ${format(hard)}`);
    }
  }
  
  // Find optimal thresholds
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('💡 OPTIMAL THRESHOLDS');
  console.log('═'.repeat(80));
  
  for (const component of ['ACE', 'SWiRL', 'RVS']) {
    const componentResults = results.filter(r => r.component === component);
    const thresholdGroups = Object.values(byComponent[component] || {});
    
    let bestThreshold = 0;
    let bestScore = -Infinity;
    
    for (const group of thresholdGroups) {
      const avgQuality = group.reduce((sum, r) => sum + r.quality, 0) / group.length;
      const avgLatency = group.reduce((sum, r) => sum + r.latency, 0) / group.length;
      const avgCost = group.reduce((sum, r) => sum + r.cost, 0) / group.length;
      
      // Score: quality * 0.5 + (1 - latency/10000) * 0.3 + (1 - cost/0.02) * 0.2
      const score = avgQuality * 0.5 + (1 - Math.min(avgLatency / 10000, 1)) * 0.3 + (1 - Math.min(avgCost / 0.02, 1)) * 0.2;
      
      if (score > bestScore) {
        bestScore = score;
        bestThreshold = group[0].threshold;
      }
    }
    
    console.log(`\n${component}: ${bestThreshold.toFixed(1)} (score: ${bestScore.toFixed(3)})`);
  }
}

// Run test
runThresholdTest()
  .then(() => {
    console.log('\n✅ Tests complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

