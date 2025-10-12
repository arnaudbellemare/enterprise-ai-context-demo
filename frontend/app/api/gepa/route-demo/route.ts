import { NextRequest, NextResponse } from 'next/server';
import { getGEPARouter, type RoutingSignals } from '@/lib/gepa-runtime-router';

/**
 * GEPA Runtime Routing Demo
 * Shows how prompts are selected based on runtime context
 */

export async function POST(request: NextRequest) {
  try {
    const {
      module = 'financial_analyst',
      task = 'Analyze Q3 earnings report',
      user_tier = 'pro',
      task_complexity = 'medium',
      budget_remaining = 10.0,
      latency_requirement = 2000
    } = await request.json();

    console.log('🎯 GEPA Runtime Routing Demo');
    console.log('Module:', module);
    console.log('Task:', task);

    const router = getGEPARouter();

    // Simulate different runtime scenarios
    const scenarios = [
      {
        name: 'High Load Scenario',
        signals: {
          current_load: 0.9,
          budget_remaining: 10.0,
          latency_requirement: 1000,
          risk_tolerance: 0.5,
          user_tier: 'pro' as const,
          task_complexity: 'medium' as const,
          time_of_day: 14
        }
      },
      {
        name: 'Low Budget Scenario',
        signals: {
          current_load: 0.3,
          budget_remaining: 0.50,
          latency_requirement: 3000,
          risk_tolerance: 0.6,
          user_tier: 'free' as const,
          task_complexity: 'low' as const,
          time_of_day: 10
        }
      },
      {
        name: 'Enterprise Critical Scenario',
        signals: {
          current_load: 0.4,
          budget_remaining: 100.0,
          latency_requirement: 5000,
          risk_tolerance: 0.2,
          user_tier: 'enterprise' as const,
          task_complexity: 'high' as const,
          time_of_day: 16
        }
      },
      {
        name: 'Custom Scenario',
        signals: {
          current_load: 0.5,
          budget_remaining,
          latency_requirement,
          risk_tolerance: 0.4,
          user_tier,
          task_complexity,
          time_of_day: new Date().getHours()
        }
      }
    ];

    // Run all scenarios and show routing decisions
    const results = [];
    for (const scenario of scenarios) {
      const variant = await router.selectVariant(module, scenario.signals);
      
      results.push({
        scenario: scenario.name,
        signals: scenario.signals,
        selected_variant: {
          id: variant.id,
          performance: variant.performance,
          prompt_preview: variant.text.substring(0, 200) + '...'
        }
      });

      // Simulate execution and update metrics
      const executionTime = variant.performance.latency_ms + (Math.random() * 200 - 100);
      await router.updateMetrics(module, variant.id, {
        success: true,
        latency_ms: Math.max(100, executionTime),
        cost: variant.performance.cost_per_call
      });
    }

    // Get audit trail
    const auditTrail = router.getAuditTrail(module);

    // Get Pareto bank info
    const bank = router.getBank(module);

    return NextResponse.json({
      success: true,
      result: {
        module,
        task,
        scenarios: results,
        audit_trail: auditTrail.slice(-10), // Last 10 decisions
        pareto_bank: {
          module_name: bank?.module_name,
          total_variants: bank?.variants.length,
          variants_summary: bank?.variants.map(v => ({
            id: v.id,
            performance: v.performance,
            tests_run: v.metadata.tests_run,
            success_rate: v.metadata.success_rate
          }))
        },
        key_insights: [
          'GEPA router selects prompts based on runtime context',
          'High load → fast, cheap variants',
          'Low budget → cost-optimized variants',
          'Enterprise + high complexity → premium accuracy',
          'All decisions are auditable with clear reasoning',
          'No model retraining needed - just text diffs'
        ]
      }
    });

  } catch (error) {
    console.error('GEPA routing demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute GEPA routing demo'
    }, { status: 500 });
  }
}
