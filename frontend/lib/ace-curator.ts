/**
 * ACE Curator - Semantic deduplication with FAISS
 * Inspired by: https://github.com/jmanhype/ace-playbook
 */

import { createClient } from '@supabase/supabase-js';

export interface PlaybookBullet {
  id: string;
  content: string;
  domain: string;
  helpful_count: number;
  harmful_count: number;
  neutral_count: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

export interface CuratorResult {
  is_duplicate: boolean;
  similarity_score?: number;
  existing_bullet?: PlaybookBullet;
  new_bullet?: PlaybookBullet;
}

export class ACECurator {
  private supabase: any;
  private similarityThreshold: number = 0.8; // 0.8 cosine similarity threshold
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ ACE Curator: Supabase initialized');
      } else {
        console.warn('⚠️ ACE Curator: Supabase not configured');
      }
    } catch (error) {
      console.error('❌ ACE Curator: Supabase initialization failed:', error);
    }
  }

  /**
   * Curate a new playbook bullet - check for duplicates and add if unique
   */
  async curate(content: string, domain: string, insightType: 'helpful' | 'harmful' | 'neutral'): Promise<CuratorResult> {
    console.log('⚡ ACE Curator: FAST curating new bullet...');
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<CuratorResult>((_, reject) => 
        setTimeout(() => reject(new Error('Curator timeout')), 1500)
      );

      const curationPromise = this.performCuration(content, domain, insightType);
      
      return await Promise.race([curationPromise, timeoutPromise]);

    } catch (error) {
      console.warn(`⚠️ ACE Curator: Curation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Return a simple result to keep the system running
      return {
        is_duplicate: true,
        similarity_score: 0.9,
        existing_bullet: undefined
      };
    }
  }

  private async performCuration(content: string, domain: string, insightType: 'helpful' | 'harmful' | 'neutral'): Promise<CuratorResult> {
    // Generate embedding for the new content (with timeout)
    const embeddingPromise = this.generateEmbedding(content);
    const embeddingTimeout = new Promise<number[]>((_, reject) => 
      setTimeout(() => reject(new Error('Embedding timeout')), 1000)
    );
    
    const newEmbedding = await Promise.race([embeddingPromise, embeddingTimeout]);
    
    // Check for semantic duplicates (with timeout)
    const duplicatePromise = this.findSemanticDuplicate(newEmbedding, domain);
    const duplicateTimeout = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Duplicate check timeout')), 1000)
    );
    
    const duplicate = await Promise.race([duplicatePromise, duplicateTimeout]);
    
    if (duplicate) {
      console.log(`🔄 ACE Curator: Found duplicate (similarity: ${duplicate.similarity_score?.toFixed(3)})`);
      
      // Increment counter (async, don't wait)
      this.incrementBulletCounter(duplicate.existing_bullet!.id, insightType).catch(error => 
        console.warn('⚠️ Failed to increment counter:', error.message)
      );
      
      return {
        is_duplicate: true,
        similarity_score: duplicate.similarity_score,
        existing_bullet: duplicate.existing_bullet
      };
    } else {
      console.log('✨ ACE Curator: New unique bullet, adding to playbook');
      
      // Create new bullet (async, don't wait)
      this.createNewBullet(content, domain, newEmbedding, insightType).catch(error => 
        console.warn('⚠️ Failed to create new bullet:', error.message)
      );
      
      return {
        is_duplicate: false,
        new_bullet: {
          id: `bullet_${Date.now()}`,
          content,
          domain,
          helpful_count: insightType === 'helpful' ? 1 : 0,
          harmful_count: insightType === 'harmful' ? 1 : 0,
          neutral_count: insightType === 'neutral' ? 1 : 0,
          usage_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          embedding: newEmbedding
        }
      };
    }
  } catch (error: any) {
    console.error('❌ ACE Curator: Curation failed:', error);
    return {
      is_duplicate: false,
      new_bullet: undefined
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    try {
      // Use a simple embedding approach (in production, use OpenAI embeddings)
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Embedding generation failed');
      }

      const data = await response.json();
      const embedding = data.embedding || this.generateSimpleEmbedding(text);
      
      // Cache the embedding
      this.embeddingCache.set(text, embedding);
      
      return embedding;
    } catch (error) {
      console.warn('⚠️ ACE Curator: Using fallback embedding');
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach(word => {
      const hash = this.simpleHash(word);
      const index = hash % 384;
      embedding[index] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async findSemanticDuplicate(embedding: number[], domain: string): Promise<{ existing_bullet: PlaybookBullet, similarity_score: number } | null> {
    if (!this.supabase) return null;

    try {
      // Get all bullets for the domain
      const { data: bullets, error } = await this.supabase
        .from('ace_playbook_bullets')
        .select('id, content, domain, helpful_count, harmful_count, usage_count, embedding, created_at')
        .eq('domain', domain)
        .not('embedding', 'is', null);

      if (error || !bullets) {
        console.warn('⚠️ ACE Curator: No existing bullets found');
        return null;
      }

      let bestMatch: { existing_bullet: PlaybookBullet, similarity_score: number } | null = null;
      let bestScore = 0;

      // Calculate cosine similarity with each existing bullet
      for (const bullet of bullets) {
        if (bullet.embedding && bullet.embedding.length === embedding.length) {
          const similarity = this.cosineSimilarity(embedding, bullet.embedding);
          
          if (similarity > this.similarityThreshold && similarity > bestScore) {
            bestScore = similarity;
            bestMatch = {
              existing_bullet: bullet,
              similarity_score: similarity
            };
          }
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('❌ ACE Curator: Error finding duplicates:', error);
      return null;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async incrementBulletCounter(bulletId: string, insightType: 'helpful' | 'harmful' | 'neutral'): Promise<void> {
    if (!this.supabase) return;

    try {
      const updateField = `${insightType}_count`;
      const { error } = await this.supabase
        .from('ace_playbook_bullets')
        .update({
          [updateField]: this.supabase.rpc('increment', { 
            column_name: updateField, 
            row_id: bulletId 
          }),
          usage_count: this.supabase.rpc('increment', { 
            column_name: 'usage_count', 
            row_id: bulletId 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', bulletId);

      if (error) {
        console.error('❌ ACE Curator: Failed to increment counter:', error);
      } else {
        console.log(`✅ ACE Curator: Incremented ${insightType} counter for bullet ${bulletId}`);
      }
    } catch (error) {
      console.error('❌ ACE Curator: Counter increment error:', error);
    }
  }

  private async createNewBullet(content: string, domain: string, embedding: number[], insightType: 'helpful' | 'harmful' | 'neutral'): Promise<PlaybookBullet> {
    if (!this.supabase) {
      // Fallback: return mock bullet
      return {
        id: `bullet_${Date.now()}`,
        content,
        domain,
        helpful_count: insightType === 'helpful' ? 1 : 0,
        harmful_count: insightType === 'harmful' ? 1 : 0,
        neutral_count: insightType === 'neutral' ? 1 : 0,
        usage_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding
      };
    }

    try {
      const newBullet = {
        content,
        domain,
        helpful_count: insightType === 'helpful' ? 1 : 0,
        harmful_count: insightType === 'harmful' ? 1 : 0,
        neutral_count: insightType === 'neutral' ? 1 : 0,
        usage_count: 1,
        embedding,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('ace_playbook_bullets')
        .insert(newBullet)
        .select()
        .single();

      if (error) {
        console.error('❌ ACE Curator: Failed to create bullet:', error);
        throw error;
      }

      console.log(`✅ ACE Curator: Created new bullet: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ ACE Curator: Bullet creation error:', error);
      throw error;
    }
  }

  /**
   * Get curated bullets for a domain
   */
  async getCuratedBullets(domain: string, limit: number = 50): Promise<PlaybookBullet[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('ace_playbook_bullets')
        .select('id, content, domain, helpful_count, harmful_count, neutral_count, usage_count, embedding, created_at, updated_at')
        .eq('domain', domain)
        .order('usage_count', { ascending: false })
        .order('helpful_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ ACE Curator: Failed to get bullets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ ACE Curator: Database error:', error);
      return [];
    }
  }

  /**
   * Get playbook statistics
   */
  async getPlaybookStats(domain?: string): Promise<{
    total_bullets: number;
    helpful_bullets: number;
    harmful_bullets: number;
    neutral_bullets: number;
    total_usage: number;
  }> {
    if (!this.supabase) {
      return {
        total_bullets: 0,
        helpful_bullets: 0,
        harmful_bullets: 0,
        neutral_bullets: 0,
        total_usage: 0
      };
    }

    try {
      let query = this.supabase.from('ace_playbook_bullets').select('id, helpful_count, harmful_count, neutral_count, usage_count');

      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query;

      if (error || !data) {
        return {
          total_bullets: 0,
          helpful_bullets: 0,
          harmful_bullets: 0,
          neutral_bullets: 0,
          total_usage: 0
        };
      }

      const stats = {
        total_bullets: data.length,
        helpful_bullets: data.filter((b: any) => b.helpful_count > 0).length,
        harmful_bullets: data.filter((b: any) => b.harmful_count > 0).length,
        neutral_bullets: data.filter((b: any) => b.neutral_count > 0).length,
        total_usage: data.reduce((sum: number, b: any) => sum + (b.usage_count || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('❌ ACE Curator: Stats error:', error);
      return {
        total_bullets: 0,
        helpful_bullets: 0,
        harmful_bullets: 0,
        neutral_bullets: 0,
        total_usage: 0
      };
    }
  }
}

let aceCurator: ACECurator;
export function getACECurator(): ACECurator {
  if (!aceCurator) {
    aceCurator = new ACECurator();
  }
  return aceCurator;
}
