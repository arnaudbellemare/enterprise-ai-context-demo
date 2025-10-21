import { NextRequest, NextResponse } from 'next/server';
import { getTracer } from '@/lib/dspy-observability';

/**
 * Trace Inspection API
 * 
 * DSPy-style observability for PERMUTATION:
 * - inspect_history(): View all LLM calls
 * - Compare Teacher vs Student performance
 * - Export traces for analysis
 */

export async function GET(req: NextRequest) {
  try {
    const tracer = getTracer();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const sessionId = searchParams.get('session_id');

    switch (action) {
      case 'list':
        // List all sessions
        const sessions = tracer.getAllSessions();
        return NextResponse.json({
          total_sessions: sessions.length,
          sessions: sessions.map(s => ({
            session_id: s.session_id,
            query: s.query,
            start_time: s.start_time,
            end_time: s.end_time,
            duration_ms: s.summary.total_duration_ms,
            teacher_calls: s.summary.teacher_calls,
            student_calls: s.summary.student_calls,
            cost: s.summary.total_cost,
            success: s.summary.success
          }))
        });

      case 'get':
        // Get specific session
        if (!sessionId) {
          return NextResponse.json({ error: 'session_id required' }, { status: 400 });
        }
        
        const session = tracer.getSession(sessionId);
        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        
        return NextResponse.json(session);

      case 'current':
        // Get current session
        const currentSession = tracer.getCurrentSession();
        if (!currentSession) {
          return NextResponse.json({ error: 'No active session' }, { status: 404 });
        }
        
        return NextResponse.json(currentSession);

      case 'export':
        // Export trace as JSON
        const exportedTrace = tracer.exportTrace(sessionId || undefined);
        return new Response(exportedTrace, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="trace-${sessionId || 'current'}.json"`
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Trace inspection error:', error);
    return NextResponse.json(
      { error: 'Trace inspection failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const tracer = getTracer();

    switch (action) {
      case 'compare':
        // Compare Teacher vs Student (like DSPy's inspect_history)
        const session = tracer.getCurrentSession();
        if (!session) {
          return NextResponse.json({ error: 'No active session' }, { status: 404 });
        }

        const teacherEvents = session.events.filter(e => e.data.metadata?.is_teacher);
        const studentEvents = session.events.filter(e => e.data.metadata?.is_student);

        const teacherStats = {
          calls: teacherEvents.length,
          total_latency_ms: teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0),
          avg_latency_ms: teacherEvents.length > 0 
            ? teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0) / teacherEvents.length 
            : 0,
          total_cost: teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.cost || 0), 0),
          total_tokens: teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.tokens || 0), 0),
          avg_quality: teacherEvents.length > 0
            ? teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.quality_score || 0), 0) / teacherEvents.length
            : 0
        };

        const studentStats = {
          calls: studentEvents.length,
          total_latency_ms: studentEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0),
          avg_latency_ms: studentEvents.length > 0
            ? studentEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0) / studentEvents.length
            : 0,
          total_cost: studentEvents.reduce((sum, e) => sum + (e.data.metadata?.cost || 0), 0),
          total_tokens: studentEvents.reduce((sum, e) => sum + (e.data.metadata?.tokens || 0), 0),
          avg_quality: studentEvents.length > 0
            ? studentEvents.reduce((sum, e) => sum + (e.data.metadata?.quality_score || 0), 0) / studentEvents.length
            : 0
        };

        const comparison = {
          teacher: teacherStats,
          student: studentStats,
          insights: {
            latency_ratio: teacherStats.avg_latency_ms / (studentStats.avg_latency_ms || 1),
            cost_ratio: teacherStats.total_cost / (studentStats.total_cost || 0.001),
            quality_difference: teacherStats.avg_quality - studentStats.avg_quality,
            recommendation: teacherStats.total_cost > studentStats.total_cost * 10
              ? 'Consider using Student model more for cost savings'
              : 'Current Teacher-Student balance is good'
          }
        };

        return NextResponse.json(comparison);

      case 'clear':
        // Clear all traces
        tracer.clearSessions();
        return NextResponse.json({ success: true, message: 'All traces cleared' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Trace action error:', error);
    return NextResponse.json(
      { error: 'Trace action failed', details: error.message },
      { status: 500 }
    );
  }
}



