/**
 * TEAM MEMORY SYSTEM
 * 
 * Based on arXiv:2509.13547 findings:
 * - Second run with accumulated team knowledge is 10-30% better
 * - Institutional knowledge compounds over time
 * - Agents build on previous work
 */

export interface TeamKnowledge {
  id?: string;
  team_id: string;
  type: 'solution' | 'approach' | 'pitfall' | 'discovery' | 'lesson';
  problem: string;
  content: string;
  metadata: {
    domain?: string;
    difficulty?: number;
    success_rate?: number;
    agents_used?: string[];
  };
  created_at: Date;
  updated_at: Date;
  verified: boolean;
  usefulness_score?: number;
}

export interface SolvedProblem {
  problem: string;
  solution: string;
  approach: string;
  lessons: string[];
  what_worked: string[];
  what_didnt_work: string[];
  agent_id: string;
  timestamp: Date;
}

export interface TeamPitfall {
  problem: string;
  mistake: string;
  how_to_avoid: string;
  frequency: number;
  last_occurred: Date;
}

export interface TeamDiscovery {
  insight: string;
  applicable_to: string[];
  discovered_by: string;
  verified: boolean;
  verification_count: number;
  timestamp: Date;
}

/**
 * TeamMemorySystem - Accumulated institutional knowledge
 * 
 * Design Principles (from paper):
 * 1. First run: Build knowledge from scratch
 * 2. Subsequent runs: Access accumulated knowledge
 * 3. Knowledge compounds over time
 * 4. Team gets smarter with each problem solved
 */
export class TeamMemorySystem {
  private teamId: string;
  
  constructor(teamId: string = 'default') {
    this.teamId = teamId;
  }
  
  /**
   * First run: Agent works from scratch, accumulates knowledge
   */
  async firstRun(
    taskId: string,
    task: string,
    agentId: string
  ): Promise<{
    result: any;
    accumulated: TeamKnowledge[];
  }> {
    console.log(`[Team Memory] First run - Building knowledge for team ${this.teamId}`);
    
    // Agent works without prior team knowledge
    // (Can still use own ReasoningBank, but no team context)
    
    // After solving, accumulate knowledge
    const accumulated: TeamKnowledge[] = [];
    
    // This would be called after actual task execution
    // For now, return structure
    
    return {
      result: null,  // Actual task result
      accumulated: accumulated
    };
  }
  
  /**
   * Subsequent run: Agent can access team's accumulated knowledge
   */
  async subsequentRun(
    taskId: string,
    task: string,
    agentId: string
  ): Promise<{
    result: any;
    priorKnowledge: TeamKnowledge[];
  }> {
    console.log(`[Team Memory] Subsequent run - Accessing team knowledge for ${this.teamId}`);
    
    // Search team knowledge for relevant information
    const priorKnowledge = await this.searchTeamKnowledge(task);
    
    console.log(`[Team Memory] Found ${priorKnowledge.length} relevant knowledge items`);
    
    // Agent can now build on prior work
    return {
      result: null,  // Actual task result (would use priorKnowledge)
      priorKnowledge: priorKnowledge
    };
  }
  
  /**
   * Add solved problem to team knowledge
   */
  async addSolvedProblem(solved: SolvedProblem): Promise<void> {
    const knowledge: TeamKnowledge = {
      team_id: this.teamId,
      type: 'solution',
      problem: solved.problem,
      content: JSON.stringify({
        solution: solved.solution,
        approach: solved.approach,
        lessons: solved.lessons,
        what_worked: solved.what_worked,
        what_didnt_work: solved.what_didnt_work
      }),
      metadata: {
        agents_used: [solved.agent_id]
      },
      created_at: new Date(),
      updated_at: new Date(),
      verified: false
    };
    
    await this.storeKnowledge(knowledge);
  }
  
  /**
   * Add approach/strategy to team knowledge
   */
  async addApproach(
    problem: string,
    approach: string,
    domain?: string
  ): Promise<void> {
    const knowledge: TeamKnowledge = {
      team_id: this.teamId,
      type: 'approach',
      problem: problem,
      content: approach,
      metadata: {
        domain: domain
      },
      created_at: new Date(),
      updated_at: new Date(),
      verified: false
    };
    
    await this.storeKnowledge(knowledge);
  }
  
  /**
   * Add pitfall to team knowledge
   */
  async addPitfall(pitfall: TeamPitfall): Promise<void> {
    const knowledge: TeamKnowledge = {
      team_id: this.teamId,
      type: 'pitfall',
      problem: pitfall.problem,
      content: JSON.stringify({
        mistake: pitfall.mistake,
        how_to_avoid: pitfall.how_to_avoid,
        frequency: pitfall.frequency
      }),
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
      verified: true  // Pitfalls are verified through occurrence
    };
    
    await this.storeKnowledge(knowledge);
  }
  
  /**
   * Add discovery to team knowledge
   */
  async addDiscovery(discovery: TeamDiscovery): Promise<void> {
    const knowledge: TeamKnowledge = {
      team_id: this.teamId,
      type: 'discovery',
      problem: 'general',
      content: JSON.stringify({
        insight: discovery.insight,
        applicable_to: discovery.applicable_to,
        discovered_by: discovery.discovered_by,
        verification_count: discovery.verification_count
      }),
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
      verified: discovery.verified
    };
    
    await this.storeKnowledge(knowledge);
  }
  
  /**
   * Add lesson to team knowledge
   */
  async addLesson(
    lesson: string,
    context: string,
    applicableTo?: string[]
  ): Promise<void> {
    const knowledge: TeamKnowledge = {
      team_id: this.teamId,
      type: 'lesson',
      problem: context,
      content: lesson,
      metadata: {
        domain: applicableTo?.join(', ')
      },
      created_at: new Date(),
      updated_at: new Date(),
      verified: false
    };
    
    await this.storeKnowledge(knowledge);
  }
  
  /**
   * Search team knowledge (semantic search)
   */
  async searchTeamKnowledge(
    query: string,
    limit: number = 10
  ): Promise<TeamKnowledge[]> {
    const response = await fetch('/api/team-memory/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        team_id: this.teamId,
        limit: limit
      })
    });
    
    if (!response.ok) {
      console.error('Failed to search team knowledge');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get team knowledge by type
   */
  async getKnowledgeByType(
    type: TeamKnowledge['type'],
    limit: number = 20
  ): Promise<TeamKnowledge[]> {
    const response = await fetch(
      `/api/team-memory/by-type?type=${type}&team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get knowledge by type');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get recent team knowledge
   */
  async getRecentKnowledge(limit: number = 20): Promise<TeamKnowledge[]> {
    const response = await fetch(
      `/api/team-memory/recent?team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get recent knowledge');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<TeamMemoryStats> {
    const response = await fetch(
      `/api/team-memory/stats?team_id=${this.teamId}`
    );
    
    if (!response.ok) {
      return {
        total_knowledge_items: 0,
        by_type: {},
        problems_solved: 0,
        approaches_documented: 0,
        pitfalls_identified: 0,
        discoveries_made: 0,
        lessons_learned: 0,
        verified_count: 0,
        avg_usefulness_score: 0
      };
    }
    
    return await response.json();
  }
  
  /**
   * Verify knowledge item (mark as useful)
   */
  async verifyKnowledge(knowledgeId: string): Promise<void> {
    await fetch(`/api/team-memory/verify/${knowledgeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: this.teamId })
    });
  }
  
  /**
   * Rate knowledge usefulness
   */
  async rateKnowledge(
    knowledgeId: string,
    score: number  // 1-5
  ): Promise<void> {
    await fetch(`/api/team-memory/rate/${knowledgeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: this.teamId,
        score: score
      })
    });
  }
  
  /**
   * Store knowledge (internal)
   */
  private async storeKnowledge(knowledge: TeamKnowledge): Promise<void> {
    try {
      const response = await fetch('/api/team-memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledge)
      });
      
      if (!response.ok) {
        throw new Error('Failed to store knowledge');
      }
      
      console.log(`[Team Memory] Stored ${knowledge.type}: ${knowledge.problem.substring(0, 50)}...`);
      
    } catch (error) {
      console.error('Error storing team knowledge:', error);
    }
  }
}

/**
 * Team Memory Statistics
 */
export interface TeamMemoryStats {
  total_knowledge_items: number;
  by_type: Record<string, number>;
  problems_solved: number;
  approaches_documented: number;
  pitfalls_identified: number;
  discoveries_made: number;
  lessons_learned: number;
  verified_count: number;
  avg_usefulness_score: number;
}

/**
 * Quick helper functions
 */

export async function addToTeamKnowledge(
  teamId: string,
  type: TeamKnowledge['type'],
  problem: string,
  content: string
): Promise<void> {
  const team = new TeamMemorySystem(teamId);
  
  const knowledge: TeamKnowledge = {
    team_id: teamId,
    type: type,
    problem: problem,
    content: content,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    verified: false
  };
  
  await team['storeKnowledge'](knowledge);
}

export async function searchTeamKnowledge(
  teamId: string,
  query: string
): Promise<TeamKnowledge[]> {
  const team = new TeamMemorySystem(teamId);
  return await team.searchTeamKnowledge(query);
}

/**
 * Compare first run vs subsequent run performance
 */
export interface RunComparison {
  first_run: {
    duration: number;
    cost: number;
    success: boolean;
  };
  subsequent_run: {
    duration: number;
    cost: number;
    success: boolean;
    knowledge_items_used: number;
  };
  improvement: {
    duration_reduction: number;  // percentage
    cost_reduction: number;      // percentage
    knowledge_impact: string;
  };
}

export async function compareRuns(
  teamId: string,
  taskId: string
): Promise<RunComparison> {
  const response = await fetch(
    `/api/team-memory/compare?team_id=${teamId}&task_id=${taskId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to compare runs');
  }
  
  return await response.json();
}

