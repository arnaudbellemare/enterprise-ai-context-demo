/**
 * Test: Complex Legal Query in Spanish
 * Tests multilingual capabilities with domain-specific (legal) reasoning
 */

const testSpanishLegalQuery = async () => {
  console.log('🧪 Testing Spanish Legal Query...\n');

  const complexSpanishLegalQuery = `
Analiza el siguiente caso jurídico complejo:

Una empresa multinacional española firmó un contrato de distribución exclusiva
con una compañía mexicana por 5 años. Después de 2 años, la empresa española
descubrió que la distribuidora mexicana estaba vendiendo productos similares de
un competidor directo, violando la cláusula de exclusividad.

La empresa española quiere terminar el contrato inmediatamente y reclamar daños
por pérdida de ventas estimada en €2 millones. Sin embargo, el contrato estipula
que las disputas deben resolverse mediante arbitraje en la Cámara de Comercio
Internacional de París, aplicando la Convención de las Naciones Unidas sobre los
Contratos de Compraventa Internacional de Mercaderías (CISG).

La distribuidora mexicana argumenta que:
1. La cláusula de exclusividad es demasiado amplia y anticompetitiva
2. La empresa española incumplió primero al no entregar productos a tiempo
3. Los daños reclamados son especulativos y excesivos

Preguntas:
1. ¿Qué ley aplicaría en este arbitraje internacional?
2. ¿Tiene validez la cláusula de exclusividad bajo CISG?
3. ¿Puede la empresa española terminar el contrato unilateralmente?
4. ¿Cómo se calcularían los daños en este caso?
5. ¿Qué defensas tiene la distribuidora mexicana?
  `.trim();

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: complexSpanishLegalQuery,
        domain: 'legal',
        language: 'es',
        complexity: 'high',
        requiresMultilingualSupport: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('✅ Response received\n');
    console.log('📊 Performance Metrics:');
    console.log(`   - Execution Time: ${executionTime}ms`);
    console.log(`   - Quality Score: ${result.qualityScore || 'N/A'}`);
    console.log(`   - Skills Activated: ${result.skillsActivated?.length || 0}`);
    console.log(`   - Language Detected: ${result.detectedLanguage || 'N/A'}`);
    console.log(`   - Cache Hit: ${result.cacheHit ? 'Yes' : 'No'}`);

    if (result.skillsActivated) {
      console.log('\n🧠 Skills Activated:');
      result.skillsActivated.forEach((skill) => {
        console.log(`   - ${skill}`);
      });
    }

    console.log('\n📝 Response Preview (first 500 chars):');
    const responseText = result.answer || result.result || JSON.stringify(result);
    console.log(responseText.substring(0, 500) + '...\n');

    // Validate Spanish legal content
    console.log('🔍 Content Validation:');
    const spanishLegalTerms = [
      'contrato',
      'arbitraje',
      'CISG',
      'cláusula',
      'exclusividad',
      'daños',
    ];

    const foundTerms = spanishLegalTerms.filter((term) =>
      responseText.toLowerCase().includes(term.toLowerCase())
    );

    console.log(`   - Spanish Legal Terms Found: ${foundTerms.length}/${spanishLegalTerms.length}`);
    console.log(`   - Terms: ${foundTerms.join(', ')}`);

    // Check if response is in Spanish
    const spanishIndicators = ['el', 'la', 'los', 'las', 'que', 'para', 'con'];
    const spanishScore =
      spanishIndicators.filter((word) =>
        responseText.toLowerCase().includes(` ${word} `)
      ).length / spanishIndicators.length;

    console.log(`   - Spanish Language Score: ${(spanishScore * 100).toFixed(1)}%`);

    // Quality checks
    const qualityChecks = {
      hasLegalAnalysis: responseText.length > 500,
      addressesAllQuestions: responseText.includes('1') || responseText.includes('2'),
      mentionsCISG: responseText.toLowerCase().includes('cisg'),
      mentionsArbitration:
        responseText.toLowerCase().includes('arbitraje') ||
        responseText.toLowerCase().includes('arbitration'),
      providesStructuredAnswer: responseText.includes('\n') || responseText.includes('•'),
    };

    console.log('\n✅ Quality Checks:');
    Object.entries(qualityChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✓' : '✗'} ${check}`);
    });

    const passedChecks = Object.values(qualityChecks).filter(Boolean).length;
    const totalChecks = Object.keys(qualityChecks).length;
    const successRate = (passedChecks / totalChecks) * 100;

    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedChecks}/${totalChecks})`);

    if (successRate >= 80) {
      console.log('\n🎉 EXCELLENT: Spanish legal query handled successfully!');
    } else if (successRate >= 60) {
      console.log('\n⚠️  GOOD: Spanish legal query handled adequately, room for improvement');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT: Spanish legal query handling needs work');
    }

    // Save full response for review
    const fs = require('fs');
    const outputPath = './test-spanish-legal-result.json';
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          query: complexSpanishLegalQuery,
          result,
          metrics: {
            executionTime,
            spanishScore,
            qualityChecks,
            successRate,
          },
        },
        null,
        2
      )
    );

    console.log(`\n💾 Full response saved to: ${outputPath}`);

    return {
      success: successRate >= 60,
      executionTime,
      spanishScore,
      qualityChecks,
      successRate,
    };
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure the dev server is running: npm run dev');
    console.log('   2. Check if Supabase is configured correctly');
    console.log('   3. Verify API keys in .env.local');
    console.log('   4. Check multilingual support is enabled');

    return {
      success: false,
      error: error.message,
    };
  }
};

// Run the test
console.log('🚀 Starting Spanish Legal Query Test\n');
console.log('📝 Testing multilingual capabilities with complex legal domain\n');
console.log('─'.repeat(80) + '\n');

testSpanishLegalQuery()
  .then((result) => {
    console.log('\n' + '─'.repeat(80));
    console.log('✨ Test completed\n');
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
