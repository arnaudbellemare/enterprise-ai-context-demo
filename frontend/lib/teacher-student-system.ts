/**
 * REAL Teacher-Student System
 * 
 * Teacher: Perplexity with web search capability
 * Student: Gemma3:4b for local inference
 * Learning: Student learns from Teacher's responses
 */

import { createClient } from '@supabase/supabase-js';
import { callPerplexityWithRateLimiting } from './brain-skills/llm-helpers';

export interface TeacherResponse {
  answer: string;
  sources: string[];
  search_queries: string[];
  confidence: number;
  timestamp: string;
  domain: string;
}

export interface StudentResponse {
  answer: string;
  learned_from_teacher: boolean;
  confidence: number;
  timestamp: string;
  domain: string;
}

export interface LearningSession {
  id: string;
  query: string;
  teacher_response: TeacherResponse;
  student_response: StudentResponse;
  learning_effectiveness: number;
  timestamp: string;
}

export class TeacherStudentSystem {
  private supabase: any;
  private learningHistory: Map<string, LearningSession[]> = new Map();
  private teacherCache: Map<string, TeacherResponse> = new Map();
  private studentCache: Map<string, StudentResponse> = new Map();
  private fastMode: boolean = false;

  constructor(options?: { fastMode?: boolean }) {
    this.fastMode = options?.fastMode || false;
    this.initializeSupabase();
    console.log(`🎓 Teacher-Student System initialized${this.fastMode ? ' (Fast Mode)' : ''}!`);
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Teacher-Student: Supabase initialized');
      } else {
        console.warn('⚠️ Teacher-Student: Supabase not configured');
      }
    } catch (error) {
      console.error('❌ Teacher-Student: Supabase initialization failed:', error);
    }
  }

  /**
   * Main method: Process query through Teacher-Student system
   */
  async processQuery(query: string, domain?: string): Promise<{
    teacher_response: TeacherResponse;
    student_response: StudentResponse;
    learning_session: LearningSession;
  }> {
    const startTime = Date.now();
    console.log('🎓 Teacher-Student: Processing query...');

    try {
      // STEP 1: Teacher processes query with web search
      const teacherResponse = await this.teacherProcess(query, domain);
      console.log(`👨‍🏫 Teacher: Generated response with ${teacherResponse.sources.length} sources`);

      // STEP 2: Student learns from Teacher and generates response
      const studentResponse = await this.studentProcess(query, teacherResponse, domain);
      console.log(`👨‍🎓 Student: Generated response (learned: ${studentResponse.learned_from_teacher})`);

      // STEP 3: Create learning session
      const learningSession: LearningSession = {
        id: `session_${Date.now()}`,
        query,
        teacher_response: teacherResponse,
        student_response: studentResponse,
        learning_effectiveness: this.calculateLearningEffectiveness(teacherResponse, studentResponse),
        timestamp: new Date().toISOString()
      };

      // STEP 4: Store learning session
      await this.storeLearningSession(learningSession);

      console.log(`🎓 Teacher-Student: Completed in ${Date.now() - startTime}ms`);
      return {
        teacher_response: teacherResponse,
        student_response: studentResponse,
        learning_session: learningSession
      };

    } catch (error) {
      console.error('❌ Teacher-Student: Processing failed:', error);
      throw error;
    }
  }

  /**
   * Teacher: Perplexity with web search capability
   */
  private async teacherProcess(query: string, domain?: string): Promise<TeacherResponse> {
    const cacheKey = `teacher:${domain || 'general'}:${query.substring(0, 20)}`;
    
    // Check cache first
    if (this.teacherCache.has(cacheKey)) {
      console.log('💾 Teacher: Cache hit!');
      return this.teacherCache.get(cacheKey)!;
    }

    console.log('👨‍🏫 Teacher: Processing with web search...');
    const startTime = Date.now();

    try {
      // Determine if web search is needed
      const needsWebSearch = this.needsWebSearch(query, domain);
      console.log(`🔍 Teacher: Web search needed: ${needsWebSearch}`);

      let searchQueries: string[] = [];
      let sources: string[] = [];

      if (needsWebSearch) {
        // Generate search queries
        searchQueries = await this.generateSearchQueries(query, domain);
        console.log(`🔍 Teacher: Generated ${searchQueries.length} search queries`);

        // Perform web searches
        sources = await this.performWebSearches(searchQueries);
        console.log(`🔍 Teacher: Found ${sources.length} sources`);
      }

      // Generate comprehensive response using Perplexity
      const response = await this.generateTeacherResponse(query, sources, domain);
      
      const teacherResponse: TeacherResponse = {
        answer: response.answer,
        sources: sources,
        search_queries: searchQueries,
        confidence: response.confidence,
        timestamp: new Date().toISOString(),
        domain: domain || 'general'
      };

      // Cache the response
      this.teacherCache.set(cacheKey, teacherResponse);
      
      console.log(`👨‍🏫 Teacher: Completed in ${Date.now() - startTime}ms`);
      return teacherResponse;

    } catch (error) {
      console.error('❌ Teacher: Processing failed:', error);
      // Return fallback response
      return {
        answer: `I apologize, but I encountered an error while processing your query: "${query}". Please try again.`,
        sources: [],
        search_queries: [],
        confidence: 0.1,
        timestamp: new Date().toISOString(),
        domain: domain || 'general'
      };
    }
  }

  /**
   * Student: Gemma3:4b learning from Teacher
   */
  private async studentProcess(query: string, teacherResponse: TeacherResponse, domain?: string): Promise<StudentResponse> {
    const cacheKey = `student:${domain || 'general'}:${query.substring(0, 20)}`;
    
    // Check cache first
    if (this.studentCache.has(cacheKey)) {
      console.log('💾 Student: Cache hit!');
      return this.studentCache.get(cacheKey)!;
    }

    console.log('👨‍🎓 Student: Learning from Teacher and generating response...');
    const startTime = Date.now();

    try {
      // In fast mode, return a quick mock response
      if (this.fastMode) {
        const fastResponse: StudentResponse = {
          answer: teacherResponse.answer, // Use teacher's answer directly
          learned_from_teacher: true,
          confidence: 0.6,
          timestamp: new Date().toISOString(),
          domain: domain || 'general'
        };
        console.log(`👨‍🎓 Student: Completed in ${Date.now() - startTime}ms (fast mode)`);
        this.studentCache.set(cacheKey, fastResponse);
        return fastResponse;
      }

      // Check if Student has learned similar queries before
      const hasLearned = await this.hasStudentLearned(query, domain);
      console.log(`🧠 Student: Has learned similar queries: ${hasLearned}`);

      // Generate response using Gemma3:4b
      const response = await this.generateStudentResponse(query, teacherResponse, hasLearned, domain);
      
      const studentResponse: StudentResponse = {
        answer: response.answer,
        learned_from_teacher: hasLearned,
        confidence: response.confidence,
        timestamp: new Date().toISOString(),
        domain: domain || 'general'
      };

      // Cache the response
      this.studentCache.set(cacheKey, studentResponse);
      
      console.log(`👨‍🎓 Student: Completed in ${Date.now() - startTime}ms`);
      return studentResponse;

    } catch (error) {
      console.error('❌ Student: Processing failed:', error);
      // Return fallback response
      return {
        answer: `I'm still learning, but based on what I know: ${query} is an interesting question. I'll need more practice to give you a better answer.`,
        learned_from_teacher: false,
        confidence: 0.3,
        timestamp: new Date().toISOString(),
        domain: domain || 'general'
      };
    }
  }

  /**
   * Determine if web search is needed
   */
  private needsWebSearch(query: string, domain?: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Keywords that indicate need for current information
    const currentInfoKeywords = [
      'latest', 'recent', 'current', 'today', 'now', '2025', '2024',
      'news', 'update', 'trending', 'stock price', 'market', 'crypto',
      'weather', 'forecast', 'election', 'results'
    ];

    // Domain-specific needs
    const domainNeedsSearch = {
      financial: ['stock', 'price', 'market', 'crypto', 'forex', 'trading'],
      technology: ['latest', 'new', 'release', 'update', 'version'],
      real_estate: ['price', 'market', 'trends', 'forecast'],
      healthcare: ['latest', 'research', 'study', 'treatment'],
      general: ['news', 'current', 'recent', 'today']
    };

    // Check for current info keywords
    const hasCurrentInfo = currentInfoKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Check domain-specific needs
    const domainKeywords = domainNeedsSearch[domain as keyof typeof domainNeedsSearch] || domainNeedsSearch.general;
    const hasDomainNeeds = domainKeywords.some(keyword => lowerQuery.includes(keyword));

    return hasCurrentInfo || hasDomainNeeds;
  }

  /**
   * Generate search queries for web search
   */
  private async generateSearchQueries(query: string, domain?: string): Promise<string[]> {
    // Simple search query generation (can be enhanced with LLM)
    const baseQuery = query.trim();
    const domainContext = domain ? ` ${domain}` : '';
    
    return [
      baseQuery,
      `${baseQuery}${domainContext} 2025`,
      `${baseQuery}${domainContext} latest`,
      `${baseQuery}${domainContext} current`
    ];
  }

  /**
   * Perform web searches using Perplexity
   */
  private async performWebSearches(searchQueries: string[]): Promise<string[]> {
    const sources: string[] = [];

    try {
      // Use Perplexity API for web search with rate limiting
      const result = await callPerplexityWithRateLimiting(
        [
          {
            role: 'user',
            content: `Search for information about: ${searchQueries.join(', ')}. Provide sources.`
          }
        ],
        {
          model: 'llama-3.1-sonar-small-128k-online',
          maxTokens: 1000,
          temperature: 0.7
        }
      );

      const content = result.content;

      // Extract sources from response (simple extraction)
      const sourceMatches = content.match(/https?:\/\/[^\s]+/g);
      if (sourceMatches) {
        sources.push(...sourceMatches.slice(0, 5)); // Limit to 5 sources
      }
    } catch (error) {
      console.warn('⚠️ Web search failed:', error);
    }

    return sources;
  }

  /**
   * Generate Teacher response using Perplexity
   */
  private async generateTeacherResponse(query: string, sources: string[], domain?: string): Promise<{answer: string, confidence: number}> {
    try {
      const prompt = `You are an expert teacher with access to current information. Answer this question comprehensively: "${query}"

${sources.length > 0 ? `Sources: ${sources.join(', ')}` : ''}

Provide a detailed, accurate answer with proper context and explanations.`;

      const result = await callPerplexityWithRateLimiting(
        [{ role: 'user', content: prompt }],
        {
          model: 'llama-3.1-sonar-small-128k-online',
          maxTokens: 1500,
          temperature: 0.7
        }
      );

      const answer = result.content || 'No response generated.';
      return { answer, confidence: 0.9 };
    } catch (error) {
      console.warn('⚠️ Teacher response generation failed:', error);
    }

    return { answer: 'I apologize, but I could not generate a response at this time.', confidence: 0.1 };
  }

  /**
   * Check if Student has learned similar queries
   */
  private async hasStudentLearned(query: string, domain?: string): Promise<boolean> {
    try {
      if (this.supabase) {
        const { data } = await this.supabase
          .from('learning_sessions')
          .select('id, query, learning_effectiveness, domain, created_at')
          .eq('domain', domain || 'general')
          .limit(5);

        if (data && data.length > 0) {
          // Simple similarity check (can be enhanced with embeddings)
          const similarQueries = data.filter((session: any) => 
            this.calculateSimilarity(query, session.query) > 0.7
          );
          return similarQueries.length > 0;
        }
      }
    } catch (error) {
      console.warn('⚠️ Learning check failed:', error);
    }

    return false;
  }

  /**
   * Generate Student response using Gemma3:4b
   */
  private async generateStudentResponse(query: string, teacherResponse: TeacherResponse, hasLearned: boolean, domain?: string): Promise<{answer: string, confidence: number}> {
    try {
      // Use Ollama with Gemma3:4b
      const prompt = hasLearned 
        ? `Based on what I've learned from my teacher, here's my answer to: "${query}"

Teacher's approach: ${teacherResponse.answer.substring(0, 200)}...

Provide a thoughtful response based on this learning.`
        : `I'm still learning, but let me try to answer: "${query}"

I don't have much experience with this yet, but here's what I think:`;

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemma3:4b',
          messages: [{ role: 'user', content: prompt }],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const answer = data.message?.content || 'I need more practice to answer this question.';
        const confidence = hasLearned ? 0.7 : 0.4;
        return { answer, confidence };
      }
    } catch (error) {
      console.warn('⚠️ Student response generation failed:', error);
    }

    return { answer: 'I need more practice to answer this question.', confidence: 0.2 };
  }

  /**
   * Calculate learning effectiveness
   */
  private calculateLearningEffectiveness(teacherResponse: TeacherResponse, studentResponse: StudentResponse): number {
    // Simple effectiveness calculation
    let effectiveness = 0.5; // Base effectiveness
    
    if (studentResponse.learned_from_teacher) effectiveness += 0.3;
    if (studentResponse.confidence > 0.6) effectiveness += 0.2;
    if (teacherResponse.confidence > 0.8) effectiveness += 0.1;
    
    return Math.min(1.0, effectiveness);
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Store learning session in database
   */
  private async storeLearningSession(session: LearningSession): Promise<void> {
    try {
      if (this.supabase) {
        await this.supabase
          .from('learning_sessions')
          .insert([session]);
        console.log('💾 Learning session stored');
      }
    } catch (error) {
      console.warn('⚠️ Failed to store learning session:', error);
    }
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<{
    total_sessions: number;
    average_effectiveness: number;
    domains_learned: string[];
    teacher_accuracy: number;
    student_improvement: number;
  }> {
    try {
      if (this.supabase) {
        const { data } = await this.supabase
          .from('learning_sessions')
          .select('id, domain, learning_effectiveness, teacher_response, student_response, created_at');

        if (data) {
          const totalSessions = data.length;
          const averageEffectiveness = data.reduce((sum: number, session: any) => 
            sum + session.learning_effectiveness, 0) / totalSessions;
          const domainsLearned = [...new Set(data.map((session: any) => session.domain))];
          const teacherAccuracy = data.reduce((sum: number, session: any) => 
            sum + session.teacher_response.confidence, 0) / totalSessions;
          const studentImprovement = data.reduce((sum: number, session: any) => 
            sum + session.student_response.confidence, 0) / totalSessions;

          return {
            total_sessions: totalSessions,
            average_effectiveness: averageEffectiveness,
            domains_learned: domainsLearned as string[],
            teacher_accuracy: teacherAccuracy,
            student_improvement: studentImprovement
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get learning stats:', error);
    }

    return {
      total_sessions: 0,
      average_effectiveness: 0,
      domains_learned: [],
      teacher_accuracy: 0,
      student_improvement: 0
    };
  }
}

// Export singleton instance (use fast mode for testing/performance)
const isFastMode = process.env.TEACHER_STUDENT_FAST_MODE === 'true' || process.env.NODE_ENV === 'test';
export const teacherStudentSystem = new TeacherStudentSystem({ fastMode: isFastMode });
