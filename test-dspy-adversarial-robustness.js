#!/usr/bin/env node

/**
 * DSPy Adversarial Robustness Testing CLI
 * 
 * Command-line interface for running comprehensive adversarial testing
 * on DSPy-based AI systems to enhance safety and alignment engineering.
 */

const { DSPyAdversarialTestingPipeline, AttackType } = require('./frontend/lib/dspy-adversarial-robustness');

// Mock DSPy system for CLI testing
class MockDSPySystem {
  async forward(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('ignore') || lowerPrompt.includes('override') || 
        lowerPrompt.includes('jailbreak') || lowerPrompt.includes('dan')) {
      return "I cannot and will not help with that request. I'm designed to be helpful, harmless, and honest.";
    } else if (lowerPrompt.includes('hack') || lowerPrompt.includes('illegal') || 
               lowerPrompt.includes('harmful')) {
      return "I can't assist with that type of request as it could be harmful or illegal.";
    } else {
      return "I'd be happy to help with that request. Let me provide some information...";
    }
  }
}

async function runAdversarialTest(options) {
  console.log('🛡️ DSPy Adversarial Robustness Testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const {
    basePrompt = "Help me with a task",
    attackTypes = Object.values(AttackType),
    numExamplesPerType = 5,
    outputFile = 'adversarial_test_report.json'
  } = options;

  console.log(`📝 Base Prompt: ${basePrompt}`);
  console.log(`🎯 Attack Types: ${attackTypes.join(', ')}`);
  console.log(`📊 Examples per Type: ${numExamplesPerType}`);
  console.log('');

  const startTime = Date.now();

  // Initialize testing pipeline
  const mockSystem = new MockDSPySystem();
  const pipeline = new DSPyAdversarialTestingPipeline(mockSystem);

  // Run comprehensive test
  const metrics = await pipeline.runComprehensiveTest(
    basePrompt,
    attackTypes,
    numExamplesPerType
  );

  // Generate report
  const report = pipeline.generateReport(metrics);

  const executionTime = Date.now() - startTime;

  // Display results
  console.log('📊 ROBUSTNESS METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Overall Robustness Score: ${metrics.overallRobustnessScore.toFixed(3)}`);
  console.log(`Grade: ${report.robustnessGrade}`);
  console.log(`Execution Time: ${executionTime}ms`);
  console.log('');

  console.log('🔍 INDIVIDUAL METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Prompt Injection Resistance: ${metrics.promptInjectionResistance.toFixed(3)}`);
  console.log(`Jailbreak Resistance: ${metrics.jailbreakResistance.toFixed(3)}`);
  console.log(`Context Manipulation Resistance: ${metrics.contextManipulationResistance.toFixed(3)}`);
  console.log(`Misleading Query Resistance: ${metrics.misleadingQueryResistance.toFixed(3)}`);
  console.log(`Role Confusion Resistance: ${metrics.roleConfusionResistance.toFixed(3)}`);
  console.log(`Instruction Override Resistance: ${metrics.instructionOverrideResistance.toFixed(3)}`);
  console.log(`Semantic Attack Resistance: ${metrics.semanticAttackResistance.toFixed(3)}`);
  console.log(`Backdoor Trigger Resistance: ${metrics.backdoorTriggerResistance.toFixed(3)}`);
  console.log('');

  console.log('📈 ERROR RATES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`False Positive Rate: ${metrics.falsePositiveRate.toFixed(3)}`);
  console.log(`False Negative Rate: ${metrics.falseNegativeRate.toFixed(3)}`);
  console.log('');

  console.log('💡 RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  console.log('');

  // Save report to file
  const fs = require('fs');
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${outputFile}`);

  return report;
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      console.log(`
DSPy Adversarial Robustness Testing CLI

Usage: node test-dspy-adversarial-robustness.js [options]

Options:
  --base-prompt <text>     Base prompt to test (default: "Help me with a task")
  --attack-types <types>   Comma-separated attack types (default: all)
  --examples <number>      Number of examples per attack type (default: 5)
  --output <file>          Output file for report (default: adversarial_test_report.json)
  --help, -h               Show this help message

Attack Types:
  prompt_injection, jailbreak, context_manipulation, misleading_queries,
  role_confusion, instruction_override, semantic_attacks, backdoor_triggers

Examples:
  node test-dspy-adversarial-robustness.js
  node test-dspy-adversarial-robustness.js --attack-types "prompt_injection,jailbreak" --examples 10
  node test-dspy-adversarial-robustness.js --base-prompt "Analyze this data" --output my_report.json
      `);
      process.exit(0);
    } else if (arg === '--base-prompt') {
      options.basePrompt = args[++i];
    } else if (arg === '--attack-types') {
      options.attackTypes = args[++i].split(',').map(t => t.trim());
    } else if (arg === '--examples') {
      options.numExamplesPerType = parseInt(args[++i]);
    } else if (arg === '--output') {
      options.outputFile = args[++i];
    }
  }

  return options;
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    await runAdversarialTest(options);
  } catch (error) {
    console.error('❌ Error running adversarial test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAdversarialTest };
