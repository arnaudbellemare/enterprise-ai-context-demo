'use client';

/**
 * 💬 PERMUTATION CHAT - Continuous Workflow
 * 
 * Chat interface powered by AI SDK for continuous conversations
 * Integrates with full PERMUTATION stack
 */

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function PermutationChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/permutation',
  });

  const [showComponents, setShowComponents] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-black text-white mb-4">
            <span className="text-xs font-bold tracking-widest">CONTINUOUS WORKFLOW</span>
          </div>
          
          <h1 className="text-5xl font-bold text-black mb-4 tracking-tight" style={{ fontFamily: 'monospace' }}>
            💬 PERMUTATION CHAT
          </h1>
          
          <p className="text-lg text-gray-600" style={{ fontFamily: 'monospace' }}>
            SWiRL×TRM×ACE×GEPA×IRT - Full AI research stack in conversational mode
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setShowComponents(!showComponents)}
              className="px-4 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all text-sm font-bold"
            >
              {showComponents ? 'Hide' : 'Show'} Components
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-900 shadow-xl">
              
              {/* Chat Header */}
              <div className="bg-black text-white p-4 border-b-2 border-white">
                <h2 className="text-xl font-bold tracking-tight">CONVERSATION</h2>
                <p className="text-sm text-gray-400">Teacher-Student Architecture: Perplexity + Ollama</p>
              </div>

              {/* Messages */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    <p className="text-lg mb-4">Start a conversation with PERMUTATION</p>
                    <p className="text-sm">Try asking about:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Latest tech news</li>
                      <li>• Crypto market analysis</li>
                      <li>• Financial calculations</li>
                      <li>• Complex research tasks</li>
                    </ul>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-gray-100 ml-12'
                        : 'bg-black text-white mr-12'
                    }`}
                  >
                    <div className="text-xs font-bold tracking-widest mb-2 opacity-60">
                      {message.role === 'user' ? 'YOU' : 'PERMUTATION'}
                    </div>
                    <div className="prose prose-sm max-w-none" style={{ fontFamily: 'monospace' }}>
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="p-4 bg-black text-white rounded-lg mr-12 animate-pulse">
                    <div className="text-xs font-bold tracking-widest mb-2 opacity-60">
                      PERMUTATION
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <span className="ml-2 text-sm">Processing with PERMUTATION stack...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="border-t-2 border-gray-900 p-4 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask anything... (powered by PERMUTATION)"
                    className="flex-1 px-4 py-3 border-2 border-gray-900 bg-white focus:border-black focus:shadow-lg transition-all font-mono"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'PROCESSING...' : 'SEND'}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  Uses: Perplexity (teacher) + Ollama (student) + PERMUTATION (ACE, GEPA, IRT, LoRA, ReasoningBank)
                </div>
              </form>
            </div>
          </div>

          {/* Components Panel */}
          {showComponents && (
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-gray-900 shadow-xl sticky top-8">
                <div className="bg-black text-white p-4 border-b-2 border-white">
                  <h3 className="text-lg font-bold tracking-tight">PERMUTATION STACK</h3>
                  <p className="text-xs text-gray-400">11 Components Active</p>
                </div>
                
                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {[
                    { name: 'Smart Routing', status: 'active', icon: '🎯' },
                    { name: 'Multi-Query (60)', status: 'active', icon: '🔍' },
                    { name: 'SQL Generation', status: 'standby', icon: '🗄️' },
                    { name: 'Local Embeddings', status: 'active', icon: '💾' },
                    { name: 'ACE Framework', status: 'active', icon: '📚' },
                    { name: 'ReasoningBank', status: 'active', icon: '🧠' },
                    { name: 'LoRA Parameters', status: 'active', icon: '🎯' },
                    { name: 'IRT Validation', status: 'active', icon: '📊' },
                    { name: 'SWiRL Decomposition', status: 'active', icon: '🔄' },
                    { name: 'Perplexity Teacher', status: 'active', icon: '🎓' },
                    { name: 'DSPy Refine', status: 'active', icon: '⚡' },
                  ].map((component, i) => (
                    <div
                      key={i}
                      className={`p-3 border-2 ${
                        component.status === 'active'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{component.icon}</span>
                          <span className="text-sm font-bold">{component.name}</span>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            component.status === 'active' ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {component.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t-2 border-gray-900 bg-gray-50">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Teacher:</span>
                      <span className="font-bold">Perplexity 'sonar'</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Student:</span>
                      <span className="font-bold">Ollama gemma3:4b</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost/Query:</span>
                      <span className="font-bold text-green-600">~$0.005</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by PERMUTATION - Full AI Research Stack</p>
          <p className="text-xs mt-1">
            SWiRL (Stanford+DeepMind) × TRM × ACE × GEPA × IRT × ReasoningBank × LoRA
          </p>
        </div>
      </div>
    </div>
  );
}
