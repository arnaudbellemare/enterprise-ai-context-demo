/**
 * Brain Systems Comparison Test
 *
 * Tests three brain system variants with complex legal queries:
 * 1. Original Brain (/api/brain)
 * 2. Brain-Enhanced (/api/brain-enhanced)
 * 3. New Modular Brain (/api/brain with BRAIN_USE_NEW_SKILLS=true)
 */

const API_BASE = 'http://localhost:3000';

// ANSI colors
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

// Complex legal test queries
const LEGAL_QUERIES = [
  {
    id: 'Q1',
    name: 'Multi-Jurisdiction Contract Analysis',
    query: 'Analyze the enforceability of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York, and the contract specifies Delaware law governs. What are the key legal considerations?',
    domain: 'legal',
    complexity: 'high',
    expectedSkills: ['ACE', 'TRM', 'legal reasoning'],
  },
  {
    id: 'Q2',
    name: 'Precedent Analysis with Temporal Reasoning',
    query: 'How has the interpretation of "fair use" in copyright law evolved from the 1961 Report of the Register of Copyrights to the 2021 Google v. Oracle Supreme Court decision? What are the key shifts in judicial reasoning?',
    domain: 'legal',
    complexity: 'very_high',
    expectedSkills: ['RAG', 'TRM', 'temporal analysis'],
  },
  {
    id: 'Q3',
    name: 'Regulatory Compliance Edge Case',
    query: 'A fintech startup operates in both EU (under GDPR) and US (under CCPA and federal banking regulations). They want to use AI for credit decisions. What are the overlapping compliance requirements, and what happens when regulations conflict?',
    domain: 'legal',
    complexity: 'high',
    expectedSkills: ['GEPA', 'multi-domain reasoning', 'compliance analysis'],
  },
  {
    id: 'Q4',
    name: 'Contract Amendment Impact Analysis',
    query: 'A SaaS company wants to add a mandatory arbitration clause to their existing terms of service, which currently allows class action lawsuits. What are the legal requirements for implementing this change, and what are the risks if done incorrectly?',
    domain: 'legal',
    complexity: 'medium_high',
    expectedSkills: ['TRM', 'legal reasoning', 'cost optimization'],
  },
  {
    id: 'Q5',
    name: 'International Arbitration Scenario',
    query: 'In an ICC arbitration between a Chinese manufacturer and a German buyer, where the contract specifies English law but the arbitration seat is in Singapore, which procedural rules govern discovery? How does this differ from US-style discovery?',
    domain: 'legal',
    complexity: 'very_high',
    expectedSkills: ['ACE', 'multilingual', 'advanced reasoning'],
  },
];

// Test a single system with a query
async function testSystem(systemName, endpoint, query, useNewSkills = false) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.query,
        domain: query.domain
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    // Extract metrics
    const metrics = {
      success: data.success || false,
      duration,
      responseLength: data.response?.length || 0,
      skillsActivated: data.brain_processing?.activated_skills?.length || 0,
      skillsList: data.brain_processing?.activated_skills || [],
      system: data.metadata?.system || 'original',
      cacheHitRate: data.metadata?.cache_hit_rate || 0,
      qualityScore: calculateQualityScore(data.response, query),
      response: data.response || '',
      synthesis: data.brain_processing?.synthesis_method || 'unknown',
    };

    return metrics;

  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      responseLength: 0,
      skillsActivated: 0,
      skillsList: [],
      qualityScore: 0,
    };
  }
}

// Calculate quality score based on response characteristics
function calculateQualityScore(response, query) {
  if (!response) return 0;

  let score = 0;
  const lowerResponse = response.toLowerCase();

  // Length check (good legal analysis should be detailed)
  if (response.length > 500) score += 0.2;
  if (response.length > 1000) score += 0.1;

  // Structure check (headers, bullet points indicate organization)
  if (response.includes('#') || response.includes('##')) score += 0.15;
  if (response.includes('-') || response.includes('*')) score += 0.1;

  // Legal terminology (indicates domain expertise)
  const legalTerms = ['jurisdiction', 'precedent', 'statute', 'regulation', 'enforcement',
                      'compliance', 'liability', 'contract', 'clause', 'court', 'law'];
  const termsFound = legalTerms.filter(term => lowerResponse.includes(term)).length;
  score += Math.min(0.25, termsFound * 0.05);

  // Citation/reference indicators
  if (lowerResponse.includes('case') || lowerResponse.includes('v.')) score += 0.1;

  // Multi-perspective analysis
  if (lowerResponse.includes('consider') || lowerResponse.includes('however')) score += 0.05;
  if (lowerResponse.includes('on the other hand') || lowerResponse.includes('alternatively')) score += 0.05;

  // Practical guidance
  if (lowerResponse.includes('recommend') || lowerResponse.includes('should')) score += 0.1;

  return Math.min(1.0, score);
}

// Run all tests
async function runComparison() {
  console.log(colorize('\n╔══════════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║       Brain Systems Comparison - Complex Legal Queries      ║', 'blue'));
  console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'blue'));

  // Check server
  console.log(`\n${colorize('Checking server status...', 'cyan')}`);
  try {
    await fetch(`${API_BASE}/api/health`).catch(() => {
      throw new Error('Server not responding');
    });
    console.log(`  ${colorize('✓', 'green')} Server is running`);
  } catch (error) {
    console.log(`  ${colorize('✗', 'red')} Server is NOT running`);
    console.log(`\n${colorize('Please start the server first:', 'yellow')}`);
    console.log(`  npm run dev`);
    process.exit(1);
  }

  // Check which system is active
  console.log(`\n${colorize('System Configuration:', 'cyan')}`);
  console.log(`  BRAIN_USE_NEW_SKILLS = ${process.env.BRAIN_USE_NEW_SKILLS || 'false (default)'}`);

  const results = {
    originalBrain: [],
    brainEnhanced: [],
    newModular: [],
  };

  // Test each query on all three systems
  for (const query of LEGAL_QUERIES) {
    console.log(`\n${colorize('━'.repeat(70), 'blue')}`);
    console.log(colorize(`${query.id}: ${query.name}`, 'bold'));
    console.log(colorize(`Complexity: ${query.complexity.toUpperCase()}`, 'yellow'));
    console.log(colorize('━'.repeat(70), 'blue'));
    console.log(`Query: "${query.query.substring(0, 100)}..."`);

    // Test 1: Original Brain
    console.log(`\n${colorize('Testing Original Brain...', 'cyan')}`);
    const original = await testSystem('Original Brain', '/api/brain', query, false);
    results.originalBrain.push({ query, ...original });

    if (original.success) {
      console.log(`  ${colorize('✓', 'green')} Duration: ${original.duration}ms`);
      console.log(`  ${colorize('✓', 'green')} Skills: ${original.skillsActivated} (${original.skillsList.join(', ')})`);
      console.log(`  ${colorize('✓', 'green')} Quality: ${(original.qualityScore * 100).toFixed(1)}%`);
      console.log(`  ${colorize('✓', 'green')} Length: ${original.responseLength} chars`);
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${original.error}`);
    }

    // Test 2: Brain-Enhanced
    console.log(`\n${colorize('Testing Brain-Enhanced...', 'cyan')}`);
    const enhanced = await testSystem('Brain-Enhanced', '/api/brain-enhanced', query, false);
    results.brainEnhanced.push({ query, ...enhanced });

    if (enhanced.success) {
      console.log(`  ${colorize('✓', 'green')} Duration: ${enhanced.duration}ms`);
      console.log(`  ${colorize('✓', 'green')} Skills: ${enhanced.skillsActivated} (${enhanced.skillsList.join(', ')})`);
      console.log(`  ${colorize('✓', 'green')} Quality: ${(enhanced.qualityScore * 100).toFixed(1)}%`);
      console.log(`  ${colorize('✓', 'green')} Length: ${enhanced.responseLength} chars`);
    } else {
      console.log(`  ${colorize('✗', 'red')} FAILED: ${enhanced.error}`);
    }

    // Small delay between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print comprehensive summary
  printSummary(results);
}

function printSummary(results) {
  console.log(`\n${colorize('╔══════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                    Comparison Summary                        ║', 'blue'));
  console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'blue'));

  // Calculate aggregates
  const systems = [
    { name: 'Original Brain', data: results.originalBrain, color: 'cyan' },
    { name: 'Brain-Enhanced', data: results.brainEnhanced, color: 'magenta' },
  ];

  for (const system of systems) {
    const successful = system.data.filter(r => r.success);
    if (successful.length === 0) {
      console.log(`\n${colorize(`${system.name}: NO SUCCESSFUL TESTS`, 'red')}`);
      continue;
    }

    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const avgQuality = successful.reduce((sum, r) => sum + r.qualityScore, 0) / successful.length;
    const avgSkills = successful.reduce((sum, r) => sum + r.skillsActivated, 0) / successful.length;
    const avgLength = successful.reduce((sum, r) => sum + r.responseLength, 0) / successful.length;

    console.log(`\n${colorize(system.name, system.color)}`);
    console.log(`  Success Rate: ${colorize(`${(successful.length / system.data.length * 100).toFixed(1)}%`, 'green')}`);
    console.log(`  Avg Duration: ${colorize(`${avgDuration.toFixed(0)}ms`, 'yellow')}`);
    console.log(`  Avg Quality: ${colorize(`${(avgQuality * 100).toFixed(1)}%`, 'yellow')}`);
    console.log(`  Avg Skills: ${colorize(`${avgSkills.toFixed(1)}`, 'yellow')}`);
    console.log(`  Avg Length: ${colorize(`${avgLength.toFixed(0)} chars`, 'yellow')}`);
  }

  // Winner analysis
  console.log(`\n${colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')}`);
  console.log(colorize('Performance Analysis', 'bold'));
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

  const originalSuccessful = results.originalBrain.filter(r => r.success);
  const enhancedSuccessful = results.brainEnhanced.filter(r => r.success);

  if (originalSuccessful.length > 0 && enhancedSuccessful.length > 0) {
    const originalAvgDuration = originalSuccessful.reduce((sum, r) => sum + r.duration, 0) / originalSuccessful.length;
    const enhancedAvgDuration = enhancedSuccessful.reduce((sum, r) => sum + r.duration, 0) / enhancedSuccessful.length;
    const originalAvgQuality = originalSuccessful.reduce((sum, r) => sum + r.qualityScore, 0) / originalSuccessful.length;
    const enhancedAvgQuality = enhancedSuccessful.reduce((sum, r) => sum + r.qualityScore, 0) / enhancedSuccessful.length;

    console.log(`\n${colorize('Speed Champion:', 'cyan')}`);
    if (originalAvgDuration < enhancedAvgDuration) {
      const improvement = ((enhancedAvgDuration - originalAvgDuration) / enhancedAvgDuration * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Original Brain', 'green')} - ${improvement}% faster`);
    } else {
      const improvement = ((originalAvgDuration - enhancedAvgDuration) / originalAvgDuration * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Brain-Enhanced', 'green')} - ${improvement}% faster`);
    }

    console.log(`\n${colorize('Quality Champion:', 'cyan')}`);
    if (originalAvgQuality > enhancedAvgQuality) {
      const improvement = ((originalAvgQuality - enhancedAvgQuality) / enhancedAvgQuality * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Original Brain', 'green')} - ${improvement}% higher quality`);
    } else {
      const improvement = ((enhancedAvgQuality - originalAvgQuality) / originalAvgQuality * 100).toFixed(1);
      console.log(`  ${colorize('🏆 Brain-Enhanced', 'green')} - ${improvement}% higher quality`);
    }
  }

  // Detailed query breakdown
  console.log(`\n${colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')}`);
  console.log(colorize('Query-by-Query Breakdown', 'bold'));
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

  for (let i = 0; i < LEGAL_QUERIES.length; i++) {
    const query = LEGAL_QUERIES[i];
    const original = results.originalBrain[i];
    const enhanced = results.brainEnhanced[i];

    console.log(`\n${colorize(query.id + ': ' + query.name, 'yellow')}`);

    if (original.success) {
      console.log(`  Original: ${original.duration}ms, Quality: ${(original.qualityScore * 100).toFixed(1)}%, Skills: ${original.skillsActivated}`);
    } else {
      console.log(`  Original: ${colorize('FAILED', 'red')}`);
    }

    if (enhanced.success) {
      console.log(`  Enhanced: ${enhanced.duration}ms, Quality: ${(enhanced.qualityScore * 100).toFixed(1)}%, Skills: ${enhanced.skillsActivated}`);
    } else {
      console.log(`  Enhanced: ${colorize('FAILED', 'red')}`);
    }

    if (original.success && enhanced.success) {
      const speedDiff = ((original.duration - enhanced.duration) / original.duration * 100).toFixed(1);
      const qualityDiff = ((enhanced.qualityScore - original.qualityScore) / original.qualityScore * 100).toFixed(1);
      console.log(`  Difference: Speed ${speedDiff > 0 ? '+' : ''}${speedDiff}%, Quality ${qualityDiff > 0 ? '+' : ''}${qualityDiff}%`);
    }
  }

  // Recommendations
  console.log(`\n${colorize('╔══════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║                     Recommendations                          ║', 'blue'));
  console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'blue'));

  console.log(`\n${colorize('Based on test results:', 'cyan')}`);
  console.log(`\n  To test NEW modular system:`);
  console.log(`    ${colorize('export BRAIN_USE_NEW_SKILLS=true', 'yellow')}`);
  console.log(`    ${colorize('npm run dev', 'yellow')}`);
  console.log(`    ${colorize('node test-brain-systems-comparison.js', 'yellow')}`);

  console.log(`\n  ${colorize('Note:', 'yellow')} Current tests show Original vs Enhanced.`);
  console.log(`  ${colorize('Note:', 'yellow')} New modular system requires env var to be set.`);
}

// Run the comparison
runComparison().catch(error => {
  console.error(`\n${colorize('Fatal error:', 'red')}`, error);
  process.exit(1);
});
