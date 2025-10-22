/**
 * Manufacturing Relocation Test - Multi-Domain Business Analysis
 * 
 * Tests complex manufacturing relocation query covering:
 * - Manufacturing operations analysis
 * - International legal compliance
 * - Cost effectiveness analysis
 * - Multi-jurisdiction legal requirements
 * - Business intelligence across domains
 */

const fetch = require('node-fetch');

async function testManufacturingRelocation() {
  console.log('🏭 Testing Manufacturing Relocation - Multi-Domain Analysis\n');
  
  const manufacturingQuery = `Analyze the complete business case for relocating our manufacturing operations from Germany to Mexico. Our current facility in Munich produces automotive components with 500 employees and €50M annual revenue.

Key considerations:
1. Legal and regulatory compliance requirements in Mexico
2. Labor law differences between Germany and Mexico
3. Environmental regulations and sustainability requirements
4. Tax implications and incentives available
5. Supply chain logistics and infrastructure analysis
6. Cost-benefit analysis with 5-year projections
7. Risk assessment for political, economic, and operational factors
8. Timeline and implementation strategy
9. Cultural and language considerations for management
10. Quality control and certification requirements

Provide a comprehensive analysis with:
- Legal framework comparison (Germany vs Mexico)
- Detailed cost analysis with ROI calculations
- Risk mitigation strategies
- Implementation roadmap
- Recommendations for decision-making

Focus on practical, actionable insights for senior management decision-making.`;

  try {
    console.log('📝 Query (Manufacturing Relocation):');
    console.log(manufacturingQuery.substring(0, 200) + '...\n');
    
    console.log('🚀 Sending request to Brain API...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: manufacturingQuery,
        domain: 'technology',
        sessionId: 'manufacturing-relocation-test',
        complexity: 9,
        needsReasoning: true,
        useMoE: true,
        context: {
          businessType: 'manufacturing',
          industry: 'automotive',
          currentLocation: 'germany',
          targetLocation: 'mexico',
          companySize: '500 employees',
          revenue: '€50M',
          analysisType: 'relocation',
          expectedTone: 'professional',
          expectedStyle: 'detailed',
          expectedFocus: 'business_analysis'
        }
      })
    });

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Response received successfully!\n');
    console.log('📊 Execution Metrics:');
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   MoE Optimized: ${result.metadata?.moeOptimized || false}`);
    console.log(`   Behavioral Score: ${result.metadata?.behavioralScore || 'N/A'}`);
    console.log(`   Combined Score: ${result.metadata?.combinedScore || 'N/A'}\n`);

    // Analyze skills activated
    if (result.metadata?.skillsActivated) {
      console.log('🧠 Skills Analysis:');
      result.metadata.skillsActivated.forEach((skill, index) => {
        const score = result.metadata.skillScores?.[skill] || 'N/A';
        console.log(`   ${index + 1}. ${skill}: ${score}`);
      });
      console.log();
    }

    // Check for business intelligence skills
    const hasBusinessIntelligence = result.metadata?.skillsActivated?.includes('Multilingual Business Intelligence');
    const hasLegalAnalysis = result.metadata?.skillsActivated?.includes('Legal Analysis Expert');
    const hasAdvancedRAG = result.metadata?.skillsActivated?.includes('Advanced RAG Techniques');
    
    console.log('🏢 Business Intelligence Analysis:');
    console.log(`   Multilingual Business Intelligence: ${hasBusinessIntelligence ? '✅' : '❌'}`);
    console.log(`   Legal Analysis Expert: ${hasLegalAnalysis ? '✅' : '❌'}`);
    console.log(`   Advanced RAG Techniques: ${hasAdvancedRAG ? '✅' : '❌'}`);
    console.log();

    // Check behavioral evaluation
    if (result.metadata?.behavioralDimensions) {
      console.log('🎯 Behavioral Evaluation (Business Analysis):');
      result.metadata.behavioralDimensions.forEach(dim => {
        console.log(`   ${dim.dimension}: ${(dim.score * 100).toFixed(1)}%`);
      });
      console.log();
    }

    // Analyze response content
    const responseText = result.response || '';
    console.log('📋 Response Analysis:');
    
    // Check for business analysis components
    const businessComponents = [
      'legal', 'compliance', 'regulatory', 'labor law', 'environmental',
      'tax', 'incentives', 'supply chain', 'logistics', 'infrastructure',
      'cost', 'ROI', 'projection', 'risk', 'mitigation', 'timeline',
      'implementation', 'cultural', 'quality control', 'certification'
    ];
    
    const foundComponents = businessComponents.filter(component => 
      responseText.toLowerCase().includes(component.toLowerCase())
    );
    
    console.log(`   Business Components Found: ${foundComponents.length}/${businessComponents.length}`);
    foundComponents.forEach(component => console.log(`     ✅ ${component}`));
    console.log();

    // Check for legal framework analysis
    const legalFramework = [
      'germany', 'mexico', 'jurisdiction', 'compliance', 'regulatory',
      'labor law', 'environmental', 'tax', 'incentives'
    ];
    
    const foundLegal = legalFramework.filter(term => 
      responseText.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log(`   Legal Framework Analysis: ${foundLegal.length}/${legalFramework.length}`);
    foundLegal.forEach(term => console.log(`     ✅ ${term}`));
    console.log();

    // Check for cost analysis
    const costAnalysis = [
      'cost', 'ROI', 'projection', 'benefit', 'analysis', 'calculation',
      'investment', 'savings', 'expense', 'budget'
    ];
    
    const foundCost = costAnalysis.filter(term => 
      responseText.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log(`   Cost Analysis Components: ${foundCost.length}/${costAnalysis.length}`);
    foundCost.forEach(term => console.log(`     ✅ ${term}`));
    console.log();

    // Check for structured analysis
    const hasStructuredAnalysis = [
      responseText.includes('1.') || responseText.includes('•'),
      responseText.includes('legal') || responseText.includes('Legal'),
      responseText.includes('cost') || responseText.includes('Cost'),
      responseText.includes('risk') || responseText.includes('Risk'),
      responseText.includes('recommendation') || responseText.includes('Recommendation')
    ].filter(Boolean).length;

    console.log(`   Structured Analysis Score: ${hasStructuredAnalysis}/5`);
    console.log();

    // Check for citations
    const hasCitations = /\[\d+\]/.test(responseText);
    console.log(`   Research Citations: ${hasCitations ? '✅' : '❌'}`);
    
    // Check for business intelligence indicators
    const hasBusinessIntelligenceIndicators = [
      responseText.includes('analysis'),
      responseText.includes('comparison'),
      responseText.includes('recommendation'),
      responseText.includes('strategy')
    ].filter(Boolean).length;

    console.log(`   Business Intelligence Indicators: ${hasBusinessIntelligenceIndicators}/4`);
    console.log();

    // Overall assessment
    const totalScore = (
      (foundComponents.length / businessComponents.length) * 0.3 +
      (foundLegal.length / legalFramework.length) * 0.25 +
      (foundCost.length / costAnalysis.length) * 0.25 +
      (hasStructuredAnalysis / 5) * 0.1 +
      (hasCitations ? 1 : 0) * 0.05 +
      (hasBusinessIntelligenceIndicators / 4) * 0.05
    ) * 100;

    console.log('🏆 Overall Assessment:');
    console.log(`   Manufacturing Relocation Analysis Score: ${totalScore.toFixed(1)}%`);
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   Behavioral Alignment: ${result.metadata?.behavioralScore || 'N/A'}`);
    
    if (totalScore >= 80) {
      console.log('\n🎉 EXCELLENT: Manufacturing relocation analysis handled perfectly!');
    } else if (totalScore >= 60) {
      console.log('\n✅ GOOD: Manufacturing relocation analysis handled well with minor issues');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Manufacturing relocation analysis needs better handling');
    }

    // Show sample of response
    console.log('\n📄 Response Sample:');
    console.log('─'.repeat(80));
    console.log(responseText.substring(0, 800) + '...');
    console.log('─'.repeat(80));

    return {
      success: true,
      score: totalScore,
      executionTime,
      skillsActivated: result.metadata?.skillsActivated?.length || 0,
      behavioralScore: result.metadata?.behavioralScore,
      businessIntelligence: hasBusinessIntelligence,
      legalAnalysis: hasLegalAnalysis,
      advancedRAG: hasAdvancedRAG,
      response: responseText
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testManufacturingRelocation()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Manufacturing Relocation Test Completed Successfully!');
      console.log(`   Score: ${result.score.toFixed(1)}%`);
      console.log(`   Time: ${result.executionTime.toFixed(2)}s`);
      console.log(`   Skills: ${result.skillsActivated}`);
      console.log(`   Business Intelligence: ${result.businessIntelligence ? '✅' : '❌'}`);
      console.log(`   Legal Analysis: ${result.legalAnalysis ? '✅' : '❌'}`);
      console.log(`   Advanced RAG: ${result.advancedRAG ? '✅' : '❌'}`);
    } else {
      console.log('\n❌ Manufacturing Relocation Test Failed!');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
