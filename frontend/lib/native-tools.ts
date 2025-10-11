/**
 * Native Tool Calling System - Grok Principle #8
 * Use native function calling instead of XML-based tool outputs
 * 
 * Grok insight: Native tool calling performs better than XML-based
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

/**
 * Define tools in native OpenAI function calling format
 * Grok Principle #8: Better performance than XML
 */
export const NATIVE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'extract_entities',
      description: 'Extract people, projects, concepts, and organizations from text with relationships',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to extract entities from'
          },
          min_confidence: {
            type: 'number',
            description: 'Minimum confidence threshold (0-1), default 0.6'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_instant_answer',
      description: 'Query the knowledge graph for instant answers about people, projects, and their relationships',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The question to answer from the knowledge graph'
          },
          include_context: {
            type: 'boolean',
            description: 'Whether to include detailed context items in response'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'enrich_context',
      description: 'Enrich agent context with memory network, conversation history, and user preferences',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The user query to enrich context for'
          },
          sources: {
            type: 'array',
            description: 'Context sources to include',
            enum: ['memory_network', 'conversation_history', 'user_preferences', 'knowledge_graph', 'real_time_data']
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'smart_extract',
      description: 'Intelligently extract entities using Knowledge Graph (fast/free) or LangStruct (accurate/paid) based on complexity',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to extract entities from'
          },
          prefer_speed: {
            type: 'boolean',
            description: 'Prefer Knowledge Graph (fast, free)'
          },
          prefer_accuracy: {
            type: 'boolean',
            description: 'Prefer LangStruct (slower, costs $$, more accurate)'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information using Perplexity AI',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          recency: {
            type: 'string',
            description: 'Time filter for results',
            enum: ['day', 'week', 'month', 'year', 'all']
          }
        },
        required: ['query']
      }
    }
  }
];

/**
 * Execute a tool call and return result in native format
 */
export async function executeToolCall(toolCall: ToolCall, userId: string): Promise<ToolResult> {
  const { name, arguments: argsString } = toolCall.function;
  const args = JSON.parse(argsString);

  let result: any;

  try {
    switch (name) {
      case 'extract_entities':
        const extractResponse = await fetch('/api/entities/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: args.text,
            userId,
            options: { minConfidence: args.min_confidence || 0.6 }
          })
        });
        result = await extractResponse.json();
        break;

      case 'get_instant_answer':
        const answerResponse = await fetch('/api/instant-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: args.query,
            userId,
            includeContext: args.include_context ?? true
          })
        });
        result = await answerResponse.json();
        break;

      case 'enrich_context':
        const contextResponse = await fetch('/api/context/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: args.query,
            userId,
            includeSources: args.sources || ['memory_network', 'conversation_history']
          })
        });
        result = await contextResponse.json();
        break;

      case 'smart_extract':
        const smartResponse = await fetch('/api/smart-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: args.text,
            userId,
            options: {
              preferSpeed: args.prefer_speed,
              preferAccuracy: args.prefer_accuracy,
              autoDetect: !args.prefer_speed && !args.prefer_accuracy
            }
          })
        });
        result = await smartResponse.json();
        break;

      case 'web_search':
        const searchResponse = await fetch('/api/perplexity/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: args.query }],
            recency: args.recency || 'month'
          })
        });
        result = await searchResponse.json();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name,
      content: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name,
      content: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Format messages for LLM with tool calling support
 * Native JSON format (not XML)
 */
export function formatMessagesWithTools(
  messages: Array<{ role: string; content: string }>,
  toolResults?: ToolResult[]
): Array<any> {
  const formatted = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add tool results if any
  if (toolResults && toolResults.length > 0) {
    formatted.push(...toolResults);
  }

  return formatted;
}

/**
 * Get tool by name
 */
export function getToolDefinition(toolName: string): ToolDefinition | undefined {
  return NATIVE_TOOLS.find(t => t.function.name === toolName);
}

/**
 * Get all available tools
 */
export function getAllTools(): ToolDefinition[] {
  return NATIVE_TOOLS;
}

