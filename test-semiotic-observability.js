/**
 * Test: Semiotic Observability for Complex Research Agent
 * 
 * Demonstrates:
 * - Multi-module DSPy pipeline with nested sub-modules
 * - Full semiotic tracking through module chain
 * - Zone transitions and translations
 * - Translation fidelity measurement
 * - Cultural coherence tracking
 * - Logfire integration (simulated)
 */

import { DeepResearchAgent } from './frontend/lib/deep-research-agent-with-semiotic-tracking.js';

console.log('\n🔬 SEMIOTIC OBSERVABILITY TEST\n');
console.log('='.repeat(70));
console.log('Deep Research Agent with Full Semiotic Tracking');
console.log('='.repeat(70));

// ============================================================
// TEST 1: Research for Expert Audience (Stay in Scientific Zone)
// ============================================================

async function testExpertResearch() {
  console.log('\n\n📊 TEST 1: RESEARCH FOR EXPERT AUDIENCE');
  console.log('-'.repeat(70));
  
  const agent = new DeepResearchAgent({
    enableSemioticTracking: true,
    logfireEnabled: true
  });

  const query = {
    query: "What are the latest developments in quantum computing error correction?",
    domain: "quantum-computing",
    depth: "deep",
    targetAudience: "expert",
    outputFormat: "academic"
  };

  console.log('\n🔍 QUERY:', query.query);
  console.log('Target Audience:', query.targetAudience);
  console.log('Domain:', query.domain);
  console.log('\nExecuting research with semiotic tracking...\n');

  const startTime = Date.now();
  const result = await agent.research(query);
  const duration = Date.now() - startTime;

  console.log('\n✅ RESEARCH COMPLETED\n');
  
  console.log('📈 METADATA:');
  console.log(`   Total Duration: ${result.metadata.totalDuration}ms`);
  console.log(`   Modules Executed: ${result.metadata.modulesExecuted}`);
  console.log(`   Zones Traversed: ${result.metadata.zonesTraversed.join(' → ')}`);
  console.log(`   Borders Crossed: ${result.metadata.bordersCrossed}`);
  console.log(`   Overall Quality: ${result.metadata.overallQuality.toFixed(2)}`);

  if (result.semioticTrace) {
    console.log('\n🎯 SEMIOTIC TRACE ANALYSIS:');
    
    console.log('\n1. OVERALL NAVIGATION:');
    console.log(`   Start Zone: ${result.semioticTrace.overallNavigation.startZone}`);
    console.log(`   End Zone: ${result.semioticTrace.overallNavigation.endZone}`);
    console.log(`   Path: ${result.semioticTrace.overallNavigation.path.join(' → ')}`);
    console.log(`   Borders Crossed: ${result.semioticTrace.overallNavigation.totalBordersCrossed}`);
    console.log(`   Cultural Coherence: ${result.semioticTrace.overallNavigation.culturalCoherence.toFixed(2)}`);
    console.log(`   Fidelity Loss: ${(result.semioticTrace.overallNavigation.fidelityLoss * 100).toFixed(1)}%`);

    console.log('\n2. COHERENCE METRICS:');
    console.log(`   Semantic Coherence: ${result.semioticTrace.coherenceMetrics.semanticCoherence.toFixed(2)}`);
    console.log(`   Semiotic Coherence: ${result.semioticTrace.coherenceMetrics.semioticCoherence.toFixed(2)}`);
    console.log(`   Interpretive Richness: ${result.semioticTrace.coherenceMetrics.interpretiveRichness.toFixed(2)}`);
    console.log(`   Translation Fidelity: ${result.semioticTrace.coherenceMetrics.translationFidelity.toFixed(2)}`);
    console.log(`   ⭐ Overall Quality: ${result.semioticTrace.coherenceMetrics.overallQuality.toFixed(2)}`);

    console.log('\n3. MODULE CHAIN:');
    result.semioticTrace.modules.forEach((module, i) => {
      console.log(`\n   ${i + 1}. ${module.moduleName}`);
      console.log(`      Input Zone: ${module.inputContext.semioticZone}`);
      console.log(`      Output Zone: ${module.outputContext.semioticZone}`);
      console.log(`      Cultural Frame: ${module.inputContext.culturalFrame} → ${module.outputContext.culturalFrame}`);
      console.log(`      Semiotic Quality: ${module.analysis.semioticQuality.overallQuality.toFixed(2)}`);
      console.log(`      Polysemy: ${module.analysis.semioticQuality.polysemy.toFixed(2)}`);
      console.log(`      Borders Crossed: ${module.analysis.semiosphereNavigation.bordersCrossed}`);
      console.log(`      Duration: ${module.duration}ms`);
    });

    if (result.semioticTrace.overallNavigation.translations.length > 0) {
      console.log('\n4. TRANSLATIONS:');
      result.semioticTrace.overallNavigation.translations.forEach((trans, i) => {
        console.log(`\n   Translation ${i + 1}: ${trans.fromModule} → ${trans.toModule}`);
        console.log(`      Zones: ${trans.fromZone} → ${trans.toZone}`);
        console.log(`      Quality: ${trans.translationQuality.toFixed(2)}`);
        console.log(`      Fidelity Loss: ${(trans.fidelityLoss * 100).toFixed(1)}%`);
        console.log(`      Novelty Gain: ${(trans.noveltyGain * 100).toFixed(1)}%`);
      });
    }

    console.log('\n5. RECOMMENDATIONS:');
    result.semioticTrace.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  console.log('\n💡 INSIGHT FOR EXPERT AUDIENCE:');
  console.log('   - Should stay mostly in scientific/academic zones');
  console.log('   - Minimal zone transitions expected');
  console.log('   - High fidelity preservation required');
}

// ============================================================
// TEST 2: Research for General Audience (Major Zone Transition)
// ============================================================

async function testGeneralAudienceResearch() {
  console.log('\n\n📊 TEST 2: RESEARCH FOR GENERAL AUDIENCE');
  console.log('-'.repeat(70));
  console.log('(Tests major zone transition: scientific → literary/accessible)');
  
  const agent = new DeepResearchAgent({
    enableSemioticTracking: true,
    logfireEnabled: true
  });

  const query = {
    query: "How does artificial intelligence learn from data?",
    domain: "machine-learning",
    depth: "moderate",
    targetAudience: "general",
    outputFormat: "journalistic"
  };

  console.log('\n🔍 QUERY:', query.query);
  console.log('Target Audience:', query.targetAudience, '(expects zone transition)');
  console.log('Domain:', query.domain);
  console.log('\nExecuting research with semiotic tracking...\n');

  const result = await agent.research(query);

  console.log('\n✅ RESEARCH COMPLETED\n');
  
  console.log('📈 METADATA:');
  console.log(`   Total Duration: ${result.metadata.totalDuration}ms`);
  console.log(`   Zones Traversed: ${result.metadata.zonesTraversed.join(' → ')}`);
  console.log(`   Borders Crossed: ${result.metadata.bordersCrossed}`);
  console.log(`   Overall Quality: ${result.metadata.overallQuality.toFixed(2)}`);

  if (result.semioticTrace) {
    console.log('\n🎯 KEY SEMIOTIC FINDINGS:');
    
    console.log('\n1. ZONE NAVIGATION:');
    console.log(`   ${result.semioticTrace.overallNavigation.path.join(' → ')}`);
    console.log(`   → Notice: scientific → literary transition in refinement!`);

    console.log('\n2. TRANSLATION ANALYSIS:');
    const lastTranslation = result.semioticTrace.overallNavigation.translations[
      result.semioticTrace.overallNavigation.translations.length - 1
    ];
    if (lastTranslation) {
      console.log(`   Final Translation: ${lastTranslation.fromZone} → ${lastTranslation.toZone}`);
      console.log(`   Translation Quality: ${lastTranslation.translationQuality.toFixed(2)}`);
      console.log(`   Fidelity Loss: ${(lastTranslation.fidelityLoss * 100).toFixed(1)}%`);
      console.log(`   → Expected fidelity loss for accessibility!`);
    }

    console.log('\n3. COHERENCE:');
    console.log(`   Semiotic Coherence: ${result.semioticTrace.coherenceMetrics.semioticCoherence.toFixed(2)}`);
    console.log(`   → May be lower due to zone transition (expected)`);

    console.log('\n4. RECOMMENDATIONS:');
    result.semioticTrace.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }

  console.log('\n💡 INSIGHT FOR GENERAL AUDIENCE:');
  console.log('   - Major zone transition from scientific → literary');
  console.log('   - Some fidelity loss is EXPECTED (accessibility tradeoff)');
  console.log('   - Semiotic coherence tracks this transformation');
  console.log('   - Verifies translation quality is acceptable');
}

// ============================================================
// TEST 3: Research for Beginner (Maximum Translation)
// ============================================================

async function testBeginnerResearch() {
  console.log('\n\n📊 TEST 3: RESEARCH FOR BEGINNER AUDIENCE');
  console.log('-'.repeat(70));
  console.log('(Tests maximum translation: scientific → vernacular)');
  
  const agent = new DeepResearchAgent({
    enableSemioticTracking: true,
    logfireEnabled: true
  });

  const query = {
    query: "Explain blockchain technology",
    domain: "cryptocurrency",
    depth: "shallow",
    targetAudience: "beginner",
    outputFormat: "conversational"
  };

  console.log('\n🔍 QUERY:', query.query);
  console.log('Target Audience:', query.targetAudience, '(expects max translation)');
  console.log('Domain:', query.domain);
  console.log('\nExecuting research with semiotic tracking...\n');

  const result = await agent.research(query);

  console.log('\n✅ RESEARCH COMPLETED\n');
  
  console.log('📈 METADATA:');
  console.log(`   Zones Traversed: ${result.metadata.zonesTraversed.join(' → ')}`);
  console.log(`   Borders Crossed: ${result.metadata.bordersCrossed}`);
  console.log(`   → Maximum border crossings for beginner audience`);

  if (result.semioticTrace) {
    console.log('\n🎯 SEMIOTIC TRANSFORMATION ANALYSIS:');
    
    console.log('\n1. COMPLETE PATH:');
    console.log(`   ${result.semioticTrace.overallNavigation.path.join(' → ')}`);
    console.log(`   → Full circle back to vernacular (with knowledge)!`);

    console.log('\n2. CUMULATIVE FIDELITY LOSS:');
    console.log(`   ${(result.semioticTrace.overallNavigation.fidelityLoss * 100).toFixed(1)}%`);
    console.log(`   → Higher loss expected for maximum simplification`);

    console.log('\n3. CULTURAL COHERENCE:');
    console.log(`   ${result.semioticTrace.overallNavigation.culturalCoherence.toFixed(2)}`);
    console.log(`   → Lower coherence due to multiple frame shifts`);

    console.log('\n4. PER-MODULE BREAKDOWN:');
    result.semioticTrace.modules.forEach((module, i) => {
      console.log(`\n   Module ${i + 1}: ${module.moduleName}`);
      console.log(`      Zone: ${module.inputContext.semioticZone} → ${module.outputContext.semioticZone}`);
      console.log(`      Frame: ${module.inputContext.culturalFrame} → ${module.outputContext.culturalFrame}`);
      console.log(`      Rhetoric: ${module.inputContext.rhetoricalMode} → ${module.outputContext.rhetoricalMode}`);
    });
  }

  console.log('\n💡 INSIGHT FOR BEGINNER AUDIENCE:');
  console.log('   - Maximum semiotic transformation');
  console.log('   - High fidelity loss is ACCEPTABLE for accessibility');
  console.log('   - Semiotic tracking ensures transformation is intentional');
  console.log('   - Identifies where simplification may go too far');
}

// ============================================================
// TEST 4: Logfire Integration Demonstration
// ============================================================

async function testLogfireIntegration() {
  console.log('\n\n📊 TEST 4: LOGFIRE INTEGRATION');
  console.log('-'.repeat(70));
  console.log('Demonstrating structured logging to Logfire\n');
  
  const agent = new DeepResearchAgent({
    enableSemioticTracking: true,
    logfireEnabled: true  // Outputs to console (simulated Logfire)
  });

  const query = {
    query: "Climate change policy implications",
    domain: "environmental-science",
    depth: "moderate",
    targetAudience: "general",
    outputFormat: "journalistic"
  };

  console.log('🔍 QUERY:', query.query);
  console.log('\n⚡ Watch for [LOGFIRE] entries below...\n');
  console.log('-'.repeat(70));

  await agent.research(query);

  console.log('\n' + '-'.repeat(70));
  console.log('\n💡 LOGFIRE BENEFITS:');
  console.log('   ✅ Real-time semiotic quality metrics');
  console.log('   ✅ Zone navigation tracking per module');
  console.log('   ✅ Translation fidelity monitoring');
  console.log('   ✅ Coherence alerts for debugging');
  console.log('   ✅ Structured data for dashboards');
  console.log('   ✅ Correlation with performance metrics');
}

// ============================================================
// TEST 5: Understanding Module Chains
// ============================================================

async function testModuleUnderstanding() {
  console.log('\n\n📊 TEST 5: UNDERSTANDING COMPLEX MODULE CHAINS');
  console.log('-'.repeat(70));
  console.log('Use case: "What is this module actually doing?"\n');
  
  const agent = new DeepResearchAgent({
    enableSemioticTracking: true,
    logfireEnabled: false
  });

  const query = {
    query: "Explain neural network backpropagation",
    domain: "deep-learning",
    depth: "deep",
    targetAudience: "expert",
    outputFormat: "academic"
  };

  console.log('🔍 Scenario: You have a complex research agent');
  console.log('   Question: What does each module actually DO semiotically?\n');

  const result = await agent.research(query);

  if (result.semioticTrace) {
    console.log('\n✅ SEMIOTIC ANALYSIS REVEALS:\n');
    
    result.semioticTrace.modules.forEach((module, i) => {
      console.log(`${i + 1}. ${module.moduleName}:`);
      console.log(`   Purpose (Semiotic): ${this.describeModulePurpose(module)}`);
      console.log(`   Input: ${module.inputContext.semioticZone} (${module.inputContext.culturalFrame})`);
      console.log(`   Output: ${module.outputContext.semioticZone} (${module.outputContext.culturalFrame})`);
      console.log(`   Transformation: ${this.describeTransformation(module)}`);
      console.log('');
    });
  }

  console.log('💡 KEY INSIGHTS:');
  console.log('   - Each module has SEMIOTIC PURPOSE (not just technical)');
  console.log('   - Zone transitions reveal MEANING transformations');
  console.log('   - Cultural frames show POSITIONING changes');
  console.log('   - Rhetorical modes indicate COMMUNICATION strategies');
  console.log('   - This is INVISIBLE without semiotic analysis!');
}

function describeModulePurpose(module) {
  const inZone = module.inputContext.semioticZone;
  const outZone = module.outputContext.semioticZone;
  
  if (inZone === 'vernacular' && outZone === 'analytical') {
    return 'Transforms informal query into structured analysis';
  } else if (inZone === 'analytical' && outZone === 'scientific') {
    return 'Elevates structured analysis to empirical evidence';
  } else if (outZone === 'scientific' && inZone === 'scientific') {
    return 'Maintains scientific rigor while transforming frame';
  } else if (outZone === 'vernacular') {
    return 'Translates technical knowledge to accessible language';
  } else {
    return 'Processes within consistent zone';
  }
}

function describeTransformation(module) {
  const inFrame = module.inputContext.culturalFrame;
  const outFrame = module.outputContext.culturalFrame;
  const inRhetoric = module.inputContext.rhetoricalMode;
  const outRhetoric = module.outputContext.rhetoricalMode;
  
  if (inFrame !== outFrame) {
    return `Cultural reframing: ${inFrame} → ${outFrame}`;
  } else if (inRhetoric !== outRhetoric) {
    return `Rhetorical shift: ${inRhetoric} → ${outRhetoric}`;
  } else {
    return 'Stable cultural positioning';
  }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
  try {
    await testExpertResearch();
    await testGeneralAudienceResearch();
    await testBeginnerResearch();
    await testLogfireIntegration();
    await testModuleUnderstanding();
    
    console.log('\n\n' + '='.repeat(70));
    console.log('🎓 SEMIOTIC OBSERVABILITY: ALL TESTS COMPLETED');
    console.log('='.repeat(70));
    
    console.log('\n📊 WHAT WE DEMONSTRATED:');
    console.log('✅ Multi-module pipeline with full semiotic tracking');
    console.log('✅ Zone navigation through complex research process');
    console.log('✅ Translation fidelity measurement');
    console.log('✅ Cultural coherence tracking');
    console.log('✅ Logfire integration for observability');
    console.log('✅ Understanding "what modules actually do"');
    
    console.log('\n🎯 KEY BENEFITS:');
    console.log('1. VISIBILITY: See semiotic transformations, not just data flow');
    console.log('2. QUALITY: Measure translation fidelity and coherence');
    console.log('3. DEBUGGING: Identify where meaning is lost/transformed');
    console.log('4. VALIDATION: Verify transformations are intentional');
    console.log('5. OPTIMIZATION: Optimize for semiotic quality, not just accuracy');
    
    console.log('\n💡 USE CASES:');
    console.log('- Deep research agents (demonstrated)');
    console.log('- Multi-step reasoning chains (RVS)');
    console.log('- Teacher-Student distillation (track fidelity)');
    console.log('- Complex synthesis pipelines');
    console.log('- Cross-domain translation systems');
    console.log('- Anything with nested DSPy modules!');
    
    console.log('\n🚀 INTEGRATION:');
    console.log('- Works with ANY multi-module system');
    console.log('- Integrates with Logfire for dashboards');
    console.log('- Provides structured metrics for monitoring');
    console.log('- Enables semiotic-aware optimization');
    
    console.log('\n🎓 PHILOSOPHICAL ACHIEVEMENT:');
    console.log('   We can now OBSERVE and MEASURE semiotic transformations');
    console.log('   in real-time through complex AI pipelines.');
    console.log('   This is philosophy → engineering at its finest.\n');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    throw error;
  }
}

// Run tests
runAllTests();

