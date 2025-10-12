/**
 * Agent Evaluation Framework for GEPA Code Evolution
 * 
 * Evaluates evolved agents on real financial tasks with multi-dimensional scoring
 */

export interface FinancialTask {
  id: string;
  category: string;
  input: {
    financialData?: string;
    portfolioData?: string;
    riskData?: string;
    marketData?: string;
    constraints?: string;
  };
  expectedOutputs: {
    keyMetrics?: string[];
    recommendations?: string[];
    risks?: string[];
    trends?: string[];
  };
  groundTruth: {
    accuracy: number;
    quality: string;
    compliance: boolean;
  };
}

export interface EvaluationResult {
  score: number;
  metrics: {
    accuracy: number;
    completeness: number;
    reasoning: number;
    compliance: number;
    executionTime: number;
  };
  details: {
    taskId: string;
    passed: boolean;
    feedback: string;
  }[];
}

export class AgentEvaluator {
  private tasks: FinancialTask[];

  constructor(tasks: FinancialTask[]) {
    this.tasks = tasks;
  }

  async evaluateAgent(agentCode: string): Promise<EvaluationResult> {
    const startTime = Date.now();
    const taskResults: any[] = [];

    let totalAccuracy = 0;
    let totalCompleteness = 0;
    let totalReasoning = 0;
    let totalCompliance = 0;

    for (const task of this.tasks) {
      try {
        // Execute the agent code
        const result = await this.executeAgentCode(agentCode, task);

        // Evaluate the result
        const taskScore = this.evaluateTaskResult(result, task);

        taskResults.push({
          taskId: task.id,
          passed: taskScore.accuracy > 0.5,
          feedback: taskScore.feedback
        });

        totalAccuracy += taskScore.accuracy;
        totalCompleteness += taskScore.completeness;
        totalReasoning += taskScore.reasoning;
        totalCompliance += taskScore.compliance ? 1 : 0;

      } catch (error: any) {
        console.error(`Task ${task.id} failed:`, error.message);
        taskResults.push({
          taskId: task.id,
          passed: false,
          feedback: `Execution failed: ${error.message}`
        });
      }
    }

    const numTasks = this.tasks.length;
    const executionTime = Date.now() - startTime;

    const metrics = {
      accuracy: totalAccuracy / numTasks,
      completeness: totalCompleteness / numTasks,
      reasoning: totalReasoning / numTasks,
      compliance: totalCompliance / numTasks,
      executionTime: executionTime
    };

    // Overall score (weighted average)
    const score = (
      metrics.accuracy * 0.4 +
      metrics.completeness * 0.3 +
      metrics.reasoning * 0.2 +
      metrics.compliance * 0.1
    );

    return {
      score,
      metrics,
      details: taskResults
    };
  }

  private async executeAgentCode(agentCode: string, task: FinancialTask): Promise<string> {
    // Create a safe execution environment
    // We'll pass the task input to the agent function

    try {
      // Extract function name from code
      const functionMatch = agentCode.match(/async function (\w+)\(/);
      if (!functionMatch) {
        throw new Error('Could not find function definition');
      }

      const functionName = functionMatch[1];

      // Create a function from the code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const agentFunction = new AsyncFunction('task', `
        ${agentCode}
        
        // Call the agent function based on task category
        if (task.input.financialData) {
          return await ${functionName}(task.input.financialData);
        } else if (task.input.portfolioData) {
          return await ${functionName}(
            task.input.portfolioData,
            task.input.constraints || 'moderate',
            task.input.constraints || '10 years'
          );
        } else if (task.input.riskData) {
          return await ${functionName}(
            task.input.riskData,
            '${task.category}'
          );
        } else if (task.input.marketData) {
          return await ${functionName}(
            task.input.marketData,
            '${task.category}'
          );
        }
      `);

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), 30000)
      );

      const result = await Promise.race([
        agentFunction(task),
        timeoutPromise
      ]);

      return result as string;

    } catch (error: any) {
      throw new Error(`Agent execution failed: ${error.message}`);
    }
  }

  private evaluateTaskResult(result: string, task: FinancialTask): {
    accuracy: number;
    completeness: number;
    reasoning: number;
    compliance: boolean;
    feedback: string;
  } {
    const evaluation = {
      accuracy: 0,
      completeness: 0,
      reasoning: 0,
      compliance: false,
      feedback: ''
    };

    // Check for expected outputs
    const expectedMetrics = task.expectedOutputs.keyMetrics || [];
    const expectedRecommendations = task.expectedOutputs.recommendations || [];
    const expectedRisks = task.expectedOutputs.risks || [];
    const expectedTrends = task.expectedOutputs.trends || [];

    // Accuracy: Check if expected elements are present
    let matchCount = 0;
    let totalExpected = 0;

    for (const metric of expectedMetrics) {
      totalExpected++;
      if (result.toLowerCase().includes(metric.toLowerCase())) {
        matchCount++;
      }
    }

    for (const recommendation of expectedRecommendations) {
      totalExpected++;
      if (result.toLowerCase().includes(recommendation.toLowerCase())) {
        matchCount++;
      }
    }

    for (const risk of expectedRisks) {
      totalExpected++;
      if (result.toLowerCase().includes(risk.toLowerCase())) {
        matchCount++;
      }
    }

    for (const trend of expectedTrends) {
      totalExpected++;
      if (result.toLowerCase().includes(trend.toLowerCase())) {
        matchCount++;
      }
    }

    evaluation.accuracy = totalExpected > 0 ? matchCount / totalExpected : 0.5;

    // Completeness: Check for key sections
    const hasSummary = result.toLowerCase().includes('summary') || result.length > 100;
    const hasAnalysis = result.toLowerCase().includes('analysis') || result.toLowerCase().includes('findings');
    const hasRecommendations = result.toLowerCase().includes('recommend') || result.toLowerCase().includes('suggest');

    const completenessScore = [hasSummary, hasAnalysis, hasRecommendations].filter(Boolean).length / 3;
    evaluation.completeness = completenessScore;

    // Reasoning: Check for explanation depth
    const hasReasoning = result.toLowerCase().includes('because') || 
                        result.toLowerCase().includes('due to') ||
                        result.toLowerCase().includes('therefore');
    const hasEvidence = result.toLowerCase().includes('data shows') ||
                       result.toLowerCase().includes('indicates') ||
                       result.toLowerCase().includes('based on');
    const hasLogic = result.split('\n').length > 5; // Multi-line reasoning

    const reasoningScore = [hasReasoning, hasEvidence, hasLogic].filter(Boolean).length / 3;
    evaluation.reasoning = reasoningScore;

    // Compliance: Check for required disclaimers or warnings
    const hasRiskWarning = result.toLowerCase().includes('risk') || result.toLowerCase().includes('caution');
    evaluation.compliance = hasRiskWarning;

    // Generate feedback
    const feedback = [];
    if (evaluation.accuracy < 0.5) feedback.push('Missing key metrics or insights');
    if (evaluation.completeness < 0.7) feedback.push('Incomplete analysis');
    if (evaluation.reasoning < 0.5) feedback.push('Weak reasoning');
    if (!evaluation.compliance) feedback.push('Missing risk warnings');

    evaluation.feedback = feedback.length > 0 
      ? feedback.join('; ') 
      : 'Good analysis';

    return evaluation;
  }
}

// Sample financial tasks for evaluation
export const FINANCIAL_EVALUATION_TASKS: FinancialTask[] = [
  {
    id: 'task_001',
    category: 'financial_analysis',
    input: {
      financialData: `Q4 2024 Financial Results:
Revenue: $50M (+23% YoY)
EBITDA: $17.25M (34.5% margin)
Free Cash Flow: $12.3M
P/E Ratio: 28.4
Debt-to-Equity: 0.45
R&D Spending: $8M (16% of revenue)`
    },
    expectedOutputs: {
      keyMetrics: ['revenue growth', 'EBITDA margin', 'free cash flow', 'P/E ratio', 'debt-to-equity'],
      recommendations: ['investment', 'growth', 'fundamentals']
    },
    groundTruth: {
      accuracy: 0.92,
      quality: 'Strong financial performance',
      compliance: true
    }
  },
  {
    id: 'task_002',
    category: 'portfolio_optimization',
    input: {
      portfolioData: `Current Portfolio:
Equities: 60% ($600K)
Bonds: 30% ($300K)
Cash: 10% ($100K)
Total: $1M

Performance:
YTD Return: 8.2%
Volatility: 14.5%
Sharpe Ratio: 0.61`,
      constraints: 'Moderate risk tolerance, 10-year horizon'
    },
    expectedOutputs: {
      keyMetrics: ['allocation', 'Sharpe ratio', 'risk', 'return'],
      recommendations: ['diversification', 'rebalancing', 'optimization']
    },
    groundTruth: {
      accuracy: 0.88,
      quality: 'Room for optimization',
      compliance: true
    }
  },
  {
    id: 'task_003',
    category: 'risk_assessment',
    input: {
      riskData: `Investment Risks:
- Market Risk: High volatility in tech sector
- Credit Risk: Corporate bond exposure
- Liquidity Risk: Alternative assets (15% of portfolio)
- Interest Rate Risk: Rising rates affecting bond values
- Concentration Risk: 20% in single company`
    },
    expectedOutputs: {
      risks: ['market risk', 'credit risk', 'liquidity risk', 'concentration risk'],
      recommendations: ['diversification', 'limit exposure', 'monitoring']
    },
    groundTruth: {
      accuracy: 0.90,
      quality: 'Comprehensive risk identification',
      compliance: true
    }
  }
];

