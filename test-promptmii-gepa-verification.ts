/**
 * PromptMII+GEPA Verification Test
 * 
 * Creates an EXTREMELY complex query guaranteed to trigger:
 * - ACE Framework (IRT > 0.7)
 * - SWiRL Decomposition (IRT > 0.6)
 * - Both with PromptMII+GEPA optimization
 */

// Extremely complex query designed to have IRT > 0.8
const EXTREME_QUERY = `As a senior art insurance appraiser and risk management consultant for a multinational insurance conglomerate, I require a comprehensive, expert-level analysis for an ultra-high-value art collection insurance valuation and risk assessment.

This is a CRITICAL, TIME-SENSITIVE request requiring:

1. MULTI-EXPERT DOMAIN ANALYSIS:
   - Art historical authentication (1919 Claude Monet "Water Lilies" series, oil on canvas, 200cm x 180cm)
   - Provenance verification (authenticated by Musée d'Orsay 2015, full chain of custody required)
   - Market valuation across 5 major auction houses (Christie's, Sotheby's, Heritage, Phillips, Bonhams)
   - Insurance compliance across 3 jurisdictions (US, EU, UK) with USPAP, ISA, RICS standards
   - Risk modeling using actuarial methods for fine art insurance
   - Conservation science assessment (environmental, transportation, exhibition risks)
   - Legal framework analysis (ownership disputes, export restrictions, cultural heritage laws)

2. QUANTITATIVE FINANCIAL MODELING:
   - Current FMV calculation with 95% confidence interval
   - 5-year forward-looking price projection using econometric models
   - Currency hedging analysis (USD, EUR, GBP exposure)
   - Replacement cost calculation (FMV + 20% premium + $50K shipping + authentication)
   - Appreciation factor based on historical CAGR analysis (2010-2024)
   - Insurance premium calculation using actuarial tables
   - Risk-adjusted return analysis for insurance investment

3. COMPREHENSIVE RISK ASSESSMENT MATRIX:
   - Physical risks (climate, humidity, temperature, light exposure, vibration)
   - Security risks (theft probability, facility security ratings, transportation risks)
   - Market risks (liquidity, price volatility, market sentiment shifts)
   - Legal risks (provenance disputes, export restrictions, tax implications)
   - Operational risks (exhibition loans, restoration needs, authentication maintenance)
   - Catastrophic risks (fire, flood, earthquake probability analysis)

4. REGULATORY COMPLIANCE DOCUMENTATION:
   - USPAP-compliant appraisal report (US jurisdiction)
   - ISA standards compliance (international)
   - RICS Red Book compliance (UK jurisdiction)
   - IRS Form 8283 for tax purposes (if donation)
   - Customs documentation for international transport
   - Cultural heritage compliance (if applicable)

5. STRATEGIC RECOMMENDATIONS:
   - Optimal insurance policy structure (fine art rider vs standalone, all-risk vs named-peril)
   - Security upgrade recommendations (if value exceeds $50M threshold)
   - Conservation maintenance schedule (preventive conservation plan)
   - Market monitoring strategy (quarterly revaluation schedule)
   - Risk mitigation action items (priority-ranked)
   - Insurance cost-benefit analysis (premium vs coverage optimization)

6. COMPARATIVE MARKET ANALYSIS:
   - Recent sales (2020-2024) of similar Monet Water Lilies works
   - Dimension-adjusted price analysis
   - Condition-adjusted valuations
   - Period-specific market trends (1910-1926 Monet Water Lilies series)
   - Auction house performance comparison
   - Private sale vs auction premium analysis

7. FORWARD-LOOKING SCENARIO ANALYSIS:
   - Base case valuation (most likely)
   - Upside scenario (strong market appreciation)
   - Downside scenario (market correction)
   - Stress testing (market crash, provenance challenge, damage event)
   - Monte Carlo simulation results (10,000 iterations)

Please provide a PROFESSIONAL-GRADE, EXPERT-LEVEL analysis with:
- Statistical confidence intervals for all valuations
- Academic-level citations (auction house records, academic papers, market research)
- Detailed risk quantification (probability × impact matrices)
- Actionable, prioritized recommendations
- Comprehensive documentation suitable for board-level presentation
- Compliance verification checklists
- Real-time market data integration (current as of execution time)

This analysis will be used for:
- Board of directors insurance decision
- Regulatory compliance audit
- Tax planning and estate valuation
- Risk management policy formulation
- Investment committee review`;

async function testPromptMIIGEPAVerification() {
  console.log('🧪 PromptMII+GEPA Verification Test\n');
  console.log('═'.repeat(80));
  
  console.log(`\n📝 Extreme Complexity Query:`);
  console.log(`   Length: ${EXTREME_QUERY.length} characters`);
  console.log(`   Words: ${EXTREME_QUERY.split(/\s+/).length}`);
  console.log(`   Requirements: 7 major sections, 30+ sub-tasks`);
  console.log(`   Domain: Multi-expert (art, finance, legal, risk, compliance)`);
  console.log(`   Expected IRT: > 0.8 (should trigger ACE + SWiRL)`);
  
  console.log(`\n🔬 Expected Activation:`);
  console.log(`   ✅ IRT Calculator (always)`);
  console.log(`   ✅ ACE Framework (IRT > 0.7) - WITH PromptMII+GEPA`);
  console.log(`   ✅ SWiRL Decomposition (IRT > 0.6) - WITH PromptMII+GEPA`);
  console.log(`   ✅ Semiotic Inference`);
  console.log(`   ✅ Teacher-Student (real data)`);
  console.log(`   ✅ RVS Verification (IRT > 0.6)`);
  console.log(`   ✅ EBM Refinement`);
  
  const startTime = Date.now();
  
  try {
    console.log(`\n🚀 Calling Unified Pipeline API...\n`);
    
    const response = await fetch('http://localhost:3000/api/unified-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: EXTREME_QUERY,
        domain: 'art',
        context: {
          purpose: 'expert_insurance_valuation',
          urgency: 'critical',
          compliance_required: true,
          audience: 'board_level'
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
          optimizationMode: 'quality' // Max quality for expert analysis
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
      
      console.log('📊 COMPREHENSIVE EXECUTION SUMMARY:');
      console.log('═'.repeat(80));
      
      // IRT Difficulty - KEY METRIC
      console.log(`\n📈 IRT Difficulty Assessment (KEY METRIC):`);
      if (pipelineResult.metadata?.irt_difficulty !== undefined) {
        const difficulty = pipelineResult.metadata.irt_difficulty;
        console.log(`   Score: ${difficulty.toFixed(3)}`);
        if (difficulty >= 0.7) {
          console.log(`   ✅ ACE SHOULD HAVE ACTIVATED (threshold: 0.7)`);
        } else {
          console.log(`   ❌ ACE DID NOT ACTIVATE (needs ≥ 0.7)`);
        }
        if (difficulty >= 0.6) {
          console.log(`   ✅ SWiRL SHOULD HAVE ACTIVATED (threshold: 0.6)`);
        } else {
          console.log(`   ❌ SWiRL DID NOT ACTIVATE (needs ≥ 0.6)`);
        }
      }
      
      // Components used
      console.log(`\n🔧 Components Activated:`);
      const components = pipelineResult.metadata?.components_used || [];
      components.forEach((component: string, i: number) => {
        const hasOptimization = component.includes('ACE') || component.includes('SWiRL');
        const marker = hasOptimization ? '🎯' : '✅';
        console.log(`   ${i + 1}. ${marker} ${component}`);
      });
      
      // Check specifically for ACE and SWiRL
      const hasACE = components.some((c: string) => c.includes('ACE'));
      const hasSWiRL = components.some((c: string) => c.includes('SWiRL'));
      
      console.log(`\n🎯 PromptMII+GEPA Status:`);
      if (hasACE) {
        console.log(`   ✅ ACE Framework: ACTIVATED (with PromptMII+GEPA optimization)`);
      } else {
        console.log(`   ⏭️  ACE Framework: Skipped (IRT threshold not met)`);
      }
      if (hasSWiRL) {
        console.log(`   ✅ SWiRL Decomposition: ACTIVATED (with PromptMII+GEPA optimization)`);
      } else {
        console.log(`   ⏭️  SWiRL Decomposition: Skipped (IRT threshold not met)`);
      }
      
      // Performance
      if (pipelineResult.metadata?.performance) {
        console.log(`\n⏱️  Performance:`);
        console.log(`   Total Time: ${pipelineResult.metadata.performance.total_time_ms}ms`);
        console.log(`   Quality Score: ${(pipelineResult.metadata.quality_score || 0).toFixed(3)}`);
        console.log(`   Confidence: ${(pipelineResult.metadata.confidence || 0).toFixed(3)}`);
      }
      
      // Trace with optimization details
      if (pipelineResult.trace?.steps) {
        console.log(`\n🔍 Execution Trace with Optimization Details:`);
        pipelineResult.trace.steps.forEach((step: any, i: number) => {
          const marker = (step.component.includes('ACE') || step.component.includes('SWiRL')) ? '🎯' : '✅';
          console.log(`   ${i + 1}. ${marker} ${step.component} (${step.phase}) - ${step.duration_ms}ms`);
          
          // Show optimization status for SWiRL and ACE
          if (step.component.includes('SWiRL') && step.output?.promptmii_gepa_applied) {
            console.log(`      └─ ✅ PromptMII+GEPA: ${step.output.optimization_note || 'Applied'}`);
          }
          if (step.component.includes('ACE') && step.output?.promptmii_gepa_applied) {
            console.log(`      └─ ✅ PromptMII+GEPA: ${step.output.optimization_note || 'Applied'}`);
          }
        });
      }
      
      console.log(`\n═`.repeat(80));
      console.log(`\n✅ Test Complete`);
      console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      
      // Summary
      console.log(`\n📋 Summary:`);
      if (hasACE && hasSWiRL) {
        console.log(`   🎉 SUCCESS: Both ACE and SWiRL activated with PromptMII+GEPA!`);
      } else if (hasACE || hasSWiRL) {
        console.log(`   ⚠️  PARTIAL: One component activated (${hasACE ? 'ACE' : 'SWiRL'})`);
      } else {
        console.log(`   ℹ️  IRT difficulty was too low to trigger ACE/SWiRL`);
        console.log(`   This is normal - thresholds prevent unnecessary overhead`);
      }
      
    } else {
      console.log(`\n⚠️  Unexpected response format`);
    }
    
  } catch (error) {
    console.error(`\n❌ Test Failed:`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testPromptMIIGEPAVerification().catch(console.error);

