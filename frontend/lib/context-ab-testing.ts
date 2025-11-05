/**
 * Context A/B Testing Framework
 * 
 * Tests context configurations independently of agent to measure context contribution.
 * Based on extended intelligence: optimize contexts separately from agents.
 */

export interface ContextConfiguration {
  id: string;
  name: string;
  config: {
    enableEntropyReduction: boolean;
    enableLayeredMemory: boolean;
    enableContextIsolation: boolean;
    enableContextAbstraction: boolean;
    enableProactiveInference: boolean;
    contextSelectionStrategy: 'semantic' | 'recent' | 'hybrid';
    maxContextItems: number;
    compressionRatio: number;
  };
}

export interface ABTestResult {
  testId: string;
  configurationA: ContextConfiguration;
  configurationB: ContextConfiguration;
  query: string;
  domain: string;
  
  // Results
  resultA: {
    answer: string;
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
    contextTokens: number;
    agentTokens: number;
    latency: number;
  };
  resultB: {
    answer: string;
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
    contextTokens: number;
    agentTokens: number;
    latency: number;
  };
  
  // Comparison
  winner: 'A' | 'B' | 'tie';
  improvement: number;  // Percentage improvement of winner
  significance: number;  // Statistical significance (0-1)
  
  timestamp: number;
}

export class ContextABTestingFramework {
  private tests: Map<string, ABTestResult[]> = new Map();
  private defaultConfig: ContextConfiguration = {
    id: 'default',
    name: 'Default Configuration',
    config: {
      enableEntropyReduction: true,
      enableLayeredMemory: true,
      enableContextIsolation: true,
      enableContextAbstraction: true,
      enableProactiveInference: true,
      contextSelectionStrategy: 'hybrid',
      maxContextItems: 10,
      compressionRatio: 0.3,
    },
  };
  
  /**
   * Run A/B test between two context configurations
   */
  async runABTest(params: {
    query: string;
    domain: string;
    configurationA: ContextConfiguration;
    configurationB: ContextConfiguration;
    agent: (query: string, context: string) => Promise<string>;
    generateAnswer: (query: string, context: string, config: ContextConfiguration) => Promise<{
      answer: string;
      contextTokens: number;
      agentTokens: number;
      latency: number;
    }>;
  }): Promise<ABTestResult> {
    const { query, domain, configurationA, configurationB, generateAnswer } = params;
    
    const testId = `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Run both configurations
    const startA = Date.now();
    const resultA = await generateAnswer(query, '', configurationA);
    const latencyA = Date.now() - startA;
    
    const startB = Date.now();
    const resultB = await generateAnswer(query, '', configurationB);
    const latencyB = Date.now() - startB;
    
    // Calculate quality metrics for both
    const qualityA = this.calculateQuality(resultA.answer, query);
    const qualityB = this.calculateQuality(resultB.answer, query);
    
    // Determine winner
    const scoreA = (qualityA.quality * 0.4) + (qualityA.relevance * 0.3) + (qualityA.coherence * 0.2) + (qualityA.completeness * 0.1);
    const scoreB = (qualityB.quality * 0.4) + (qualityB.relevance * 0.3) + (qualityB.coherence * 0.2) + (qualityB.completeness * 0.1);
    
    const improvement = Math.abs(scoreA - scoreB) / Math.max(scoreA, scoreB);
    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie';
    
    // Calculate statistical significance (simplified)
    const significance = this.calculateSignificance(qualityA, qualityB);
    
    const testResult: ABTestResult = {
      testId,
      configurationA,
      configurationB,
      query,
      domain,
      resultA: {
        answer: resultA.answer,
        ...qualityA,
        contextTokens: resultA.contextTokens,
        agentTokens: resultA.agentTokens,
        latency: latencyA,
      },
      resultB: {
        answer: resultB.answer,
        ...qualityB,
        contextTokens: resultB.contextTokens,
        agentTokens: resultB.agentTokens,
        latency: latencyB,
      },
      winner,
      improvement: improvement * 100,
      significance,
      timestamp: Date.now(),
    };
    
    // Store test result
    if (!this.tests.has(domain)) {
      this.tests.set(domain, []);
    }
    this.tests.get(domain)!.push(testResult);
    
    return testResult;
  }
  
  /**
   * Calculate answer quality metrics
   */
  private calculateQuality(answer: string, query: string): {
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
  } {
    // Relevance: keyword overlap
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const intersection = [...queryWords].filter(w => answerWords.has(w)).length;
    const relevance = queryWords.size > 0 ? intersection / queryWords.size : 0;
    
    // Coherence: sentence structure
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.length > 0 
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
      : 0;
    const coherence = Math.max(0, 1 - Math.abs(avgLength - 50) / 50);
    
    // Completeness: answer length and structure
    const completeness = Math.min(1, answer.length / 100);
    
    // Overall quality
    const quality = (relevance * 0.4) + (coherence * 0.3) + (completeness * 0.3);
    
    return { quality, relevance, coherence, completeness };
  }
  
  /**
   * Calculate statistical significance (simplified)
   */
  private calculateSignificance(qualityA: any, qualityB: any): number {
    // Simplified: difference in quality scores
    const diff = Math.abs(qualityA.quality - qualityB.quality);
    // More difference = higher significance (up to 1.0)
    return Math.min(1, diff * 2);
  }
  
  /**
   * Get test results for a domain
   */
  getTestResults(domain: string, limit: number = 10): ABTestResult[] {
    const results = this.tests.get(domain) || [];
    return results.slice(-limit);
  }
  
  /**
   * Get winning configuration for a domain
   */
  getWinningConfiguration(domain: string): {
    configuration: ContextConfiguration | null;
    winRate: number;
    avgImprovement: number;
    totalTests: number;
  } {
    const results = this.tests.get(domain) || [];
    if (results.length === 0) {
      return {
        configuration: null,
        winRate: 0,
        avgImprovement: 0,
        totalTests: 0,
      };
    }
    
    const winsA = results.filter(r => r.winner === 'A').length;
    const winsB = results.filter(r => r.winner === 'B').length;
    
    const winner = winsA > winsB ? results[0].configurationA : results[0].configurationB;
    const winRate = Math.max(winsA, winsB) / results.length;
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
    
    return {
      configuration: winner,
      winRate,
      avgImprovement,
      totalTests: results.length,
    };
  }
  
  /**
   * Compare configuration against default
   */
  async compareToDefault(
    query: string,
    domain: string,
    testConfiguration: ContextConfiguration,
    generateAnswer: (query: string, context: string, config: ContextConfiguration) => Promise<{
      answer: string;
      contextTokens: number;
      agentTokens: number;
      latency: number;
    }>
  ): Promise<ABTestResult> {
    return this.runABTest({
      query,
      domain,
      configurationA: this.defaultConfig,
      configurationB: testConfiguration,
      agent: async () => '',
      generateAnswer,
    });
  }
  
  /**
   * Clear test results
   */
  clear(domain?: string): void {
    if (domain) {
      this.tests.delete(domain);
    } else {
      this.tests.clear();
    }
  }
}

export const contextABTesting = new ContextABTestingFramework();

