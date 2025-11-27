/**
 * Market Insights Scheduler
 * 
 * Handles automated daily/weekly market insights generation
 * Can be integrated with cron jobs or scheduled tasks
 */

import { marketInsightsService, type CollectiblesCategory, type MarketInsightsConfig } from './market-insights-service';

export interface ScheduleConfig {
  category: CollectiblesCategory;
  frequency: 'daily' | 'weekly';
  time?: string; // HH:MM format for daily, day of week for weekly
  enabled?: boolean;
}

export interface ScheduledReport {
  id: string;
  category: CollectiblesCategory;
  frequency: 'daily' | 'weekly';
  lastGenerated?: string;
  nextScheduled?: string;
  enabled: boolean;
}

export class MarketInsightsScheduler {
  private schedules: Map<string, ScheduleConfig>;
  private reports: Map<string, ScheduledReport>;

  constructor() {
    this.schedules = new Map();
    this.reports = new Map();
  }

  /**
   * Add a schedule for a category
   */
  addSchedule(config: ScheduleConfig): string {
    const id = `${config.category}-${config.frequency}`;
    
    this.schedules.set(id, {
      ...config,
      enabled: config.enabled !== false,
    });

    this.reports.set(id, {
      id,
      category: config.category,
      frequency: config.frequency,
      enabled: config.enabled !== false,
    });

    return id;
  }

  /**
   * Remove a schedule
   */
  removeSchedule(id: string): boolean {
    return this.schedules.delete(id) && this.reports.delete(id);
  }

  /**
   * Generate insights for all due schedules
   */
  async generateDueReports(): Promise<Array<{ id: string; insights?: any; error?: string; markdown?: string }>> {
    const due = this.getDueSchedules();
    const results: Array<{ id: string; insights?: any; error?: string; markdown?: string }> = [];

    for (const schedule of due) {
      try {
        const config: MarketInsightsConfig = {
          category: schedule.category,
          frequency: schedule.frequency,
        };

        const insights = await marketInsightsService.generateMarketInsights(config);
        
        // Update report timestamp
        const report = this.reports.get(schedule.id);
        if (report) {
          report.lastGenerated = new Date().toISOString();
          report.nextScheduled = this.calculateNextSchedule(schedule);
        }

        results.push({
          id: schedule.id,
          insights,
          markdown: marketInsightsService.formatAsMarkdown(insights),
        });
      } catch (error) {
        console.error(`Failed to generate insights for ${schedule.id}:`, error);
        results.push({
          id: schedule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get schedules that are due for generation
   */
  private getDueSchedules(): Array<ScheduleConfig & { id: string }> {
    const now = new Date();
    const due: Array<ScheduleConfig & { id: string }> = [];

    for (const [id, schedule] of this.schedules.entries()) {
      if (!schedule.enabled) continue;

      const report = this.reports.get(id);
      if (!report) continue;

      let isDue = false;

      if (schedule.frequency === 'daily') {
        // Check if it's time for daily generation
        if (!report.lastGenerated) {
          isDue = true;
        } else {
          const lastGenerated = new Date(report.lastGenerated);
          const hoursSinceLast = (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60);
          isDue = hoursSinceLast >= 24;
        }
      } else if (schedule.frequency === 'weekly') {
        // Check if it's time for weekly generation
        if (!report.lastGenerated) {
          isDue = true;
        } else {
          const lastGenerated = new Date(report.lastGenerated);
          const daysSinceLast = (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24);
          isDue = daysSinceLast >= 7;
        }
      }

      if (isDue) {
        due.push({ ...schedule, id });
      }
    }

    return due;
  }

  /**
   * Calculate next scheduled time
   */
  private calculateNextSchedule(schedule: ScheduleConfig): string {
    const now = new Date();
    
    if (schedule.frequency === 'daily') {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      return next.toISOString();
    } else {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      return next.toISOString();
    }
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ScheduledReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Enable/disable a schedule
   */
  setScheduleEnabled(id: string, enabled: boolean): boolean {
    const schedule = this.schedules.get(id);
    const report = this.reports.get(id);
    
    if (!schedule || !report) return false;

    schedule.enabled = enabled;
    report.enabled = enabled;

    return true;
  }

  /**
   * Initialize default schedules for all categories
   */
  initializeDefaultSchedules(frequency: 'daily' | 'weekly' = 'weekly'): void {
    const categories: CollectiblesCategory[] = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    
    categories.forEach(category => {
      this.addSchedule({
        category,
        frequency,
        enabled: true,
      });
    });
  }
}

export const marketInsightsScheduler = new MarketInsightsScheduler();







