'use client';

/**
 * 💬 PERMUTATION CHAT - Continuous Workflow
 * 
 * Chat interface powered by AI SDK for continuous conversations
 * Integrates with full PERMUTATION stack
 */

import { useState, useRef, useEffect } from 'react';
import { Message02Icon } from 'hugeicons-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function PermutationChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/permutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'No response',
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-black text-white mb-4">
            <span className="text-xs font-bold tracking-widest">CONTINUOUS WORKFLOW</span>
          </div>
          
          <h1 className="text-5xl font-bold text-black mb-4 tracking-tight flex items-center justify-center gap-4" style={{ fontFamily: 'Armitage, var(--font-quicksand), Quicksand, sans-serif' }}>
            <Message02Icon size={48} className="text-black" />
            Permutation Research
          </h1>
          
          <p className="text-lg text-gray-600" style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}>
            SWiRL×TRM×ACE×GEPA×IRT - Full AI research stack in conversational mode
          </p>

        </div>

        {/* Main Chat Area - Full Width Centered */}
        <div className="max-w-4xl mx-auto">
            <div className="bg-white border-2 border-gray-900 shadow-xl">
              
              {/* Chat Header */}
              <div className="bg-black text-white p-4 border-b-2 border-white">
                <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif' }}>CONVERSATION</h2>
                <p className="text-sm text-gray-400" style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}>Teacher-Student Architecture: Perplexity + Ollama</p>
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
                        ? 'bg-gray-100 ml-12 text-black'
                        : 'bg-black text-white mr-12'
                    }`}
                  >
                    <div className="text-xs font-bold tracking-widest mb-2 opacity-60" style={{ fontFamily: 'var(--font-quicksand), Quicksand, sans-serif' }}>
                      {message.role === 'user' ? 'YOU' : 'PERMUTATION'}
                    </div>
                    <div 
                      className={`max-w-none ${message.role === 'user' ? 'text-black' : 'text-white'}`}
                      style={{ 
                        fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif', 
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content.replace(/\*\*/g, '')}
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
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="border-t-2 border-gray-900 p-4 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask anything..."
                    className="flex-1 px-4 py-3 border-2 border-gray-900 bg-black text-white focus:border-white focus:shadow-lg transition-all placeholder-gray-500"
                    style={{ fontFamily: 'VT323, "Courier New", monospace', fontSize: '20px', letterSpacing: '1px' }}
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
                <div className="mt-2 text-xs text-gray-500" style={{ fontFamily: 'Proxima Nova, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  Uses: Perplexity (teacher) + Ollama (student) + PERMUTATION (ACE, GEPA, IRT, LoRA, ReasoningBank)
                </div>
              </form>
            </div>
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
