/**
 * IRT Threshold Sweep Tests
 * 
 * Tests different IRT thresholds for ACE, SWiRL, and RVS to find optimal values.
 * Tests individual components AND combinations to find the best overall configuration.
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
  // For combination tests
  aceThreshold?: number;
  swirlThreshold?: number;
  rvsThreshold?: number;
  isCombination?: boolean;
}

interface CombinationResult {
  aceThreshold: number;
  swirlThreshold: number;
  rvsThreshold: number;
  avgQuality: number;
  avgLatency: number;
  avgCost: number;
  avgComponentsActivated: number;
  combinedScore: number;
}

async function runThresholdTest() {
  console.log('🧪 Testing IRT Thresholds (Individual + Combinations)\n');
  console.log('═'.repeat(80));
  
  const individualResults: TestResult[] = [];
  const combinationResults: TestResult[] = [];
  
  // ============================================================
  // PHASE 1: INDIVIDUAL COMPONENT TESTING
  // ============================================================
  console.log('\n📊 PHASE 1: Individual Component Testing\n');
  
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
              enableRVS: true,
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
          individualResults.push({
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
              enableRVS: true,
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
          individualResults.push({
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
  
  // Test RVS thresholds
  for (const rvsThreshold of THRESHOLD_RANGES.rvs) {
    console.log(`\n🔬 Testing RVS threshold: ${rvsThreshold.toFixed(1)}`);
    
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
              enableRVS: true,
              aceThreshold: 0.7,
              swirlThreshold: 0.6,
              rvsThreshold: rvsThreshold
            }
          })
        });
        
        const result = await response.json();
        const latency = Date.now() - startTime;
        
        if (result.success && result.result) {
          const data = result.result;
          individualResults.push({
            threshold: rvsThreshold,
            component: 'RVS',
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
  
  // ============================================================
  // PHASE 2: COMBINATION TESTING
  // ============================================================
  console.log('\n\n📊 PHASE 2: Combination Testing\n');
  console.log('Testing strategic combinations for optimal accuracy, cost, and speed...\n');
  
  // Find promising individual thresholds
  const bestIndividual = findBestIndividualThresholds(individualResults);
  
  // Test combinations: best + neighbors
  const combinationsToTest: Array<{ace: number, swirl: number, rvs: number}> = [];
  
  // Add best individual combination
  combinationsToTest.push({
    ace: bestIndividual.ace,
    swirl: bestIndividual.swirl,
    rvs: bestIndividual.rvs
  });
  
  // Add variations around best (testing ±0.1 for each)
  const variations = [-0.1, 0, 0.1];
  for (const aceVar of variations) {
    for (const swirlVar of variations) {
      for (const rvsVar of variations) {
        const ace = Math.max(0.4, Math.min(0.9, bestIndividual.ace + aceVar));
        const swirl = Math.max(0.3, Math.min(0.8, bestIndividual.swirl + swirlVar));
        const rvs = Math.max(0.3, Math.min(0.8, bestIndividual.rvs + rvsVar));
        
        // Round to nearest 0.1
        const combo = {
          ace: Math.round(ace * 10) / 10,
          swirl: Math.round(swirl * 10) / 10,
          rvs: Math.round(rvs * 10) / 10
        };
        
        // Avoid duplicates
        if (!combinationsToTest.find(c => 
          c.ace === combo.ace && c.swirl === combo.swirl && c.rvs === combo.rvs
        )) {
          combinationsToTest.push(combo);
        }
      }
    }
  }
  
  console.log(`Testing ${combinationsToTest.length} combinations...\n`);
  
  // Test each combination
  for (let i = 0; i < combinationsToTest.length; i++) {
    const combo = combinationsToTest[i];
    console.log(`\n🔬 Testing combination ${i + 1}/${combinationsToTest.length}: ACE=${combo.ace}, SWiRL=${combo.swirl}, RVS=${combo.rvs}`);
    
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
              enableRVS: true,
              aceThreshold: combo.ace,
              swirlThreshold: combo.swirl,
              rvsThreshold: combo.rvs
            }
          })
        });
        
        const result = await response.json();
        const latency = Date.now() - startTime;
        
        if (result.success && result.result) {
          const data = result.result;
          combinationResults.push({
            threshold: combo.ace, // Use ACE as primary for grouping
            component: 'COMBINATION',
            difficulty: difficulty as keyof typeof TEST_QUERIES,
            quality: data.metadata?.quality_score || 0,
            latency,
            cost: data.metadata?.performance?.cost || 0,
            componentsActivated: data.metadata?.components_used?.length || 0,
            aceThreshold: combo.ace,
            swirlThreshold: combo.swirl,
            rvsThreshold: combo.rvs,
            isCombination: true
          });
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error);
      }
    }
  }
  
  // Generate reports
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 INDIVIDUAL COMPONENT RESULTS');
  console.log('═'.repeat(80));
  
  generateIndividualReport(individualResults);
  
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 COMBINATION RESULTS');
  console.log('═'.repeat(80));
  
  generateCombinationReport(combinationResults);
  
  return { individual: individualResults, combinations: combinationResults };
}

function findBestIndividualThresholds(results: TestResult[]): {ace: number, swirl: number, rvs: number} {
  // Group by component and find best threshold for each
  const componentScores: Record<string, Array<{threshold: number, score: number}>> = {
    ACE: [],
    SWiRL: [],
    RVS: []
  };
  
  for (const component of ['ACE', 'SWiRL', 'RVS']) {
    const componentResults = results.filter(r => r.component === component);
    const thresholdGroups: Record<string, TestResult[]> = {};
    
    for (const result of componentResults) {
      const key = result.threshold.toString();
      if (!thresholdGroups[key]) {
        thresholdGroups[key] = [];
      }
      thresholdGroups[key].push(result);
    }
    
    for (const [threshold, group] of Object.entries(thresholdGroups)) {
      const avgQuality = group.reduce((sum, r) => sum + r.quality, 0) / group.length;
      const avgLatency = group.reduce((sum, r) => sum + r.latency, 0) / group.length;
      const avgCost = group.reduce((sum, r) => sum + r.cost, 0) / group.length;
      
      // Score: quality * 0.5 + (1 - latency/10000) * 0.3 + (1 - cost/0.02) * 0.2
      const score = avgQuality * 0.5 + (1 - Math.min(avgLatency / 10000, 1)) * 0.3 + (1 - Math.min(avgCost / 0.02, 1)) * 0.2;
      
      componentScores[component].push({
        threshold: parseFloat(threshold),
        score
      });
    }
    
    componentScores[component].sort((a, b) => b.score - a.score);
  }
  
  return {
    ace: componentScores.ACE[0]?.threshold ?? 0.7,
    swirl: componentScores.SWiRL[0]?.threshold ?? 0.6,
    rvs: componentScores.RVS[0]?.threshold ?? 0.6
  };
}

function generateIndividualReport(results: TestResult[]) {
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
  console.log('💡 OPTIMAL INDIVIDUAL THRESHOLDS');
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

function generateCombinationReport(results: TestResult[]) {
  if (results.length === 0) {
    console.log('\n⚠️  No combination results to display');
    return;
  }
  
  // Group by combination (ACE, SWiRL, RVS)
  const combinationGroups: Record<string, TestResult[]> = {};
  
  for (const result of results) {
    if (result.isCombination && result.aceThreshold !== undefined && 
        result.swirlThreshold !== undefined && result.rvsThreshold !== undefined) {
      const key = `${result.aceThreshold.toFixed(1)}_${result.swirlThreshold.toFixed(1)}_${result.rvsThreshold.toFixed(1)}`;
      if (!combinationGroups[key]) {
        combinationGroups[key] = [];
      }
      combinationGroups[key].push(result);
    }
  }
  
  // Calculate scores for each combination
  const combinationScores: CombinationResult[] = [];
  
  for (const [key, group] of Object.entries(combinationGroups)) {
    const [ace, swirl, rvs] = key.split('_').map(Number);
    
    const avgQuality = group.reduce((sum, r) => sum + r.quality, 0) / group.length;
    const avgLatency = group.reduce((sum, r) => sum + r.latency, 0) / group.length;
    const avgCost = group.reduce((sum, r) => sum + r.cost, 0) / group.length;
    const avgComponents = group.reduce((sum, r) => sum + r.componentsActivated, 0) / group.length;
    
    // Combined score: quality * 0.5 + (1 - latency/10000) * 0.3 + (1 - cost/0.02) * 0.2
    const combinedScore = avgQuality * 0.5 + (1 - Math.min(avgLatency / 10000, 1)) * 0.3 + (1 - Math.min(avgCost / 0.02, 1)) * 0.2;
    
    combinationScores.push({
      aceThreshold: ace,
      swirlThreshold: swirl,
      rvsThreshold: rvs,
      avgQuality,
      avgLatency,
      avgCost,
      avgComponentsActivated: avgComponents,
      combinedScore
    });
  }
  
  // Sort by combined score
  combinationScores.sort((a, b) => b.combinedScore - a.combinedScore);
  
  // Display top combinations
  console.log('\n🏆 TOP COMBINATIONS (by Combined Score)\n');
  console.log('ACE │ SWiRL │ RVS │ Quality │ Latency │ Cost    │ Components │ Score');
  console.log('────┼───────┼─────┼─────────┼─────────┼─────────┼────────────┼──────');
  
  for (const combo of combinationScores.slice(0, 15)) {
    console.log(
      `${combo.aceThreshold.toFixed(1).padEnd(4)}│ ${combo.swirlThreshold.toFixed(1).padEnd(5)}│ ${combo.rvsThreshold.toFixed(1).padEnd(3)}│ ` +
      `${combo.avgQuality.toFixed(3).padEnd(7)}│ ${combo.avgLatency.toFixed(0).padEnd(7)}│ ${combo.avgCost.toFixed(4).padEnd(7)}│ ` +
      `${combo.avgComponentsActivated.toFixed(1).padEnd(10)}│ ${combo.combinedScore.toFixed(3)}`
    );
  }
  
  // Display optimal combination
  if (combinationScores.length > 0) {
    const best = combinationScores[0];
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('🎯 OPTIMAL COMBINATION (Best Accuracy + Cost + Speed)');
    console.log('═'.repeat(80));
    console.log(`\nACE Threshold:   ${best.aceThreshold.toFixed(1)}`);
    console.log(`SWiRL Threshold: ${best.swirlThreshold.toFixed(1)}`);
    console.log(`RVS Threshold:   ${best.rvsThreshold.toFixed(1)}`);
    console.log(`\nPerformance:`);
    console.log(`  Quality:       ${best.avgQuality.toFixed(3)}`);
    console.log(`  Latency:       ${best.avgLatency.toFixed(0)}ms`);
    console.log(`  Cost:          $${best.avgCost.toFixed(4)}`);
    console.log(`  Components:    ${best.avgComponentsActivated.toFixed(1)}`);
    console.log(`  Combined Score: ${best.combinedScore.toFixed(3)}`);
    console.log('\n');
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

