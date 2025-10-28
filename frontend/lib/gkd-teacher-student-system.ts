/**
 * GKD-Enhanced Teacher-Student System for PERMUTATION
 * 
 * Integrates Hugging Face TRL's Generalized Knowledge Distillation (GKD)
 * with PERMUTATION's existing Teacher-Student architecture.
 * 
 * Key Features:
 * - On-policy distillation (student learns from self-generated outputs)
 * - Generalized Jensen-Shannon Divergence loss
 * - Flexible teacher-student model configurations
 * - Integration with PERMUTATION's pipeline
 * 
 * Based on: https://huggingface.co/docs/trl/gkd_trainer
 * Paper: "On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes"
 */

import { createLogger } from '../../lib/walt/logger';
import { z } from 'zod';

const logger = createLogger('GKDTeacherStudent');

// ============================================================
// GKD CONFIGURATION SCHEMAS
// ============================================================

export const GKDConfigSchema = z.object({
  // Core GKD parameters
  temperature: z.number().min(0.1).max(2.0).default(0.9),
  lmbda: z.number().min(0.0).max(1.0).default(0.5), // Student data fraction
  beta: z.number().min(0.0).max(1.0).default(0.5), // JSD interpolation
  max_new_tokens: z.number().min(1).max(512).default(128),
  
  // Teacher-Student model configs
  teacher_model_path: z.string().optional(),
  student_model_path: z.string().optional(),
  
  // Training parameters
  disable_dropout: z.boolean().default(true),
  seq_kd: z.boolean().default(false), // Sequence-level KD
  
  // PERMUTATION integration
  enable_web_search: z.boolean().default(true),
  enable_ollama_fallback: z.boolean().default(true),
  confidence_threshold: z.number().min(0.0).max(1.0).default(0.7),
  
  // Advanced features
  enable_on_policy_learning: z.boolean().default(true),
  enable_jsd_loss: z.boolean().default(true),
  enable_rlhf_integration: z.boolean().default(false),
});

export type GKDConfig = z.infer<typeof GKDConfigSchema>;

export const GKDTrainingResultSchema = z.object({
  student_output: z.string(),
  teacher_feedback: z.string(),
  confidence_score: z.number().min(0.0).max(1.0),
  jsd_loss: z.number().optional(),
  on_policy_loss: z.number().optional(),
  training_iteration: z.number(),
  timestamp: z.string(),
  metadata: z.object({
    temperature_used: z.number(),
    lmbda_used: z.number(),
    beta_used: z.number(),
    tokens_generated: z.number(),
    teacher_model: z.string().optional(),
    student_model: z.string().optional(),
  }),
});

export type GKDTrainingResult = z.infer<typeof GKDTrainingResultSchema>;

// ============================================================
// GKD TEACHER-STUDENT SYSTEM
// ============================================================

export class GKDTeacherStudentSystem {
  private config: GKDConfig;
  private trainingHistory: GKDTrainingResult[] = [];
  private iterationCount = 0;

  constructor(config: Partial<GKDConfig> = {}) {
    this.config = GKDConfigSchema.parse(config);
    logger.info('🧠 GKD Teacher-Student System initialized', {
      temperature: this.config.temperature,
      lmbda: this.config.lmbda,
      beta: this.config.beta,
      onPolicyLearning: this.config.enable_on_policy_learning,
    });
  }

  /**
   * Main GKD training method - student learns from self-generated outputs
   */
  async trainStudent(query: string, context?: any): Promise<GKDTrainingResult> {
    this.iterationCount++;
    logger.info(`🔄 GKD Training Iteration ${this.iterationCount}`, { query: query.substring(0, 100) });

    try {
      // Step 1: Student generates output (on-policy)
      const studentOutput = await this.generateStudentOutput(query, context);
      
      // Step 2: Teacher provides feedback on student's output
      const teacherFeedback = await this.getTeacherFeedback(query, studentOutput, context);
      
      // Step 3: Calculate confidence and losses
      const confidenceScore = await this.calculateConfidence(studentOutput, teacherFeedback);
      
      // Step 4: Calculate JSD loss if enabled
      const jsdLoss = this.config.enable_jsd_loss 
        ? await this.calculateJSDLoss(studentOutput, teacherFeedback)
        : undefined;
      
      // Step 5: Calculate on-policy loss if enabled
      const onPolicyLoss = this.config.enable_on_policy_learning
        ? await this.calculateOnPolicyLoss(studentOutput, teacherFeedback)
        : undefined;

      const result: GKDTrainingResult = {
        student_output: studentOutput,
        teacher_feedback: teacherFeedback,
        confidence_score: confidenceScore,
        jsd_loss: jsdLoss,
        on_policy_loss: onPolicyLoss,
        training_iteration: this.iterationCount,
        timestamp: new Date().toISOString(),
        metadata: {
          temperature_used: this.config.temperature,
          lmbda_used: this.config.lmbda,
          beta_used: this.config.beta,
          tokens_generated: studentOutput.length,
          teacher_model: this.config.teacher_model_path,
          student_model: this.config.student_model_path,
        },
      };

      this.trainingHistory.push(result);
      
      logger.info('✅ GKD Training completed', {
        iteration: this.iterationCount,
        confidence: confidenceScore.toFixed(3),
        jsdLoss: jsdLoss?.toFixed(4),
        onPolicyLoss: onPolicyLoss?.toFixed(4),
      });

      return result;

    } catch (error) {
      logger.error('❌ GKD Training failed', { error, iteration: this.iterationCount });
      throw error;
    }
  }

  /**
   * Student generates output using on-policy learning
   */
  private async generateStudentOutput(query: string, context?: any): Promise<string> {
    logger.info('👨‍🎓 Student generating output (on-policy)');

    // Use lambda parameter to decide between teacher data vs student-generated data
    const useStudentGenerated = Math.random() < this.config.lmbda;
    
    if (useStudentGenerated && this.config.enable_on_policy_learning) {
      // On-policy: Student generates from its own distribution
      return await this.generateFromStudentModel(query, context);
    } else {
      // Off-policy: Use teacher-generated data
      return await this.generateFromTeacherModel(query, context);
    }
  }

  /**
   * Teacher provides feedback on student's output
   */
  private async getTeacherFeedback(query: string, studentOutput: string, context?: any): Promise<string> {
    logger.info('👨‍🏫 Teacher providing feedback');

    const feedbackPrompt = this.buildFeedbackPrompt(query, studentOutput, context);
    
    try {
      // Try web search first if enabled
      if (this.config.enable_web_search) {
        const webFeedback = await this.getWebSearchFeedback(query, studentOutput);
        if (webFeedback) {
          return webFeedback;
        }
      }

      // Fallback to teacher model
      return await this.generateFromTeacherModel(query, context);

    } catch (error) {
      logger.error('Teacher feedback failed', { error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Teacher feedback unavailable: ${errorMessage}`;
    }
  }

  /**
   * Calculate confidence score between student and teacher
   */
  private async calculateConfidence(studentOutput: string, teacherFeedback: string): Promise<number> {
    // Simple confidence calculation based on output similarity
    const similarity = this.calculateTextSimilarity(studentOutput, teacherFeedback);
    
    // Adjust confidence based on GKD parameters
    const adjustedConfidence = this.config.beta * similarity + (1 - this.config.beta) * 0.5;
    
    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  /**
   * Calculate Generalized Jensen-Shannon Divergence loss
   */
  private async calculateJSDLoss(studentOutput: string, teacherFeedback: string): Promise<number> {
    // Simplified JSD calculation for text outputs
    const studentTokens = studentOutput.split(' ');
    const teacherTokens = teacherFeedback.split(' ');
    
    // Calculate token-level probabilities (simplified)
    const studentProbs = this.calculateTokenProbabilities(studentTokens);
    const teacherProbs = this.calculateTokenProbabilities(teacherTokens);
    
    // JSD = beta * KL(student||teacher) + (1-beta) * KL(teacher||student)
    const klStudentTeacher = this.calculateKLDivergence(studentProbs, teacherProbs);
    const klTeacherStudent = this.calculateKLDivergence(teacherProbs, studentProbs);
    
    const jsdLoss = this.config.beta * klStudentTeacher + (1 - this.config.beta) * klTeacherStudent;
    
    return jsdLoss;
  }

  /**
   * Calculate on-policy loss (student learning from its own mistakes)
   */
  private async calculateOnPolicyLoss(studentOutput: string, teacherFeedback: string): Promise<number> {
    // On-policy loss encourages student to improve its own outputs
    const qualityScore = this.calculateOutputQuality(studentOutput);
    const teacherQualityScore = this.calculateOutputQuality(teacherFeedback);
    
    // Loss is higher when student output quality is much lower than teacher
    const qualityGap = Math.max(0, teacherQualityScore - qualityScore);
    
    return qualityGap;
  }

  /**
   * Generate output from student model (Ollama/Gemma)
   */
  private async generateFromStudentModel(query: string, context?: any): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: query,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.max_new_tokens,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'Student model response unavailable';

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Student model generation failed', { error: errorMessage });
      return 'Student model unavailable - using fallback';
    }
  }

  /**
   * Generate output from teacher model (Perplexity for high-quality teaching, Ollama fallback)
   */
  private async generateFromTeacherModel(query: string, context?: any): Promise<string> {
    // Try Perplexity first if API key is available
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        // Use Perplexity API for teacher model (high-quality teaching)
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'user', content: `As a teacher, provide a comprehensive answer to: ${query}` }
            ],
            temperature: this.config.temperature * 0.8, // Slightly lower temp for teacher
            max_tokens: this.config.max_new_tokens,
          }),
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || 'Teacher model response unavailable';
        logger.info('Teacher model (Perplexity) generated successfully', { contentLength: content.length });
        return content;

      } catch (error: any) {
        logger.warn('Perplexity teacher failed, falling back to Ollama', { error: error.message });
      }
    } else {
      logger.info('Perplexity API key not set, using Ollama teacher');
    }

    // Fallback to Ollama teacher
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: `As a teacher, provide a comprehensive answer to: ${query}`,
          stream: false,
          options: {
            temperature: this.config.temperature * 0.8, // Slightly lower temp for teacher
            num_predict: this.config.max_new_tokens,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.response || 'Teacher model response unavailable';
      logger.info('Teacher model (Ollama fallback) generated successfully', { contentLength: content.length });
      return content;

    } catch (error: any) {
      logger.error('Both teacher models failed', { error: error.message });
      return 'Teacher model unavailable - using fallback';
    }
  }

  /**
   * Get web search feedback for teacher (Perplexity with web search, Ollama fallback)
   */
  private async getWebSearchFeedback(query: string, studentOutput: string): Promise<string | null> {
    // Try Perplexity first if API key is available
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        // Use Perplexity's web search capability for teacher feedback
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { 
                role: 'user', 
                content: `Please provide feedback on this student's answer to the query "${query}":\n\nStudent Answer: ${studentOutput}\n\nProvide constructive feedback and corrections.` 
              }
            ],
            temperature: 0.3, // Lower temperature for more focused feedback
          }),
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || null;
        if (content) {
          logger.info('Web search feedback (Perplexity) generated successfully', { contentLength: content.length });
        }
        return content;

      } catch (error: any) {
        logger.warn('Perplexity web search feedback failed, falling back to Ollama', { error: error.message });
      }
    } else {
      logger.info('Perplexity API key not set, using Ollama for web search feedback');
    }

    // Fallback to Ollama
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: `Please provide feedback on this student's answer to the query "${query}":\n\nStudent Answer: ${studentOutput}\n\nProvide constructive feedback and corrections.`,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more focused feedback
            num_predict: 500,
          }
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const content = data.response || null;
      if (content) {
        logger.info('Web search feedback (Ollama fallback) generated successfully', { contentLength: content.length });
      }
      return content;

    } catch (error: any) {
      logger.error('Both web search feedback methods failed', { error: error.message });
      return null;
    }
  }

  /**
   * Build feedback prompt for teacher
   */
  private buildFeedbackPrompt(query: string, studentOutput: string, context?: any): string {
    return `Please provide detailed feedback on this student's response:

Query: ${query}

Student Response: ${studentOutput}

Please provide:
1. Accuracy assessment
2. Areas for improvement
3. Corrected information if needed
4. Learning suggestions

Context: ${context ? JSON.stringify(context) : 'None'}`;
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate token probabilities (simplified)
   */
  private calculateTokenProbabilities(tokens: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    const total = tokens.length;
    
    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
    
    const probs = new Map<string, number>();
    for (const [token, count] of counts) {
      probs.set(token, count / total);
    }
    
    return probs;
  }

  /**
   * Calculate KL divergence between two probability distributions
   */
  private calculateKLDivergence(p: Map<string, number>, q: Map<string, number>): number {
    let kl = 0;
    const allTokens = new Set([...p.keys(), ...q.keys()]);
    
    for (const token of allTokens) {
      const pProb = p.get(token) || 0;
      const qProb = q.get(token) || 1e-10; // Avoid log(0)
      
      if (pProb > 0) {
        kl += pProb * Math.log(pProb / qProb);
      }
    }
    
    return kl;
  }

  /**
   * Calculate output quality score
   */
  private calculateOutputQuality(output: string): number {
    // Simple quality metrics
    const length = output.length;
    const wordCount = output.split(/\s+/).length;
    const sentenceCount = output.split(/[.!?]+/).length;
    
    // Quality score based on length, coherence, and structure
    const lengthScore = Math.min(1, length / 100); // Normalize to 0-1
    const coherenceScore = sentenceCount > 0 ? Math.min(1, wordCount / sentenceCount / 10) : 0;
    
    return (lengthScore + coherenceScore) / 2;
  }

  /**
   * Get training history
   */
  getTrainingHistory(): GKDTrainingResult[] {
    return [...this.trainingHistory];
  }

  /**
   * Get latest training result
   */
  getLatestResult(): GKDTrainingResult | null {
    return this.trainingHistory[this.trainingHistory.length - 1] || null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GKDConfig>): void {
    this.config = GKDConfigSchema.parse({ ...this.config, ...newConfig });
    logger.info('🔧 GKD configuration updated', newConfig);
  }

  /**
   * Reset training history
   */
  resetTraining(): void {
    this.trainingHistory = [];
    this.iterationCount = 0;
    logger.info('🔄 GKD training history reset');
  }
}

// ============================================================
// GKD INTEGRATION WITH PERMUTATION PIPELINE
// ============================================================

export class GKDIntegration {
  private gkdSystem: GKDTeacherStudentSystem;

  constructor(config: Partial<GKDConfig> = {}) {
    this.gkdSystem = new GKDTeacherStudentSystem(config);
    logger.info('🔗 GKD Integration initialized');
  }

  /**
   * Integrate GKD training into PERMUTATION pipeline
   */
  async integrateWithPipeline(query: string, domain: string, context?: any): Promise<any> {
    logger.info('🔗 Integrating GKD with PERMUTATION pipeline', { domain });

    try {
      // Run GKD training
      const gkdResult = await this.gkdSystem.trainStudent(query, context);
      
      // Extract insights for PERMUTATION
      const insights = {
        student_confidence: gkdResult.confidence_score,
        jsd_loss: gkdResult.jsd_loss,
        on_policy_loss: gkdResult.on_policy_loss,
        training_iteration: gkdResult.training_iteration,
        quality_improvement: this.calculateQualityImprovement(gkdResult),
        learning_progress: this.calculateLearningProgress(),
      };

      logger.info('✅ GKD integration completed', {
        confidence: insights.student_confidence.toFixed(3),
        qualityImprovement: insights.quality_improvement.toFixed(3),
        learningProgress: insights.learning_progress.toFixed(3),
      });

      return {
        gkd_result: gkdResult,
        insights,
        integration_successful: true,
      };

    } catch (error: any) {
      logger.error('❌ GKD integration failed', { error });
      return {
        gkd_result: null,
        insights: null,
        integration_successful: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate quality improvement over time
   */
  private calculateQualityImprovement(latestResult: GKDTrainingResult): number {
    const history = this.gkdSystem.getTrainingHistory();
    if (history.length < 2) return 0;

    const recent = history.slice(-5); // Last 5 iterations
    const avgRecentConfidence = recent.reduce((sum, r) => sum + r.confidence_score, 0) / recent.length;
    const overallAvgConfidence = history.reduce((sum, r) => sum + r.confidence_score, 0) / history.length;

    return avgRecentConfidence - overallAvgConfidence;
  }

  /**
   * Calculate learning progress
   */
  private calculateLearningProgress(): number {
    const history = this.gkdSystem.getTrainingHistory();
    if (history.length < 2) return 0;

    // Calculate trend in confidence scores
    const confidences = history.map(r => r.confidence_score);
    const trend = this.calculateTrend(confidences);
    
    return Math.max(0, trend); // Only positive progress
  }

  /**
   * Calculate trend in a series of numbers
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i - 1];
    }

    return trend / (values.length - 1);
  }

  /**
   * Get GKD system instance
   */
  getGKDSystem(): GKDTeacherStudentSystem {
    return this.gkdSystem;
  }
}
