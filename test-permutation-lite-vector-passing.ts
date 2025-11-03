/**
 * Test Permutation-Lite with REFRAG Vector-Passing
 * 
 * Tests the integration of REFRAG vector-passing into permutation-lite
 * to verify it makes answer generation faster
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file explicitly
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') }); // Fallback to .env

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';

async function testPermutationLiteWithVectorPassing() {
  console.log('🧪 Testing Permutation-Lite with REFRAG Vector-Passing\n');
  console.log('='.repeat(60));

  const query = 'What should be the insurance premium on a painting of Alec Monopoly?';
  const domain = 'art';

  // Test 1: Without vector-passing (baseline)
  console.log('\n1️⃣ Baseline: Permutation-Lite WITHOUT vector-passing');
  console.log('-'.repeat(60));
  const baselineStart = Date.now();
  
  try {
    const baselineResult = await executePermutationLite(query, domain, {
      enableVectorPassing: false
    });
    
    const baselineTime = Date.now() - baselineStart;
    console.log(`✅ Completed in ${baselineTime}ms`);
    console.log(`   - Answer length: ${baselineResult.result.answer.length} chars`);
    console.log(`   - Quality score: ${baselineResult.result.metadata.quality_score.toFixed(3)}`);
    console.log(`   - Total time: ${baselineResult.result.metadata.performance.total_time_ms}ms`);
    
    // Test 2: With vector-passing (Ollama - free)
    console.log('\n2️⃣ With Vector-Passing: Permutation-Lite WITH REFRAG (Ollama)');
    console.log('-'.repeat(60));
    const vectorStart = Date.now();
    
    const vectorResult = await executePermutationLite(query, domain, {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama' // Free, cost-effective
    });
    
    const vectorTime = Date.now() - vectorStart;
    console.log(`✅ Completed in ${vectorTime}ms`);
    console.log(`   - Answer length: ${vectorResult.result.answer.length} chars`);
    console.log(`   - Quality score: ${vectorResult.result.metadata.quality_score.toFixed(3)}`);
    console.log(`   - Total time: ${vectorResult.result.metadata.performance.total_time_ms}ms`);
    
    // Comparison
    console.log('\n📊 Comparison');
    console.log('-'.repeat(60));
    const timeDifference = baselineTime - vectorTime;
    const speedup = baselineTime > 0 ? (baselineTime / vectorTime).toFixed(2) : 'N/A';
    
    console.log(`   Baseline time: ${baselineTime}ms`);
    console.log(`   Vector-passing time: ${vectorTime}ms`);
    console.log(`   Time saved: ${timeDifference > 0 ? `${timeDifference}ms (${speedup}x faster)` : `${Math.abs(timeDifference)}ms slower`}`);
    
    if (timeDifference > 0) {
      console.log(`   ✅ Vector-passing is ${speedup}x faster!`);
    } else if (timeDifference < 0) {
      console.log(`   ⚠️  Vector-passing is ${Math.abs(timeDifference)}ms slower (may be overhead on first run)`);
    } else {
      console.log(`   ⚠️  Similar performance`);
    }
    
    // Quality comparison
    const qualityDiff = vectorResult.result.metadata.quality_score - baselineResult.result.metadata.quality_score;
    console.log(`\n   Baseline quality: ${baselineResult.result.metadata.quality_score.toFixed(3)}`);
    console.log(`   Vector-passing quality: ${vectorResult.result.metadata.quality_score.toFixed(3)}`);
    if (Math.abs(qualityDiff) < 0.05) {
      console.log(`   ✅ Quality maintained (difference: ${qualityDiff > 0 ? '+' : ''}${qualityDiff.toFixed(3)})`);
    } else {
      console.log(`   ${qualityDiff > 0 ? '✅' : '⚠️'} Quality ${qualityDiff > 0 ? 'improved' : 'decreased'} by ${Math.abs(qualityDiff).toFixed(3)}`);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed');
}

// Run test
testPermutationLiteWithVectorPassing().catch(console.error);

