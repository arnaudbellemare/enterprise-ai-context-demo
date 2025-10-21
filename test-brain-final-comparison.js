/**
 * Final Brain Systems Comparison Test
 *
 * Tests Original Brain vs Brain-Enhanced with 3 legal queries
 * Provides comprehensive comparison and recommendation
 */

const API_BASE = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 3 Legal Queries (simplified from original 5)
const LEGAL_QUERIES = [
  {
    id: 'Q1',
    name: 'Non-Compete Enforceability',
    query: 'Analyze the enforceability of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York. What are the key legal considerations?',
    domain: 'legal',
    complexity: 'MEDIUM',
  },
  {
    id: 'Q2',
    name: 'GDPR Compliance',
    query: 'A US-based SaaS company collects email addresses from EU users for marketing purposes. What are the minimum GDPR compliance requirements they must meet?',
    domain: 'legal',
    complexity: 'MEDIUM-HIGH',
  },
  {
    id: 'Q3',
    name: 'Contract Amendment',
    query: 'A company wants to add a mandatory arbitration clause to their existing terms of service. What legal steps must they take to implement this change properly?',
    domain: 'legal',
    complexity: 'MEDIUM',
  },
];

async function testSystem(systemName, endpoint, query) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.query, domain: query.domain })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok || !data.success) {
      return {
        success: false,
        duration,
        error: data.error || 'Unknown error',
      };
    }

    return {
      success: true,
      duration,
      skills: data.brain_processing?.activated_skills || [],
      responseLength: data.response?.length || 0,
      response: data.response || '',
      system: data.brain_processing?.synthesis_method || 'unknown',
    };

  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function runComparison() {
  console.log(colorize('\n╔═══════════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║    Final Brain Systems Comparison - 3 Legal Queries          ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════╝', 'blue'));

  const results = {
    original: [],
    enhanced: [],
  };

  for (const query of LEGAL_QUERIES) {
    console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
    console.log(colorize(`${query.id}: ${query.name} (${query.complexity})`, 'bold'));
    console.log(colorize('━'.repeat(70), 'blue'));
    console.log(`Query: "${query.query.substring(0, 80)}..."\n`);

    // Test Original Brain
    console.log(colorize('Testing Original Brain...', 'cyan'));
    const original = await testSystem('Original Brain', '/api/brain', query);
    results.original.push({ query, ...original });

    if (original.success) {
      console.log(`  ${colorize('✓', 'green')} Duration: ${original.duration}ms`);
      console.log(`  ${colorize('✓', 'green')} Skills: ${original.skills.length} (${original.skills.join(', ')})`);
      console.log(`  ${colorize('✓', 'green')} Length: ${original.responseLength} chars`);
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${original.error}`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test Brain-Enhanced
    console.log(`\n${colorize('Testing Brain-Enhanced...', 'cyan')}`);
    const enhanced = await testSystem('Brain-Enhanced', '/api/brain-enhanced', query);
    results.enhanced.push({ query, ...enhanced });

    if (enhanced.success) {
      console.log(`  ${colorize('✓', 'green')} Duration: ${enhanced.duration}ms`);
      console.log(`  ${colorize('✓', 'green')} Length: ${enhanced.responseLength} chars`);
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${enhanced.error}`);
    }

    // Delay between queries
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Print Summary
  printSummary(results);
}

function printSummary(results) {
  console.log(`\n${colorize('╔═══════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                    Final Results Summary                      ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════╝', 'blue'));

  const originalSuccess = results.original.filter(r => r.success);
  const enhancedSuccess = results.enhanced.filter(r => r.success);

  console.log(`\n${colorize('Success Rates:', 'cyan')}`);
  console.log(`  Original Brain: ${colorize(`${originalSuccess.length}/3 (${(originalSuccess.length / 3 * 100).toFixed(0)}%)`, originalSuccess.length === 3 ? 'green' : 'yellow')}`);
  console.log(`  Brain-Enhanced: ${colorize(`${enhancedSuccess.length}/3 (${(enhancedSuccess.length / 3 * 100).toFixed(0)}%)`, enhancedSuccess.length === 3 ? 'green' : 'yellow')}`);

  if (originalSuccess.length > 0) {
    const avgDuration = originalSuccess.reduce((sum, r) => sum + r.duration, 0) / originalSuccess.length;
    const avgLength = originalSuccess.reduce((sum, r) => sum + r.responseLength, 0) / originalSuccess.length;
    const avgSkills = originalSuccess.reduce((sum, r) => sum + r.skills.length, 0) / originalSuccess.length;

    console.log(`\n${colorize('📦 Original Brain Performance:', 'cyan')}`);
    console.log(`  Avg Duration: ${colorize(`${avgDuration.toFixed(0)}ms`, 'yellow')}`);
    console.log(`  Avg Response Length: ${colorize(`${avgLength.toFixed(0)} chars`, 'yellow')}`);
    console.log(`  Avg Skills Activated: ${colorize(`${avgSkills.toFixed(1)}`, 'yellow')}`);
  }

  if (enhancedSuccess.length > 0) {
    const avgDuration = enhancedSuccess.reduce((sum, r) => sum + r.duration, 0) / enhancedSuccess.length;
    const avgLength = enhancedSuccess.reduce((sum, r) => sum + r.responseLength, 0) / enhancedSuccess.length;

    console.log(`\n${colorize('🔍 Brain-Enhanced Performance:', 'cyan')}`);
    console.log(`  Avg Duration: ${colorize(`${avgDuration.toFixed(0)}ms`, 'yellow')}`);
    console.log(`  Avg Response Length: ${colorize(`${avgLength.toFixed(0)} chars`, 'yellow')}`);
  }

  // Winner Analysis
  console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
  console.log(colorize('Performance Winners', 'bold'));
  console.log(colorize('━'.repeat(70), 'blue'));

  if (originalSuccess.length > 0 && enhancedSuccess.length > 0) {
    const originalAvgDuration = originalSuccess.reduce((sum, r) => sum + r.duration, 0) / originalSuccess.length;
    const enhancedAvgDuration = enhancedSuccess.reduce((sum, r) => sum + r.duration, 0) / enhancedSuccess.length;
    const originalAvgLength = originalSuccess.reduce((sum, r) => sum + r.responseLength, 0) / originalSuccess.length;
    const enhancedAvgLength = enhancedSuccess.reduce((sum, r) => sum + r.responseLength, 0) / enhancedSuccess.length;

    console.log(`\n${colorize('⚡ Speed Champion:', 'yellow')}`);
    if (originalAvgDuration < enhancedAvgDuration) {
      const improvement = ((enhancedAvgDuration - originalAvgDuration) / enhancedAvgDuration * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Original Brain', 'green')} - ${improvement}% faster (${(enhancedAvgDuration - originalAvgDuration).toFixed(0)}ms saved)`);
    } else {
      const improvement = ((originalAvgDuration - enhancedAvgDuration) / originalAvgDuration * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Brain-Enhanced', 'green')} - ${improvement}% faster (${(originalAvgDuration - enhancedAvgDuration).toFixed(0)}ms saved)`);
    }

    console.log(`\n${colorize('📝 Detail Champion:', 'yellow')}`);
    if (originalAvgLength > enhancedAvgLength) {
      const improvement = ((originalAvgLength - enhancedAvgLength) / enhancedAvgLength * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Original Brain', 'green')} - ${improvement}% more detailed (${(originalAvgLength - enhancedAvgLength).toFixed(0)} more chars)`);
    } else {
      const improvement = ((enhancedAvgLength - originalAvgLength) / originalAvgLength * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Brain-Enhanced', 'green')} - ${improvement}% more detailed (${(enhancedAvgLength - originalAvgLength).toFixed(0)} more chars)`);
    }

    console.log(`\n${colorize('🎯 Overall Recommendation:', 'yellow')}`);
    const originalScore = (originalSuccess.length / 3 * 100) - (originalAvgDuration / 1000);
    const enhancedScore = (enhancedSuccess.length / 3 * 100) - (enhancedAvgDuration / 1000) + (enhancedAvgLength / 100);

    if (originalScore > enhancedScore) {
      console.log(`  ${colorize('🏆 Original Brain', 'green')} - Better overall (reliability + speed)`);
      console.log(`  Use Original Brain for: Complex legal analysis, multi-skill reasoning`);
    } else {
      console.log(`  ${colorize('🏆 Brain-Enhanced', 'green')} - Better overall (detail + enhanced search)`);
      console.log(`  Use Brain-Enhanced for: Knowledge retrieval, comprehensive answers`);
    }
  }

  // Query-by-Query
  console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
  console.log(colorize('Query-by-Query Breakdown', 'bold'));
  console.log(colorize('━'.repeat(70), 'blue'));

  for (let i = 0; i < LEGAL_QUERIES.length; i++) {
    const query = LEGAL_QUERIES[i];
    const original = results.original[i];
    const enhanced = results.enhanced[i];

    console.log(`\n${colorize(query.id + ': ' + query.name, 'yellow')}`);

    if (original.success && enhanced.success) {
      const speedDiff = ((original.duration - enhanced.duration) / original.duration * 100).toFixed(1);
      const lengthDiff = ((enhanced.responseLength - original.responseLength) / original.responseLength * 100).toFixed(1);

      console.log(`  Original: ${original.duration}ms, ${original.responseLength} chars, ${original.skills.length} skills`);
      console.log(`  Enhanced: ${enhanced.duration}ms, ${enhanced.responseLength} chars`);
      console.log(`  Winner: ${speedDiff > 0 ? colorize('Original (faster)', 'green') : colorize('Enhanced (faster)', 'green')}`);
    } else {
      if (original.success) console.log(`  Original: ${colorize('SUCCESS', 'green')}`);
      else console.log(`  Original: ${colorize('FAILED', 'red')}`);

      if (enhanced.success) console.log(`  Enhanced: ${colorize('SUCCESS', 'green')}`);
      else console.log(`  Enhanced: ${colorize('FAILED', 'red')}`);
    }
  }

  console.log(`\n${colorize('╔═══════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                    Next Steps                                 ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════╝', 'blue'));

  console.log(`\n${colorize('To test New Modular System:', 'cyan')}`);
  console.log(`  1. Fix brain-skills TypeScript errors`);
  console.log(`  2. ${colorize('export BRAIN_USE_NEW_SKILLS=true', 'yellow')}`);
  console.log(`  3. ${colorize('npm run dev', 'yellow')}`);
  console.log(`  4. ${colorize('node test-brain-final-comparison.js', 'yellow')}`);

  console.log('');
}

runComparison().catch(error => {
  console.error(`\n${colorize('Fatal error:', 'red')}`, error);
  process.exit(1);
});
