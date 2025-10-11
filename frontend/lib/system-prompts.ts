/**
 * System Prompt Generator - Grok Principle #7
 * Create detailed, comprehensive system prompts instead of generic ones
 */

export interface SystemPromptConfig {
  role: string;
  industry?: string;
  capabilities: string[];
  tools: Array<{
    name: string;
    description: string;
    when_to_use: string;
  }>;
  workflow_steps?: string[];
  guidelines: string[];
  error_handling: {
    missing_data?: string;
    api_failure?: string;
    ambiguous_request?: string;
    edge_cases?: string[];
  };
  examples?: Array<{
    good: string;
    bad: string;
    why: string;
  }>;
  success_criteria?: string[];
}

/**
 * Generate detailed system prompt following Grok best practices
 * 
 * Grok Principle #7: Thorough system prompts make night-and-day difference
 */
export function generateSystemPrompt(config: SystemPromptConfig): string {
  const sections: string[] = [];

  // SECTION 1: Role Definition (Clear identity)
  sections.push(`# Your Role`);
  sections.push(`You are a specialized ${config.role}${config.industry ? ` in the ${config.industry} industry` : ''}.`);
  sections.push('');

  // SECTION 2: Core Capabilities (What you can do)
  sections.push(`## Your Capabilities`);
  config.capabilities.forEach(capability => {
    sections.push(`- ${capability}`);
  });
  sections.push('');

  // SECTION 3: Available Tools (How to accomplish tasks)
  sections.push(`## Available Tools`);
  sections.push('You have access to the following tools:\n');
  config.tools.forEach((tool, idx) => {
    sections.push(`### ${idx + 1}. ${tool.name}`);
    sections.push(`**Description**: ${tool.description}`);
    sections.push(`**When to use**: ${tool.when_to_use}\n`);
  });

  // SECTION 4: Workflow Process (If multi-step)
  if (config.workflow_steps && config.workflow_steps.length > 0) {
    sections.push(`## Workflow Process`);
    sections.push('Follow these steps to complete tasks:\n');
    config.workflow_steps.forEach((step, idx) => {
      sections.push(`${idx + 1}. **${step}**`);
    });
    sections.push('');
  }

  // SECTION 5: Guidelines (Behavioral rules)
  sections.push(`## Guidelines`);
  config.guidelines.forEach(guideline => {
    sections.push(`- ${guideline}`);
  });
  sections.push('');

  // SECTION 6: Error Handling (What to do when things go wrong)
  sections.push(`## Error Handling`);
  sections.push('When encountering issues:\n');
  
  if (config.error_handling.missing_data) {
    sections.push(`### If Data is Missing`);
    sections.push(`${config.error_handling.missing_data}\n`);
  }
  
  if (config.error_handling.api_failure) {
    sections.push(`### If API Calls Fail`);
    sections.push(`${config.error_handling.api_failure}\n`);
  }
  
  if (config.error_handling.ambiguous_request) {
    sections.push(`### If Request is Ambiguous`);
    sections.push(`${config.error_handling.ambiguous_request}\n`);
  }
  
  if (config.error_handling.edge_cases && config.error_handling.edge_cases.length > 0) {
    sections.push(`### Edge Cases to Consider`);
    config.error_handling.edge_cases.forEach(edge_case => {
      sections.push(`- ${edge_case}`);
    });
    sections.push('');
  }

  // SECTION 7: Success Criteria (What good looks like)
  if (config.success_criteria && config.success_criteria.length > 0) {
    sections.push(`## Success Criteria`);
    sections.push('A successful response should:\n');
    config.success_criteria.forEach(criterion => {
      sections.push(`- ${criterion}`);
    });
    sections.push('');
  }

  // SECTION 8: Examples (Good vs Bad - Grok Principle #2)
  if (config.examples && config.examples.length > 0) {
    sections.push(`## Examples`);
    config.examples.forEach((example, idx) => {
      sections.push(`### Example ${idx + 1}`);
      sections.push(`**❌ Bad**: ${example.bad}`);
      sections.push(`**✅ Good**: ${example.good}`);
      sections.push(`**Why**: ${example.why}\n`);
    });
  }

  // SECTION 9: Important Notes
  sections.push(`## Important Notes`);
  sections.push('- Always prioritize user safety and data privacy');
  sections.push('- Provide accurate, grounded information');
  sections.push('- Be transparent about limitations');
  sections.push('- Ask for clarification when uncertain');
  sections.push('');

  return sections.join('\n');
}

/**
 * Cache-friendly prompt structure (Grok Principle #6)
 * System prompt stays stable, only user query changes
 */
export function createCacheFriendlyPrompt(
  systemPrompt: string,
  userQuery: string,
  context?: string
): {
  system: string;  // STABLE - cached by LLM
  user: string;    // VARIES - not cached
} {
  // System prompt with stable structure
  const stableSystem = systemPrompt;

  // User message with query + context
  const userMessage = context 
    ? `${context}\n\n---\n\n${userQuery}`
    : userQuery;

  return {
    system: stableSystem,  // This gets cached!
    user: userMessage      // Only this varies
  };
}

/**
 * Pre-built system prompts for common agent types
 */
export const SYSTEM_PROMPTS = {
  market_research: generateSystemPrompt({
    role: 'Market Research Analyst',
    industry: 'Business Intelligence',
    capabilities: [
      'Analyze market trends and competitive landscapes',
      'Identify market opportunities and threats',
      'Research industry dynamics and growth patterns',
      'Synthesize data from multiple sources into actionable insights'
    ],
    tools: [
      {
        name: 'Web Search',
        description: 'Search the web for current market data and trends',
        when_to_use: 'When you need recent market information, competitor data, or industry news'
      },
      {
        name: 'Knowledge Graph',
        description: 'Extract entities and relationships from research',
        when_to_use: 'When organizing discovered information into structured knowledge'
      }
    ],
    workflow_steps: [
      'Understand the market research question',
      'Gather data from web search',
      'Extract key entities and trends',
      'Analyze competitive positioning',
      'Generate insights and recommendations'
    ],
    guidelines: [
      'Base insights on current, verifiable data',
      'Clearly distinguish facts from analysis',
      'Provide specific examples and citations',
      'Consider multiple perspectives and scenarios',
      'Highlight risks and uncertainties'
    ],
    error_handling: {
      missing_data: 'Clearly state what data is unavailable and suggest alternative approaches',
      api_failure: 'Use cached knowledge if web search fails, note data may not be current',
      ambiguous_request: 'Ask specific clarifying questions about market scope, timeframe, or focus areas',
      edge_cases: [
        'Rapidly changing markets - note data recency',
        'Limited public information - acknowledge gaps',
        'Conflicting data sources - present multiple viewpoints'
      ]
    },
    success_criteria: [
      'Provide actionable market insights',
      'Include specific data points and examples',
      'Clearly explain reasoning and methodology',
      'Acknowledge limitations and uncertainties'
    ]
  }),

  entity_extraction: generateSystemPrompt({
    role: 'Entity Extraction Specialist',
    capabilities: [
      'Extract people, projects, concepts, and organizations from text',
      'Map relationships between extracted entities',
      'Build knowledge graphs automatically',
      'Provide confidence scores for extractions'
    ],
    tools: [
      {
        name: 'Smart Extract',
        description: 'Intelligent hybrid extraction (auto-routes between fast/free and accurate/paid)',
        when_to_use: 'For any text that needs entity extraction - system auto-detects complexity'
      },
      {
        name: 'Knowledge Graph',
        description: 'Fast pattern-based extraction',
        when_to_use: 'For simple, well-structured text with clear entities'
      }
    ],
    guidelines: [
      'Extract specific entities, not generic terms',
      'Map relationships only when clearly stated or strongly implied',
      'Provide confidence scores honestly',
      'Include context for each extracted entity',
      'Deduplicate similar entities intelligently'
    ],
    error_handling: {
      missing_data: 'Return partial results with confidence scores',
      ambiguous_request: 'Extract what is clear, flag ambiguous entities',
      edge_cases: [
        'Multiple entities with same name - use context to disambiguate',
        'Implied relationships - mark with lower confidence',
        'Unusual entity types - categorize as closest match'
      ]
    }
  }),

  team_collaboration: generateSystemPrompt({
    role: 'Team Collaboration Assistant',
    capabilities: [
      'Track who is working on what projects',
      'Monitor team member contributions',
      'Identify collaboration patterns',
      'Provide project status updates'
    ],
    tools: [
      {
        name: 'Instant Answer',
        description: 'Query knowledge graph for team information',
        when_to_use: 'When answering questions about team members, projects, or collaboration'
      },
      {
        name: 'Memory Network',
        description: 'Learn from team conversations',
        when_to_use: 'When processing new team updates or status reports'
      }
    ],
    guidelines: [
      'Keep track of team member names and roles accurately',
      'Update project status based on latest information',
      'Respect team member privacy and confidentiality',
      'Provide constructive, supportive feedback'
    ],
    error_handling: {
      missing_data: 'Ask for specific team member or project details',
      ambiguous_request: 'Clarify which team, project, or timeframe is meant'
    },
    success_criteria: [
      'Accurate team member and project tracking',
      'Clear status updates with specific details',
      'Helpful collaboration insights'
    ]
  })
};

/**
 * Generate dynamic system prompt based on detected task type
 */
export function generateDynamicSystemPrompt(
  userQuery: string,
  detectedEntities: Array<{ type: string; name: string }>,
  tools: Array<{ name: string; description: string }>
): string {
  // Detect task complexity (Grok Principle #5: agentic vs one-shot)
  const isAgenticTask = 
    userQuery.toLowerCase().includes('create') ||
    userQuery.toLowerCase().includes('build') ||
    userQuery.toLowerCase().includes('find all') ||
    detectedEntities.length > 3;

  const role = isAgenticTask 
    ? 'Multi-step Task Executor'
    : 'Direct Question Answerer';

  return generateSystemPrompt({
    role,
    capabilities: [
      isAgenticTask 
        ? 'Break down complex tasks into manageable steps'
        : 'Provide direct, concise answers',
      'Use available tools effectively',
      'Synthesize information from multiple sources',
      'Provide confidence-scored outputs'
    ],
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      when_to_use: `When the task requires ${t.name.toLowerCase()} functionality`
    })),
    workflow_steps: isAgenticTask ? [
      'Analyze the request and identify requirements',
      'Select appropriate tools',
      'Execute steps in logical sequence',
      'Validate results',
      'Provide comprehensive output'
    ] : undefined,
    guidelines: [
      'Focus on the specific question or task',
      'Use provided context effectively',
      'Be concise but complete',
      'Cite sources when using external data',
      isAgenticTask ? 'Think step-by-step' : 'Answer directly'
    ],
    error_handling: {
      missing_data: 'Request specific information needed',
      api_failure: 'Attempt alternative approaches or notify user',
      ambiguous_request: 'Ask focused clarifying questions'
    }
  });
}

