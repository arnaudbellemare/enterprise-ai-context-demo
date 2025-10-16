'use client';

import React, { useState, useEffect } from 'react';

interface TraceEvent {
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
    };
  };
}

interface TraceSession {
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

interface TeacherStudentComparison {
  teacher: {
    calls: number;
    total_latency_ms: number;
    avg_latency_ms: number;
    total_cost: number;
    total_tokens: number;
    avg_quality: number;
  };
  student: {
    calls: number;
    total_latency_ms: number;
    avg_latency_ms: number;
    total_cost: number;
    total_tokens: number;
    avg_quality: number;
  };
  insights: {
    latency_ratio: number;
    cost_ratio: number;
    quality_difference: number;
    recommendation: string;
  };
}

export default function TraceViewerPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<TraceSession | null>(null);
  const [comparison, setComparison] = useState<TeacherStudentComparison | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/trace/inspect?action=list');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/trace/inspect?action=get&session_id=${sessionId}`);
      const data = await response.json();
      setSelectedSession(data);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const compareTeacherStudent = async () => {
    try {
      const response = await fetch('/api/trace/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare' })
      });
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Failed to compare:', error);
    }
  };

  const getEventEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      module: '📦',
      lm: '🤖',
      tool: '🔧',
      adapter: '🔌',
      teacher: '👨‍🏫',
      student: '👨‍🎓',
      gepa: '🎯'
    };
    return emojiMap[type] || '📝';
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'start': return 'text-blue-400';
      case 'end': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4">
      {/* Terminal Header */}
      <div className="border-2 border-cyan-400 mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">LIVE</span>
            <span className="text-xs font-mono text-green-400">{currentTime}</span>
          </div>
          <div className="text-xs">DSPY TRACE VIEWER v1.0.0</div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">TRACE VIEWER</h1>
          <div className="text-sm text-green-400">DSPy-Style Observability • Teacher-Student Analysis • GEPA Tracking</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border border-cyan-400 mb-4 p-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'overview', label: 'OVERVIEW', href: '/' },
            { id: 'chat', label: 'CHAT', href: '/chat-reasoning' },
            { id: 'real-benchmarks', label: 'REAL BENCHMARKS', href: '/real-benchmarks' },
            { id: 'trace', label: 'TRACE VIEWER', href: '/trace-viewer' }
          ].map((section) => (
            <a key={section.id} href={section.href}>
              <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  section.id === 'trace'
                    ? 'bg-cyan-400 text-black'
                    : 'bg-black text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}
              >
                [{section.label}]
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border border-cyan-400 mb-4 p-4">
        <div className="flex gap-4">
          <button
            onClick={loadSessions}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded"
          >
            🔄 Refresh Sessions
          </button>
          <button
            onClick={compareTeacherStudent}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded"
          >
            👨‍🏫 vs 👨‍🎓 Compare Teacher-Student
          </button>
        </div>
      </div>

      {/* Teacher-Student Comparison */}
      {comparison && (
        <div className="border border-green-400 mb-4 p-4 bg-green-900 bg-opacity-10">
          <h3 className="text-lg font-bold text-green-400 mb-4">👨‍🏫 TEACHER vs 👨‍🎓 STUDENT COMPARISON</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Teacher Stats */}
            <div className="bg-gray-900 p-4 rounded border-2 border-blue-500">
              <h4 className="text-blue-400 font-bold mb-3">👨‍🏫 TEACHER (Perplexity)</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Calls:</span> <span className="text-white">{comparison.teacher.calls}</span></div>
                <div><span className="text-gray-400">Avg Latency:</span> <span className="text-white">{comparison.teacher.avg_latency_ms.toFixed(2)}ms</span></div>
                <div><span className="text-gray-400">Total Cost:</span> <span className="text-white">${comparison.teacher.total_cost.toFixed(4)}</span></div>
                <div><span className="text-gray-400">Total Tokens:</span> <span className="text-white">{comparison.teacher.total_tokens}</span></div>
                <div><span className="text-gray-400">Avg Quality:</span> <span className="text-white">{(comparison.teacher.avg_quality * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Student Stats */}
            <div className="bg-gray-900 p-4 rounded border-2 border-green-500">
              <h4 className="text-green-400 font-bold mb-3">👨‍🎓 STUDENT (Ollama)</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Calls:</span> <span className="text-white">{comparison.student.calls}</span></div>
                <div><span className="text-gray-400">Avg Latency:</span> <span className="text-white">{comparison.student.avg_latency_ms.toFixed(2)}ms</span></div>
                <div><span className="text-gray-400">Total Cost:</span> <span className="text-white">${comparison.student.total_cost.toFixed(4)}</span></div>
                <div><span className="text-gray-400">Total Tokens:</span> <span className="text-white">{comparison.student.total_tokens}</span></div>
                <div><span className="text-gray-400">Avg Quality:</span> <span className="text-white">{(comparison.student.avg_quality * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gray-900 p-4 rounded">
            <h4 className="text-cyan-400 font-bold mb-3">📊 INSIGHTS</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Latency Ratio:</span>
                <span className="text-white ml-2">
                  Teacher is <strong>{comparison.insights.latency_ratio.toFixed(2)}x</strong> {comparison.insights.latency_ratio > 1 ? 'slower' : 'faster'} than Student
                </span>
              </div>
              <div>
                <span className="text-gray-400">Cost Ratio:</span>
                <span className="text-white ml-2">
                  Teacher costs <strong>{comparison.insights.cost_ratio.toFixed(2)}x</strong> more than Student
                </span>
              </div>
              <div>
                <span className="text-gray-400">Quality Difference:</span>
                <span className="text-white ml-2">
                  Teacher is <strong>{(comparison.insights.quality_difference * 100).toFixed(1)}%</strong> {comparison.insights.quality_difference > 0 ? 'better' : 'worse'}
                </span>
              </div>
              <div className="mt-3 p-3 bg-yellow-900 bg-opacity-20 rounded border border-yellow-400">
                <span className="text-yellow-400 font-bold">💡 Recommendation:</span>
                <span className="text-white ml-2">{comparison.insights.recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="border border-cyan-400 mb-4 p-4">
        <h3 className="text-lg font-bold text-green-400 mb-4">📜 TRACE SESSIONS ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No trace sessions yet</p>
            <p className="text-xs mt-2">Execute queries in /chat-reasoning to generate traces</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className="bg-gray-900 p-3 rounded hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => loadSession(session.session_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-bold">{session.query}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(session.start_time).toLocaleString()} | 
                      {session.duration_ms}ms | 
                      👨‍🏫 {session.teacher_calls} | 
                      👨‍🎓 {session.student_calls} | 
                      ${session.cost?.toFixed(4) || '0.0000'}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    session.success ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                  }`}>
                    {session.success ? 'SUCCESS' : 'FAILED'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Session Details */}
      {selectedSession && (
        <div className="border border-cyan-400 mb-4 p-4">
          <h3 className="text-lg font-bold text-green-400 mb-4">🔍 SESSION DETAILS</h3>
          
          {/* Session Info */}
          <div className="bg-gray-900 p-4 rounded mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-400">Session ID:</span> <span className="text-white text-xs">{selectedSession.session_id}</span></div>
              <div><span className="text-gray-400">Duration:</span> <span className="text-white">{selectedSession.summary.total_duration_ms}ms</span></div>
              <div><span className="text-gray-400">Total Cost:</span> <span className="text-white">${selectedSession.summary.total_cost?.toFixed(4)}</span></div>
              <div><span className="text-gray-400">Success:</span> <span className={selectedSession.summary.success ? 'text-green-400' : 'text-red-400'}>{selectedSession.summary.success ? 'YES' : 'NO'}</span></div>
            </div>
          </div>

          {/* Events Timeline */}
          <div className="space-y-2">
            <h4 className="text-cyan-400 font-bold mb-2">EVENTS TIMELINE ({selectedSession.events.length})</h4>
            {selectedSession.events.map((event, index) => (
              <div key={event.id} className="bg-gray-900 p-3 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getEventEmoji(event.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{event.component}</span>
                      <span className={`text-xs ${getPhaseColor(event.phase)}`}>
                        {event.phase.toUpperCase()}
                      </span>
                    </div>
                    
                    {event.data.metadata && (
                      <div className="text-xs text-gray-400 space-y-1">
                        {event.data.metadata.model && <div>Model: {event.data.metadata.model}</div>}
                        {event.data.metadata.latency_ms !== undefined && <div>Latency: {event.data.metadata.latency_ms.toFixed(2)}ms</div>}
                        {event.data.metadata.tokens !== undefined && <div>Tokens: {event.data.metadata.tokens}</div>}
                        {event.data.metadata.cost !== undefined && <div>Cost: ${event.data.metadata.cost.toFixed(4)}</div>}
                        {event.data.metadata.quality_score !== undefined && <div>Quality: {(event.data.metadata.quality_score * 100).toFixed(1)}%</div>}
                      </div>
                    )}

                    {event.data.error && (
                      <div className="text-xs text-red-400 mt-2">Error: {event.data.error}</div>
                    )}

                    {(event.data.input || event.data.output) && (
                      <details className="mt-2">
                        <summary className="text-xs text-cyan-400 cursor-pointer">View Data</summary>
                        <div className="mt-1 space-y-1">
                          {event.data.input && (
                            <div>
                              <div className="text-xs text-gray-400">Input:</div>
                              <pre className="text-xs text-white bg-black p-2 rounded overflow-x-auto">
                                {JSON.stringify(event.data.input, null, 2).substring(0, 500)}
                              </pre>
                            </div>
                          )}
                          {event.data.output && (
                            <div>
                              <div className="text-xs text-gray-400">Output:</div>
                              <pre className="text-xs text-white bg-black p-2 rounded overflow-x-auto">
                                {JSON.stringify(event.data.output, null, 2).substring(0, 500)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <div>PERMUTATION TRACE VIEWER | DSPy-Style Observability | Teacher-Student Analysis</div>
      </div>
    </div>
  );
}


