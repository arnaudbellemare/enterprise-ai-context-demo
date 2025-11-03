/**
 * Test Permutation-Lite with Vector-Passing - Show Full Answer
 * 
 * Runs permutation-lite with vector-passing enabled and displays the complete answer
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';

async function testWithAnswer() {
  console.log('🧪 Testing Permutation-Lite with REFRAG Vector-Passing\n');
  console.log('='.repeat(80));

  const query = 'What should be the insurance premium on a painting of Alec Monopoly?';
  const domain = 'art';

  console.log(`Query: ${query}`);
  console.log(`Domain: ${domain}`);
  console.log(`Config: Vector-passing enabled (Ollama - free)\n`);
  console.log('='.repeat(80) + '\n');

  try {
    const startTime = Date.now();
    
    const result = await executePermutationLite(query, domain, {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📋 ANSWER');
    console.log('='.repeat(80));
    console.log(result.answer || 'No answer returned');
    console.log('\n' + '='.repeat(80));
    
    console.log('\n📊 METADATA');
    console.log('-'.repeat(80));
    if (result.metadata) {
      console.log(`Domain: ${result.metadata.domain || 'N/A'}`);
      console.log(`Difficulty: ${result.metadata.difficulty?.toFixed(3) || 'N/A'}`);
      console.log(`Quality Score: ${result.metadata.quality_score?.toFixed(3) || 'N/A'}`);
      if (result.metadata.performance) {
        console.log(`Total Time: ${result.metadata.performance.total_time_ms || 'N/A'}ms`);
        console.log(`Cost: $${result.metadata.performance.cost?.toFixed(4) || '0.0000'}`);
      }
      if (result.metadata.layers_executed) {
        console.log(`Layers Executed: ${result.metadata.layers_executed.join(' → ')}`);
      }
      
      if (result.metadata.routing) {
        console.log(`\nRouting: ${result.metadata.routing.route} (confidence: ${result.metadata.routing.confidence?.toFixed(2) || 'N/A'})`);
      }
      
      if (result.metadata.optimization) {
        console.log(`Optimization: Quality ${result.metadata.optimization.quality?.toFixed(2) || 'N/A'}, ${result.metadata.optimization.generations || 0} generations`);
      }
      
      if (result.metadata.verification) {
        console.log(`Verification: ${result.metadata.verification.verified ? '✅ Verified' : '❌ Not verified'} (confidence: ${result.metadata.verification.confidence?.toFixed(2) || 'N/A'})`);
      }
    } else {
      console.log('No metadata available');
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Test completed in ${duration}ms`);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testWithAnswer().catch(console.error);

