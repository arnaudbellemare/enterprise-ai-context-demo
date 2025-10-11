/**
 * ACE Playbook Management System
 * Handles persistent storage, versioning, and incremental updates
 */

import { Playbook, ContextBullet, ACEUtils } from './ace-framework';

export interface PlaybookVersion {
  version: string;
  timestamp: Date;
  changes: string;
  bulletCount: number;
  performance: {
    helpful_bullets: number;
    harmful_bullets: number;
    accuracy_improvement?: number;
  };
}

export interface PlaybookStats {
  total_versions: number;
  current_version: string;
  total_bullets: number;
  helpful_bullets: number;
  harmful_bullets: number;
  last_updated: Date;
  performance_trend: 'improving' | 'stable' | 'declining';
  most_used_sections: Array<{
    section: string;
    bullet_count: number;
    usage_score: number;
  }>;
}

export class ACEPlaybookManager {
  private playbook: Playbook;
  private versions: PlaybookVersion[] = [];
  private storageKey: string;

  constructor(playbook?: Playbook, storageKey: string = 'ace-playbook') {
    this.storageKey = storageKey;
    
    if (playbook) {
      this.playbook = playbook;
    } else {
      // Initialize with default playbook
      this.playbook = this.createDefaultPlaybook();
    }
    
    this.loadFromStorage();
  }

  /**
   * Create initial version of the playbook
   */
  private createDefaultPlaybook(): Playbook {
    const defaultKnowledge = [
      {
        description: "ACE Framework: Evolving contexts for self-improving language models",
        tags: ['ace', 'context_engineering', 'self_improvement']
      },
      {
        description: "Generator produces reasoning trajectories for new queries",
        tags: ['generator', 'reasoning', 'trajectory']
      },
      {
        description: "Reflector distills concrete insights from successes and errors",
        tags: ['reflector', 'insights', 'analysis']
      },
      {
        description: "Curator integrates insights into structured context updates",
        tags: ['curator', 'integration', 'context_updates']
      },
      {
        description: "Incremental delta updates prevent context collapse",
        tags: ['incremental', 'delta_updates', 'context_collapse']
      },
      {
        description: "Grow-and-refine mechanism balances expansion with redundancy control",
        tags: ['grow_refine', 'expansion', 'redundancy_control']
      }
    ];

    return ACEUtils.createInitialPlaybook(defaultKnowledge);
  }

  /**
   * Apply incremental updates to the playbook
   */
  async applyUpdates(operations: Array<{
    type: 'ADD' | 'UPDATE' | 'REMOVE';
    section: string;
    content: string;
    bullet_id?: string;
  }>): Promise<PlaybookVersion> {
    const previousVersion = this.getCurrentVersion();
    const previousBulletCount = this.playbook.stats.total_bullets;

    // Apply operations
    operations.forEach(op => {
      switch (op.type) {
        case 'ADD':
          const newBullet: ContextBullet = {
            id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: op.content,
            metadata: {
              helpful_count: 0,
              harmful_count: 0,
              last_used: new Date(),
              created_at: new Date(),
              tags: this.extractTags(op.content)
            }
          };
          this.playbook.bullets.push(newBullet);
          this.playbook.sections[op.section] = this.playbook.sections[op.section] || [];
          this.playbook.sections[op.section].push(newBullet.id);
          break;

        case 'UPDATE':
          if (op.bullet_id) {
            const bullet = this.playbook.bullets.find(b => b.id === op.bullet_id);
            if (bullet) {
              if (op.content === 'helpful') {
                bullet.metadata.helpful_count++;
              } else if (op.content === 'harmful') {
                bullet.metadata.harmful_count++;
              }
              bullet.metadata.last_used = new Date();
            }
          }
          break;

        case 'REMOVE':
          this.playbook.bullets = this.playbook.bullets.filter(b => b.id !== op.bullet_id);
          Object.keys(this.playbook.sections).forEach(section => {
            this.playbook.sections[section] = this.playbook.sections[section].filter(id => id !== op.bullet_id);
          });
          break;
      }
    });

    // Update stats
    this.playbook.stats = {
      total_bullets: this.playbook.bullets.length,
      helpful_bullets: this.playbook.bullets.filter(b => b.metadata.helpful_count > b.metadata.harmful_count).length,
      harmful_bullets: this.playbook.bullets.filter(b => b.metadata.harmful_count > b.metadata.helpful_count).length,
      last_updated: new Date()
    };

    // Create new version
    const newVersion = this.createVersion(
      operations,
      previousBulletCount,
      this.playbook.stats.total_bullets
    );

    this.versions.push(newVersion);
    this.saveToStorage();

    return newVersion;
  }

  /**
   * Create a new version record
   */
  private createVersion(
    operations: any[],
    previousCount: number,
    newCount: number
  ): PlaybookVersion {
    const versionNumber = this.versions.length + 1;
    const bulletDelta = newCount - previousCount;
    
    return {
      version: `v${versionNumber}.0`,
      timestamp: new Date(),
      changes: `${operations.length} operations, ${bulletDelta > 0 ? '+' : ''}${bulletDelta} bullets`,
      bulletCount: newCount,
      performance: {
        helpful_bullets: this.playbook.stats.helpful_bullets,
        harmful_bullets: this.playbook.stats.harmful_bullets,
        accuracy_improvement: this.calculateAccuracyImprovement()
      }
    };
  }

  /**
   * Calculate accuracy improvement based on helpful/harmful ratios
   */
  private calculateAccuracyImprovement(): number {
    if (this.versions.length < 2) return 0;
    
    const current = this.playbook.stats.helpful_bullets / this.playbook.stats.total_bullets;
    const previous = this.versions[this.versions.length - 2].performance.helpful_bullets / 
                    this.versions[this.versions.length - 2].bulletCount;
    
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get comprehensive playbook statistics
   */
  getStats(): PlaybookStats {
    const mostUsedSections = Object.entries(this.playbook.sections)
      .map(([section, bullets]) => ({
        section,
        bullet_count: bullets.length,
        usage_score: bullets.reduce((score, bulletId) => {
          const bullet = this.playbook.bullets.find(b => b.id === bulletId);
          return score + (bullet ? bullet.metadata.helpful_count - bullet.metadata.harmful_count : 0);
        }, 0)
      }))
      .sort((a, b) => b.usage_score - a.usage_score)
      .slice(0, 5);

    const performanceTrend = this.calculatePerformanceTrend();

    return {
      total_versions: this.versions.length,
      current_version: this.getCurrentVersion().version,
      total_bullets: this.playbook.stats.total_bullets,
      helpful_bullets: this.playbook.stats.helpful_bullets,
      harmful_bullets: this.playbook.stats.harmful_bullets,
      last_updated: this.playbook.stats.last_updated,
      performance_trend: performanceTrend,
      most_used_sections: mostUsedSections
    };
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.versions.length < 3) return 'stable';
    
    const recentVersions = this.versions.slice(-3);
    const improvements = recentVersions.map(v => v.performance.accuracy_improvement || 0);
    
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    
    if (avgImprovement > 5) return 'improving';
    if (avgImprovement < -5) return 'declining';
    return 'stable';
  }

  /**
   * Get current version
   */
  getCurrentVersion(): PlaybookVersion {
    return this.versions[this.versions.length - 1] || {
      version: 'v1.0',
      timestamp: new Date(),
      changes: 'Initial version',
      bulletCount: this.playbook.stats.total_bullets,
      performance: {
        helpful_bullets: this.playbook.stats.helpful_bullets,
        harmful_bullets: this.playbook.stats.harmful_bullets
      }
    };
  }

  /**
   * Get version history
   */
  getVersionHistory(): PlaybookVersion[] {
    return [...this.versions];
  }

  /**
   * Rollback to a previous version
   */
  rollbackToVersion(version: string): boolean {
    const versionIndex = this.versions.findIndex(v => v.version === version);
    if (versionIndex === -1) return false;

    // Remove versions after the target version
    this.versions = this.versions.slice(0, versionIndex + 1);
    
    // Reconstruct playbook state (simplified - in production would need full state reconstruction)
    const targetVersion = this.versions[versionIndex];
    this.playbook.stats.total_bullets = targetVersion.bulletCount;
    this.playbook.stats.last_updated = targetVersion.timestamp;
    
    this.saveToStorage();
    return true;
  }

  /**
   * Export playbook for backup or sharing
   */
  exportPlaybook(): {
    playbook: Playbook;
    versions: PlaybookVersion[];
    stats: PlaybookStats;
    export_timestamp: Date;
  } {
    return {
      playbook: this.playbook,
      versions: this.versions,
      stats: this.getStats(),
      export_timestamp: new Date()
    };
  }

  /**
   * Import playbook from backup
   */
  importPlaybook(data: {
    playbook: Playbook;
    versions: PlaybookVersion[];
  }): boolean {
    try {
      this.playbook = data.playbook;
      this.versions = data.versions;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import playbook:', error);
      return false;
    }
  }

  /**
   * Merge with another playbook
   */
  mergePlaybook(otherPlaybook: Playbook): PlaybookVersion {
    const mergedPlaybook = ACEUtils.mergePlaybooks([this.playbook, otherPlaybook]);
    const previousCount = this.playbook.stats.total_bullets;
    
    this.playbook = mergedPlaybook;
    
    return this.createVersion(
      [{ type: 'MERGE', section: 'all', content: 'Merged with external playbook' }],
      previousCount,
      this.playbook.stats.total_bullets
    );
  }

  /**
   * Clean up old or low-value bullets
   */
  cleanupBullets(): PlaybookVersion {
    const threshold = -2; // Remove bullets with helpful_count - harmful_count < -2
    const bulletsToRemove = this.playbook.bullets.filter(
      bullet => (bullet.metadata.helpful_count - bullet.metadata.harmful_count) < threshold
    );

    const previousCount = this.playbook.stats.total_bullets;
    
    // Remove low-value bullets
    bulletsToRemove.forEach(bullet => {
      this.playbook.bullets = this.playbook.bullets.filter(b => b.id !== bullet.id);
      Object.keys(this.playbook.sections).forEach(section => {
        this.playbook.sections[section] = this.playbook.sections[section].filter(id => id !== bullet.id);
      });
    });

    // Update stats
    this.playbook.stats = {
      total_bullets: this.playbook.bullets.length,
      helpful_bullets: this.playbook.bullets.filter(b => b.metadata.helpful_count > b.metadata.harmful_count).length,
      harmful_bullets: this.playbook.bullets.filter(b => b.metadata.harmful_count > b.metadata.helpful_count).length,
      last_updated: new Date()
    };

    const version = this.createVersion(
      [{ type: 'CLEANUP', section: 'all', content: `Removed ${bulletsToRemove.length} low-value bullets` }],
      previousCount,
      this.playbook.stats.total_bullets
    );

    this.versions.push(version);
    this.saveToStorage();

    return version;
  }

  /**
   * Get current playbook
   */
  getPlaybook(): Playbook {
    return this.playbook;
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const commonTags = [
      'api', 'authentication', 'pagination', 'error_handling', 'validation', 
      'optimization', 'workflow', 'automation', 'business_process', 'context_engineering',
      'ace', 'generator', 'reflector', 'curator', 'reasoning', 'trajectory',
      'insights', 'analysis', 'integration', 'context_updates', 'incremental',
      'delta_updates', 'context_collapse', 'grow_refine', 'expansion', 'redundancy_control'
    ];
    
    return commonTags.filter(tag => content.toLowerCase().includes(tag));
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const data = {
        playbook: this.playbook,
        versions: this.versions,
        last_saved: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.playbook = data.playbook;
          this.versions = data.versions || [];
        } catch (error) {
          console.error('Failed to load playbook from storage:', error);
        }
      }
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.playbook = this.createDefaultPlaybook();
    this.versions = [];
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

/**
 * Global playbook manager instance
 */
export const globalPlaybookManager = new ACEPlaybookManager();
