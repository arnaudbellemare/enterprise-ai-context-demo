/**
 * SOCIAL A2A COMMUNICATION
 * 
 * Based on arXiv:2509.13547 findings:
 * - Social media and journaling tools improve performance 15-40%
 * - Casual sharing helps more than formal handoffs
 * - Agents naturally adopt different collaboration styles
 */

export interface SocialPost {
  id?: string;
  agent_id: string;
  team_id: string;
  type: 'announcement' | 'question' | 'celebration' | 'frustration' | 'tip' | 'discovery';
  message: string;
  tags?: string[];
  visibility: 'team' | 'all';
  context?: {
    task_id?: string;
    domain?: string;
    difficulty?: number;
  };
  timestamp: Date;
  searchable: boolean;
  replies?: SocialReply[];
}

export interface SocialReply {
  id?: string;
  agent_id: string;
  message: string;
  timestamp: Date;
}

export interface TeamDiscovery {
  id?: string;
  team_id: string;
  agent_id: string;
  discovery: string;
  rationale: string;
  applicable_to: string[];
  verified: boolean;
  timestamp: Date;
}

/**
 * SocialA2A - Casual collaboration layer on top of structured A2A
 * 
 * Design Principles (from paper):
 * 1. Casual, not formal (conversational tone)
 * 2. Searchable and discoverable
 * 3. Tag-based filtering
 * 4. Optional engagement (agents choose when to participate)
 */
export class SocialA2A {
  private teamId: string;
  
  constructor(teamId: string = 'default') {
    this.teamId = teamId;
  }
  
  /**
   * Post to team feed - Quick share
   * 
   * Examples:
   *   - "Stuck on bowling score calculation edge case"
   *   - "Found better approach to hexagonal pathfinding!"
   *   - "Anyone dealt with zebra puzzle constraints before?"
   */
  async post(
    agentId: string,
    message: string,
    type: SocialPost['type'] = 'announcement',
    options?: {
      tags?: string[];
      taskId?: string;
      domain?: string;
    }
  ): Promise<void> {
    const post: SocialPost = {
      agent_id: agentId,
      team_id: this.teamId,
      type: type,
      message: message,
      tags: options?.tags || [],
      visibility: 'team',
      context: {
        task_id: options?.taskId,
        domain: options?.domain
      },
      timestamp: new Date(),
      searchable: true
    };
    
    await this.storePost(post);
  }
  
  /**
   * Ask team a question
   */
  async askTeam(
    agentId: string,
    question: string,
    context?: string
  ): Promise<void> {
    let message = question;
    if (context) {
      message += `\n\nContext: ${context}`;
    }
    
    await this.post(agentId, message, 'question');
  }
  
  /**
   * Share a celebration
   */
  async celebrate(
    agentId: string,
    achievement: string
  ): Promise<void> {
    await this.post(agentId, `✨ ${achievement}`, 'celebration');
  }
  
  /**
   * Express frustration (rubber duck debugging)
   */
  async expressFrustration(
    agentId: string,
    issue: string
  ): Promise<void> {
    await this.post(agentId, `😤 ${issue}`, 'frustration');
  }
  
  /**
   * Share a tip or discovery
   */
  async shareTip(
    agentId: string,
    tip: string,
    applicableTo?: string[]
  ): Promise<void> {
    const post: SocialPost = {
      agent_id: agentId,
      team_id: this.teamId,
      type: 'tip',
      message: `💡 Tip: ${tip}`,
      tags: applicableTo || [],
      visibility: 'team',
      timestamp: new Date(),
      searchable: true
    };
    
    await this.storePost(post);
  }
  
  /**
   * Share a discovery
   */
  async shareDiscovery(
    agentId: string,
    discovery: string,
    rationale: string,
    applicableTo: string[]
  ): Promise<void> {
    const teamDiscovery: TeamDiscovery = {
      team_id: this.teamId,
      agent_id: agentId,
      discovery: discovery,
      rationale: rationale,
      applicable_to: applicableTo,
      verified: false,
      timestamp: new Date()
    };
    
    // Store as discovery
    await fetch('/api/a2a/social/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamDiscovery)
    });
    
    // Also post to feed
    await this.post(
      agentId,
      `🔍 Discovery: ${discovery}\n\nRationale: ${rationale}`,
      'discovery',
      { tags: applicableTo }
    );
  }
  
  /**
   * Search team posts (tag-based + semantic)
   */
  async searchPosts(
    query: string,
    filterByTags?: string[]
  ): Promise<SocialPost[]> {
    const response = await fetch('/api/a2a/social/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        team_id: this.teamId,
        tags: filterByTags
      })
    });
    
    if (!response.ok) {
      console.error('Failed to search posts');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get recent team posts
   */
  async getRecentPosts(
    limit: number = 20,
    type?: SocialPost['type']
  ): Promise<SocialPost[]> {
    let url = `/api/a2a/social/recent?team_id=${this.teamId}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to get recent posts');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Get posts by tag
   */
  async getPostsByTag(tag: string, limit: number = 20): Promise<SocialPost[]> {
    const response = await fetch(
      `/api/a2a/social/by-tag?tag=${tag}&team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get posts by tag');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Reply to a post
   */
  async reply(
    postId: string,
    agentId: string,
    message: string
  ): Promise<void> {
    const reply: SocialReply = {
      agent_id: agentId,
      message: message,
      timestamp: new Date()
    };
    
    await fetch(`/api/a2a/social/reply/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply)
    });
  }
  
  /**
   * Get team discoveries
   */
  async getDiscoveries(limit: number = 10): Promise<TeamDiscovery[]> {
    const response = await fetch(
      `/api/a2a/social/discoveries?team_id=${this.teamId}&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Failed to get discoveries');
      return [];
    }
    
    return await response.json();
  }
  
  /**
   * Store post (internal)
   */
  private async storePost(post: SocialPost): Promise<void> {
    try {
      const response = await fetch('/api/a2a/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      
      if (!response.ok) {
        throw new Error('Failed to store post');
      }
    } catch (error) {
      console.error('Error storing social post:', error);
    }
  }
}

/**
 * Quick helper functions
 */

export async function postToTeam(
  agentId: string,
  message: string,
  teamId: string = 'default'
): Promise<void> {
  const social = new SocialA2A(teamId);
  await social.post(agentId, message);
}

export async function askTeamQuestion(
  agentId: string,
  question: string,
  teamId: string = 'default'
): Promise<void> {
  const social = new SocialA2A(teamId);
  await social.askTeam(agentId, question);
}

export async function celebrateWin(
  agentId: string,
  achievement: string,
  teamId: string = 'default'
): Promise<void> {
  const social = new SocialA2A(teamId);
  await social.celebrate(agentId, achievement);
}

/**
 * Social A2A statistics
 */
export interface SocialStats {
  total_posts: number;
  by_type: Record<string, number>;
  by_agent: Record<string, number>;
  most_active_agents: string[];
  most_common_tags: string[];
  engagement_rate: number;
}

export async function getSocialStats(teamId: string): Promise<SocialStats> {
  const response = await fetch(`/api/a2a/social/stats?team_id=${teamId}`);
  
  if (!response.ok) {
    return {
      total_posts: 0,
      by_type: {},
      by_agent: {},
      most_active_agents: [],
      most_common_tags: [],
      engagement_rate: 0
    };
  }
  
  return await response.json();
}

