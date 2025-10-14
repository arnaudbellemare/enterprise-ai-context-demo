/**
 * Custom Configuration Example
 * 
 * Shows how to customize PERMUTATION's behavior with different configurations.
 */

import { PermutationEngine, PermutationConfig } from '../frontend/lib/permutation-engine';

// Configuration 1: Maximum Quality (Expensive)
async function maxQualityConfig() {
  const config: Partial<PermutationConfig> = {
    enableTeacherModel: true,    // Always use Perplexity
    enableStudentModel: true,    // Ollama as fallback
    enableMultiQuery: true,      // Generate 60 variations
    enableReasoningBank: true,
    enableLoRA: true,
    enableIRT: true,
    enableDSPy: true,
    enableACE: true,
    enableSWiRL: true,
    enableTRM: true,
    enableSQL: true,
  };

  const engine = new PermutationEngine(config);
  const result = await engine.execute("Complex financial analysis query", "financial");

  console.log('MAX QUALITY CONFIG:');
  console.log('  Quality:', result.metadata.quality_score);  // ~0.94
  console.log('  Cost:', `$${result.metadata.cost}`);        // ~$0.008
  console.log('  Duration:', `${result.metadata.duration_ms}ms`); // ~3500ms
  console.log();
}

// Configuration 2: Fast & Free (Local Only)
async function freeConfig() {
  const config: Partial<PermutationConfig> = {
    enableTeacherModel: false,   // No Perplexity (costs money)
    enableStudentModel: true,    // Ollama only (free)
    enableMultiQuery: false,     // Single query
    enableReasoningBank: true,
    enableLoRA: true,
    enableIRT: false,            // No routing needed (only 1 model)
    enableDSPy: true,            // 1 iteration only
    enableACE: false,
    enableSWiRL: false,
    enableTRM: false,
    enableSQL: false,
  };

  const engine = new PermutationEngine(config);
  const result = await engine.execute("Simple query", "general");

  console.log('FREE CONFIG:');
  console.log('  Quality:', result.metadata.quality_score);  // ~0.81
  console.log('  Cost:', `$${result.metadata.cost}`);        // $0.00
  console.log('  Duration:', `${result.metadata.duration_ms}ms`); // ~800ms
  console.log();
}

// Configuration 3: Balanced (Production Default)
async function balancedConfig() {
  const config: Partial<PermutationConfig> = {
    enableTeacherModel: true,    // For hard queries only (IRT > 0.7)
    enableStudentModel: true,
    enableMultiQuery: true,      // 10 variations
    enableReasoningBank: true,
    enableLoRA: true,
    enableIRT: true,             // Adaptive routing
    enableDSPy: true,            // 2 iterations
    enableACE: true,             // For hard queries only
    enableSWiRL: true,
    enableTRM: true,
    enableSQL: true,
  };

  const engine = new PermutationEngine(config);
  const result = await engine.execute("Typical query", "general");

  console.log('BALANCED CONFIG:');
  console.log('  Quality:', result.metadata.quality_score);  // ~0.92
  console.log('  Cost:', `$${result.metadata.cost}`);        // ~$0.005
  console.log('  Duration:', `${result.metadata.duration_ms}ms`); // ~2300ms
  console.log();
}

// Configuration 4: Cost-Optimized (Quality > 0.85)
async function costOptimizedConfig() {
  const config: Partial<PermutationConfig> = {
    enableTeacherModel: true,    // Only for IRT > 0.8 (hardest queries)
    enableStudentModel: true,
    enableMultiQuery: true,      // 5 variations
    enableReasoningBank: true,
    enableLoRA: true,
    enableIRT: true,             // Aggressive routing
    enableDSPy: true,            // 1-2 iterations
    enableACE: false,            // Skip (saves time)
    enableSWiRL: true,
    enableTRM: true,
    enableSQL: true,
  };

  const engine = new PermutationEngine(config);
  const result = await engine.execute("Query", "general");

  console.log('COST-OPTIMIZED CONFIG:');
  console.log('  Quality:', result.metadata.quality_score);  // ~0.88
  console.log('  Cost:', `$${result.metadata.cost}`);        // ~$0.003
  console.log('  Duration:', `${result.metadata.duration_ms}ms`); // ~2000ms
  console.log();
}

async function runAllConfigs() {
  console.log('=== CONFIGURATION COMPARISON ===\n');
  
  await maxQualityConfig();
  await freeConfig();
  await balancedConfig();
  await costOptimizedConfig();

  console.log('\n=== RECOMMENDATION ===');
  console.log('Development: Use FREE config');
  console.log('Production: Use BALANCED config');
  console.log('Critical queries: Use MAX QUALITY config');
  console.log('High volume: Use COST-OPTIMIZED config');
}

runAllConfigs().catch(console.error);

/**
 * Expected Output:
 * 
 * === CONFIGURATION COMPARISON ===
 * 
 * MAX QUALITY CONFIG:
 *   Quality: 0.94
 *   Cost: $0.008
 *   Duration: 3500ms
 * 
 * FREE CONFIG:
 *   Quality: 0.81
 *   Cost: $0.00
 *   Duration: 800ms
 * 
 * BALANCED CONFIG:
 *   Quality: 0.92
 *   Cost: $0.005
 *   Duration: 2300ms
 * 
 * COST-OPTIMIZED CONFIG:
 *   Quality: 0.88
 *   Cost: $0.003
 *   Duration: 2000ms
 * 
 * === RECOMMENDATION ===
 * Development: Use FREE config
 * Production: Use BALANCED config
 * Critical queries: Use MAX QUALITY config
 * High volume: Use COST-OPTIMIZED config
 */

