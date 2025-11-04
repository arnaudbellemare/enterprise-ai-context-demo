/**
 * Minimal Test to Identify Hanging Issue
 * 
 * This script tests with minimal components enabled to find what's causing the hang.
 */

import { PermutationLiteGAMPPipeline } from './frontend/lib/permutation-lite/permutation-lite-gamp-pipeline';

// Load environment variables
try {
  const dotenv = require('dotenv');
  const { resolve } = require('path');
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
} catch (e) {
  // dotenv not available - ignore
}

async function testSimple() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 MINIMAL TEST - Finding Hang Source');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📦 Step 1: Initializing pipeline (minimal config)...');
  const initStart = Date.now();
  
  try {
    // Create pipeline with MINIMAL components enabled
    const pipeline = new PermutationLiteGAMPPipeline({
      enableGAMP: false,           // Disable GAMP initially
      enableOptimization: false,    // Disable optimization
      enableLearning: false,        // Disable learning
      enableVerification: false,    // Disable verification
      enableTeacherStudent: false,  // Disable teacher-student
    });

    const initTime = Date.now() - initStart;
    console.log(`✅ Pipeline initialized in ${initTime}ms\n`);

    const query = 'What is CRISPR?';
    
    console.log('📝 QUERY:', query);
    console.log('🚀 EXECUTING PIPELINE (minimal config)...\n');

    const TIMEOUT_MS = 30000; // 30 seconds
    const startTime = Date.now();
    
    const executePromise = pipeline.execute(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`\n⏰ TIMEOUT after ${elapsed}ms`);
        reject(new Error(`Pipeline execution timed out after ${TIMEOUT_MS / 1000} seconds`));
      }, TIMEOUT_MS)
    );
    
    const result = await Promise.race([executePromise, timeoutPromise]) as any;
    const elapsed = Date.now() - startTime;
    
    console.log(`\n✅ SUCCESS: Pipeline completed in ${elapsed}ms`);
    console.log(`Answer: ${result.answer.substring(0, 100)}...`);
    console.log(`Quality: ${result.metadata.quality_score.toFixed(3)}`);
    
    // Force exit after a short delay to allow cleanup
    setTimeout(() => {
      console.log('\n✅ Test completed successfully. Exiting...');
      process.exit(0);
    }, 1000);
    
  } catch (error: any) {
    const elapsed = Date.now() - initStart;
    console.error(`\n❌ ERROR after ${elapsed}ms:`);
    console.error(error.message || error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    setTimeout(() => process.exit(1), 500);
  }
}

// Run the test
testSimple().catch((error) => {
  console.error('Fatal error:', error);
  setTimeout(() => process.exit(1), 500);
});

