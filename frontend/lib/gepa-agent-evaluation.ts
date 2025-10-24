/**
 * GEPA Agent Evaluation Framework
 *
 * Evaluates AI agents across multiple dimensions beyond just "success":
 * - Tool calling correctness (right tools, right order)
 * - Procedural compliance (healthcare workflows, safety protocols)
 * - Tool call quality (parameters, context usage)
 * - Behavior in ambiguous situations
 *
 * Uses GEPA to optimize prompts across these multi-dimensional criteria.
 */

// ============================================================================
// Agent Evaluation Dimensions
// ============================================================================

export interface AgentEvaluationMetrics {
  // Basic success
  taskCompleted: boolean;
  correctOutput: boolean;

  // Tool calling evaluation
  toolsInvoked: string[];                    // Which tools were called
  correctToolsUsed: boolean;                 // Were the RIGHT tools chosen?
  toolSequenceCorrect: boolean;              // Correct order? (critical in healthcare)
  unnecessaryToolCalls: number;              // Efficiency metric
  missedRequiredTools: string[];             // Safety critical tools not called

  // Tool call quality
  toolCallQuality: ToolCallQuality[];        // Per-call quality scores
  averageToolCallQuality: number;            // 0-1 score
  parameterCorrectness: number;              // Were tool parameters correct?
  contextUtilization: number;                // How well did it use available context?

  // Procedural compliance (domain-specific)
  procedureSteps: ProcedureStep[];           // Expected steps in workflow
  procedureCompliance: number;               // 0-1 score of compliance
  safetyProtocolsFollowed: boolean;          // Critical for healthcare/finance
  regulatoryCompliance: number;              // 0-1 score for regulated industries

  // Ambiguity handling
  ambiguousInputHandling: number;            // How well it handled unclear requests
  clarificationRequests: number;             // Did it ask for clarification when needed?
  assumptionsMade: string[];                 // What assumptions did it make?
  assumptionsJustified: boolean;             // Were assumptions reasonable?

  // Efficiency
  totalSteps: number;
  minimalSteps: number;                      // Optimal path length
  efficiencyRatio: number;                   // minimal / total
  latency: number;
  cost: number;
}

export interface ToolCallQuality {
  toolName: string;
  callIndex: number;

  // Quality dimensions
  correctTool: boolean;                      // Was this the right tool for the situation?
  correctTiming: boolean;                    // Called at the right time in sequence?
  parametersValid: boolean;                  // Parameters syntactically valid?
  parametersOptimal: boolean;                // Parameters semantically optimal?
  contextAware: boolean;                     // Did it use relevant context?

  // Scoring
  qualityScore: number;                      // 0-1 overall quality
  issues: string[];                          // List of problems
}

export interface ProcedureStep {
  stepNumber: number;
  description: string;
  required: boolean;                         // Must be done
  prerequisiteSteps: number[];               // Must happen AFTER these steps
  toolsRequired: string[];                   // Which tools should be used
  completed: boolean;
  completedCorrectly: boolean;
  completionOrder: number;                   // When was it actually done?
}

// ============================================================================
// Domain-Specific Procedure Templates
// ============================================================================

/**
 * Healthcare Agent Procedure Example
 *
 * Order matters! Patient safety critical.
 */
export const HEALTHCARE_DIAGNOSIS_PROCEDURE: ProcedureStep[] = [
  {
    stepNumber: 1,
    description: 'Collect patient symptoms and medical history',
    required: true,
    prerequisiteSteps: [],
    toolsRequired: ['get_patient_history', 'get_current_symptoms'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 2,
    description: 'Check for drug allergies and contraindications',
    required: true,
    prerequisiteSteps: [1],
    toolsRequired: ['check_allergies', 'check_contraindications'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 3,
    description: 'Review relevant medical literature',
    required: true,
    prerequisiteSteps: [1],
    toolsRequired: ['search_medical_literature'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 4,
    description: 'Generate differential diagnosis',
    required: true,
    prerequisiteSteps: [1, 2, 3],
    toolsRequired: ['generate_differential_diagnosis'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 5,
    description: 'Recommend diagnostic tests',
    required: true,
    prerequisiteSteps: [4],
    toolsRequired: ['recommend_tests'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 6,
    description: 'CRITICAL: Verify safety before treatment recommendation',
    required: true,
    prerequisiteSteps: [2, 4, 5],
    toolsRequired: ['verify_safety_protocol'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 7,
    description: 'Provide treatment recommendation',
    required: true,
    prerequisiteSteps: [6], // MUST verify safety first
    toolsRequired: ['recommend_treatment'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  }
];

/**
 * Financial Compliance Procedure Example
 */
export const FINANCIAL_TRADE_PROCEDURE: ProcedureStep[] = [
  {
    stepNumber: 1,
    description: 'Verify user identity and authorization',
    required: true,
    prerequisiteSteps: [],
    toolsRequired: ['verify_identity', 'check_authorization'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 2,
    description: 'Check for insider trading restrictions',
    required: true,
    prerequisiteSteps: [1],
    toolsRequired: ['check_insider_restrictions'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 3,
    description: 'Validate trade against position limits',
    required: true,
    prerequisiteSteps: [1],
    toolsRequired: ['check_position_limits'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 4,
    description: 'Check for market manipulation patterns',
    required: true,
    prerequisiteSteps: [1],
    toolsRequired: ['detect_market_manipulation'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 5,
    description: 'Execute trade if all checks pass',
    required: true,
    prerequisiteSteps: [2, 3, 4],
    toolsRequired: ['execute_trade'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  },
  {
    stepNumber: 6,
    description: 'Log transaction for audit trail',
    required: true,
    prerequisiteSteps: [5],
    toolsRequired: ['log_transaction'],
    completed: false,
    completedCorrectly: false,
    completionOrder: -1
  }
];

// ============================================================================
// Agent Execution Trace
// ============================================================================

export interface AgentExecutionTrace {
  agentId: string;
  taskId: string;
  timestamp: Date;

  input: {
    query: string;
    context: Record<string, any>;
    domain: string;
    ambiguityLevel: number; // 0-1, how ambiguous was the input?
  };

  execution: {
    toolCalls: ToolCall[];
    reasoning: string[];        // Agent's internal reasoning at each step
    assumptions: string[];      // Explicit assumptions made
    clarifications: string[];   // Questions asked to user
  };

  output: {
    result: any;
    confidence: number;
    warnings: string[];
    recommendations: string[];
  };

  evaluation?: AgentEvaluationMetrics;
}

export interface ToolCall {
  index: number;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: Date;
  reasoning: string;           // Why this tool was called
  result?: any;
  error?: string;
  latency?: number;
}

// ============================================================================
// Agent Evaluator
// ============================================================================

export class AgentEvaluator {

  /**
   * Evaluate an agent execution trace across all quality dimensions
   */
  evaluateAgentExecution(
    trace: AgentExecutionTrace,
    expectedProcedure: ProcedureStep[],
    options?: {
      domain?: string;
      strictComplianceRequired?: boolean;
      allowedAssumptions?: string[];
    }
  ): AgentEvaluationMetrics {

    // Clone procedure to track completion
    const procedure = JSON.parse(JSON.stringify(expectedProcedure)) as ProcedureStep[];

    // Evaluate basic success
    const taskCompleted = trace.output.result !== null && trace.output.result !== undefined;
    const correctOutput = this.validateOutput(trace.output.result, trace.input);

    // Evaluate tool calling
    const toolsInvoked = trace.execution.toolCalls.map(tc => tc.toolName);
    const requiredTools = new Set(procedure.flatMap(step => step.toolsRequired));
    const correctToolsUsed = this.checkCorrectTools(toolsInvoked, Array.from(requiredTools));

    // Evaluate tool sequence
    const toolSequenceCorrect = this.validateToolSequence(
      trace.execution.toolCalls,
      procedure
    );

    // Evaluate each tool call
    const toolCallQuality = trace.execution.toolCalls.map((tc, idx) =>
      this.evaluateToolCall(tc, procedure, trace.input.context)
    );

    const averageToolCallQuality = toolCallQuality.length > 0
      ? toolCallQuality.reduce((sum, tcq) => sum + tcq.qualityScore, 0) / toolCallQuality.length
      : 0;

    // Evaluate procedural compliance
    const procedureCompliance = this.evaluateProcedureCompliance(
      trace.execution.toolCalls,
      procedure
    );

    // Safety protocols
    const safetyProtocolsFollowed = this.checkSafetyProtocols(
      trace.execution.toolCalls,
      procedure
    );

    // Ambiguity handling
    const ambiguousInputHandling = this.evaluateAmbiguityHandling(trace);

    // Efficiency
    const minimalSteps = this.calculateMinimalSteps(procedure);
    const efficiencyRatio = minimalSteps / trace.execution.toolCalls.length;

    // Assumptions evaluation
    const assumptionsJustified = this.validateAssumptions(
      trace.execution.assumptions,
      options?.allowedAssumptions
    );

    return {
      taskCompleted,
      correctOutput,

      toolsInvoked,
      correctToolsUsed,
      toolSequenceCorrect,
      unnecessaryToolCalls: Math.max(0, trace.execution.toolCalls.length - minimalSteps),
      missedRequiredTools: this.findMissedTools(toolsInvoked, Array.from(requiredTools)),

      toolCallQuality,
      averageToolCallQuality,
      parameterCorrectness: this.evaluateParameterCorrectness(trace.execution.toolCalls),
      contextUtilization: this.evaluateContextUtilization(trace.execution.toolCalls, trace.input.context),

      procedureSteps: procedure,
      procedureCompliance,
      safetyProtocolsFollowed,
      regulatoryCompliance: safetyProtocolsFollowed && procedureCompliance > 0.9 ? 1.0 : 0.0,

      ambiguousInputHandling,
      clarificationRequests: trace.execution.clarifications.length,
      assumptionsMade: trace.execution.assumptions,
      assumptionsJustified,

      totalSteps: trace.execution.toolCalls.length,
      minimalSteps,
      efficiencyRatio,
      latency: this.calculateTotalLatency(trace.execution.toolCalls),
      cost: this.calculateTotalCost(trace.execution.toolCalls)
    };
  }

  /**
   * Validate tool sequence against required procedure
   *
   * Critical for healthcare/finance where order matters!
   */
  private validateToolSequence(
    toolCalls: ToolCall[],
    procedure: ProcedureStep[]
  ): boolean {

    // Map tool calls to procedure steps
    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i];

      // Find the procedure step this tool call belongs to
      const step = procedure.find(s => s.toolsRequired.includes(tc.toolName));
      if (!step) continue;

      step.completed = true;
      step.completionOrder = i;

      // Check if prerequisites were completed BEFORE this step
      for (const prereqStepNum of step.prerequisiteSteps) {
        const prereqStep = procedure.find(s => s.stepNumber === prereqStepNum);
        if (!prereqStep) continue;

        // Prerequisite must be completed AND before current step
        if (!prereqStep.completed || prereqStep.completionOrder > i) {
          step.completedCorrectly = false;
          return false; // Sequence violation!
        }
      }

      step.completedCorrectly = true;
    }

    // All required steps must be completed correctly
    return procedure
      .filter(s => s.required)
      .every(s => s.completed && s.completedCorrectly);
  }

  /**
   * Evaluate individual tool call quality
   */
  private evaluateToolCall(
    toolCall: ToolCall,
    procedure: ProcedureStep[],
    context: Record<string, any>
  ): ToolCallQuality {

    const issues: string[] = [];

    // Find the procedure step this belongs to
    const step = procedure.find(s => s.toolsRequired.includes(toolCall.toolName));
    const correctTool = step !== undefined;
    if (!correctTool) {
      issues.push(`Tool '${toolCall.toolName}' not in required procedure`);
    }

    // Check timing (were prerequisites completed?)
    let correctTiming = true;
    if (step) {
      for (const prereqStepNum of step.prerequisiteSteps) {
        const prereqStep = procedure.find(s => s.stepNumber === prereqStepNum);
        if (prereqStep && (!prereqStep.completed || prereqStep.completionOrder > toolCall.index)) {
          correctTiming = false;
          issues.push(`Called before prerequisite step ${prereqStepNum} was completed`);
        }
      }
    }

    // Validate parameters (basic check)
    const parametersValid = Object.keys(toolCall.parameters).length > 0;
    if (!parametersValid) {
      issues.push('Missing required parameters');
    }

    // Check if it used available context
    const contextAware = this.checkContextUsage(toolCall.parameters, context);
    if (!contextAware) {
      issues.push('Did not utilize available context');
    }

    // Overall quality score
    const qualityScore = [
      correctTool ? 0.3 : 0,
      correctTiming ? 0.3 : 0,
      parametersValid ? 0.2 : 0,
      contextAware ? 0.2 : 0
    ].reduce((a, b) => a + b, 0);

    return {
      toolName: toolCall.toolName,
      callIndex: toolCall.index,
      correctTool,
      correctTiming,
      parametersValid,
      parametersOptimal: parametersValid && contextAware,
      contextAware,
      qualityScore,
      issues
    };
  }

  /**
   * Evaluate how well the agent handled ambiguous input
   */
  private evaluateAmbiguityHandling(trace: AgentExecutionTrace): number {
    const ambiguityLevel = trace.input.ambiguityLevel;

    // If input was clear (low ambiguity), should NOT ask many clarifications
    if (ambiguityLevel < 0.3) {
      return trace.execution.clarifications.length === 0 ? 1.0 : 0.5;
    }

    // If input was ambiguous, SHOULD ask clarifications or make justified assumptions
    if (ambiguityLevel > 0.7) {
      const askedClarifications = trace.execution.clarifications.length > 0;
      const madeAssumptions = trace.execution.assumptions.length > 0;

      if (askedClarifications) return 1.0; // Best: asked for clarification
      if (madeAssumptions) return 0.7;     // Acceptable: made assumptions
      return 0.3;                          // Poor: didn't handle ambiguity
    }

    // Medium ambiguity: flexible scoring
    return 0.7;
  }

  /**
   * Check if safety-critical steps were followed
   */
  private checkSafetyProtocols(
    toolCalls: ToolCall[],
    procedure: ProcedureStep[]
  ): boolean {
    // Find safety-critical steps (those with "safety", "verify", "check" in description)
    const safetySteps = procedure.filter(step =>
      step.description.toLowerCase().includes('safety') ||
      step.description.toLowerCase().includes('verify') ||
      step.description.toLowerCase().includes('check')
    );

    // All safety steps must be completed correctly
    return safetySteps.every(step => step.completed && step.completedCorrectly);
  }

  // Helper methods
  private validateOutput(output: any, input: any): boolean {
    // Placeholder - would implement domain-specific validation
    return output !== null && output !== undefined;
  }

  private checkCorrectTools(used: string[], required: string[]): boolean {
    return required.every(tool => used.includes(tool));
  }

  private findMissedTools(used: string[], required: string[]): string[] {
    return required.filter(tool => !used.includes(tool));
  }

  private evaluateProcedureCompliance(
    toolCalls: ToolCall[],
    procedure: ProcedureStep[]
  ): number {
    const requiredSteps = procedure.filter(s => s.required);
    const completedCorrectly = requiredSteps.filter(s => s.completedCorrectly);
    return completedCorrectly.length / requiredSteps.length;
  }

  private calculateMinimalSteps(procedure: ProcedureStep[]): number {
    return procedure.filter(s => s.required).length;
  }

  private evaluateParameterCorrectness(toolCalls: ToolCall[]): number {
    // Placeholder - would implement parameter validation
    return 0.8;
  }

  private evaluateContextUtilization(toolCalls: ToolCall[], context: Record<string, any>): number {
    // Placeholder - would check if context was used in tool calls
    return 0.7;
  }

  private checkContextUsage(parameters: Record<string, any>, context: Record<string, any>): boolean {
    // Check if any parameter values came from context
    const paramValues = new Set(Object.values(parameters).map(String));
    const contextValues = new Set(Object.values(context).map(String));

    return [...paramValues].some(pv => [...contextValues].some(cv => pv.includes(cv)));
  }

  private validateAssumptions(assumptions: string[], allowed?: string[]): boolean {
    if (!allowed) return assumptions.length === 0;
    return assumptions.every(a => allowed.some(allowed => a.includes(allowed)));
  }

  private calculateTotalLatency(toolCalls: ToolCall[]): number {
    return toolCalls.reduce((sum, tc) => sum + (tc.latency || 0), 0);
  }

  private calculateTotalCost(toolCalls: ToolCall[]): number {
    // Placeholder cost calculation
    return toolCalls.length * 0.01;
  }
}

// ============================================================================
// GEPA Integration: Optimize Prompts for Multi-Dimensional Agent Quality
// ============================================================================

/**
 * Use GEPA to find prompts that optimize across ALL agent evaluation dimensions:
 * - Task success
 * - Tool calling correctness
 * - Procedural compliance
 * - Safety protocols
 * - Ambiguity handling
 * - Efficiency
 *
 * This is MORE complex than simple "success/failure" optimization!
 */
export interface AgentPromptFitness {
  // Traditional metrics
  taskSuccessRate: number;
  outputCorrectness: number;

  // Tool calling metrics
  toolCallCorrectness: number;
  toolSequenceCompliance: number;
  toolCallQuality: number;

  // Procedural compliance
  procedureCompliance: number;
  safetyProtocolAdherence: number;
  regulatoryCompliance: number;

  // Behavioral quality
  ambiguityHandling: number;
  appropriateClarifications: number;
  assumptionQuality: number;

  // Efficiency
  stepEfficiency: number;
  costEfficiency: number;
  latencyEfficiency: number;

  // Domain-specific (can be added)
  [key: string]: number;
}

/**
 * Evaluate a prompt across multiple agent test scenarios
 */
export async function evaluatePromptForAgent(
  prompt: string,
  testScenarios: AgentTestScenario[],
  evaluator: AgentEvaluator
): Promise<AgentPromptFitness> {

  const results: AgentEvaluationMetrics[] = [];

  for (const scenario of testScenarios) {
    // Run agent with this prompt
    const trace = await runAgentWithPrompt(prompt, scenario);

    // Evaluate execution
    const metrics = evaluator.evaluateAgentExecution(
      trace,
      scenario.expectedProcedure,
      scenario.options
    );

    results.push(metrics);
  }

  // Aggregate metrics
  return {
    taskSuccessRate: avg(results.map(r => r.taskCompleted ? 1 : 0)),
    outputCorrectness: avg(results.map(r => r.correctOutput ? 1 : 0)),

    toolCallCorrectness: avg(results.map(r => r.correctToolsUsed ? 1 : 0)),
    toolSequenceCompliance: avg(results.map(r => r.toolSequenceCorrect ? 1 : 0)),
    toolCallQuality: avg(results.map(r => r.averageToolCallQuality)),

    procedureCompliance: avg(results.map(r => r.procedureCompliance)),
    safetyProtocolAdherence: avg(results.map(r => r.safetyProtocolsFollowed ? 1 : 0)),
    regulatoryCompliance: avg(results.map(r => r.regulatoryCompliance)),

    ambiguityHandling: avg(results.map(r => r.ambiguousInputHandling)),
    appropriateClarifications: avg(results.map(r => r.clarificationRequests > 0 ? 1 : 0)),
    assumptionQuality: avg(results.map(r => r.assumptionsJustified ? 1 : 0)),

    stepEfficiency: avg(results.map(r => r.efficiencyRatio)),
    costEfficiency: 1.0 - (avg(results.map(r => r.cost)) / 1.0), // Normalize to 0-1
    latencyEfficiency: 1.0 - (avg(results.map(r => r.latency)) / 10000) // Normalize
  };
}

// Helper types
export interface AgentTestScenario {
  id: string;
  input: string;
  context: Record<string, any>;
  expectedProcedure: ProcedureStep[];
  ambiguityLevel: number;
  options?: {
    domain?: string;
    strictComplianceRequired?: boolean;
    allowedAssumptions?: string[];
  };
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Placeholder for agent execution
async function runAgentWithPrompt(
  prompt: string,
  scenario: AgentTestScenario
): Promise<AgentExecutionTrace> {
  // This would actually run your agent system
  return {
    agentId: 'test-agent',
    taskId: scenario.id,
    timestamp: new Date(),
    input: {
      query: scenario.input,
      context: scenario.context,
      domain: scenario.options?.domain || 'general',
      ambiguityLevel: scenario.ambiguityLevel
    },
    execution: {
      toolCalls: [],
      reasoning: [],
      assumptions: [],
      clarifications: []
    },
    output: {
      result: null,
      confidence: 0,
      warnings: [],
      recommendations: []
    }
  };
}
