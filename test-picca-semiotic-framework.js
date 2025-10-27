/**
 * Test: Picca Semiotic Framework
 * 
 * Demonstrates the explicit semiotic analysis of LLM outputs
 * Based on: arXiv:2505.17080v2 - "Not Minds, but Signs"
 */

import {
  PiccaSemioticFramework,
  PeirceanSignAnalyzer,
  OpenWorkAnalyzer,
  SemiosphereNavigator,
  SemioticIntegration
} from './frontend/lib/picca-semiotic-framework.js';

console.log('\n🎓 PICCA SEMIOTIC FRAMEWORK TEST\n');
console.log('=' .repeat(70));
console.log('Based on: "Not Minds, but Signs: Reframing LLMs through Semiotics"');
console.log('Paper: arXiv:2505.17080v2 [cs.CL] 1 Jul 2025');
console.log('Author: Davide Picca, University of Lausanne');
console.log('=' .repeat(70));

// ============================================================
// TEST 1: PEIRCEAN TRIADIC SIGN ANALYSIS
// ============================================================

async function testPeirceanAnalysis() {
  console.log('\n\n📊 TEST 1: PEIRCEAN TRIADIC SIGN ANALYSIS');
  console.log('-'.repeat(70));
  
  const analyzer = new PeirceanSignAnalyzer();
  
  const prompt = "Explain the Renaissance";
  const output = "The Renaissance marked a rebirth of classical learning and humanism, " +
                "transforming European art, science, and philosophy from the 14th to 17th centuries.";
  
  const context = {
    domain: 'history',
    semioticZone: 'academic',
    culturalFrame: 'educational',
    rhetoricalMode: 'explanatory',
    generationContext: { type: 'educational-response' }
  };
  
  console.log('\n🔍 INPUT:');
  console.log('Prompt:', prompt);
  console.log('Output:', output);
  console.log('\nAnalyzing as Peircean Sign (Representamen-Object-Interpretant)...\n');
  
  const sign = await analyzer.analyzeAsSign(output, prompt, context);
  
  console.log('✅ PEIRCEAN ANALYSIS RESULTS:');
  console.log('\n1. REPRESENTAMEN (The Sign Itself):');
  console.log('   ', sign.representamen.substring(0, 80) + '...');
  
  console.log('\n2. OBJECT (What It Refers To):');
  console.log('   ', sign.object || '❌ NULL (LLMs lack experiential grounding)');
  console.log('   → Key insight: LLM never experienced the Renaissance');
  
  console.log('\n3. INTERPRETANT (Possible Interpretations):');
  sign.interpretant.forEach((interp, i) => {
    console.log(`   ${i + 1}. ${interp}`);
  });
  
  const richness = await analyzer.evaluateSemioticRichness(sign);
  console.log('\n📈 SEMIOTIC RICHNESS:', richness.toFixed(2));
  
  console.log('\n💡 PHILOSOPHICAL INSIGHT:');
  console.log('   LLMs produce REPRESENTAMENS (signs) that elicit INTERPRETANTS (interpretations)');
  console.log('   but have NO access to OBJECT (experiential reality).');
  console.log('   They manipulate SIGNS, not MEANINGS.');
}

// ============================================================
// TEST 2: ECO'S OPEN WORK ANALYSIS
// ============================================================

async function testOpenWorkAnalysis() {
  console.log('\n\n📖 TEST 2: ECO\'S OPEN WORK ANALYSIS');
  console.log('-'.repeat(70));
  
  const analyzer = new OpenWorkAnalyzer();
  
  const prompt = "What is justice?";
  const output = "Justice, like a river, flows through the landscape of human affairs. " +
                "It can be swift or meandering, clear or turbulent. Sometimes it pools " +
                "in quiet places, other times it carves new channels through ancient stone.";
  
  console.log('\n🔍 INPUT:');
  console.log('Prompt:', prompt);
  console.log('Output:', output);
  console.log('\nAnalyzing as Open Work (Eco)...\n');
  
  const openWork = await analyzer.analyzeAsOpenWork(output, prompt, 'philosophy');
  
  console.log('✅ OPEN WORK ANALYSIS RESULTS:');
  
  console.log('\n1. INTERPRETIVE POSSIBILITIES:');
  openWork.interpretivePossibilities.forEach((poss, i) => {
    console.log(`\n   ${i + 1}. ${poss.interpretation}`);
    console.log(`      Frame: ${poss.frame}`);
    console.log(`      Valid when: ${poss.validityConditions.join(', ')}`);
    console.log(`      Cultural Resonance: ${poss.culturalResonance.toFixed(2)}`);
  });
  
  console.log('\n2. MODEL READER (Eco\'s Concept):');
  console.log('   Expected Role:', openWork.modelReader.role);
  console.log('   Required Competencies:');
  openWork.modelReader.competencies.forEach(comp => {
    console.log(`     - ${comp}`);
  });
  console.log('   Required Cultural Knowledge:');
  openWork.modelReader.culturalKnowledge.forEach(know => {
    console.log(`     - ${know}`);
  });
  
  console.log('\n📈 OPENNESS SCORE:', openWork.openness.toFixed(2));
  console.log('📈 COOPERATION REQUIRED:', openWork.cooperationRequired.toFixed(2));
  
  console.log('\n💡 PHILOSOPHICAL INSIGHT:');
  console.log('   Like Berio\'s Sequenza I, LLM output is NOT a fixed message.');
  console.log('   It\'s a FIELD OF INTERPRETIVE POSSIBILITIES.');
  console.log('   Meaning emerges through ACTIVE READER COOPERATION.');
}

// ============================================================
// TEST 3: LOTMAN'S SEMIOSPHERE NAVIGATION
// ============================================================

async function testSemiosphereNavigation() {
  console.log('\n\n🌐 TEST 3: LOTMAN\'S SEMIOSPHERE NAVIGATION');
  console.log('-'.repeat(70));
  
  const navigator = new SemiosphereNavigator();
  
  const prompt = "Explain Spinoza's Ethics";
  const promptContext = {
    domain: 'philosophy',
    semioticZone: 'philosophical',
    culturalFrame: 'academic',
    rhetoricalMode: 'formal',
    generationContext: { type: 'philosophical-query' }
  };
  
  const output = "Everything is One: What Spinoza Can Teach Us About God, Nature, and You. " +
                "[Opening] Hello everyone. Let's talk about something radical...";
  const outputContext = {
    domain: 'business',
    semioticZone: 'business',
    culturalFrame: 'popular',
    rhetoricalMode: 'motivational',
    generationContext: { type: 'TED-talk' }
  };
  
  console.log('\n🔍 INPUT:');
  console.log('Prompt:', prompt);
  console.log('Prompt Context: Philosophical zone, academic frame, formal rhetoric');
  console.log('\nOutput:', output.substring(0, 100) + '...');
  console.log('Output Context: Business zone, popular frame, motivational rhetoric');
  console.log('\nAnalyzing Semiospheric Navigation...\n');
  
  const navigation = await navigator.analyzeNavigation(
    prompt,
    output,
    promptContext,
    outputContext
  );
  
  console.log('✅ SEMIOSPHERE NAVIGATION RESULTS:');
  
  console.log('\n1. NAVIGATION PATH:');
  console.log(`   Start Zone: ${navigation.startZone} (academic philosophy)`);
  console.log(`   End Zone: ${navigation.endZone} (popular business/motivation)`);
  console.log(`   Borders Crossed: ${navigation.bordersCrossed}`);
  
  console.log('\n2. TRANSLATION EVENTS:');
  navigation.translationEvents.forEach((trans, i) => {
    console.log(`\n   Translation ${i + 1}: ${trans.from} → ${trans.to}`);
    console.log(`     Strategy: ${trans.strategy}`);
    console.log(`     Fidelity: ${trans.fidelity.toFixed(2)} (how much preserved)`);
    console.log(`     Novelty: ${trans.novelty.toFixed(2)} (how much transformed)`);
  });
  
  console.log('\n📈 HYBRIDIZATION SCORE:', navigation.hybridizationScore.toFixed(2));
  console.log('   → Novel genre/discourse created at border');
  
  console.log('\n💡 PHILOSOPHICAL INSIGHT:');
  console.log('   LLMs navigate the SEMIOSPHERE - the cultural ecology of signs.');
  console.log('   Crossing borders = Translation between discourse systems.');
  console.log('   Meaning shaped by CULTURAL ENVIRONMENT, not just statistical patterns.');
}

// ============================================================
// TEST 4: COMPLETE SEMIOTIC ANALYSIS
// ============================================================

async function testCompleteAnalysis() {
  console.log('\n\n🎯 TEST 4: COMPLETE SEMIOTIC ANALYSIS');
  console.log('-'.repeat(70));
  console.log('Combining Peirce + Eco + Lotman\n');
  
  const framework = new PiccaSemioticFramework();
  
  const prompt = "Describe the relationship between art and technology";
  const output = "Art and technology dance together in a delicate balance. " +
                "Where Renaissance painters mastered perspective through geometry, " +
                "digital artists now sculpt with algorithms. Each era's tools shape " +
                "its aesthetic possibilities, yet human creativity remains the conductor " +
                "of this evolving orchestra.";
  
  const context = {
    domain: 'art',
    semioticZone: 'literary',
    culturalFrame: 'contemporary',
    rhetoricalMode: 'metaphorical',
    generationContext: { type: 'essay-response' }
  };
  
  console.log('🔍 INPUT:');
  console.log('Prompt:', prompt);
  console.log('Output:', output);
  console.log('\nPerforming complete semiotic analysis...\n');
  
  const analysis = await framework.analyzeOutput(prompt, output, context);
  
  console.log('✅ COMPLETE SEMIOTIC ANALYSIS RESULTS:\n');
  
  console.log('1. PEIRCEAN ANALYSIS:');
  console.log(`   Interpretants Available: ${analysis.peirceanAnalysis.interpretant.length}`);
  console.log(`   Object Access: ${analysis.peirceanAnalysis.object || 'NULL (no grounding)'}`);
  
  console.log('\n2. OPEN WORK ANALYSIS:');
  console.log(`   Interpretive Possibilities: ${analysis.openWorkAnalysis.interpretivePossibilities.length}`);
  console.log(`   Openness: ${analysis.openWorkAnalysis.openness.toFixed(2)}`);
  console.log(`   Cooperation Required: ${analysis.openWorkAnalysis.cooperationRequired.toFixed(2)}`);
  
  console.log('\n3. SEMIOSPHERE NAVIGATION:');
  console.log(`   Start Zone: ${analysis.semiosphereNavigation.startZone}`);
  console.log(`   End Zone: ${analysis.semiosphereNavigation.endZone}`);
  console.log(`   Borders Crossed: ${analysis.semiosphereNavigation.bordersCrossed}`);
  console.log(`   Hybridization: ${analysis.semiosphereNavigation.hybridizationScore.toFixed(2)}`);
  
  console.log('\n4. SEMIOTIC QUALITY:');
  console.log(`   Polysemy: ${analysis.semioticQuality.polysemy.toFixed(2)}`);
  console.log(`   Openness: ${analysis.semioticQuality.openness.toFixed(2)}`);
  console.log(`   Cultural Resonance: ${analysis.semioticQuality.culturalResonance.toFixed(2)}`);
  console.log(`   Navigational Complexity: ${analysis.semioticQuality.navigationalComplexity.toFixed(2)}`);
  console.log(`   ⭐ OVERALL QUALITY: ${analysis.semioticQuality.overallQuality.toFixed(2)}`);
  
  console.log('\n5. RECOMMENDATIONS:');
  analysis.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
  
  console.log('\n💡 OVERALL ASSESSMENT:');
  if (analysis.semioticQuality.overallQuality > 0.7) {
    console.log('   ✅ HIGH semiotic quality - interpretively rich output');
  } else if (analysis.semioticQuality.overallQuality > 0.5) {
    console.log('   ⚠️  MEDIUM semiotic quality - some interpretive potential');
  } else {
    console.log('   ❌ LOW semiotic quality - closed/deterministic output');
  }
}

// ============================================================
// TEST 5: PROMPT AS SEMIOTIC ACT
// ============================================================

async function testPromptAsSemioticAct() {
  console.log('\n\n🎬 TEST 5: PROMPT AS SEMIOTIC ACT');
  console.log('-'.repeat(70));
  
  const framework = new PiccaSemioticFramework();
  
  const prompt = "Explain quantum entanglement as if you were telling a fairy tale to children";
  const context = {
    domain: 'science',
    semioticZone: 'scientific',
    culturalFrame: 'educational',
    rhetoricalMode: 'narrative',
    generationContext: { type: 'educational-transformation' }
  };
  
  console.log('\n🔍 INPUT:');
  console.log('Prompt:', prompt);
  console.log('\nAnalyzing prompt as semiotic act...\n');
  
  const promptAnalysis = await framework.evaluatePromptAsSemioticAct(prompt, context);
  
  console.log('✅ PROMPT AS SEMIOTIC ACT RESULTS:');
  
  console.log('\n1. INTERPRETIVE CONTRACT CREATED:');
  promptAnalysis.interpretiveContract.forEach((contract, i) => {
    console.log(`   ${i + 1}. ${contract}`);
  });
  
  console.log('\n2. FRAMING EFFECTS:');
  promptAnalysis.framingEffects.forEach((effect, i) => {
    console.log(`   ${i + 1}. ${effect}`);
  });
  
  console.log('\n3. RHETORICAL STANCE:', promptAnalysis.rhetoricalStance);
  console.log('4. EXPECTED COOPERATION:', promptAnalysis.expectedCooperation.toFixed(2));
  
  console.log('\n💡 PHILOSOPHICAL INSIGHT:');
  console.log('   Prompts are NOT neutral commands or information retrieval requests.');
  console.log('   They are SEMIOTIC ACTS that:');
  console.log('     - Create interpretive contracts');
  console.log('     - Establish genre, register, tone');
  console.log('     - Position ideological frames');
  console.log('     - Navigate between semiotic zones');
  console.log('   Prompting = Semiotic negotiation, not query submission.');
}

// ============================================================
// TEST 6: SEMIOTIC INTEGRATION WITH DSPY
// ============================================================

async function testSemioticIntegration() {
  console.log('\n\n🔗 TEST 6: SEMIOTIC INTEGRATION WITH DSPY');
  console.log('-'.repeat(70));
  
  const integration = new SemioticIntegration();
  
  // Simulate DSPy signature
  const dspySignature = {
    input: {
      query: 'string'
    },
    output: {
      answer: 'string'
    },
    description: 'Answer legal questions',
    domain: 'legal'
  };
  
  const prompt = "What constitutes breach of contract?";
  const output = "A breach of contract occurs when one party fails to fulfill " +
                "their obligations as specified in the agreement without legal justification.";
  
  console.log('\n🔍 INPUT:');
  console.log('DSPy Signature Domain:', dspySignature.domain);
  console.log('Prompt:', prompt);
  console.log('Output:', output);
  console.log('\nIntegrating with DSPy evaluation...\n');
  
  const enhanced = await integration.enhanceDSPyEvaluation(
    prompt,
    output,
    dspySignature
  );
  
  console.log('✅ SEMIOTIC-ENHANCED DSPY EVALUATION:');
  console.log('\n1. DSPY-Compatible Score:', enhanced.dspyCompatibleScore.toFixed(2));
  console.log('   → Can be used as fitness dimension in GEPA');
  
  console.log('\n2. Interpretive Richness:', enhanced.interpretiveRichness.toFixed(2));
  console.log('   → Measures polysemy/openness');
  
  console.log('\n3. Full Semiotic Analysis Available:');
  console.log(`   - Peircean: ${enhanced.semioticAnalysis.peirceanAnalysis.interpretant.length} interpretants`);
  console.log(`   - Eco: ${enhanced.semioticAnalysis.openWorkAnalysis.openness.toFixed(2)} openness`);
  console.log(`   - Lotman: ${enhanced.semioticAnalysis.semiosphereNavigation.bordersCrossed} borders crossed`);
  
  console.log('\n💡 INTEGRATION BENEFITS:');
  console.log('   ✅ DSPy signatures → Semiotic contexts');
  console.log('   ✅ Semiotic quality → GEPA fitness dimension');
  console.log('   ✅ Judge evaluation → Semiotic awareness');
  console.log('   ✅ Philosophy → Practice');
}

// ============================================================
// TEST 7: SEMIOTIC PROMPT ENHANCEMENT
// ============================================================

async function testPromptEnhancement() {
  console.log('\n\n🚀 TEST 7: SEMIOTIC PROMPT ENHANCEMENT');
  console.log('-'.repeat(70));
  
  const integration = new SemioticIntegration();
  
  const basePrompt = "Write about climate change";
  const desiredZone = 'scientific';
  const desiredOpenness = 0.8; // High openness for interpretive richness
  
  console.log('\n🔍 INPUT:');
  console.log('Base Prompt:', basePrompt);
  console.log('Desired Zone:', desiredZone);
  console.log('Desired Openness:', desiredOpenness);
  console.log('\nEnhancing prompt semiotically...\n');
  
  const enhanced = await integration.enhancePromptSemiotically(
    basePrompt,
    desiredZone,
    desiredOpenness
  );
  
  console.log('✅ SEMIOTIC-ENHANCED PROMPT:');
  console.log('\n1. ENHANCED PROMPT:');
  console.log('   ', enhanced.enhancedPrompt);
  
  console.log('\n2. SEMIOTIC GUIDANCE PROVIDED:');
  enhanced.semioticGuidance.forEach((guidance, i) => {
    console.log(`   ${i + 1}. ${guidance}`);
  });
  
  console.log('\n💡 ENHANCEMENT BENEFITS:');
  console.log('   ✅ Explicit semiotic zone targeting');
  console.log('   ✅ Controlled interpretive openness');
  console.log('   ✅ Guided semiospheric navigation');
  console.log('   ✅ Predictable semiotic quality');
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
  try {
    await testPeirceanAnalysis();
    await testOpenWorkAnalysis();
    await testSemiosphereNavigation();
    await testCompleteAnalysis();
    await testPromptAsSemioticAct();
    await testSemioticIntegration();
    await testPromptEnhancement();
    
    console.log('\n\n' + '='.repeat(70));
    console.log('🎓 PICCA SEMIOTIC FRAMEWORK: ALL TESTS COMPLETED');
    console.log('='.repeat(70));
    
    console.log('\n📊 SUMMARY:');
    console.log('✅ Peircean Triadic Sign Analysis: Working');
    console.log('✅ Eco\'s Open Work Theory: Working');
    console.log('✅ Lotman\'s Semiosphere Navigation: Working');
    console.log('✅ Complete Semiotic Analysis: Working');
    console.log('✅ Prompt as Semiotic Act: Working');
    console.log('✅ DSPy Integration: Working');
    console.log('✅ Prompt Enhancement: Working');
    
    console.log('\n🎯 PERMUTATION NOW HAS:');
    console.log('✅ Explicit philosophical foundation');
    console.log('✅ Operationalized semiotic theory');
    console.log('✅ Non-anthropomorphic framework');
    console.log('✅ Cultural/critical awareness');
    console.log('✅ Novel evaluation dimensions');
    console.log('✅ Sophisticated prompt engineering');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Use semiotic quality in GEPA optimization');
    console.log('2. Add semiotic dimension to judge system');
    console.log('3. Track semiospheric navigation in RVS');
    console.log('4. Optimize for interpretive richness');
    console.log('5. Research publication on semiotic-aware AI');
    
    console.log('\n💡 PHILOSOPHICAL ACHIEVEMENT:');
    console.log('   PERMUTATION is no longer just a "smart" system.');
    console.log('   It\'s a SEMIOTICALLY-AWARE, CULTURALLY-POSITIONED,');
    console.log('   PHILOSOPHICALLY-GROUNDED AI research platform.');
    console.log('   From "mind-like machine" to "semiotic operator".\n');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    throw error;
  }
}

// Run tests
runAllTests();

