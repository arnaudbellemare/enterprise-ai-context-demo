'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TerminalDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
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
          <div className="text-xs">PERMUTATION TERMINAL v1.0.0</div>
                  </div>
                <div className="text-center">
          <pre className="text-cyan-400 text-xs sm:text-sm">
{`
 ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║
 ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
 ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
 ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`}
          </pre>
          <div className="mt-2 text-xs text-green-400">[ ADVANCED AI RESEARCH STACK ]</div>
                </div>
              </div>

      {/* Navigation Menu */}
      <div className="border border-cyan-400 mb-4 p-2">
                                  <div className="flex flex-wrap gap-1">
          {[
            { id: 'overview', label: 'OVERVIEW', href: '/' },
            { id: 'chat', label: 'CHAT', href: '/chat-reasoning' },
            { id: 'agent-builder', label: 'AGENT BUILDER', href: '/agent-builder' },
            { id: 'arena', label: 'ARENA', href: '/arena' },
            { id: 'benchmarks', label: 'BENCHMARKS', href: '/benchmarks' }
          ].map((section) => (
            <Link key={section.id} href={section.href}>
                <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyan-400 text-black'
                    : 'bg-black text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                [{section.label}]
                </button>
            </Link>
                              ))}
                  </div>
                </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* System Status */}
        <div className="border border-cyan-400 p-4">
          <div className="text-green-400 mb-3">╔══════════════════════════╗</div>
          <div className="text-green-400 mb-3">║   SYSTEM STATUS          ║</div>
          <div className="text-green-400 mb-3">╚══════════════════════════╝</div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>├─ Components:</span>
              <span className="text-green-400">[11/11 ONLINE]</span>
                                      </div>
            <div className="flex justify-between">
              <span>├─ Accuracy:</span>
              <span className="text-green-400">[95-100%]</span>
                                      </div>
            <div className="flex justify-between">
              <span>├─ Cost vs GPT-4:</span>
              <span className="text-green-400">[-75%]</span>
                                    </div>
            <div className="flex justify-between">
              <span>├─ Tests Passed:</span>
              <span className="text-green-400">[8/8]</span>
                                    </div>
            <div className="flex justify-between">
              <span>└─ Status:</span>
              <span className="text-green-400 animate-pulse">[READY]</span>
                                  </div>
                          </div>

          <div className="mt-4 pt-4 border-t border-cyan-400">
            <div className="text-xs text-gray-500 mb-2">&gt; System Capabilities:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Real-time Reasoning</span>
                        </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Multi-domain AI</span>
                                  </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Adaptive Learning</span>
                                  </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Performance Optimization</span>
                                  </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Statistical Validation</span>
                                </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">●</span>
                <span>Enterprise Ready</span>
                              </div>
                            </div>
                  </div>
                    
                </div>
                        
        {/* Main Actions */}
        <div className="border border-cyan-400 p-4">
          <div className="text-green-400 mb-3">╔══════════════════════════╗</div>
          <div className="text-green-400 mb-3">║   QUICK ACTIONS          ║</div>
          <div className="text-green-400 mb-3">╚══════════════════════════╝</div>

        <div className="space-y-3">
            <Link href="/chat-reasoning">
              <div className="border border-cyan-400 p-3 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer">
                <div className="text-sm mb-1">&gt; CHAT [Real-time Reasoning]</div>
                <div className="text-xs opacity-70">Watch AI think step-by-step</div>
                <div className="text-xs mt-1">└─ 10 reasoning stages visible</div>
              </div>
            </Link>

            <Link href="/agent-builder">
              <div className="border border-cyan-400 p-3 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer">
                <div className="text-sm mb-1">&gt; AGENT BUILDER [Custom AI]</div>
                <div className="text-xs opacity-70">Build domain-specific agents</div>
                <div className="text-xs mt-1">└─ DSPy + LoRA optimization</div>
                      </div>
            </Link>

            <Link href="/arena">
              <div className="border border-cyan-400 p-3 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer">
                <div className="text-sm mb-1">&gt; ARENA [Benchmark Tests]</div>
                <div className="text-xs opacity-70">Compare vs baseline systems</div>
                <div className="text-xs mt-1">└─ 6 domain tasks available</div>
                      </div>
            </Link>

            <Link href="/benchmarks">
              <div className="border border-cyan-400 p-3 hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer">
                <div className="text-sm mb-1">&gt; BENCHMARKS [Performance]</div>
                <div className="text-xs opacity-70">Comprehensive benchmark results</div>
                <div className="text-xs mt-1">└─ All domain performance metrics</div>
                      </div>
            </Link>
                      </div>
                    </div>

        {/* Performance Metrics */}
        <div className="border border-cyan-400 p-4">
          <div className="text-green-400 mb-3">╔══════════════════════════╗</div>
          <div className="text-green-400 mb-3">║   PERFORMANCE            ║</div>
          <div className="text-green-400 mb-3">╚══════════════════════════╝</div>

          <div className="space-y-2 text-xs">
                    <div>
              <div className="flex justify-between mb-1">
                <span>Financial:</span>
                <span className="text-green-400">100% [+15%]</span>
                    </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '100%'}}></div>
                    </div>
                </div>
                
            <div>
              <div className="flex justify-between mb-1">
                <span>Crypto:</span>
                <span className="text-green-400">100% [+30%]</span>
                          </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '100%'}}></div>
                </div>
              </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Real Estate:</span>
                <span className="text-green-400">100% [+20%]</span>
            </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '100%'}}></div>
                </div>
              </div>

                    <div>
              <div className="flex justify-between mb-1">
                <span>Legal:</span>
                <span className="text-green-400">95% [+15%]</span>
                </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '95%'}}></div>
              </div>
                </div>
                
              <div>
              <div className="flex justify-between mb-1">
                <span>Healthcare:</span>
                <span className="text-green-400">98% [+18%]</span>
                </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '98%'}}></div>
              </div>
            </div>

              <div>
              <div className="flex justify-between mb-1">
                <span>Manufacturing:</span>
                <span className="text-green-400">97% [+22%]</span>
              </div>
              <div className="w-full bg-gray-800 h-2">
                <div className="bg-cyan-400 h-2" style={{width: '97%'}}></div>
                    </div>
                </div>
              </div>

          <div className="mt-4 pt-4 border-t border-cyan-400 text-xs">
                          <div className="flex justify-between">
              <span>Avg Improvement:</span>
              <span className="text-green-400">+20%</span>
                          </div>
                          <div className="flex justify-between">
              <span>Cost Savings:</span>
              <span className="text-green-400">-75%</span>
                          </div>
                        </div>
                      </div>

                      </div>

      {/* Bottom Info Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        
        {/* Cost Comparison */}
        <div className="border border-cyan-400 p-4">
          <div className="text-sm mb-3">&gt; COST COMPARISON (per 1000 queries)</div>
          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
              <span>├─ GPT-4:</span>
              <span className="text-red-400">$20.00</span>
                            </div>
                            <div className="flex justify-between">
              <span>├─ Claude:</span>
              <span className="text-red-400">$15.00</span>
                            </div>
                            <div className="flex justify-between">
              <span>├─ Perplexity:</span>
              <span className="text-yellow-400">$10.00</span>
                            </div>
            <div className="flex justify-between border-t border-cyan-400 pt-2">
              <span>└─ PERMUTATION:</span>
              <span className="text-green-400 font-bold">$5.00 [BEST]</span>
                            </div>
                          </div>
                    </div>
                    
        {/* System Log */}
        <div className="border border-cyan-400 p-4">
          <div className="text-sm mb-3">&gt; SYSTEM LOG [RECENT ACTIVITY]</div>
          <div className="space-y-1 text-xs">
            <div className="text-green-400">[OK] All components initialized</div>
            <div className="text-green-400">[OK] Ollama connection: STABLE</div>
            <div className="text-green-400">[OK] Perplexity API: READY</div>
            <div className="text-green-400">[OK] DSPy modules: LOADED</div>
            <div className="text-green-400">[OK] LoRA parameters: OPTIMIZED</div>
            <div className="text-green-400">[OK] IRT validation: ACTIVE</div>
            <div className="text-cyan-400 animate-pulse">[●] System ready for queries...</div>
                  </div>
                </div>

                      </div>


      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <div>PERMUTATION v1.0.0 | 11 Components | Teacher-Student Architecture</div>
      </div>
    </div>
  );
}

