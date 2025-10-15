/**
 * DSPy Observability & Debugging for PERMUTATION
 * 
 * Integrates with:
 * - AX LLM (our LLM client)
 * - DSPy (programmatic LLM composition)
 * - GEPA (optimization)
 * - Teacher-Student architecture (Perplexity + local models)
 * 
 * Provides:
 * - Full trace logging
 * - Teacher vs Student comparison
 * - Component inspection
 * - Performance metrics
 * - Error debugging
 */

export interface TraceEvent {
  id: string;
  timestamp: number;
  type: 'module' | 'lm' | 'tool' | 'adapter' | 'teacher' | 'student' | 'gepa';
  component: string;
  phase: 'start' | 'end' | 'error';
  data: {
    input?: any;
    output?: any;
    error?: string;
    metadata?: {
      model?: string;
      latency_ms?: number;
      tokens?: number;
      cost?: number;
      quality_score?: number;
      is_teacher?: boolean;
      is_student?: boolean;
      gepa_score?: number;
    };
  };
}

export interface TraceSession {
  session_id: string;
  query: string;
  start_time: number;
  end_time?: number;
  events: TraceEvent[];
  summary: {
    total_duration_ms?: number;
    total_cost?: number;
    teacher_calls: number;
    student_calls: number;
    gepa_optimizations: number;
    success: boolean;
    error?: string;
  };
}

export class PermutationTracer {
  private sessions: Map<string, TraceSession> = new Map();
  private currentSessionId: string | null = null;
  private eventHandlers: Array<(event: TraceEvent) => void> = [];

  constructor() {
    console.log('🔍 PERMUTATION Tracer initialized');
  }

  /**
   * Start a new trace session
   */
  startSession(query: string): string {
    const sessionId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: TraceSession = {
      session_id: sessionId,
      query,
      start_time: Date.now(),
      events: [],
      summary: {
        teacher_calls: 0,
        student_calls: 0,
        gepa_optimizations: 0,
        success: false
      }
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    console.log(`🎬 Started trace session: ${sessionId}`);
    console.log(`   Query: "${query.substring(0, 100)}..."`);

    return sessionId;
  }

  /**
   * Log a trace event
   */
  logEvent(
    type: TraceEvent['type'],
    component: string,
    phase: TraceEvent['phase'],
    data: TraceEvent['data']
  ): void {
    if (!this.currentSessionId) {
      console.warn('⚠️ No active trace session');
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) return;

    const event: TraceEvent = {
      id: `event-${session.events.length}`,
      timestamp: Date.now(),
      type,
      component,
      phase,
      data
    };

    session.events.push(event);

    // Update summary counters
    if (data.metadata?.is_teacher) session.summary.teacher_calls++;
    if (data.metadata?.is_student) session.summary.student_calls++;
    if (type === 'gepa') session.summary.gepa_optimizations++;

    // Call registered handlers
    this.eventHandlers.forEach(handler => handler(event));

    // Console logging for real-time monitoring
    this.logToConsole(event);
  }

  /**
   * Log Teacher Model call
   */
  logTeacherCall(
    phase: 'start' | 'end' | 'error',
    input?: string,
    output?: any,
    metadata?: any
  ): void {
    this.logEvent('teacher', 'Teacher Model (Perplexity)', phase, {
      input,
      output,
      metadata: {
        ...metadata,
        is_teacher: true,
        model: metadata?.model || 'perplexity-sonar-pro'
      }
    });
  }

  /**
   * Log Student Model call
   */
  logStudentCall(
    phase: 'start' | 'end' | 'error',
    input?: string,
    output?: any,
    metadata?: any
  ): void {
    this.logEvent('student', 'Student Model (Local/Ollama)', phase, {
      input,
      output,
      metadata: {
        ...metadata,
        is_student: true,
        model: metadata?.model || 'ollama-gemma3:4b'
      }
    });
  }

  /**
   * Log DSPy module execution
   */
  logModuleExecution(
    module: string,
    phase: 'start' | 'end' | 'error',
    input?: any,
    output?: any,
    metadata?: any
  ): void {
    this.logEvent('module', module, phase, {
      input,
      output,
      metadata
    });
  }

  /**
   * Log GEPA optimization
   */
  logGEPAOptimization(
    phase: 'start' | 'end' | 'error',
    input?: any,
    output?: any,
    gepaScore?: number
  ): void {
    this.logEvent('gepa', 'GEPA Optimizer', phase, {
      input,
      output,
      metadata: { gepa_score: gepaScore }
    });
  }

  /**
   * End current session
   */
  endSession(success: boolean = true, error?: string): TraceSession | null {
    if (!this.currentSessionId) return null;

    const session = this.sessions.get(this.currentSessionId);
    if (!session) return null;

    session.end_time = Date.now();
    session.summary.total_duration_ms = session.end_time - session.start_time;
    session.summary.success = success;
    session.summary.error = error;

    // Calculate total cost
    session.summary.total_cost = session.events.reduce((sum, event) => {
      return sum + (event.data.metadata?.cost || 0);
    }, 0);

    console.log(`🏁 Ended trace session: ${this.currentSessionId}`);
    console.log(`   Duration: ${session.summary.total_duration_ms}ms`);
    console.log(`   Teacher calls: ${session.summary.teacher_calls}`);
    console.log(`   Student calls: ${session.summary.student_calls}`);
    console.log(`   Total cost: $${session.summary.total_cost.toFixed(4)}`);
    console.log(`   Success: ${success}`);

    this.currentSessionId = null;
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TraceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get current session
   */
  getCurrentSession(): TraceSession | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): TraceSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Register event handler
   */
  onEvent(handler: (event: TraceEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Inspect history (like DSPy's inspect_history)
   */
  inspectHistory(n: number = 10): void {
    if (!this.currentSessionId) {
      console.log('No active session');
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) return;

    const recentEvents = session.events.slice(-n);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📜 TRACE HISTORY (last ${n} events)`);
    console.log(`${'='.repeat(80)}\n`);

    recentEvents.forEach((event, index) => {
      console.log(`[${index + 1}] ${new Date(event.timestamp).toISOString()}`);
      console.log(`Type: ${event.type} | Component: ${event.component} | Phase: ${event.phase}`);
      
      if (event.data.input) {
        console.log(`Input: ${JSON.stringify(event.data.input).substring(0, 200)}...`);
      }
      
      if (event.data.output) {
        console.log(`Output: ${JSON.stringify(event.data.output).substring(0, 200)}...`);
      }
      
      if (event.data.metadata) {
        console.log(`Metadata:`, event.data.metadata);
      }
      
      console.log('');
    });
  }

  /**
   * Compare Teacher vs Student performance
   */
  compareTeacherStudent(): void {
    if (!this.currentSessionId) {
      console.log('No active session');
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) return;

    const teacherEvents = session.events.filter(e => e.data.metadata?.is_teacher);
    const studentEvents = session.events.filter(e => e.data.metadata?.is_student);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏫 TEACHER vs STUDENT COMPARISON`);
    console.log(`${'='.repeat(80)}\n`);

    // Teacher stats
    const teacherLatency = teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0);
    const teacherCost = teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.cost || 0), 0);
    const teacherTokens = teacherEvents.reduce((sum, e) => sum + (e.data.metadata?.tokens || 0), 0);

    console.log(`👨‍🏫 TEACHER MODEL (Perplexity):`);
    console.log(`   Calls: ${teacherEvents.length}`);
    console.log(`   Total Latency: ${teacherLatency}ms`);
    console.log(`   Avg Latency: ${teacherEvents.length > 0 ? (teacherLatency / teacherEvents.length).toFixed(2) : 0}ms`);
    console.log(`   Total Cost: $${teacherCost.toFixed(4)}`);
    console.log(`   Total Tokens: ${teacherTokens}`);

    // Student stats
    const studentLatency = studentEvents.reduce((sum, e) => sum + (e.data.metadata?.latency_ms || 0), 0);
    const studentCost = studentEvents.reduce((sum, e) => sum + (e.data.metadata?.cost || 0), 0);
    const studentTokens = studentEvents.reduce((sum, e) => sum + (e.data.metadata?.tokens || 0), 0);

    console.log(`\n👨‍🎓 STUDENT MODEL (Ollama):`);
    console.log(`   Calls: ${studentEvents.length}`);
    console.log(`   Total Latency: ${studentLatency}ms`);
    console.log(`   Avg Latency: ${studentEvents.length > 0 ? (studentLatency / studentEvents.length).toFixed(2) : 0}ms`);
    console.log(`   Total Cost: $${studentCost.toFixed(4)}`);
    console.log(`   Total Tokens: ${studentTokens}`);

    // Comparison
    console.log(`\n📊 COMPARISON:`);
    if (teacherEvents.length > 0 && studentEvents.length > 0) {
      const latencyRatio = teacherLatency / studentLatency;
      const costRatio = teacherCost / studentCost;
      console.log(`   Teacher is ${latencyRatio.toFixed(2)}x ${latencyRatio > 1 ? 'slower' : 'faster'} than Student`);
      console.log(`   Teacher costs ${costRatio.toFixed(2)}x ${costRatio > 1 ? 'more' : 'less'} than Student`);
    }
  }

  /**
   * Export trace to JSON (for external analysis)
   */
  exportTrace(sessionId?: string): string {
    const id = sessionId || this.currentSessionId;
    if (!id) return '{}';

    const session = this.sessions.get(id);
    if (!session) return '{}';

    return JSON.stringify(session, null, 2);
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    console.log('🧹 Cleared all trace sessions');
  }

  /**
   * Console logging helper
   */
  private logToConsole(event: TraceEvent): void {
    const emoji = this.getEmojiForEvent(event);
    const phaseSymbol = event.phase === 'start' ? '▶️' : event.phase === 'end' ? '✅' : '❌';
    
    console.log(`${emoji} ${phaseSymbol} ${event.component}`);
    
    if (event.data.metadata) {
      const meta = event.data.metadata;
      const details: string[] = [];
      
      if (meta.model) details.push(`model=${meta.model}`);
      if (meta.latency_ms) details.push(`${meta.latency_ms}ms`);
      if (meta.tokens) details.push(`${meta.tokens} tokens`);
      if (meta.cost) details.push(`$${meta.cost.toFixed(4)}`);
      if (meta.quality_score) details.push(`quality=${(meta.quality_score * 100).toFixed(1)}%`);
      if (meta.gepa_score) details.push(`gepa=${(meta.gepa_score * 100).toFixed(1)}%`);
      
      if (details.length > 0) {
        console.log(`   ${details.join(' | ')}`);
      }
    }
  }

  private getEmojiForEvent(event: TraceEvent): string {
    const emojiMap: Record<TraceEvent['type'], string> = {
      module: '📦',
      lm: '🤖',
      tool: '🔧',
      adapter: '🔌',
      teacher: '👨‍🏫',
      student: '👨‍🎓',
      gepa: '🎯'
    };
    return emojiMap[event.type] || '📝';
  }
}

// Singleton instance
let tracerInstance: PermutationTracer | null = null;

export function getTracer(): PermutationTracer {
  if (!tracerInstance) {
    tracerInstance = new PermutationTracer();
  }
  return tracerInstance;
}

/**
 * DSPy-style callback for PERMUTATION
 */
export class PermutationCallback {
  private tracer: PermutationTracer;

  constructor() {
    this.tracer = getTracer();
  }

  onModuleStart(moduleId: string, inputs: any): void {
    this.tracer.logModuleExecution(moduleId, 'start', inputs);
  }

  onModuleEnd(moduleId: string, outputs: any, metadata?: any): void {
    this.tracer.logModuleExecution(moduleId, 'end', undefined, outputs, metadata);
  }

  onLMStart(model: string, prompt: string): void {
    const isTeacher = model.includes('perplexity') || model.includes('teacher');
    
    if (isTeacher) {
      this.tracer.logTeacherCall('start', prompt);
    } else {
      this.tracer.logStudentCall('start', prompt);
    }
  }

  onLMEnd(model: string, response: any, metadata?: any): void {
    const isTeacher = model.includes('perplexity') || model.includes('teacher');
    
    if (isTeacher) {
      this.tracer.logTeacherCall('end', undefined, response, metadata);
    } else {
      this.tracer.logStudentCall('end', undefined, response, metadata);
    }
  }

  onToolStart(toolName: string, inputs: any): void {
    this.tracer.logEvent('tool', toolName, 'start', { input: inputs });
  }

  onToolEnd(toolName: string, outputs: any): void {
    this.tracer.logEvent('tool', toolName, 'end', { output: outputs });
  }

  onError(component: string, error: Error): void {
    this.tracer.logEvent('module', component, 'error', {
      error: error.message
    });
  }
}

