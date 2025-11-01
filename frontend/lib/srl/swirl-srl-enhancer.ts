/**
 * SRL (Supervised Reinforcement Learning) Enhancement for SWiRL
 * 
 * Adds step-wise supervision to SWiRL decomposition:
 * - Step-wise rewards based on similarity to expert actions
 * - Internal reasoning monologue generation
 * - Learning from expert trajectories
 * 
 * Paper: "Supervised Reinforcement Learning: From Expert Trajectories to Step-wise Reasoning"
 * ArXiv: 2510.25992
 */

import { SWiRLDecompositionResult, SWiRLTrajectory, SWiRLStep } from '../swirl-decomposer';

export interface ExpertTrajectory {
  query: string;
  domain: string;
  steps: ExpertStep[];
  finalAnswer: string;
  quality: number; // 0-1
}

export interface ExpertStep {
  stepNumber: number;
  internalReasoning: string; // Reasoning monologue before action
  action: string; // What to do (matches SWiRLStep.description)
  tool?: string; // Tool to use (if any)
  expectedResult: string; // What result to expect
  actionType: 'retrieve' | 'calculate' | 'analyze' | 'synthesize' | 'verify';
}

export interface SRLEnhancedStep extends SWiRLStep {
  internalReasoning?: string; // NEW: Reasoning monologue (enhances existing reasoning field)
  stepReward?: number; // NEW: Similarity to expert step (0-1)
  expertStep?: ExpertStep; // NEW: Matched expert step
}

export interface SRLEnhancedDecomposition extends SWiRLDecompositionResult {
  trajectory: SRLEnhancedTrajectory;
  averageStepReward: number;
  totalReward: number;
}

export interface SRLEnhancedTrajectory extends SWiRLTrajectory {
  steps: SRLEnhancedStep[];
}

export interface SRLConfig {
  expertTrajectories: ExpertTrajectory[];
  stepRewardWeight: number; // Weight of step-wise rewards (0-1)
  finalRewardWeight: number; // Weight of final outcome (0-1), should sum to 1 with stepRewardWeight
  reasoningGeneration: boolean; // Generate internal reasoning monologue
  similarityThreshold: number; // Minimum similarity to match expert step (0-1)
}

export class SWiRLSRLEnhancer {
  private config: SRLConfig;
  
  constructor(config: SRLConfig) {
    this.config = {
      expertTrajectories: config.expertTrajectories || [],
      stepRewardWeight: config.stepRewardWeight ?? 0.6,
      finalRewardWeight: config.finalRewardWeight ?? 0.4,
      reasoningGeneration: config.reasoningGeneration ?? true,
      similarityThreshold: config.similarityThreshold ?? 0.5
    };
  }

  /**
   * Enhance SWiRL decomposition with SRL supervision
   */
  async enhanceWithSRL(
    decomposition: SWiRLDecompositionResult,
    query: string,
    domain: string
  ): Promise<SRLEnhancedDecomposition> {
    // Generate embedding for query (for vector similarity)
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    // Find best matching expert trajectory (using vector similarity if available)
    const expertTrajectory = await this.findBestExpertTrajectory(query, domain, queryEmbedding);
    
    if (!expertTrajectory) {
      console.log('⚠️  No expert trajectory found, returning unenhanced decomposition');
      return {
        ...decomposition,
        trajectory: {
          ...decomposition.trajectory,
          original_task: decomposition.trajectory.original_task || query,
          steps: decomposition.trajectory.steps.map(s => ({ ...s }))
        },
        averageStepReward: 0,
        totalReward: 0
      };
    }

    console.log(`📚 SRL: Matched expert trajectory (${expertTrajectory.steps.length} steps, quality=${expertTrajectory.quality})`);

    // Enhance each step with SRL supervision
    const enhancedSteps: SRLEnhancedStep[] = [];
    let totalReward = 0;

    for (let i = 0; i < decomposition.trajectory.steps.length; i++) {
      const step = decomposition.trajectory.steps[i];
      const expertStep = expertTrajectory.steps[i];

      // Generate internal reasoning if enabled (enhance existing reasoning field)
      let internalReasoning: string | undefined;
      if (this.config.reasoningGeneration) {
        internalReasoning = await this.generateInternalReasoning(step, query, i);
        // Merge with existing reasoning
        internalReasoning = step.reasoning 
          ? `${step.reasoning}\n\nSRL Reasoning: ${internalReasoning}`
          : internalReasoning;
      } else {
        internalReasoning = step.reasoning; // Use existing reasoning
      }

      // Compute step-wise reward (similarity to expert)
      const stepReward = expertStep
        ? this.computeStepReward(step, expertStep, internalReasoning)
        : 0;

      totalReward += stepReward;

      enhancedSteps.push({
        ...step,
        reasoning: internalReasoning || step.reasoning, // Enhanced reasoning
        stepReward,
        expertStep
      });

      console.log(`   Step ${i + 1}: reward=${stepReward.toFixed(3)}, reasoning="${internalReasoning?.substring(0, 50)}..."`);
    }

    const averageStepReward = enhancedSteps.length > 0
      ? totalReward / enhancedSteps.length
      : 0;

    return {
      ...decomposition,
      trajectory: {
        ...decomposition.trajectory,
        steps: enhancedSteps
      },
      averageStepReward,
      totalReward
    };
  }

  /**
   * Find best matching expert trajectory using vector similarity (Supabase pgvector)
   */
  private async findBestExpertTrajectory(
    query: string,
    domain: string,
    queryEmbedding?: number[]
  ): Promise<ExpertTrajectory | null> {
    const domainTrajectories = this.config.expertTrajectories.filter(
      t => t.domain === domain
    );

    if (domainTrajectories.length === 0) {
      return null;
    }

    // Try vector similarity search if embedding available and Supabase configured
    if (queryEmbedding) {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          const bestMatch = await this.findBestTrajectoryByVector(
            supabase,
            query,
            domain,
            queryEmbedding
          );
          if (bestMatch) {
            return bestMatch;
          }
        }
      } catch (error) {
        console.warn('⚠️ Vector search failed, falling back to keyword matching:', error);
      }
    }

    // Fallback to keyword matching (for trajectories without embeddings)
    return this.findBestTrajectoryByKeyword(query, domain, domainTrajectories);
  }

  /**
   * Vector similarity search using Supabase pgvector
   */
  private async findBestTrajectoryByVector(
    supabase: any,
    query: string,
    domain: string,
    queryEmbedding: number[]
  ): Promise<ExpertTrajectory | null> {
    try {
      // Use pgvector cosine similarity
      const { data, error } = await supabase.rpc('match_expert_trajectories', {
        query_embedding: queryEmbedding,
        query_domain: domain,
        match_threshold: this.config.similarityThreshold,
        match_count: 5
      });

      if (error) {
        console.warn('⚠️ match_expert_trajectories function not found, using direct query:', error);
        // Fallback: direct cosine similarity query
        return await this.findBestTrajectoryByVectorDirect(supabase, query, domain, queryEmbedding);
      }

      if (data && data.length > 0) {
        const best = data[0]; // Highest similarity
        return {
          query: best.query,
          domain: best.domain,
          steps: best.steps || [],
          finalAnswer: best.final_answer || '',
          quality: best.quality || 0.8
        };
      }
    } catch (error) {
      console.warn('⚠️ Vector search error:', error);
    }

    return null;
  }

  /**
   * Direct vector similarity query (fallback if RPC function doesn't exist)
   */
  private async findBestTrajectoryByVectorDirect(
    supabase: any,
    query: string,
    domain: string,
    queryEmbedding: number[]
  ): Promise<ExpertTrajectory | null> {
    try {
      // Get trajectories with embeddings for this domain
      const { data, error } = await supabase
        .from('expert_trajectories')
        .select('id, query, domain, steps, final_answer, quality, embedding')
        .eq('domain', domain)
        .not('embedding', 'is', null);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Calculate cosine similarity for each trajectory
      let bestMatch: any = null;
      let bestScore = this.config.similarityThreshold;

      for (const trajectory of data) {
        if (!trajectory.embedding) continue;

        // Cosine similarity: dot product of normalized vectors
        const similarity = this.cosineSimilarity(queryEmbedding, trajectory.embedding);
        
        // Weight by trajectory quality
        const score = similarity * 0.7 + (trajectory.quality || 0.8) * 0.3;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = trajectory;
        }
      }

      if (bestMatch) {
        return {
          query: bestMatch.query,
          domain: bestMatch.domain,
          steps: bestMatch.steps || [],
          finalAnswer: bestMatch.final_answer || '',
          quality: bestMatch.quality || 0.8
        };
      }
    } catch (error) {
      console.warn('⚠️ Direct vector search error:', error);
    }

    return null;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
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

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Fallback: Keyword-based matching (for trajectories without embeddings)
   */
  private findBestTrajectoryByKeyword(
    query: string,
    domain: string,
    domainTrajectories: ExpertTrajectory[]
  ): ExpertTrajectory | null {
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 3));

    let bestMatch: ExpertTrajectory | null = null;
    let bestScore = 0;

    for (const trajectory of domainTrajectories) {
      const trajLower = trajectory.query.toLowerCase();
      const trajWords = new Set(trajLower.split(/\s+/).filter(w => w.length > 3));
      
      // Jaccard similarity
      const intersection = Array.from(queryWords).filter(w => trajWords.has(w)).length;
      const union = queryWords.size + trajWords.size - intersection;
      const similarity = union > 0 ? intersection / union : 0;

      // Weight by trajectory quality
      const score = similarity * 0.7 + trajectory.quality * 0.3;

      if (score > bestScore && score > this.config.similarityThreshold) {
        bestScore = score;
        bestMatch = trajectory;
      }
    }

    return bestMatch;
  }

  /**
   * Generate embedding for query (for vector similarity search)
   */
  private async generateQueryEmbedding(query: string): Promise<number[] | undefined> {
    try {
      // Try using OpenAI embedding API
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return undefined;
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
          encoding_format: 'float'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0]?.embedding;
      }
    } catch (error) {
      console.warn('⚠️ Failed to generate query embedding:', error);
    }

    return undefined;
  }

  /**
   * Compute step-wise reward based on similarity to expert step
   */
  private computeStepReward(
    modelStep: SWiRLStep,
    expertStep: ExpertStep,
    internalReasoning?: string
  ): number {
    let reward = 0;
    let factors = 0;

    // 1. Description/Action similarity (30% weight)
    const actionSimilarity = this.computeTextSimilarity(
      modelStep.description || '',
      expertStep.action
    );
    reward += actionSimilarity * 0.3;
    factors += 0.3;

    // 2. Tool selection match (20% weight)
    const modelTools = modelStep.tools_needed || [];
    const expertTool = expertStep.tool;
    
    if (modelTools.length > 0 && expertTool) {
      const toolMatch = modelTools.includes(expertTool) ? 1.0 : 0.0;
      reward += toolMatch * 0.2;
      factors += 0.2;
    } else if (modelTools.length === 0 && !expertTool) {
      reward += 1.0 * 0.2;
      factors += 0.2;
    }

    // 3. Reasoning similarity (30% weight) - if reasoning generated
    if (internalReasoning && expertStep.internalReasoning) {
      const reasoningSimilarity = this.computeTextSimilarity(
        internalReasoning,
        expertStep.internalReasoning
      );
      reward += reasoningSimilarity * 0.3;
      factors += 0.3;
    } else if (modelStep.reasoning && expertStep.internalReasoning) {
      // Use existing reasoning if SRL reasoning not generated
      const reasoningSimilarity = this.computeTextSimilarity(
        modelStep.reasoning,
        expertStep.internalReasoning
      );
      reward += reasoningSimilarity * 0.3;
      factors += 0.3;
    }

    // 4. Action type match (20% weight)
    const actionTypeMatch = this.inferActionType(modelStep) === expertStep.actionType ? 1.0 : 0.0;
    reward += actionTypeMatch * 0.2;
    factors += 0.2;

    // Normalize by factors that were actually computed
    return factors > 0 ? reward / factors : 0.5; // Default 0.5 if no factors
  }

  /**
   * Generate internal reasoning monologue for a step
   */
  private async generateInternalReasoning(
    step: SWiRLStep,
    query: string,
    stepNumber: number
  ): Promise<string> {
    // Simplified reasoning generation - in production, would use LLM
    const action = step.description || 'execute step';
    const tools = step.tools_needed || [];
    const toolText = tools.length > 0 ? `Will use ${tools.join(', ')} tool(s) to accomplish this.` : 'No tool needed for this step.';
    
    const reasoning = `Step ${stepNumber + 1}: Need to ${action}. ` +
      `This step is important because it contributes to answering: "${query.substring(0, 100)}". ` +
      toolText;
    
    return reasoning;
  }

  /**
   * Compute text similarity (simple Jaccard-based)
   */
  private computeTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = Array.from(words1).filter(w => words2.has(w)).length;
    const union = words1.size + words2.size - intersection;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Infer action type from step
   */
  private inferActionType(step: SWiRLStep): ExpertStep['actionType'] {
    const description = (step.description || '').toLowerCase();
    const reasoning = (step.reasoning || '').toLowerCase();
    const combined = description + ' ' + reasoning;
    
    if (combined.includes('retrieve') || combined.includes('fetch') || combined.includes('get') || combined.includes('search')) {
      return 'retrieve';
    }
    if (combined.includes('calculate') || combined.includes('compute') || combined.includes('math') || combined.includes('roi')) {
      return 'calculate';
    }
    if (combined.includes('analyze') || combined.includes('examine') || combined.includes('evaluate') || combined.includes('compare')) {
      return 'analyze';
    }
    if (combined.includes('synthesize') || combined.includes('combine') || combined.includes('merge') || combined.includes('summarize')) {
      return 'synthesize';
    }
    if (combined.includes('verify') || combined.includes('check') || combined.includes('validate') || combined.includes('confirm')) {
      return 'verify';
    }
    
    return 'analyze'; // Default
  }

  /**
   * Calculate overall SRL loss for training
   */
  calculateSRLLoss(
    enhancedDecomposition: SRLEnhancedDecomposition,
    finalAnswer: string,
    expertAnswer: string
  ): number {
    // Step-wise loss
    const stepLoss = 1 - enhancedDecomposition.averageStepReward;
    
    // Final outcome loss
    const finalSimilarity = this.computeTextSimilarity(finalAnswer, expertAnswer);
    const finalLoss = 1 - finalSimilarity;
    
    // Combined loss
    const totalLoss = 
      this.config.stepRewardWeight * stepLoss +
      this.config.finalRewardWeight * finalLoss;
    
    return totalLoss;
  }

  /**
   * Execute SWiRL decomposition with SRL enhancement
   */
  async executeWithSRL(
    query: string,
    domain: string,
    availableTools: string[],
    decomposer: any // SWiRLDecomposer instance
  ): Promise<SRLEnhancedDecomposition> {
    // 1. Get standard SWiRL decomposition
    const decomposition = await decomposer.decompose(query, availableTools);
    
    // 2. Enhance with SRL
    const enhanced = await this.enhanceWithSRL(decomposition, query, domain);
    
    return enhanced;
  }
}

/**
 * Get Supabase client for expert trajectory storage
 */
async function getSupabaseClient() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('⚠️ Supabase client initialization failed:', error);
    return null;
  }
}

/**
 * Load expert trajectories from storage
 * Tries Supabase first, then falls back to in-memory data
 */
export async function loadExpertTrajectories(
  domain: string
): Promise<ExpertTrajectory[]> {
  // Try loading from Supabase first
  const supabase = await getSupabaseClient();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('expert_trajectories')
        .select('*')
        .eq('domain', domain);
      
      if (error) {
        console.warn(`⚠️ Error loading trajectories from Supabase for domain ${domain}:`, error.message);
      } else if (data && data.length > 0) {
        // Parse JSONB trajectory data
        const trajectories = data.map((row: any) => ({
          query: row.query,
          domain: row.domain,
          steps: row.steps || [],
          finalAnswer: row.final_answer || '',
          quality: row.quality || 0.8
        })) as ExpertTrajectory[];
        
        console.log(`📚 Loaded ${trajectories.length} expert trajectories from Supabase for domain: ${domain}`);
        return trajectories;
      }
    } catch (error) {
      console.warn(`⚠️ Error loading from Supabase, falling back to in-memory:`, error);
    }
  }
  
  // Fallback to in-memory data
  try {
    const { loadExpertTrajectories: loadFromModule } = await import('./expert-trajectories');
    const trajectories = await loadFromModule(domain);
    console.log(`📚 Loaded ${trajectories.length} expert trajectories from module for domain: ${domain}`);
    return trajectories;
  } catch (error) {
    console.log(`📚 No expert trajectories found for domain: ${domain}`);
    return [];
  }
}

/**
 * Save expert trajectory to storage
 * Saves to Supabase if available, otherwise logs to console
 */
/**
 * Convenience function to enhance SWiRL steps with SRL
 */
export async function enhanceSWiRLWithSRL(
  query: string,
  domain: string,
  swirlSteps: SWiRLStep[]
): Promise<{
  enhancedSteps: SRLEnhancedStep[];
  averageStepReward: number;
  totalReward: number;
  bestTrajectoryMatch?: ExpertTrajectory;
  internalReasoning?: string;
}> {
  const expertTrajectories = await loadExpertTrajectories(domain);
  
  if (expertTrajectories.length === 0) {
    return {
      enhancedSteps: swirlSteps.map(s => ({ ...s })),
      averageStepReward: 0,
      totalReward: 0
    };
  }
  
  // Create enhancer instance
  const enhancer = new SWiRLSRLEnhancer({
    expertTrajectories,
    stepRewardWeight: 0.6,
    finalRewardWeight: 0.4,
    reasoningGeneration: true,
    similarityThreshold: 0.5
  });
  
  // Create a mock decomposition result (we only need the steps)
  const mockDecomposition: SWiRLDecompositionResult = {
    trajectory: {
      task_id: `srl-${Date.now()}`,
      original_task: query,
      steps: swirlSteps,
      total_complexity: 0.5,
      estimated_time_ms: 1000,
      tools_required: []
    },
    sub_trajectories: [],
    synthesis_plan: ''
  };
  
  const enhanced = await enhancer.enhanceWithSRL(mockDecomposition, query, domain);
  
  // Find best trajectory match using public method
  const bestMatch = expertTrajectories.length > 0 
    ? expertTrajectories.reduce((best, current) => {
        // Simple similarity: count shared words
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const currentWords = new Set(current.query.toLowerCase().split(/\s+/));
        const bestWords = new Set(best.query.toLowerCase().split(/\s+/));
        
        const currentOverlap = Array.from(queryWords).filter(w => currentWords.has(w)).length;
        const bestOverlap = Array.from(queryWords).filter(w => bestWords.has(w)).length;
        
        return (currentOverlap > bestOverlap || (currentOverlap === bestOverlap && current.quality > best.quality)) 
          ? current 
          : best;
      })
    : null;
  
  // Extract internal reasoning (concatenate all step reasonings)
  const internalReasoning = enhanced.trajectory.steps
    .map(s => s.internalReasoning)
    .filter(Boolean)
    .join('\n\n');
  
  return {
    enhancedSteps: enhanced.trajectory.steps,
    averageStepReward: enhanced.averageStepReward,
    totalReward: enhanced.totalReward,
    bestTrajectoryMatch: bestMatch || undefined,
    internalReasoning: internalReasoning || undefined
  };
}

export async function saveExpertTrajectory(
  trajectory: ExpertTrajectory,
  embedding?: number[]
): Promise<void> {
  const supabase = await getSupabaseClient();
  
  if (supabase) {
    try {
      // Generate a unique ID for the trajectory based on query and domain
      // Use simple hash that works in both Node.js and browser contexts
      // Generate embedding if not provided
      let trajectoryEmbedding = embedding;
      if (!trajectoryEmbedding) {
        trajectoryEmbedding = await generateTrajectoryEmbedding(trajectory.query);
      }

      const hashString = `${trajectory.domain}:${trajectory.query}`;
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const trajectoryId = Math.abs(hash).toString(36).substring(0, 36) + '_' + trajectory.domain;
      
      const { error } = await supabase
        .from('expert_trajectories')
        .upsert({
          id: trajectoryId,
          query: trajectory.query,
          domain: trajectory.domain,
          steps: trajectory.steps,
          final_answer: trajectory.finalAnswer,
          quality: trajectory.quality,
          embedding: trajectoryEmbedding || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        console.error(`❌ Error saving expert trajectory to Supabase:`, error.message);
        throw error;
      }
      
      console.log(`💾 Saved expert trajectory to Supabase (${trajectoryEmbedding ? 'with' : 'without'} embedding) for domain: ${trajectory.domain}`);
    } catch (error) {
      console.error(`❌ Failed to save expert trajectory:`, error);
      // Don't throw - allow system to continue without persistence
    }
  } else {
    // Supabase not configured - just log
    console.log(`💾 Saving expert trajectory for domain: ${trajectory.domain} (Supabase not configured)`);
  }
}

/**
 * Generate embedding for trajectory query
 */
async function generateTrajectoryEmbedding(query: string): Promise<number[] | undefined> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return undefined;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.data[0]?.embedding;
    }
  } catch (error) {
    console.warn('⚠️ Failed to generate trajectory embedding:', error);
  }

  return undefined;
}

