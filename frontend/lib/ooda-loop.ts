/**
 * OODA Loop Implementation
 * 
 * Observe, Orient, Decide, Act - Decision cycle for adaptive agents
 * 
 * Based on John Boyd's OODA loop concept for fighter pilots:
 * 1. Observe: Gather information about current state
 * 2. Orient: Process and understand information in context
 * 3. Decide: Choose a course of action
 * 4. Act: Execute the decision
 * 5. Loop back to Observe (observe consequences of actions)
 * 
 * This loop typically plays out over a few seconds as the agent:
 * - Observes new information
 * - Orients towards the new environment
 * - Makes a decision on how to respond
 * - Acts on that decision
 * - Observes again (both consequences of own actions and environmental changes)
 */

export interface OODAState {
  cycleId: string;
  agentId: string;
  timestamp: Date;
  
  // Observe phase
  observation: {
    rawData: any;
    processedData: any;
    sources: string[];
    confidence: number;
    timestamp: Date;
  };
  
  // Orient phase
  orientation: {
    context: any;
    patterns: string[];
    threats: string[];
    opportunities: string[];
    mentalModel: any;
    confidence: number;
    timestamp: Date;
  };
  
  // Decide phase
  decision: {
    options: DecisionOption[];
    selectedOption: DecisionOption | null;
    reasoning: string;
    confidence: number;
    timestamp: Date;
  };
  
  // Act phase
  action: {
    type: string;
    parameters: any;
    executed: boolean;
    result: any;
    timestamp: Date;
  };
  
  // Loop metadata
  iteration: number;
  previousCycleId?: string;
  nextCycleId?: string;
  terminated: boolean;
  terminationReason?: string;
}

export interface DecisionOption {
  id: string;
  description: string;
  expectedOutcome: string;
  confidence: number;
  risk: number;
  cost: number;
  priority: number;
}

export interface OODAConfig {
  agentId: string;
  maxIterations?: number;
  observationTimeout?: number;
  orientationTimeout?: number;
  decisionTimeout?: number;
  actionTimeout?: number;
  convergenceThreshold?: number;
  enableAdaptation?: boolean;
}

export type ObservationFn = (state: OODAState) => Promise<any>;
export type OrientationFn = (observation: any, previousState?: OODAState) => Promise<any>;
export type DecisionFn = (orientation: any, previousState?: OODAState) => Promise<DecisionOption | { selectedOption: DecisionOption; options?: DecisionOption[]; reasoning?: string }>;
export type ActionFn = (decision: DecisionOption, state: OODAState) => Promise<any>;

/**
 * OODA Loop Engine
 * 
 * Executes the Observe-Orient-Decide-Act cycle for adaptive agents
 */
export class OODALoop {
  private config: Required<OODAConfig>;
  private stateHistory: OODAState[] = [];
  private observationFn: ObservationFn;
  private orientationFn: OrientationFn;
  private decisionFn: DecisionFn;
  private actionFn: ActionFn;

  constructor(
    config: OODAConfig,
    observationFn: ObservationFn,
    orientationFn: OrientationFn,
    decisionFn: DecisionFn,
    actionFn: ActionFn
  ) {
    this.config = {
      agentId: config.agentId,
      maxIterations: config.maxIterations || 10,
      observationTimeout: config.observationTimeout || 30000,
      orientationTimeout: config.orientationTimeout || 30000,
      decisionTimeout: config.decisionTimeout || 30000,
      actionTimeout: config.actionTimeout || 60000,
      convergenceThreshold: config.convergenceThreshold || 0.95,
      enableAdaptation: config.enableAdaptation ?? true
    };

    this.observationFn = observationFn;
    this.orientationFn = orientationFn;
    this.decisionFn = decisionFn;
    this.actionFn = actionFn;
  }

  /**
   * Execute a single OODA cycle
   */
  async executeCycle(previousState?: OODAState): Promise<OODAState> {
    const cycleId = `cycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const iteration = previousState ? previousState.iteration + 1 : 0;

    console.log(`\n🔄 OODA Cycle ${iteration + 1} (${cycleId})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const state: OODAState = {
      cycleId,
      agentId: this.config.agentId,
      timestamp: new Date(),
      observation: {
        rawData: null,
        processedData: null,
        sources: [],
        confidence: 0,
        timestamp: new Date()
      },
      orientation: {
        context: null,
        patterns: [],
        threats: [],
        opportunities: [],
        mentalModel: null,
        confidence: 0,
        timestamp: new Date()
      },
      decision: {
        options: [],
        selectedOption: null,
        reasoning: '',
        confidence: 0,
        timestamp: new Date()
      },
      action: {
        type: '',
        parameters: {},
        executed: false,
        result: null,
        timestamp: new Date()
      },
      iteration,
      previousCycleId: previousState?.cycleId,
      terminated: false
    };

    try {
      // OBSERVE: Gather information about current state
      console.log('👁️  OBSERVE: Gathering information...');
      const observationStart = Date.now();
      const observation = await Promise.race([
        this.observationFn(state),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Observation timeout')), this.config.observationTimeout)
        )
      ]) as any;
      
      state.observation = {
        rawData: observation.rawData || observation,
        processedData: observation.processedData || observation,
        sources: observation.sources || [],
        confidence: observation.confidence || 0.8,
        timestamp: new Date()
      };
      
      const observationTime = Date.now() - observationStart;
      console.log(`   ✅ Observed in ${observationTime}ms`);
      console.log(`   📊 Sources: ${state.observation.sources.length}`);
      console.log(`   🎯 Confidence: ${(state.observation.confidence * 100).toFixed(0)}%`);

      // ORIENT: Process and understand information in context
      console.log('\n🧭 ORIENT: Processing information in context...');
      const orientationStart = Date.now();
      const orientation = await Promise.race([
        this.orientationFn(state.observation, previousState),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Orientation timeout')), this.config.orientationTimeout)
        )
      ]) as any;
      
      state.orientation = {
        context: orientation.context || orientation,
        patterns: orientation.patterns || [],
        threats: orientation.threats || [],
        opportunities: orientation.opportunities || [],
        mentalModel: orientation.mentalModel || orientation,
        confidence: orientation.confidence || 0.8,
        timestamp: new Date()
      };
      
      const orientationTime = Date.now() - orientationStart;
      console.log(`   ✅ Oriented in ${orientationTime}ms`);
      console.log(`   🔍 Patterns detected: ${state.orientation.patterns.length}`);
      console.log(`   ⚠️  Threats: ${state.orientation.threats.length}`);
      console.log(`   💡 Opportunities: ${state.orientation.opportunities.length}`);
      console.log(`   🎯 Confidence: ${(state.orientation.confidence * 100).toFixed(0)}%`);

      // DECIDE: Choose a course of action
      console.log('\n🎯 DECIDE: Choosing course of action...');
      const decisionStart = Date.now();
      const decisionResult = await Promise.race([
        this.decisionFn(state.orientation, previousState),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Decision timeout')), this.config.decisionTimeout)
        )
      ]) as DecisionOption | { selectedOption: DecisionOption; options?: DecisionOption[]; reasoning?: string };
      
      // Handle both single DecisionOption and object with selectedOption
      const selectedOption = 'selectedOption' in decisionResult ? decisionResult.selectedOption : decisionResult;
      const options = 'options' in decisionResult && decisionResult.options ? decisionResult.options : [selectedOption];
      const reasoning = 'reasoning' in decisionResult && decisionResult.reasoning ? decisionResult.reasoning : `Selected option: ${selectedOption.description}`;
      
      state.decision = {
        options,
        selectedOption,
        reasoning,
        confidence: selectedOption.confidence || 0.8,
        timestamp: new Date()
      };
      
      const decisionTime = Date.now() - decisionStart;
      console.log(`   ✅ Decided in ${decisionTime}ms`);
      console.log(`   📋 Options considered: ${state.decision.options.length}`);
      console.log(`   ✅ Selected: ${state.decision.selectedOption?.description}`);
      console.log(`   🎯 Confidence: ${(state.decision.confidence * 100).toFixed(0)}%`);
      console.log(`   💭 Reasoning: ${state.decision.reasoning.substring(0, 100)}...`);

      // ACT: Execute the decision
      console.log('\n⚡ ACT: Executing decision...');
      const actionStart = Date.now();
      const actionResult = await Promise.race([
        this.actionFn(state.decision.selectedOption!, state),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Action timeout')), this.config.actionTimeout)
        )
      ]);
      
      state.action = {
        type: 'execute',
        parameters: state.decision.selectedOption || {},
        executed: true,
        result: actionResult,
        timestamp: new Date()
      };
      
      const actionTime = Date.now() - actionStart;
      console.log(`   ✅ Acted in ${actionTime}ms`);
      console.log(`   📊 Result: ${JSON.stringify(actionResult).substring(0, 100)}...`);

      const totalTime = Date.now() - observationStart;
      console.log(`\n⏱️  Total cycle time: ${totalTime}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      this.stateHistory.push(state);
      return state;

    } catch (error) {
      console.error(`❌ OODA cycle failed:`, error);
      state.terminated = true;
      state.terminationReason = error instanceof Error ? error.message : 'Unknown error';
      this.stateHistory.push(state);
      throw error;
    }
  }

  /**
   * Execute OODA loop until termination condition
   */
  async executeLoop(initialObservation?: any): Promise<OODAState[]> {
    console.log(`🚀 Starting OODA Loop for agent: ${this.config.agentId}`);
    console.log(`   Max iterations: ${this.config.maxIterations}`);
    console.log(`   Convergence threshold: ${this.config.convergenceThreshold}`);
    console.log('');

    const cycles: OODAState[] = [];
    let previousState: OODAState | undefined;

    // If initial observation provided, create initial state
    if (initialObservation) {
      const initialState: Partial<OODAState> = {
        cycleId: 'initial',
        agentId: this.config.agentId,
        timestamp: new Date(),
        observation: {
          rawData: initialObservation,
          processedData: initialObservation,
          sources: [],
          confidence: 1.0,
          timestamp: new Date()
        },
        iteration: -1,
        terminated: false
      };
      previousState = initialState as OODAState;
    }

    for (let i = 0; i < this.config.maxIterations; i++) {
      try {
        const state = await this.executeCycle(previousState);
        cycles.push(state);
        previousState = state;

        // Check termination conditions
        if (state.terminated) {
          console.log(`🛑 Loop terminated: ${state.terminationReason}`);
          break;
        }

        // Check convergence (if enabled)
        if (this.config.enableAdaptation && cycles.length > 1) {
          const convergence = this.calculateConvergence(cycles);
          if (convergence >= this.config.convergenceThreshold) {
            console.log(`✅ Loop converged (${(convergence * 100).toFixed(0)}%)`);
            break;
          }
        }

        // Small delay between cycles (simulate real-time processing)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Loop failed at iteration ${i + 1}:`, error);
        break;
      }
    }

    console.log(`\n🏁 OODA Loop Complete`);
    console.log(`   Total cycles: ${cycles.length}`);
    console.log(`   Total time: ${cycles.reduce((sum, c) => {
      const cycleTime = c.action.timestamp.getTime() - c.observation.timestamp.getTime();
      return sum + cycleTime;
    }, 0)}ms`);
    console.log('');

    return cycles;
  }

  /**
   * Calculate convergence between cycles
   */
  private calculateConvergence(cycles: OODAState[]): number {
    if (cycles.length < 2) return 0;

    const last = cycles[cycles.length - 1];
    const previous = cycles[cycles.length - 2];

    // Compare decision confidence and action results
    const decisionSimilarity = Math.abs(last.decision.confidence - previous.decision.confidence);
    const actionSimilarity = JSON.stringify(last.action.result) === JSON.stringify(previous.action.result) ? 1 : 0;

    return (1 - decisionSimilarity) * 0.5 + actionSimilarity * 0.5;
  }

  /**
   * Get state history
   */
  getStateHistory(): OODAState[] {
    return [...this.stateHistory];
  }

  /**
   * Get latest state
   */
  getLatestState(): OODAState | null {
    return this.stateHistory.length > 0 ? this.stateHistory[this.stateHistory.length - 1] : null;
  }
}

/**
 * Helper: Create OODA loop for market insights generation
 */
export function createMarketInsightsOODA(agentId: string = 'market-insights-agent'): OODALoop {
  const observationFn: ObservationFn = async (state) => {
    // Observe: Gather market data
    return {
      rawData: {
        timestamp: new Date().toISOString(),
        marketData: 'gathering...'
      },
      processedData: {
        marketConditions: 'analyzing...',
        trends: []
      },
      sources: ['market-api', 'news-feeds', 'price-indices'],
      confidence: 0.85
    };
  };

  const orientationFn: OrientationFn = async (observation, previousState) => {
    // Orient: Understand market context
    return {
      context: {
        marketState: 'active',
        volatility: 'moderate',
        trends: ['bullish', 'consolidation']
      },
      patterns: ['price-momentum', 'volume-increase'],
      threats: ['market-correction', 'liquidity-risk'],
      opportunities: ['value-buying', 'momentum-trading'],
      mentalModel: {
        marketPhase: 'expansion',
        confidence: 0.8
      },
      confidence: 0.85
    };
  };

  const decisionFn: DecisionFn = async (orientation, previousState) => {
    // Decide: Choose market insights to generate
    return {
      id: 'generate-insights',
      description: 'Generate comprehensive market pulse report',
      expectedOutcome: 'Detailed market analysis with trends and predictions',
      confidence: 0.9,
      risk: 0.2,
      cost: 0.1,
      priority: 1,
      type: 'generate-report',
      reasoning: 'Market conditions indicate need for comprehensive analysis'
    };
  };

  const actionFn: ActionFn = async (decision, state) => {
    // Act: Generate market insights
    return {
      success: true,
      reportGenerated: true,
      timestamp: new Date().toISOString()
    };
  };

  return new OODALoop(
    {
      agentId,
      maxIterations: 5,
      enableAdaptation: true
    },
    observationFn,
    orientationFn,
    decisionFn,
    actionFn
  );
}

