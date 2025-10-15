/**
 * ACE Reflector - Analyzes execution outcomes and extracts labeled insights
 * Inspired by: https://github.com/jmanhype/ace-playbook
 */

import { createClient } from '@supabase/supabase-js';

export interface ExecutionOutcome {
  query: string;
  result: string;
  metadata: any;
  executionTime: number;
  success: boolean;
  error?: string;
  components_used: string[];
  domain: string;
}

export interface ReflectedInsight {
  id: string;
  query: string;
  domain: string;
  insight_type: 'helpful' | 'harmful' | 'neutral';
  insight_text: string;
  confidence: number;
  components_used: string[];
  execution_metadata: any;
  created_at: string;
  helpful_count: number;
  harmful_count: number;
  neutral_count: number;
}

export class ACEReflector {
  private supabase: any;
  private llmClient: any;

  constructor() {
    this.initializeSupabase();
    this.llmClient = null; // Will be initialized when needed
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ ACE Reflector: Supabase initialized');
      } else {
        console.warn('⚠️ ACE Reflector: Supabase not configured');
      }
    } catch (error) {
      console.error('❌ ACE Reflector: Supabase initialization failed:', error);
    }
  }

  /**
   * Analyze execution outcome and extract insights
   */
  async reflect(outcome: ExecutionOutcome): Promise<ReflectedInsight[]> {
    console.log('🔍 ACE Reflector: Analyzing execution outcome...');
    
    const insights: ReflectedInsight[] = [];
    
    try {
      // Analyze success/failure patterns
      const successInsight = await this.analyzeSuccess(outcome);
      if (successInsight) insights.push(successInsight);

      // Analyze performance patterns
      const performanceInsight = await this.analyzePerformance(outcome);
      if (performanceInsight) insights.push(performanceInsight);

      // Analyze component effectiveness
      const componentInsight = await this.analyzeComponents(outcome);
      if (componentInsight) insights.push(componentInsight);

      // Analyze domain-specific patterns
      const domainInsight = await this.analyzeDomain(outcome);
      if (domainInsight) insights.push(domainInsight);

      // Store insights in database
      await this.storeInsights(insights);

      console.log(`✅ ACE Reflector: Generated ${insights.length} insights`);
      return insights;

    } catch (error) {
      console.error('❌ ACE Reflector: Reflection failed:', error);
      return [];
    }
  }

  private async analyzeSuccess(outcome: ExecutionOutcome): Promise<ReflectedInsight | null> {
    if (!outcome.success) {
      return {
        id: `insight_${Date.now()}_error`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'harmful',
        insight_text: `Execution failed: ${outcome.error || 'Unknown error'}`,
        confidence: 0.9,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 0,
        harmful_count: 1,
        neutral_count: 0
      };
    }

    // Analyze what made it successful
    const successFactors = this.extractSuccessFactors(outcome);
    if (successFactors.length > 0) {
      return {
        id: `insight_${Date.now()}_success`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'helpful',
        insight_text: `Successful execution factors: ${successFactors.join(', ')}`,
        confidence: 0.8,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 1,
        harmful_count: 0,
        neutral_count: 0
      };
    }

    return null;
  }

  private async analyzePerformance(outcome: ExecutionOutcome): Promise<ReflectedInsight | null> {
    const executionTime = outcome.executionTime;
    
    if (executionTime > 5000) { // > 5 seconds
      return {
        id: `insight_${Date.now()}_slow`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'harmful',
        insight_text: `Slow execution: ${executionTime}ms (threshold: 5000ms)`,
        confidence: 0.7,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 0,
        harmful_count: 1,
        neutral_count: 0
      };
    }

    if (executionTime < 1000) { // < 1 second
      return {
        id: `insight_${Date.now()}_fast`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'helpful',
        insight_text: `Fast execution: ${executionTime}ms (excellent performance)`,
        confidence: 0.8,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 1,
        harmful_count: 0,
        neutral_count: 0
      };
    }

    return null;
  }

  private async analyzeComponents(outcome: ExecutionOutcome): Promise<ReflectedInsight | null> {
    const components = outcome.components_used;
    
    // Analyze component combinations
    if (components.includes('Smart Router') && components.includes('Advanced Cache')) {
      return {
        id: `insight_${Date.now()}_optimization`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'helpful',
        insight_text: 'Smart routing + caching combination effective',
        confidence: 0.7,
        components_used: components,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 1,
        harmful_count: 0,
        neutral_count: 0
      };
    }

    // Analyze if too many components were used
    if (components.length > 5) {
      return {
        id: `insight_${Date.now()}_complexity`,
        query: outcome.query,
        domain: outcome.domain,
        insight_type: 'neutral',
        insight_text: `High complexity: ${components.length} components used`,
        confidence: 0.6,
        components_used: components,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 0,
        harmful_count: 0,
        neutral_count: 1
      };
    }

    return null;
  }

  private async analyzeDomain(outcome: ExecutionOutcome): Promise<ReflectedInsight | null> {
    const domain = outcome.domain;
    const qualityScore = outcome.metadata?.quality_score || 0;

    if (qualityScore > 90) {
      return {
        id: `insight_${Date.now()}_domain_excellence`,
        query: outcome.query,
        domain: domain,
        insight_type: 'helpful',
        insight_text: `Excellent performance in ${domain} domain (quality: ${qualityScore})`,
        confidence: 0.8,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 1,
        harmful_count: 0,
        neutral_count: 0
      };
    }

    if (qualityScore < 50) {
      return {
        id: `insight_${Date.now()}_domain_poor`,
        query: outcome.query,
        domain: domain,
        insight_type: 'harmful',
        insight_text: `Poor performance in ${domain} domain (quality: ${qualityScore})`,
        confidence: 0.7,
        components_used: outcome.components_used,
        execution_metadata: outcome.metadata,
        created_at: new Date().toISOString(),
        helpful_count: 0,
        harmful_count: 1,
        neutral_count: 0
      };
    }

    return null;
  }

  private extractSuccessFactors(outcome: ExecutionOutcome): string[] {
    const factors: string[] = [];
    
    if (outcome.metadata?.cache_hits > 0) {
      factors.push('cache hit');
    }
    
    if (outcome.components_used.includes('Smart Router')) {
      factors.push('smart routing');
    }
    
    if (outcome.components_used.includes('Parallel Execution')) {
      factors.push('parallel execution');
    }
    
    if (outcome.metadata?.quality_score > 80) {
      factors.push('high quality');
    }
    
    return factors;
  }

  private async storeInsights(insights: ReflectedInsight[]) {
    if (!this.supabase || insights.length === 0) return;

    try {
      const { error } = await this.supabase
        .from('ace_insights')
        .insert(insights);

      if (error) {
        console.error('❌ ACE Reflector: Failed to store insights:', error);
      } else {
        console.log(`✅ ACE Reflector: Stored ${insights.length} insights`);
      }
    } catch (error) {
      console.error('❌ ACE Reflector: Database error:', error);
    }
  }

  /**
   * Get insights for a specific domain or query pattern
   */
  async getInsights(domain?: string, insightType?: 'helpful' | 'harmful' | 'neutral'): Promise<ReflectedInsight[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase.from('ace_insights').select('*');
      
      if (domain) {
        query = query.eq('domain', domain);
      }
      
      if (insightType) {
        query = query.eq('insight_type', insightType);
      }
      
      query = query.order('created_at', { ascending: false }).limit(100);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ ACE Reflector: Failed to get insights:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ ACE Reflector: Database error:', error);
      return [];
    }
  }
}

let aceReflector: ACEReflector;
export function getACEReflector(): ACEReflector {
  if (!aceReflector) {
    aceReflector = new ACEReflector();
  }
  return aceReflector;
}
