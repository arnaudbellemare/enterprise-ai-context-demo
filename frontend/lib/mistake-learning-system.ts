/**
 * Mistake Learning System
 * 
 * Based on FM 6-22 Leadership Development Principles:
 * "Focus on why mistakes occurred and how to reduce recurrence, not on assigning blame"
 * 
 * This system:
 * 1. Analyzes mistakes without blame
 * 2. Extracts root causes and prevention strategies
 * 3. Stores mistake lessons in ReasoningBank
 * 4. Retrieves mistake lessons for similar queries
 */

import { ArcMemoReasoningBank, ReasoningMemoryItem } from './arcmemo-reasoning-bank';
import { embeddingService } from './embedding-service';

export interface MistakeAnalysis {
  mistakeId: string;
  query: string;
  domain: string;
  timestamp: Date;
  
  // Mistake classification
  mistakeType: 'reasoning' | 'knowledge' | 'execution' | 'planning' | 'communication' | 'other';
  
  // Root cause analysis (without blame)
  rootCause: string;
  whatWentWrong: string;
  whatShouldHaveHappened: string;
  
  // Prevention strategies
  preventionStrategy: string;
  learnedPattern: string;
  
  // Quality metrics
  confidence: number; // 0-1: How confident we are in this analysis
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Related information
  originalResponse?: string;
  correctResponse?: string;
  context?: string;
  
  // Vector embedding for retrieval
  embedding?: number[];
}

export interface MistakeLesson {
  id: string;
  title: string;
  description: string;
  preventionStrategy: string;
  learnedPattern: string;
  mistakeType: string;
  domain: string;
  confidence: number;
  usageCount: number;
  successRate: number; // How often this lesson prevents similar mistakes
  createdAt: Date;
  lastUsed: Date;
}

export class MistakeLearningSystem {
  private reasoningBank: ArcMemoReasoningBank;
  private mistakeLessons: Map<string, MistakeLesson> = new Map();
  private ollamaUrl: string;

  constructor(reasoningBank: ArcMemoReasoningBank) {
    this.reasoningBank = reasoningBank;
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  /**
   * Analyze a mistake without assigning blame
   * Focuses on root cause, what went wrong, and prevention strategies
   */
  async analyzeMistake(
    query: string,
    incorrectResponse: string,
    correctResponse?: string,
    context?: string,
    domain: string = 'general'
  ): Promise<MistakeAnalysis> {
    const mistakeId = `mistake-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      // Use LLM to analyze mistake (not to blame, but to learn)
      const analysisPrompt = `Analyze this mistake without assigning blame. Focus on:
1. What went wrong and why (root cause)
2. What should have happened (correct approach)
3. How to prevent it in the future (prevention strategy)
4. What pattern can be learned (generalizable lesson)

Query: ${query}
Incorrect Response: ${incorrectResponse}
${correctResponse ? `Correct Response: ${correctResponse}` : ''}
${context ? `Context: ${context}` : ''}

Provide a structured analysis in JSON format:
{
  "mistakeType": "reasoning" | "knowledge" | "execution" | "planning" | "communication" | "other",
  "rootCause": "Brief explanation of why this happened",
  "whatWentWrong": "What specifically went wrong",
  "whatShouldHaveHappened": "What should have happened instead",
  "preventionStrategy": "How to prevent similar mistakes in the future",
  "learnedPattern": "Generalizable pattern or lesson learned",
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0
}`;

      // Call Ollama for analysis
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: analysisPrompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more focused analysis
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.response || '';

      // Parse JSON from response
      let analysis: any;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                          analysisText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          analysis = JSON.parse(analysisText);
        }
      } catch (parseError) {
        // Fallback: Create basic analysis from text
        console.warn('Failed to parse LLM analysis, using fallback:', parseError);
        analysis = {
          mistakeType: 'other',
          rootCause: 'Analysis parsing failed',
          whatWentWrong: incorrectResponse.substring(0, 200),
          whatShouldHaveHappened: correctResponse?.substring(0, 200) || 'Correct response needed',
          preventionStrategy: 'Review and improve mistake analysis system',
          learnedPattern: 'Need better error handling in analysis',
          severity: 'medium',
          confidence: 0.5
        };
      }

      // Generate embedding for retrieval
      const embedding = await this.generateEmbedding(
        `${analysis.rootCause} ${analysis.preventionStrategy} ${analysis.learnedPattern}`
      );

      const mistakeAnalysis: MistakeAnalysis = {
        mistakeId,
        query,
        domain,
        timestamp: new Date(),
        mistakeType: analysis.mistakeType || 'other',
        rootCause: analysis.rootCause || 'Unknown root cause',
        whatWentWrong: analysis.whatWentWrong || incorrectResponse.substring(0, 200),
        whatShouldHaveHappened: analysis.whatShouldHaveHappened || (correctResponse?.substring(0, 200) || 'Correct response needed'),
        preventionStrategy: analysis.preventionStrategy || 'Review mistake',
        learnedPattern: analysis.learnedPattern || 'General lesson learned',
        confidence: analysis.confidence || 0.7,
        severity: analysis.severity || 'medium',
        originalResponse: incorrectResponse,
        correctResponse,
        context,
        embedding
      };

      return mistakeAnalysis;
    } catch (error: any) {
      console.error('❌ Mistake analysis failed:', error);
      
      // Return basic analysis on error
      return {
        mistakeId,
        query,
        domain,
        timestamp: new Date(),
        mistakeType: 'other',
        rootCause: 'Analysis failed',
        whatWentWrong: incorrectResponse.substring(0, 200),
        whatShouldHaveHappened: correctResponse?.substring(0, 200) || 'Correct response needed',
        preventionStrategy: 'Improve mistake analysis system',
        learnedPattern: 'System error occurred during analysis',
        confidence: 0.3,
        severity: 'medium',
        originalResponse: incorrectResponse,
        correctResponse,
        context
      };
    }
  }

  /**
   * Learn from mistake and store in ReasoningBank
   */
  async learnFromMistake(analysis: MistakeAnalysis): Promise<void> {
    try {
      // Convert mistake analysis to ReasoningMemoryItem format
      const memoryItem: ReasoningMemoryItem = {
        id: analysis.mistakeId,
        title: `Mistake Lesson: ${analysis.mistakeType}`,
        description: analysis.preventionStrategy,
        content: `Root Cause: ${analysis.rootCause}\n\nWhat Went Wrong: ${analysis.whatWentWrong}\n\nWhat Should Have Happened: ${analysis.whatShouldHaveHappened}\n\nPrevention Strategy: ${analysis.preventionStrategy}\n\nLearned Pattern: ${analysis.learnedPattern}`,
        domain: analysis.domain,
        success: false, // This is a failure lesson
        createdFrom: 'failure',
        abstractionLevel: 'adaptive', // Mistakes help us adapt
        usageCount: 0,
        successRate: 0.0, // Will be updated as we use this lesson
        lastUsed: new Date(),
        createdAt: analysis.timestamp,
        embedding: analysis.embedding
      };

      // Store in ReasoningBank
      await this.reasoningBank.consolidateMemories([memoryItem]);

      // Also create a MistakeLesson for quick retrieval
      const lesson: MistakeLesson = {
        id: analysis.mistakeId,
        title: `Prevent ${analysis.mistakeType} mistakes`,
        description: analysis.preventionStrategy,
        preventionStrategy: analysis.preventionStrategy,
        learnedPattern: analysis.learnedPattern,
        mistakeType: analysis.mistakeType,
        domain: analysis.domain,
        confidence: analysis.confidence,
        usageCount: 0,
        successRate: 0.0,
        createdAt: analysis.timestamp,
        lastUsed: new Date()
      };

      this.mistakeLessons.set(lesson.id, lesson);

      console.log(`✅ Learned from mistake: ${analysis.mistakeType} - ${analysis.preventionStrategy.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Failed to learn from mistake:', error);
    }
  }

  /**
   * Retrieve mistake lessons for similar queries
   */
  async retrieveMistakeLessons(
    query: string,
    domain: string,
    topK: number = 5
  ): Promise<MistakeLesson[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Retrieve similar memories from ReasoningBank (failure memories)
      const memories = await this.reasoningBank.retrieveRelevantMemories(query, domain, topK * 2);
      
      // Filter to only failure memories and convert to MistakeLesson format
      const mistakeMemories = memories.filter(m => m.success === false || m.createdFrom === 'failure');
      
      const lessons: MistakeLesson[] = mistakeMemories.slice(0, topK).map(memory => ({
        id: memory.id,
        title: memory.title.replace('Mistake Lesson: ', ''),
        description: memory.description,
        preventionStrategy: memory.description, // Description contains prevention strategy
        learnedPattern: memory.content.split('Learned Pattern: ')[1]?.split('\n')[0] || memory.content,
        mistakeType: memory.content.match(/mistakeType:\s*(\w+)/i)?.[1] || 'other',
        domain: memory.domain,
        confidence: memory.successRate || 0.5,
        usageCount: memory.usageCount,
        successRate: memory.successRate,
        createdAt: memory.createdAt,
        lastUsed: memory.lastUsed
      }));

      return lessons;
    } catch (error) {
      console.error('❌ Failed to retrieve mistake lessons:', error);
      return [];
    }
  }

  /**
   * Get prevention strategies for a specific mistake type
   */
  async getPreventionStrategies(
    mistakeType: string,
    domain?: string
  ): Promise<string[]> {
    const strategies: string[] = [];
    
    for (const lesson of this.mistakeLessons.values()) {
      if (lesson.mistakeType === mistakeType && (!domain || lesson.domain === domain)) {
        strategies.push(lesson.preventionStrategy);
      }
    }
    
    return strategies;
  }

  /**
   * Update lesson success rate (track if lesson helped prevent mistakes)
   */
  async updateLessonSuccess(lessonId: string, success: boolean): Promise<void> {
    const lesson = this.mistakeLessons.get(lessonId);
    if (lesson) {
      lesson.usageCount++;
      const total = lesson.usageCount;
      lesson.successRate = ((lesson.successRate * (total - 1)) + (success ? 1 : 0)) / total;
      lesson.lastUsed = new Date();
      
      // Also update in ReasoningBank
      await this.reasoningBank.updateMemorySuccessRate(lessonId, success);
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await embeddingService.generate(text);
      return result.embedding;
    } catch (error) {
      console.warn('⚠️ Embedding generation failed, using zero vector:', error);
      return new Array(384).fill(0);
    }
  }

  /**
   * Get all mistake lessons
   */
  getAllMistakeLessons(): MistakeLesson[] {
    return Array.from(this.mistakeLessons.values());
  }

  /**
   * Get mistake statistics
   */
  getMistakeStatistics(): {
    totalMistakes: number;
    byType: Record<string, number>;
    byDomain: Record<string, number>;
    avgConfidence: number;
    avgSuccessRate: number;
  } {
    const lessons = Array.from(this.mistakeLessons.values());
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    let totalConfidence = 0;
    let totalSuccessRate = 0;

    for (const lesson of lessons) {
      byType[lesson.mistakeType] = (byType[lesson.mistakeType] || 0) + 1;
      byDomain[lesson.domain] = (byDomain[lesson.domain] || 0) + 1;
      totalConfidence += lesson.confidence;
      totalSuccessRate += lesson.successRate;
    }

    return {
      totalMistakes: lessons.length,
      byType,
      byDomain,
      avgConfidence: lessons.length > 0 ? totalConfidence / lessons.length : 0,
      avgSuccessRate: lessons.length > 0 ? totalSuccessRate / lessons.length : 0
    };
  }
}

// Singleton instance
let mistakeLearningSystemInstance: MistakeLearningSystem | null = null;

export function getMistakeLearningSystem(reasoningBank?: ArcMemoReasoningBank): MistakeLearningSystem {
  if (!mistakeLearningSystemInstance) {
    if (!reasoningBank) {
      reasoningBank = new ArcMemoReasoningBank();
    }
    mistakeLearningSystemInstance = new MistakeLearningSystem(reasoningBank);
  }
  return mistakeLearningSystemInstance;
}

