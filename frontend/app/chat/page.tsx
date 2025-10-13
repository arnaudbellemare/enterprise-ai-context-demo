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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Header - Apple minimalist style */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            Permutation
          </h1>

          <p className="text-base text-gray-500 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
            Advanced AI reasoning system
          </p>

        </div>

        {/* Main Chat Area - Apple minimalist */}
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              
              {/* Chat Messages - No separate header */}

              {/* Messages */}
              <div className="h-[500px] overflow-y-auto p-8 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-20" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                    <p className="text-xl font-medium text-gray-900 mb-3">How can I help you?</p>
                    <p className="text-sm text-gray-500">Ask me anything about current events, analysis, or research.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-5 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto max-w-[75%]'
                        : 'bg-gray-100 text-gray-900 mr-auto max-w-[75%]'
                    }`}
                  >
                    <div 
                      className="max-w-none leading-relaxed"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', 
                        fontSize: '15px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content.replace(/\*\*/g, '')}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="p-5 bg-gray-100 rounded-2xl mr-auto max-w-[75%]">
                    <div className="flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form - Apple style */}
              <form onSubmit={handleSubmit} className="border-t border-gray-200 p-6 bg-white rounded-b-2xl">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Message..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 text-gray-900"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontSize: '15px' }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                  >
                    {isLoading ? '...' : '↑'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        {/* Footer Info - Apple style */}
        <div className="mt-8 text-center text-xs text-gray-400" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
          <p>Powered by advanced AI reasoning</p>
        </div>
      </div>
    </div>
  );
}
