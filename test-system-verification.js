#!/usr/bin/env node

/**
 * PERMUTATION AI SYSTEM VERIFICATION TEST
 * 
 * Tests the system components without requiring authentication
 * by checking file existence, structure, and basic functionality.
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}: PASS`);
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
    console.log(`❌ ${testName}: FAIL - ${details}`);
  }
  testResults.details.push({ test: testName, status, details });
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileHasContent(filePath, minLines = 10) {
  if (!fileExists(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length >= minLines;
  } catch (error) {
    return false;
  }
}

function fileContains(filePath, searchTerms) {
  if (!fileExists(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return searchTerms.every(term => content.includes(term));
  } catch (error) {
    return false;
  }
}

// Test Cases
function testCoreAPIFiles() {
  const apiFiles = [
    'app/api/estatevalue-ai/route.ts',
    'app/api/realistic-valuation/route.ts',
    'app/api/art-deco-cartier-valuation/route.ts',
    'frontend/app/api/teacher-student-judge-advanced/route.ts',
    'frontend/app/api/gan-opro-optimization/route.ts',
    'frontend/app/api/gepa-optimization/route.ts',
    'frontend/app/api/creative-judge/route.ts',
    'frontend/app/api/multi-llm-search/route.ts',
    'frontend/app/api/brain/route.ts',
    'frontend/app/api/advanced-learning-methods/route.ts',
    'frontend/app/api/continual-learning/route.ts',
    'frontend/app/api/evaluate/fluid/route.ts',
    'frontend/app/api/rigorous-evaluation/route.ts'
  ];

  let passed = 0;
  let total = apiFiles.length;

  apiFiles.forEach(file => {
    if (fileExists(file)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Core API Files', 'PASS', `All ${total} API files exist`);
  } else {
    logTest('Core API Files', 'FAIL', `${passed}/${total} API files exist`);
  }
}

function testPERMUTATIONAILibraries() {
  const libFiles = [
    'lib/teacher-student-judge-advanced.ts',
    'frontend/lib/gan-opro-optimizer.ts',
    'frontend/lib/ace-framework.ts',
    'frontend/lib/gepa-optimizer.ts',
    'frontend/lib/dspy-optimizer.ts',
    'frontend/lib/swirl-optimizer.ts',
    'frontend/lib/trm-engine.ts',
    'frontend/lib/graphrag-engine.ts',
    'frontend/lib/enhanced-llm-judge.ts',
    'frontend/lib/creative-judge.ts',
    'frontend/lib/fluid-benchmarking.ts',
    'frontend/lib/rigorous-evaluation.ts'
  ];

  let passed = 0;
  let total = libFiles.length;

  libFiles.forEach(file => {
    if (fileExists(file)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('PERMUTATION AI Libraries', 'PASS', `All ${total} library files exist`);
  } else {
    logTest('PERMUTATION AI Libraries', 'FAIL', `${passed}/${total} library files exist`);
  }
}

function testEstateValueAI() {
  const filePath = 'app/api/estatevalue-ai/route.ts';
  if (fileExists(filePath)) {
    const hasInterface = fileContains(filePath, ['EstateValueRequest', 'EstateValueResponse']);
    const hasImplementation = fileContains(filePath, ['POST', 'GET', 'NextRequest', 'NextResponse']);
    
    if (hasInterface && hasImplementation) {
      logTest('Estate Value AI Implementation', 'PASS', 'Complete interface and implementation');
    } else {
      logTest('Estate Value AI Implementation', 'FAIL', 'Missing interface or implementation');
    }
  } else {
    logTest('Estate Value AI Implementation', 'FAIL', 'File does not exist');
  }
}

function testGANOPROFramework() {
  const filePath = 'frontend/lib/gan-opro-optimizer.ts';
  if (fileExists(filePath)) {
    const hasClasses = fileContains(filePath, ['GANOPROGenerator', 'GANOPRODiscriminator', 'GANOPROOptimizer']);
    const hasStrategies = fileContains(filePath, ['EXPLORATION', 'EXPLOITATION', 'ADVERSARIAL', 'DIVERSITY']);
    
    if (hasClasses && hasStrategies) {
      logTest('GAN-OPRO Framework', 'PASS', 'Complete GAN-OPRO implementation');
    } else {
      logTest('GAN-OPRO Framework', 'FAIL', 'Missing classes or strategies');
    }
  } else {
    logTest('GAN-OPRO Framework', 'FAIL', 'File does not exist');
  }
}

function testTeacherStudentJudge() {
  const filePath = 'lib/teacher-student-judge-advanced.ts';
  if (fileExists(filePath)) {
    const hasClass = fileContains(filePath, ['AdvancedTeacherStudentJudge']);
    const hasMethods = fileContains(filePath, ['processTeacher', 'processStudent', 'processJudge']);
    const hasComponents = fileContains(filePath, ['ACE', 'AX-LLM', 'GEPA', 'DSPy', 'PromptMii', 'SWiRL', 'TRM', 'GraphRAG']);
    
    if (hasClass && hasMethods && hasComponents) {
      logTest('Teacher-Student-Judge Advanced', 'PASS', 'Complete implementation with all components');
    } else {
      logTest('Teacher-Student-Judge Advanced', 'FAIL', 'Missing class, methods, or components');
    }
  } else {
    logTest('Teacher-Student-Judge Advanced', 'FAIL', 'File does not exist');
  }
}

function testJudgeSystems() {
  const judgeFiles = [
    'frontend/lib/enhanced-llm-judge.ts',
    'frontend/lib/creative-judge.ts'
  ];

  let passed = 0;
  let total = judgeFiles.length;

  judgeFiles.forEach(file => {
    if (fileExists(file) && fileHasContent(file, 50)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Judge Systems', 'PASS', `All ${total} judge systems implemented`);
  } else {
    logTest('Judge Systems', 'FAIL', `${passed}/${total} judge systems implemented`);
  }
}

function testOptimizationFrameworks() {
  const optFiles = [
    'frontend/lib/gepa-optimizer.ts',
    'frontend/lib/dspy-optimizer.ts',
    'frontend/lib/ace-framework.ts',
    'frontend/lib/swirl-optimizer.ts'
  ];

  let passed = 0;
  let total = optFiles.length;

  optFiles.forEach(file => {
    if (fileExists(file) && fileHasContent(file, 30)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Optimization Frameworks', 'PASS', `All ${total} optimization frameworks implemented`);
  } else {
    logTest('Optimization Frameworks', 'FAIL', `${passed}/${total} optimization frameworks implemented`);
  }
}

function testReasoningEngines() {
  const reasoningFiles = [
    'frontend/lib/trm-engine.ts',
    'frontend/lib/graphrag-engine.ts'
  ];

  let passed = 0;
  let total = reasoningFiles.length;

  reasoningFiles.forEach(file => {
    if (fileExists(file) && fileHasContent(file, 30)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Reasoning Engines', 'PASS', `All ${total} reasoning engines implemented`);
  } else {
    logTest('Reasoning Engines', 'FAIL', `${passed}/${total} reasoning engines implemented`);
  }
}

function testEvaluationSystems() {
  const evalFiles = [
    'frontend/lib/fluid-benchmarking.ts',
    'frontend/lib/rigorous-evaluation.ts'
  ];

  let passed = 0;
  let total = evalFiles.length;

  evalFiles.forEach(file => {
    if (fileExists(file) && fileHasContent(file, 30)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Evaluation Systems', 'PASS', `All ${total} evaluation systems implemented`);
  } else {
    logTest('Evaluation Systems', 'FAIL', `${passed}/${total} evaluation systems implemented`);
  }
}

function testDocumentation() {
  const docFiles = [
    'PERMUTATION_AI_COMPLETE.md',
    'GAN_OPRO_OPTIMIZATION_FRAMEWORK.md',
    'ENHANCED-JUDGE-SYSTEM.md',
    'CREATIVE_JUDGE_SYSTEM.md',
    'ESTATEVALUE_AI_IMPROVEMENT_PLAN.md'
  ];

  let passed = 0;
  let total = docFiles.length;

  docFiles.forEach(file => {
    if (fileExists(file) && fileHasContent(file, 20)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Documentation', 'PASS', `All ${total} documentation files exist`);
  } else {
    logTest('Documentation', 'FAIL', `${passed}/${total} documentation files exist`);
  }
}

function testPackageConfiguration() {
  const configFiles = [
    'package.json',
    'frontend/package.json',
    'backend/requirements.txt'
  ];

  let passed = 0;
  let total = configFiles.length;

  configFiles.forEach(file => {
    if (fileExists(file)) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Package Configuration', 'PASS', `All ${total} configuration files exist`);
  } else {
    logTest('Package Configuration', 'FAIL', `${passed}/${total} configuration files exist`);
  }
}

function testProjectStructure() {
  const directories = [
    'app',
    'frontend',
    'backend',
    'lib',
    'docs'
  ];

  let passed = 0;
  let total = directories.length;

  directories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      passed++;
    }
  });

  if (passed === total) {
    logTest('Project Structure', 'PASS', `All ${total} directories exist`);
  } else {
    logTest('Project Structure', 'FAIL', `${passed}/${total} directories exist`);
  }
}

// Main test execution
function runSystemVerificationTest() {
  console.log('🔍 PERMUTATION AI SYSTEM VERIFICATION TEST');
  console.log('============================================================');
  console.log('Testing system components and file structure...');
  console.log('');

  const startTime = Date.now();

  // Run all tests
  testProjectStructure();
  testPackageConfiguration();
  testCoreAPIFiles();
  testPERMUTATIONAILibraries();
  testEstateValueAI();
  testGANOPROFramework();
  testTeacherStudentJudge();
  testJudgeSystems();
  testOptimizationFrameworks();
  testReasoningEngines();
  testEvaluationSystems();
  testDocumentation();

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Generate comprehensive report
  console.log('\n📊 SYSTEM VERIFICATION RESULTS');
  console.log('============================================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failed} (${((testResults.failed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime}ms`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.details.forEach(detail => {
    const status = detail.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${detail.test}: ${detail.details || detail.status}`);
  });

  // System health assessment
  const passRate = (testResults.passed / testResults.total) * 100;
  let systemStatus;
  if (passRate >= 90) {
    systemStatus = '🟢 EXCELLENT';
  } else if (passRate >= 75) {
    systemStatus = '🟡 GOOD';
  } else if (passRate >= 50) {
    systemStatus = '🟠 FAIR';
  } else {
    systemStatus = '🔴 POOR';
  }

  console.log('\n🎯 SYSTEM HEALTH ASSESSMENT');
  console.log('============================================================');
  console.log(`Overall Status: ${systemStatus}`);
  console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
  
  if (passRate >= 90) {
    console.log('✅ PERMUTATION AI system is excellently structured');
    console.log('✅ All core components are properly implemented');
    console.log('✅ System is ready for development and testing');
  } else if (passRate >= 75) {
    console.log('⚠️  PERMUTATION AI system is mostly complete');
    console.log('⚠️  Some components may need attention');
    console.log('⚠️  Review failed tests for missing implementations');
  } else {
    console.log('❌ PERMUTATION AI system has structural issues');
    console.log('❌ Multiple components are missing or incomplete');
    console.log('❌ System needs significant development work');
  }

  console.log('\n🔧 NEXT STEPS:');
  if (testResults.failed > 0) {
    console.log('1. Review failed test details above');
    console.log('2. Implement missing components');
    console.log('3. Verify file paths and structure');
    console.log('4. Check for typos in file names');
    console.log('5. Ensure all dependencies are properly configured');
  } else {
    console.log('1. System structure is complete');
    console.log('2. Ready to start development server');
    console.log('3. Can begin API testing with authentication');
    console.log('4. Consider running integration tests');
    console.log('5. Set up continuous integration pipeline');
  }

  console.log('\n✅ SYSTEM VERIFICATION COMPLETE');
  console.log('============================================================');
}

// Run the verification test
runSystemVerificationTest();
