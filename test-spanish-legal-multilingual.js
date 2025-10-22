/**
 * Spanish Legal Query Test - Multilingual Support Verification
 * 
 * Tests complex legal query in Spanish to verify:
 * - Multilingual business intelligence system
 * - Legal analysis expert activation
 * - Proper Spanish language handling
 * - Cross-language legal reasoning
 * - Behavioral evaluation in Spanish
 */

const fetch = require('node-fetch');

async function testSpanishLegalQuery() {
  console.log('🧪 Testing Spanish Legal Query - Multilingual Support\n');
  
  const spanishLegalQuery = `Analiza el siguiente caso legal complejo en el contexto del derecho mercantil internacional:

Una empresa española (vendedor) y una empresa mexicana (comprador) celebraron un contrato de compraventa internacional de maquinaria industrial por valor de €2.5 millones. El contrato se rige por la Convención de Viena de 1980 (CISG) y establece:

1. Entrega FOB puerto de Barcelona
2. Pago mediante carta de crédito irrevocable
3. Plazo de entrega: 60 días desde la firma
4. Cláusula de fuerza mayor que incluye "circunstancias imprevistas"

El vendedor español no pudo cumplir el plazo debido a una huelga de trabajadores portuarios en Barcelona que duró 45 días. El comprador mexicano, alegando incumplimiento, canceló el contrato y demandó daños y perjuicios por €500,000.

El vendedor español alega que la huelga constituye fuerza mayor según la cláusula contractual y el artículo 79 de la CISG.

Analiza:
1. ¿Se aplica la excepción de fuerza mayor según la CISG?
2. ¿Qué derechos tiene cada parte?
3. ¿Cómo se calcularían los daños?
4. ¿Qué estrategia legal recomiendas para cada parte?
5. ¿Existen precedentes relevantes en derecho español/mexicano?

Proporciona un análisis jurídico completo con fundamentos legales, jurisprudencia relevante y recomendaciones estratégicas.`;

  try {
    console.log('📝 Query (Spanish):');
    console.log(spanishLegalQuery.substring(0, 200) + '...\n');
    
    console.log('🚀 Sending request to Brain API...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: spanishLegalQuery,
        domain: 'legal',
        sessionId: 'spanish-legal-test',
        complexity: 9,
        needsReasoning: true,
        useMoE: true,
        context: {
          language: 'spanish',
          legalSystem: 'international',
          jurisdiction: ['spain', 'mexico'],
          applicableLaw: 'CISG',
          expectedTone: 'authoritative',
          expectedStyle: 'technical',
          expectedFocus: 'legal_analysis'
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

    // Check for multilingual business intelligence
    const hasMultilingual = result.metadata?.skillsActivated?.includes('Multilingual Business Intelligence');
    const hasLegalAnalysis = result.metadata?.skillsActivated?.includes('Legal Analysis Expert');
    
    console.log('🌍 Multilingual Support:');
    console.log(`   Multilingual Business Intelligence: ${hasMultilingual ? '✅' : '❌'}`);
    console.log(`   Legal Analysis Expert: ${hasLegalAnalysis ? '✅' : '❌'}`);
    console.log();

    // Check behavioral evaluation
    if (result.metadata?.behavioralDimensions) {
      console.log('🎯 Behavioral Evaluation (Spanish):');
      result.metadata.behavioralDimensions.forEach(dim => {
        console.log(`   ${dim.dimension}: ${(dim.score * 100).toFixed(1)}%`);
      });
      console.log();
    }

    // Analyze response content
    const responseText = result.response || '';
    console.log('📋 Response Analysis:');
    
    // Check for Spanish legal terms
    const spanishLegalTerms = [
      'CISG', 'Convención de Viena', 'fuerza mayor', 'daños y perjuicios',
      'carta de crédito', 'FOB', 'jurisprudencia', 'precedentes'
    ];
    
    const foundTerms = spanishLegalTerms.filter(term => 
      responseText.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log(`   Spanish Legal Terms Found: ${foundTerms.length}/${spanishLegalTerms.length}`);
    foundTerms.forEach(term => console.log(`     ✅ ${term}`));
    console.log();

    // Check for legal structure
    const hasLegalStructure = [
      responseText.includes('1.') || responseText.includes('•'),
      responseText.includes('CISG') || responseText.includes('Convención'),
      responseText.includes('artículo') || responseText.includes('Article'),
      responseText.includes('jurisprudencia') || responseText.includes('precedente'),
      responseText.includes('recomendación') || responseText.includes('estrategia')
    ].filter(Boolean).length;

    console.log(`   Legal Structure Score: ${hasLegalStructure}/5`);
    console.log();

    // Check for citations
    const hasCitations = /\[\d+\]/.test(responseText);
    console.log(`   Legal Citations: ${hasCitations ? '✅' : '❌'}`);
    
    // Check for multilingual indicators
    const hasMultilingualIndicators = [
      responseText.includes('derecho español'),
      responseText.includes('derecho mexicano'),
      responseText.includes('jurisdicción'),
      responseText.includes('aplicable')
    ].filter(Boolean).length;

    console.log(`   Multilingual Legal Analysis: ${hasMultilingualIndicators}/4`);
    console.log();

    // Overall assessment
    const totalScore = (
      (foundTerms.length / spanishLegalTerms.length) * 0.3 +
      (hasLegalStructure / 5) * 0.3 +
      (hasCitations ? 1 : 0) * 0.2 +
      (hasMultilingualIndicators / 4) * 0.2
    ) * 100;

    console.log('🏆 Overall Assessment:');
    console.log(`   Multilingual Legal Score: ${totalScore.toFixed(1)}%`);
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   Behavioral Alignment: ${result.metadata?.behavioralScore || 'N/A'}`);
    
    if (totalScore >= 80) {
      console.log('\n🎉 EXCELLENT: Spanish legal query handled perfectly!');
    } else if (totalScore >= 60) {
      console.log('\n✅ GOOD: Spanish legal query handled well with minor issues');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Spanish legal query needs better handling');
    }

    // Show sample of response
    console.log('\n📄 Response Sample:');
    console.log('─'.repeat(80));
    console.log(responseText.substring(0, 500) + '...');
    console.log('─'.repeat(80));

    return {
      success: true,
      score: totalScore,
      executionTime,
      skillsActivated: result.metadata?.skillsActivated?.length || 0,
      behavioralScore: result.metadata?.behavioralScore,
      multilingualSupport: hasMultilingual,
      legalAnalysis: hasLegalAnalysis,
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
testSpanishLegalQuery()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Spanish Legal Query Test Completed Successfully!');
      console.log(`   Score: ${result.score.toFixed(1)}%`);
      console.log(`   Time: ${result.executionTime.toFixed(2)}s`);
      console.log(`   Skills: ${result.skillsActivated}`);
      console.log(`   Multilingual: ${result.multilingualSupport ? '✅' : '❌'}`);
      console.log(`   Legal Analysis: ${result.legalAnalysis ? '✅' : '❌'}`);
    } else {
      console.log('\n❌ Spanish Legal Query Test Failed!');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
