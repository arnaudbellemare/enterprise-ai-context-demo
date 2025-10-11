'use client';

/**
 * Workflow Chat - Redesigned with Agent Builder V2 Style
 * Clean, modern, black & white UI with Hugeicons
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight01Icon,
  CheckmarkBadge02Icon,
  Clock01Icon,
  ChartLineData01Icon
} from 'hugeicons-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface WorkflowContext {
  workflowName: string;
  executionTime: string;
  results: any;
  nodes: any[];
}

export default function WorkflowChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowContext, setWorkflowContext] = useState<WorkflowContext | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Strip all markdown formatting
  const stripMarkdown = (text: string): string => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')     // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1')         // Remove italic *text*
      .replace(/__(.*?)__/g, '$1')         // Remove bold __text__
      .replace(/_(.*?)_/g, '$1')           // Remove italic _text_
      .replace(/`(.*?)`/g, '$1')           // Remove code `text`
      .replace(/#{1,6}\s+(.*)/g, '$1')     // Remove headers # text
      .replace(/^\s*[-*+]\s+/gm, '• ')     // Convert bullet points
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')  // Remove links [text](url)
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')    // Remove images
      .replace(/\n{3,}/g, '\n\n')          // Limit multiple newlines
      .trim();
  };

  // Get workflow data from localStorage
  useEffect(() => {
    const workflowData = localStorage.getItem('workflowChatData');
    if (workflowData) {
      try {
        const parsed = JSON.parse(workflowData);
        setWorkflowContext(parsed);
        localStorage.removeItem('workflowChatData');
        
        const initialMessage: Message = {
          id: '1',
          role: 'assistant',
          content: stripMarkdown(`Workflow "${parsed.workflowName}" executed successfully.\n\nExecution time: ${parsed.executionTime}\nNodes processed: ${parsed.nodes.length}\n\nWhat would you like to know about the results?`),
          timestamp: new Date(),
          metadata: { type: 'workflow_summary' }
        };
        
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error parsing workflow data:', error);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat-with-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: input.trim() }],
          workflowContext: workflowContext?.results,
          stream: false
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: stripMarkdown(data.response || data.message || 'No response'),
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Black & White */}
      <div className="bg-black border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/workflow"
                className="group flex items-center gap-2 px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-200"
              >
                <ArrowRight01Icon size={20} className="text-white group-hover:text-black transform rotate-180" />
                <span className="font-bold text-sm tracking-wide">BACK TO WORKFLOW</span>
              </a>
              
              <div className="w-px h-8 bg-white/30" />
              
              <div className="flex items-center gap-3">
                <ChartLineData01Icon size={32} className="text-white" />
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {workflowContext?.workflowName || 'Workflow Chat'}
                  </h1>
                  {workflowContext && (
                    <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock01Icon size={14} />
                        {workflowContext.executionTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckmarkBadge02Icon size={14} />
                        {workflowContext.nodes.length} nodes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Panel - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200 h-[700px] flex flex-col">
              
              {/* Chat Header */}
              <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckmarkBadge02Icon size={24} className="text-black" />
                  <div>
                    <h2 className="text-lg font-bold text-black">Workflow Assistant</h2>
                    <p className="text-xs text-gray-600">Ask questions about your workflow results</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
              >
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <CheckmarkBadge02Icon size={20} className="text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`px-4 py-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-black border-2 border-gray-200'
                      }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                        U
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <CheckmarkBadge02Icon size={20} className="text-white" />
                    </div>
                    <div className="bg-gray-100 border-2 border-gray-200 rounded-lg px-5 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t-2 border-gray-200 bg-white px-6 py-4">
                <div className="flex gap-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about the workflow results..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-black transition-colors text-sm"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="group px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <ArrowRight01Icon size={20} className="text-white" />
                    <span className="font-bold text-sm tracking-wide">SEND</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Context Panel - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 h-[700px] flex flex-col">
              
              {/* Panel Header */}
              <div className="bg-gray-900 border-b-2 border-black px-6 py-4">
                <div className="flex items-center gap-3">
                  <ChartLineData01Icon size={24} className="text-white" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Workflow Results</h2>
                    <p className="text-xs text-gray-300">Node execution details</p>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {workflowContext ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                      <h3 className="text-sm font-bold text-black mb-3">Execution Summary</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Workflow:</span>
                          <span className="font-medium text-black">{workflowContext.workflowName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium text-black">{workflowContext.executionTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nodes:</span>
                          <span className="font-medium text-black">{workflowContext.nodes.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Node Results */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-black">Node Results</h3>
                      {workflowContext.nodes.map((node, index) => (
                        <details key={index} className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="bg-white border-2 border-gray-200 p-3 rounded-lg hover:border-black transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-medium text-black">{node.label || node.type}</span>
                                </div>
                                <span className="text-xs text-gray-500">▼</span>
                              </div>
                            </div>
                          </summary>
                          
                          <div className="mt-2 bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                            <div className="text-xs text-gray-800 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {typeof node.result === 'string' 
                                ? node.result 
                                : JSON.stringify(node.result, null, 2)}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChartLineData01Icon size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">No workflow data available</p>
                    <p className="text-xs text-gray-500 mt-2">Execute a workflow to see results here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

