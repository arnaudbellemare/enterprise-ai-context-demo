/**
 * PERMUTATION Parallel Multi-Agent System
 * 
 * Implements the Parallelization pattern from Google ADK
 * with specialized research agents running concurrently
 */

import { ACELLMClient } from './ace-llm-client';

// Agent interface
interface Agent {
  name: string;
  role: string;
  domain: string;
  execute(query: string, context: any): Promise<AgentResult>;
}

interface AgentResult {
  agentName: string;
  summary: string;
  data: any;
  duration: number;
  success: boolean;
}

/**
 * Specialized Research Agent
 * Similar to ResearcherAgent_1, ResearcherAgent_2 from Google ADK example
 */
class ResearchAgent implements Agent {
  name: string;
  role: string;
  domain: string;
  private llmClient: ACELLMClient;
  
  constructor(name: string, role: string, domain: string) {
    this.name = name;
    this.role = role;
    this.domain = domain;
    this.llmClient = new ACELLMClient();
  }

  async execute(query: string, context: any): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Execute specialized research based on domain
      const prompt = `You are ${this.name}, a specialized ${this.role} focusing on ${this.domain}.

Query: ${query}

Provide a concise summary (1-2 sentences) of key insights from your domain perspective.`;

      const response = await this.llmClient.generate(prompt, false);
      
      return {
        agentName: this.name,
        summary: response.text,
        data: { domain: this.domain, role: this.role },
        duration: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return {
        agentName: this.name,
        summary: `Agent ${this.name} failed: ${error}`,
        data: null,
        duration: Date.now() - startTime,
        success: false
      };
    }
  }
}

/**
 * Parallel Agent - Executes multiple sub-agents concurrently
 * Similar to ParallelAgent from Google ADK
 */
class ParallelAgent {
  name: string;
  agents: Agent[];
  
  constructor(name: string, agents: Agent[]) {
    this.name = name;
    this.agents = agents;
  }

  async execute(query: string, context: any): Promise<AgentResult[]> {
    console.log(`🔄 ${this.name}: Starting parallel execution of ${this.agents.length} agents...`);
    
    // Execute all agents in parallel
    const results = await Promise.all(
      this.agents.map(agent => agent.execute(query, context))
    );
    
    console.log(`✅ ${this.name}: All ${this.agents.length} agents completed`);
    return results;
  }
}

/**
 * Merger Agent - Synthesizes results from parallel agents
 * Similar to MergerAgent from Google ADK
 */
class MergerAgent {
  name: string;
  private llmClient: ACELLMClient;
  
  constructor(name: string) {
    this.name = name;
    this.llmClient = new ACELLMClient();
  }

  async execute(parallelResults: AgentResult[], originalQuery: string): Promise<string> {
    console.log(`🔀 ${this.name}: Synthesizing ${parallelResults.length} agent results...`);
    
    // Build synthesis prompt with all agent summaries
    const summaries = parallelResults
      .filter(r => r.success)
      .map(r => `### ${r.agentName} (${r.data?.domain || 'general'})\n${r.summary}`)
      .join('\n\n');
    
    const prompt = `You are a synthesis agent. Your task is to combine the following research summaries into a coherent, comprehensive answer.

Original Query: ${originalQuery}

Research Summaries:
${summaries}

IMPORTANT: Base your answer STRICTLY on the provided summaries. Do not add external knowledge. Structure your response with clear headings and a brief conclusion.

Synthesized Answer:`;

    const response = await this.llmClient.generate(prompt, true); // Use teacher model for synthesis
    return response.text;
  }
}

/**
 * Sequential Pipeline Agent - Orchestrates the entire workflow
 * Similar to SequentialAgent from Google ADK
 */
export class MultiAgentPipeline {
  parallelAgent: ParallelAgent;
  mergerAgent: MergerAgent;
  
  constructor(researchAgents: Agent[]) {
    this.parallelAgent = new ParallelAgent('ParallelResearchTeam', researchAgents);
    this.mergerAgent = new MergerAgent('SynthesisAgent');
  }

  async execute(query: string, context: any): Promise<{
    parallelResults: AgentResult[];
    synthesizedAnswer: string;
    totalDuration: number;
  }> {
    const startTime = Date.now();
    
    // Step 1: Execute parallel research agents
    const parallelResults = await this.parallelAgent.execute(query, context);
    
    // Step 2: Synthesize results with merger agent
    const synthesizedAnswer = await this.mergerAgent.execute(parallelResults, query);
    
    return {
      parallelResults,
      synthesizedAnswer,
      totalDuration: Date.now() - startTime
    };
  }
}

/**
 * Create a domain-specific multi-agent research team
 */
export function createDomainResearchTeam(domain: string): Agent[] {
  const domainAgents: Record<string, Agent[]> = {
    crypto: [
      new ResearchAgent('CryptoMarketAnalyst', 'Market Analyst', 'cryptocurrency market trends'),
      new ResearchAgent('BlockchainExpert', 'Technical Expert', 'blockchain technology'),
      new ResearchAgent('RegulatorySpecialist', 'Compliance Expert', 'crypto regulations')
    ],
    tech: [
      new ResearchAgent('AIResearcher', 'AI Researcher', 'artificial intelligence trends'),
      new ResearchAgent('SecurityAnalyst', 'Security Expert', 'cybersecurity developments'),
      new ResearchAgent('OpenSourceExpert', 'OSS Expert', 'open source technology')
    ],
    real_estate: [
      new ResearchAgent('MarketAnalyst', 'Market Analyst', 'real estate market trends'),
      new ResearchAgent('LegalAdvisor', 'Legal Expert', 'property regulations'),
      new ResearchAgent('InvestmentAdvisor', 'Investment Expert', 'real estate investment')
    ],
    healthcare: [
      new ResearchAgent('ClinicalResearcher', 'Clinical Expert', 'medical research'),
      new ResearchAgent('HealthTechSpecialist', 'Health Tech Expert', 'healthcare technology'),
      new ResearchAgent('PolicyAnalyst', 'Policy Expert', 'healthcare policy')
    ],
    financial: [
      new ResearchAgent('EquityAnalyst', 'Equity Analyst', 'stock market analysis'),
      new ResearchAgent('EconomicForecaster', 'Economist', 'economic indicators'),
      new ResearchAgent('RiskAnalyst', 'Risk Expert', 'financial risk assessment')
    ],
    general: [
      new ResearchAgent('GeneralistResearcher', 'Research Generalist', 'broad topic research'),
      new ResearchAgent('DataAnalyst', 'Data Analyst', 'data-driven insights'),
      new ResearchAgent('TrendAnalyst', 'Trend Analyst', 'current trends and patterns')
    ]
  };

  return domainAgents[domain] || domainAgents.general;
}

/**
 * Factory function to create a multi-agent pipeline for a query
 */
export function createMultiAgentPipeline(domain: string): MultiAgentPipeline {
  const researchAgents = createDomainResearchTeam(domain);
  return new MultiAgentPipeline(researchAgents);
}

