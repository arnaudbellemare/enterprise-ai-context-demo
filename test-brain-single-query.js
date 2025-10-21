/**
 * Single Query Brain Systems Test
 *
 * Tests one complex legal query across all three brain systems
 */

const API_BASE = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

const LEGAL_QUERY = {
  query: 'Analyze the enforceability of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York, and the contract specifies Delaware law governs. What are the key legal considerations?',
  domain: 'legal',
};

async function testSystem(systemName, endpoint) {
  console.log(`\n${colorize(`Testing ${systemName}...`, 'cyan')}`);
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LEGAL_QUERY)
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok || !data.success) {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${data.error || 'Unknown error'}`);
      console.log(`  ${colorize('Duration:', 'yellow')} ${duration}ms`);
      return { success: false, duration, error: data.error };
    }

    console.log(`  ${colorize('✓', 'green')} Duration: ${duration}ms`);
    console.log(`  ${colorize('✓', 'green')} Skills: ${data.brain_processing?.activated_skills?.length || 0}`);
    console.log(`  ${colorize('✓', 'green')} Skills List: ${data.brain_processing?.activated_skills?.join(', ') || 'none'}`);
    console.log(`  ${colorize('✓', 'green')} System: ${data.brain_processing?.synthesis_method || 'unknown'}`);
    console.log(`  ${colorize('✓', 'green')} Response Length: ${data.response?.length || 0} chars`);

    if (data.metadata?.cache_hit_rate !== undefined) {
      console.log(`  ${colorize('✓', 'green')} Cache Hit Rate: ${(data.metadata.cache_hit_rate * 100).toFixed(1)}%`);
    }

    if (data.metadata?.system) {
      console.log(`  ${colorize('✓', 'green')} System Type: ${data.metadata.system}`);
    }

    return {
      success: true,
      duration,
      skills: data.brain_processing?.activated_skills || [],
      responseLength: data.response?.length || 0,
      synthesis: data.brain_processing?.synthesis_method,
      systemType: data.metadata?.system,
      cacheHitRate: data.metadata?.cache_hit_rate || 0,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ${colorize('✗', 'red')} EXCEPTION: ${error.message}`);
    console.log(`  ${colorize('Duration:', 'yellow')} ${duration}ms`);
    return { success: false, duration, error: error.message };
  }
}

async function runTest() {
  console.log(colorize('\n╔═══════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║     Brain Systems Single Query Comparison Test           ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════╝', 'blue'));

  console.log(`\nQuery: "${LEGAL_QUERY.query.substring(0, 80)}..."`);
  console.log(`Domain: ${LEGAL_QUERY.domain}`);

  // Check feature flag
  const usingNewSkills = process.env.BRAIN_USE_NEW_SKILLS === 'true';
  console.log(`\n${colorize('Configuration:', 'cyan')}`);
  console.log(`  BRAIN_USE_NEW_SKILLS = ${usingNewSkills ? colorize('true (new modular)', 'green') : colorize('false (original)', 'yellow')}`);

  const results = {};

  // Test 1: Original/New Brain (depends on env var)
  console.log(`\n${colorize('═'.repeat(60), 'blue')}`);
  console.log(colorize(usingNewSkills ? 'System 1: New Modular Brain' : 'System 1: Original Brain', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));
  results.brain = await testSystem(usingNewSkills ? 'New Modular Brain' : 'Original Brain', '/api/brain');

  // Test 2: Brain-Enhanced
  console.log(`\n${colorize('═'.repeat(60), 'blue')}`);
  console.log(colorize('System 2: Brain-Enhanced', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));
  results.enhanced = await testSystem('Brain-Enhanced', '/api/brain-enhanced');

  // Summary
  console.log(`\n${colorize('╔═══════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                    Test Summary                           ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════╝', 'blue'));

  console.log(`\n${colorize('Results:', 'cyan')}`);

  if (results.brain.success) {
    console.log(`\n  ${colorize(usingNewSkills ? '🆕 New Modular Brain:' : '📦 Original Brain:', 'green')}`);
    console.log(`     Duration: ${results.brain.duration}ms`);
    console.log(`     Skills: ${results.brain.skills.length} (${results.brain.skills.join(', ')})`);
    console.log(`     Response: ${results.brain.responseLength} chars`);
    if (results.brain.cacheHitRate > 0) {
      console.log(`     Cache: ${(results.brain.cacheHitRate * 100).toFixed(1)}% hit rate`);
    }
  } else {
    console.log(`\n  ${colorize(usingNewSkills ? '🆕 New Modular Brain:' : '📦 Original Brain:', 'red')} FAILED`);
    console.log(`     Error: ${results.brain.error}`);
  }

  if (results.enhanced.success) {
    console.log(`\n  ${colorize('🔍 Brain-Enhanced:', 'green')}`);
    console.log(`     Duration: ${results.enhanced.duration}ms`);
    console.log(`     Skills: ${results.enhanced.skills.length} (${results.enhanced.skills.join(', ')})`);
    console.log(`     Response: ${results.enhanced.responseLength} chars`);
  } else {
    console.log(`\n  ${colorize('🔍 Brain-Enhanced:', 'red')} FAILED`);
    console.log(`     Error: ${results.enhanced.error}`);
  }

  // Winner
  if (results.brain.success && results.enhanced.success) {
    console.log(`\n${colorize('Performance Comparison:', 'cyan')}`);
    const faster = results.brain.duration < results.enhanced.duration ? 'brain' : 'enhanced';
    const speedDiff = Math.abs(results.brain.duration - results.enhanced.duration);
    const speedPercent = (speedDiff / Math.max(results.brain.duration, results.enhanced.duration) * 100).toFixed(1);

    console.log(`  ${colorize('⚡ Speed Winner:', 'yellow')} ${faster === 'brain' ? (usingNewSkills ? 'New Modular Brain' : 'Original Brain') : 'Brain-Enhanced'}`);
    console.log(`     ${speedPercent}% faster (${speedDiff}ms difference)`);

    const moreThorough = results.brain.responseLength > results.enhanced.responseLength ? 'brain' : 'enhanced';
    console.log(`  ${colorize('📝 More Detailed:', 'yellow')} ${moreThorough === 'brain' ? (usingNewSkills ? 'New Modular Brain' : 'Original Brain') : 'Brain-Enhanced'}`);
  } else if (results.brain.success) {
    console.log(`\n${colorize('🏆 Winner: ' + (usingNewSkills ? 'New Modular Brain' : 'Original Brain'), 'green')} (only successful system)`);
  } else if (results.enhanced.success) {
    console.log(`\n${colorize('🏆 Winner: Brain-Enhanced', 'green')} (only successful system)`);
  } else {
    console.log(`\n${colorize('❌ Both systems failed', 'red')}`);
  }

  // Next steps
  console.log(`\n${colorize('Next Steps:', 'cyan')}`);
  if (usingNewSkills) {
    console.log(`  ✅ Currently using NEW modular system`);
    console.log(`  To test original system:`);
    console.log(`     ${colorize('unset BRAIN_USE_NEW_SKILLS', 'yellow')}`);
    console.log(`     ${colorize('npm run dev', 'yellow')}`);
    console.log(`     ${colorize('node test-brain-single-query.js', 'yellow')}`);
  } else {
    console.log(`  ✅ Currently using ORIGINAL system`);
    console.log(`  To test new modular system:`);
    console.log(`     ${colorize('export BRAIN_USE_NEW_SKILLS=true', 'yellow')}`);
    console.log(`     ${colorize('npm run dev', 'yellow')}`);
    console.log(`     ${colorize('node test-brain-single-query.js', 'yellow')}`);
  }

  console.log('');
}

runTest().catch(error => {
  console.error(`\n${colorize('Fatal error:', 'red')}`, error);
  process.exit(1);
});
