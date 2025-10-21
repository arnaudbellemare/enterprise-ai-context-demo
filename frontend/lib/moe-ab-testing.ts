// A/B Testing Framework for MoE Skill Router
// Comprehensive testing and comparison system

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: {
    control: {
      name: string;
      config: any;
      weight: number;
    };
    treatment: {
      name: string;
      config: any;
      weight: number;
    };
  };
  metrics: string[];
  duration: number; // in days
  minSampleSize: number;
  significanceLevel: number;
  enabled: boolean;
}

export interface ABTestResult {
  testId: string;
  variant: 'control' | 'treatment';
  metrics: {
    [metric: string]: {
      value: number;
      confidence: number;
      significance: boolean;
    };
  };
  sampleSize: number;
  duration: number;
  status: 'running' | 'completed' | 'paused' | 'failed';
  startTime: Date;
  endTime?: Date;
}

export interface ABTestMetrics {
  responseTime: number;
  accuracy: number;
  cost: number;
  userSatisfaction: number;
  expertUtilization: number;
  routingConfidence: number;
  errorRate: number;
  throughput: number;
}

export interface ABTestSession {
  sessionId: string;
  testId: string;
  variant: 'control' | 'treatment';
  userId: string;
  startTime: Date;
  endTime?: Date;
  metrics: ABTestMetrics;
  queries: Array<{
    query: string;
    response: any;
    metrics: ABTestMetrics;
    timestamp: Date;
  }>;
}

export class MoEABTestingFramework {
  private tests: Map<string, ABTestConfig> = new Map();
  private sessions: Map<string, ABTestSession> = new Map();
  private results: Map<string, ABTestResult> = new Map();
  private activeTests: Set<string> = new Set();

  constructor() {
    this.initializeDefaultTests();
  }

  /**
   * Create a new A/B test
   */
  createTest(config: ABTestConfig): string {
    this.tests.set(config.testId, config);
    this.results.set(config.testId, {
      testId: config.testId,
      variant: 'control',
      metrics: {},
      sampleSize: 0,
      duration: 0,
      status: 'running',
      startTime: new Date()
    });

    if (config.enabled) {
      this.activeTests.add(config.testId);
    }

    console.log(`🧪 A/B Test Created: ${config.name} (${config.testId})`);
    return config.testId;
  }

  /**
   * Start a test session
   */
  startSession(testId: string, userId: string): ABTestSession {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (!this.activeTests.has(testId)) {
      throw new Error(`Test ${testId} is not active`);
    }

    // Determine variant based on weights
    const variant = this.selectVariant(test);
    
    const session: ABTestSession = {
      sessionId: this.generateSessionId(),
      testId,
      variant,
      userId,
      startTime: new Date(),
      metrics: this.initializeMetrics(),
      queries: []
    };

    this.sessions.set(session.sessionId, session);
    console.log(`🧪 A/B Test Session Started: ${testId} (${variant})`);
    
    return session;
  }

  /**
   * Record query and metrics for a session
   */
  recordQuery(
    sessionId: string, 
    query: string, 
    response: any, 
    metrics: ABTestMetrics
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.queries.push({
      query,
      response,
      metrics,
      timestamp: new Date()
    });

    // Update session metrics
    this.updateSessionMetrics(session, metrics);
  }

  /**
   * End a test session
   */
  endSession(sessionId: string): ABTestSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endTime = new Date();
    console.log(`🧪 A/B Test Session Ended: ${sessionId}`);
    
    return session;
  }

  /**
   * Analyze test results
   */
  analyzeTest(testId: string): ABTestResult {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const sessions = Array.from(this.sessions.values())
      .filter(s => s.testId === testId);

    const controlSessions = sessions.filter(s => s.variant === 'control');
    const treatmentSessions = sessions.filter(s => s.variant === 'treatment');

    const controlMetrics = this.calculateAggregateMetrics(controlSessions);
    const treatmentMetrics = this.calculateAggregateMetrics(treatmentSessions);

    const result: ABTestResult = {
      testId,
      variant: this.determineWinner(controlMetrics, treatmentMetrics),
      metrics: this.compareMetrics(controlMetrics, treatmentMetrics),
      sampleSize: sessions.length,
      duration: this.calculateTestDuration(test),
      status: this.determineTestStatus(test, sessions.length),
      startTime: test ? new Date() : new Date(),
      endTime: new Date()
    };

    this.results.set(testId, result);
    return result;
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): ABTestResult | undefined {
    return this.results.get(testId);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests)
      .map(testId => this.tests.get(testId))
      .filter(test => test !== undefined) as ABTestConfig[];
  }

  /**
   * Pause a test
   */
  pauseTest(testId: string): void {
    this.activeTests.delete(testId);
    console.log(`🧪 A/B Test Paused: ${testId}`);
  }

  /**
   * Resume a test
   */
  resumeTest(testId: string): void {
    const test = this.tests.get(testId);
    if (test && test.enabled) {
      this.activeTests.add(testId);
      console.log(`🧪 A/B Test Resumed: ${testId}`);
    }
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(): {
    totalTests: number;
    activeTests: number;
    completedTests: number;
    totalSessions: number;
    averageSessionDuration: number;
    topPerformingTests: Array<{
      testId: string;
      name: string;
      improvement: number;
    }>;
  } {
    const allTests = Array.from(this.tests.values());
    const allSessions = Array.from(this.sessions.values());
    const allResults = Array.from(this.results.values());

    const completedTests = allResults.filter(r => r.status === 'completed').length;
    const totalSessions = allSessions.length;
    const averageSessionDuration = this.calculateAverageSessionDuration(allSessions);

    const topPerformingTests = this.calculateTopPerformingTests(allResults);

    return {
      totalTests: allTests.length,
      activeTests: this.activeTests.size,
      completedTests,
      totalSessions,
      averageSessionDuration,
      topPerformingTests
    };
  }

  // Private helper methods

  private initializeDefaultTests(): void {
    // MoE vs Traditional Routing Test
    this.createTest({
      testId: 'moe_vs_traditional',
      name: 'MoE vs Traditional Routing',
      description: 'Compare MoE skill router with traditional routing methods',
      variants: {
        control: {
          name: 'Traditional Routing',
          config: { useMoE: false, strategy: 'simple' },
          weight: 0.5
        },
        treatment: {
          name: 'MoE Routing',
          config: { useMoE: true, strategy: 'balanced' },
          weight: 0.5
        }
      },
      metrics: ['responseTime', 'accuracy', 'cost', 'userSatisfaction'],
      duration: 7,
      minSampleSize: 100,
      significanceLevel: 0.05,
      enabled: true
    });

    // Top-K Selection Strategy Test
    this.createTest({
      testId: 'topk_strategies',
      name: 'Top-K Selection Strategies',
      description: 'Compare different top-k selection strategies',
      variants: {
        control: {
          name: 'Greedy Selection',
          config: { strategy: 'greedy', topK: 3 },
          weight: 0.5
        },
        treatment: {
          name: 'Balanced Selection',
          config: { strategy: 'balanced', topK: 3 },
          weight: 0.5
        }
      },
      metrics: ['routingConfidence', 'expertUtilization', 'accuracy'],
      duration: 5,
      minSampleSize: 50,
      significanceLevel: 0.05,
      enabled: true
    });

    // Cost Optimization Test
    this.createTest({
      testId: 'cost_optimization',
      name: 'Cost Optimization Strategies',
      description: 'Compare cost-optimized vs performance-optimized routing',
      variants: {
        control: {
          name: 'Performance Optimized',
          config: { strategy: 'performance', costWeight: 0.2 },
          weight: 0.5
        },
        treatment: {
          name: 'Cost Optimized',
          config: { strategy: 'cost_optimized', costWeight: 0.6 },
          weight: 0.5
        }
      },
      metrics: ['cost', 'accuracy', 'responseTime'],
      duration: 7,
      minSampleSize: 75,
      significanceLevel: 0.05,
      enabled: true
    });
  }

  private selectVariant(test: ABTestConfig): 'control' | 'treatment' {
    const random = Math.random();
    return random < test.variants.control.weight ? 'control' : 'treatment';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): ABTestMetrics {
    return {
      responseTime: 0,
      accuracy: 0,
      cost: 0,
      userSatisfaction: 0,
      expertUtilization: 0,
      routingConfidence: 0,
      errorRate: 0,
      throughput: 0
    };
  }

  private updateSessionMetrics(session: ABTestSession, newMetrics: ABTestMetrics): void {
    const queryCount = session.queries.length;
    if (queryCount === 0) return;

    // Calculate running averages
    session.metrics.responseTime = 
      (session.metrics.responseTime * (queryCount - 1) + newMetrics.responseTime) / queryCount;
    session.metrics.accuracy = 
      (session.metrics.accuracy * (queryCount - 1) + newMetrics.accuracy) / queryCount;
    session.metrics.cost = 
      (session.metrics.cost * (queryCount - 1) + newMetrics.cost) / queryCount;
    session.metrics.userSatisfaction = 
      (session.metrics.userSatisfaction * (queryCount - 1) + newMetrics.userSatisfaction) / queryCount;
    session.metrics.expertUtilization = 
      (session.metrics.expertUtilization * (queryCount - 1) + newMetrics.expertUtilization) / queryCount;
    session.metrics.routingConfidence = 
      (session.metrics.routingConfidence * (queryCount - 1) + newMetrics.routingConfidence) / queryCount;
    session.metrics.errorRate = 
      (session.metrics.errorRate * (queryCount - 1) + newMetrics.errorRate) / queryCount;
    session.metrics.throughput = 
      (session.metrics.throughput * (queryCount - 1) + newMetrics.throughput) / queryCount;
  }

  private calculateAggregateMetrics(sessions: ABTestSession[]): ABTestMetrics {
    if (sessions.length === 0) return this.initializeMetrics();

    const totals = sessions.reduce((acc, session) => ({
      responseTime: acc.responseTime + session.metrics.responseTime,
      accuracy: acc.accuracy + session.metrics.accuracy,
      cost: acc.cost + session.metrics.cost,
      userSatisfaction: acc.userSatisfaction + session.metrics.userSatisfaction,
      expertUtilization: acc.expertUtilization + session.metrics.expertUtilization,
      routingConfidence: acc.routingConfidence + session.metrics.routingConfidence,
      errorRate: acc.errorRate + session.metrics.errorRate,
      throughput: acc.throughput + session.metrics.throughput
    }), this.initializeMetrics());

    const count = sessions.length;
    return {
      responseTime: totals.responseTime / count,
      accuracy: totals.accuracy / count,
      cost: totals.cost / count,
      userSatisfaction: totals.userSatisfaction / count,
      expertUtilization: totals.expertUtilization / count,
      routingConfidence: totals.routingConfidence / count,
      errorRate: totals.errorRate / count,
      throughput: totals.throughput / count
    };
  }

  private compareMetrics(control: ABTestMetrics, treatment: ABTestMetrics): {
    [metric: string]: {
      value: number;
      confidence: number;
      significance: boolean;
    };
  } {
    const metrics: { [metric: string]: any } = {};
    const metricNames = Object.keys(control) as (keyof ABTestMetrics)[];

    for (const metric of metricNames) {
      const controlValue = control[metric];
      const treatmentValue = treatment[metric];
      const improvement = treatmentValue - controlValue;
      const improvementPercent = (improvement / controlValue) * 100;

      // Calculate confidence (simplified)
      const confidence = Math.min(1.0, Math.abs(improvementPercent) / 100);
      
      // Determine significance (simplified threshold)
      const significance = Math.abs(improvementPercent) > 5; // 5% improvement threshold

      metrics[metric] = {
        value: improvementPercent,
        confidence,
        significance
      };
    }

    return metrics;
  }

  private determineWinner(control: ABTestMetrics, treatment: ABTestMetrics): 'control' | 'treatment' {
    // Weighted scoring system
    const weights = {
      accuracy: 0.3,
      responseTime: 0.2,
      cost: 0.2,
      userSatisfaction: 0.15,
      routingConfidence: 0.1,
      errorRate: 0.05
    };

    let controlScore = 0;
    let treatmentScore = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const controlValue = control[metric as keyof ABTestMetrics];
      const treatmentValue = treatment[metric as keyof ABTestMetrics];

      // Higher is better for most metrics, except responseTime and errorRate
      const isHigherBetter = !['responseTime', 'errorRate'].includes(metric);
      
      if (isHigherBetter) {
        controlScore += controlValue * weight;
        treatmentScore += treatmentValue * weight;
      } else {
        controlScore += (1 - controlValue) * weight;
        treatmentScore += (1 - treatmentValue) * weight;
      }
    }

    return treatmentScore > controlScore ? 'treatment' : 'control';
  }

  private calculateTestDuration(test: ABTestConfig): number {
    return test.duration;
  }

  private determineTestStatus(test: ABTestConfig, sampleSize: number): 'running' | 'completed' | 'paused' | 'failed' {
    if (!this.activeTests.has(test.testId)) return 'paused';
    if (sampleSize >= test.minSampleSize) return 'completed';
    return 'running';
  }

  private calculateAverageSessionDuration(sessions: ABTestSession[]): number {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((total, session) => {
      const endTime = session.endTime || new Date();
      return total + (endTime.getTime() - session.startTime.getTime());
    }, 0);

    return totalDuration / sessions.length / 1000; // Convert to seconds
  }

  private calculateTopPerformingTests(results: ABTestResult[]): Array<{
    testId: string;
    name: string;
    improvement: number;
  }> {
    return results
      .filter(result => result.status === 'completed')
      .map(result => {
        const test = this.tests.get(result.testId);
        const improvement = this.calculateOverallImprovement(result.metrics);
        
        return {
          testId: result.testId,
          name: test?.name || 'Unknown Test',
          improvement
        };
      })
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);
  }

  private calculateOverallImprovement(metrics: { [metric: string]: any }): number {
    const improvements = Object.values(metrics)
      .filter(metric => metric.significance)
      .map(metric => metric.value);
    
    return improvements.length > 0 
      ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
      : 0;
  }
}

export const moeABTestingFramework = new MoEABTestingFramework();
