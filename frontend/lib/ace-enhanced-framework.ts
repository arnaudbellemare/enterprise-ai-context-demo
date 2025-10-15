/**
 * Enhanced ACE Framework - Generator-Reflector-Curator Pattern
 * Inspired by: https://github.com/jmanhype/ace-playbook
 */

import { getACEReflector, ACEReflector, ExecutionOutcome } from './ace-reflector';
import { getACECurator, ACECurator, PlaybookBullet } from './ace-curator';
import { ACEFramework, ACEUtils, Playbook } from './ace-framework';

export interface EnhancedACEResult {
  answer: string;
  reasoning: string[];
  metadata: {
    domain: string;
    quality_score: number;
    irt_difficulty: number;
    components_used: string[];
    cost: number;
    duration_ms: number;
    teacher_calls: number;
    student_calls: number;
    playbook_bullets_used: number;
    memories_retrieved: number;
    queries_generated: number;
    sql_executed: boolean;
    lora_applied: boolean;
    // Enhanced metadata
    insights_generated: number;
    bullets_curated: number;
    duplicates_found: number;
    playbook_updated: boolean;
  };
  trace: any;
  // Enhanced results
  insights: any[];
  curated_bullets: PlaybookBullet[];
  playbook_stats: any;
}

export class EnhancedACEFramework {
  private aceFramework: ACEFramework;
  private reflector: ACEReflector;
  private curator: ACECurator;
  private playbook: Playbook | null = null;

  constructor() {
    // Initialize with a mock model for now (will be replaced with real LLM client)
    this.aceFramework = new ACEFramework(null);
    this.reflector = getACEReflector();
    this.curator = getACECurator();
    console.log('🚀 Enhanced ACE Framework initialized with Generator-Reflector-Curator pattern');
  }

  /**
   * Main execution method with full Generator-Reflector-Curator workflow
   */
  async processQuery(query: string, domain?: string): Promise<EnhancedACEResult> {
    const startTime = Date.now();
    console.log('🎯 Enhanced ACE: Starting Generator-Reflector-Curator workflow...');

    try {
      // ============================================
      // GENERATOR PHASE: Execute with current playbook
      // ============================================
      console.log('🔧 Generator: Executing query with current playbook...');
      const generatorResult = await this.aceFramework.processQuery(query);
      
      const executionTime = Date.now() - startTime;
      const detectedDomain = domain || await this.detectDomain(query);

      // ============================================
      // REFLECTOR PHASE: Analyze execution outcome
      // ============================================
      console.log('🔍 Reflector: Analyzing execution outcome...');
      const executionOutcome: ExecutionOutcome = {
        query,
        result: generatorResult.reflection?.key_insight || 'ACE processing completed',
        metadata: { trace: generatorResult.trace, reflection: generatorResult.reflection },
        executionTime,
        success: true,
        components_used: ['ACE Framework'],
        domain: detectedDomain
      };

      const insights = await this.reflector.reflect(executionOutcome);
      console.log(`📊 Reflector: Generated ${insights.length} insights`);

      // ============================================
      // CURATOR PHASE: Curate insights into playbook
      // ============================================
      console.log('🎯 Curator: Curating insights into playbook...');
      const curatedBullets: PlaybookBullet[] = [];
      let duplicatesFound = 0;

      for (const insight of insights) {
        const curatorResult = await this.curator.curate(
          insight.insight_text,
          insight.domain,
          insight.insight_type
        );

        if (curatorResult.is_duplicate) {
          duplicatesFound++;
          console.log(`🔄 Curator: Found duplicate insight (similarity: ${curatorResult.similarity_score?.toFixed(3)})`);
        } else if (curatorResult.new_bullet) {
          curatedBullets.push(curatorResult.new_bullet);
          console.log(`✨ Curator: Added new bullet: ${curatorResult.new_bullet.id}`);
        }
      }

      // ============================================
      // UPDATE PLAYBOOK: Refresh with new insights
      // ============================================
      let playbookUpdated = false;
      if (curatedBullets.length > 0) {
        console.log('📚 Updating playbook with new insights...');
        await this.refreshPlaybook(detectedDomain);
        playbookUpdated = true;
      }

      // Get updated playbook stats
      const playbookStats = await this.curator.getPlaybookStats(detectedDomain);

      // ============================================
      // RETURN ENHANCED RESULT
      // ============================================
      const enhancedResult: EnhancedACEResult = {
        answer: generatorResult.reflection?.key_insight || 'Enhanced ACE processing completed',
        reasoning: [
          'Enhanced ACE Framework executed',
          `Generated ${insights.length} insights`,
          `Curated ${curatedBullets.length} new bullets`,
          `Found ${duplicatesFound} duplicates`
        ],
        metadata: {
          domain: detectedDomain,
          quality_score: 85,
          irt_difficulty: 0.7,
          components_used: ['Enhanced ACE Framework'],
          cost: 0.01,
          duration_ms: executionTime,
          teacher_calls: 0,
          student_calls: 0,
          playbook_bullets_used: playbookStats.total_bullets,
          memories_retrieved: 0,
          queries_generated: 1,
          sql_executed: false,
          lora_applied: false,
          insights_generated: insights.length,
          bullets_curated: curatedBullets.length,
          duplicates_found: duplicatesFound,
          playbook_updated: playbookUpdated
        },
        trace: generatorResult.trace,
        insights,
        curated_bullets: curatedBullets,
        playbook_stats: playbookStats
      };

      console.log(`✅ Enhanced ACE: Workflow complete (${executionTime}ms)`);
      return enhancedResult;

    } catch (error: any) {
      console.error('❌ Enhanced ACE: Workflow failed:', error);
      
      // Return fallback result
      return {
        answer: `Enhanced ACE processing failed: ${error.message}`,
        reasoning: ['Enhanced ACE workflow failed'],
        metadata: {
          domain: domain || 'unknown',
          quality_score: 0,
          irt_difficulty: 1.0,
          components_used: ['Enhanced ACE Framework'],
          cost: 0,
          duration_ms: Date.now() - startTime,
          teacher_calls: 0,
          student_calls: 0,
          playbook_bullets_used: 0,
          memories_retrieved: 0,
          queries_generated: 0,
          sql_executed: false,
          lora_applied: false,
          insights_generated: 0,
          bullets_curated: 0,
          duplicates_found: 0,
          playbook_updated: false
        },
        trace: { steps: [], total_duration_ms: Date.now() - startTime, errors: [error.message] },
        insights: [],
        curated_bullets: [],
        playbook_stats: { total_bullets: 0, helpful_bullets: 0, harmful_bullets: 0, neutral_bullets: 0, total_usage: 0 }
      };
    }
  }

  private async detectDomain(query: string): Promise<string> {
    const lower = query.toLowerCase();
    
    if (/\b(real estate|property|house|apartment|rent|buy|sell|mortgage|investment)\b/.test(lower)) return 'real_estate';
    if (/\b(finance|financial|money|investment|stock|trading|portfolio|budget|loan)\b/.test(lower)) return 'financial';
    if (/\b(legal|law|contract|agreement|court|litigation|compliance|regulation)\b/.test(lower)) return 'legal';
    if (/\b(health|medical|healthcare|patient|treatment|diagnosis|medicine|hospital)\b/.test(lower)) return 'healthcare';
    if (/\b(manufacturing|production|factory|supply chain|quality|inventory)\b/.test(lower)) return 'manufacturing';
    if (/\b(education|school|university|student|teacher|learning|curriculum)\b/.test(lower)) return 'education';
    if (/\b(technology|software|hardware|IT|computer|programming|development)\b/.test(lower)) return 'technology';
    if (/\b(marketing|advertising|brand|campaign|social media|SEO|content)\b/.test(lower)) return 'marketing';
    if (/\b(logistics|shipping|transportation|warehouse|distribution|supply)\b/.test(lower)) return 'logistics';
    if (/\b(energy|power|electricity|renewable|solar|wind|oil|gas)\b/.test(lower)) return 'energy';
    if (/\b(agriculture|farming|crop|livestock|food|sustainability)\b/.test(lower)) return 'agriculture';
    if (/\b(crypto|cryptocurrency|bitcoin|blockchain|trading|wallet)\b/.test(lower)) return 'crypto';
    
    return 'general';
  }

  private async refreshPlaybook(domain: string): Promise<void> {
    try {
      // Get curated bullets for the domain
      const curatedBullets = await this.curator.getCuratedBullets(domain, 100);
      
      // Convert to ACE playbook format
      const bullets = curatedBullets.map(bullet => ({
        id: bullet.id,
        content: bullet.content,
        metadata: {
          helpful_count: bullet.helpful_count,
          harmful_count: bullet.harmful_count,
          last_used: new Date(bullet.updated_at),
          created_at: new Date(bullet.created_at),
          tags: [bullet.domain]
        }
      }));

      // Update the playbook
      this.playbook = {
        bullets,
        sections: {
          [domain]: bullets.map(b => b.id)
        },
        stats: {
          total_bullets: bullets.length,
          helpful_bullets: bullets.filter(b => b.metadata.helpful_count > 0).length,
          harmful_bullets: bullets.filter(b => b.metadata.harmful_count > 0).length,
          last_updated: new Date()
        }
      };

      console.log(`📚 Playbook refreshed: ${bullets.length} bullets for ${domain}`);
    } catch (error) {
      console.error('❌ Failed to refresh playbook:', error);
    }
  }

  /**
   * Get insights for analysis
   */
  async getInsights(domain?: string, insightType?: 'helpful' | 'harmful' | 'neutral'): Promise<any[]> {
    return await this.reflector.getInsights(domain, insightType);
  }

  /**
   * Get playbook statistics
   */
  async getPlaybookStats(domain?: string): Promise<any> {
    return await this.curator.getPlaybookStats(domain);
  }

  /**
   * Get curated bullets
   */
  async getCuratedBullets(domain: string, limit: number = 50): Promise<PlaybookBullet[]> {
    return await this.curator.getCuratedBullets(domain, limit);
  }
}

let enhancedACEFramework: EnhancedACEFramework;
export function getEnhancedACEFramework(): EnhancedACEFramework {
  if (!enhancedACEFramework) {
    enhancedACEFramework = new EnhancedACEFramework();
  }
  return enhancedACEFramework;
}
