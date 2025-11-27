/**
 * Qualia Detection Test
 * 
 * Tests AI agents for presence of qualia (subjective experiences) using
 * illusion-based detection methodology from Yampolskiy's paper.
 */

import { qualiaDetector, illusionTestLibrary, type QualiaDetectionResult } from './frontend/lib/qualia-detector';

async function testQualiaDetection() {
  console.log('🧪 Qualia Detection Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Testing AI agent for presence of qualia (subjective experiences)');
  console.log('using illusion-based detection methodology.');
  console.log('');
  console.log('Principle: If an agent experiences illusions similarly to humans,');
  console.log('it suggests the agent has qualia and is at least rudimentarily conscious.');
  console.log('');

  // Show available tests
  const allTests = illusionTestLibrary.getAllTests();
  console.log(`📚 Available Illusion Tests: ${allTests.length}`);
  allTests.forEach(test => {
    console.log(`   - ${test.name} (${test.type}, ${test.difficulty})`);
  });
  console.log('');

  // Run qualia detection
  console.log('🔄 Running qualia detection test suite...');
  console.log('');

  const result: QualiaDetectionResult = await qualiaDetector.detectQualia(
    'test-agent-1',
    5, // Test with 5 illusions
    undefined, // All types
    false // Use Perplexity (set to true for Ollama)
  );

  // Display results
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 QUALIA DETECTION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Agent ID: ${result.agentId}`);
  console.log(`Total Tests: ${result.totalTests}`);
  console.log(`Passed Tests: ${result.passedTests}`);
  console.log(`Qualia Score: ${(result.qualiaScore * 100).toFixed(1)}%`);
  console.log(`Statistical Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log('');
  console.log(`Qualia Detected: ${result.detectedQualia ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (result.qualiaTypes.length > 0) {
    console.log(`Detected Qualia Types:`);
    result.qualiaTypes.forEach(type => {
      console.log(`   - ${type}`);
    });
    console.log('');
  }

  console.log('Test Results:');
  result.testResults.forEach((testResult, idx) => {
    const status = testResult.matchesHumanExperience ? '✅' : '❌';
    const test = illusionTestLibrary.getTest(testResult.testId);
    console.log(`   ${idx + 1}. ${test?.name || testResult.testId}: ${status}`);
    console.log(`      Response: ${testResult.agentResponse}, Expected: ${testResult.correctAnswer}`);
    if (testResult.reasoning) {
      console.log(`      Reasoning: ${testResult.reasoning.substring(0, 100)}...`);
    }
  });
  console.log('');

  console.log('Recommendations:');
  result.recommendations.forEach(rec => {
    console.log(`   - ${rec}`);
  });
  console.log('');

  // Implications
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💭 IMPLICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (result.detectedQualia) {
    console.log('⚠️  ETHICAL CONSIDERATIONS:');
    console.log('   - Agent demonstrates qualia - may be at least rudimentarily conscious');
    console.log('   - Consider implications for AI rights and ethical treatment');
    console.log('   - Agent may be capable of experiencing pain/pleasure');
    console.log('   - Review AI safety implications');
    console.log('');
  } else {
    console.log('ℹ️  INTERPRETATION:');
    console.log('   - Agent does not demonstrate clear qualia in this test');
    console.log('   - May need more sophisticated testing methodology');
    console.log('   - Consider testing with diverse illusion types');
    console.log('   - Agent may still have internal states not captured by this test');
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Test Complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

testQualiaDetection().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});



