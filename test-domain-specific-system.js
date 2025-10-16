#!/usr/bin/env node

/**
 * DOMAIN-SPECIFIC SYSTEM TEST
 * 
 * Test the PERMUTATION system across different domains to verify
 * domain-specific optimization and routing works correctly
 */

const DOMAIN_TESTS = [
  {
    domain: 'finance',
    query: 'Analyze the risk-return profile of a diversified portfolio with 60% S&P 500, 30% international equity, and 10% corporate bonds',
    expectedComponents: ['TRM Engine', 'Teacher Model (Perplexity)'],
    expectedOptimization: 'high'
  },
  {
    domain: 'technology',
    query: 'Evaluate the technical architecture of a microservices-based system for handling 1M concurrent users',
    expectedComponents: ['TRM Engine', 'GEPA Optimizer'],
    expectedOptimization: 'medium'
  },
  {
    domain: 'healthcare',
    query: 'Assess the clinical efficacy of machine learning-based diagnostic systems for diabetic retinopathy detection',
    expectedComponents: ['ACE Framework', 'Teacher Model (Perplexity)'],
    expectedOptimization: 'high'
  },
  {
    domain: 'legal',
    query: 'Analyze the legal implications of implementing AI-powered hiring systems across different jurisdictions',
    expectedComponents: ['TRM Engine', 'ACE Framework'],
    expectedOptimization: 'medium'
  },
  {
    domain: 'education',
    query: 'Design a personalized learning pathway for students with different learning styles and abilities',
    expectedComponents: ['Ollama Student', 'TRM Engine'],
    expectedOptimization: 'low'
  },
  {
    domain: 'general',
    query: 'Explain the concept of artificial intelligence in simple terms',
    expectedComponents: ['Ollama Student', 'TRM Engine'],
    expectedOptimization: 'none'
  }
];

async function testDomainSpecificRouting() {
  console.log('🎯 Testing Domain-Specific Routing...');
  
  const results = [];
  
  for (const test of DOMAIN_TESTS) {
    try {
      const response = await fetch('http://localhost:3002/api/smart-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: test.query,
          taskType: 'general',
          priority: 'medium',
          requirements: {
            accuracy_required: 80,
            max_latency_ms: 5000,
            max_cost: 0.01,
            requires_real_time_data: false
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const primaryComponent = data.routingDecision.primary_component;
        const expectedComponent = test.expectedComponents[0];
        
        const isCorrect = test.expectedComponents.includes(primaryComponent);
        
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          expectedComponent,
          actualComponent: primaryComponent,
          correct: isCorrect,
          reasoning: data.routingDecision.reasoning
        });
        
        console.log(`   ${isCorrect ? '✅' : '❌'} ${test.domain}: Expected ${expectedComponent}, Got ${primaryComponent}`);
      } else {
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          error: `HTTP ${response.status}`
        });
        console.log(`   ❌ ${test.domain}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        domain: test.domain,
        query: test.query.substring(0, 50) + '...',
        error: error.message
      });
      console.log(`   ❌ ${test.domain}: ${error.message}`);
    }
  }
  
  return results;
}

async function testDomainSpecificTRM() {
  console.log('🔧 Testing Domain-Specific TRM Engine...');
  
  const results = [];
  
  for (const test of DOMAIN_TESTS) {
    try {
      const response = await fetch('http://localhost:3002/api/trm-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: test.query,
          domain: test.domain,
          optimizationLevel: test.expectedOptimization,
          useRealTimeData: false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const componentsUsed = data.metadata.componentsUsed;
        const duration = data.metadata.duration;
        
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          componentsUsed,
          duration,
          optimizationLevel: test.expectedOptimization,
          success: true
        });
        
        console.log(`   ✅ ${test.domain}: ${componentsUsed} components, ${duration}ms, ${test.expectedOptimization} optimization`);
      } else {
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          error: `HTTP ${response.status}`,
          success: false
        });
        console.log(`   ❌ ${test.domain}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        domain: test.domain,
        query: test.query.substring(0, 50) + '...',
        error: error.message,
        success: false
      });
      console.log(`   ❌ ${test.domain}: ${error.message}`);
    }
  }
  
  return results;
}

async function testDomainSpecificGEPA() {
  console.log('🧠 Testing Domain-Specific GEPA Optimization...');
  
  const results = [];
  
  for (const test of DOMAIN_TESTS) {
    try {
      const response = await fetch('http://localhost:3002/api/gepa-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: test.query,
          domain: test.domain,
          maxIterations: 2,
          optimizationType: 'domain-specific'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const improvement = data.metrics.improvementPercentage;
        const duration = data.metrics.duration;
        
        results.push({
          domain: test.domain,
          prompt: test.query.substring(0, 50) + '...',
          improvement: improvement + '%',
          duration,
          iterations: data.metrics.totalIterations,
          success: true
        });
        
        console.log(`   ✅ ${test.domain}: ${improvement}% improvement, ${duration}ms, ${data.metrics.totalIterations} iterations`);
      } else {
        results.push({
          domain: test.domain,
          prompt: test.query.substring(0, 50) + '...',
          error: `HTTP ${response.status}`,
          success: false
        });
        console.log(`   ❌ ${test.domain}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        domain: test.domain,
        prompt: test.query.substring(0, 50) + '...',
        error: error.message,
        success: false
      });
      console.log(`   ❌ ${test.domain}: ${error.message}`);
    }
  }
  
  return results;
}

async function testDomainSpecificPermutation() {
  console.log('🔗 Testing Domain-Specific Permutation Chat...');
  
  const results = [];
  
  for (const test of DOMAIN_TESTS) {
    try {
      const response = await fetch('http://localhost:3002/api/chat/permutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: test.query }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const domain = data.domain;
        const componentsUsed = data.components_used;
        const responseLength = data.response.length;
        
        const domainMatch = domain === test.domain;
        
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          detectedDomain: domain,
          domainMatch,
          componentsUsed,
          responseLength,
          success: true
        });
        
        console.log(`   ${domainMatch ? '✅' : '⚠️'} ${test.domain}: Detected ${domain}, ${componentsUsed} components, ${responseLength} chars`);
      } else {
        results.push({
          domain: test.domain,
          query: test.query.substring(0, 50) + '...',
          error: `HTTP ${response.status}`,
          success: false
        });
        console.log(`   ❌ ${test.domain}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        domain: test.domain,
        query: test.query.substring(0, 50) + '...',
        error: error.message,
        success: false
      });
      console.log(`   ❌ ${test.domain}: ${error.message}`);
    }
  }
  
  return results;
}

async function runDomainSpecificTest() {
  console.log('🌐 TESTING DOMAIN-SPECIFIC PERMUTATION SYSTEM');
  console.log('==============================================');
  console.log('Testing system performance across different domains');
  console.log('==============================================\n');

  const results = {};

  // Test 1: Domain-Specific Routing
  console.log('📋 TEST 1: DOMAIN-SPECIFIC ROUTING');
  console.log('==================================');
  results.routing = await testDomainSpecificRouting();
  console.log('');

  // Test 2: Domain-Specific TRM Engine
  console.log('📋 TEST 2: DOMAIN-SPECIFIC TRM ENGINE');
  console.log('====================================');
  results.trm = await testDomainSpecificTRM();
  console.log('');

  // Test 3: Domain-Specific GEPA Optimization
  console.log('📋 TEST 3: DOMAIN-SPECIFIC GEPA OPTIMIZATION');
  console.log('============================================');
  results.gepa = await testDomainSpecificGEPA();
  console.log('');

  // Test 4: Domain-Specific Permutation Chat
  console.log('📋 TEST 4: DOMAIN-SPECIFIC PERMUTATION CHAT');
  console.log('===========================================');
  results.permutation = await testDomainSpecificPermutation();
  console.log('');

  // Summary Analysis
  console.log('📊 DOMAIN-SPECIFIC PERFORMANCE SUMMARY');
  console.log('======================================');
  
  // Routing Analysis
  const routingSuccess = results.routing.filter(r => r.correct !== false).length;
  const routingTotal = results.routing.length;
  console.log(`🎯 Smart Routing: ${routingSuccess}/${routingTotal} domains correctly routed`);
  
  // TRM Analysis
  const trmSuccess = results.trm.filter(r => r.success).length;
  const trmTotal = results.trm.length;
  const avgTRMDuration = results.trm.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / trmSuccess || 0;
  console.log(`🔧 TRM Engine: ${trmSuccess}/${trmTotal} domains successful, avg ${avgTRMDuration.toFixed(0)}ms`);
  
  // GEPA Analysis
  const gepaSuccess = results.gepa.filter(r => r.success).length;
  const gepaTotal = results.gepa.length;
  const avgGEPAImprovement = results.gepa.filter(r => r.success).reduce((sum, r) => sum + parseFloat(r.improvement), 0) / gepaSuccess || 0;
  console.log(`🧠 GEPA Optimization: ${gepaSuccess}/${gepaTotal} domains successful, avg ${avgGEPAImprovement.toFixed(1)}% improvement`);
  
  // Permutation Analysis
  const permutationSuccess = results.permutation.filter(r => r.success).length;
  const permutationTotal = results.permutation.length;
  const domainAccuracy = results.permutation.filter(r => r.domainMatch).length / permutationTotal * 100;
  console.log(`🔗 Permutation Chat: ${permutationSuccess}/${permutationTotal} domains successful, ${domainAccuracy.toFixed(1)}% domain accuracy`);

  // Domain Performance Breakdown
  console.log('\n📈 DOMAIN PERFORMANCE BREAKDOWN');
  console.log('================================');
  
  const domainPerformance = {};
  
  DOMAIN_TESTS.forEach(test => {
    const routing = results.routing.find(r => r.domain === test.domain);
    const trm = results.trm.find(r => r.domain === test.domain);
    const gepa = results.gepa.find(r => r.domain === test.domain);
    const permutation = results.permutation.find(r => r.domain === test.domain);
    
    domainPerformance[test.domain] = {
      routing: routing?.correct !== false,
      trm: trm?.success || false,
      gepa: gepa?.success || false,
      permutation: permutation?.success || false,
      domainDetection: permutation?.domainMatch || false
    };
  });
  
  Object.entries(domainPerformance).forEach(([domain, perf]) => {
    const successCount = Object.values(perf).filter(Boolean).length;
    const totalTests = Object.keys(perf).length;
    const score = (successCount / totalTests * 100).toFixed(1);
    
    console.log(`${domain.toUpperCase()}: ${score}% (${successCount}/${totalTests})`);
    console.log(`   Routing: ${perf.routing ? '✅' : '❌'} | TRM: ${perf.trm ? '✅' : '❌'} | GEPA: ${perf.gepa ? '✅' : '❌'} | Chat: ${perf.permutation ? '✅' : '❌'} | Domain: ${perf.domainDetection ? '✅' : '❌'}`);
  });
  
  // Overall Score
  const totalSuccesses = Object.values(domainPerformance).reduce((sum, perf) => 
    sum + Object.values(perf).filter(Boolean).length, 0);
  const totalTests = Object.values(domainPerformance).length * Object.values(domainPerformance)[0]?.length || 1;
  const overallScore = (totalSuccesses / totalTests * 100).toFixed(1);
  
  console.log(`\n🏆 OVERALL DOMAIN-SPECIFIC SCORE: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log('🎉 EXCELLENT! Domain-specific optimization is working perfectly!');
  } else if (overallScore >= 70) {
    console.log('✅ GOOD! Most domains are working well, minor improvements needed.');
  } else if (overallScore >= 50) {
    console.log('⚠️  MIXED: Some domains work well, others need attention.');
  } else {
    console.log('❌ NEEDS WORK: Domain-specific optimization needs significant improvement.');
  }
  
  return results;
}

// Main execution
async function main() {
  await runDomainSpecificTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runDomainSpecificTest };
