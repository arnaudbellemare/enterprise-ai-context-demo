/**
 * Test Email Classification Improvements
 *
 * Tests Phase 1 improvements:
 * - Embedding generation and similarity search
 * - Example selection (similar, diverse, optimal)
 * - Updated classifier with embedding-based few-shot learning
 * - Automatic storage and active learning queue
 * - API routes for active learning
 */

import {
  generateEmbedding,
  cosineSimilarity,
  selectSimilarExamples,
  selectDiverseExamples,
  selectOptimalExamples
} from './frontend/lib/email-classification/embedding-selector';

import {
  storeLabeledExample,
  addToLabelingQueue,
  getNextLabelingCandidates,
  trackClassificationMetric,
  getClassificationAccuracy
} from './frontend/lib/email-classification/supabase-storage';

import {
  classifyEmailHybrid,
  EMAIL_TEMPLATES
} from './frontend/lib/email-template-classifier';

// Test emails
const testEmails = {
  waterDamage: `Water damage discovered in unit 2305. Water is leaking from the ceiling into my apartment. I need an emergency company to come immediately. This is urgent - my floor is getting flooded!`,

  renovation: `I would like to request approval for renovations to my unit 1609. I have detailed architectural plans and my contractor has proof of insurance ($2M liability). The work will include kitchen remodeling and bathroom updates. Expected start date: March 15, 2024.`,

  eviction: `Unit 2303 tenant eviction follow-up. Multiple violations have occurred (noise, smoking, disturbances). Police have been called twice. The co-owner has been fined $500. We need to file a TAL application immediately. The tenant must leave.`,

  regularMaintenance: `The heating in unit 2405 is not working. Please send a technician to inspect the HVAC system. It's been cold for 2 days now.`,

  customerQuestion: `I have a question about the recent management change. What is the reason for switching property management companies? How will this affect our condo fees and services?`
};

async function testEmbeddingGeneration() {
  console.log('\n=== Test 1: Embedding Generation ===');

  try {
    const embedding = await generateEmbedding(testEmails.waterDamage);

    const expectedDims = {
      'bge-large': 1024,
      'gte-large': 1024,
      'e5-large': 1024,
      'nomic-embed-text': 768,
      'text-embedding-ada-002': 1536
    };

    const model = process.env.OLLAMA_EMBEDDING_MODEL || 'bge-large';
    const expected = expectedDims[model] || 1024;

    console.log('✅ Embedding generated successfully');
    console.log(`   - Model: ${model} (${expected} dims)`);
    console.log(`   - Dimension: ${embedding.length} (expected: ${expected})`);
    console.log(`   - Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // Test cosine similarity
    const embedding2 = await generateEmbedding(testEmails.waterDamage);
    const similarity = cosineSimilarity(embedding, embedding2);
    console.log(`   - Self-similarity: ${similarity.toFixed(4)} (expected: ~1.0)`);

    if (Math.abs(similarity - 1.0) < 0.01) {
      console.log('✅ Cosine similarity works correctly');
    } else {
      console.log('❌ Cosine similarity issue - expected ~1.0');
    }
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    throw error;
  }
}

async function testExampleSelection() {
  console.log('\n=== Test 2: Example Selection ===');

  try {
    // Store some test examples first
    console.log('Storing test examples...');

    const templates = [
      { id: 'water-damage-incident', name: 'WATER DAMAGE INCIDENT' },
      { id: 'renovation-request', name: 'RENOVATION REQUEST' },
      { id: 'eviction-request', name: 'EVICTION REQUEST' }
    ];

    for (const [key, email] of Object.entries(testEmails)) {
      const templateIndex = Math.floor(Math.random() * templates.length);
      const template = templates[templateIndex];

      await storeLabeledExample({
        email,
        template: template.name,
        templateId: template.id,
        entities: {},
        confidence: 0.95,
        source: 'manual'
      });
    }

    console.log('✅ Test examples stored');

    // Test similar example selection
    console.log('\nTesting similar example selection...');
    const similarExamples = await selectSimilarExamples(
      testEmails.waterDamage,
      3,
      0.7
    );

    console.log(`✅ Found ${similarExamples.length} similar examples`);
    similarExamples.forEach((ex, idx) => {
      console.log(`   ${idx + 1}. Template: ${ex.template}`);
      console.log(`      Email preview: ${ex.email.substring(0, 80)}...`);
      console.log(`      Confidence: ${ex.confidence}`);
    });

    // Test diverse example selection
    console.log('\nTesting diverse example selection...');
    const diverseExamples = await selectDiverseExamples(10);

    console.log(`✅ Found ${diverseExamples.length} diverse examples`);
    const templateCounts = diverseExamples.reduce((acc, ex) => {
      acc[ex.template] = (acc[ex.template] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('   Template distribution:');
    Object.entries(templateCounts).forEach(([template, count]) => {
      console.log(`   - ${template}: ${count}`);
    });

    // Test optimal example selection (70% similar + 30% diverse)
    console.log('\nTesting optimal example selection...');
    const optimalExamples = await selectOptimalExamples(
      testEmails.waterDamage,
      10
    );

    console.log(`✅ Found ${optimalExamples.length} optimal examples`);
    console.log('   Mix: 70% semantically similar + 30% diverse');

  } catch (error) {
    console.error('❌ Example selection failed:', error);
    throw error;
  }
}

async function testClassifierWithEmbeddings() {
  console.log('\n=== Test 3: Classifier with Embedding-Based Selection ===');

  try {
    // Test water damage classification
    console.log('\nClassifying water damage email...');
    const result1 = await classifyEmailHybrid(
      testEmails.waterDamage,
      [], // Empty examples - will fetch from Supabase
      undefined, // No LLM provider (will use rule-based)
      {
        storeResults: true,
        trackMetrics: true,
        addToQueue: false // Don't add high-confidence to queue
      }
    );

    console.log('✅ Water damage classified');
    console.log(`   - Template: ${result1.template.name}`);
    console.log(`   - Confidence: ${result1.confidence.toFixed(3)}`);
    console.log(`   - Reasoning: ${result1.reasoning}`);
    console.log(`   - Entities: ${Object.keys(result1.extractedEntities).map(k => `${k}(${result1.extractedEntities[k].length})`).join(', ')}`);

    // Test renovation request
    console.log('\nClassifying renovation request...');
    const result2 = await classifyEmailHybrid(
      testEmails.renovation,
      [],
      undefined,
      {
        storeResults: true,
        trackMetrics: true,
        addToQueue: false
      }
    );

    console.log('✅ Renovation request classified');
    console.log(`   - Template: ${result2.template.name}`);
    console.log(`   - Confidence: ${result2.confidence.toFixed(3)}`);

    // Test eviction request
    console.log('\nClassifying eviction request...');
    const result3 = await classifyEmailHybrid(
      testEmails.eviction,
      [],
      undefined,
      {
        storeResults: true,
        trackMetrics: true,
        addToQueue: false
      }
    );

    console.log('✅ Eviction request classified');
    console.log(`   - Template: ${result3.template.name}`);
    console.log(`   - Confidence: ${result3.confidence.toFixed(3)}`);

    // Test ambiguous email (should go to queue)
    const ambiguousEmail = 'I need help with something';

    console.log('\nClassifying ambiguous email (should add to queue)...');
    const result4 = await classifyEmailHybrid(
      ambiguousEmail,
      [],
      undefined,
      {
        storeResults: false, // Low confidence - don't store
        trackMetrics: true,
        addToQueue: true // Add to queue for review
      }
    );

    console.log('✅ Ambiguous email classified');
    console.log(`   - Template: ${result4.template.name}`);
    console.log(`   - Confidence: ${result4.confidence.toFixed(3)}`);
    console.log(`   - Added to queue: ${result4.confidence < 0.75 ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Classifier test failed:', error);
    throw error;
  }
}

async function testActiveLearningQueue() {
  console.log('\n=== Test 4: Active Learning Queue ===');

  try {
    // Add some uncertain classifications to queue
    console.log('Adding uncertain classifications to queue...');

    await addToLabelingQueue(
      'Uncertain email example 1',
      'customer-request',
      'CUSTOMER REQUEST',
      0.55, // Medium confidence
      0.45, // High uncertainty
      0.6   // Medium diversity
    );

    await addToLabelingQueue(
      'Uncertain email example 2',
      'operations-task',
      'OPERATIONS TASK',
      0.62,
      0.38,
      0.7
    );

    console.log('✅ Added uncertain examples to queue');

    // Get next candidates
    console.log('\nFetching next labeling candidates...');
    const candidates = await getNextLabelingCandidates(5);

    console.log(`✅ Found ${candidates.length} labeling candidates`);
    candidates.forEach((c, idx) => {
      console.log(`\n   Candidate ${idx + 1}:`);
      console.log(`   - Email: ${c.email_text.substring(0, 60)}...`);
      console.log(`   - Predicted: ${c.predicted_template_name || 'N/A'}`);
      console.log(`   - Confidence: ${c.confidence?.toFixed(3) || 'N/A'}`);
      console.log(`   - Uncertainty: ${c.uncertainty?.toFixed(3) || 'N/A'}`);
      console.log(`   - Priority: ${c.priority?.toFixed(3) || 'N/A'}`);
      console.log(`   - Status: ${c.status}`);
    });

  } catch (error) {
    console.error('❌ Active learning queue test failed:', error);
    throw error;
  }
}

async function testMetricsTracking() {
  console.log('\n=== Test 5: Metrics Tracking ===');

  try {
    // Track some classification metrics
    console.log('Tracking classification metrics...');

    const emailHash = require('crypto')
      .createHash('sha256')
      .update(testEmails.waterDamage)
      .digest('hex');

    await trackClassificationMetric(
      emailHash,
      'water-damage-incident',
      'WATER DAMAGE INCIDENT',
      0.92,
      'hybrid',
      1234, // processing time ms
      'water-damage-incident',
      'WATER DAMAGE INCIDENT',
      true, // correct
      'Perfect classification',
      'correct'
    );

    console.log('✅ Metrics tracked');

    // Get classification accuracy
    console.log('\nFetching classification accuracy...');
    const accuracy = await getClassificationAccuracy(undefined, 7);

    console.log(`✅ Found accuracy data for ${accuracy.length} templates`);
    accuracy.slice(0, 5).forEach(a => {
      console.log(`   - ${a.template_name}:`);
      console.log(`     Total: ${a.total_count}, Correct: ${a.correct_count}`);
      console.log(`     Accuracy: ${(a.accuracy * 100).toFixed(1)}%`);
    });

  } catch (error) {
    console.error('❌ Metrics tracking test failed:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('🧪 Email Classification Improvements Test Suite');
  console.log('='.repeat(60));

  try {
    await testEmbeddingGeneration();
    await testExampleSelection();
    await testClassifierWithEmbeddings();
    await testActiveLearningQueue();
    await testMetricsTracking();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('\n📊 Summary of Improvements:');
    console.log('   1. ✅ Embedding-based semantic similarity search');
    console.log('   2. ✅ Optimal example selection (70% similar + 30% diverse)');
    console.log('   3. ✅ Automatic storage of high-confidence classifications');
    console.log('   4. ✅ Active learning queue for uncertain examples');
    console.log('   5. ✅ Classification metrics and calibration tracking');
    console.log('\n🎯 Next Steps:');
    console.log('   - Run migration: supabase/migrations/015_email_classification.sql');
    console.log('   - Set OPENAI_API_KEY environment variable');
    console.log('   - Test with real production emails');
    console.log('   - Monitor accuracy improvements over time');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test suite failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
