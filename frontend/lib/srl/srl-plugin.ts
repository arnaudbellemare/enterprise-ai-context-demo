/**
 * SRL Plugin
 * 
 * ElizaOS Plugin pattern bundling SRL providers, actions, evaluators, and services.
 */

import { Plugin, Runtime } from '../eliza-patterns/types';
import { SRLExpertTrajectoryProvider } from './srl-provider';
import { srlActions } from './srl-actions';
import { srlEvaluators } from './srl-evaluators';
import { SRLExpertTrajectoryService } from './srl-service';

export const srlPlugin: Plugin = {
  name: 'srl-plugin',
  description: 'Supervised Reinforcement Learning plugin for step-wise reasoning enhancement',
  
  providers: [
    new SRLExpertTrajectoryProvider()
  ],
  
  actions: srlActions,
  
  evaluators: srlEvaluators,
  
  services: [SRLExpertTrajectoryService],

  async init(runtime: Runtime): Promise<void> {
    console.log('✅ SRL Plugin initialized');
    
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
 * Register SRL plugin with runtime
 */
export async function registerSRLPlugin(runtime: Runtime): Promise<void> {
  if (!runtime.registerPlugin) {
    console.error('❌ Runtime does not have registerPlugin method');
    return;
  }
  
  const result = await runtime.registerPlugin(srlPlugin);
  
  if (!result.success) {
    console.error('❌ SRL Plugin registration failed:', result.errors);
    throw new Error(`SRL Plugin registration failed: ${result.errors?.join(', ')}`);
  }
  
  console.log(`✅ SRL Plugin registered successfully:
   - ${result.registered.providers} providers
   - ${result.registered.actions} actions
   - ${result.registered.evaluators} evaluators
   - ${result.registered.services} services`);
}

