/**
 * Single Full Query & Answer Example
 * 
 * Shows a complete test with full query and full answer displayed
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';

async function runSingleTest() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 PERMUTATION-LITE FULL QUERY & ANSWER TEST');
  console.log('='.repeat(100));

  // Test Query
  const query = `What should be the insurance premium on a painting of Alec Monopoly valued at $125,000? The painting will be displayed in a private gallery in New York with standard security measures.`;

  console.log('\n📝 FULL QUERY:');
  console.log('-'.repeat(100));
  console.log(query);
  console.log('-'.repeat(100));

  try {
    const startTime = Date.now();
    
    console.log('\n🔄 Processing with Permutation-Lite...');
    console.log('   Domain: art');
    console.log('   Vector-passing: enabled (Ollama)');
    console.log('   Config: Full pipeline (routing → optimization → learning → verification)\n');
    
    const result = await executePermutationLite(query, 'art', {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(100));
    console.log('📋 FULL ANSWER:');
    console.log('='.repeat(100));
    console.log(result.answer);
    console.log('='.repeat(100));

    console.log('\n📊 RESPONSE METADATA:');
    console.log('-'.repeat(100));
    console.log(`Domain: ${result.metadata.domain}`);
    console.log(`Difficulty: ${result.metadata.difficulty?.toFixed(3)}`);
    console.log(`Quality Score: ${result.metadata.quality_score?.toFixed(3)}`);
    console.log(`Route: ${result.metadata.routing?.route} (confidence: ${result.metadata.routing?.confidence?.toFixed(2)})`);
    console.log(`Verification: ${result.metadata.verification?.verified ? '✅ Verified' : '❌ Not Verified'}`);
    console.log(`   Confidence: ${result.metadata.verification?.confidence?.toFixed(2)}`);
    console.log(`   Iterations: ${result.metadata.verification?.iterations}`);
    console.log(`Layers Executed: ${result.metadata.layers_executed?.join(' → ')}`);
    console.log(`Processing Time: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`Cost: $${result.metadata.performance?.cost?.toFixed(4)}`);
    
    if (result.metadata.optimization) {
      console.log(`\nGEPA Optimization:`);
      console.log(`   Quality: ${result.metadata.optimization.quality?.toFixed(2)}`);
      console.log(`   Generations: ${result.metadata.optimization.generations}`);
    }
    
    if (result.metadata.learning) {
      console.log(`\nLearning System:`);
      console.log(`   Memories Stored: ${result.metadata.learning.memoriesStored || 0}`);
      console.log(`   Memories Used: ${result.metadata.learning.memoriesUsed || 0}`);
    }
    console.log('-'.repeat(100));

    console.log('\n✅ TEST COMPLETE');
    console.log('='.repeat(100));

    // Save to file
    const fs = require('fs');
    fs.writeFileSync(
      'single-test-full-result.json',
      JSON.stringify({
        query,
        answer: result.answer,
        metadata: result.metadata,
        duration,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    console.log('\n📁 Full result saved to: single-test-full-result.json');

  } catch (error: any) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error(error.stack);
  }
}

runSingleTest().catch(console.error);

