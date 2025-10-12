/**
 * A2A Communication Engine - Bidirectional Agent-to-Agent Communication
 * 
 * Implements enterprise-grade A2A communication with:
 * - Bidirectional request-response patterns
 * - Message queue for async communication
 * - Shared state management (blackboard pattern)
 * - Structured message formats
 * - Correlation ID tracking
 * - Advanced prompting techniques (CoT, ReAct, Structured Output)
 * 
 * Based on curriculum: Advanced Prompting Techniques & Agentic Patterns
 */

export interface A2AMessage {
  id: string;
  correlationId: string;
  type: 'REQUEST' | 'RESPONSE' | 'INFORM' | 'QUERY';
  from: string;
  to: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number; // seconds
  metadata: {
    domain: string;
    requiresResponse: boolean;
    context: any;
  };
  payload: {
    instruction: string; // Chain of Thought prompt
    context: any; // Context Engineering
    expectedOutput?: any; // Structured Output schema
    tools?: string[]; // Available tools for ReAct
  };
  status: 'pending' | 'processing' | 'completed' | 'timeout' | 'error';
  response?: A2AResponse;
}

export interface A2AResponse {
  id: string;
  correlationId: string;
  reasoning: string; // Chain of Thought reasoning
  actions: string[]; // ReAct actions taken
  result: any; // Structured output
  confidence: number;
  timestamp: Date;
  metadata: {
    toolsUsed: string[];
    contextRetrieved: any;
    processingTime: number;
  };
}

export interface SharedState {
  id: string;
  key: string;
  value: any;
  timestamp: Date;
  updatedBy: string;
  version: number;
  metadata: {
    domain: string;
    accessLevel: 'read' | 'write' | 'admin';
  };
}

export interface AgentCapability {
  agentId: string;
  capabilities: string[];
  tools: string[];
  domain: string;
  maxConcurrency: number;
  currentLoad: number;
}

export class A2ACommunicationEngine {
  private messageQueue: Map<string, A2AMessage> = new Map();
  private responseQueue: Map<string, A2AResponse> = new Map();
  private sharedState: Map<string, SharedState> = new Map();
  private agentRegistry: Map<string, AgentCapability> = new Map();
  private activeConversations: Map<string, string[]> = new Map(); // correlationId -> messageIds

  /**
   * Send a request to another agent (Bidirectional A2A)
   */
  async sendRequest(params: {
    from: string;
    to: string;
    instruction: string;
    context?: any;
    expectedOutput?: any;
    tools?: string[];
    priority?: 'critical' | 'high' | 'medium' | 'low';
    timeout?: number;
    domain?: string;
  }): Promise<A2AResponse> {
    
    const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg_${correlationId}`;
    
    // Create structured message with advanced prompting
    const message: A2AMessage = {
      id: messageId,
      correlationId,
      type: 'REQUEST',
      from: params.from,
      to: params.to,
      timestamp: new Date(),
      priority: params.priority || 'medium',
      timeout: params.timeout || 300, // 5 minutes default
      metadata: {
        domain: params.domain || 'general',
        requiresResponse: true,
        context: params.context || {}
      },
      payload: {
        instruction: this.buildChainOfThoughtPrompt(params.instruction, params.context),
        context: params.context,
        expectedOutput: params.expectedOutput,
        tools: params.tools || []
      },
      status: 'pending'
    };

    // Store message in queue
    this.messageQueue.set(messageId, message);
    
    // Track conversation
    if (!this.activeConversations.has(correlationId)) {
      this.activeConversations.set(correlationId, []);
    }
    this.activeConversations.get(correlationId)!.push(messageId);

    console.log(`📤 A2A REQUEST: ${params.from} → ${params.to}`);
    console.log(`   Correlation ID: ${correlationId}`);
    console.log(`   Instruction: ${params.instruction}`);
    console.log(`   Priority: ${params.priority || 'medium'}`);

    // Process message by target agent
    const response = await this.processMessage(message);
    
    // Store response
    this.responseQueue.set(correlationId, response);
    message.response = response;
    message.status = 'completed';

    console.log(`📥 A2A RESPONSE: ${params.to} → ${params.from}`);
    console.log(`   Result:`, response.result);
    console.log(`   Confidence: ${response.confidence}`);

    return response;
  }

  /**
   * Send information to another agent (One-way communication)
   */
  async sendInformation(params: {
    from: string;
    to: string;
    data: any;
    domain?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }): Promise<void> {
    
    const correlationId = `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg_${correlationId}`;
    
    const message: A2AMessage = {
      id: messageId,
      correlationId,
      type: 'INFORM',
      from: params.from,
      to: params.to,
      timestamp: new Date(),
      priority: params.priority || 'medium',
      timeout: 0, // No timeout for informational messages
      metadata: {
        domain: params.domain || 'general',
        requiresResponse: false,
        context: {}
      },
      payload: {
        instruction: `Process and store this information: ${JSON.stringify(params.data)}`,
        context: { data: params.data },
        expectedOutput: { status: 'received' }
      },
      status: 'pending'
    };

    this.messageQueue.set(messageId, message);
    message.status = 'completed';

    console.log(`📢 A2A INFORM: ${params.from} → ${params.to}`);
    console.log(`   Data:`, params.data);
  }

  /**
   * Query another agent for specific information
   */
  async queryAgent(params: {
    from: string;
    to: string;
    query: string;
    context?: any;
    expectedOutput?: any;
    timeout?: number;
  }): Promise<A2AResponse> {
    
    const correlationId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg_${correlationId}`;
    
    const message: A2AMessage = {
      id: messageId,
      correlationId,
      type: 'QUERY',
      from: params.from,
      to: params.to,
      timestamp: new Date(),
      priority: 'high', // Queries are typically high priority
      timeout: params.timeout || 60, // 1 minute default
      metadata: {
        domain: 'query',
        requiresResponse: true,
        context: params.context || {}
      },
      payload: {
        instruction: this.buildQueryPrompt(params.query, params.context),
        context: params.context,
        expectedOutput: params.expectedOutput || { answer: 'string', confidence: 'number' }
      },
      status: 'pending'
    };

    this.messageQueue.set(messageId, message);
    
    if (!this.activeConversations.has(correlationId)) {
      this.activeConversations.set(correlationId, []);
    }
    this.activeConversations.get(correlationId)!.push(messageId);

    console.log(`❓ A2A QUERY: ${params.from} → ${params.to}`);
    console.log(`   Query: ${params.query}`);

    const response = await this.processMessage(message);
    this.responseQueue.set(correlationId, response);
    message.response = response;
    message.status = 'completed';

    console.log(`💡 A2A QUERY RESPONSE: ${params.to} → ${params.from}`);
    console.log(`   Answer:`, response.result);

    return response;
  }

  /**
   * Process message using ReAct pattern with Chain of Thought
   */
  private async processMessage(message: A2AMessage): Promise<A2AResponse> {
    const startTime = Date.now();
    message.status = 'processing';

    try {
      // Get agent capabilities
      const agentCapability = this.agentRegistry.get(message.to);
      if (!agentCapability) {
        throw new Error(`Agent ${message.to} not found in registry`);
      }

      console.log(`🧠 Processing message with ReAct pattern...`);
      console.log(`   Agent: ${message.to}`);
      console.log(`   Instruction: ${message.payload.instruction}`);

      // Simulate ReAct processing
      const reasoning = await this.performChainOfThought(message);
      const actions = await this.performReActActions(message, agentCapability);
      const result = await this.generateStructuredOutput(message, reasoning, actions);

      const processingTime = Date.now() - startTime;

      const response: A2AResponse = {
        id: `resp_${message.correlationId}`,
        correlationId: message.correlationId,
        reasoning,
        actions,
        result,
        confidence: this.calculateConfidence(reasoning, actions, result),
        timestamp: new Date(),
        metadata: {
          toolsUsed: actions,
          contextRetrieved: message.payload.context,
          processingTime
        }
      };

      return response;

    } catch (error: any) {
      console.error(`❌ A2A Processing Error:`, error);
      
      return {
        id: `resp_${message.correlationId}`,
        correlationId: message.correlationId,
        reasoning: `Error processing message: ${error.message}`,
        actions: [],
        result: { error: error.message },
        confidence: 0,
        timestamp: new Date(),
        metadata: {
          toolsUsed: [],
          contextRetrieved: message.payload.context,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Build Chain of Thought prompt
   */
  private buildChainOfThoughtPrompt(instruction: string, context?: any): string {
    return `Let's think step by step about this task.

INSTRUCTION: ${instruction}

CONTEXT: ${JSON.stringify(context || {})}

REASONING PROCESS:
1. First, let's understand what is being asked
2. Then, let's identify what information we need
3. Next, let's determine what actions we should take
4. Finally, let's execute and provide a structured response

Please provide your reasoning and then the final answer.`;
  }

  /**
   * Build query prompt for information requests
   */
  private buildQueryPrompt(query: string, context?: any): string {
    return `You are receiving a query from another agent. Please provide a clear, accurate response.

QUERY: ${query}

CONTEXT: ${JSON.stringify(context || {})}

Please:
1. Understand what information is being requested
2. Retrieve relevant information from your knowledge or context
3. Provide a structured response with your answer and confidence level

Format your response as JSON with fields: { "answer": "...", "confidence": 0.0-1.0, "reasoning": "..." }`;
  }

  /**
   * Perform Chain of Thought reasoning
   */
  private async performChainOfThought(message: A2AMessage): Promise<string> {
    // Simulate LLM reasoning process
    const reasoning = `I need to analyze this request step by step:

1. UNDERSTANDING: The request is asking me to ${message.payload.instruction}
2. CONTEXT ANALYSIS: I have the following context: ${JSON.stringify(message.payload.context)}
3. CAPABILITY CHECK: I can handle this using my ${message.to} capabilities
4. APPROACH: I'll use a systematic approach to provide a comprehensive response
5. VERIFICATION: I'll ensure my response meets the expected output format

This step-by-step approach will help me provide an accurate and useful response.`;

    return reasoning;
  }

  /**
   * Perform ReAct actions
   */
  private async performReActActions(message: A2AMessage, agentCapability: AgentCapability): Promise<string[]> {
    const actions: string[] = [];
    
    // Thought: Analyze what tools are needed
    actions.push('THOUGHT: Analyzing required tools and actions');
    
    // Action: Use available tools
    if (agentCapability.tools.length > 0) {
      const selectedTools = agentCapability.tools.slice(0, 2); // Use first 2 tools
      for (const tool of selectedTools) {
        actions.push(`ACTION: Using ${tool} to process the request`);
        actions.push(`OBSERVATION: ${tool} completed successfully`);
      }
    }
    
    // Action: Access shared state if needed
    if (message.payload.context && Object.keys(message.payload.context).length > 0) {
      actions.push('ACTION: Accessing shared state for additional context');
      actions.push('OBSERVATION: Retrieved relevant context from shared state');
    }
    
    // Action: Generate response
    actions.push('ACTION: Generating structured response based on analysis');
    actions.push('OBSERVATION: Response generated successfully');
    
    return actions;
  }

  /**
   * Generate structured output
   */
  private async generateStructuredOutput(
    message: A2AMessage, 
    reasoning: string, 
    actions: string[]
  ): Promise<any> {
    
    // If expected output schema is provided, use it
    if (message.payload.expectedOutput) {
      return {
        ...message.payload.expectedOutput,
        data: `Response to: ${message.payload.instruction}`,
        timestamp: new Date().toISOString(),
        reasoning: reasoning.split('\n')[0], // First line of reasoning
        actions: actions.length
      };
    }
    
    // Default structured output
    return {
      response: `Processed request: ${message.payload.instruction}`,
      status: 'completed',
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      metadata: {
        reasoningSteps: reasoning.split('\n').length,
        actionsTaken: actions.length,
        processingTime: 'simulated'
      }
    };
  }

  /**
   * Calculate confidence based on reasoning and actions
   */
  private calculateConfidence(reasoning: string, actions: string[], result: any): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on reasoning quality
    if (reasoning.includes('step by step')) confidence += 0.1;
    if (reasoning.includes('understanding')) confidence += 0.1;
    if (reasoning.includes('verification')) confidence += 0.1;
    
    // Increase confidence based on actions taken
    if (actions.length > 3) confidence += 0.1;
    if (actions.some(action => action.includes('OBSERVATION'))) confidence += 0.1;
    
    // Increase confidence if result is well-structured
    if (result && typeof result === 'object') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Shared State Management (Blackboard Pattern)
   */
  async updateSharedState(params: {
    key: string;
    value: any;
    updatedBy: string;
    domain?: string;
    accessLevel?: 'read' | 'write' | 'admin';
  }): Promise<void> {
    
    const existing = this.sharedState.get(params.key);
    const version = existing ? existing.version + 1 : 1;
    
    const state: SharedState = {
      id: `state_${params.key}_${Date.now()}`,
      key: params.key,
      value: params.value,
      timestamp: new Date(),
      updatedBy: params.updatedBy,
      version,
      metadata: {
        domain: params.domain || 'general',
        accessLevel: params.accessLevel || 'read'
      }
    };

    this.sharedState.set(params.key, state);
    
    console.log(`💾 SHARED STATE UPDATE: ${params.key}`);
    console.log(`   Updated by: ${params.updatedBy}`);
    console.log(`   Version: ${version}`);
    console.log(`   Value:`, params.value);
  }

  async getSharedState(key: string, requestedBy: string): Promise<any> {
    const state = this.sharedState.get(key);
    if (!state) {
      console.log(`⚠️ SHARED STATE MISSING: ${key} requested by ${requestedBy}`);
      return null;
    }

    console.log(`📖 SHARED STATE READ: ${key} by ${requestedBy}`);
    console.log(`   Version: ${state.version}`);
    console.log(`   Last updated: ${state.updatedBy}`);

    return state.value;
  }

  /**
   * Register agent capabilities
   */
  registerAgent(params: {
    agentId: string;
    capabilities: string[];
    tools: string[];
    domain: string;
    maxConcurrency?: number;
  }): void {
    
    const capability: AgentCapability = {
      agentId: params.agentId,
      capabilities: params.capabilities,
      tools: params.tools,
      domain: params.domain,
      maxConcurrency: params.maxConcurrency || 5,
      currentLoad: 0
    };

    this.agentRegistry.set(params.agentId, capability);
    
    console.log(`🤖 AGENT REGISTERED: ${params.agentId}`);
    console.log(`   Capabilities: ${params.capabilities.join(', ')}`);
    console.log(`   Tools: ${params.tools.join(', ')}`);
    console.log(`   Domain: ${params.domain}`);
  }

  /**
   * Get pending messages for an agent
   */
  getPendingMessages(agentId: string): A2AMessage[] {
    return Array.from(this.messageQueue.values())
      .filter(message => message.to === agentId && message.status === 'pending');
  }

  /**
   * Get conversation history
   */
  getConversationHistory(correlationId: string): { messages: A2AMessage[], responses: A2AResponse[] } {
    const messageIds = this.activeConversations.get(correlationId) || [];
    const messages = messageIds.map(id => this.messageQueue.get(id)).filter(Boolean) as A2AMessage[];
    const responses = messageIds.map(id => this.responseQueue.get(id)).filter(Boolean) as A2AResponse[];

    return { messages, responses };
  }

  /**
   * Get system status
   */
  getSystemStatus(): any {
    return {
      activeMessages: this.messageQueue.size,
      pendingMessages: Array.from(this.messageQueue.values()).filter(m => m.status === 'pending').length,
      activeConversations: this.activeConversations.size,
      registeredAgents: this.agentRegistry.size,
      sharedStateEntries: this.sharedState.size,
      systemHealth: 'operational'
    };
  }
}

// Global instance
export const a2aEngine = new A2ACommunicationEngine();
