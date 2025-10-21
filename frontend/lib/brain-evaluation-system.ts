import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Import open-evals types and utilities
type EvaluationSample = {
  query: string;
  response: string;
  domain?: string;
  reasoningMode?: string;
  patternsActivated?: string[];
  metadata?: Record<string, any>;
};

type MetricScore = {
  name: string;
  score: number;
  reason?: string;
  metadata?: Record<string, unknown>;
};

// Creative Reasoning Evaluation Schema
const CreativeReasoningEvaluationSchema = z.object({
  patternDetection: z.number().min(0).max(1).describe('How well creative patterns were detected'),
  metaCognitiveAwareness: z.number().min(0).max(1).describe('Quality of blind spot identification'),
  alternativePerspectives: z.number().min(0).max(1).describe('Depth of alternative thinking'),
  humanLikeCognition: z.number().min(0).max(1).describe('How human-like the reasoning appears'),
  contextualRelevance: z.number().min(0).max(1).describe('Relevance to the original query'),
  actionableInsights: z.number().min(0).max(1).describe('Practical value of the insights'),
  overallQuality: z.number().min(0).max(1).describe('Overall creative reasoning quality')
});

type CreativeReasoningEvaluation = z.infer<typeof CreativeReasoningEvaluationSchema>;

// Legal Analysis Evaluation Schema
const LegalAnalysisEvaluationSchema = z.object({
  jurisdictionAccuracy: z.number().min(0).max(1).describe('Accuracy across different jurisdictions'),
  complianceDepth: z.number().min(0).max(1).describe('Depth of compliance analysis'),
  liabilityAssessment: z.number().min(0).max(1).describe('Comprehensive risk analysis'),
  crossBorderConsiderations: z.number().min(0).max(1).describe('Multi-jurisdictional awareness'),
  practicalGuidance: z.number().min(0).max(1).describe('Actionable legal recommendations'),
  regulatoryAwareness: z.number().min(0).max(1).describe('Understanding of regulatory frameworks'),
  overallLegalQuality: z.number().min(0).max(1).describe('Overall legal analysis quality')
});

type LegalAnalysisEvaluation = z.infer<typeof LegalAnalysisEvaluationSchema>;

// Technology Optimization Evaluation Schema
const TechnologyOptimizationEvaluationSchema = z.object({
  technicalAccuracy: z.number().min(0).max(1).describe('Technical correctness of recommendations'),
  costBenefitAnalysis: z.number().min(0).max(1).describe('Quality of cost-benefit evaluation'),
  scalabilityAssessment: z.number().min(0).max(1).describe('Scalability considerations'),
  implementationFeasibility: z.number().min(0).max(1).describe('Practical implementation guidance'),
  performanceOptimization: z.number().min(0).max(1).describe('Performance improvement suggestions'),
  innovationLevel: z.number().min(0).max(1).describe('Innovation and creativity in solutions'),
  overallTechQuality: z.number().min(0).max(1).describe('Overall technology analysis quality')
});

type TechnologyOptimizationEvaluation = z.infer<typeof TechnologyOptimizationEvaluationSchema>;

export class BrainEvaluationSystem {
  private model: any;

  constructor() {
    // Use a fallback evaluation approach since we don't have OpenAI API key
    this.model = null;
  }

  /**
   * Evaluate creative reasoning capabilities
   */
  async evaluateCreativeReasoning(sample: EvaluationSample): Promise<MetricScore> {
    try {
      // Fallback evaluation using heuristic analysis since we don't have OpenAI API key
      const responseLength = sample.response.length;
      const hasQuestionMarks = (sample.response.match(/\?/g) || []).length;
      const hasCreativeWords = ['creative', 'innovative', 'alternative', 'perspective', 'insight'].some(word => 
        sample.response.toLowerCase().includes(word)
      );
      const hasStructure = sample.response.includes('#') || sample.response.includes('##');
      
      // Calculate heuristic score
      let score = 0.5; // Base score
      if (responseLength > 500) score += 0.1;
      if (responseLength > 1000) score += 0.1;
      if (hasQuestionMarks > 0) score += 0.1;
      if (hasCreativeWords) score += 0.1;
      if (hasStructure) score += 0.1;
      
      const evaluation = {
        patternDetection: score,
        metaCognitiveAwareness: score,
        alternativePerspectives: score,
        humanLikeCognition: score,
        contextualRelevance: score,
        actionableInsights: score,
        overallQuality: score
      };
      const averageScore = (
        evaluation.patternDetection +
        evaluation.metaCognitiveAwareness +
        evaluation.alternativePerspectives +
        evaluation.humanLikeCognition +
        evaluation.contextualRelevance +
        evaluation.actionableInsights +
        evaluation.overallQuality
      ) / 7;

      return {
        name: 'creative_reasoning',
        score: Math.min(score, 1.0),
        reason: `Heuristic evaluation: ${(score * 100).toFixed(1)}% based on length, structure, and creative indicators`,
        metadata: {
          responseLength,
          hasQuestionMarks,
          hasCreativeWords,
          hasStructure,
          evaluation
        }
      };
    } catch (error) {
      return {
        name: 'creative_reasoning',
        score: 0,
        reason: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Evaluate legal analysis capabilities
   */
  async evaluateLegalAnalysis(sample: EvaluationSample): Promise<MetricScore> {
    try {
      // Fallback evaluation using heuristic analysis
      const responseLength = sample.response.length;
      const hasLegalTerms = ['legal', 'compliance', 'regulation', 'jurisdiction', 'liability', 'GDPR', 'CNBV', 'Banxico'].some(term => 
        sample.response.toLowerCase().includes(term.toLowerCase())
      );
      const hasStructure = sample.response.includes('#') || sample.response.includes('##');
      const hasNumbers = /\d+/.test(sample.response);
      const hasCrossBorder = ['cross-border', 'international', 'multi-jurisdictional', 'US-Mexico', 'Canada-Mexico'].some(term => 
        sample.response.toLowerCase().includes(term.toLowerCase())
      );
      
      // Calculate heuristic score
      let score = 0.5; // Base score
      if (responseLength > 1000) score += 0.1;
      if (responseLength > 2000) score += 0.1;
      if (hasLegalTerms) score += 0.2;
      if (hasStructure) score += 0.1;
      if (hasNumbers) score += 0.1;
      if (hasCrossBorder) score += 0.1;
      
      const evaluation = {
        jurisdictionAccuracy: score,
        complianceDepth: score,
        liabilityAssessment: score,
        crossBorderConsiderations: score,
        practicalGuidance: score,
        regulatoryAwareness: score,
        overallLegalQuality: score
      };

      return {
        name: 'legal_analysis',
        score: Math.min(score, 1.0),
        reason: `Heuristic evaluation: ${(score * 100).toFixed(1)}% based on legal terms, structure, and cross-border considerations`,
        metadata: {
          responseLength,
          hasLegalTerms,
          hasStructure,
          hasNumbers,
          hasCrossBorder,
          evaluation
        }
      };
    } catch (error) {
      return {
        name: 'legal_analysis',
        score: 0,
        reason: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Evaluate technology optimization capabilities
   */
  async evaluateTechnologyOptimization(sample: EvaluationSample): Promise<MetricScore> {
    try {
      const result = await generateObject({
        model: this.model,
        schema: TechnologyOptimizationEvaluationSchema,
        prompt: `Evaluate the technology optimization quality of this AI response:

Query: "${sample.query}"
Response: "${sample.response}"
Domain: ${sample.domain || 'technology'}

Evaluate the following technology optimization aspects:
1. Technical Accuracy: Correctness of technical recommendations and solutions
2. Cost-Benefit Analysis: Quality of cost-benefit evaluation and efficiency recommendations
3. Scalability Assessment: Considerations for scalability and future growth
4. Implementation Feasibility: Practical guidance for implementation
5. Performance Optimization: Quality of performance improvement suggestions
6. Innovation Level: Innovation and creativity in proposed solutions
7. Overall Tech Quality: General assessment of technology analysis capabilities

Score each aspect from 0.0 to 1.0, where 1.0 is excellent and 0.0 is poor.`
      });

      const evaluation = result.object;
      const averageScore = (
        evaluation.technicalAccuracy +
        evaluation.costBenefitAnalysis +
        evaluation.scalabilityAssessment +
        evaluation.implementationFeasibility +
        evaluation.performanceOptimization +
        evaluation.innovationLevel +
        evaluation.overallTechQuality
      ) / 7;

      return {
        name: 'technology_optimization',
        score: averageScore,
        reason: `Technology optimization evaluation: ${(averageScore * 100).toFixed(1)}% overall quality`,
        metadata: evaluation
      };
    } catch (error) {
      return {
        name: 'technology_optimization',
        score: 0,
        reason: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Comprehensive evaluation of brain system response
   */
  async evaluateBrainResponse(sample: EvaluationSample): Promise<{
    overallScore: number;
    domainScores: MetricScore[];
    recommendations: string[];
  }> {
    const domainScores: MetricScore[] = [];
    const recommendations: string[] = [];

    // Evaluate based on domain
    if (sample.domain === 'legal' || sample.query.toLowerCase().includes('legal')) {
      const legalScore = await this.evaluateLegalAnalysis(sample);
      domainScores.push(legalScore);
      
      if (legalScore.score < 0.7) {
        recommendations.push('Improve legal analysis depth and cross-jurisdictional awareness');
      }
    }

    if (sample.domain === 'technology' || sample.query.toLowerCase().includes('optimize') || sample.query.toLowerCase().includes('performance')) {
      const techScore = await this.evaluateTechnologyOptimization(sample);
      domainScores.push(techScore);
      
      if (techScore.score < 0.7) {
        recommendations.push('Enhance technical accuracy and implementation guidance');
      }
    }

    // Always evaluate creative reasoning if patterns are detected
    if (sample.patternsActivated && sample.patternsActivated.length > 0) {
      const creativeScore = await this.evaluateCreativeReasoning(sample);
      domainScores.push(creativeScore);
      
      if (creativeScore.score < 0.7) {
        recommendations.push('Improve creative reasoning and meta-cognitive awareness');
      }
    }

    // Calculate overall score
    const overallScore = domainScores.length > 0 
      ? domainScores.reduce((sum, score) => sum + score.score, 0) / domainScores.length
      : 0.5; // Default score if no domain-specific evaluation

    // Add general recommendations based on overall score
    if (overallScore < 0.6) {
      recommendations.push('Consider enhancing response quality and depth');
    }
    if (overallScore < 0.8) {
      recommendations.push('Focus on providing more actionable insights');
    }

    return {
      overallScore,
      domainScores,
      recommendations
    };
  }

  /**
   * Generate evaluation report
   */
  async generateEvaluationReport(samples: EvaluationSample[]): Promise<{
    totalSamples: number;
    averageScore: number;
    domainBreakdown: Record<string, number>;
    topRecommendations: string[];
  }> {
    const allScores: number[] = [];
    const domainScores: Record<string, number[]> = {};
    const allRecommendations: string[] = [];

    for (const sample of samples) {
      const evaluation = await this.evaluateBrainResponse(sample);
      allScores.push(evaluation.overallScore);
      allRecommendations.push(...evaluation.recommendations);

      // Track domain-specific scores
      const domain = sample.domain || 'general';
      if (!domainScores[domain]) {
        domainScores[domain] = [];
      }
      domainScores[domain].push(evaluation.overallScore);
    }

    // Calculate averages
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const domainBreakdown: Record<string, number> = {};
    
    for (const [domain, scores] of Object.entries(domainScores)) {
      domainBreakdown[domain] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    // Get top recommendations
    const recommendationCounts: Record<string, number> = {};
    allRecommendations.forEach(rec => {
      recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
    });

    const topRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([rec]) => rec);

    return {
      totalSamples: samples.length,
      averageScore,
      domainBreakdown,
      topRecommendations
    };
  }
}

// Export singleton instance
export const brainEvaluationSystem = new BrainEvaluationSystem();
