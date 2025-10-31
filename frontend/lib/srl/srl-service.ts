/**
 * SRL Expert Trajectory Service
 * 
 * ElizaOS Service pattern for long-running expert trajectory management.
 * Handles loading, caching, and matching of expert trajectories.
 */

import { Service, Runtime } from '../eliza-patterns/types';
import { ExpertTrajectory, loadExpertTrajectories, saveExpertTrajectory } from './swirl-srl-enhancer';

export class SRLExpertTrajectoryService extends Service {
  static serviceName = 'srl-expert-trajectory-service';
  capabilityDescription = 'Manages expert trajectories for SRL supervision: loading, caching, matching, and persistence';

  private cachedTrajectories: Map<string, ExpertTrajectory[]> = new Map();
  private isRunning = false;

  static async start(runtime: Runtime): Promise<Service> {
    const service = new SRLExpertTrajectoryService();
    service.isRunning = true;
    
    // Pre-load trajectories for common domains
    const commonDomains = ['financial', 'legal', 'science', 'healthcare', 'manufacturing'];
    for (const domain of commonDomains) {
      try {
        await service.loadDomainTrajectories(domain);
      } catch (error) {
        // Ignore errors for domains without trajectories
      }
    }
    
    console.log(`✅ SRL Expert Trajectory Service started (${service.cachedTrajectories.size} domains loaded)`);
    return service;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.cachedTrajectories.clear();
    console.log('✅ SRL Expert Trajectory Service stopped');
  }

  /**
   * Load trajectories for a domain
   */
  async loadDomainTrajectories(domain: string): Promise<ExpertTrajectory[]> {
    // Check cache first
    if (this.cachedTrajectories.has(domain)) {
      return this.cachedTrajectories.get(domain)!;
    }

    // Load from storage
    const trajectories = await loadExpertTrajectories(domain);
    this.cachedTrajectories.set(domain, trajectories);
    
    return trajectories;
  }

  /**
   * Find best matching trajectory for query
   */
  async findBestTrajectory(
    query: string,
    domain: string
  ): Promise<ExpertTrajectory | null> {
    const trajectories = await this.loadDomainTrajectories(domain);
    
    if (trajectories.length === 0) {
      return null;
    }

    // Simple matching (full logic in provider)
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 3));

    let bestMatch: ExpertTrajectory | null = null;
    let bestScore = 0;

    for (const trajectory of trajectories) {
      const trajLower = trajectory.query.toLowerCase();
      const trajWords = new Set(trajLower.split(/\s+/).filter(w => w.length > 3));

      const intersection = Array.from(queryWords).filter(w => trajWords.has(w)).length;
      const union = queryWords.size + trajWords.size - intersection;
      const similarity = union > 0 ? intersection / union : 0;

      const score = similarity * 0.7 + trajectory.quality * 0.3;

      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = trajectory;
      }
    }

    return bestMatch;
  }

  /**
   * Save a new expert trajectory
   */
  async saveTrajectory(trajectory: ExpertTrajectory): Promise<void> {
    await saveExpertTrajectory(trajectory);
    
    // Update cache
    const domain = trajectory.domain;
    const existing = this.cachedTrajectories.get(domain) || [];
    existing.push(trajectory);
    this.cachedTrajectories.set(domain, existing);
  }

  /**
   * Get all trajectories for a domain
   */
  getDomainTrajectories(domain: string): ExpertTrajectory[] {
    return this.cachedTrajectories.get(domain) || [];
  }

  /**
   * Check if service is running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

