import { NextRequest, NextResponse } from 'next/server';
import { getAdaptivePromptSystem } from '@/lib/adaptive-prompt-system';

/**
 * Adaptive Prompt Management API
 * 
 * "If the task changes, so should the prompt"
 * 
 * - Get adaptive prompts
 * - Record performance
 * - Evolve templates (GEPA-style)
 * - Switch strategies
 * - Export/import templates
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const taskType = searchParams.get('task_type');
    const templateId = searchParams.get('template_id');

    const promptSystem = getAdaptivePromptSystem();

    switch (action) {
      case 'list':
        // List all templates
        const templates = promptSystem.getTemplates(taskType || undefined);
        return NextResponse.json({
          total_templates: templates.length,
          templates: templates.map(t => ({
            id: t.id,
            name: t.name,
            task_type: t.task_type,
            success_rate: t.performance.success_rate,
            avg_quality: t.performance.avg_quality,
            usage_count: t.performance.usage_count,
            optimized_by: t.metadata.optimized_by
          }))
        });

      case 'stats':
        // Get performance stats
        const stats = promptSystem.getPerformanceStats();
        return NextResponse.json(stats);

      case 'export':
        // Export template
        if (!templateId) {
          return NextResponse.json({ error: 'template_id required' }, { status: 400 });
        }
        
        const exported = promptSystem.exportTemplate(templateId);
        if (!exported) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        
        return new Response(exported, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="prompt-${templateId}.json"`
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Adaptive prompt error:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const promptSystem = getAdaptivePromptSystem();

    switch (action) {
      case 'get_prompt':
        // Get adaptive prompt for a task
        const { query, task_type, difficulty, domain, previous_attempts } = body;
        
        if (!query) {
          return NextResponse.json({ error: 'query required' }, { status: 400 });
        }

        const result = await promptSystem.getAdaptivePrompt(query, {
          task_type: task_type || 'general',
          difficulty: difficulty || 0.5,
          domain: domain || 'general',
          previous_attempts: previous_attempts || 0
        });

        return NextResponse.json(result);

      case 'record_performance':
        // Record prompt performance
        const { template_id, success, quality, latency_ms } = body;
        
        if (!template_id) {
          return NextResponse.json({ error: 'template_id required' }, { status: 400 });
        }

        promptSystem.recordPerformance(
          template_id,
          success !== false,
          quality || 0.8,
          latency_ms || 200
        );

        return NextResponse.json({ success: true, message: 'Performance recorded' });

      case 'evolve':
        // Evolve template based on successful execution
        const { base_template_id, successful_prompt, performance } = body;
        
        if (!base_template_id || !successful_prompt) {
          return NextResponse.json({ 
            error: 'base_template_id and successful_prompt required' 
          }, { status: 400 });
        }

        const evolved = promptSystem.evolveTemplate(
          base_template_id,
          successful_prompt,
          performance || { success: true, quality: 0.9, latency_ms: 200 }
        );

        if (!evolved) {
          return NextResponse.json({ 
            success: false, 
            message: 'Evolution skipped - not significantly better' 
          });
        }

        return NextResponse.json({
          success: true,
          evolved_template: evolved,
          message: 'Template evolved successfully'
        });

      case 'switch_strategy':
        // Switch prompt strategy
        const { task_type: switchTaskType, strategy } = body;
        
        if (!switchTaskType || !strategy) {
          return NextResponse.json({ 
            error: 'task_type and strategy required' 
          }, { status: 400 });
        }

        promptSystem.switchStrategy(switchTaskType, strategy);

        return NextResponse.json({
          success: true,
          message: `Strategy switched to ${strategy} for ${switchTaskType}`
        });

      case 'import':
        // Import template
        const { template_json } = body;
        
        if (!template_json) {
          return NextResponse.json({ error: 'template_json required' }, { status: 400 });
        }

        const imported = promptSystem.importTemplate(template_json);

        return NextResponse.json({
          success: imported,
          message: imported ? 'Template imported' : 'Import failed'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Adaptive prompt action error:', error);
    return NextResponse.json(
      { error: 'Action failed', details: error.message },
      { status: 500 }
    );
  }
}




