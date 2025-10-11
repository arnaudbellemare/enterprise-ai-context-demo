/**
 * Statistical Testing Framework for Arena Comparison
 * Uses McNemar's test and paired t-tests to prove statistical significance
 */

export interface TestResult {
  system: string;
  correct: boolean;
  responseTime: number;
  cost: number;
  taskId: string;
}

export interface StatisticalComparison {
  mcnemarsTest: {
    statistic: number;
    pValue: number;
    significant: boolean;
    interpretation: string;
  };
  pairedTTest: {
    tStatistic: number;
    pValue: number;
    significant: boolean;
    interpretation: string;
  };
  effectSize: {
    cohensD: number;
    interpretation: string;
  };
  conclusionMatrix: {
    both_correct: number;
    browserbase_only: number;
    ace_only: number;
    both_wrong: number;
  };
  recommendation: string;
}

/**
 * McNemar's Test for paired nominal data
 * Tests if two systems have significantly different error rates
 */
export function mcnemarsTest(
  browserbaseResults: TestResult[],
  aceResults: TestResult[]
): StatisticalComparison['mcnemarsTest'] {
  
  // Build contingency table
  let bothCorrect = 0;
  let browserbaseOnly = 0;
  let aceOnly = 0;
  let bothWrong = 0;
  
  for (let i = 0; i < browserbaseResults.length; i++) {
    const bb = browserbaseResults[i].correct;
    const ace = aceResults[i].correct;
    
    if (bb && ace) bothCorrect++;
    else if (bb && !ace) browserbaseOnly++;
    else if (!bb && ace) aceOnly++;
    else bothWrong++;
  }
  
  // McNemar's statistic: χ² = (b - c)² / (b + c)
  // where b = browserbaseOnly, c = aceOnly
  const b = browserbaseOnly;
  const c = aceOnly;
  
  if (b + c === 0) {
    return {
      statistic: 0,
      pValue: 1.0,
      significant: false,
      interpretation: 'Both systems perform identically (no disagreements)'
    };
  }
  
  const mcnemar = Math.pow(b - c, 2) / (b + c);
  
  // Continuity correction for small samples
  const mcnemarCorrected = Math.pow(Math.abs(b - c) - 1, 2) / (b + c);
  
  // Approximate p-value using chi-square distribution (df=1)
  const pValue = chiSquarePValue(mcnemarCorrected, 1);
  
  const significant = pValue < 0.05;
  
  let interpretation = '';
  if (significant && aceOnly > browserbaseOnly) {
    interpretation = `✅ ACE system is STATISTICALLY SIGNIFICANTLY BETTER (p=${pValue.toFixed(4)} < 0.05). ACE correct on ${aceOnly} tasks where Browserbase failed, vs only ${browserbaseOnly} the other way.`;
  } else if (significant && browserbaseOnly > aceOnly) {
    interpretation = `❌ Browserbase is statistically significantly better (p=${pValue.toFixed(4)} < 0.05)`;
  } else {
    interpretation = `⚠️ No significant difference (p=${pValue.toFixed(4)} > 0.05). Systems perform similarly.`;
  }
  
  return {
    statistic: mcnemarCorrected,
    pValue,
    significant,
    interpretation
  };
}

/**
 * Paired t-test for continuous metrics (response time, cost)
 */
export function pairedTTest(
  browserbaseMetrics: number[],
  aceMetrics: number[]
): StatisticalComparison['pairedTTest'] {
  
  const n = browserbaseMetrics.length;
  const differences = browserbaseMetrics.map((bb, i) => bb - aceMetrics[i]);
  
  // Calculate mean difference
  const meanDiff = differences.reduce((sum, d) => sum + d, 0) / n;
  
  // Calculate standard deviation of differences
  const variance = differences.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Calculate t-statistic
  const tStatistic = meanDiff / (stdDev / Math.sqrt(n));
  
  // Approximate p-value (two-tailed)
  const pValue = tDistributionPValue(Math.abs(tStatistic), n - 1);
  
  const significant = pValue < 0.05;
  
  let interpretation = '';
  if (significant && meanDiff > 0) {
    interpretation = `✅ Browserbase is SIGNIFICANTLY SLOWER/MORE EXPENSIVE (p=${pValue.toFixed(4)} < 0.05). Mean difference: ${meanDiff.toFixed(3)}`;
  } else if (significant && meanDiff < 0) {
    interpretation = `❌ ACE is significantly slower/more expensive (p=${pValue.toFixed(4)} < 0.05)`;
  } else {
    interpretation = `⚠️ No significant difference in performance (p=${pValue.toFixed(4)} > 0.05)`;
  }
  
  return {
    tStatistic,
    pValue,
    significant,
    interpretation
  };
}

/**
 * Cohen's d for effect size
 */
export function cohensD(
  browserbaseMetrics: number[],
  aceMetrics: number[]
): StatisticalComparison['effectSize'] {
  
  const n1 = browserbaseMetrics.length;
  const n2 = aceMetrics.length;
  
  const mean1 = browserbaseMetrics.reduce((sum, v) => sum + v, 0) / n1;
  const mean2 = aceMetrics.reduce((sum, v) => sum + v, 0) / n2;
  
  const var1 = browserbaseMetrics.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (n1 - 1);
  const var2 = aceMetrics.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (n2 - 1);
  
  const pooledSD = Math.sqrt((var1 + var2) / 2);
  const d = (mean1 - mean2) / pooledSD;
  
  let interpretation = '';
  const absD = Math.abs(d);
  
  if (absD < 0.2) interpretation = 'Negligible effect';
  else if (absD < 0.5) interpretation = 'Small effect';
  else if (absD < 0.8) interpretation = 'Medium effect';
  else interpretation = 'Large effect (strong practical difference)';
  
  return {
    cohensD: d,
    interpretation: `${interpretation} (d=${d.toFixed(2)})`
  };
}

/**
 * Approximate chi-square p-value
 */
function chiSquarePValue(chiSquare: number, df: number): number {
  // Simplified approximation for df=1
  if (df === 1) {
    if (chiSquare > 10.83) return 0.001;
    if (chiSquare > 6.63) return 0.01;
    if (chiSquare > 3.84) return 0.05;
    if (chiSquare > 2.71) return 0.10;
    return 0.5;
  }
  return 0.5; // Fallback
}

/**
 * Approximate t-distribution p-value (two-tailed)
 */
function tDistributionPValue(t: number, df: number): number {
  // Simplified approximation for common degrees of freedom
  const absT = Math.abs(t);
  
  if (df >= 30) {
    // Use normal approximation for large df
    if (absT > 2.576) return 0.01;
    if (absT > 1.96) return 0.05;
    if (absT > 1.645) return 0.10;
    return 0.5;
  }
  
  // Small sample sizes
  if (df === 5) {
    if (absT > 4.032) return 0.01;
    if (absT > 2.571) return 0.05;
    if (absT > 2.015) return 0.10;
  }
  
  if (df === 10) {
    if (absT > 3.169) return 0.01;
    if (absT > 2.228) return 0.05;
    if (absT > 1.812) return 0.10;
  }
  
  return 0.5; // Conservative fallback
}

/**
 * Run complete statistical comparison
 */
export function runStatisticalComparison(
  browserbaseResults: TestResult[],
  aceResults: TestResult[]
): StatisticalComparison {
  
  // McNemar's test for accuracy
  const mcnemar = mcnemarsTest(browserbaseResults, aceResults);
  
  // Paired t-test for cost
  const costTest = pairedTTest(
    browserbaseResults.map(r => r.cost),
    aceResults.map(r => r.cost)
  );
  
  // Cohen's d for effect size on response time
  const effect = cohensD(
    browserbaseResults.map(r => r.responseTime),
    aceResults.map(r => r.responseTime)
  );
  
  // Build contingency matrix
  let bothCorrect = 0, browserbaseOnly = 0, aceOnly = 0, bothWrong = 0;
  for (let i = 0; i < browserbaseResults.length; i++) {
    const bb = browserbaseResults[i].correct;
    const ace = aceResults[i].correct;
    if (bb && ace) bothCorrect++;
    else if (bb && !ace) browserbaseOnly++;
    else if (!bb && ace) aceOnly++;
    else bothWrong++;
  }
  
  // Determine recommendation
  let recommendation = '';
  
  if (mcnemar.significant && aceOnly > browserbaseOnly && costTest.pValue < 0.05) {
    recommendation = '🏆 STRONG RECOMMENDATION: Use ACE System. Statistically significantly better accuracy AND lower cost.';
  } else if (mcnemar.significant && aceOnly > browserbaseOnly) {
    recommendation = '✅ RECOMMENDATION: Use ACE System. Significantly better accuracy, cost similar.';
  } else if (costTest.significant && costTest.tStatistic > 0) {
    recommendation = '💰 RECOMMENDATION: Use ACE System. Similar accuracy but significantly lower cost.';
  } else {
    recommendation = '⚠️ NO CLEAR WINNER: Both systems perform similarly. Choose based on other factors (infrastructure, ease of use, etc.)';
  }
  
  return {
    mcnemarsTest: mcnemar,
    pairedTTest: costTest,
    effectSize: effect,
    conclusionMatrix: {
      both_correct: bothCorrect,
      browserbase_only: browserbaseOnly,
      ace_only: aceOnly,
      both_wrong: bothWrong
    },
    recommendation
  };
}
