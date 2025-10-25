/**
 * DETAILED PERMUTATION AI RESPONSE TEST
 * 
 * This test shows the actual response structure to verify
 * that all Permutation AI components are working and returning data.
 */

const API_BASE = 'http://localhost:3001/api';

async function testDetailedPermutationResponse() {
  console.log('🔍 DETAILED PERMUTATION AI RESPONSE TEST');
  console.log('========================================\n');

  try {
    // ============================================================
    // TEST TEACHER-STUDENT-JUDGE ADVANCED RESPONSE
    // ============================================================
    console.log('🎓 TESTING TEACHER-STUDENT-JUDGE ADVANCED RESPONSE');
    console.log('================================================\n');

    const teacherStudentJudgeRequest = {
      artwork: {
        title: 'The Starry Night',
        artist: 'Vincent van Gogh',
        year: '1889',
        medium: ['Oil on Canvas'],
        dimensions: '73.7 cm × 92.1 cm',
        condition: 'Excellent',
        provenance: ['Museum of Modern Art, New York'],
        signatures: ['Signed and dated'],
        period: 'Post-Impressionist',
        style: 'Expressionist'
      },
      purpose: 'insurance'
    };

    console.log('🎓 Sending Teacher-Student-Judge request...');
    const teacherStudentResponse = await fetch(`${API_BASE}/teacher-student-judge-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherStudentJudgeRequest)
    });

    const teacherStudentResult = await teacherStudentResponse.json();
    
    console.log('📊 TEACHER-STUDENT-JUDGE RESPONSE STRUCTURE:');
    console.log('==========================================');
    console.log('✅ Success:', teacherStudentResult.success);
    console.log('📊 Data Structure:');
    console.log('   - Teacher:', teacherStudentResult.data?.teacher ? 'PRESENT' : 'MISSING');
    console.log('   - Student:', teacherStudentResult.data?.student ? 'PRESENT' : 'MISSING');
    console.log('   - Judge:', teacherStudentResult.data?.judge ? 'PRESENT' : 'MISSING');
    console.log('   - PermutationAI:', teacherStudentResult.data?.permutationAI ? 'PRESENT' : 'MISSING');
    
    if (teacherStudentResult.data?.teacher) {
      console.log('\n🎓 TEACHER COMPONENT DETAILS:');
      console.log('   - Confidence:', teacherStudentResult.data.teacher.confidence);
      console.log('   - Data Sources:', teacherStudentResult.data.teacher.dataSources);
      console.log('   - ACE Context:', teacherStudentResult.data.teacher.aceContext ? 'PRESENT' : 'MISSING');
      console.log('   - AX-LLM Reasoning:', teacherStudentResult.data.teacher.axLlmReasoning ? 'PRESENT' : 'MISSING');
      console.log('   - GEPA Evolution:', teacherStudentResult.data.teacher.gepaEvolution ? 'PRESENT' : 'MISSING');
      console.log('   - DSPy Optimization:', teacherStudentResult.data.teacher.dspyOptimization ? 'PRESENT' : 'MISSING');
      console.log('   - PromptMii Analysis:', teacherStudentResult.data.teacher.promptMiiAnalysis ? 'PRESENT' : 'MISSING');
      console.log('   - SWiRL Optimization:', teacherStudentResult.data.teacher.swirlOptimization ? 'PRESENT' : 'MISSING');
      console.log('   - TRM Reasoning:', teacherStudentResult.data.teacher.trmReasoning ? 'PRESENT' : 'MISSING');
      console.log('   - GraphRAG Analysis:', teacherStudentResult.data.teacher.graphRagAnalysis ? 'PRESENT' : 'MISSING');
    }
    
    if (teacherStudentResult.data?.student) {
      console.log('\n🎓 STUDENT COMPONENT DETAILS:');
      console.log('   - Learning Score:', teacherStudentResult.data.student.learningScore);
      console.log('   - Adaptation Factors:', teacherStudentResult.data.student.adaptationFactors);
      console.log('   - SWiRL Improvement:', teacherStudentResult.data.student.swirlImprovement ? 'PRESENT' : 'MISSING');
    }
    
    if (teacherStudentResult.data?.judge) {
      console.log('\n🎓 JUDGE COMPONENT DETAILS:');
      console.log('   - Agreement Score:', teacherStudentResult.data.judge.agreementScore);
      console.log('   - Self-Training Effectiveness:', teacherStudentResult.data.judge.selfTrainingEffectiveness);
      console.log('   - TRM Evaluation:', teacherStudentResult.data.judge.trmEvaluation ? 'PRESENT' : 'MISSING');
    }
    
    if (teacherStudentResult.data?.permutationAI) {
      console.log('\n🎓 PERMUTATION AI COMPONENT DETAILS:');
      console.log('   - ACE:', teacherStudentResult.data.permutationAI.ace ? 'PRESENT' : 'MISSING');
      console.log('   - AX-LLM:', teacherStudentResult.data.permutationAI.axLlm ? 'PRESENT' : 'MISSING');
      console.log('   - GEPA:', teacherStudentResult.data.permutationAI.gepa ? 'PRESENT' : 'MISSING');
      console.log('   - DSPy:', teacherStudentResult.data.permutationAI.dspy ? 'PRESENT' : 'MISSING');
      console.log('   - PromptMii:', teacherStudentResult.data.permutationAI.promptMii ? 'PRESENT' : 'MISSING');
      console.log('   - SWiRL:', teacherStudentResult.data.permutationAI.swirl ? 'PRESENT' : 'MISSING');
      console.log('   - TRM:', teacherStudentResult.data.permutationAI.trm ? 'PRESENT' : 'MISSING');
      console.log('   - GraphRAG:', teacherStudentResult.data.permutationAI.graphRag ? 'PRESENT' : 'MISSING');
    }

    // ============================================================
    // TEST ADVANCED VALUATION ANALYSIS RESPONSE
    // ============================================================
    console.log('\n🎨 TESTING ADVANCED VALUATION ANALYSIS RESPONSE');
    console.log('==============================================\n');

    const advancedValuationRequest = {
      artwork: {
        title: 'The Starry Night',
        artist: 'Vincent van Gogh',
        year: '1889',
        medium: ['Oil on Canvas'],
        dimensions: '73.7 cm × 92.1 cm',
        condition: 'Excellent',
        provenance: ['Museum of Modern Art, New York']
      },
      baseValuation: {
        low: 80000000,
        high: 120000000,
        confidence: 0.95
      }
    };

    console.log('🎨 Sending Advanced Valuation Analysis request...');
    const advancedValuationResponse = await fetch(`${API_BASE}/advanced-valuation-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advancedValuationRequest)
    });

    const advancedValuationResult = await advancedValuationResponse.json();
    
    console.log('📊 ADVANCED VALUATION ANALYSIS RESPONSE STRUCTURE:');
    console.log('===============================================');
    console.log('✅ Success:', advancedValuationResult.success);
    console.log('📊 Data Structure:');
    console.log('   - Base Valuation:', advancedValuationResult.data?.baseValuation ? 'PRESENT' : 'MISSING');
    console.log('   - Premium Factors:', advancedValuationResult.data?.premiumFactors ? 'PRESENT' : 'MISSING');
    console.log('   - Adjusted Valuation:', advancedValuationResult.data?.adjustedValuation ? 'PRESENT' : 'MISSING');
    console.log('   - Enhancement Breakdown:', advancedValuationResult.data?.enhancementBreakdown ? 'PRESENT' : 'MISSING');
    console.log('   - Market Position (in breakdown):', advancedValuationResult.data?.enhancementBreakdown?.marketPosition ? 'PRESENT' : 'MISSING');
    console.log('   - Cross-Market Appeal (in breakdown):', advancedValuationResult.data?.enhancementBreakdown?.crossMarketAppeal ? 'PRESENT' : 'MISSING');
    console.log('   - Cultural Significance (in breakdown):', advancedValuationResult.data?.enhancementBreakdown?.culturalSignificance ? 'PRESENT' : 'MISSING');
    console.log('   - Future Potential (in breakdown):', advancedValuationResult.data?.enhancementBreakdown?.futurePotential ? 'PRESENT' : 'MISSING');
    console.log('   - Risk Assessment (in breakdown):', advancedValuationResult.data?.enhancementBreakdown?.riskAssessment ? 'PRESENT' : 'MISSING');
    
    if (advancedValuationResult.data?.enhancementBreakdown?.marketPosition) {
      console.log('\n🎨 MARKET POSITION DETAILS:');
      console.log('   - Position:', advancedValuationResult.data.enhancementBreakdown.marketPosition.position);
      console.log('   - Score:', advancedValuationResult.data.enhancementBreakdown.marketPosition.score);
      console.log('   - Factors:', advancedValuationResult.data.enhancementBreakdown.marketPosition.factors);
    }
    
    if (advancedValuationResult.data?.adjustedValuation) {
      console.log('\n🎨 ADJUSTED VALUATION DETAILS:');
      console.log('   - Low:', advancedValuationResult.data.adjustedValuation.low);
      console.log('   - High:', advancedValuationResult.data.adjustedValuation.high);
      console.log('   - Most Likely:', advancedValuationResult.data.adjustedValuation.mostLikely);
      console.log('   - Confidence:', advancedValuationResult.data.adjustedValuation.confidence);
    }

    // ============================================================
    // TEST FINAL ART VALUATION RESPONSE
    // ============================================================
    console.log('\n🎯 TESTING FINAL ART VALUATION RESPONSE');
    console.log('======================================\n');

    const finalValuationRequest = {
      artwork: {
        title: 'The Starry Night',
        artist: 'Vincent van Gogh',
        year: '1889',
        medium: ['Oil on Canvas'],
        dimensions: '73.7 cm × 92.1 cm',
        condition: 'Excellent',
        provenance: ['Museum of Modern Art, New York']
      },
      purpose: 'insurance',
      clientId: 'client_001'
    };

    console.log('🎯 Sending Final Art Valuation request...');
    const finalValuationResponse = await fetch(`${API_BASE}/final-art-valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalValuationRequest)
    });

    const finalValuationResult = await finalValuationResponse.json();
    
    console.log('📊 FINAL ART VALUATION RESPONSE STRUCTURE:');
    console.log('========================================');
    console.log('✅ Success:', finalValuationResult.success);
    console.log('📊 Data Structure:');
    console.log('   - Valuation:', finalValuationResult.data?.valuation ? 'PRESENT' : 'MISSING');
    console.log('   - Estimated Value:', finalValuationResult.data?.valuation?.estimatedValue ? 'PRESENT' : 'MISSING');
    console.log('   - Confidence:', finalValuationResult.data?.valuation?.confidence ? 'PRESENT' : 'MISSING');
    console.log('   - Market Analysis:', finalValuationResult.data?.marketAnalysis ? 'PRESENT' : 'MISSING');
    console.log('   - System Metrics:', finalValuationResult.data?.systemMetrics ? 'PRESENT' : 'MISSING');
    console.log('   - Data Source:', finalValuationResult.data?.valuation?.dataSource ? 'PRESENT' : 'MISSING');
    
    if (finalValuationResult.data?.valuation?.estimatedValue) {
      console.log('\n🎯 ESTIMATED VALUE DETAILS:');
      console.log('   - Low:', finalValuationResult.data.valuation.estimatedValue.low);
      console.log('   - High:', finalValuationResult.data.valuation.estimatedValue.high);
      console.log('   - Most Likely:', finalValuationResult.data.valuation.estimatedValue.mostLikely);
    }
    
    if (finalValuationResult.data?.valuation?.confidence) {
      console.log('\n🎯 CONFIDENCE DETAILS:');
      console.log('   - Confidence:', finalValuationResult.data.valuation.confidence);
    }
    
    if (finalValuationResult.data?.systemMetrics) {
      console.log('\n🎯 SYSTEM METRICS DETAILS:');
      console.log('   - Teacher Confidence:', finalValuationResult.data.systemMetrics.teacherConfidence);
      console.log('   - Student Learning:', finalValuationResult.data.systemMetrics.studentLearning);
      console.log('   - Judge Agreement:', finalValuationResult.data.systemMetrics.judgeAgreement);
      console.log('   - Self-Training Effectiveness:', finalValuationResult.data.systemMetrics.selfTrainingEffectiveness);
    }

    // ============================================================
    // SUMMARY ANALYSIS
    // ============================================================
    console.log('\n🎯 DETAILED RESPONSE ANALYSIS SUMMARY');
    console.log('====================================\n');

    const analysisResults = {
      teacherStudentJudge: {
        success: teacherStudentResult.success,
        hasTeacher: !!teacherStudentResult.data?.teacher,
        hasStudent: !!teacherStudentResult.data?.student,
        hasJudge: !!teacherStudentResult.data?.judge,
        hasPermutationAI: !!teacherStudentResult.data?.permutationAI
      },
      advancedValuation: {
        success: advancedValuationResult.success,
        hasBaseValuation: !!advancedValuationResult.data?.baseValuation,
        hasPremiumFactors: !!advancedValuationResult.data?.premiumFactors,
        hasAdjustedValuation: !!advancedValuationResult.data?.adjustedValuation,
        hasEnhancementBreakdown: !!advancedValuationResult.data?.enhancementBreakdown,
        hasMarketPosition: !!advancedValuationResult.data?.enhancementBreakdown?.marketPosition,
        hasCrossMarketAppeal: !!advancedValuationResult.data?.enhancementBreakdown?.crossMarketAppeal,
        hasCulturalSignificance: !!advancedValuationResult.data?.enhancementBreakdown?.culturalSignificance,
        hasFuturePotential: !!advancedValuationResult.data?.enhancementBreakdown?.futurePotential,
        hasRiskAssessment: !!advancedValuationResult.data?.enhancementBreakdown?.riskAssessment
      },
      finalValuation: {
        success: finalValuationResult.success,
        hasValuation: !!finalValuationResult.data?.valuation,
        hasEstimatedValue: !!finalValuationResult.data?.valuation?.estimatedValue,
        hasConfidence: !!finalValuationResult.data?.valuation?.confidence,
        hasMarketAnalysis: !!finalValuationResult.data?.marketAnalysis,
        hasSystemMetrics: !!finalValuationResult.data?.systemMetrics,
        hasDataSource: !!finalValuationResult.data?.valuation?.dataSource
      }
    };

    console.log('📊 COMPONENT AVAILABILITY ANALYSIS:');
    console.log('==================================');
    console.log('🎓 Teacher-Student-Judge:');
    console.log(`   - Success: ${analysisResults.teacherStudentJudge.success ? '✅' : '❌'}`);
    console.log(`   - Teacher: ${analysisResults.teacherStudentJudge.hasTeacher ? '✅' : '❌'}`);
    console.log(`   - Student: ${analysisResults.teacherStudentJudge.hasStudent ? '✅' : '❌'}`);
    console.log(`   - Judge: ${analysisResults.teacherStudentJudge.hasJudge ? '✅' : '❌'}`);
    console.log(`   - PermutationAI: ${analysisResults.teacherStudentJudge.hasPermutationAI ? '✅' : '❌'}`);
    
    console.log('\n🎨 Advanced Valuation Analysis:');
    console.log(`   - Success: ${analysisResults.advancedValuation.success ? '✅' : '❌'}`);
    console.log(`   - Base Valuation: ${analysisResults.advancedValuation.hasBaseValuation ? '✅' : '❌'}`);
    console.log(`   - Premium Factors: ${analysisResults.advancedValuation.hasPremiumFactors ? '✅' : '❌'}`);
    console.log(`   - Adjusted Valuation: ${analysisResults.advancedValuation.hasAdjustedValuation ? '✅' : '❌'}`);
    console.log(`   - Enhancement Breakdown: ${analysisResults.advancedValuation.hasEnhancementBreakdown ? '✅' : '❌'}`);
    console.log(`   - Market Position: ${analysisResults.advancedValuation.hasMarketPosition ? '✅' : '❌'}`);
    console.log(`   - Cross-Market Appeal: ${analysisResults.advancedValuation.hasCrossMarketAppeal ? '✅' : '❌'}`);
    console.log(`   - Cultural Significance: ${analysisResults.advancedValuation.hasCulturalSignificance ? '✅' : '❌'}`);
    console.log(`   - Future Potential: ${analysisResults.advancedValuation.hasFuturePotential ? '✅' : '❌'}`);
    console.log(`   - Risk Assessment: ${analysisResults.advancedValuation.hasRiskAssessment ? '✅' : '❌'}`);
    
    console.log('\n🎯 Final Art Valuation:');
    console.log(`   - Success: ${analysisResults.finalValuation.success ? '✅' : '❌'}`);
    console.log(`   - Valuation: ${analysisResults.finalValuation.hasValuation ? '✅' : '❌'}`);
    console.log(`   - Estimated Value: ${analysisResults.finalValuation.hasEstimatedValue ? '✅' : '❌'}`);
    console.log(`   - Confidence: ${analysisResults.finalValuation.hasConfidence ? '✅' : '❌'}`);
    console.log(`   - Market Analysis: ${analysisResults.finalValuation.hasMarketAnalysis ? '✅' : '❌'}`);
    console.log(`   - System Metrics: ${analysisResults.finalValuation.hasSystemMetrics ? '✅' : '❌'}`);
    console.log(`   - Data Source: ${analysisResults.finalValuation.hasDataSource ? '✅' : '❌'}`);

    // Calculate overall health
    const totalComponents = 22; // Actually counting all the items we're checking
    const workingComponents = [
      analysisResults.teacherStudentJudge.success,
      analysisResults.teacherStudentJudge.hasTeacher,
      analysisResults.teacherStudentJudge.hasStudent,
      analysisResults.teacherStudentJudge.hasJudge,
      analysisResults.teacherStudentJudge.hasPermutationAI,
      analysisResults.advancedValuation.success,
      analysisResults.advancedValuation.hasBaseValuation,
      analysisResults.advancedValuation.hasPremiumFactors,
      analysisResults.advancedValuation.hasAdjustedValuation,
      analysisResults.advancedValuation.hasEnhancementBreakdown,
      analysisResults.advancedValuation.hasMarketPosition,
      analysisResults.advancedValuation.hasCrossMarketAppeal,
      analysisResults.advancedValuation.hasCulturalSignificance,
      analysisResults.advancedValuation.hasFuturePotential,
      analysisResults.advancedValuation.hasRiskAssessment,
      analysisResults.finalValuation.success,
      analysisResults.finalValuation.hasValuation,
      analysisResults.finalValuation.hasEstimatedValue,
      analysisResults.finalValuation.hasConfidence,
      analysisResults.finalValuation.hasMarketAnalysis,
      analysisResults.finalValuation.hasSystemMetrics,
      analysisResults.finalValuation.hasDataSource
    ].filter(Boolean).length;

    const overallHealth = (workingComponents / totalComponents) * 100;

    console.log('\n🎯 OVERALL SYSTEM HEALTH:');
    console.log('========================');
    console.log(`   - Working Components: ${workingComponents}/${totalComponents}`);
    console.log(`   - System Health: ${overallHealth.toFixed(1)}%`);
    console.log(`   - Status: ${overallHealth >= 80 ? 'EXCELLENT' : overallHealth >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`);

    return {
      overallHealth,
      workingComponents,
      totalComponents,
      analysisResults,
      success: overallHealth >= 80
    };

  } catch (error) {
    console.error('❌ Detailed Permutation Response Test failed:', error);
    return {
      overallHealth: 0,
      workingComponents: 0,
      totalComponents: 19,
      analysisResults: {},
      success: false,
      error: error.message
    };
  }
}

// Run the detailed response test
testDetailedPermutationResponse().then((result) => {
  console.log('\n🎉 DETAILED PERMUTATION AI RESPONSE TEST COMPLETE!');
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`   - Overall Health: ${result.overallHealth.toFixed(1)}%`);
  console.log(`   - Working Components: ${result.workingComponents}/${result.totalComponents}`);
  console.log(`   - Success: ${result.success ? 'YES' : 'NO'}`);
  
  if (result.error) {
    console.log(`   - Error: ${result.error}`);
  }
  
  console.log('\nThis shows the actual response structure and component availability! 🚀');
}).catch(console.error);
