/**
 * Test: Spanish Legal Query with Direct Answer API
 * Uses the new /api/direct-answer endpoint with Perplexity
 */

const testSpanishLegalFinal = async () => {
  console.log('🧪 Testing Spanish Legal Query with Direct Answer API...\n');

  const spanishLegalQuery = `
Actúa como un abogado experto en derecho internacional y arbitraje comercial.
Analiza el siguiente caso y responde DIRECTAMENTE a cada pregunta con análisis legal fundamentado.

**CASO:**
Una empresa española firmó un contrato de distribución exclusiva con una compañía
mexicana por 5 años. Tras 2 años, descubrió que la distribuidora vendía productos
similares de un competidor, violando la exclusividad.

La empresa española quiere:
- Terminar el contrato inmediatamente
- Reclamar €2 millones en daños

El contrato estipula arbitraje en la CCI de París aplicando la CISG.

La distribuidora alega:
1. La exclusividad es anticompetitiva
2. La empresa española incumplió primero (retrasos en entregas)
3. Los daños son especulativos

**RESPONDE DIRECTAMENTE:**

### 1. Ley Aplicable
¿Qué ley rige este arbitraje? Explica el marco legal.

### 2. Validez de la Exclusividad
¿Es válida la cláusula bajo CISG? Fundamenta con artículos.

### 3. Terminación Unilateral
¿Puede la empresa española terminar el contrato? Analiza requisitos.

### 4. Cálculo de Daños
¿Cómo se calculan los €2M? Proporciona metodología legal.

### 5. Defensas
¿Qué defensas tiene la distribuidora? Lista y explica cada una.

**FORMATO REQUERIDO:**
- Responde en español
- Usa encabezados ### para cada pregunta
- Incluye bullets • para sub-puntos
- Cita artículos CISG relevantes
- Proporciona análisis práctico, no solo teoría
  `.trim();

  console.log('📝 Query Length:', spanishLegalQuery.length, 'characters\n');
  console.log('🌐 Language: Spanish (es)');
  console.log('⚖️ Domain: Legal (international arbitration)\n');
  console.log('🔌 Endpoint: /api/direct-answer (Perplexity)\n');
  console.log('─'.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/direct-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: spanishLegalQuery,
        domain: 'legal',
        language: 'es',
        options: {
          usePerplexity: true,
          structured: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API Error: ${response.status}`);
      console.error('Details:', errorData);

      if (errorData.error?.includes('PERPLEXITY_API_KEY')) {
        console.log('\n💡 Setup Required:');
        console.log('   1. Get API key from https://www.perplexity.ai/');
        console.log('   2. Add to frontend/.env.local:');
        console.log('      PERPLEXITY_API_KEY=pplx-your-key-here');
        console.log('   3. Restart dev server: npm run dev');
      }

      return { success: false, error: errorData };
    }

    const result = await response.json();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log('✅ Response received\n');
    console.log('📊 Performance Metrics:');
    console.log(`   - Execution Time: ${executionTime}ms`);
    console.log(`   - Provider: ${result.metadata?.provider || 'N/A'}`);
    console.log(`   - Model: ${result.metadata?.model || 'N/A'}`);
    console.log(`   - Answer Length: ${result.metadata?.answer_length || 0} chars`);
    console.log(`   - Citations: ${result.metadata?.citations_count || 0}`);
    console.log(`   - Cost: $${result.performance?.cost?.toFixed(6) || 'N/A'}`);

    const answer = result.answer || '';

    console.log('\n📝 Response Preview (first 2000 chars):');
    console.log(answer.substring(0, 2000));
    if (answer.length > 2000) {
      console.log(`\n... (${answer.length - 2000} more characters)`);
    }

    // Comprehensive validation
    console.log('\n\n🔍 Content Validation:');

    const questions = [
      { pattern: /ley aplicable|marco legal|cisg.*aplic/i, label: '1. Ley Aplicable' },
      { pattern: /validez.*cláusula|cláusula.*válid|exclusividad.*válid/i, label: '2. Validez de Cláusula' },
      { pattern: /terminar.*contrato|terminación.*unilateral|resci/i, label: '3. Terminación Contractual' },
      { pattern: /cálculo.*daños|daños.*calcul|€2|metodología/i, label: '4. Cálculo de Daños' },
      { pattern: /defensas|alegaciones|argumentos.*distribuidora/i, label: '5. Defensas Disponibles' }
    ];

    console.log('\n✅ Direct Answer Checks:');
    let answeredCount = 0;
    questions.forEach(q => {
      const answered = q.pattern.test(answer);
      if (answered) answeredCount++;
      const emoji = answered ? '✅' : '❌';
      console.log(`   ${emoji} ${q.label}`);
    });

    const formats = [
      { pattern: /#{1,3}\s+\d+/, label: 'Markdown Headers (###)' },
      { pattern: /[•\-\*]\s+/, label: 'Bullet Points (•)' },
      { pattern: /art(ículo|\.)?\s*\d+|cisg/i, label: 'CISG Article Citations' },
      { pattern: /.{1000,}/, label: 'Comprehensive Analysis (>1000 chars)' },
      { pattern: /\b(el|la|los|las|que|para|con|por)\b/i, label: 'Spanish Language' }
    ];

    console.log('\n✅ Format Checks:');
    let formatCount = 0;
    formats.forEach(f => {
      const passed = f.pattern.test(answer);
      if (passed) formatCount++;
      const emoji = passed ? '✅' : '❌';
      console.log(`   ${emoji} ${f.label}`);
    });

    // Spanish legal terms
    const spanishTerms = [
      'contrato', 'arbitraje', 'CISG', 'cláusula', 'exclusividad',
      'daños', 'incumplimiento', 'resolución', 'derecho', 'tribunal'
    ];

    const foundTerms = spanishTerms.filter(term =>
      answer.toLowerCase().includes(term.toLowerCase())
    );

    console.log(`\n📖 Spanish Legal Terms: ${foundTerms.length}/${spanishTerms.length}`);
    console.log(`   Found: ${foundTerms.join(', ')}`);

    // Calculate scores
    const directAnswerScore = answeredCount / questions.length;
    const formatScore = formatCount / formats.length;
    const terminologyScore = foundTerms.length / spanishTerms.length;
    const overallScore = (directAnswerScore * 0.5 + formatScore * 0.3 + terminologyScore * 0.2) * 100;

    console.log('\n🎯 Scoring:');
    console.log(`   - Direct Answers: ${(directAnswerScore * 100).toFixed(1)}% (${answeredCount}/${questions.length} questions)`);
    console.log(`   - Format Quality: ${(formatScore * 100).toFixed(1)}% (${formatCount}/${formats.length} checks)`);
    console.log(`   - Terminology: ${(terminologyScore * 100).toFixed(1)}% (${foundTerms.length}/${spanishTerms.length} terms)`);
    console.log(`   - Overall Score: ${overallScore.toFixed(1)}%`);

    // Final assessment
    console.log('\n' + '─'.repeat(80));
    if (overallScore >= 85) {
      console.log('🎉 EXCELLENT: Production-ready Spanish legal analysis!');
    } else if (overallScore >= 70) {
      console.log('✅ GOOD: High-quality response, minor improvements possible');
    } else if (overallScore >= 50) {
      console.log('⚠️  FAIR: Adequate response, some improvements needed');
    } else {
      console.log('❌ POOR: Response quality below expectations');
    }

    // Save results
    const fs = require('fs');
    const outputPath = './test-spanish-legal-final-result.json';
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          query: spanishLegalQuery,
          result,
          metrics: {
            executionTime,
            directAnswerScore: directAnswerScore * 100,
            formatScore: formatScore * 100,
            terminologyScore: terminologyScore * 100,
            overallScore,
            answeredQuestions: answeredCount,
            totalQuestions: questions.length
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
      overallScore,
      answeredQuestions: answeredCount
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Configure PERPLEXITY_API_KEY in frontend/.env.local');
    console.log('   3. Verify network connectivity');

    return {
      success: false,
      error: error.message,
    };
  }
};

// Run test
console.log('🚀 Final Spanish Legal Query Test\n');
console.log('Using Direct Answer API with Perplexity\n');
console.log('─'.repeat(80) + '\n');

testSpanishLegalFinal()
  .then(result => {
    console.log('\n' + '─'.repeat(80));
    console.log('✨ Test completed\n');

    if (result.success) {
      console.log(`🎯 Result: SUCCESS - ${result.overallScore.toFixed(1)}% score`);
      console.log(`📊 Questions answered: ${result.answeredQuestions}/5`);
      console.log(`⚡ Time: ${result.executionTime}ms`);
    } else {
      console.log('⚠️  Result: Test failed or needs configuration');
    }

    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
