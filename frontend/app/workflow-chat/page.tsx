'use client';

import React, { useState, useEffect } from 'react';
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Get workflow data from localStorage
  useEffect(() => {
    const workflowData = localStorage.getItem('workflowChatData');
    if (workflowData) {
      try {
        const parsed = JSON.parse(workflowData);
        setWorkflowContext(parsed);
        // Clear the data after reading to avoid stale data
        localStorage.removeItem('workflowChatData');
        
        // Initialize chat with detailed workflow summary
        const initialMessage: Message = {
          id: '1',
          role: 'assistant',
          content: `I've analyzed your **${parsed.workflowName}** workflow execution and have access to all the real data. Here's what was processed:

📊 **Workflow Summary:**
- Execution completed in ${parsed.executionTime}
- ${parsed.nodes.length} nodes processed successfully

🔍 **Real Data Available:**
${Object.entries(parsed.results).map(([nodeId, result]) => {
  const node = parsed.nodes.find(n => n.id === nodeId);
  const resultText = Array.isArray(result) ? result.join(' ') : result.toString();
  return `- **${node?.label || nodeId}**: ${resultText.substring(0, 150)}${resultText.length > 150 ? '...' : ''}`;
}).join('\n')}

💬 **I can help you with:**
- **Investment recommendations** based on the market analysis
- **Property insights** from the database search
- **Market trends** and pricing analysis
- **Risk assessment** and opportunities
- **Detailed reports** and summaries

**What specific aspect would you like me to focus on?** I have all the workflow data ready to provide detailed, actionable insights.`,
          timestamp: new Date(),
          metadata: { type: 'workflow_summary' }
        };
        
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error parsing workflow data:', error);
      }
    }
  }, []); // Empty dependency array since we only run once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      // Prepare detailed workflow context
      const workflowContextText = workflowContext ? `
=== WORKFLOW EXECUTION RESULTS ===
Workflow: ${workflowContext.workflowName}
Execution Time: ${workflowContext.executionTime}

DETAILED RESULTS FROM EACH NODE:
${Object.entries(workflowContext.results).map(([nodeId, result]) => {
  const node = workflowContext.nodes.find(n => n.id === nodeId);
  return `\n**${node?.label || nodeId}**:\n${Array.isArray(result) ? result.join('\n') : result}`;
}).join('\n')}

=== END WORKFLOW CONTEXT ===
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
              content: `You are a real estate investment expert AI assistant with access to detailed workflow execution results. 

IMPORTANT: You have access to REAL workflow data from a Real Estate Market Analysis workflow. Use this data to provide specific, actionable recommendations based on the actual market research, property data, and analysis results.

${workflowContextText}

INSTRUCTIONS:
- Base ALL responses on the workflow results above
- Provide specific real estate investment recommendations
- Reference actual data points from the workflow
- Be actionable and professional
- If user asks for recommendations, give REAL ESTATE recommendations based on the workflow data

Current conversation:`
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
            <Card className="h-[600px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 px-6 py-4 min-h-0">
                  <div className="space-y-6 pb-6">
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
                    ))}
                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Input Area - Fixed at bottom */}
                <div className="border-t bg-gray-50/50 p-4 flex-shrink-0">
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
            <Card className="h-[600px]">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4" />
                  Workflow Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 overflow-y-auto">
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
