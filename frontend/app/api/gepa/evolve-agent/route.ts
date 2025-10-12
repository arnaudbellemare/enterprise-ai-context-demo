import { NextRequest, NextResponse } from 'next/server';
import { GEPACodeEvolutionEngine } from '@/lib/gepa-code-evolution';
import { AgentEvaluator, FINANCIAL_EVALUATION_TASKS } from '@/lib/gepa-agent-evaluator';
import { AGENT_TEMPLATES, AGENT_DESCRIPTIONS } from '@/lib/gepa-agent-templates';

/**
 * GEPA Agent Evolution API
 * 
 * Evolves entire agent code using GEPA for Ollama
 * Inspired by: https://github.com/gepa-ai/gepa
 */

export async function POST(req: NextRequest) {
  try {
    const { agentType, budget, taskDescription } = await req.json();

    const startTime = Date.now();
    const executionLog: string[] = [];
    
    const addLog = (message: string) => {
      executionLog.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`);
      console.log(message);
    };

    addLog('🧬 GEPA Agent Code Evolution Started');
    addLog(`Agent Type: ${agentType}`);
    addLog(`Evolution Budget: ${budget} rollouts`);
    addLog('');

    // Get initial agent template
    const initialCode = AGENT_TEMPLATES[agentType as keyof typeof AGENT_TEMPLATES];
    if (!initialCode) {
      return NextResponse.json(
        { success: false, error: `Unknown agent type: ${agentType}` },
        { status: 400 }
      );
    }

    const agentInfo = AGENT_DESCRIPTIONS[agentType as keyof typeof AGENT_DESCRIPTIONS];
    addLog(`📝 Initial Agent: ${agentInfo.name}`);
    addLog(`   Description: ${agentInfo.description}`);
    addLog('');

    // Show initial code
    addLog('=== Initial Agent Code ===');
    addLog(initialCode.split('\n').slice(0, 10).join('\n') + '\n...');
    addLog('');

    // Create evaluator with financial tasks
    const evaluationTasks = FINANCIAL_EVALUATION_TASKS;
    const evaluator = new AgentEvaluator(evaluationTasks);
    addLog(`📊 Evaluation Suite: ${evaluationTasks.length} financial tasks`);
    addLog('');

    // Create GEPA evolution engine
    const gepaEngine = new GEPACodeEvolutionEngine({
      budget: budget || 20,
      targetMetric: 'balanced',
      evaluationFunction: async (code: string) => {
        const result = await evaluator.evaluateAgent(code);
        return result.score;
      },
      detailedEvaluation: async (code: string) => {
        const result = await evaluator.evaluateAgent(code);
        return {
          score: result.score,
          metrics: result.metrics
        };
      }
    });

    addLog('🔄 Starting evolution process...');
    addLog('');

    // Evolve the agent
    const evolutionResult = await gepaEngine.evolve(initialCode);

    addLog('');
    addLog('=== Evolution Complete! ===');
    addLog(`📊 Baseline Score: ${evolutionResult.baselineScore.toFixed(3)}`);
    addLog(`🎯 Final Score: ${evolutionResult.finalScore.toFixed(3)}`);
    addLog(`📈 Improvement: ${evolutionResult.improvementPercent}`);
    addLog(`🧬 Total Candidates: ${evolutionResult.evolutionHistory.length}`);
    addLog(`⭐ Pareto Frontier: ${evolutionResult.paretoFrontier.length} optimal solutions`);
    addLog('');

    // Log discovered patterns
    if (evolutionResult.discoveredPatterns.length > 0) {
      addLog('🔍 Discovered Patterns:');
      evolutionResult.discoveredPatterns.forEach(pattern => {
        addLog(`   ✅ ${pattern}`);
      });
      addLog('');
    }

    // Show evolved code snippet
    addLog('=== Evolved Agent Code (snippet) ===');
    const evolvedCodeLines = evolutionResult.bestAgentCode.split('\n');
    addLog(evolvedCodeLines.slice(0, 15).join('\n'));
    if (evolvedCodeLines.length > 15) {
      addLog('...');
      addLog(`(${evolvedCodeLines.length - 15} more lines)`);
    }
    addLog('');

    // Compare expected improvements
    addLog('=== Expected vs Actual Improvements ===');
    agentInfo.expectedImprovements.forEach((expected: string) => {
      const discovered = evolutionResult.discoveredPatterns.some(pattern =>
        expected.toLowerCase().includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(expected.toLowerCase().split(' ')[0])
      );
      addLog(`   ${discovered ? '✅' : '⏳'} ${expected}`);
    });
    addLog('');

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    addLog(`⏱️  Total execution time: ${executionTime}s`);
    addLog(`💰 Estimated cost: $0.00 (local Ollama execution)`);

    // Build response
    const result = {
      status: 'completed',
      duration: parseFloat(executionTime),
      cost: 0.00,
      accuracy: Math.round(evolutionResult.finalScore * 100),
      
      executionLog,
      
      evolution: {
        baselineScore: evolutionResult.baselineScore,
        finalScore: evolutionResult.finalScore,
        improvement: evolutionResult.improvement,
        improvementPercent: evolutionResult.improvementPercent,
        generations: evolutionResult.evolutionHistory.length,
        paretoFrontierSize: evolutionResult.paretoFrontier.length
      },
      
      initialAgent: {
        name: agentInfo.name,
        description: agentInfo.description,
        code: initialCode,
        codeLength: initialCode.length
      },
      
      evolvedAgent: {
        code: evolutionResult.bestAgentCode,
        codeLength: evolutionResult.bestAgentCode.length,
        discoveredPatterns: evolutionResult.discoveredPatterns
      },
      
      evolutionHistory: evolutionResult.evolutionHistory.map(candidate => ({
        id: candidate.id,
        generation: candidate.generation,
        score: candidate.score,
        mutationStrategy: candidate.mutationStrategy,
        metrics: candidate.metrics
      })),
      
      paretoFrontier: evolutionResult.paretoFrontier.map(candidate => ({
        id: candidate.id,
        score: candidate.score,
        codeLength: candidate.code.length,
        complexity: candidate.code.split('\n').length
      })),
      
      comparison: {
        traditional: {
          approach: 'Manual prompt engineering with static agent code',
          development: '2-4 weeks of iterative refinement',
          performance: 'Variable, depends on engineer skill',
          cost: 'High engineering time + trial-and-error',
          scalability: 'Limited - each agent needs manual work'
        },
        gepaEvolution: {
          approach: 'Automated agent code evolution with GEPA',
          development: `${executionTime}s for ${budget || 20} iterations`,
          performance: `${evolutionResult.improvementPercent} improvement measured`,
          cost: '$0.00 (local Ollama execution)',
          scalability: 'High - GEPA can evolve any agent type'
        }
      },
      
      insights: {
        summary: `GEPA evolved the ${agentInfo.name} through ${evolutionResult.evolutionHistory.length} generations, discovering ${evolutionResult.discoveredPatterns.length} architectural patterns. The evolved agent shows ${evolutionResult.improvementPercent} improvement over the baseline, with measurable gains in accuracy, completeness, and reasoning quality.`,
        
        keyFindings: [
          `Baseline agent scored ${evolutionResult.baselineScore.toFixed(3)} on financial task suite`,
          `Evolved agent achieved ${evolutionResult.finalScore.toFixed(3)} score (${evolutionResult.improvementPercent})`,
          `Discovered patterns: ${evolutionResult.discoveredPatterns.join(', ')}`,
          `${evolutionResult.paretoFrontier.length} Pareto-optimal solutions found`,
          `Evolution completed in ${executionTime}s using local Ollama (zero cost)`
        ],
        
        advantages: [
          '🧬 Automatic discovery of agent architectures',
          '🎯 Measurable performance improvements',
          '💰 Zero cost with local Ollama execution',
          '⚡ Fast iteration (20+ generations in seconds)',
          '📊 Multi-objective optimization (accuracy, efficiency, complexity)',
          '🔄 Discovers novel patterns (self-reflection, multi-step reasoning)',
          '🎨 Pareto frontier gives multiple optimal solutions',
          '📈 Reproducible and measurable results'
        ]
      }
    };

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ GEPA Agent Evolution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Agent evolution failed',
        result: {
          status: 'error',
          duration: 0,
          cost: 0,
          accuracy: 0,
          logs: [`Error: ${error.message}`]
        }
      },
      { status: 500 }
    );
  }
}

