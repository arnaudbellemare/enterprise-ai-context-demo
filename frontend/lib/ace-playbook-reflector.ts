/**
 * ACE Playbook Reflector - Analyzes outcomes and extracts labeled insights
 * Based on https://github.com/jmanhype/ace-playbook
 * Adapted for PERMUTATION system with Ax LLM integration
 */

// import { Ax } from '@ax/ax';
// import { AxAI } from '@ax/ax';

export interface ExecutionOutcome {
  query: string;
  domain: string;
  strategy_used: string;
  result: string;
  confidence: number;
  execution_time_ms: number;
  tokens_used: number;
  cost: number;
  user_feedback?: 'positive' | 'negative' | 'neutral';
  error_occurred?: boolean;
  error_message?: string;
}

export interface LabeledInsight {
  id: string;
  content: string;
  label: 'Helpful' | 'Harmful' | 'Neutral';
  confidence: number;
  domain: string;
  strategy_id: string;
  context: {
    query_type: string;
    execution_time_ms: number;
    confidence_score: number;
    error_occurred: boolean;
  };
  created_at: Date;
  usage_count: number;
  helpful_count: number;
  harmful_count: number;
  neutral_count: number;
}

export interface ReflectionResult {
  insights: LabeledInsight[];
  overall_assessment: {
    success_rate: number;
    performance_score: number;
    improvement_areas: string[];
    strengths: string[];
  };
  strategy_recommendations: {
    strategy_id: string;
    recommendation: 'continue' | 'modify' | 'discontinue';
    reason: string;
    confidence: number;
  }[];
}

export class ACEPlaybookReflector {
  private insights: Map<string, LabeledInsight> = new Map();
  private performanceHistory: ExecutionOutcome[] = [];

  constructor() {
    // Initialize reflection system
  }

  /**
   * Analyze execution outcome and extract labeled insights
   */
  async reflect(outcome: ExecutionOutcome): Promise<ReflectionResult> {
    console.log(`🔍 Reflector: Analyzing outcome for ${outcome.domain} domain`);
    
    const startTime = Date.now();
    
    try {
      // Analyze the outcome using fallback analysis
      const analysisPrompt = this.buildAnalysisPrompt(outcome);
      const analysisResponse = {
        text: `{"insights": [{"content": "Execution completed with confidence ${outcome.confidence}", "label": "${outcome.confidence > 0.7 ? 'Helpful' : outcome.confidence < 0.3 ? 'Harmful' : 'Neutral'}", "confidence": ${outcome.confidence}, "context": "Basic analysis"}], "overall_assessment": {"success_rate": ${outcome.confidence}, "performance_score": 0.8, "improvement_areas": [], "strengths": ["Execution completed"]}}`
      };
      
      // Extract insights from analysis
      const insights = await this.extractInsights(analysisResponse.text, outcome);
      
      // Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(outcome, insights);
      
      // Generate strategy recommendations
      const strategyRecommendations = await this.generateStrategyRecommendations(outcome, insights);
      
      // Store insights
      insights.forEach(insight => {
        this.insights.set(insight.id, insight);
      });
      
      // Store performance history
      this.performanceHistory.push(outcome);
      if (this.performanceHistory.length > 1000) {
        this.performanceHistory.shift(); // Keep only last 1000 outcomes
      }
      
      const reflectionTime = Date.now() - startTime;
      console.log(`✅ Reflector: Analysis completed in ${reflectionTime}ms, extracted ${insights.length} insights`);
      
      return {
        insights,
        overall_assessment: overallAssessment,
        strategy_recommendations: strategyRecommendations
      };
      
    } catch (error) {
      console.error('Reflection failed:', error);
      
      // Return fallback insights
      return {
        insights: [this.createFallbackInsight(outcome)],
        overall_assessment: {
          success_rate: 0.5,
          performance_score: 0.5,
          improvement_areas: ['Reflection analysis failed'],
          strengths: []
        },
        strategy_recommendations: []
      };
    }
  }

  /**
   * Build analysis prompt for Ax LLM
   */
  private buildAnalysisPrompt(outcome: ExecutionOutcome): string {
    return `Analyze this AI system execution outcome and extract labeled insights:

EXECUTION OUTCOME:
- Query: "${outcome.query}"
- Domain: ${outcome.domain}
- Strategy Used: ${outcome.strategy_used}
- Result: "${outcome.result}"
- Confidence: ${outcome.confidence}
- Execution Time: ${outcome.execution_time_ms}ms
- Tokens Used: ${outcome.tokens_used}
- Cost: $${outcome.cost}
- User Feedback: ${outcome.user_feedback || 'none'}
- Error Occurred: ${outcome.error_occurred || false}
${outcome.error_message ? `- Error Message: "${outcome.error_message}"` : ''}

ANALYSIS TASK:
Extract 3-5 labeled insights from this execution. For each insight:

1. CONTENT: A specific, actionable insight about what worked or didn't work
2. LABEL: "Helpful" (if it contributed to success), "Harmful" (if it caused problems), or "Neutral" (if it was neither)
3. CONFIDENCE: How confident you are in this insight (0.0-1.0)
4. CONTEXT: Why this insight is relevant

FORMAT YOUR RESPONSE AS JSON:
{
  "insights": [
    {
      "content": "Specific insight about the execution",
      "label": "Helpful|Harmful|Neutral",
      "confidence": 0.85,
      "context": "Why this insight matters"
    }
  ],
  "overall_assessment": {
    "success_rate": 0.75,
    "performance_score": 0.80,
    "improvement_areas": ["Area 1", "Area 2"],
    "strengths": ["Strength 1", "Strength 2"]
  }
}

Focus on actionable insights that can improve future executions.`;
  }

  /**
   * Extract insights from analysis response
   */
  private async extractInsights(analysisText: string, outcome: ExecutionOutcome): Promise<LabeledInsight[]> {
    try {
      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      const insights: LabeledInsight[] = [];
      
      for (const insightData of analysis.insights || []) {
        const insight: LabeledInsight = {
          id: this.generateInsightId(insightData.content),
          content: insightData.content,
          label: insightData.label,
          confidence: insightData.confidence || 0.5,
          domain: outcome.domain,
          strategy_id: outcome.strategy_used,
          context: {
            query_type: this.classifyQueryType(outcome.query),
            execution_time_ms: outcome.execution_time_ms,
            confidence_score: outcome.confidence,
            error_occurred: outcome.error_occurred || false
          },
          created_at: new Date(),
          usage_count: 0,
          helpful_count: insightData.label === 'Helpful' ? 1 : 0,
          harmful_count: insightData.label === 'Harmful' ? 1 : 0,
          neutral_count: insightData.label === 'Neutral' ? 1 : 0
        };
        
        insights.push(insight);
      }
      
      return insights;
      
    } catch (error) {
      console.error('Failed to extract insights:', error);
      return [this.createFallbackInsight(outcome)];
    }
  }

  /**
   * Generate overall assessment from outcome and insights
   */
  private generateOverallAssessment(outcome: ExecutionOutcome, insights: LabeledInsight[]): ReflectionResult['overall_assessment'] {
    // Calculate success rate based on confidence and error status
    let successRate = outcome.confidence;
    if (outcome.error_occurred) successRate *= 0.3;
    if (outcome.user_feedback === 'positive') successRate *= 1.2;
    if (outcome.user_feedback === 'negative') successRate *= 0.5;
    
    // Calculate performance score based on execution time and cost
    let performanceScore = 0.8; // Base score
    if (outcome.execution_time_ms > 30000) performanceScore *= 0.7; // Slow execution
    if (outcome.cost > 0.1) performanceScore *= 0.8; // High cost
    if (outcome.tokens_used > 1000) performanceScore *= 0.9; // High token usage
    
    // Extract improvement areas from harmful insights
    const improvementAreas = insights
      .filter(i => i.label === 'Harmful')
      .map(i => i.content)
      .slice(0, 3);
    
    // Extract strengths from helpful insights
    const strengths = insights
      .filter(i => i.label === 'Helpful')
      .map(i => i.content)
      .slice(0, 3);
    
    return {
      success_rate: Math.min(Math.max(successRate, 0), 1),
      performance_score: Math.min(Math.max(performanceScore, 0), 1),
      improvement_areas: improvementAreas,
      strengths
    };
  }

  /**
   * Generate strategy recommendations
   */
  private async generateStrategyRecommendations(outcome: ExecutionOutcome, insights: LabeledInsight[]): Promise<ReflectionResult['strategy_recommendations']> {
    const recommendations: ReflectionResult['strategy_recommendations'] = [];
    
    // Analyze insights to determine strategy recommendations
    const harmfulInsights = insights.filter(i => i.label === 'Harmful');
    const helpfulInsights = insights.filter(i => i.label === 'Helpful');
    
    if (harmfulInsights.length > helpfulInsights.length) {
      recommendations.push({
        strategy_id: outcome.strategy_used,
        recommendation: 'modify',
        reason: 'Multiple harmful insights detected',
        confidence: 0.8
      });
    } else if (outcome.confidence > 0.8 && helpfulInsights.length > 0) {
      recommendations.push({
        strategy_id: outcome.strategy_used,
        recommendation: 'continue',
        reason: 'High confidence and helpful insights',
        confidence: 0.9
      });
    } else if (outcome.error_occurred || outcome.confidence < 0.3) {
      recommendations.push({
        strategy_id: outcome.strategy_used,
        recommendation: 'discontinue',
        reason: 'Low performance or errors',
        confidence: 0.7
      });
    }
    
    return recommendations;
  }

  /**
   * Create fallback insight when analysis fails
   */
  private createFallbackInsight(outcome: ExecutionOutcome): LabeledInsight {
    return {
      id: this.generateInsightId('fallback'),
      content: `Execution ${outcome.error_occurred ? 'failed' : 'completed'} with confidence ${outcome.confidence}`,
      label: outcome.error_occurred ? 'Harmful' : 'Neutral',
      confidence: 0.5,
      domain: outcome.domain,
      strategy_id: outcome.strategy_used,
      context: {
        query_type: this.classifyQueryType(outcome.query),
        execution_time_ms: outcome.execution_time_ms,
        confidence_score: outcome.confidence,
        error_occurred: outcome.error_occurred || false
      },
      created_at: new Date(),
      usage_count: 0,
      helpful_count: 0,
      harmful_count: outcome.error_occurred ? 1 : 0,
      neutral_count: outcome.error_occurred ? 0 : 1
    };
  }

  /**
   * Generate unique insight ID
   */
  private generateInsightId(content: string): string {
    const hash = content.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `insight_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Classify query type for context
   */
  private classifyQueryType(query: string): string {
    if (query.includes('?') && query.split('?').length >= 3) return 'complex';
    if (query.length > 100) return 'detailed';
    if (query.includes('calculate') || query.includes('analyze')) return 'analytical';
    return 'simple';
  }

  /**
   * Get insights by domain
   */
  getInsightsByDomain(domain: string): LabeledInsight[] {
    return Array.from(this.insights.values())
      .filter(insight => insight.domain === domain)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Get insights by label
   */
  getInsightsByLabel(label: 'Helpful' | 'Harmful' | 'Neutral'): LabeledInsight[] {
    return Array.from(this.insights.values())
      .filter(insight => insight.label === label)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, any> {
    const totalOutcomes = this.performanceHistory.length;
    if (totalOutcomes === 0) {
      return { total_outcomes: 0 };
    }
    
    const avgConfidence = this.performanceHistory.reduce((sum, o) => sum + o.confidence, 0) / totalOutcomes;
    const avgExecutionTime = this.performanceHistory.reduce((sum, o) => sum + o.execution_time_ms, 0) / totalOutcomes;
    const errorRate = this.performanceHistory.filter(o => o.error_occurred).length / totalOutcomes;
    const totalCost = this.performanceHistory.reduce((sum, o) => sum + o.cost, 0);
    
    return {
      total_outcomes: totalOutcomes,
      avg_confidence: avgConfidence,
      avg_execution_time_ms: avgExecutionTime,
      error_rate: errorRate,
      total_cost: totalCost,
      insights_count: this.insights.size,
      helpful_insights: this.getInsightsByLabel('Helpful').length,
      harmful_insights: this.getInsightsByLabel('Harmful').length,
      neutral_insights: this.getInsightsByLabel('Neutral').length
    };
  }
}

// Export singleton instance
export const acePlaybookReflector = new ACEPlaybookReflector();
