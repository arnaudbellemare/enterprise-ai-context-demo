'use client';

/**
 * Agent Builder - Clean Minimalist Interface
 * Uses the real Agent Builder backend with clean UI
 */

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface WorkflowRecommendation {
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    role?: string;
    description: string;
    apiEndpoint?: string;
    icon: string;
    iconColor: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  configs: Record<string, any>;
  routing?: {
    method: 'keyword' | 'llm';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
}

export default function AgentBuilderPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<WorkflowRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to strip markdown formatting from text
  const stripMarkdown = (text: string): string => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
      .replace(/__(.*?)__/g, '$1')     // Remove bold __text__
      .replace(/_(.*?)_/g, '$1')       // Remove italic _text_
      .replace(/`(.*?)`/g, '$1')       // Remove code `text`
      .replace(/#{1,6}\s/g, '')        // Remove headers # ## ### etc
      .replace(/^\s*[-*+]\s/gm, '• ')  // Convert bullet points to simple bullets
      .replace(/\n{3,}/g, '\n\n')      // Limit multiple newlines
      .trim();
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Welcome to the AI Agent Builder!

I can help you create custom AI workflows by simply describing what you want to build. Just tell me:

What you want to achieve:
• Research and analyze data
• Generate reports or content
• Process documents or files
• Create automation workflows
• Build custom AI assistants

Try these examples:`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  // Auto-resize textarea with proper constraints
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Max 120px
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
    setIsGenerating(true);

    try {
      const response = await fetch('/api/agent-builder/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: input.trim(),
          strategy: 'auto',
          context: {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the recommendation from the response
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: stripMarkdown(data.response || 'Workflow generated successfully!'),
          timestamp: new Date(),
          metadata: { 
            recommendation: data.recommendation,
            routing: data.routing
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: stripMarkdown(data.response || 'I understand your request. Let me help you build that workflow.'),
          timestamp: new Date(),
          metadata: data
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Error creating workflow:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while creating your workflow. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "Create a customer support workflow",
    "Build a sales lead qualification system",
    "Design a content marketing automation",
    "Set up inventory management tracking",
    "Develop a project status reporting agent"
  ];

  return (
    <div className="min-h-screen bg-white relative">
      {/* Logo */}
      <div className="absolute top-4 left-4 z-10">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-sm"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-32">
        <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <h1 className="text-center text-4xl font-bold text-black mb-12" style={{ fontFamily: 'monospace' }}>
          What would you like to know?
        </h1>

        {/* Input Box - Horizontal Search Bar Layout */}
        <div className="relative mb-12">
          <div className="bg-white border border-gray-200 rounded-lg max-w-4xl mx-auto">
            {/* Clean Input Bar */}
            <div className="flex items-center px-4 py-4">
              {/* Input Field */}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask about your workflows..."
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="w-full bg-transparent outline-none resize-none text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-transparent"
                  style={{ 
                    fontFamily: 'monospace',
                    minHeight: '20px',
                    maxHeight: '100px'
                  }}
                  rows={1}
                  aria-label="Message input"
                />
              </div>
              
              {/* Right: Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors ml-4"
                aria-label="Send message"
              >
                <span className="text-white text-sm">✈</span>
              </button>
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="max-w-4xl mx-auto space-y-3 mb-12">
          {/* First Row */}
          <div className="flex flex-wrap gap-6 justify-center">
            <button
              onClick={() => handleExampleClick(examplePrompts[0])}
              className="text-black hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {examplePrompts[0]}
            </button>
            <button
              onClick={() => handleExampleClick(examplePrompts[1])}
              className="text-black hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {examplePrompts[1]}
            </button>
          </div>
          
          {/* Second Row */}
          <div className="flex flex-wrap gap-6 justify-center">
            <button
              onClick={() => handleExampleClick(examplePrompts[2])}
              className="text-black hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {examplePrompts[2]}
            </button>
            <button
              onClick={() => handleExampleClick(examplePrompts[3])}
              className="text-black hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {examplePrompts[3]}
            </button>
            <button
              onClick={() => handleExampleClick(examplePrompts[4])}
              className="text-black hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {examplePrompts[4]}
            </button>
          </div>
        </div>

        {/* Messages */}
        {messages.length > 1 && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black" style={{ fontFamily: 'monospace' }}>
                Conversation
              </h3>
              <button
                onClick={() => {
                  const welcomeMessage: Message = {
                    id: '1',
                    role: 'assistant',
                    content: `Welcome to the AI Agent Builder!

I can help you create custom AI workflows by simply describing what you want to build. Just tell me:

What you want to achieve:
• Research and analyze data
• Generate reports or content
• Process documents or files
• Create automation workflows
• Build custom AI assistants

Try these examples:`,
                    timestamp: new Date()
                  };
                  setMessages([welcomeMessage]);
                  setRecommendation(null);
                }}
                className="px-3 py-1 bg-black text-white text-xs font-mono hover:bg-gray-800 rounded transition-colors"
                title="Clear conversation history"
              >
                Clear
              </button>
            </div>
            <div 
              ref={scrollAreaRef}
              className="space-y-3 max-h-96 overflow-y-auto"
            >
              {messages.slice(1).map((message) => (
                <div key={message.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'monospace' }}>
                      {message.role === 'user' ? 'You' : 'Agent'}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap" style={{ fontFamily: 'monospace' }}>
                    {message.content}
                  </p>
                  {message.metadata?.routing && (
                    <div className="mt-2 text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                      Method: {message.metadata.routing.method} | Confidence: {message.metadata.routing.confidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Recommendation */}
        {recommendation && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-black" style={{ fontFamily: 'monospace' }}>
                {recommendation.name}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'monospace' }}>
              {recommendation.description}
            </p>

            {/* Tools/Nodes */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-black mb-2" style={{ fontFamily: 'monospace' }}>
                Workflow Components ({recommendation.nodes.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {recommendation.nodes.map((node, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {node.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Routing Info */}
            {recommendation.routing && (
              <div className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'monospace' }}>
                Routing: {recommendation.routing.method} | Confidence: {recommendation.routing.confidence}
                {recommendation.routing.reasoning && (
                  <div className="mt-1">Reasoning: {recommendation.routing.reasoning}</div>
                )}
              </div>
            )}

            {/* Deployment Section */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-black mb-3" style={{ fontFamily: 'monospace' }}>
                Deploy Workflow
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Deploy to Workflow Builder */}
                <button
                  onClick={async () => {
    if (!recommendation) return;

    try {
      // Prepare the workflow data
      const workflowData = {
        name: recommendation.name,
        description: recommendation.description,
        nodes: recommendation.nodes,
        edges: recommendation.edges,
        configs: recommendation.configs,
        generatedBy: 'Agent Builder',
        timestamp: new Date().toISOString()
      };

                      console.log('💾 Storing workflow:', workflowData.name);

                      // Try Supabase first, fallback to localStorage
                      try {
      const response = await fetch('/api/workflows/temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowData })
      });

      const result = await response.json();

                        if (response.ok && result.success) {
                          console.log('✅ Workflow stored in Supabase:', result.sessionId);
                          window.open(`/workflow?session_id=${result.sessionId}`, '_blank');
                          return;
                        }
                      } catch (dbError) {
                        console.warn('Supabase storage failed, using localStorage:', dbError);
                      }

                      // Fallback to localStorage
                      localStorage.setItem('deployedWorkflow', JSON.stringify(workflowData));
                      console.log('✅ Workflow stored in localStorage');
                      window.open('/workflow', '_blank');
                      
                    } catch (error) {
                      console.error('Error deploying workflow:', error);
                      alert('Failed to deploy workflow. Please try again.');
                    }
                  }}
                  className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  style={{ fontFamily: 'monospace' }}
                >
                  Deploy to Workflow Builder
                </button>

                {/* Export JSON */}
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(recommendation, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${recommendation.name.replace(/\s+/g, '_')}_workflow.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  style={{ fontFamily: 'monospace' }}
                >
                  Export JSON
                </button>

                {/* Copy Configuration */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(recommendation, null, 2));
                    // Simple feedback
                    const btn = event?.target as HTMLButtonElement;
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                      btn.textContent = originalText;
                    }, 2000);
                  }}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                  style={{ fontFamily: 'monospace' }}
                >
                  Copy Config
                </button>
                      </div>

              {/* Deployment Status */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800" style={{ fontFamily: 'monospace' }}>
                    Deployment Options
                  </span>
                        </div>
                <div className="text-xs text-blue-700 space-y-1" style={{ fontFamily: 'monospace' }}>
                  <div>• <strong>Workflow Builder:</strong> Visual drag-and-drop interface</div>
                  <div>• <strong>Export JSON:</strong> Download workflow configuration</div>
                  <div>• <strong>Copy Config:</strong> Share or backup workflow</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

        {/* Loading State */}
        {isGenerating && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-black" style={{ fontFamily: 'monospace' }}>
                Building your agent...
              </h3>
                  </div>
            <p className="text-gray-600" style={{ fontFamily: 'monospace' }}>
              Analyzing requirements and creating workflow components
            </p>
                  </div>
                )}
        </div>
      </div>
    </div>
  );
}