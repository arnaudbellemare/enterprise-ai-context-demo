/**
 * ElizaOS-Compatible Type Definitions
 * 
 * Implements core ElizaOS interfaces without package dependency.
 * Provides clean architecture for Actions, Providers, Services, Evaluators.
 * 
 * Based on: https://github.com/elizaOS/eliza
 */

/**
 * Runtime context for ElizaOS components
 */
export interface Runtime {
  providers: Map<string, Provider>;
  actions: Map<string, Action>;
  evaluators: Map<string, Evaluator>;
  services: Map<string, Service>;
  state: State;
  config?: RuntimeConfig;
  registerPlugin?: (plugin: Plugin) => Promise<PluginRegistrationResult>;
  executeProviders?: (message: Message) => Promise<void>;
  executeAction?: (actionName: string, message: Message) => Promise<HandlerResult | null>;
  executeEvaluators?: (message: Message) => Promise<void>;
  stopServices?: () => Promise<void>;
  reset?: () => Promise<void>;
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  [key: string]: any;
}

/**
 * Message structure
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: MessageMetadata;
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  [key: string]: any;
}

/**
 * State management
 */
export interface State {
  [key: string]: any;
}

/**
 * Provider result
 */
export interface ProviderResult {
  context: string | Context[];
  cost?: number;
  tokens?: number;
  success?: boolean;
  error?: string;
}

/**
 * Context structure for providers
 */
export interface Context {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
  timestamp?: number;
}

/**
 * Provider interface
 * 
 * Providers inject dynamic context into the system.
 * Examples: Expert trajectories, recent memories, active playbooks
 */
export interface Provider {
  name: string;
  description?: string;
  dynamic?: boolean; // If true, provider can modify state
  position?: number; // Execution order (lower = earlier)
  get: (runtime: Runtime, message: Message, state: State) => Promise<ProviderResult>;
}

/**
 * Handler function type for Actions and Evaluators
 */
export type Handler = (
  runtime: Runtime,
  message: Message,
  state: State
) => Promise<HandlerResult>;

/**
 * Handler result
 */
export interface HandlerResult {
  response: string;
  state?: Partial<State>;
  metadata?: HandlerMetadata;
}

/**
 * Handler metadata
 */
export interface HandlerMetadata {
  cost?: number;
  tokens?: number;
  latency?: number;
  components?: string[];
  [key: string]: any;
}

/**
 * Action interface
 * 
 * Actions are tools that can be executed.
 * Examples: SRL enhancement, EBM refinement, SWiRL decomposition
 */
export interface Action {
  name: string;
  description: string;
  validate: (runtime: Runtime, message: Message, state: State) => Promise<boolean>;
  handler: Handler;
  effects?: ActionEffects;
}

/**
 * Action effects declaration
 */
export interface ActionEffects {
  provides: string[]; // Context keys this action provides
  requires: string[]; // Context keys this action requires
  modifies: string[]; // State keys this action modifies
}

/**
 * Evaluator interface
 * 
 * Evaluators validate and score responses.
 * Examples: Step reward calculation, energy computation, quality scoring
 */
export interface Evaluator {
  name: string;
  description: string;
  alwaysRun?: boolean; // If true, runs even if other evaluators fail
  handler: Handler;
  validate: (runtime: Runtime, message: Message, state: State) => Promise<boolean>;
}

/**
 * Service interface
 * 
 * Services are long-running integrations.
 * Examples: Expert trajectory service, energy computation service
 */
export abstract class Service {
  static serviceName: string;
  abstract capabilityDescription: string;
  abstract stop(): Promise<void>;
  static start(runtime: Runtime): Promise<Service>;
}

/**
 * Plugin interface
 * 
 * Plugins bundle providers, actions, evaluators, and services.
 */
export interface Plugin {
  name: string;
  description: string;
  providers?: Provider[];
  actions?: Action[];
  evaluators?: Evaluator[];
  services?: (typeof Service)[];
  init?: (runtime: Runtime) => Promise<void>;
}

/**
 * Plugin registration result
 */
export interface PluginRegistrationResult {
  success: boolean;
  registered: {
    providers: number;
    actions: number;
    evaluators: number;
    services: number;
  };
  errors?: string[];
}

