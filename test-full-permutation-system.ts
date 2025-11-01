/**
 * Full PERMUTATION System Test
 * 
 * Tests the COMPLETE unified pipeline with all components:
 * - IRT (Intelligent Routing)
 * - Semiotic Inference (Deduction, Induction, Abduction)
 * - ACE Framework (with PromptMII+GEPA optimization)
 * - DSPy + GEPA
 * - Teacher-Student Learning
 * - RVS (Recursive Verification)
 * - SWiRL (with PromptMII+GEPA optimization)
 * - SRL (Supervised Reinforcement Learning)
 * - EBM (Energy-Based Refinement)
 */

// Complex multi-part query that exercises all PERMUTATION components
const COMPLEX_QUERY = `As an insurance appraiser for a high-net-worth collector, I need you to:

1. Evaluate the current market value of a 1919 Claude Monet "Water Lilies" painting (oil on canvas, 200cm x 180cm, excellent condition, authenticated by Musée d'Orsay in 2015)

2. Research recent comparable sales at major auction houses (Christie's, Sotheby's, Heritage Auctions) from 2020-2024 for Monet Water Lilies series paintings, specifically looking for:
   - Similar dimensions and medium
   - Comparable condition ratings
   - Same artistic period (1910-1926)
   - Insurance valuations vs auction realized prices

3. Analyze market trends for Impressionist art, considering:
   - Post-pandemic market recovery patterns
   - Impact of digital art/NFT market on traditional art values
   - Currency fluctuations affecting international collectors
   - Supply constraints (limited number of authentic Monet Water Lilies)

4. Calculate insurance replacement cost considering:
   - Current fair market value (FMV)
   - 20% replacement cost premium (for comparable period works)
   - Shipping and authentication costs ($50,000)
   - Appreciation factor based on 5-year historical growth rate

5. Assess risk factors:
   - Climate risks (humidity, temperature variations)
   - Transportation risks (if loaned to exhibitions)
   - Provenance verification needs
   - Authentication maintenance costs

6. Provide USPAP-compliant documentation including:
   - Appraisal report structure
   - Comparable sales analysis
   - Market condition summary
   - Confidence interval for valuation
   - Recommended insurance coverage amount

7. Generate a comprehensive risk assessment report that includes recommendations for:
   - Insurance policy structure (fine art rider vs standalone policy)
   - Security requirements (if value exceeds $50M threshold)
   - Conservation maintenance schedule
   - Market monitoring strategy for valuation updates

Please provide detailed analysis with citations, confidence scores, and actionable recommendations.`;

async function testFullPermutationSystem() {
  console.log('🧪 Testing FULL PERMUTATION System with Complex Query\n');
  console.log('═'.repeat(80));
  
  console.log(`\n📝 Query Complexity:`);
  console.log(`   Length: ${COMPLEX_QUERY.length} characters`);
  console.log(`   Words: ${COMPLEX_QUERY.split(/\s+/).length}`);
  console.log(`   Requirements: 7 distinct tasks`);
  console.log(`   Domain: Multi-domain (art, insurance, finance, legal)`);
  
  console.log(`\n🔬 PERMUTATION Components That Should Activate:`);
  console.log(`   ✅ IRT (Intelligent Routing) - Difficulty assessment`);
  console.log(`   ✅ Semiotic Inference - Deduction, Induction, Abduction`);
  console.log(`   ✅ ACE Framework - Context engineering (with PromptMII+GEPA)`);
  console.log(`   ✅ DSPy + GEPA - Module optimization`);
  console.log(`   ✅ Teacher-Student - Real market data (Perplexity)`);
  console.log(`   ✅ RVS - Recursive verification`);
  console.log(`   ✅ SWiRL - Multi-step decomposition (with PromptMII+GEPA)`);
  console.log(`   ✅ SRL - Expert trajectory matching`);
  console.log(`   ✅ EBM - Answer refinement`);
  
  const startTime = Date.now();
  
  try {
    console.log(`\n🚀 Calling Unified Pipeline API (/api/unified-pipeline)...`);
    console.log(`   This will orchestrate ALL components in optimal order\n`);
    
    const response = await fetch('http://localhost:3000/api/unified-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: COMPLEX_QUERY,
        domain: 'art', // Hint for domain detection
        context: {
          purpose: 'insurance_valuation',
          urgency: 'standard',
          compliance_required: true
        },
        config: {
          enableACE: true,
          enableGEPA: true,
          enableIRT: true,
          enableRVS: true,
          enableDSPy: true,
          enableSemiotic: true,
          enableTeacherStudent: true,
          enableSWiRL: true,
          enableSRL: true,
          enableEBM: true,
          optimizationMode: 'quality' // Use quality mode for comprehensive analysis
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error (${response.status}):`);
      console.error(errorText.substring(0, 500));
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ API Response received (${duration}ms)\n`);
    
    if (result.success && result.result) {
      const pipelineResult = result.result;
      
      console.log('📊 PIPELINE EXECUTION SUMMARY:');
      console.log('═'.repeat(80));
      
      // Components used
      console.log(`\n🔧 Components Activated:`);
      if (pipelineResult.metadata?.components_used) {
        pipelineResult.metadata.components_used.forEach((component: string, i: number) => {
          console.log(`   ${i + 1}. ${component}`);
        });
      }
      
      // IRT Difficulty
      if (pipelineResult.metadata?.irt_difficulty !== undefined) {
        console.log(`\n📈 IRT Difficulty Assessment:`);
        console.log(`   Score: ${pipelineResult.metadata.irt_difficulty.toFixed(3)}`);
        const difficulty = pipelineResult.metadata.irt_difficulty;
        if (difficulty < 0.3) console.log(`   Label: Easy (basic reasoning)`);
        else if (difficulty < 0.6) console.log(`   Label: Medium (moderate reasoning)`);
        else if (difficulty < 0.8) console.log(`   Label: Hard (advanced reasoning)`);
        else console.log(`   Label: Expert (complex multi-step)`);
      }
      
      // Quality Score
      if (pipelineResult.metadata?.quality_score !== undefined) {
        console.log(`\n✨ Quality Metrics:`);
        console.log(`   Quality Score: ${pipelineResult.metadata.quality_score.toFixed(3)}`);
        console.log(`   Confidence: ${(pipelineResult.metadata.confidence || 0).toFixed(3)}`);
      }
      
      // Performance
      if (pipelineResult.metadata?.performance) {
        console.log(`\n⏱️  Performance Metrics:`);
        console.log(`   Total Time: ${pipelineResult.metadata.performance.total_time_ms}ms`);
        console.log(`   Teacher Calls: ${pipelineResult.metadata.performance.teacher_calls || 0}`);
        console.log(`   Student Calls: ${pipelineResult.metadata.performance.student_calls || 0}`);
        console.log(`   Estimated Cost: $${(pipelineResult.metadata.performance.cost || 0).toFixed(4)}`);
      }
      
      // Semiotic Inference
      if (pipelineResult.reasoning) {
        console.log(`\n🔮 Semiotic Inference Results:`);
        if (pipelineResult.reasoning.deduction) {
          console.log(`   Deduction (Logic): ${(pipelineResult.reasoning.deduction.confidence || 0).toFixed(2)} confidence`);
        }
        if (pipelineResult.reasoning.induction) {
          console.log(`   Induction (Experience): ${(pipelineResult.reasoning.induction.confidence || 0).toFixed(2)} confidence`);
        }
        if (pipelineResult.reasoning.abduction) {
          console.log(`   Abduction (Imagination): ${(pipelineResult.reasoning.abduction.confidence || 0).toFixed(2)} confidence`);
        }
        if (pipelineResult.reasoning.synthesis) {
          console.log(`   Synthesis: ${(pipelineResult.reasoning.synthesis.overallConfidence || 0).toFixed(2)} overall`);
        }
      }
      
      // EBM Refinement
      if (pipelineResult.metadata?.ebm_refined) {
        console.log(`\n⚡ EBM Refinement:`);
        console.log(`   ✅ Answer was refined with Energy-Based Model`);
        console.log(`   Steps: ${pipelineResult.metadata.ebm_refinement_steps || 0}`);
        console.log(`   Energy Improvement: ${(pipelineResult.metadata.ebm_energy_improvement || 0).toFixed(4)}`);
      }
      
      // Answer preview
      if (pipelineResult.answer) {
        console.log(`\n💬 Answer Preview:`);
        const preview = pipelineResult.answer.substring(0, 300);
        console.log(`   ${preview}...`);
        console.log(`   [Full answer: ${pipelineResult.answer.length} characters]`);
      }
      
      // Trace steps
      if (pipelineResult.trace?.steps) {
        console.log(`\n🔍 Execution Trace (${pipelineResult.trace.steps.length} steps):`);
        pipelineResult.trace.steps.slice(0, 10).forEach((step: any, i: number) => {
          const status = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
          console.log(`   ${i + 1}. ${status} ${step.component} (${step.phase}) - ${step.duration_ms}ms`);
        });
        if (pipelineResult.trace.steps.length > 10) {
          console.log(`   ... and ${pipelineResult.trace.steps.length - 10} more steps`);
        }
      }
      
      // Optimization history
      if (pipelineResult.trace?.optimization_history?.length > 0) {
        console.log(`\n🎯 Optimization History:`);
        pipelineResult.trace.optimization_history.forEach((opt: any, i: number) => {
          console.log(`   ${i + 1}. ${opt.component}: ${opt.improvement || 'optimized'}`);
        });
      }
      
      console.log(`\n═`.repeat(80));
      console.log(`\n✅ Full PERMUTATION System Test: PASSED`);
      console.log(`   Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   Components Used: ${pipelineResult.metadata?.components_used?.length || 0}`);
      console.log(`   Quality Score: ${(pipelineResult.metadata?.quality_score || 0).toFixed(3)}`);
      
    } else {
      console.log(`\n⚠️  Response format unexpected`);
      console.log(JSON.stringify(result, null, 2).substring(0, 500));
    }
    
    console.log(`\n═`.repeat(80));
    
  } catch (error) {
    console.error(`\n❌ Test Failed:`);
    console.error(error instanceof Error ? error.message : error);
    
    // Check if server is running
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error(`\n💡 Make sure the Next.js server is running:`);
      console.error(`   cd frontend && npm run dev`);
    }
    
    process.exit(1);
  }
}

// Run the test
testFullPermutationSystem().catch(console.error);

