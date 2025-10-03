'use client'

import React, { useState } from 'react'

interface TestResults {
  query: string
  response: string
  sources: string[]
  model: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [testQuery, setTestQuery] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) return
    
    setIsOptimizing(true)
    try {
      const response = await fetch('/api/gepa/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          max_iterations: 10,
          population_size: 20
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setOptimizedPrompt(result.optimized_prompt)
      }
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleTest = async () => {
    if (!testQuery.trim() || !optimizedPrompt.trim()) return
    
    setIsTesting(true)
    try {
      const response = await fetch('/api/perplexity/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: optimizedPrompt },
            { role: 'user', content: testQuery }
          ]
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setTestResults({
          query: testQuery,
          response: result.content,
          sources: result.sources || [],
          model: result.model
        })
      }
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Enterprise AI Context Engineering
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              GEPA Active
            </span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('prompt-tester')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'prompt-tester'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Prompt Tester
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6">
        {activeTab === 'dashboard' ? (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">GEPA Optimization Engine</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Learning Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-200">Iterations</p>
                      <p className="text-2xl font-bold text-white">120</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-200">Performance</p>
                      <p className="text-2xl font-bold text-white">+10%</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-lg">
                      <p className="text-sm text-gray-200">Efficiency</p>
                      <p className="text-2xl font-bold text-white">35x</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-full rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Context Sources
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    3 Connected
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border-blue-500 border">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-3 bg-blue-500"></span>
                      <p className="font-medium text-blue-800">CRM Data</p>
                    </div>
                    <span className="text-sm text-blue-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border-gray-200 border">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-3 bg-gray-400"></span>
                      <p className="font-medium text-gray-900">Document Repository</p>
                    </div>
                    <span className="text-sm text-gray-500">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border-gray-200 border">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-3 bg-gray-400"></span>
                      <p className="font-medium text-gray-900">Product Database</p>
                    </div>
                    <span className="text-sm text-gray-500">Connected</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Platform Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-500">Total Queries</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">1.2M</p>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-green-500">+12%</span>
                    <span className="ml-1 text-sm text-gray-500">since last month</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-500">Avg. Response Time</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">250ms</p>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-red-500">-5%</span>
                    <span className="ml-1 text-sm text-gray-500">since last month</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-500">GEPA Optimizations</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">500</p>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-green-500">+20%</span>
                    <span className="ml-1 text-sm text-gray-500">since last month</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-500">RAG Hit Rate</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-2">92%</p>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-green-500">+3%</span>
                    <span className="ml-1 text-sm text-gray-500">since last month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                AI Prompt Tester & Optimizer
              </h1>
              <p className="text-gray-600">
                Test and optimize your AI prompts for better performance using GEPA optimization
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Original Prompt Input */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Original Prompt
                </h2>
                <textarea
                  value={originalPrompt}
                  onChange={(e) => setOriginalPrompt(e.target.value)}
                  placeholder="Enter your original prompt here..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleOptimize}
                  disabled={!originalPrompt.trim() || isOptimizing}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize with GEPA'}
                </button>
              </div>

              {/* Optimized Prompt Output */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Optimized Prompt
                </h2>
                <div className="h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                  {optimizedPrompt ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{optimizedPrompt}</p>
                  ) : (
                    <p className="text-gray-500 italic">Optimized prompt will appear here...</p>
                  )}
                </div>
                {optimizedPrompt && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Prompt optimized successfully! Ready for testing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Query Section */}
            {optimizedPrompt && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Test Your Optimized Prompt
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Query
                    </label>
                    <textarea
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="Enter a test query to see how your optimized prompt performs..."
                      className="w-full h-24 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleTest}
                      disabled={!testQuery.trim() || isTesting}
                      className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTesting ? 'Testing...' : 'Test Prompt'}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Response
                    </label>
                    <div className="h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                      {testResults ? (
                        <div>
                          <p className="text-sm text-gray-800 mb-2">{testResults.response}</p>
                          {testResults.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600 font-medium">Sources:</p>
                              <ul className="text-xs text-gray-600 mt-1">
                                {testResults.sources.map((source, index) => (
                                  <li key={index}>• {source}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">AI response will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Use Case Examples */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Common Use Cases & Example Prompts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Customer Support</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Optimize prompts for customer service responses
                  </p>
                  <button
                    onClick={() => setOriginalPrompt("You are a helpful customer service representative. Answer customer questions politely and professionally.")}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    Load Example
                  </button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Content Creation</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Optimize prompts for content generation
                  </p>
                  <button
                    onClick={() => setOriginalPrompt("Write engaging content for social media posts. Make it creative and attention-grabbing.")}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    Load Example
                  </button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Technical Support</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Optimize prompts for technical assistance
                  </p>
                  <button
                    onClick={() => setOriginalPrompt("You are a technical support specialist. Help users troubleshoot technical issues with clear, step-by-step instructions.")}
                    className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
                  >
                    Load Example
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
