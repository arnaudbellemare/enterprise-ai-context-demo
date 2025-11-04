/**
 * GAMP-Style Multi-Agent System
 * 
 * Based on GAMP framework: "A Framework for Identifying New Idea Generation Paths
 * Integrating Graph Reasoning and Multi-Agent Collaboration"
 * 
 * Formalizes multi-agent collaboration into structured roles:
 * - Chief Scientist Agent (coordinator)
 * - Domain Expert Agents (discipline-specific evaluation)
 * - Path Exploration Agent (graph traversal + LLM guidance)
 * - Innovation Assessment Agent (novelty scoring)
 * - Fact-Checking Agent (reliability verification)
 */

import { graphPathExplorer, type KnowledgeGraph, type Path } from './graph-path-explorer';
import { noveltyScorer, type Path as NoveltyPath } from './novelty-scorer';
import { realityCheckLayer } from '../reality-check-layer';
import { problemSolutionEffectExtractor, type ProblemSolutionEffect } from '../rag/problem-solution-effect-extractor';

export interface AgentMessage {
  from: string;
  to?: string; // If undefined, broadcast to all
  content: string;
  metadata?: any;
  timestamp: Date;
}

export interface AgentDecision {
  agentId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  alternatives?: string[];
}

export interface GAMPPath {
  id: string;
  nodes: string[];
  problem: string;
  solution: string;
  effect: string;
  novelty: number;
  scientificRationality: number;
  factuality: number;
  overallScore: number;
  verified?: boolean;
  evaluations: Array<{
    agentId: string;
    score: number;
    reasoning: string;
  }>;
}

/**
 * Chief Scientist Agent
 * 
 * Role: Team leader and coordinator
 * Responsibilities:
 * - Receive user queries
 * - Decompose complex problems into sub-tasks
 * - Assign tasks to other agents
 * - Synthesize opinions from all agents
 * - Make final decisions and path rankings
 */
export class ChiefScientistAgent {
  private model: string = 'gemma3:4b';
  private agentId: string = 'chief_scientist';
  
  async decomposeQuery(query: string, domain?: string): Promise<string[]> {
    const prompt = `You are the Chief Scientist coordinating a research team. Decompose this complex query into specific sub-tasks that can be assigned to domain experts.

Query: ${query}
${domain ? `Domain: ${domain}` : ''}

Identify 3-5 specific sub-tasks that need to be addressed. Each sub-task should be:
1. Clear and actionable
2. Assignable to a domain expert
3. Contributing to answering the overall query

Respond with JSON array:
["sub-task 1", "sub-task 2", ...]`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are a Chief Scientist coordinating research. Respond only with valid JSON arrays."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) throw new Error('No JSON array found');
      
      const subtasks = JSON.parse(jsonMatch[0]);
      return Array.isArray(subtasks) ? subtasks : [];
    } catch (error) {
      console.warn('Chief Scientist decomposition failed, using simple split:', error);
      return query.split(/[.!?]/).filter(s => s.trim().length > 10).slice(0, 5);
    }
  }
  
  async synthesizeEvaluations(
    evaluations: Array<{ agentId: string; score: number; reasoning: string }>,
    paths: GAMPPath[]
  ): Promise<GAMPPath[]> {
    // Calculate overall scores
    const scoredPaths = paths.map(path => {
      const relevantEvals = evaluations.filter(e => 
        path.evaluations.some(pe => pe.agentId === e.agentId)
      );
      
      const avgScore = relevantEvals.length > 0
        ? relevantEvals.reduce((sum, e) => sum + e.score, 0) / relevantEvals.length
        : path.overallScore;
      
      return {
        ...path,
        overallScore: (
          path.novelty * 0.3 +
          path.scientificRationality * 0.4 +
          path.factuality * 0.3
        ),
      };
    });
    
    // Rank by overall score
    return scoredPaths.sort((a, b) => b.overallScore - a.overallScore);
  }
  
  async rankPaths(paths: GAMPPath[]): Promise<GAMPPath[]> {
    // Final ranking by Chief Scientist
    return this.synthesizeEvaluations(
      paths.flatMap(p => p.evaluations),
      paths
    );
  }
}

/**
 * Domain Expert Agent
 * 
 * Role: Discipline-specific evaluation
 * Responsibilities:
 * - Evaluate scientific rationality from domain perspective
 * - Assess logical coherence of paths
 * - Provide domain-specific feedback
 */
export class DomainExpertAgent {
  private model: string = 'gemma3:4b';
  private agentId: string;
  private domain: string;
  private expertise: string;
  
  constructor(agentId: string, domain: string, expertise: string) {
    this.agentId = agentId;
    this.domain = domain;
    this.expertise = expertise;
  }
  
  async evaluatePath(path: GAMPPath): Promise<{
    score: number;
    reasoning: string;
    concerns?: string[];
  }> {
    const prompt = `You are a ${this.expertise} expert evaluating a scientific path for rationality and logical coherence.

Domain: ${this.domain}
Your Expertise: ${this.expertise}

Path to Evaluate:
- Problem: ${path.problem}
- Solution: ${path.solution}
- Effect: ${path.effect}

Evaluate from your domain's perspective:
1. Is the problem-solution-effect chain scientifically rational?
2. Are the logical connections sound?
3. Are there any domain-specific concerns or gaps?

Respond with JSON:
{
  "score": 0.0-1.0,
  "reasoning": "detailed evaluation",
  "concerns": ["concern 1", "concern 2"] (optional)
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `You are a ${this.expertise} expert. Respond only with valid JSON.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 400,
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error('No JSON found');
      
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(1, result.score || 0.5)),
        reasoning: result.reasoning || 'No reasoning provided',
        concerns: result.concerns || [],
      };
    } catch (error) {
      console.warn(`Domain Expert ${this.agentId} evaluation failed:`, error);
      return {
        score: 0.5,
        reasoning: 'Evaluation failed, using default score',
      };
    }
  }
}

/**
 * Path Exploration Agent
 * 
 * Role: Active exploration on knowledge graph
 * Responsibilities:
 * - Combine graph algorithms (BFS) with LLM semantic guidance
 * - Discover non-obvious associations
 * - Escape local optima
 */
export class PathExplorationAgent {
  private agentId: string = 'path_explorer';
  
  async explorePaths(
    knowledgeGraph: KnowledgeGraph,
    query: string,
    startNodeId?: string
  ): Promise<Path[]> {
    graphPathExplorer.setKnowledgeGraph(knowledgeGraph);
    
    // Use first node if start not specified
    const start = startNodeId || knowledgeGraph.nodes[0]?.id;
    if (!start) {
      return [];
    }
    
    const paths = await graphPathExplorer.explorePaths(start, query, {
      maxDepth: 3,
      maxPaths: 20,
      useBFS: true,
      useLLMGuided: true,
      useGeneticAlgorithm: false,
      noveltyWeight: 0.3,
    });
    
    return paths;
  }
  
  async convertPathsToGAMP(paths: Path[], triplets: ProblemSolutionEffect[]): Promise<GAMPPath[]> {
    // Convert graph paths to GAMP paths with P-S-E structure
    return paths.map((path, index) => {
      const triplet = triplets[index] || triplets[0];
      
      // Extract P-S-E from path nodes if triplet not available
      let problem = triplet?.problem;
      let solution = triplet?.solution;
      let effect = triplet?.effect;
      
      if (!problem || !solution || !effect) {
        // Try to extract from path nodes
        const nodeLabels = path.nodes.map(n => n.label || n.id).join(' ');
        if (!problem) {
          problem = `Research problem related to: ${nodeLabels.substring(0, 100)}`;
        }
        if (!solution) {
          solution = `Solution approach involving: ${nodeLabels.substring(0, 100)}`;
        }
        if (!effect) {
          effect = `Expected effect: ${nodeLabels.substring(0, 100)}`;
        }
      }
      
      return {
        id: `path_${index}`,
        nodes: path.nodes.map(n => n.label || n.id),
        problem: problem || 'Research problem to be identified',
        solution: solution || 'Solution approach to be determined',
        effect: effect || 'Expected effect to be analyzed',
        novelty: path.novelty || 0.5,
        scientificRationality: 0.5, // Will be evaluated by domain experts
        factuality: 0.5, // Will be evaluated by fact-checker
        overallScore: path.score || 0.5,
        evaluations: [],
      };
    });
  }
}

/**
 * Innovation Assessment Agent
 * 
 * Role: Evaluate breakthrough potential of paths
 * Responsibilities:
 * - Calculate novelty scores using GAMP formula
 * - Assess topological and semantic novelty
 * - Score potential impact
 */
export class InnovationAssessmentAgent {
  private agentId: string = 'innovation_assessor';
  private noveltyScorer = noveltyScorer;
  
  async assessPath(path: GAMPPath, historicalPaths: NoveltyPath[] = []): Promise<{
    novelty: number;
    topologicalNovelty: number;
    semanticNovelty: number;
    potentialImpact: number;
    overallScore: number;
  }> {
    // Convert path to Path format for novelty scorer
    // NoveltyPath.nodes is string[] (from novelty-scorer), GAMPPath.nodes is also string[]
    const pathForScoring: NoveltyPath = {
      id: path.id,
      nodes: path.nodes, // Already string[]
      type: 'problem-solution-effect',
    };
    
    // Calculate novelty using GAMP formula
    const noveltyScore = this.noveltyScorer.calculateNovelty(pathForScoring, historicalPaths);
    
    // Calculate topological novelty (graph structure uniqueness)
    const topologicalNovelty = this.calculateTopologicalNovelty(path, historicalPaths);
    
    // Calculate semantic novelty (LLM-based assessment)
    const semanticNovelty = await this.calculateSemanticNovelty(path);
    
    // Assess potential impact
    const potentialImpact = await this.assessPotentialImpact(path);
    
    // Overall innovation score
    const overallScore = (
      noveltyScore.novelty * 0.4 +
      topologicalNovelty * 0.2 +
      semanticNovelty * 0.2 +
      potentialImpact * 0.2
    );
    
    return {
      novelty: noveltyScore.novelty,
      topologicalNovelty,
      semanticNovelty,
      potentialImpact,
      overallScore,
    };
  }
  
  private calculateTopologicalNovelty(path: GAMPPath, historicalPaths: NoveltyPath[]): number {
    // Check if path structure (node sequence) is unique
    const pathKey = path.nodes.join('->');
    let matches = 0;
    
    for (const historicalPath of historicalPaths) {
      // historicalPath.nodes is string[] for NoveltyPath
      const historicalKey = historicalPath.nodes.join('->');
      if (pathKey === historicalKey || pathKey.includes(historicalKey)) {
        matches++;
      }
    }
    
    // Novelty = 1 / (1 + log(frequency))
    return 1 / (1 + Math.log(matches + 1));
  }
  
  private async calculateSemanticNovelty(path: GAMPPath): Promise<number> {
    const prompt = `Evaluate the semantic novelty of this scientific path.

Problem: ${path.problem}
Solution: ${path.solution}
Effect: ${path.effect}

Assess how novel and unexpected this combination is. Score 0-1 where:
- 0.0 = Very common, well-known combination
- 0.5 = Moderately novel
- 1.0 = Highly novel, unexpected combination

Respond with JSON:
{
  "novelty": 0.0-1.0,
  "reasoning": "why this score"
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: 'gemma3:4b',
          messages: [
            {
              role: "system",
              content: "You are an expert at assessing scientific novelty. Respond only with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error('No JSON found');
      
      const result = JSON.parse(jsonMatch[0]);
      return Math.max(0, Math.min(1, result.novelty || 0.5));
    } catch (error) {
      console.warn('Semantic novelty calculation failed:', error);
      return 0.5;
    }
  }
  
  private async assessPotentialImpact(path: GAMPPath): Promise<number> {
    const prompt = `Assess the potential scientific impact of this path.

Problem: ${path.problem}
Solution: ${path.solution}
Effect: ${path.effect}

Consider:
1. How significant would solving this problem be?
2. How impactful would this solution be?
3. How important is this effect?

Score 0-1 where:
- 0.0 = Low impact, incremental
- 0.5 = Moderate impact
- 1.0 = High impact, potentially breakthrough

Respond with JSON:
{
  "impact": 0.0-1.0,
  "reasoning": "why"
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: 'gemma3:4b',
          messages: [
            {
              role: "system",
              content: "You are an expert at assessing scientific impact. Respond only with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error('No JSON found');
      
      const result = JSON.parse(jsonMatch[0]);
      return Math.max(0, Math.min(1, result.impact || 0.5));
    } catch (error) {
      console.warn('Impact assessment failed:', error);
      return 0.5;
    }
  }
}

/**
 * Fact-Checking Agent
 * 
 * Role: Reliability gatekeeper
 * Responsibilities:
 * - Verify all inferences against knowledge graph
 * - Suppress LLM hallucinations
 * - Ensure factuality
 */
export class FactCheckingAgent {
  private agentId: string = 'fact_checker';
  private realityCheckLayer = realityCheckLayer;
  
  async verifyPath(
    path: GAMPPath,
    knowledgeGraph: KnowledgeGraph,
    sourceDocuments: any[]
  ): Promise<{
    factuality: number;
    verified: boolean;
    issues: string[];
    evidence: string[];
  }> {
    // 1. Verify Problem-Solution-Effect against knowledge graph
    const graphVerification = this.verifyAgainstGraph(path, knowledgeGraph);
    
    // 2. Verify against source documents using reality-check layer
    const documentVerification = await this.verifyAgainstDocuments(path, sourceDocuments);
    
    // 3. Check for hallucinations
    const hallucinationCheck = await this.checkForHallucinations(path, knowledgeGraph);
    
    // Combine verifications
    const factuality = (
      graphVerification.score * 0.5 +
      documentVerification.score * 0.3 +
      (1 - hallucinationCheck.hallucinationScore) * 0.2
    );
    
    const verified = factuality >= 0.7;
    
    return {
      factuality,
      verified,
      issues: [
        ...graphVerification.issues,
        ...documentVerification.issues,
        ...hallucinationCheck.issues,
      ],
      evidence: [
        ...graphVerification.evidence,
        ...documentVerification.evidence,
      ],
    };
  }
  
  private verifyAgainstGraph(
    path: GAMPPath,
    knowledgeGraph: KnowledgeGraph
  ): {
    score: number;
    issues: string[];
    evidence: string[];
  } {
    const issues: string[] = [];
    const evidence: string[] = [];
    let verifiedCount = 0;
    let totalChecks = 0;
    
    // Check if problem exists in graph
    const problemNode = knowledgeGraph.nodes.find(n =>
      n.label.toLowerCase().includes(path.problem.toLowerCase().substring(0, 20))
    );
    if (problemNode) {
      evidence.push(`Problem verified in graph: ${problemNode.label}`);
      verifiedCount++;
    } else {
      issues.push(`Problem "${path.problem.substring(0, 50)}" not found in knowledge graph`);
    }
    totalChecks++;
    
    // Check if solution exists in graph
    const solutionNode = knowledgeGraph.nodes.find(n =>
      n.label.toLowerCase().includes(path.solution.toLowerCase().substring(0, 20))
    );
    if (solutionNode) {
      evidence.push(`Solution verified in graph: ${solutionNode.label}`);
      verifiedCount++;
    } else {
      issues.push(`Solution "${path.solution.substring(0, 50)}" not found in knowledge graph`);
    }
    totalChecks++;
    
    // Check if effect exists in graph
    const effectNode = knowledgeGraph.nodes.find(n =>
      n.label.toLowerCase().includes(path.effect.toLowerCase().substring(0, 20))
    );
    if (effectNode) {
      evidence.push(`Effect verified in graph: ${effectNode.label}`);
      verifiedCount++;
    } else {
      issues.push(`Effect "${path.effect.substring(0, 50)}" not found in knowledge graph`);
    }
    totalChecks++;
    
    // Check if edges exist
    if (problemNode && solutionNode) {
      const edge = knowledgeGraph.edges.find(e =>
        e.from === problemNode.id && e.to === solutionNode.id
      );
      if (edge) {
        evidence.push(`Problem-Solution edge verified: ${edge.relation}`);
        verifiedCount++;
      } else {
        issues.push('Problem-Solution edge not found in graph');
      }
      totalChecks++;
    }
    
    if (solutionNode && effectNode) {
      const edge = knowledgeGraph.edges.find(e =>
        e.from === solutionNode.id && e.to === effectNode.id
      );
      if (edge) {
        evidence.push(`Solution-Effect edge verified: ${edge.relation}`);
        verifiedCount++;
      } else {
        issues.push('Solution-Effect edge not found in graph');
      }
      totalChecks++;
    }
    
    return {
      score: totalChecks > 0 ? verifiedCount / totalChecks : 0,
      issues,
      evidence,
    };
  }
  
  private async verifyAgainstDocuments(
    path: GAMPPath,
    sourceDocuments: any[]
  ): Promise<{
    score: number;
    issues: string[];
    evidence: string[];
  }> {
    const issues: string[] = [];
    const evidence: string[] = [];
    let verifiedCount = 0;
    
    const pathText = `${path.problem} ${path.solution} ${path.effect}`;
    
    for (const doc of sourceDocuments.slice(0, 5)) { // Check top 5 documents
      const docText = doc.content || doc.enrichedContent || '';
      
      // Use reality-check layer to verify
      const verification = await this.realityCheckLayer.verifyEnrichment(
        pathText,
        docText,
        undefined
      );
      
      if (verification.passed && verification.criteria.faithfulness > 0.7) {
        evidence.push(`Verified against document: ${doc.id || 'unknown'}`);
        verifiedCount++;
      } else {
        issues.push(`Low faithfulness with document ${doc.id || 'unknown'}: ${verification.criteria.faithfulness.toFixed(2)}`);
      }
    }
    
    return {
      score: sourceDocuments.length > 0 ? verifiedCount / Math.min(sourceDocuments.length, 5) : 0,
      issues,
      evidence,
    };
  }
  
  private async checkForHallucinations(
    path: GAMPPath,
    knowledgeGraph: KnowledgeGraph
  ): Promise<{
    hallucinationScore: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Check if path contains entities not in knowledge graph
    const pathEntities = [
      ...path.problem.split(/\s+/),
      ...path.solution.split(/\s+/),
      ...path.effect.split(/\s+/),
    ].filter(w => w.length > 3);
    
    const graphEntities = new Set(
      knowledgeGraph.nodes.map(n => n.label.toLowerCase())
    );
    
    let unknownCount = 0;
    for (const entity of pathEntities) {
      const found = Array.from(graphEntities).some(ge =>
        ge.includes(entity.toLowerCase()) || entity.toLowerCase().includes(ge)
      );
      if (!found) {
        unknownCount++;
        issues.push(`Unknown entity in path: "${entity}"`);
      }
    }
    
    const hallucinationScore = pathEntities.length > 0
      ? unknownCount / pathEntities.length
      : 0;
    
    return {
      hallucinationScore,
      issues: issues.slice(0, 5), // Limit to 5 issues
    };
  }
}

/**
 * GAMP Multi-Agent System
 * 
 * Coordinates all agents in structured collaboration
 */
export class GAMPMultiAgentSystem {
  private chiefScientist: ChiefScientistAgent;
  private domainExperts: DomainExpertAgent[];
  private pathExplorer: PathExplorationAgent;
  private innovationAssessor: InnovationAssessmentAgent;
  private factChecker: FactCheckingAgent;
  
  constructor() {
    this.chiefScientist = new ChiefScientistAgent();
    this.domainExperts = [
      new DomainExpertAgent('molecular_biologist', 'biology', 'Molecular Biology'),
      new DomainExpertAgent('physiologist', 'biology', 'Physiology'),
      new DomainExpertAgent('chemist', 'chemistry', 'Chemistry'),
    ];
    this.pathExplorer = new PathExplorationAgent();
    this.innovationAssessor = new InnovationAssessmentAgent();
    this.factChecker = new FactCheckingAgent();
  }
  
  /**
   * Main discovery pipeline: Discover paths for new idea generation
   */
  async discoverPaths(
    query: string,
    knowledgeGraph: KnowledgeGraph,
    sourceDocuments: any[],
    domain?: string
  ): Promise<GAMPPath[]> {
    console.log('🔬 GAMP Multi-Agent System: Starting path discovery...');
    
    // Step 1: Chief Scientist decomposes query
    console.log('   👨‍🔬 Chief Scientist: Decomposing query...');
    const subtasks = await this.chiefScientist.decomposeQuery(query, domain);
    console.log(`   ✅ Decomposed into ${subtasks.length} sub-tasks`);
    
    // Step 2: Path Explorer finds candidate paths
    console.log('   🔍 Path Explorer: Exploring knowledge graph...');
    const graphPaths = await this.pathExplorer.explorePaths(knowledgeGraph, query);
    console.log(`   ✅ Found ${graphPaths.length} candidate paths`);
    
    // Extract P-S-E triplets from documents
    const triplets = await Promise.all(
      sourceDocuments.slice(0, 10).map(async (doc) => {
        if (doc.metadata?.problemSolutionEffect) {
          return {
            problem: doc.metadata.problemSolutionEffect.problem,
            solution: doc.metadata.problemSolutionEffect.solution,
            effect: doc.metadata.problemSolutionEffect.effect,
            confidence: doc.metadata.problemSolutionEffect.confidence,
            source: doc.id,
          };
        }
        return null;
      })
    );
    
    const validTriplets = triplets.filter(t => t !== null) as ProblemSolutionEffect[];
    
    // Convert to GAMP paths
    const gampPaths = await this.pathExplorer.convertPathsToGAMP(graphPaths, validTriplets);
    
    // Step 3-5: Fully parallel agent evaluations across all paths
    // OPTIMIZATION: Run ALL agent evaluations in parallel (across all paths and all agents)
    // This maximizes parallelism by flattening the nested structure
    // 
    // QUALITY PRESERVATION: This parallel execution does NOT impact quality because:
    // 1. Each agent is stateless - no shared mutable state
    // 2. All agents read-only access to inputs (path, knowledgeGraph, sourceDocuments)
    // 3. Results are combined deterministically after all evaluations complete
    // 4. Same inputs produce same outputs regardless of execution order
    // 5. historicalPaths is read-only and not modified during evaluation
    console.log('   🎓 Domain Experts, Innovation Assessor, Fact Checker: Evaluating all paths and agents in parallel...');
    
    const historicalPaths: NoveltyPath[] = []; // Could be loaded from previous discoveries (read-only, safe for parallel access)
    
    // Create all evaluation tasks upfront (flattened structure)
    const evaluationTasks: Array<{
      pathIndex: number;
      path: GAMPPath;
      type: 'domain_expert' | 'innovation' | 'fact_check';
      expertIndex?: number;
    }> = [];
    
    gampPaths.forEach((path, pathIndex) => {
      // Add all domain expert evaluations
      this.domainExperts.forEach((_, expertIndex) => {
        evaluationTasks.push({ pathIndex, path, type: 'domain_expert', expertIndex });
      });
      // Add innovation assessment
      evaluationTasks.push({ pathIndex, path, type: 'innovation' });
      // Add fact checking
      evaluationTasks.push({ pathIndex, path, type: 'fact_check' });
    });
    
    // Execute ALL evaluations in parallel (maximum parallelism)
    const evaluationResults = await Promise.all(
      evaluationTasks.map(async (task) => {
        if (task.type === 'domain_expert') {
          const expert = this.domainExperts[task.expertIndex!];
          const evaluation = await expert.evaluatePath(task.path);
          return {
            pathIndex: task.pathIndex,
            type: 'domain_expert' as const,
            expertIndex: task.expertIndex!,
            agentId: expert['agentId'],
            score: evaluation.score,
            reasoning: evaluation.reasoning,
          };
        } else if (task.type === 'innovation') {
          const innovation = await this.innovationAssessor.assessPath(task.path, historicalPaths);
          return {
            pathIndex: task.pathIndex,
            type: 'innovation' as const,
            innovation,
          };
        } else {
          const verification = await this.factChecker.verifyPath(
            task.path,
            knowledgeGraph,
            sourceDocuments
          );
          return {
            pathIndex: task.pathIndex,
            type: 'fact_check' as const,
            verification,
          };
        }
      })
    );
    
    // Reassemble results by path
    const verifiedPaths = gampPaths.map((path, pathIndex) => {
      // Extract all evaluations for this path
      const pathEvaluations = evaluationResults.filter(r => r.pathIndex === pathIndex);
      
      const expertEvaluations = pathEvaluations
        .filter((r): r is typeof r & { type: 'domain_expert' } => r.type === 'domain_expert')
        .map(r => ({
          agentId: r.agentId,
          score: r.score,
          reasoning: r.reasoning,
        }));
      
      const innovationResult = pathEvaluations.find((r): r is typeof r & { type: 'innovation' } => r.type === 'innovation');
      const factCheckResult = pathEvaluations.find((r): r is typeof r & { type: 'fact_check' } => r.type === 'fact_check');
      
      const avgRationality = expertEvaluations.length > 0
        ? expertEvaluations.reduce((sum, e) => sum + e.score, 0) / expertEvaluations.length
        : 0.5;
      
      return {
        ...path,
        scientificRationality: avgRationality,
        novelty: innovationResult?.innovation.overallScore || path.novelty || 0.5,
        factuality: factCheckResult?.verification.factuality || 0.5,
        verified: factCheckResult?.verification.verified || false,
        evaluations: [
          ...path.evaluations,
          ...expertEvaluations,
          ...(innovationResult ? [{
            agentId: 'innovation_assessor',
            score: innovationResult.innovation.overallScore,
            reasoning: `Novelty: ${innovationResult.innovation.novelty.toFixed(2)}, Impact: ${innovationResult.innovation.potentialImpact.toFixed(2)}`,
          }] : []),
          ...(factCheckResult ? [{
            agentId: 'fact_checker',
            score: factCheckResult.verification.factuality,
            reasoning: factCheckResult.verification.verified
              ? `Verified: ${factCheckResult.verification.evidence.length} evidence points`
              : `Issues: ${factCheckResult.verification.issues.join(', ')}`,
          }] : []),
        ],
      };
    });
    
    // Step 6: Chief Scientist ranks and returns
    console.log('   👨‍🔬 Chief Scientist: Ranking final paths...');
    const rankedPaths = await this.chiefScientist.rankPaths(verifiedPaths);
    
    console.log(`   ✅ GAMP System: Discovered ${rankedPaths.length} ranked paths`);
    
    return rankedPaths;
  }
}

// Singleton instance
export const gampAgentSystem = new GAMPMultiAgentSystem();

