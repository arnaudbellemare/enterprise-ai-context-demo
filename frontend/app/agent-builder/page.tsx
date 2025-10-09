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
  Sparkles,
  ArrowLeft,
  MessageSquare,
  FileText,
  Database,
  Play,
  Settings,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Wand2
} from 'lucide-react';

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
  const [routingStrategy, setRoutingStrategy] = useState<'auto' | 'keyword' | 'llm'>('auto');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
- "I want to analyze real estate markets"
- "Create a customer support chatbot"
- "Build a content creation pipeline"
- "Make a data analysis workflow"

Your goals:
- What industry or domain?
- What type of analysis or automation?
- Any specific requirements?

Example:
"I want to create an agent that researches Miami real estate markets, analyzes investment opportunities, and generates detailed reports with recommendations."

Just describe your vision, and I'll build the perfect workflow for you!

What would you like to create today?`,
      timestamp: new Date(),
      metadata: { type: 'welcome' }
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: (Date.now()).toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the HYBRID ROUTING API
      console.log('📤 Sending request to hybrid router:');
      console.log('📤 User input:', input);
      console.log('📤 Routing strategy:', routingStrategy);
      
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: input,
          strategy: routingStrategy
        })
      });

      const data = await response.json();
      console.log('📥 Routing Response:', data);
      console.log('📥 Routing method:', data.routing?.method);
      console.log('📥 Confidence:', data.routing?.confidence);
      console.log('📥 Workflow nodes:', data.workflow?.nodes?.length);
      
      if (data.workflow && data.workflow.nodes) {
        console.log('✅ Workflow generated:', data.workflow);
        
        // Convert to recommendation format
        const workflowRecommendation: WorkflowRecommendation = {
          name: data.workflow.name,
          description: data.workflow.description,
          nodes: data.workflow.nodes,
          edges: data.workflow.nodes.map((node: any, index: number, arr: any[]) => {
            if (index === arr.length - 1) return null;
            return {
              id: `edge-${index}`,
              source: node.id,
              target: arr[index + 1].id
            };
          }).filter(Boolean),
          configs: data.workflow.nodes.reduce((acc: any, node: any) => {
            acc[node.id] = node.config || {};
            return acc;
          }, {}),
          routing: data.routing
        };
        
        setRecommendation(workflowRecommendation);
        
        // Create routing badge for method
        const routingBadge = data.routing?.method === 'keyword' 
          ? '⚡ Fast Path (Keyword)' 
          : '🧠 Smart Path (LLM)';
        
        const confidenceBadge = data.routing?.confidence === 'high'
          ? '✅ High Confidence'
          : data.routing?.confidence === 'medium'
          ? '⚠️ Medium Confidence'
          : '❓ Low Confidence';
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Perfect! I've created a custom workflow for you:

${data.workflow.name}

Description: ${data.workflow.description}

Routing Info:
${routingBadge} | ${confidenceBadge}
Reasoning: ${data.routing?.reasoning || 'Auto-selected optimal workflow'}

Workflow Components:
${data.workflow.nodes.map((node: any, index: number) => 
  `${index + 1}. ${node.role || node.label} - ${node.description}`
).join('\n')}

Flow: ${data.workflow.nodes.map((n: any) => n.role || n.label).join(' → ')}

---

Ready to build this workflow? Click the "Build Workflow" button below to create and execute your custom agent!

Want to modify anything? Just tell me what you'd like to change.`,
          timestamp: new Date(),
          metadata: { 
            type: 'workflow_recommendation',
            recommendation: workflowRecommendation,
            routing: data.routing
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Error or no workflow
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'I encountered an issue creating the workflow. Could you try rephrasing your request?',
          timestamp: new Date(),
          metadata: { type: 'error' }
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
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

  const buildWorkflow = async () => {
    if (!recommendation) return;

    setIsGenerating(true);
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

      console.log('💾 Storing workflow in Supabase:');
      console.log('   Workflow name:', workflowData.name);
      console.log('   Number of nodes:', workflowData.nodes.length);
      console.log('   Node labels:', workflowData.nodes.map(n => n.label));

      // Store workflow in Supabase
      const response = await fetch('/api/workflows/temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to store workflow');
      }

      console.log('✅ Workflow stored successfully:');
      console.log('   Session ID:', result.sessionId);
      console.log('   Expires At:', result.expiresAt);

      // Open workflow page with session ID
      const workflowUrl = `/workflow?session_id=${result.sessionId}`;
      window.open(workflowUrl, '_blank');
      
      const buildMessage: Message = {
        id: (Date.now()).toString(),
        role: 'assistant',
        content: `🚀 **Workflow Created Successfully!**

Your custom workflow **"${recommendation.name}"** has been built and opened in the workflow builder.

**📋 Next Steps:**
1. **Review the workflow** in the new tab
2. **Execute it** by clicking "▶️ Execute Workflow"
3. **Continue the conversation** with the results

**💡 Want to create another workflow?** Just describe what else you'd like to build!

The workflow is now ready to use and can be saved for future reference.`,
        timestamp: new Date(),
        metadata: { type: 'workflow_built' }
      };

      setMessages(prev => [...prev, buildMessage]);
    } catch (error: any) {
      console.error('❌ Error building workflow:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, there was an error building your workflow: ${error.message}. Please try again.`,
        timestamp: new Date(),
        metadata: { error: true }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-semibold">AI Agent Builder</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Routing Strategy Selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Routing:</span>
              <select
                value={routingStrategy}
                onChange={(e) => setRoutingStrategy(e.target.value as 'auto' | 'keyword' | 'llm')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="auto">⚡ Auto (Hybrid)</option>
                <option value="keyword">🎯 Keyword Only</option>
                <option value="llm">🧠 LLM Only</option>
              </select>
            </div>
            
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Conversational Builder
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <Card className="h-[700px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
                  <div className="space-y-6 pb-6 min-h-full">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-purple-600 text-white'
                        }`}>
                          {getMessageIcon(message.role)}
                        </div>
                        <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200'
                          }`}>
                            <div className={`text-sm whitespace-pre-wrap ${
                              message.role === 'user' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {stripMarkdown(message.content)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600 text-white">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="inline-block p-4 rounded-2xl bg-white border border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              Building your workflow...
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Input Area */}
                <div className="flex-shrink-0 p-6 border-t bg-gray-50">
                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe what you want to build..."
                      disabled={isLoading}
                      className="flex-1 border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Preview */}
          <div className="lg:col-span-1">
            <Card className="h-[700px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4" />
                  Workflow Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 flex-1 overflow-y-auto">
                {recommendation ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          {recommendation.name}
                        </h4>
                        <p className="text-sm text-gray-600">{recommendation.description}</p>
                        
                        {/* Routing Info Display */}
                        {recommendation.routing && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={recommendation.routing.method === 'keyword' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {recommendation.routing.method === 'keyword' ? '⚡ Fast Path' : '🧠 Smart Path'}
                            </Badge>
                            <Badge 
                              variant={
                                recommendation.routing.confidence === 'high' ? 'default' : 
                                recommendation.routing.confidence === 'medium' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {recommendation.routing.confidence === 'high' && '✅ High'}
                              {recommendation.routing.confidence === 'medium' && '⚠️ Medium'}
                              {recommendation.routing.confidence === 'low' && '❓ Low'}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-500" />
                          Workflow Components
                        </h4>
                        <div className="space-y-2">
                          {recommendation.nodes.map((node, index) => (
                            <div key={node.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${node.iconColor}`}>
                                {node.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{node.role || node.label}</div>
                                <div className="text-xs text-gray-600">{node.description}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Step {index + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button
                          onClick={buildWorkflow}
                          disabled={isGenerating}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Building Workflow...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Build Workflow
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lightbulb className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">No Workflow Generated Yet</h3>
                      <p className="text-sm text-gray-600">
                        Start a conversation to describe what you want to build, and I'll create a custom workflow for you!
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>💡 Try saying:</p>
                      <p>"Create a real estate market analyzer"</p>
                      <p>"Build a customer support chatbot"</p>
                      <p>"Make a content creation pipeline"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
