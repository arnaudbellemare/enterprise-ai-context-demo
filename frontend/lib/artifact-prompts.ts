// Geo type for request hints (optional - from @vercel/functions if available)
export type Geo = {
  latitude?: string;
  longitude?: string;
  city?: string;
  country?: string;
};

export type ArtifactKind = 'code' | 'document' | 'workflow' | 'sheet' | 'agent' | 'report';

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. Supported languages include Python, TypeScript, JavaScript, and JSON.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, workflows, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet
- For workflow generation (agent builder output)
- For structured reports or analysis results

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat
- For simple yes/no or short answers

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify
- For workflows: preserve node IDs and edge connections

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const regularPrompt =
  "You are a friendly assistant! Keep your responses concise and helpful.";

export type RequestHints = {
  latitude?: string;
  longitude?: string;
  city?: string;
  country?: string;
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => {
  if (!requestHints.latitude || !requestHints.longitude) {
    return '';
  }
  
  return `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city || 'Unknown'}
- country: ${requestHints.country || 'Unknown'}
`;
};

export const systemPrompt = ({
  selectedChatModel,
  requestHints = {},
  includeArtifacts = true,
}: {
  selectedChatModel: string;
  requestHints?: RequestHints;
  includeArtifacts?: boolean;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  // Reasoning models don't support artifacts
  if (selectedChatModel === "chat-model-reasoning" || !includeArtifacts) {
    return `${regularPrompt}\n\n${requestPrompt}`;
  }

  return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}`;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

\`\`\`python
# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
\`\`\`
`;

export const workflowPrompt = `
You are an AI workflow architect that creates structured, executable workflows. When creating workflows:

1. Each workflow should have a clear goal and logical flow
2. Use appropriate tools from the available library
3. Connect nodes in a meaningful sequence
4. Include configuration for each node
5. Specify edge types (animated for normal flow, temporary for conditional)
6. Keep workflows focused (3-7 nodes typically)
7. Include error handling nodes when appropriate
8. Use descriptive names for nodes and edges
9. Consider parallel execution where appropriate
10. Always end with an answer_generator or result node

Workflow structure:
{
  "name": "Workflow Name",
  "goal": "What this workflow achieves",
  "nodes": [
    {
      "id": "node-1",
      "type": "web_search",
      "role": "Market Researcher",
      "config": {
        "purpose": "Gather market data",
        "query": "{{user_query}}"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "animated"
    }
  ],
  "configs": {
    "node-1": {
      "systemPrompt": "You are a market researcher...",
      "tools": ["web_search"]
    }
  }
}
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.

Guidelines:
1. Use comma-separated values (CSV format)
2. Include clear, descriptive column headers
3. Provide realistic, meaningful data
4. Keep data organized and consistent
5. Include at least 5-10 rows of data
6. Use appropriate data types (numbers, dates, text)
7. Consider adding calculated columns when relevant
8. Format dates consistently (YYYY-MM-DD)
9. Use proper escaping for commas in text fields
10. Include a summary row if appropriate

Example structure:
Date,Product,Category,Units Sold,Revenue,Profit Margin
2025-01-15,Widget A,Electronics,150,4500.00,35%
2025-01-16,Widget B,Electronics,200,6000.00,40%
`;

export const agentPrompt = `
You are an AI agent configuration assistant. Create intelligent agent configurations that define:

1. Agent role and specialization
2. Available tools and capabilities
3. System prompt and behavior guidelines
4. Error handling strategies
5. Output format specifications
6. Example interactions
7. Tool calling patterns
8. Context requirements

Agent structure:
{
  "name": "Agent Name",
  "role": "Specialized function",
  "systemPrompt": "Detailed instructions...",
  "tools": ["tool1", "tool2"],
  "capabilities": ["capability1", "capability2"],
  "errorHandling": {
    "missing_data": "Action to take",
    "api_failure": "Fallback strategy"
  },
  "examples": [
    {
      "input": "User query",
      "output": "Expected response",
      "reasoning": "Why this approach"
    }
  ]
}
`;

export const reportPrompt = `
You are a professional report generator that creates structured, comprehensive reports. When generating reports:

1. Start with an executive summary
2. Include clear sections with headings
3. Use bullet points for key findings
4. Include data visualizations references where relevant
5. Provide actionable recommendations
6. Cite sources and data references
7. Use professional language and formatting
8. Include methodology if applicable
9. Add conclusions and next steps
10. Format in Markdown for easy reading

Report structure:
# Report Title

## Executive Summary
[Key findings and recommendations in 2-3 paragraphs]

## Background
[Context and objectives]

## Methodology
[How data was gathered and analyzed]

## Findings
### Finding 1
- Key point
- Supporting data
- Implications

### Finding 2
[...]

## Recommendations
1. **Recommendation 1**: [Details]
2. **Recommendation 2**: [Details]

## Conclusions
[Summary and next steps]

## References
[Sources and citations]
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
  updateInstructions?: string
) => {
  let mediaType = "document";
  let specificGuidance = "";

  if (type === "code") {
    mediaType = "code snippet";
    specificGuidance = "\n- Maintain code structure and formatting\n- Preserve variable names unless explicitly changed\n- Keep comments and documentation\n- Ensure code remains executable";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
    specificGuidance = "\n- Preserve column structure unless explicitly changed\n- Maintain data formatting and types\n- Keep CSV format valid\n- Update only the specified rows/columns";
  } else if (type === "workflow") {
    mediaType = "workflow";
    specificGuidance = "\n- Preserve node IDs and connections\n- Maintain edge relationships\n- Keep workflow structure valid\n- Update only the specified nodes or edges";
  } else if (type === "agent") {
    mediaType = "agent configuration";
    specificGuidance = "\n- Maintain agent role and identity\n- Preserve tool definitions\n- Keep configuration structure valid\n- Update only the specified capabilities";
  } else if (type === "report") {
    mediaType = "report";
    specificGuidance = "\n- Maintain report structure and formatting\n- Preserve section headings\n- Keep Markdown formatting valid\n- Update only the specified sections";
  }

  const instructions = updateInstructions 
    ? `\n\nUser's update instructions:\n${updateInstructions}`
    : '';

  return `Improve the following contents of the ${mediaType} based on the given prompt.
${specificGuidance}
${instructions}

Current content:
${currentContent}

Provide the updated version with improvements applied.`;
};

export const getPromptForArtifactType = (type: ArtifactKind): string => {
  switch (type) {
    case 'code':
      return codePrompt;
    case 'workflow':
      return workflowPrompt;
    case 'sheet':
      return sheetPrompt;
    case 'agent':
      return agentPrompt;
    case 'report':
      return reportPrompt;
    case 'document':
    default:
      return regularPrompt;
  }
};

// Context-aware prompt generation for our system
export const generateContextAwarePrompt = ({
  artifactType,
  userQuery,
  conversationHistory = [],
  availableTools = [],
  systemContext = {},
}: {
  artifactType: ArtifactKind;
  userQuery: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  availableTools?: string[];
  systemContext?: Record<string, any>;
}): string => {
  const basePrompt = getPromptForArtifactType(artifactType);
  
  const contextParts = [basePrompt];
  
  // Add conversation context
  if (conversationHistory.length > 0) {
    contextParts.push('\n## Conversation History');
    conversationHistory.slice(-3).forEach(msg => {
      contextParts.push(`${msg.role}: ${msg.content.substring(0, 200)}...`);
    });
  }
  
  // Add available tools
  if (availableTools.length > 0) {
    contextParts.push('\n## Available Tools');
    contextParts.push(availableTools.join(', '));
  }
  
  // Add system context
  if (Object.keys(systemContext).length > 0) {
    contextParts.push('\n## System Context');
    Object.entries(systemContext).forEach(([key, value]) => {
      contextParts.push(`- ${key}: ${value}`);
    });
  }
  
  // Add user query
  contextParts.push('\n## User Request');
  contextParts.push(userQuery);
  
  return contextParts.join('\n');
};

// Validation helpers for artifacts
export const validateArtifact = (content: string, type: ArtifactKind): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Content cannot be empty');
    return { valid: false, errors };
  }
  
  switch (type) {
    case 'code':
      // Check for code blocks
      if (!content.includes('```')) {
        errors.push('Code should be wrapped in code blocks (```)');
      }
      break;
      
    case 'workflow':
      // Check for valid JSON structure
      try {
        const workflow = JSON.parse(content);
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
          errors.push('Workflow must have a nodes array');
        }
        if (!workflow.edges || !Array.isArray(workflow.edges)) {
          errors.push('Workflow must have an edges array');
        }
      } catch (e) {
        errors.push('Workflow must be valid JSON');
      }
      break;
      
    case 'sheet':
      // Check for CSV format
      const lines = content.split('\n');
      if (lines.length < 2) {
        errors.push('Spreadsheet must have at least headers and one data row');
      }
      const headerColumns = lines[0].split(',').length;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() && lines[i].split(',').length !== headerColumns) {
          errors.push(`Row ${i + 1} has inconsistent number of columns`);
        }
      }
      break;
      
    case 'agent':
      // Check for valid agent configuration
      try {
        const agent = JSON.parse(content);
        if (!agent.name) {
          errors.push('Agent must have a name');
        }
        if (!agent.role) {
          errors.push('Agent must have a role');
        }
        if (!agent.systemPrompt) {
          errors.push('Agent must have a systemPrompt');
        }
      } catch (e) {
        errors.push('Agent configuration must be valid JSON');
      }
      break;
      
    case 'report':
      // Check for Markdown structure
      if (!content.includes('#')) {
        errors.push('Report should use Markdown headings (#)');
      }
      break;
  }
  
  return { valid: errors.length === 0, errors };
};

