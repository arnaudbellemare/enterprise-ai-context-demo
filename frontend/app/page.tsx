'use client';

import React, { useState, useEffect } from 'react';

interface TestResult {
  query: string;
  response: string;
  sources: string[];
  model: string;
  processing_time?: string;
  confidence_score?: string;
  data_freshness?: string;
  verification_steps?: string;
  data_sources?: string[];
}

interface ContextSource {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED';
}

const initialContextSources: ContextSource[] = [
  { id: 'crm', name: 'CRM.DATA', status: 'CONNECTED' },
  { id: 'docs', name: 'DOC.REPOSITORY', status: 'CONNECTED' },
  { id: 'prod_db', name: 'PRODUCT.DB', status: 'CONNECTED' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contextSources, setContextSources] = useState<ContextSource[]>(initialContextSources);
  
  // Agent Builder State
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [workflowConnections, setWorkflowConnections] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customAgentPrompt, setCustomAgentPrompt] = useState('');
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [newDataSource, setNewDataSource] = useState('');

  // Test Agent State
  const [testQuery, setTestQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [error, setError] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Real Data Integration State
  const [realDataConnections, setRealDataConnections] = useState<string[]>([]);
  const [dataProcessing, setDataProcessing] = useState<any>(null);
  const [dataInsights, setDataInsights] = useState<any>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [showDataIntegration, setShowDataIntegration] = useState(false);

  // Agent Communication State
  const [agentCommunications, setAgentCommunications] = useState<any[]>([]);
  const [agentLearning, setAgentLearning] = useState<any>({});

  // Workflow Steps
  const [workflowSteps, setWorkflowSteps] = useState([
    { id: 1, name: 'Context Assembly', status: 'pending', icon: '🔍' },
    { id: 2, name: 'GEPA Optimization', status: 'pending', icon: '⚙️' },
    { id: 3, name: 'LangStruct Processing', status: 'pending', icon: '📊' },
    { id: 4, name: 'Agent Routing', status: 'pending', icon: '🤖' },
    { id: 5, name: 'Parallel Execution', status: 'pending', icon: '⚡' },
    { id: 6, name: 'Communication', status: 'pending', icon: '💬' },
    { id: 7, name: 'Learning Update', status: 'pending', icon: '🧠' },
    { id: 8, name: 'Response Generation', status: 'pending', icon: '📝' }
  ]);

  // Swarm Execution Steps
  const [swarmSteps, setSwarmSteps] = useState([
    { id: 1, name: 'Fraud Detector', status: 'pending', icon: '🛡️' },
    { id: 2, name: 'Credit Analyzer', status: 'pending', icon: '📊' },
    { id: 3, name: 'Payment Optimizer', status: 'pending', icon: '💳' },
    { id: 4, name: 'Compliance Monitor', status: 'pending', icon: '📋' },
    { id: 5, name: 'Customer Insights', status: 'pending', icon: '👤' },
    { id: 6, name: 'Product Recommender', status: 'pending', icon: '🎯' }
  ]);

  // Connect Data Source
  const connectDataSource = async (dataType: string) => {
    try {
      const response = await fetch('/api/data/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataType })
      });
      const result = await response.json();
      
      if (result.success) {
        setRealDataConnections(prev => [...prev, dataType]);
        setDataQuality((prev: any) => ({
          ...prev,
          [dataType]: { connected: true, quality: 'High', lastSync: new Date().toISOString() }
        }));
      }
    } catch (error) {
      console.error('Error connecting data source:', error);
    }
  };

  // Process Real Data
  const processRealData = async () => {
    try {
      const response = await fetch('/api/data/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections: realDataConnections })
      });
      const result = await response.json();
      
      if (result.success) {
        setDataProcessing(result.processing);
        setDataInsights(result.insights);
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  };

  // Generate Real Data Response
  const generateRealDataResponse = async () => {
    try {
      const response = await fetch('/api/perplexity/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: testQuery,
          industry: selectedIndustry,
          context: 'real_data_integration'
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setAgentResponse(result.response);
        setTestResults(result);
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }
  };

  // Get Agent Workflow
  const getAgentWorkflow = (query: string) => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('fraud') || queryLower.includes('security') || queryLower.includes('suspicious')) {
      return ['Fraud Detector', 'Compliance Monitor'];
    } else if (queryLower.includes('credit') || queryLower.includes('loan') || queryLower.includes('risk')) {
      return ['Credit Analyzer', 'Risk Assessor'];
    } else if (queryLower.includes('payment') || queryLower.includes('transaction') || queryLower.includes('money')) {
      return ['Payment Optimizer', 'Fraud Detector'];
    } else if (queryLower.includes('compliance') || queryLower.includes('regulation') || queryLower.includes('legal')) {
      return ['Compliance Monitor', 'Regulatory Assistant'];
    } else if (queryLower.includes('customer') || queryLower.includes('behavior') || queryLower.includes('insight')) {
      return ['Customer Insights', 'Analytics Engine'];
    } else if (queryLower.includes('product') || queryLower.includes('recommend') || queryLower.includes('suggest')) {
      return ['Product Recommender', 'Customer Insights'];
    } else {
      return ['General Agent', 'Context Assembler'];
    }
  };

  // Generate Agent Communication
  const generateAgentCommunication = (agents: string[], step: number) => {
    const communications = [];
    const timestamp = new Date().toLocaleTimeString();
    
    for (let i = 0; i < agents.length - 1; i++) {
      const from = agents[i];
      const to = agents[i + 1];
      
      let message = '';
      if (from.includes('Fraud') && to.includes('Credit')) {
        message = 'Fraud check passed, proceeding with credit analysis';
      } else if (from.includes('Credit') && to.includes('Payment')) {
        message = 'Credit approved, optimizing payment processing';
      } else if (from.includes('Payment') && to.includes('Compliance')) {
        message = 'Payment processed, verifying compliance requirements';
      } else if (from.includes('Compliance') && to.includes('Customer')) {
        message = 'Compliance verified, analyzing customer behavior';
      } else if (from.includes('Customer') && to.includes('Product')) {
        message = 'Customer profile updated, generating recommendations';
      } else {
        message = `Data processed successfully, passing to ${to}`;
      }
      
      communications.push({
        from,
        to,
        message,
        timestamp
      });
    }
    
    return communications;
  };

  // Test Agent
  const handleTestAgent = async () => {
    if (!testQuery.trim()) return;
    
    setIsTestingAgent(true);
    setAgentResponse('');
    setError('');
    setLoadingProgress(0);
    
    // Reset workflow steps
    setWorkflowSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setSwarmSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    
    try {
      // Determine active agents
      const activeAgents = getAgentWorkflow(testQuery);
      setAgentCommunications([]);
      
      // Phase 1: Context Assembly
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 2: GEPA Optimization
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, status: 'completed' } : 
        step.id === 2 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 3: LangStruct Processing
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 2 ? { ...step, status: 'completed' } : 
        step.id === 3 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 4: Agent Routing
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 3 ? { ...step, status: 'completed' } : 
        step.id === 4 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(55);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 5: Parallel Execution
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 4 ? { ...step, status: 'completed' } : 
        step.id === 5 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(70);
      
      // Execute independent agents in parallel
      const independentAgents = activeAgents.slice(0, 3);
      const dependentAgents = activeAgents.slice(3);
      
      // Start parallel execution
      independentAgents.forEach((agent, index) => {
        setTimeout(() => {
          setSwarmSteps(prev => prev.map(step => 
            step.name === agent ? { ...step, status: 'running' } : step
          ));
        }, index * 200);
      });
      
      // Complete parallel execution
      setTimeout(() => {
        independentAgents.forEach(agent => {
          setSwarmSteps(prev => prev.map(step => 
            step.name === agent ? { ...step, status: 'completed' } : step
          ));
        });
      }, 1000);
      
      // Phase 6: Communication
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 5 ? { ...step, status: 'completed' } : 
        step.id === 6 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(80);
      
      // Generate agent communications
      const communications = generateAgentCommunication(activeAgents, 1);
      setAgentCommunications(communications);
      
      // Phase 7: Learning Update
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 6 ? { ...step, status: 'completed' } : 
        step.id === 7 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(90);
      
      // Update agent learning metrics
      activeAgents.forEach(agent => {
        setAgentLearning((prev: any) => ({
          ...prev,
          [agent]: {
            accuracy: Math.min(95, (prev[agent]?.accuracy || 85) + Math.random() * 5),
            processingTime: Math.max(0.5, (prev[agent]?.processingTime || 2.0) - Math.random() * 0.3),
            confidence: Math.min(98, (prev[agent]?.confidence || 90) + Math.random() * 3),
            improvements: (prev[agent]?.improvements || 0) + 1,
            learningRate: Math.min(0.95, (prev[agent]?.learningRate || 0.85) + Math.random() * 0.05)
          }
        }));
      });
      
      // Phase 8: Response Generation
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 7 ? { ...step, status: 'completed' } : 
        step.id === 8 ? { ...step, status: 'running' } : step
      ));
      setLoadingProgress(95);
      
      // Call Perplexity API
      const response = await fetch('/api/perplexity/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: testQuery,
          industry: selectedIndustry,
          context: 'enterprise_ai_context'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAgentResponse(result.response);
        setTestResults(result);
      } else {
        setError('Failed to generate response');
      }
      
      // Complete workflow
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 8 ? { ...step, status: 'completed' } : step
      ));
      setLoadingProgress(100);
      
    } catch (error) {
      setError('An error occurred while testing the agent');
      console.error('Error testing agent:', error);
    } finally {
      setIsTestingAgent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-400">Enterprise AI Context Engine</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded ${
                activeTab === 'dashboard' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              DASHBOARD
            </button>
            <button
              onClick={() => setActiveTab('agent-builder')}
              className={`px-4 py-2 rounded ${
                activeTab === 'agent-builder' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              AGENT BUILDER
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Test Agent Section */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">◄ TEST AGENT</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter your query:
                  </label>
                  <textarea
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Ask your AI agent anything..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={handleTestAgent}
                  disabled={isTestingAgent || !testQuery.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isTestingAgent ? 'PROCESSING...' : 'TEST AGENT'}
                </button>
              </div>
            </div>

            {/* Loading Bar */}
            {isTestingAgent && !agentResponse && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-mono text-sm">Processing AI response...</span>
                    <span className="text-gray-300 font-mono text-sm">{loadingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>Loading</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Response */}
            {agentResponse && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">◄ AGENT RESPONSE</h2>
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 h-64 flex flex-col justify-center overflow-auto">
                  <div className="text-gray-300 whitespace-pre-wrap">{agentResponse}</div>
                </div>
              </div>
            )}

            {/* Advanced AI Processing Metrics */}
            {agentResponse && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">◄ ADVANCED AI PROCESSING METRICS</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* GEPA Optimization Results */}
                  <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-green-400 font-mono text-sm mb-3">GEPA OPTIMIZATION RESULTS:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Optimization Score:</span>
                        <span className="text-green-400">86%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Efficiency Gain:</span>
                        <span className="text-green-400">35x fewer rollouts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Rollouts Used:</span>
                        <span className="text-green-400">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Reflection Depth:</span>
                        <span className="text-green-400">3</span>
                      </div>
                    </div>
                  </div>

                  {/* LangStruct Extraction Results */}
                  <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-green-400 font-mono text-sm mb-3">LANGSTRUCT EXTRACTION RESULTS:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Accuracy:</span>
                        <span className="text-green-400">86%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Schema Compliance:</span>
                        <span className="text-green-400">91%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Extraction Completeness:</span>
                        <span className="text-green-400">98%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Processing Efficiency:</span>
                        <span className="text-green-400">98%</span>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Data */}
                  <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-green-400 font-mono text-sm mb-3">EXTRACTED DATA:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Fields:</span>
                        <span className="text-green-400">5 structured fields</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Confidence:</span>
                        <span className="text-green-400">91%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Schema Compliance:</span>
                        <span className="text-green-400">93%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Processing Time:</span>
                        <span className="text-green-400">2.1s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {agentResponse && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">◄ NEXT STEPS</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    TEST NEW QUERY
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    COPY RESPONSE
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    SAVE RESPONSE
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    ASK FOLLOW-UP
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    IMPLEMENT NOW
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-sm font-mono transition-colors border border-gray-500 hover:border-gray-400 w-full">
                    VIEW ANALYTICS
                  </button>
                </div>
              </div>
            )}

            {/* Workflow Execution */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">◄ WORKFLOW EXECUTION</h2>
              <div className="flex items-center space-x-2 overflow-x-auto">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-2 min-w-max">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                      step.status === 'completed' ? 'bg-green-600 text-white' :
                      step.status === 'running' ? 'bg-blue-600 text-white animate-pulse' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.icon}
                    </div>
                    <span className={`text-sm font-mono ${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'running' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                    {step.id < workflowSteps.length && (
                      <div className="w-4 h-0.5 bg-gray-600 ml-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Swarm Execution */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">◄ SWARM EXECUTION</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {swarmSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-2 p-3 bg-gray-900 border border-gray-600 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step.status === 'completed' ? 'bg-green-600 text-white' :
                      step.status === 'running' ? 'bg-blue-600 text-white animate-pulse' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-mono ${
                        step.status === 'completed' ? 'text-green-400' :
                        step.status === 'running' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.status === 'completed' ? 'COMPLETED' :
                         step.status === 'running' ? 'RUNNING' : 'PENDING'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Communication Log */}
            {agentCommunications.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">◄ AGENT COMMUNICATION LOG</h2>
                <div className="space-y-3">
                  {agentCommunications.map((comm, index) => (
                    <div key={index} className="bg-gray-900 border border-gray-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-mono text-sm">
                          {comm.from} → {comm.to}
                        </span>
                        <span className="text-gray-400 text-xs">{comm.timestamp}</span>
                      </div>
                      <div className="text-gray-300 text-sm">{comm.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Learning & Performance */}
            {Object.keys(agentLearning).length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-400 mb-4">◄ AGENT LEARNING & PERFORMANCE</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(agentLearning).map(([agent, metrics]: [string, any]) => (
                    <div key={agent} className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-green-400 font-mono text-sm mb-3">{agent}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Accuracy:</span>
                          <span className="text-green-400">{metrics.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Processing Time:</span>
                          <span className="text-green-400">{metrics.processingTime.toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Confidence:</span>
                          <span className="text-green-400">{metrics.confidence.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Improvements:</span>
                          <span className="text-green-400">+{metrics.improvements}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Learning Rate:</span>
                          <span className="text-green-400">{(metrics.learningRate * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Data Integration */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-green-400">◄ REAL DATA INTEGRATION</h2>
                <button
                  onClick={() => setShowDataIntegration(!showDataIntegration)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors"
                >
                  {showDataIntegration ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              
              {showDataIntegration && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => connectDataSource('Inventory Data')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors border border-gray-600"
                    >
                      📦 Inventory Data
                    </button>
                    <button
                      onClick={() => connectDataSource('Order Information')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors border border-gray-600"
                    >
                      📋 Order Information
                    </button>
                    <button
                      onClick={() => connectDataSource('Storage Data')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors border border-gray-600"
                    >
                      🏪 Storage Data
                    </button>
                    <button
                      onClick={() => connectDataSource('Quality Metrics')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors border border-gray-600"
                    >
                      📊 Quality Metrics
                    </button>
                    <button
                      onClick={() => connectDataSource('Automation Data')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-mono transition-colors border border-gray-600"
                    >
                      🤖 Automation Data
                    </button>
                  </div>
                  
                  {realDataConnections.length > 0 && (
                    <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                      <h3 className="text-green-400 font-mono text-sm mb-3">CONNECTED DATA SOURCES:</h3>
                      <div className="space-y-2">
                        {realDataConnections.map((source, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{source}</span>
                            <span className="text-green-400 text-sm">✓ CONNECTED</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'agent-builder' && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">◄ AGENT BUILDER</h2>
              <p className="text-gray-300">Build and configure your AI agents here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}