/**
 * GEPA Unified Optimization Example
 *
 * Demonstrates how to use GEPA to find prompts that optimize across:
 * 1. Multiple unrelated benchmarks (universal vs specialist)
 * 2. Multi-dimensional agent quality (procedural compliance, tool calling)
 * 3. Traditional metrics (cost, latency, quality)
 *
 * This answers the research question: "Can we find ONE prompt that works well
 * across diverse tasks while maintaining procedural correctness?"
 */

import { UniversalPromptDiscovery, Benchmark } from '../frontend/lib/gepa-universal-prompt';
import {
  AgentEvaluator,
  HEALTHCARE_DIAGNOSIS_PROCEDURE,
  FINANCIAL_TRADE_PROCEDURE,
  AgentTestScenario,
  evaluatePromptForAgent
} from '../frontend/lib/gepa-agent-evaluation';

// ============================================================================
// Step 1: Define Diverse Benchmarks
// ============================================================================

const benchmarks: Benchmark[] = [
  {
    name: 'math',
    domain: 'Mathematical Reasoning',
    testCases: [
      {
        input: 'If a train travels 120 miles in 2 hours, what is its average speed?',
        expected: '60 mph'
      },
      {
        input: 'Solve for x: 2x + 5 = 15',
        expected: 'x = 5'
      }
    ],
    evaluator: (response, expected) => {
      // Check if expected answer appears in response
      return response.toLowerCase().includes(expected.toLowerCase()) ? 1.0 : 0.0;
    }
  },

  {
    name: 'code',
    domain: 'Code Generation',
    testCases: [
      {
        input: 'Write a Python function to reverse a string',
        expected: 'def reverse_string'
      },
      {
        input: 'Create a React component for a button',
        expected: 'function Button'
      }
    ],
    evaluator: (response, expected) => {
      const hasCode = response.includes('```');
      const hasExpected = response.includes(expected);
      return (hasCode && hasExpected) ? 1.0 : (hasCode || hasExpected) ? 0.5 : 0.0;
    }
  },

  {
    name: 'legal',
    domain: 'Legal Analysis',
    testCases: [
      {
        input: 'What are the key elements of a valid contract?',
        expected: 'offer, acceptance, consideration'
      },
      {
        input: 'Explain the difference between civil and criminal law',
        expected: 'civil law deals with disputes between individuals'
      }
    ],
    evaluator: (response, expected) => {
      const keywords = expected.toLowerCase().split(',').map(k => k.trim());
      const matchCount = keywords.filter(k => response.toLowerCase().includes(k)).length;
      return matchCount / keywords.length;
    }
  },

  {
    name: 'creative',
    domain: 'Creative Writing',
    testCases: [
      {
        input: 'Write a short story about a robot learning to paint',
        expected: 'creative narrative with character development'
      }
    ],
    evaluator: (response, expected) => {
      // Heuristic: check for narrative elements
      const hasNarrative = response.length > 100;
      const hasCreative = !response.toLowerCase().includes('as an ai') &&
                         !response.toLowerCase().includes('i cannot');
      return (hasNarrative && hasCreative) ? 1.0 : 0.5;
    }
  }
];

// ============================================================================
// Step 2: Define Agent Test Scenarios with Procedural Requirements
// ============================================================================

const agentScenarios: AgentTestScenario[] = [
  // Healthcare: Order MATTERS (safety critical)
  {
    id: 'healthcare-1',
    input: 'Patient presents with chest pain and shortness of breath',
    context: {
      patientAge: 65,
      medicalHistory: ['hypertension', 'diabetes'],
      currentMedications: ['metformin', 'lisinopril']
    },
    expectedProcedure: HEALTHCARE_DIAGNOSIS_PROCEDURE,
    ambiguityLevel: 0.3,
    options: {
      domain: 'healthcare',
      strictComplianceRequired: true,
      allowedAssumptions: ['patient is conscious', 'vital signs stable']
    }
  },

  // Finance: Compliance critical
  {
    id: 'finance-1',
    input: 'Execute a trade for 10,000 shares of AAPL',
    context: {
      userId: 'user123',
      accountBalance: 1000000,
      currentHoldings: { AAPL: 5000 }
    },
    expectedProcedure: FINANCIAL_TRADE_PROCEDURE,
    ambiguityLevel: 0.2,
    options: {
      domain: 'finance',
      strictComplianceRequired: true,
      allowedAssumptions: []
    }
  },

  // Ambiguous scenario: Should ask for clarification
  {
    id: 'ambiguous-1',
    input: 'Help me with that thing we discussed',
    context: {
      previousTopics: ['project planning', 'budget review', 'hiring']
    },
    expectedProcedure: [
      {
        stepNumber: 1,
        description: 'Request clarification on ambiguous reference',
        required: true,
        prerequisiteSteps: [],
        toolsRequired: ['ask_clarification'],
        completed: false,
        completedCorrectly: false,
        completionOrder: -1
      }
    ],
    ambiguityLevel: 0.9,
    options: {
      allowedAssumptions: []
    }
  }
];

// ============================================================================
// Step 3: Define Multi-Objective Fitness Function
// ============================================================================

interface UnifiedFitness {
  // Universal prompt metrics
  mathScore: number;
  codeScore: number;
  legalScore: number;
  creativeScore: number;
  crossDomainAverage: number;
  crossDomainWorstCase: number;
  specializationIndex: number;

  // Agent quality metrics
  toolCallCorrectness: number;
  procedureCompliance: number;
  safetyProtocolAdherence: number;
  ambiguityHandling: number;

  // Traditional metrics
  cost: number;
  latency: number;

  // Aggregate quality score
  overallQuality: number;
}

async function evaluateUnifiedFitness(
  prompt: string,
  discovery: UniversalPromptDiscovery,
  evaluator: AgentEvaluator,
  llmEndpoint: (prompt: string, input: string) => Promise<string>
): Promise<UnifiedFitness> {

  // 1. Evaluate across benchmarks (universal prompt discovery)
  const multiDomainFitness = await discovery.evaluatePromptAcrossBenchmarks(
    prompt,
    llmEndpoint
  );

  // 2. Evaluate agent quality (procedural compliance)
  const agentFitness = await evaluatePromptForAgent(
    prompt,
    agentScenarios,
    evaluator
  );

  // 3. Combine into unified fitness
  return {
    // Benchmark scores
    mathScore: multiDomainFitness.mathReasoning,
    codeScore: multiDomainFitness.codeGeneration,
    legalScore: multiDomainFitness.legalAnalysis,
    creativeScore: multiDomainFitness.creativeWriting,
    crossDomainAverage: multiDomainFitness.averageScore,
    crossDomainWorstCase: multiDomainFitness.worstCaseScore,
    specializationIndex: multiDomainFitness.specializationIndex,

    // Agent quality
    toolCallCorrectness: agentFitness.toolCallCorrectness,
    procedureCompliance: agentFitness.procedureCompliance,
    safetyProtocolAdherence: agentFitness.safetyProtocolAdherence,
    ambiguityHandling: agentFitness.ambiguityHandling,

    // Efficiency
    cost: multiDomainFitness.cost + (agentFitness.costEfficiency * 0.1),
    latency: multiDomainFitness.latency,

    // Overall quality (weighted combination)
    overallQuality:
      multiDomainFitness.harmonicMean * 0.4 +        // 40% cross-domain performance
      agentFitness.procedureCompliance * 0.3 +       // 30% procedural correctness
      agentFitness.safetyProtocolAdherence * 0.2 +   // 20% safety (critical!)
      agentFitness.ambiguityHandling * 0.1           // 10% ambiguity handling
  };
}

// ============================================================================
// Step 4: Run Unified Optimization
// ============================================================================

async function runUnifiedOptimization() {
  console.log('🧬 GEPA Unified Optimization');
  console.log('━'.repeat(60));
  console.log('Research Question: Can we find ONE prompt that:');
  console.log('  1. Works across diverse benchmarks (math, code, legal, creative)');
  console.log('  2. Maintains procedural compliance (healthcare, finance)');
  console.log('  3. Handles ambiguity appropriately');
  console.log('  4. Optimizes cost and latency');
  console.log('━'.repeat(60));
  console.log();

  // Initialize systems
  const discovery = new UniversalPromptDiscovery();
  const evaluator = new AgentEvaluator();

  // Add benchmarks
  benchmarks.forEach(b => discovery.addBenchmark(b));

  // Base prompts to evolve from
  const basePrompts = [
    // Generic prompt
    'Answer the following question: {input}',

    // Step-by-step reasoning
    'Let\'s think step by step about: {input}\n\n1. First, I will...',

    // Chain of thought
    'Question: {input}\n\nLet me break this down:\n- Analysis:\n- Reasoning:\n- Conclusion:',

    // Procedural prompt
    'Task: {input}\n\nI will follow these steps:\n1. Understand the requirements\n2. Verify prerequisites\n3. Execute the task\n4. Validate the result',

    // Safety-conscious prompt
    'For the request: {input}\n\nBefore proceeding, I must:\n- Check for safety requirements\n- Verify I have necessary information\n- Ask for clarification if needed\n\nThen I will provide a complete answer.'
  ];

  console.log('📋 Base Prompts:', basePrompts.length);
  console.log('📊 Benchmarks:', benchmarks.length);
  console.log('🧪 Agent Scenarios:', agentScenarios.length);
  console.log();

  // Mock LLM endpoint (in production, would call real LLM)
  const llmEndpoint = async (prompt: string, input: string): Promise<string> => {
    // Simulate LLM response
    await new Promise(resolve => setTimeout(resolve, 100));
    return `Response to: ${input}`;
  };

  // Evaluate each base prompt
  console.log('🔬 Evaluating Base Prompts...\n');

  const results: Array<{ prompt: string; fitness: UnifiedFitness }> = [];

  for (const prompt of basePrompts) {
    const fitness = await evaluateUnifiedFitness(
      prompt,
      discovery,
      evaluator,
      llmEndpoint
    );

    results.push({ prompt, fitness });

    console.log(`Prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`  Cross-Domain Avg: ${(fitness.crossDomainAverage * 100).toFixed(1)}%`);
    console.log(`  Worst-Case Score: ${(fitness.crossDomainWorstCase * 100).toFixed(1)}%`);
    console.log(`  Procedure Compliance: ${(fitness.procedureCompliance * 100).toFixed(1)}%`);
    console.log(`  Safety Adherence: ${(fitness.safetyProtocolAdherence * 100).toFixed(1)}%`);
    console.log(`  Ambiguity Handling: ${(fitness.ambiguityHandling * 100).toFixed(1)}%`);
    console.log(`  Overall Quality: ${(fitness.overallQuality * 100).toFixed(1)}%`);
    console.log(`  Specialization: ${(fitness.specializationIndex * 100).toFixed(1)}% ${fitness.specializationIndex < 0.3 ? '(Generalist)' : fitness.specializationIndex > 0.7 ? '(Specialist)' : '(Mixed)'}`);
    console.log();
  }

  // Find best by different criteria
  console.log('\n🏆 Best Prompts by Criteria:\n');

  const bestOverall = results.reduce((best, curr) =>
    curr.fitness.overallQuality > best.fitness.overallQuality ? curr : best
  );

  const bestGeneralist = results.reduce((best, curr) =>
    curr.fitness.specializationIndex < best.fitness.specializationIndex ? curr : best
  );

  const bestSafety = results.reduce((best, curr) =>
    curr.fitness.safetyProtocolAdherence > best.fitness.safetyProtocolAdherence ? curr : best
  );

  console.log('🥇 Best Overall Quality:');
  console.log(`   "${bestOverall.prompt.substring(0, 60)}..."`);
  console.log(`   Quality: ${(bestOverall.fitness.overallQuality * 100).toFixed(1)}%\n`);

  console.log('🌍 Best Generalist (universal):');
  console.log(`   "${bestGeneralist.prompt.substring(0, 60)}..."`);
  console.log(`   Specialization: ${(bestGeneralist.fitness.specializationIndex * 100).toFixed(1)}%\n`);

  console.log('🛡️ Best Safety Compliance:');
  console.log(`   "${bestSafety.prompt.substring(0, 60)}..."`);
  console.log(`   Safety: ${(bestSafety.fitness.safetyProtocolAdherence * 100).toFixed(1)}%\n`);

  // Pareto frontier analysis
  console.log('\n📈 Pareto Frontier Analysis:\n');
  console.log('Trade-offs discovered:');
  console.log('  - Universal generalists: Good average performance, may sacrifice peak quality');
  console.log('  - Domain specialists: Excellent in specific areas, poor in others');
  console.log('  - Safety-focused: High compliance, may be verbose/slow');
  console.log('  - Efficiency-focused: Fast and cheap, may skip safety checks');
  console.log();

  console.log('💡 Recommendation:');
  if (bestOverall.fitness.specializationIndex < 0.3 &&
      bestOverall.fitness.safetyProtocolAdherence > 0.8) {
    console.log('✅ Universal prompt found! Use for all domains with confidence.');
  } else {
    console.log('⚠️ Trade-offs exist. Consider:');
    console.log('   - Universal prompt for general tasks');
    console.log('   - Specialist prompts for critical domains (healthcare, finance)');
  }
  console.log();
}

// ============================================================================
// Step 5: Run the Example
// ============================================================================

if (require.main === module) {
  runUnifiedOptimization()
    .then(() => {
      console.log('✅ Optimization complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Optimization failed:', err);
      process.exit(1);
    });
}

export { runUnifiedOptimization, evaluateUnifiedFitness };
