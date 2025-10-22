/**
 * Test: Complex Legal Query in Spanish with Structured Answer Format
 * Tests multilingual capabilities with explicit structure requirements
 */

const testSpanishLegalQueryStructured = async () => {
  console.log('🧪 Testing Spanish Legal Query with Structured Format...\n');

  const complexSpanishLegalQuery = `
Analiza el siguiente caso jurídico complejo y proporciona respuestas estructuradas
y numeradas a cada pregunta:

**CONTEXTO DEL CASO:**
Una empresa multinacional española firmó un contrato de distribución exclusiva
con una compañía mexicana por 5 años. Después de 2 años, la empresa española
descubrió que la distribuidora mexicana estaba vendiendo productos similares de
un competidor directo, violando la cláusula de exclusividad.

La empresa española quiere terminar el contrato inmediatamente y reclamar daños
por pérdida de ventas estimada en €2 millones. Sin embargo, el contrato estipula
que las disputas deben resolverse mediante arbitraje en la Cámara de Comercio
Internacional de París, aplicando la Convención de las Naciones Unidas sobre los
Contratos de Compraventa Internacional de Mercaderías (CISG).

**ALEGACIONES DE LA DISTRIBUIDORA MEXICANA:**
1. La cláusula de exclusividad es demasiado amplia y anticompetitiva
2. La empresa española incumplió primero al no entregar productos a tiempo
3. Los daños reclamados son especulativos y excesivos

**INSTRUCCIONES:**
Proporciona un análisis legal estructurado respondiendo DIRECTAMENTE a cada
pregunta en el siguiente formato:

## ANÁLISIS LEGAL COMPLETO

### 1. LEY APLICABLE
¿Qué ley aplicaría en este arbitraje internacional? Explica el marco legal.

### 2. VALIDEZ DE LA CLÁUSULA
¿Tiene validez la cláusula de exclusividad bajo CISG? Fundamenta tu respuesta.

### 3. TERMINACIÓN CONTRACTUAL
¿Puede la empresa española terminar el contrato unilateralmente? Analiza los requisitos.

### 4. CÁLCULO DE DAÑOS
¿Cómo se calcularían los daños en este caso? Proporciona metodología.

### 5. DEFENSAS DISPONIBLES
¿Qué defensas tiene la distribuidora mexicana? Lista y explica cada una.

**FORMATO REQUERIDO:**
- Usa encabezados claros (###) para cada pregunta
- Numera las respuestas (1-5)
- Proporciona sub-puntos con viñetas (•) cuando sea apropiado
- Cita artículos relevantes de CISG cuando aplique
- Incluye un resumen ejecutivo al final
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
        requiresStructuredOutput: true,
        outputFormat: 'structured',
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
    console.log(`   - Quality Score: ${result.qualityScore || result.metadata?.averageQuality || 'N/A'}`);
    console.log(`   - Skills Activated: ${result.skillsActivated?.length || result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   - Cache Hit: ${result.cacheHit ? 'Yes' : 'No'}`);

    const responseText = result.answer || result.response || result.result || JSON.stringify(result);

    console.log('\n📝 Response Preview (first 1000 chars):');
    console.log(responseText.substring(0, 1000) + '...\n');

    // Advanced Structure Validation
    console.log('🔍 Structure Validation:');

    const structureChecks = {
      hasMarkdownHeaders: /#{1,3}\s/.test(responseText),
      hasNumberedSections: /\d+\.\s+/.test(responseText) || /###\s*\d+/.test(responseText),
      hasBulletPoints: /[•\-\*]\s/.test(responseText),
      hasAllFiveQuestions: [
        'ley aplicable',
        'validez',
        'terminar.*contrato',
        'calcular.*daños',
        'defensas'
      ].filter(pattern =>
        new RegExp(pattern, 'i').test(responseText.toLowerCase())
      ).length >= 4, // At least 4 of 5 questions addressed
      hasCISGReferences: /cisg|convención|artículo|art\./i.test(responseText),
      hasExecutiveSummary: /resumen|conclusión|síntesis/i.test(responseText),
      hasParagraphBreaks: (responseText.match(/\n\n/g) || []).length > 3,
      hasLegalCitations: /artículo|art\.|sección|§/i.test(responseText)
    };

    console.log('\n✅ Structure Checks:');
    Object.entries(structureChecks).forEach(([check, passed]) => {
      const emoji = passed ? '✅' : '❌';
      const label = check
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      console.log(`   ${emoji} ${label}`);
    });

    // Spanish legal terminology check
    const advancedSpanishTerms = [
      'contrato',
      'arbitraje',
      'CISG',
      'cláusula',
      'exclusividad',
      'daños',
      'incumplimiento',
      'resolución',
      'indemnización',
      'tribunal'
    ];

    const foundAdvancedTerms = advancedSpanishTerms.filter(term =>
      responseText.toLowerCase().includes(term.toLowerCase())
    );

    console.log(`\n📖 Advanced Legal Terms: ${foundAdvancedTerms.length}/${advancedSpanishTerms.length}`);
    console.log(`   Terms: ${foundAdvancedTerms.join(', ')}`);

    // Calculate scores
    const structureScore = Object.values(structureChecks).filter(Boolean).length /
                          Object.keys(structureChecks).length;
    const terminologyScore = foundAdvancedTerms.length / advancedSpanishTerms.length;
    const overallScore = (structureScore * 0.6 + terminologyScore * 0.4) * 100;

    console.log('\n🎯 Scoring:');
    console.log(`   - Structure Score: ${(structureScore * 100).toFixed(1)}%`);
    console.log(`   - Terminology Score: ${(terminologyScore * 100).toFixed(1)}%`);
    console.log(`   - Overall Score: ${overallScore.toFixed(1)}%`);

    // Quality assessment
    if (overallScore >= 85) {
      console.log('\n🎉 EXCELLENT: Structured Spanish legal response is production-ready!');
    } else if (overallScore >= 70) {
      console.log('\n✅ GOOD: Structured response meets requirements with minor improvements needed');
    } else if (overallScore >= 50) {
      console.log('\n⚠️  FAIR: Structure needs improvement for production use');
    } else {
      console.log('\n❌ NEEDS WORK: Structure does not meet requirements');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (!structureChecks.hasMarkdownHeaders) {
      console.log('   - Add markdown headers (### ) for section organization');
    }
    if (!structureChecks.hasNumberedSections) {
      console.log('   - Use numbered sections (1., 2., etc.) for questions');
    }
    if (!structureChecks.hasBulletPoints) {
      console.log('   - Add bullet points (•) for sub-items');
    }
    if (!structureChecks.hasAllFiveQuestions) {
      console.log('   - Ensure all 5 legal questions are explicitly addressed');
    }
    if (!structureChecks.hasExecutiveSummary) {
      console.log('   - Include executive summary or conclusion section');
    }
    if (!structureChecks.hasLegalCitations) {
      console.log('   - Add legal citations (Article X, Section Y)');
    }

    // Save results
    const fs = require('fs');
    const outputPath = './test-spanish-legal-structured-result.json';
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          query: complexSpanishLegalQuery,
          result,
          metrics: {
            executionTime,
            structureScore: structureScore * 100,
            terminologyScore: terminologyScore * 100,
            overallScore,
            structureChecks,
            foundTerms: foundAdvancedTerms
          },
        },
        null,
        2
      )
    );

    console.log(`\n💾 Full response saved to: ${outputPath}`);

    return {
      success: overallScore >= 70,
      executionTime,
      structureScore,
      terminologyScore,
      overallScore,
    };
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure the dev server is running: npm run dev');
    console.log('   2. Check if Supabase is configured correctly');
    console.log('   3. Verify API keys in .env.local');

    return {
      success: false,
      error: error.message,
    };
  }
};

// Run the test
console.log('🚀 Starting Spanish Legal Query Test (Structured Format)\n');
console.log('📝 Testing structured output with explicit format requirements\n');
console.log('─'.repeat(80) + '\n');

testSpanishLegalQueryStructured()
  .then((result) => {
    console.log('\n' + '─'.repeat(80));
    console.log('✨ Test completed\n');
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
