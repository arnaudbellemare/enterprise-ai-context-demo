/**
 * ARTICULATION-BASED SCAFFOLDING
 * 
 * Based on arXiv:2509.13547 findings:
 * - Agents prefer writing 2-9x over reading
 * - Articulation drives performance improvements
 * - "Think out loud" helps more than information retrieval
 */

export interface ArticulationEntry {
  id?: string;
  agent_id: string;
  task_id: string;
  team_id: string;
  type: 'pre_task' | 'during_task' | 'post_task' | 'stuck' | 'breakthrough' | 'question';
  thought: string;
  context?: string;
  timestamp: Date;
  searchable: boolean;
  metadata?: {
    difficulty?: number;
    domain?: string;
    tags?: string[];
  };
}

export interface ArticulationSearchResult {
  entry: ArticulationEntry;
  similarity: number;
  relevance: string;
}

/**
 * ArticulationScaffolding - Lightweight "think out loud" interface
 * 
 * Design Principles (from paper):
 * 1. Make it stupidly easy to use (one-line calls)
 * 2. Don't force usage (agents choose when to articulate)
 * 3. Focus on writing/articulation, not just retrieval
 * 4. Enable semantic search for discovery
 */
export class ArticulationScaffolding {
  private teamId: string;
  
  constructor(teamId: string = 'default') {
    this.teamId = teamId;
  }
  
  /**
   * One-line articulation - Super easy to use
   * 
   * Example:
   *   await articulation.thinkOutLoud('Stuck on bowling edge case');
   */
  async thinkOutLoud(
    agentId: string,
    thought: string,
    type: ArticulationEntry['type'] = 'during_task',
    taskId?: string
  ): Promise<void> {
    const entry: ArticulationEntry = {
      agent_id: agentId,
      task_id: taskId || 'current',
      team_id: this.teamId,
      type: type,
      thought: thought,
      timestamp: new Date(),
      searchable: true
    };
    
    // Store articulation (lightweight, fast)
    await this.storeArticulation(entry);
  }
  
  /**
   * Pre-task articulation - "What am I facing?"
   */
  async articulateProblem(
    agentId: string,
    taskId: string,
    problem: string,
    context?: string
  ): Promise<void> {
    const thought = `Problem: ${problem}${context ? `\nContext: ${context}` : ''}`;
    
    await this.storeArticulation({
      agent_id: agentId,
      task_id: taskId,
      team_id: this.teamId,
      type: 'pre_task',
      thought: thought,
      context: context,
      timestamp: new Date(),
      searchable: true
    });
  }
  
  /**
   * During-task articulation - "What's working/not working?"
   */
  async articulateProgress(
    agentId: string,
    taskId: string,
    status: string,
    details?: string
  ): Promise<void> {
    const thought = `Status: ${status}${details ? `\nDetails: ${details}` : ''}`;
    
    await this.storeArticulation({
      agent_id: agentId,
      task_id: taskId,
      team_id: this.teamId,
      type: 'during_task',
      thought: thought,
      timestamp: new Date(),
      searchable: true
    });
  }
  
  /**
   * Stuck articulation - "I'm having trouble with..."
   */
  async articulateStuck(
    agentId: string,
    taskId: string,
    issue: string,
    attemptedSolutions?: string[]
  ): Promise<void> {
    let thought = `Stuck: ${issue}`;
    
    if (attemptedSolutions && attemptedSolutions.length > 0) {
      thought += '\n\nAttempted solutions:\n';
      attemptedSolutions.forEach((sol, i) => {
        thought += `${i + 1}. ${sol}\n`;
      });
    }
    
    await this.storeArticulation({
      agent_id: agentId,
      task_id: taskId,
      team_id: this.teamId,
      type: 'stuck',
      thought: thought,
      timestamp: new Date(),
      searchable: true
    });
  }
  
  /**
   * Breakthrough articulation - "Found it!"
   */
  async articulateBreakthrough(
    agentId: string,
    taskId: string,
    discovery: string,
    approach?: string
  ): Promise<void> {
    let thought = `Breakthrough: ${discovery}`;
    
    if (approach) {
      thought += `\n\nApproach: ${approach}`;
    }
    
    await this.storeArticulation({
      agent_id: agentId,
      task_id: taskId,
      team_id: this.teamId,
      type: 'breakthrough',
      thought: thought,
      timestamp: new Date(),
      searchable: true
    });
  }
  
  /**
   * Post-task reflection - "What did I learn?"
   */
  async articulateReflection(
    agentId: string,
    taskId: string,
    lessons: string[],
    whatWorked?: string,
    whatDidnt?: string
  ): Promise<void> {
    let thought = 'Reflection:\n\n';
    
    if (lessons.length > 0) {
      thought += 'Lessons learned:\n';
      lessons.forEach((lesson, i) => {
        thought += `${i + 1}. ${lesson}\n`;
      });
      thought += '\n';
    }
    
    if (whatWorked) {
      thought += `What worked: ${whatWorked}\n`;
    }
    
    if (whatDidnt) {
      thought += `What didn't work: ${whatDidnt}\n`;
    }
    
    await this.storeArticulation({
      agent_id: agentId,
      task_id: taskId,
      team_id: this.teamId,
      type: 'post_task',
      thought: thought,
      timestamp: new Date(),
      searchable: true
    });
  }
  
  /**
   * Search related articulations (semantic search)
   */
  async searchRelatedThoughts(
    query: string,
    limit: number = 10
  ): Promise<ArticulationSearchResult[]> {
    // Call API for semantic search
    const response = await fetch('/api/articulation/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        team_id: this.teamId,
        limit: limit
      })
    });
    
    if (!response.ok) {
      console.error('Failed to search articulations');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get articulations by type
   */
  async getArticulationsByType(
    type: ArticulationEntry['type'],
    limit: number = 20
  ): Promise<ArticulationEntry[]> {
    const response = await fetch(
      `/api/articulation/by-type?type=${type}&team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get articulations by type');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get recent team articulations
   */
  async getRecentTeamThoughts(limit: number = 20): Promise<ArticulationEntry[]> {
    const response = await fetch(
      `/api/articulation/recent?team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get recent articulations');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Store articulation (internal)
   */
  private async storeArticulation(entry: ArticulationEntry): Promise<void> {
    try {
      const response = await fetch('/api/articulation/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        throw new Error('Failed to store articulation');
      }
    } catch (error) {
      console.error('Error storing articulation:', error);
      // Don't throw - articulation failures shouldn't break task execution
    }
  }
}

/**
 * Quick helper function for one-line articulation
 * 
 * Usage:
 *   await thinkOutLoud('agent-1', 'Having trouble with edge case');
 */
export async function thinkOutLoud(
  agentId: string,
  thought: string,
  teamId: string = 'default'
): Promise<void> {
  const articulation = new ArticulationScaffolding(teamId);
  await articulation.thinkOutLoud(agentId, thought);
}

/**
 * Articulation statistics
 */
export interface ArticulationStats {
  total_articulations: number;
  by_type: Record<string, number>;
  by_agent: Record<string, number>;
  writing_vs_reading_ratio: number;
  most_common_patterns: string[];
}

export async function getArticulationStats(
  teamId: string
): Promise<ArticulationStats> {
  const response = await fetch(`/api/articulation/stats?team_id=${teamId}`);
  
  if (!response.ok) {
    return {
      total_articulations: 0,
      by_type: {},
      by_agent: {},
      writing_vs_reading_ratio: 0,
      most_common_patterns: []
    };
  }
  
  return await response.json();
}

