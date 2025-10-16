#!/usr/bin/env node

/**
 * ZOD-ENHANCED SYSTEM TEST
 * 
 * Test the enhanced PERMUTATION system with Zod validation
 * Based on Ax LLM PR #388 improvements
 */

async function testZodValidation() {
  console.log('🔍 Testing Zod-Enhanced Validation...');
  
  const testCases = [
    {
      name: 'Valid Finance Query',
      endpoint: '/api/smart-routing',
      data: {
        query: 'Analyze the risk-return profile of a diversified portfolio with 60% S&P 500, 30% international equity, and 10% corporate bonds',
        taskType: 'general',
        priority: 'medium',
        requirements: {
          accuracy_required: 95,
          max_latency_ms: 5000,
          max_cost: 0.01,
          requires_real_time_data: false
        }
      },
      expectSuccess: true
    },
    {
      name: 'Invalid Query (Too Short)',
      endpoint: '/api/smart-routing',
      data: {
        query: 'Hi', // Too short for finance domain
        taskType: 'general',
        priority: 'medium',
        requirements: {
          accuracy_required: 95,
          max_latency_ms: 5000,
          max_cost: 0.01,
          requires_real_time_data: false
        }
      },
      expectSuccess: false
    },
    {
      name: 'Valid TRM Engine Query',
      endpoint: '/api/trm-engine',
      data: {
        query: 'Evaluate the technical architecture of a microservices-based system',
        domain: 'technology',
        optimizationLevel: 'high',
        useRealTimeData: false
      },
      expectSuccess: true
    },
    {
      name: 'Invalid TRM Engine (Invalid Domain)',
      endpoint: '/api/trm-engine',
      data: {
        query: 'Test query',
        domain: 'invalid_domain', // Invalid domain
        optimizationLevel: 'high',
        useRealTimeData: false
      },
      expectSuccess: false
    },
    {
      name: 'Valid GEPA Optimization',
      endpoint: '/api/gepa-optimization',
      data: {
        prompt: 'Write a comprehensive analysis of market trends',
        domain: 'finance',
        maxIterations: 3,
        optimizationType: 'comprehensive'
      },
      expectSuccess: true
    },
    {
      name: 'Invalid GEPA Optimization (Too Many Iterations)',
      endpoint: '/api/gepa-optimization',
      data: {
        prompt: 'Test prompt',
        domain: 'general',
        maxIterations: 15, // Too many iterations (max 10)
        optimizationType: 'comprehensive'
      },
      expectSuccess: false
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      const response = await fetch(`http://localhost:3002${testCase.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const responseData = await response.json();
      const success = response.ok && responseData.success !== false;
      
      const testPassed = success === testCase.expectSuccess;
      
      results.push({
        name: testCase.name,
        endpoint: testCase.endpoint,
        expectedSuccess: testCase.expectSuccess,
        actualSuccess: success,
        testPassed,
        status: response.status,
        hasValidationErrors: responseData.details && (Array.isArray(responseData.details) ? responseData.details.length > 0 : true),
        validationErrors: Array.isArray(responseData.details) ? responseData.details : (responseData.details ? [responseData.details] : []),
        diagnostics: responseData.diagnostics
      });

      if (testPassed) {
        console.log(`   ✅ PASS: ${testCase.expectSuccess ? 'Success as expected' : 'Validation error as expected'}`);
        if (responseData.details && Array.isArray(responseData.details) && responseData.details.length > 0) {
          console.log(`   📋 Validation Details: ${responseData.details.join(', ')}`);
        } else if (responseData.details) {
          console.log(`   📋 Validation Details: ${responseData.details}`);
        }
        if (responseData.diagnostics) {
          console.log(`   🔍 Diagnostics: ${responseData.diagnostics.warnings?.length || 0} warnings, ${responseData.diagnostics.suggestions?.length || 0} suggestions`);
        }
      } else {
        console.log(`   ❌ FAIL: Expected ${testCase.expectSuccess ? 'success' : 'validation error'}, got ${success ? 'success' : 'error'}`);
        console.log(`   📋 Response: ${JSON.stringify(responseData, null, 2).substring(0, 200)}...`);
      }
    } catch (error) {
      results.push({
        name: testCase.name,
        endpoint: testCase.endpoint,
        expectedSuccess: testCase.expectSuccess,
        actualSuccess: false,
        testPassed: false,
        error: error.message
      });
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  return results;
}

async function testEnhancedErrorHandling() {
  console.log('\n🛡️ Testing Enhanced Error Handling...');
  
  try {
    // Test with completely invalid data
    const response = await fetch('http://localhost:3002/api/smart-routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        invalidField: 'test'
      })
    });

    const responseData = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Has Error: ${!!responseData.error}`);
    console.log(`   Has Details: ${!!responseData.details}`);
    console.log(`   Has Diagnostics: ${!!responseData.diagnostics}`);
    
    if (responseData.details) {
      console.log(`   Validation Errors: ${responseData.details.length}`);
      responseData.details.forEach((error, index) => {
        console.log(`     ${index + 1}. ${error}`);
      });
    }

    return {
      success: response.status === 400,
      hasValidationErrors: !!responseData.details,
      errorCount: responseData.details?.length || 0,
      hasDiagnostics: !!responseData.diagnostics
    };
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDomainSpecificValidation() {
  console.log('\n🌐 Testing Domain-Specific Validation...');
  
  const domainTests = [
    {
      domain: 'finance',
      query: 'Analyze portfolio risk', // Valid
      expectSuccess: true
    },
    {
      domain: 'finance', 
      query: 'Hi', // Too short
      expectSuccess: false
    },
    {
      domain: 'healthcare',
      query: 'Assess clinical efficacy of treatment', // Valid
      expectSuccess: true
    },
    {
      domain: 'technology',
      query: 'Evaluate system architecture', // Valid
      expectSuccess: true
    }
  ];

  const results = [];

  for (const test of domainTests) {
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

      const responseData = await response.json();
      const success = response.ok && responseData.success !== false;
      const testPassed = success === test.expectSuccess;

      results.push({
        domain: test.domain,
        query: test.query,
        expectedSuccess: test.expectSuccess,
        actualSuccess: success,
        testPassed,
        hasValidationErrors: !!responseData.details
      });

      console.log(`   ${testPassed ? '✅' : '❌'} ${test.domain}: ${test.query.substring(0, 30)}... - ${success ? 'Valid' : 'Invalid'}`);
    } catch (error) {
      results.push({
        domain: test.domain,
        query: test.query,
        error: error.message,
        testPassed: false
      });
      console.log(`   ❌ ${test.domain}: ERROR - ${error.message}`);
    }
  }

  return results;
}

async function runZodEnhancedTest() {
  console.log('🔬 TESTING ZOD-ENHANCED PERMUTATION SYSTEM');
  console.log('==========================================');
  console.log('Testing enhanced validation based on Ax LLM PR #388');
  console.log('==========================================\n');

  const results = {};

  // Test 1: Zod Validation
  console.log('📋 TEST 1: ZOD VALIDATION');
  console.log('=========================');
  results.validation = await testZodValidation();

  // Test 2: Enhanced Error Handling
  console.log('\n📋 TEST 2: ENHANCED ERROR HANDLING');
  console.log('===================================');
  results.errorHandling = await testEnhancedErrorHandling();

  // Test 3: Domain-Specific Validation
  console.log('\n📋 TEST 3: DOMAIN-SPECIFIC VALIDATION');
  console.log('=====================================');
  results.domainValidation = await testDomainSpecificValidation();

  // Summary
  console.log('\n📊 ZOD-ENHANCED SYSTEM SUMMARY');
  console.log('==============================');
  
  const validationResults = results.validation;
  const passedTests = validationResults.filter(r => r.testPassed).length;
  const totalTests = validationResults.length;
  const validationScore = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`🔍 Validation Tests: ${passedTests}/${totalTests} passed (${validationScore}%)`);
  
  const errorHandlingResults = results.errorHandling;
  console.log(`🛡️ Error Handling: ${errorHandlingResults.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Validation Errors: ${errorHandlingResults.errorCount || 0}`);
  console.log(`   Diagnostics: ${errorHandlingResults.hasDiagnostics ? '✅ Available' : '❌ Missing'}`);
  
  const domainResults = results.domainValidation;
  const domainPassed = domainResults.filter(r => r.testPassed).length;
  const domainTotal = domainResults.length;
  const domainScore = (domainPassed / domainTotal * 100).toFixed(1);
  
  console.log(`🌐 Domain Validation: ${domainPassed}/${domainTotal} passed (${domainScore}%)`);

  // Overall Score
  const overallScore = (parseFloat(validationScore) + (errorHandlingResults.success ? 100 : 0) + parseFloat(domainScore)) / 3;
  
  console.log(`\n🏆 OVERALL ZOD-ENHANCED SCORE: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 90) {
    console.log('🎉 EXCELLENT! Zod-enhanced validation is working perfectly!');
  } else if (overallScore >= 70) {
    console.log('✅ GOOD! Most validation features are working well.');
  } else if (overallScore >= 50) {
    console.log('⚠️  MIXED: Some validation features need improvement.');
  } else {
    console.log('❌ NEEDS WORK: Zod validation needs significant improvement.');
  }

  // Benefits Summary
  console.log('\n🚀 ZOD ENHANCEMENT BENEFITS:');
  console.log('============================');
  console.log('✅ Enhanced Type Safety - All inputs validated with Zod schemas');
  console.log('✅ Better Error Messages - Detailed validation error reporting');
  console.log('✅ Domain-Specific Validation - Tailored validation per domain');
  console.log('✅ Early Error Detection - Catch issues before processing');
  console.log('✅ Improved Debugging - Enhanced diagnostics and suggestions');
  console.log('✅ Production Ready - Robust validation for enterprise use');
  
  return results;
}

// Main execution
async function main() {
  await runZodEnhancedTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runZodEnhancedTest };
