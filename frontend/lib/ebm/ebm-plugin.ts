/**
 * EBM Plugin
 * 
 * ElizaOS Plugin pattern bundling EBM providers, actions, evaluators, and services.
 */

import { Plugin, Runtime } from '../eliza-patterns/types';
import { EBMRefinementProvider } from './ebm-provider';
import { ebmActions } from './ebm-actions';
import { ebmEvaluators } from './ebm-evaluators';
import { EBMEnergyService } from './ebm-service';

export const ebmPlugin: Plugin = {
  name: 'ebm-plugin',
  description: 'Energy-Based Model plugin for iterative answer refinement',
  
  providers: [
    new EBMRefinementProvider()
  ],
  
  actions: ebmActions,
  
  evaluators: ebmEvaluators,
  
  services: [EBMEnergyService],

  async init(runtime: Runtime): Promise<void> {
    console.log('✅ EBM Plugin initialized');
    
    // Verify all components registered
    const providerCount = runtime.providers.size;
    const actionCount = runtime.actions.size;
    const evaluatorCount = runtime.evaluators.size;
    const serviceCount = runtime.services.size;
    
    console.log(`   - Providers: ${providerCount}`);
    console.log(`   - Actions: ${actionCount}`);
    console.log(`   - Evaluators: ${evaluatorCount}`);
    console.log(`   - Services: ${serviceCount}`);
  }
};

/**
 * Register EBM plugin with runtime
 */
export async function registerEBMPlugin(runtime: Runtime): Promise<void> {
  if (!runtime.registerPlugin) {
    throw new Error('Runtime does not support registerPlugin');
  }
  const result = await runtime.registerPlugin(ebmPlugin);
  
  if (!result.success) {
    console.error('❌ EBM Plugin registration failed:', result.errors);
    throw new Error(`EBM Plugin registration failed: ${result.errors?.join(', ')}`);
  }
  
  console.log(`✅ EBM Plugin registered successfully:
   - ${result.registered.providers} providers
   - ${result.registered.actions} actions
   - ${result.registered.evaluators} evaluators
   - ${result.registered.services} services`);
}

