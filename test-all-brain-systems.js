/**
 * Comprehensive Brain Systems Test
 *
 * Tests ALL three brain systems:
 * 1. Original Brain (/api/brain)
 * 2. Brain-Enhanced (/api/brain-enhanced)
 * 3. New Modular Skills System (if BRAIN_USE_NEW_SKILLS=true)
 *
 * Validates that all systems work correctly and compares performance
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

// Test queries covering different domains and complexity levels
const TEST_QUERIES = [
  {
    id: 'Q1',
    name: 'Simple Math',
    query: 'What is 15 * 7?',
    domain: 'general',
    complexity: 'LOW',
    expectedSkills: ['basic_reasoning'],
  },
  {
    id: 'Q2',
    name: 'Legal Analysis',
    query: 'What are the key legal considerations for a remote employee in California working for a New York company regarding non-compete clauses?',
    domain: 'legal',
    complexity: 'MEDIUM-HIGH',
    expectedSkills: ['trm', 'teacherStudent'],
  },
  {
    id: 'Q3',
    name: 'Technical Complex',
    query: 'Explain how to implement a distributed cache with Redis Cluster including replication, sharding, and failover strategies.',
    domain: 'technical',
    complexity: 'HIGH',
    expectedSkills: ['trm', 'gepa', 'ace'],
  },
];

async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testSystem(systemName, endpoint, query, timeout = 30000) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.query, domain: query.domain }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        duration,
        error: `HTTP ${response.status}: ${text.substring(0, 200)}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
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
      system: data.metadata?.system || data.brain_processing?.synthesis_method || 'unknown',
      usingNewSkills: data.metadata?.using_new_skills || false,
    };

  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

async function runComprehensiveTest() {
  console.log(colorize('\n╔═══════════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║       Comprehensive Brain Systems Test Suite                 ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════╝', 'blue'));

  // Health check
  console.log(`\n${colorize('Health Check...', 'cyan')}`);
  const isHealthy = await checkServerHealth();

  if (!isHealthy) {
    console.log(`${colorize('⚠️  Server health check failed or /api/health not available', 'yellow')}`);
    console.log(`${colorize('   Continuing anyway...', 'yellow')}`);
  } else {
    console.log(`${colorize('✓', 'green')} Server is healthy`);
  }

  const results = {
    original: [],
    enhanced: [],
    modular: [],
  };

  for (const query of TEST_QUERIES) {
    console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
    console.log(colorize(`${query.id}: ${query.name} (Complexity: ${query.complexity})`, 'bold'));
    console.log(colorize('━'.repeat(70), 'blue'));
    console.log(`Query: "${query.query.substring(0, 80)}${query.query.length > 80 ? '...' : ''}"`);
    console.log(`Domain: ${query.domain}\n`);

    // Test 1: Original Brain
    console.log(colorize('1️⃣  Testing Original Brain (/api/brain)...', 'cyan'));
    const original = await testSystem('Original Brain', '/api/brain', query);
    results.original.push({ query, ...original });

    if (original.success) {
      console.log(`  ${colorize('✓', 'green')} SUCCESS`);
      console.log(`    Duration: ${colorize(`${original.duration}ms`, 'yellow')}`);
      console.log(`    Skills: ${original.skills.length} (${original.skills.slice(0, 3).join(', ')}${original.skills.length > 3 ? '...' : ''})`);
      console.log(`    Response: ${original.responseLength} chars`);
      console.log(`    System: ${original.system}`);
      if (original.usingNewSkills) {
        console.log(`    ${colorize('🆕 Using New Modular Skills', 'magenta')}`);
      }
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${original.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Brain-Enhanced
    console.log(`\n${colorize('2️⃣  Testing Brain-Enhanced (/api/brain-enhanced)...', 'cyan')}`);
    const enhanced = await testSystem('Brain-Enhanced', '/api/brain-enhanced', query);
    results.enhanced.push({ query, ...enhanced });

    if (enhanced.success) {
      console.log(`  ${colorize('✓', 'green')} SUCCESS`);
      console.log(`    Duration: ${colorize(`${enhanced.duration}ms`, 'yellow')}`);
      console.log(`    Response: ${enhanced.responseLength} chars`);
      console.log(`    System: ${enhanced.system}`);
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${enhanced.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Modular System (via Original Brain with env var)
    console.log(`\n${colorize('3️⃣  Checking for New Modular Skills System...', 'cyan')}`);
    if (original.success && original.usingNewSkills) {
      console.log(`  ${colorize('✓', 'green')} Original Brain is using NEW modular skills`);
      results.modular.push({ query, ...original, isModular: true });
    } else {
      console.log(`  ${colorize('ℹ️', 'blue')} Not using new modular skills (set BRAIN_USE_NEW_SKILLS=true to enable)`);
      results.modular.push({ query, success: false, error: 'Not enabled', isModular: false });
    }

    console.log(`\n${colorize('⏱️  Cooldown (3s)...', 'yellow')}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Print comprehensive summary
  printComprehensiveSummary(results);
}

function printComprehensiveSummary(results) {
  console.log(`\n${colorize('╔═══════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                   Comprehensive Results                       ║', 'blue'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════╝', 'blue'));

  const originalSuccess = results.original.filter(r => r.success);
  const enhancedSuccess = results.enhanced.filter(r => r.success);
  const modularEnabled = results.modular.some(r => r.isModular);
  const modularSuccess = results.modular.filter(r => r.success && r.isModular);

  console.log(`\n${colorize('📊 Success Rates:', 'cyan')}`);
  console.log(`  Original Brain:     ${formatSuccessRate(originalSuccess.length, TEST_QUERIES.length)}`);
  console.log(`  Brain-Enhanced:     ${formatSuccessRate(enhancedSuccess.length, TEST_QUERIES.length)}`);
  console.log(`  Modular Skills:     ${modularEnabled ? formatSuccessRate(modularSuccess.length, TEST_QUERIES.length) : colorize('Not Enabled', 'yellow')}`);

  // Performance metrics
  if (originalSuccess.length > 0) {
    printSystemMetrics('Original Brain', originalSuccess);
  }

  if (enhancedSuccess.length > 0) {
    printSystemMetrics('Brain-Enhanced', enhancedSuccess);
  }

  if (modularSuccess.length > 0) {
    printSystemMetrics('Modular Skills', modularSuccess);
  }

  // Comparative analysis
  if (originalSuccess.length > 0 && enhancedSuccess.length > 0) {
    console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
    console.log(colorize('Comparative Analysis', 'bold'));
    console.log(colorize('━'.repeat(70), 'blue'));

    const originalAvg = calculateAverages(originalSuccess);
    const enhancedAvg = calculateAverages(enhancedSuccess);

    console.log(`\n${colorize('⚡ Speed Comparison:', 'yellow')}`);
    const speedWinner = originalAvg.duration < enhancedAvg.duration ? 'Original' : 'Enhanced';
    const speedDiff = Math.abs(originalAvg.duration - enhancedAvg.duration);
    const speedPct = (speedDiff / Math.max(originalAvg.duration, enhancedAvg.duration) * 100).toFixed(1);
    console.log(`  Winner: ${colorize(speedWinner, 'green')} (${speedPct}% faster, ${speedDiff.toFixed(0)}ms saved)`);

    console.log(`\n${colorize('📝 Detail Comparison:', 'yellow')}`);
    const detailWinner = originalAvg.responseLength > enhancedAvg.responseLength ? 'Original' : 'Enhanced';
    const detailDiff = Math.abs(originalAvg.responseLength - enhancedAvg.responseLength);
    const detailPct = (detailDiff / Math.max(originalAvg.responseLength, enhancedAvg.responseLength) * 100).toFixed(1);
    console.log(`  Winner: ${colorize(detailWinner, 'green')} (${detailPct}% more detailed, ${detailDiff.toFixed(0)} more chars)`);

    console.log(`\n${colorize('🏆 Overall Recommendation:', 'yellow')}`);
    const originalScore = (originalSuccess.length / TEST_QUERIES.length * 100) +
                          (1000 / originalAvg.duration) +
                          (originalAvg.responseLength / 100);
    const enhancedScore = (enhancedSuccess.length / TEST_QUERIES.length * 100) +
                          (1000 / enhancedAvg.duration) +
                          (enhancedAvg.responseLength / 100);

    if (originalScore > enhancedScore) {
      console.log(`  ${colorize('🥇 Original Brain', 'green')} - Best overall performance`);
      console.log(`     Use for: Complex reasoning, multi-skill activation, reliability`);
    } else {
      console.log(`  ${colorize('🥇 Brain-Enhanced', 'green')} - Best overall performance`);
      console.log(`     Use for: Knowledge retrieval, comprehensive answers, detail`);
    }

    if (modularEnabled) {
      console.log(`\n  ${colorize('🆕 Modular Skills:', 'magenta')} ${modularSuccess.length > 0 ? 'Working correctly' : 'Needs attention'}`);
      if (modularSuccess.length > 0) {
        const modularAvg = calculateAverages(modularSuccess);
        console.log(`     Performance: ${modularAvg.duration.toFixed(0)}ms avg, ${modularAvg.responseLength.toFixed(0)} chars avg`);
      }
    } else {
      console.log(`\n  ${colorize('ℹ️  To enable Modular Skills:', 'blue')}`);
      console.log(`     export BRAIN_USE_NEW_SKILLS=true`);
      console.log(`     npm run dev`);
    }
  }

  // Query-by-query breakdown
  console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
  console.log(colorize('Query-by-Query Breakdown', 'bold'));
  console.log(colorize('━'.repeat(70), 'blue'));

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    const original = results.original[i];
    const enhanced = results.enhanced[i];
    const modular = results.modular[i];

    console.log(`\n${colorize(`${query.id}: ${query.name}`, 'yellow')}`);
    console.log(`  Complexity: ${query.complexity}`);

    console.log(`\n  ${colorize('Original Brain:', 'cyan')}`);
    if (original.success) {
      console.log(`    ✓ ${original.duration}ms, ${original.responseLength} chars, ${original.skills.length} skills`);
    } else {
      console.log(`    ✗ ${colorize('FAILED', 'red')}: ${original.error}`);
    }

    console.log(`\n  ${colorize('Brain-Enhanced:', 'cyan')}`);
    if (enhanced.success) {
      console.log(`    ✓ ${enhanced.duration}ms, ${enhanced.responseLength} chars`);
    } else {
      console.log(`    ✗ ${colorize('FAILED', 'red')}: ${enhanced.error}`);
    }

    if (modularEnabled && modular.isModular) {
      console.log(`\n  ${colorize('Modular Skills:', 'magenta')}`);
      if (modular.success) {
        console.log(`    ✓ Active and working`);
      } else {
        console.log(`    ✗ ${colorize('FAILED', 'red')}`);
      }
    }

    // Winner
    if (original.success || enhanced.success) {
      let winner = 'TIE';
      if (original.success && !enhanced.success) winner = 'Original';
      else if (!original.success && enhanced.success) winner = 'Enhanced';
      else if (original.success && enhanced.success) {
        winner = original.duration < enhanced.duration ? 'Original' : 'Enhanced';
      }
      console.log(`\n  Winner: ${colorize(winner, 'green')}`);
    }
  }

  // Health & Status
  console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
  console.log(colorize('System Health & Status', 'bold'));
  console.log(colorize('━'.repeat(70), 'blue'));

  const totalTests = TEST_QUERIES.length * 2; // original + enhanced
  const totalSuccess = originalSuccess.length + enhancedSuccess.length;
  const healthScore = (totalSuccess / totalTests * 100).toFixed(0);

  console.log(`\n${colorize('Overall Health Score:', 'cyan')} ${colorize(`${healthScore}%`, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red')}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Successful: ${totalSuccess}`);
  console.log(`  Failed: ${totalTests - totalSuccess}`);

  const status = healthScore >= 80 ? '🟢 HEALTHY' : healthScore >= 60 ? '🟡 DEGRADED' : '🔴 UNHEALTHY';
  console.log(`\nStatus: ${colorize(status, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red')}`);

  // Recommendations
  console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
  console.log(colorize('Recommendations', 'bold'));
  console.log(colorize('━'.repeat(70), 'blue'));

  console.log(`\n${colorize('✅ Working Systems:', 'green')}`);
  if (originalSuccess.length === TEST_QUERIES.length) {
    console.log(`  • Original Brain: Fully operational`);
  }
  if (enhancedSuccess.length === TEST_QUERIES.length) {
    console.log(`  • Brain-Enhanced: Fully operational`);
  }
  if (modularSuccess.length > 0) {
    console.log(`  • Modular Skills: Operational`);
  }

  if (originalSuccess.length < TEST_QUERIES.length || enhancedSuccess.length < TEST_QUERIES.length) {
    console.log(`\n${colorize('⚠️  Issues Found:', 'yellow')}`);
    if (originalSuccess.length < TEST_QUERIES.length) {
      const failed = results.original.filter(r => !r.success);
      console.log(`  • Original Brain: ${failed.length} failures`);
      failed.forEach(f => {
        console.log(`    - ${f.query.name}: ${f.error}`);
      });
    }
    if (enhancedSuccess.length < TEST_QUERIES.length) {
      const failed = results.enhanced.filter(r => !r.success);
      console.log(`  • Brain-Enhanced: ${failed.length} failures`);
      failed.forEach(f => {
        console.log(`    - ${f.query.name}: ${f.error}`);
      });
    }
  }

  console.log(`\n${colorize('📋 Next Steps:', 'cyan')}`);
  if (healthScore >= 80) {
    console.log(`  ✓ All systems working well!`);
    if (!modularEnabled) {
      console.log(`  • Consider enabling modular skills for better performance:`);
      console.log(`    export BRAIN_USE_NEW_SKILLS=true && npm run dev`);
    }
  } else {
    console.log(`  • Review failed queries and check logs`);
    console.log(`  • Verify environment variables are set correctly`);
    console.log(`  • Check Supabase connection and migrations`);
  }

  console.log('');
}

function formatSuccessRate(success, total) {
  const pct = (success / total * 100).toFixed(0);
  const color = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
  return `${colorize(`${success}/${total} (${pct}%)`, color)}`;
}

function printSystemMetrics(systemName, results) {
  const avg = calculateAverages(results);

  console.log(`\n${colorize(`📦 ${systemName} Performance:`, 'cyan')}`);
  console.log(`  Avg Duration:        ${colorize(`${avg.duration.toFixed(0)}ms`, 'yellow')}`);
  console.log(`  Avg Response Length: ${colorize(`${avg.responseLength.toFixed(0)} chars`, 'yellow')}`);
  if (avg.skillsCount) {
    console.log(`  Avg Skills Activated: ${colorize(`${avg.skillsCount.toFixed(1)}`, 'yellow')}`);
  }
  console.log(`  Min/Max Duration:    ${Math.min(...results.map(r => r.duration))}ms / ${Math.max(...results.map(r => r.duration))}ms`);
}

function calculateAverages(results) {
  const count = results.length;
  return {
    duration: results.reduce((sum, r) => sum + r.duration, 0) / count,
    responseLength: results.reduce((sum, r) => sum + r.responseLength, 0) / count,
    skillsCount: results.some(r => r.skills)
      ? results.reduce((sum, r) => sum + (r.skills?.length || 0), 0) / count
      : null,
  };
}

// Run the test
console.log(colorize('\n🚀 Starting Comprehensive Brain Systems Test...', 'cyan'));
console.log(colorize('   This will test Original Brain, Brain-Enhanced, and Modular Skills\n', 'cyan'));

runComprehensiveTest().catch(error => {
  console.error(`\n${colorize('Fatal error:', 'red')}`, error);
  process.exit(1);
});
