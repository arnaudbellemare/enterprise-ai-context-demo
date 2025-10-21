/**
 * Skill Metrics Tracking System
 *
 * Tracks brain skill performance metrics to Supabase for analysis
 * and optimization.
 *
 * Metrics tracked:
 * - Execution time
 * - Success/failure rates
 * - Cost per execution
 * - Quality scores
 * - Cache hit rates
 */

import { createClient } from '@supabase/supabase-js';
import { SkillMetricsRow, SkillResult } from './types';

export interface SkillMetricsAnalysis {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalCost: number;
  avgQualityScore: number;
  cacheHitRate: number;
  mostUsedSkill: string;
  slowestSkill: string;
  fastestSkill: string;
}

export class SkillMetricsTracker {
  private supabase: any;
  private enabled: boolean;
  private metricsBuffer: SkillMetricsRow[] = [];
  private bufferSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(enabled: boolean = true) {
    this.enabled = enabled && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (this.enabled) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Start auto-flush timer
      this.startAutoFlush();
    }
  }

  /**
   * Track a skill execution
   */
  async track(
    skillName: string,
    duration: number,
    success: boolean,
    options?: {
      queryHash?: string;
      domain?: string;
      cost?: number;
      qualityScore?: number;
      cacheHit?: boolean;
    }
  ): Promise<void> {
    if (!this.enabled) return;

    const metric: SkillMetricsRow = {
      skill_name: skillName,
      execution_time_ms: duration,
      success,
      activated_at: new Date().toISOString(),
      query_hash: options?.queryHash,
      domain: options?.domain,
      cost: options?.cost,
      quality_score: options?.qualityScore,
      cache_hit: options?.cacheHit || false
    };

    // Add to buffer
    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Flush metrics buffer to Supabase
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await this.supabase
        .from('brain_skill_metrics')
        .insert(metricsToFlush);

      if (error) {
        console.error('   ⚠️ Failed to flush skill metrics:', error.message);
        // Re-add to buffer if failed
        this.metricsBuffer.unshift(...metricsToFlush);
      } else {
        console.log(`   📊 Flushed ${metricsToFlush.length} skill metrics to Supabase`);
      }
    } catch (error: any) {
      console.error('   ⚠️ Metrics flush error:', error.message);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get metrics for a specific skill
   */
  async getSkillMetrics(
    skillName: string,
    hoursAgo: number = 24
  ): Promise<SkillMetricsRow[]> {
    if (!this.enabled) return [];

    const since = new Date(Date.now() - hoursAgo * 3600000).toISOString();

    try {
      const { data, error } = await this.supabase
        .from('brain_skill_metrics')
        .select('*')
        .eq('skill_name', skillName)
        .gte('activated_at', since)
        .order('activated_at', { ascending: false });

      if (error) {
        console.error('   ⚠️ Failed to fetch skill metrics:', error.message);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('   ⚠️ Metrics fetch error:', error.message);
      return [];
    }
  }

  /**
   * Get aggregated metrics for all skills
   */
  async getAllMetrics(hoursAgo: number = 24): Promise<SkillMetricsAnalysis | null> {
    if (!this.enabled) return null;

    const since = new Date(Date.now() - hoursAgo * 3600000).toISOString();

    try {
      const { data, error } = await this.supabase
        .from('brain_skill_metrics')
        .select('*')
        .gte('activated_at', since);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Calculate aggregated metrics
      const totalExecutions = data.length;
      const successCount = data.filter((m: SkillMetricsRow) => m.success).length;
      const cacheHitCount = data.filter((m: SkillMetricsRow) => m.cache_hit).length;

      const avgExecutionTime =
        data.reduce((sum: number, m: SkillMetricsRow) => sum + m.execution_time_ms, 0) /
        totalExecutions;

      const totalCost = data.reduce(
        (sum: number, m: SkillMetricsRow) => sum + (m.cost || 0),
        0
      );

      const qualityScores = data.filter((m: SkillMetricsRow) => m.quality_score != null);
      const avgQualityScore =
        qualityScores.length > 0
          ? qualityScores.reduce((sum: number, m: SkillMetricsRow) => sum + (m.quality_score || 0), 0) /
            qualityScores.length
          : 0;

      // Find most used skill
      const skillCounts = data.reduce((acc: Record<string, number>, m: SkillMetricsRow) => {
        acc[m.skill_name] = (acc[m.skill_name] || 0) + 1;
        return acc;
      }, {});

      const sortedSkills = Object.entries(skillCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
      const mostUsedSkill = sortedSkills[0]?.[0] || '';

      // Find slowest/fastest skills
      const avgTimesBySkill = data.reduce((acc: Record<string, number[]>, m: SkillMetricsRow) => {
        if (!acc[m.skill_name]) acc[m.skill_name] = [];
        acc[m.skill_name].push(m.execution_time_ms);
        return acc;
      }, {});

      const avgTimes = Object.entries(avgTimesBySkill).map(([skill, times]) => ({
        skill,
        avgTime: (times as number[]).reduce((a, b) => a + b, 0) / (times as number[]).length
      }));

      const slowestSkill = avgTimes.sort((a, b) => b.avgTime - a.avgTime)[0]?.skill || '';
      const fastestSkill = avgTimes.sort((a, b) => a.avgTime - b.avgTime)[0]?.skill || '';

      return {
        totalExecutions,
        successRate: successCount / totalExecutions,
        avgExecutionTime,
        totalCost,
        avgQualityScore,
        cacheHitRate: cacheHitCount / totalExecutions,
        mostUsedSkill,
        slowestSkill,
        fastestSkill
      };
    } catch (error: any) {
      console.error('   ⚠️ Metrics analysis error:', error.message);
      return null;
    }
  }

  /**
   * Clean up old metrics (retention policy)
   */
  async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    if (!this.enabled) return 0;

    const cutoff = new Date(Date.now() - daysToKeep * 86400000).toISOString();

    try {
      const { data, error } = await this.supabase
        .from('brain_skill_metrics')
        .delete()
        .lt('activated_at', cutoff)
        .select();

      if (error) {
        console.error('   ⚠️ Failed to cleanup old metrics:', error.message);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`   🧹 Cleaned up ${deletedCount} old skill metrics`);
      return deletedCount;
    } catch (error: any) {
      console.error('   ⚠️ Metrics cleanup error:', error.message);
      return 0;
    }
  }
}

// Global metrics tracker instance
let globalMetricsTracker: SkillMetricsTracker | null = null;

/**
 * Get or create global metrics tracker
 */
export function getMetricsTracker(): SkillMetricsTracker {
  if (!globalMetricsTracker) {
    globalMetricsTracker = new SkillMetricsTracker(true);
  }
  return globalMetricsTracker;
}

/**
 * Reset global metrics tracker (for testing)
 */
export function resetMetricsTracker(): void {
  if (globalMetricsTracker) {
    globalMetricsTracker.stopAutoFlush();
  }
  globalMetricsTracker = null;
}

/**
 * Helper function to create query hash for deduplication
 */
export function hashQuery(query: string, domain: string): string {
  const normalized = `${query.toLowerCase().trim()}:${domain}`;
  // Simple hash function (good enough for dedup)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
