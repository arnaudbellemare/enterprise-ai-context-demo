/**
 * Prompt Engineering Examples Demo
 * Interactive demonstration of structured prompt architecture
 * Enhanced with KV cache optimization and ACE framework integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  promptExamples, 
  promptBuilder, 
  PromptEngineeringTips,
  PromptStructure 
} from '@/lib/prompt-engineering-examples';

interface PromptDemo {
  id: string;
  title: string;
  description: string;
  structure: PromptStructure;
  exampleQuery: string;
  category: 'professional' | 'creative' | 'technical' | 'educational';
}

export default function PromptExamplesPage() {
  const [selectedDemo, setSelectedDemo] = useState<string>('careerCoach');
  const [userQuery, setUserQuery] = useState<string>('');
  const [showOptimization, setShowOptimization] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const demos: PromptDemo[] = [
    {
      id: 'careerCoach',
      title: 'AI Career Coach (Joe)',
      description: 'Professional career guidance with character consistency',
      structure: promptExamples.careerCoach,
      exampleQuery: 'I want to transition from marketing to data science. What steps should I take?',
      category: 'professional'
    },
    {
      id: 'codeReviewer',
      title: 'Technical Code Reviewer (Alex)',
      description: 'Code quality assessment and constructive feedback',
      structure: promptExamples.codeReviewer,
      exampleQuery: 'Can you review this JavaScript function for security issues?',
      category: 'technical'
    },
    {
      id: 'businessConsultant',
      title: 'Business Strategy Consultant (Sarah)',
      description: 'Data-driven business analysis and recommendations',
      structure: promptExamples.businessConsultant,
      exampleQuery: 'Our customer retention rate has dropped 15%. How should we address this?',
      category: 'professional'
    },
    {
      id: 'creativeWriting',
      title: 'Creative Writing Coach (Maya)',
      description: 'Storytelling guidance and creative inspiration',
      structure: promptExamples.creativeWriting,
      exampleQuery: 'I\'m stuck on my novel\'s middle section. The plot feels flat and boring.',
      category: 'creative'
    }
  ];

  const currentDemo = demos.find(d => d.id === selectedDemo) || demos[0];

  useEffect(() => {
    // Update cache stats
    setCacheStats(promptBuilder.getCacheStats());
  }, [selectedDemo]);

  const generateOptimizedPrompt = () => {
    const dynamicData = {
      question: userQuery || currentDemo.exampleQuery,
      history: 'Previous conversation: User asked about career transitions...',
      projectContext: 'React/TypeScript codebase with focus on security',
      clientIndustry: 'SaaS technology company',
      writerLevel: 'Intermediate'
    };

    return promptBuilder.buildOptimizedPrompt(currentDemo.structure, dynamicData);
  };

  const optimizedPrompt = generateOptimizedPrompt();

  const renderPromptComponent = (title: string, content: string, index: number) => {
    const isCached = index < 5; // First 5 components are cached
    const tokenCount = Math.ceil(content.length / 4);
    
    return (
      <div 
        key={index}
        className={`p-4 rounded-lg border-2 ${
          isCached 
            ? 'border-green-200 bg-green-50' 
            : 'border-blue-200 bg-blue-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{index + 1}. {title}</h3>
          <div className="flex items-center space-x-2">
            {isCached && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                💾 Cached
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tokenCount} tokens
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {content}
        </div>
      </div>
    );
  };

  const promptComponents = [
    { title: 'Task Context', content: currentDemo.structure.taskContext },
    { title: 'Tone Context', content: currentDemo.structure.toneContext },
    { title: 'Background Data', content: currentDemo.structure.backgroundData },
    { title: 'Detailed Rules', content: currentDemo.structure.detailedRules },
    { title: 'Examples', content: currentDemo.structure.examples },
    { title: 'Conversation History', content: currentDemo.structure.conversationHistory },
    { title: 'Immediate Task', content: currentDemo.structure.immediateTask },
    { title: 'Thinking Step', content: currentDemo.structure.thinkingStep },
    { title: 'Output Formatting', content: currentDemo.structure.outputFormatting },
    { title: 'Prefilled Response', content: currentDemo.structure.prefilledResponse || 'None' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'monospace' }}>
            Advanced Prompt Engineering Examples
          </h1>
          <p className="text-gray-300" style={{ fontFamily: 'monospace' }}>
            10-component structured architecture + KV cache optimization + ACE framework integration
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Demo Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'monospace' }}>
            Choose a Prompt Example:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setSelectedDemo(demo.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedDemo === demo.id
                    ? 'border-black bg-gray-100'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <h3 className="font-semibold text-black mb-1" style={{ fontFamily: 'monospace' }}>
                  {demo.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{demo.description}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  demo.category === 'professional' ? 'bg-blue-100 text-blue-800' :
                  demo.category === 'technical' ? 'bg-green-100 text-green-800' :
                  demo.category === 'creative' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {demo.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Demo Info */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: 'monospace' }}>
            {currentDemo.title}
          </h2>
          <p className="text-gray-700 mb-4">{currentDemo.description}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'monospace' }}>
              Example Query:
            </label>
            <input
              type="text"
              value={userQuery || currentDemo.exampleQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder={currentDemo.exampleQuery}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <button
            onClick={() => setShowOptimization(!showOptimization)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            style={{ fontFamily: 'monospace' }}
          >
            {showOptimization ? 'Hide' : 'Show'} KV Cache Optimization
          </button>
        </div>

        {/* KV Cache Optimization */}
        {showOptimization && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-xl font-semibold text-green-800 mb-4" style={{ fontFamily: 'monospace' }}>
              💾 KV Cache Optimization Results
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Cached Tokens</div>
                <div className="text-2xl font-bold text-green-600">{optimizedPrompt.tokensReused}</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Dynamic Tokens</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.ceil(optimizedPrompt.dynamicSuffix.length / 4)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Cache Key</div>
                <div className="text-sm font-mono text-gray-800">{optimizedPrompt.cacheKey}</div>
              </div>
            </div>

            <div className="text-sm text-green-700">
              <strong>Benefits:</strong> Reusable prefix cached once, reused across multiple queries. 
              Dynamic content (conversation history, immediate questions) processed separately.
              Typical token savings: 80-90% for repeated interactions.
            </div>
          </div>
        )}

        {/* Cache Statistics */}
        {cacheStats && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-4" style={{ fontFamily: 'monospace' }}>
              📊 Cache Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Cached Prompts</div>
                <div className="text-2xl font-bold text-blue-600">{cacheStats.totalPrompts}</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Cached Tokens</div>
                <div className="text-2xl font-bold text-blue-600">{cacheStats.totalCachedTokens}</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600">Average Reuse</div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(cacheStats.averageReuse)}</div>
              </div>
            </div>
          </div>
        )}

        {/* 10-Component Prompt Structure */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'monospace' }}>
            📋 10-Component Prompt Structure
          </h2>
          
          <div className="space-y-4">
            {promptComponents.map((component, index) => 
              renderPromptComponent(component.title, component.content, index)
            )}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-black mb-4" style={{ fontFamily: 'monospace' }}>
            🎯 Prompt Engineering Best Practices
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-black mb-2" style={{ fontFamily: 'monospace' }}>
                Structure Components:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {Object.entries(PromptEngineeringTips.structure).map(([num, tip]) => (
                  <li key={num} className="flex">
                    <span className="font-mono text-gray-500 w-6">{num}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-black mb-2" style={{ fontFamily: 'monospace' }}>
                Optimization Tips:
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>Cache Prefixes:</strong> {PromptEngineeringTips.optimization.cachePrefixes}
                </div>
                <div>
                  <strong>Dynamic Content:</strong> {PromptEngineeringTips.optimization.dynamicContent}
                </div>
                <div>
                  <strong>Token Reuse:</strong> {PromptEngineeringTips.optimization.tokenReuse}
                </div>
                <div>
                  <strong>Cache Keys:</strong> {PromptEngineeringTips.optimization.cacheKeys}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACE Framework Integration */}
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-800 mb-4" style={{ fontFamily: 'monospace' }}>
            🧠 ACE Framework Integration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-purple-700 mb-2" style={{ fontFamily: 'monospace' }}>
                Playbook Context:
              </h4>
              <p className="text-sm text-purple-600">
                {PromptEngineeringTips.aceIntegration.playbookContext}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-700 mb-2" style={{ fontFamily: 'monospace' }}>
                Self-Improvement:
              </h4>
              <p className="text-sm text-purple-600">
                {PromptEngineeringTips.aceIntegration.reflectionPrompts}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
