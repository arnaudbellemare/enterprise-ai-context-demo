'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Workflow, 
  ArrowLeft,
  Sparkles,
  MessageSquare,
  FileText,
  Database
} from 'lucide-react';

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

  // Get workflow data from localStorage
  useEffect(() => {
    const workflowData = localStorage.getItem('workflowChatData');
    if (workflowData) {
      try {
        const parsed = JSON.parse(workflowData);
        setWorkflowContext(parsed);
        // Clear the data after reading to avoid stale data
        localStorage.removeItem('workflowChatData');
        
        // Initialize chat with workflow summary
        const initialMessage: Message = {
          id: '1',
          role: 'assistant',
          content: `I've analyzed the **${parsed.workflowName}** workflow execution. Here's what I found:

📊 **Workflow Summary:**
- Execution completed in ${parsed.executionTime}
- ${parsed.nodes.length} nodes processed successfully

🔍 **Key Results Available:**
${Object.entries(parsed.results).map(([nodeId, result]) => {
  const node = parsed.nodes.find((n: any) => n.id === nodeId);
  const nodeLabel = node?.label || nodeId;
  const resultPreview = typeof result === 'string' ? result.substring(0, 150) + '...' : 'Analysis completed';
  return `- **${nodeLabel}**: ${resultPreview}`;
}).join('\n')}

💬 **I'm ready to help you explore these real estate market insights!** I can:
- Analyze specific market trends from the research
- Provide investment recommendations based on the data
- Explain property market insights in detail
- Create comprehensive investment reports
- Answer questions about market conditions and opportunities

What specific aspect of the real estate market analysis would you like to explore?`,
          timestamp: new Date(),
          metadata: { type: 'workflow_summary' }
        };
        
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error parsing workflow data:', error);
      }
    }
  }, []); // Empty dependency array since we only run once on mount

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context with workflow results
      const workflowContextText = workflowContext ? `
WORKFLOW CONTEXT:
- Workflow: ${workflowContext.workflowName}
- Execution Time: ${workflowContext.executionTime}
- Nodes Processed: ${workflowContext.nodes.map(n => n.label).join(', ')}

DETAILED WORKFLOW RESULTS:
${Object.entries(workflowContext.results).map(([nodeId, result]) => {
  const node = workflowContext.nodes.find(n => n.id === nodeId);
  return `\n**${node?.label || nodeId}**:\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}`;
}).join('\n\n')}
` : '';

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert AI assistant specializing in real estate market analysis and investment recommendations. You have access to detailed workflow execution results from a Real Estate Market Analysis workflow.

IMPORTANT: You MUST use the provided workflow context and results to answer all questions. Do NOT provide generic recommendations about movies, books, or other topics. Focus ONLY on real estate investment insights based on the workflow data.

WORKFLOW CONTEXT:
${workflowContextText}

INSTRUCTIONS:
- Always reference the specific workflow results when answering
- Provide real estate investment recommendations based on the market research
- Use the property database insights for your analysis
- Draw conclusions from the market analyst findings
- Reference the investment report data in your responses
- Stay focused on real estate and investment topics only

Current conversation context:`
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: input
            }
          ]
        })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'Sorry, I encountered an error.',
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        metadata: { error: true }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.close()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workflow
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold">Workflow Chat</h1>
            </div>
          </div>
          
          {workflowContext && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {workflowContext.workflowName}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Messages */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
                  <div className="space-y-6 pb-6 min-h-full">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div
                            className={`text-xs mt-3 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-4 justify-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                            AI is thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Input Area */}
                <div className="border-t bg-gray-50/50 p-6 flex-shrink-0">
                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about the workflow results..."
                      disabled={isLoading}
                      className="flex-1 border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Context Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-[700px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4" />
                  Workflow Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 flex-1 overflow-y-auto">
                {workflowContext ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Workflow Name</h4>
                      <p className="text-sm text-gray-600">{workflowContext.workflowName}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Execution Time</h4>
                      <p className="text-sm text-gray-600">{workflowContext.executionTime}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Nodes Processed</h4>
                      <div className="space-y-1">
                        {workflowContext.nodes.map((node: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>{node.label || node.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Results Available</h4>
                      <div className="space-y-1">
                        {Object.keys(workflowContext.results).map((key) => (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <Database className="w-3 h-3 text-blue-500" />
                            <span>{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No workflow context available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
