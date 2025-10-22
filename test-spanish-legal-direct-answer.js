/**
 * Test: Spanish Legal Query with Direct Answers
 * Uses /api/optimized/execute for actual answer generation (not just meta-analysis)
 */

const testSpanishLegalDirect = async () => {
  console.log('🧪 Testing Spanish Legal Query with Direct Answers...\n');

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
  console.log('─'.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // Try the optimized execution endpoint
    console.log('🔄 Attempting /api/optimized/execute endpoint...');

    const response = await fetch('http://localhost:3000/api/optimized/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: spanishLegalQuery,
        domain: 'legal',
        options: {
          useTeacher: true, // Use high-quality model for legal analysis
          requiresStructuredOutput: true,
          outputFormat: 'markdown',
          language: 'es',
          complexity: 'high'
        }
      }),
    });

    if (!response.ok) {
      console.log(`⚠️  /api/optimized/execute returned ${response.status}, trying alternative...`);

      // Fallback to brain API
      const brainResponse = await fetch('http://localhost:3000/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: spanishLegalQuery,
          domain: 'legal',
          language: 'es',
          requiresDirectAnswer: true // Signal we want direct answers
        })
      });

      if (!brainResponse.ok) {
        throw new Error(`Both endpoints failed: ${response.status}, ${brainResponse.status}`);
      }

      const result = await brainResponse.json();
      return analyzeResponse(result, Date.now() - startTime, 'brain');
    }

    const result = await response.json();
    return analyzeResponse(result, Date.now() - startTime, 'optimized');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Check Supabase config in .env.local');
    console.log('   3. Verify API keys (PERPLEXITY_API_KEY or OPENAI_API_KEY)');
    console.log('   4. Check if /api/optimized/execute route exists');

    return { success: false, error: error.message };
  }
};

function analyzeResponse(result, executionTime, endpoint) {
  console.log(`\n✅ Response received from: ${endpoint}\n`);

  console.log('📊 Performance Metrics:');
  console.log(`   - Execution Time: ${executionTime}ms`);
  console.log(`   - Quality Score: ${result.qualityScore || result.quality || 'N/A'}`);
  console.log(`   - Cost: $${result.cost || result.metadata?.totalCost || 'N/A'}`);

  // Extract response text
  const responseText = result.answer || result.response || result.result || JSON.stringify(result);

  console.log('\n📝 Response Preview (first 1500 chars):');
  console.log(responseText.substring(0, 1500) + '...\n');

  // Comprehensive structure checks
  const structureChecks = {
    hasMarkdownHeaders: /#{1,3}\s+\d+/.test(responseText),
    answersQuestion1: /ley aplicable|marco legal|cisg.*aplic/i.test(responseText),
    answersQuestion2: /validez.*cláusula|cláusula.*válid|exclusividad.*válid/i.test(responseText),
    answersQuestion3: /terminar.*contrato|terminación.*unilateral|resci/i.test(responseText),
    answersQuestion4: /cálculo.*daños|daños.*calcul|€2|metodología/i.test(responseText),
    answersQuestion5: /defensas|alegaciones|argumentos.*distribuidora/i.test(responseText),
    hasBulletPoints: /[•\-\*]\s+/.test(responseText),
    hasCISGArticles: /art(ículo|\.)?\s*\d+|cisg/i.test(responseText),
    hasLegalAnalysis: responseText.length > 1000,
    inSpanish: /\b(el|la|los|las|que|para|con|por)\b/i.test(responseText)
  };

  console.log('🔍 Content Validation:');
  console.log('\n✅ Direct Answer Checks:');

  const questions = [
    { key: 'answersQuestion1', label: '1. Ley Aplicable' },
    { key: 'answersQuestion2', label: '2. Validez de Cláusula' },
    { key: 'answersQuestion3', label: '3. Terminación Contractual' },
    { key: 'answersQuestion4', label: '4. Cálculo de Daños' },
    { key: 'answersQuestion5', label: '5. Defensas Disponibles' }
  ];

  questions.forEach(q => {
    const emoji = structureChecks[q.key] ? '✅' : '❌';
    console.log(`   ${emoji} ${q.label}`);
  });

  console.log('\n✅ Format Checks:');
  [
    { key: 'hasMarkdownHeaders', label: 'Markdown Headers (###)' },
    { key: 'hasBulletPoints', label: 'Bullet Points (•)' },
    { key: 'hasCISGArticles', label: 'CISG Article Citations' },
    { key: 'hasLegalAnalysis', label: 'Comprehensive Analysis' },
    { key: 'inSpanish', label: 'Spanish Language' }
  ].forEach(item => {
    const emoji = structureChecks[item.key] ? '✅' : '❌';
    console.log(`   ${emoji} ${item.label}`);
  });

  // Calculate scores
  const directAnswerScore = questions.filter(q => structureChecks[q.key]).length / questions.length;
  const formatScore = [
    structureChecks.hasMarkdownHeaders,
    structureChecks.hasBulletPoints,
    structureChecks.hasCISGArticles,
    structureChecks.hasLegalAnalysis,
    structureChecks.inSpanish
  ].filter(Boolean).length / 5;

  const overallScore = (directAnswerScore * 0.7 + formatScore * 0.3) * 100;

  console.log('\n🎯 Scoring:');
  console.log(`   - Direct Answers: ${(directAnswerScore * 100).toFixed(1)}% (${questions.filter(q => structureChecks[q.key]).length}/5 questions)`);
  console.log(`   - Format Quality: ${(formatScore * 100).toFixed(1)}%`);
  console.log(`   - Overall Score: ${overallScore.toFixed(1)}%`);

  // Final assessment
  console.log('\n' + '─'.repeat(80));
  if (overallScore >= 85) {
    console.log('🎉 EXCELLENT: Direct answers provided with proper structure!');
  } else if (overallScore >= 70) {
    console.log('✅ GOOD: Most questions answered, minor improvements needed');
  } else if (overallScore >= 50) {
    console.log('⚠️  FAIR: Some answers present, needs significant improvement');
  } else {
    console.log('❌ POOR: Direct answers missing, only meta-analysis provided');
    console.log('\n💡 This likely means you\'re using the Brain API (meta-analysis) instead of');
    console.log('   the execution API (direct answers). See STRUCTURED_FORMAT_IMPROVEMENT_GUIDE.md');
  }

  // Save results
  const fs = require('fs');
  const outputPath = './test-spanish-legal-direct-result.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ result, metrics: { executionTime, structureChecks, overallScore } }, null, 2)
  );

  console.log(`\n💾 Full response saved to: ${outputPath}`);

  return {
    success: overallScore >= 70,
    executionTime,
    directAnswerScore,
    formatScore,
    overallScore,
    endpoint
  };
}

// Run test
console.log('🚀 Testing Direct Answer Generation for Spanish Legal Query\n');
console.log('This test uses /api/optimized/execute for direct answers\n');
console.log('Compare with test-spanish-legal.js which uses /api/brain (meta-analysis)\n');
console.log('─'.repeat(80) + '\n');

testSpanishLegalDirect()
  .then(result => {
    console.log('\n' + '─'.repeat(80));
    console.log('✨ Test completed\n');

    if (result.success) {
      console.log('🎯 Result: Direct answers successfully generated');
      console.log(`📊 Score: ${result.overallScore?.toFixed(1)}%`);
      console.log(`⚡ Time: ${result.executionTime}ms`);
      console.log(`🔌 Endpoint: ${result.endpoint}`);
    } else {
      console.log('⚠️  Result: Direct answers not generated (meta-analysis only)');
      console.log('\n📖 See STRUCTURED_FORMAT_IMPROVEMENT_GUIDE.md for solutions');
    }

    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
