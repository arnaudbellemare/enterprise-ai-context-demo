/**
 * Phase Execution Diagnostic
 * 
 * Identifies which phases are actually running vs skipped/stubbed
 */

import { executeUnifiedPipeline } from './frontend/lib/unified-permutation-pipeline';
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';

/**
 * Enhanced logging to track actual execution
 */
async function diagnosticTest() {
  console.log('🔍 Phase Execution Diagnostic\n');
  console.log('='.repeat(80));
  
  const query = 'What is the capital of France?';
  
  // Enable all components to see what actually runs
  const config = {
    enableACE: true,
    enableGEPA: true,
    enableIRT: true,
    enableRVS: true,
    enableDSPy: true,
    enableSemiotic: true,
    enableTeacherStudent: true,
    enableSWiRL: true,
    optimizationMode: 'balanced' as const,
    // Force activation with low thresholds
    aceThreshold: 0.1,  // Very low to force activation
    swirlThreshold: 0.1,
    rvsThreshold: 0.1,
  };
  
  console.log('🧪 Testing with forced activation (low thresholds)\n');
  console.log('Configuration:', config);
  console.log('\n' + '-'.repeat(80));
  
  try {
    const result = await executeUnifiedPipeline(query, undefined, undefined, config);
    
    console.log('\n📊 Execution Results:');
    console.log('-'.repeat(80));
    console.log(`Components Used: ${result.metadata.components_used.join(', ') || 'none'}`);
    console.log(`IRT Difficulty: ${result.metadata.irt_difficulty.toFixed(3)}`);
    console.log(`Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`Total Time: ${result.metadata.performance.total_time_ms}ms`);
    
    // Analyze trace steps
    console.log('\n🔍 Phase Analysis:');
    console.log('-'.repeat(80));
    
    const phaseMap: Record<string, { executed: boolean; duration: number; status: string }> = {};
    
    result.trace.steps.forEach((step: any) => {
      const component = step.component;
      if (!phaseMap[component]) {
        phaseMap[component] = {
          executed: step.status !== 'skipped',
          duration: step.duration_ms,
          status: step.status,
        };
      }
    });
    
    console.log('\nPhase Execution Summary:');
    for (const [component, info] of Object.entries(phaseMap)) {
      const emoji = info.executed ? '✅' : '❌';
      const statusText = info.status === 'success' ? 'executed' : info.status;
      console.log(`  ${emoji} ${component}: ${statusText} (${info.duration}ms)`);
      
      if (info.executed && info.duration === 0) {
        console.log(`     ⚠️  WARNING: Executed but took 0ms - may be stubbed/mocked`);
      }
      if (!info.executed) {
        console.log(`     ℹ️  Skipped (may be threshold-based or disabled)`);
      }
    }
    
    // Check for phases that should run but didn't
    const expectedPhases = [
      'IRT Calculator',
      'Semiotic Inference System',
      'ACE Framework',
      'DSPy-GEPA Optimizer',
      'Teacher-Student System',
      'SWiRL',
      'RVS (Recursive Verification System)',
    ];
    
    console.log('\n⚠️  Missing Expected Phases:');
    const executedComponents = new Set(Object.keys(phaseMap));
    let missing = false;
    
    for (const phase of expectedPhases) {
      if (!executedComponents.has(phase)) {
        console.log(`  ❌ ${phase}: Not in trace (may be skipped or not logged)`);
        missing = true;
      }
    }
    
    if (!missing) {
      console.log('  ✅ All expected phases accounted for');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Also check what modules are actually available
async function checkDSPyModules() {
  console.log('\n🔍 Checking DSPy Module Registry:');
  console.log('-'.repeat(80));
  
  try {
    const { dspyRegistry } = await import('./frontend/lib/dspy-signatures');
    
    const modules = dspyRegistry.getAllModules();
    console.log(`Available modules: ${modules.length}`);
    
    modules.forEach((module: any, idx: number) => {
      console.log(`  ${idx + 1}. ${module.name || 'Unnamed'}`);
    });
    
    // Test module selection
    const testDomains = ['general', 'art', 'legal', 'business'];
    console.log('\nModule Selection by Domain:');
    testDomains.forEach(domain => {
      // This would need access to the pipeline's selectDSPyModule method
      console.log(`  ${domain}: (checking...)`);
    });
    
  } catch (error) {
    console.error('❌ Error checking modules:', error);
  }
}

// Run diagnostics
if (require.main === module) {
  (async () => {
    await diagnosticTest();
    await checkDSPyModules();
  })().catch(console.error);
}

export { diagnosticTest, checkDSPyModules };

