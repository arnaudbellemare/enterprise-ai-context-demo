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

🔍 **Key Results:**
${Object.entries(parsed.results).map(([node, result]) => 
  `- **${node}**: ${typeof result === 'string' ? result.substring(0, 100) + '...' : 'Analysis completed'}`
).join('\n')}

💬 **How can I help you explore these results further?** I can:
- Dive deeper into specific findings
- Generate additional analysis
- Create reports or summaries
- Answer questions about the data
- Suggest next steps or recommendations

What would you like to know more about?`,
          timestamp: new Date(),
          metadata: { type: 'workflow_summary' }
        };
        
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error parsing workflow data:', error);
      }
    }
  }, [searchParams]);

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
- Results: ${JSON.stringify(workflowContext.results, null, 2)}
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
              content: `You are an expert AI assistant with access to workflow execution results. Use the provided workflow context to give informed, detailed responses. Be conversational and helpful.

${workflowContextText}

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
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {getMessageIcon(message.role)}
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          <div
                            className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {getMessageIcon(message.role)}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                            AI is thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about the workflow results..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-4"
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  Workflow Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
