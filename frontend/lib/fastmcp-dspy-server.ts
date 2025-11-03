/**
 * FastMCP Server exposing DSPy Modules as Tools
 * 
 * Exposes our DSPy modules (Market Analyzer, Financial Analyst, etc.)
 * as MCP tools that external systems can use
 * 
 * Inspired by: FastMCP pattern exposing DSPy agents
 * Usage:
 *   const server = createFastMCPServer();
 *   server.tool('research_notion', async (query: string) => {
 *     const researcher = createReActAgent(NotionResearcher, notion.tools);
 *     return await researcher.execute(query);
 *   });
 */

import { DSPySignature } from './dspy-react-with-tools';

export interface FastMCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

export interface FastMCPServer {
  name: string;
  tools: FastMCPTool[];
  addTool: (name: string, description: string, params: Record<string, any>, execute: (args: any) => Promise<any>) => void;
  executeTool: (name: string, args: any) => Promise<any>;
}

/**
 * Create FastMCP server exposing DSPy modules
 */
export function createFastMCPServer(name: string = 'PermutationDSPy'): FastMCPServer {
  const tools: Map<string, FastMCPTool> = new Map();
  
  const server: FastMCPServer = {
    name,
    tools: [],
    
    addTool(
      name: string,
      description: string,
      parameters: Record<string, any>,
      execute: (args: any) => Promise<any>
    ) {
      const tool: FastMCPTool = {
        name,
        description,
        parameters,
        execute
      };
      tools.set(name, tool);
      server.tools = Array.from(tools.values());
    },
    
    async executeTool(name: string, args: any) {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      return await tool.execute(args);
    }
  };
  
  // Register our DSPy modules as MCP tools
  registerDSPyModules(server);
  
  return server;
}

/**
 * Register existing DSPy modules as MCP tools
 */
function registerDSPyModules(server: FastMCPServer) {
  // Market Research Analyzer
  server.addTool(
    'dspy_market_analyzer',
    'Analyze market trends and competitive intelligence using self-optimizing DSPy',
    {
      marketData: { type: 'string', description: 'Market data to analyze', required: true },
      industry: { type: 'string', description: 'Industry focus' }
    },
    async (args: any) => {
      // Call our existing DSPy market analyzer
      const response = await fetch('http://localhost:3000/api/ax-dspy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'market_research_analyzer',
          inputs: args,
          provider: 'ollama'
        })
      });
      return await response.json();
    }
  );
  
  // Financial Analyst
  server.addTool(
    'dspy_financial_analyst',
    'Perform financial analysis using DSPy-optimized prompts',
    {
      financialData: { type: 'string', description: 'Financial data to analyze', required: true },
      analysisGoal: { type: 'string', description: 'Analysis objective' }
    },
    async (args: any) => {
      const response = await fetch('http://localhost:3000/api/ax-dspy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'financial_analyst',
          inputs: args,
          provider: 'ollama'
        })
      });
      return await response.json();
    }
  );
  
  // Real Estate Analyzer
  server.addTool(
    'dspy_real_estate_analyzer',
    'Analyze real estate properties and market conditions',
    {
      propertyData: { type: 'string', description: 'Property information', required: true },
      analysisType: { type: 'string', description: 'Type of analysis (valuation, investment, etc.)' }
    },
    async (args: any) => {
      const response = await fetch('http://localhost:3000/api/ax-dspy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: 'property_analyzer',
          inputs: args,
          provider: 'ollama'
        })
      });
      return await response.json();
    }
  );
}

