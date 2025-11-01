/**
 * Direct SWiRL Optimization Test
 * 
 * Tests the PromptMII+GEPA-optimized SWiRL decomposer directly
 * without requiring the full API stack
 */

import { createOptimizedSWiRLDecomposer } from './frontend/lib/swirl-optimized';
import { createSWiRLDecomposer } from './frontend/lib/swirl-decomposer';

const COMPLEX_QUERY = `As an insurance appraiser, evaluate the market value of a 1919 Claude Monet "Water Lilies" painting (oil on canvas, 200cm x 180cm, excellent condition). Research recent comparable sales at Christie's, Sotheby's, and Heritage Auctions from 2020-2024. Analyze market trends, calculate insurance replacement cost, assess risk factors, and provide USPAP-compliant documentation with confidence scores.`;

async function testSWiRLOptimization() {
  console.log('🧪 Testing SWiRL PromptMII+GEPA Optimization\n');
  console.log('═'.repeat(80));
  
  console.log(`\n📝 Query:`);
  console.log(`   ${COMPLEX_QUERY.substring(0, 100)}...`);
  console.log(`   Length: ${COMPLEX_QUERY.length} chars, ${COMPLEX_QUERY.split(/\s+/).length} words`);
  
  const availableTools = ['web_search', 'calculator', 'sql'];
  
  console.log(`\n🔬 Testing Optimized SWiRL Decomposer...`);
  console.log(`   Tools: ${availableTools.join(', ')}`);
  
  const startTime = Date.now();
  
  try {
    // Test optimized version
    console.log(`\n1️⃣ Testing OPTIMIZED version (with PromptMII+GEPA)...`);
    const optimizedDecomposer = createOptimizedSWiRLDecomposer({
      enableOptimization: true,
      minImprovement: 10,
      cacheOptimizations: true
    });
    
    const optimizedStart = Date.now();
    const optimizedResult = await optimizedDecomposer.decompose(COMPLEX_QUERY, availableTools);
    const optimizedTime = Date.now() - optimizedStart;
    
    console.log(`\n✅ Optimized Result:`);
    console.log(`   Steps: ${optimizedResult.trajectory.steps.length}`);
    console.log(`   Complexity: ${optimizedResult.trajectory.total_complexity.toFixed(2)}`);
    console.log(`   Tools: ${optimizedResult.trajectory.tools_required.join(', ')}`);
    console.log(`   Time: ${optimizedTime}ms`);
    console.log(`   Trajectory ID: ${optimizedResult.trajectory.task_id}`);
    
    if (optimizedResult.trajectory.task_id.includes('opt')) {
      console.log(`   ✅ PromptMII+GEPA optimization: APPLIED`);
    } else {
      console.log(`   ⚠️  Optimization may not have been applied`);
    }
    
    // Show first few steps
    if (optimizedResult.trajectory.steps.length > 0) {
      console.log(`\n   Steps Preview:`);
      optimizedResult.trajectory.steps.slice(0, 3).forEach((step, i) => {
        console.log(`   ${i + 1}. ${step.description.substring(0, 60)}...`);
        console.log(`      Reasoning: ${step.reasoning.substring(0, 50)}...`);
        console.log(`      Tools: ${step.tools_needed.join(', ') || 'none'}`);
      });
    }
    
    // Compare with original (if time permits)
    console.log(`\n2️⃣ Testing ORIGINAL version (baseline)...`);
    const originalDecomposer = createSWiRLDecomposer('qwen2.5:14b');
    
    const originalStart = Date.now();
    const originalResult = await originalDecomposer.decompose(COMPLEX_QUERY, availableTools);
    const originalTime = Date.now() - originalStart;
    
    console.log(`\n✅ Original Result:`);
    console.log(`   Steps: ${originalResult.trajectory.steps.length}`);
    console.log(`   Complexity: ${originalResult.trajectory.total_complexity.toFixed(2)}`);
    console.log(`   Time: ${originalTime}ms`);
    
    // Comparison
    console.log(`\n📊 Comparison:`);
    console.log(`   Steps: ${originalResult.trajectory.steps.length} → ${optimizedResult.trajectory.steps.length}`);
    console.log(`   Time: ${originalTime}ms → ${optimizedTime}ms (${((optimizedTime - originalTime) / originalTime * 100).toFixed(1)}%)`);
    console.log(`   Complexity: ${originalResult.trajectory.total_complexity.toFixed(2)} → ${optimizedResult.trajectory.total_complexity.toFixed(2)}`);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total Test Time: ${totalTime}ms`);
    
    console.log(`\n✅ Test Complete`);
    console.log(`\n═`.repeat(80));
    
  } catch (error) {
    console.error(`\n❌ Test Failed:`);
    console.error(error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error(`\n💡 Make sure Ollama is running:`);
      console.error(`   ollama serve`);
      console.error(`   ollama pull qwen2.5:14b`);
    }
    
    process.exit(1);
  }
}

testSWiRLOptimization().catch(console.error);

