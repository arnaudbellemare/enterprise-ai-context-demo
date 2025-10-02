'use client'

import React, { useState } from 'react'

export default function PromptTester() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [testQuery, setTestQuery] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) return
    
    setIsOptimizing(true)
    try {
      // Call GEPA optimization API
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
      // Test the optimized prompt with a real query
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
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
    </div>
  )
}
