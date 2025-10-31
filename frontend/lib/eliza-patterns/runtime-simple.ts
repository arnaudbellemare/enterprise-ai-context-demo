/**
 * Simple Runtime Implementation
 * 
 * Minimal runtime for ElizaOS patterns without full package dependency.
 * Handles registration, execution, and state management.
 */

import {
  Runtime,
  RuntimeConfig,
  Provider,
  Action,
  Evaluator,
  Service,
  Plugin,
  Message,
  State,
  HandlerResult,
  ProviderResult,
  PluginRegistrationResult
} from './types';

export class SimpleRuntime implements Runtime {
  providers: Map<string, Provider> = new Map();
  actions: Map<string, Action> = new Map();
  evaluators: Map<string, Evaluator> = new Map();
  services: Map<string, Service> = new Map();
  state: State = {};
  config?: RuntimeConfig;

  constructor(config?: RuntimeConfig) {
    this.config = config || {};
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<PluginRegistrationResult> {
    const errors: string[] = [];
    let providersCount = 0;
    let actionsCount = 0;
    let evaluatorsCount = 0;
    let servicesCount = 0;

    // Register providers
    if (plugin.providers) {
      for (const provider of plugin.providers) {
        try {
          this.providers.set(provider.name, provider);
          providersCount++;
        } catch (error: any) {
          errors.push(`Provider ${provider.name}: ${error.message}`);
        }
      }
    }

    // Register actions
    if (plugin.actions) {
      for (const action of plugin.actions) {
        try {
          this.actions.set(action.name, action);
          actionsCount++;
        } catch (error: any) {
          errors.push(`Action ${action.name}: ${error.message}`);
        }
      }
    }

    // Register evaluators
    if (plugin.evaluators) {
      for (const evaluator of plugin.evaluators) {
        try {
          this.evaluators.set(evaluator.name, evaluator);
          evaluatorsCount++;
        } catch (error: any) {
          errors.push(`Evaluator ${evaluator.name}: ${error.message}`);
        }
      }
    }

    // Register services
    if (plugin.services) {
      for (const ServiceClass of plugin.services) {
        try {
          const service = await ServiceClass.start(this as any as Runtime);
          this.services.set(ServiceClass.serviceName, service);
          servicesCount++;
        } catch (error: any) {
          errors.push(`Service ${ServiceClass.serviceName}: ${error.message}`);
        }
      }
    }

    // Run plugin initialization if provided
    if (plugin.init) {
      try {
        await plugin.init(this);
      } catch (error: any) {
        errors.push(`Plugin init: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      registered: {
        providers: providersCount,
        actions: actionsCount,
        evaluators: evaluatorsCount,
        services: servicesCount
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Execute providers for a message
   */
  async executeProviders(message: Message): Promise<void> {
    const results: ProviderResult[] = [];
    
    // Sort providers by position (lower = earlier)
    const sortedProviders = Array.from(this.providers.values()).sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );

    for (const provider of sortedProviders) {
      try {
        const result = await provider.get(this, message, this.state);
        results.push(result);
        
        // If provider is dynamic, it may have modified state
        if (provider.dynamic && result.context) {
          // Store context in state if needed
          this.state[`provider:${provider.name}`] = result.context;
        }
      } catch (error: any) {
        console.warn(`Provider ${provider.name} failed:`, error);
        results.push({
          context: [],
          success: false,
          error: error.message
        });
      }
    }

    // Results stored in state, return void
    // return results;
  }

  /**
   * Execute an action
   */
  async executeAction(
    actionName: string,
    message: Message
  ): Promise<HandlerResult | null> {
    const action = this.actions.get(actionName);
    if (!action) {
      return null;
    }

    // Validate action can run
    const canRun = await action.validate(this, message, this.state);
    if (!canRun) {
      return null;
    }

    // Check requirements
    if (action.effects?.requires) {
      for (const requirement of action.effects.requires) {
        if (!this.state[requirement]) {
          console.warn(`Action ${actionName} requires ${requirement} but it's not available`);
          return null;
        }
      }
    }

    // Execute action
    try {
      const result = await action.handler(this, message, this.state);
      
      // Update state with provided context
      if (action.effects?.provides) {
        for (const provided of action.effects.provides) {
          this.state[provided] = result.response;
        }
      }

      // Apply state modifications
      if (result.state) {
        Object.assign(this.state, result.state);
      }

      return result;
    } catch (error: any) {
      console.error(`Action ${actionName} failed:`, error);
      return {
        response: '',
        metadata: {
          error: error.message
        }
      };
    }
  }

  /**
   * Execute all evaluators for a message
   */
  async executeEvaluators(message: Message): Promise<void> {
    const results: HandlerResult[] = [];

    for (const evaluator of this.evaluators.values()) {
      try {
        const canRun = await evaluator.validate(this, message, this.state);
        if (!canRun && !evaluator.alwaysRun) {
          continue;
        }

        const result = await evaluator.handler(this, message, this.state);
        results.push(result);

        // Update state with evaluation results
        if (result.metadata) {
          this.state[`evaluator:${evaluator.name}`] = result.metadata;
        }
      } catch (error: any) {
        if (evaluator.alwaysRun) {
          // Always-run evaluators must succeed
          console.error(`Evaluator ${evaluator.name} failed (alwaysRun):`, error);
          results.push({
            response: '',
            metadata: {
              error: error.message
            }
          });
        } else {
          console.warn(`Evaluator ${evaluator.name} failed:`, error);
        }
      }
    }

    // Results stored in state, return void
    // return results;
  }

  /**
   * Get service by name
   */
  getService<T extends Service>(serviceName: string): T | null {
    return (this.services.get(serviceName) as T) || null;
  }

  /**
   * Stop all services
   */
  async stopServices(): Promise<void> {
    const stopPromises = Array.from(this.services.values()).map(service =>
      service.stop().catch(error => {
        console.warn(`Service stop failed:`, error);
      })
    );
    await Promise.all(stopPromises);
    this.services.clear();
  }

  /**
   * Clear runtime state
   */
  clearState(): void {
    this.state = {};
  }

  /**
   * Reset runtime (clear everything)
   */
  async reset(): Promise<void> {
    await this.stopServices();
    this.providers.clear();
    this.actions.clear();
    this.evaluators.clear();
    this.services.clear();
    this.state = {};
  }
}

/**
 * Create a new runtime instance
 */
export function createRuntime(config?: RuntimeConfig): SimpleRuntime {
  return new SimpleRuntime(config);
}

// Re-export types for convenience
export type { Runtime, Message, State, RuntimeConfig } from './types';

