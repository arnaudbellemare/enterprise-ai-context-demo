#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test workflow scenarios
const testScenarios = [
  {
    name: "Example Workflow Test",
    description: "Test the loaded example workflow with Memory Search → Agent → Generate Answer",
    workflow: {
      nodes: [
        {
          id: 'memorySearch_1',
          type: 'customizable',
          data: {
            label: 'Memory Search',
            description: 'Vector similarity search',
            icon: '🔍',
            apiEndpoint: '/api/search/indexed',
            config: { matchThreshold: 0.8, matchCount: 5, collection: 'test' }
          }
        },
        {
          id: 'customAgent_1', 
          type: 'customizable',
          data: {
            label: 'Custom Agent',
            description: 'Sentiment Analysis',
            icon: '▶',
            apiEndpoint: '/api/agent/chat',
            config: {
              taskDescription: 'Analyze customer sentiment and extract key topics',
              systemPrompt: 'You are an expert sentiment analyzer.',
              temperature: 0.3,
              model: 'claude-3-haiku',
              maxTokens: 1024
            }
          }
        },
        {
          id: 'answer_1',
          type: 'customizable', 
          data: {
            label: 'Generate Answer',
            description: 'Final AI response',
            icon: '✅',
            apiEndpoint: '/api/answer',
            config: { temperature: 0.7, maxTokens: 2048 }
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'memorySearch_1', target: 'customAgent_1', type: 'animated' },
        { id: 'e2', source: 'customAgent_1', target: 'answer_1', type: 'animated' }
      ]
    },
    testQuery: "What are the latest trends in AI development?"
  },
  {
    name: "Multi-Source Workflow Test", 
    description: "Test workflow with Memory Search + Web Search → Context Assembly → Agent → Answer",
    workflow: {
      nodes: [
        {
          id: 'memorySearch_2',
          data: {
            label: 'Memory Search',
            apiEndpoint: '/api/search/indexed',
            config: { matchThreshold: 0.7, matchCount: 3, collection: 'research' }
          }
        },
        {
          id: 'webSearch_2',
          data: {
            label: 'Web Search', 
            apiEndpoint: '/api/perplexity/chat',
            config: { recencyFilter: 'week', maxResults: 5 }
          }
        },
        {
          id: 'contextAssembly_2',
          data: {
            label: 'Context Assembly',
            apiEndpoint: '/api/context/assemble', 
            config: { mergeStrategy: 'hybrid', maxResults: 10 }
          }
        },
        {
          id: 'agent_2',
          data: {
            label: 'Custom Agent',
            apiEndpoint: '/api/agent/chat',
            config: {
              taskDescription: 'Synthesize information from multiple sources',
              systemPrompt: 'You are a research synthesis expert.',
              temperature: 0.5,
              model: 'claude-3-sonnet'
            }
          }
        },
        {
          id: 'answer_2',
          data: {
            label: 'Generate Answer',
            apiEndpoint: '/api/answer',
            config: { temperature: 0.7, maxTokens: 1500 }
          }
        }
      ],
      edges: [
        { id: 'e3', source: 'memorySearch_2', target: 'contextAssembly_2' },
        { id: 'e4', source: 'webSearch_2', target: 'contextAssembly_2' },
        { id: 'e5', source: 'contextAssembly_2', target: 'agent_2' },
        { id: 'e6', source: 'agent_2', target: 'answer_2' }
      ]
    },
    testQuery: "How is artificial intelligence being used in healthcare?"
  },
  {
    name: "GEPA Optimization Workflow Test",
    description: "Test workflow with GEPA optimization and LangStruct extraction",
    workflow: {
      nodes: [
        {
          id: 'gepa_3',
          data: {
            label: 'GEPA Optimize',
            apiEndpoint: '/api/gepa/optimize',
            config: { iterations: 2, goal: 'clarity' }
          }
        },
        {
          id: 'langstruct_3', 
          data: {
            label: 'LangStruct',
            apiEndpoint: '/api/langstruct/process',
            config: { useRealLangStruct: true, refine: true }
          }
        },
        {
          id: 'agent_3',
          data: {
            label: 'Custom Agent',
            apiEndpoint: '/api/agent/chat',
            config: {
              taskDescription: 'Process structured data from LangStruct',
              systemPrompt: 'You are a data processing specialist.',
              temperature: 0.2
            }
          }
        }
      ],
      edges: [
        { id: 'e7', source: 'gepa_3', target: 'langstruct_3' },
        { id: 'e8', source: 'langstruct_3', target: 'agent_3' }
      ]
    },
    testQuery: "Extract key insights from this document about machine learning algorithms."
  }
];

async function testAPIEndpoint(endpoint, data) {
  try {
    console.log(`  🔍 Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`  ✅ ${endpoint} - SUCCESS`);
    return { success: true, data: result };
  } catch (error) {
    console.log(`  ❌ ${endpoint} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testWorkflowExecution(workflow, query) {
  console.log(`\n🚀 Testing workflow execution...`);
  console.log(`Query: "${query}"`);
  
  const results = {
    memorySearch: null,
    webSearch: null, 
    contextAssembly: null,
    gepaOptimize: null,
    langstruct: null,
    agent: null,
    answer: null
  };

  // Test Memory Search
  if (workflow.nodes.find(n => n.data.label === 'Memory Search')) {
    results.memorySearch = await testAPIEndpoint('/api/search/indexed', {
      query,
      matchThreshold: 0.8,
      matchCount: 5,
      collection: 'test'
    });
  }

  // Test Web Search  
  if (workflow.nodes.find(n => n.data.label === 'Web Search')) {
    results.webSearch = await testAPIEndpoint('/api/perplexity/chat', {
      messages: [{ role: 'user', content: query }],
      searchRecencyFilter: 'month'
    });
  }

  // Test Context Assembly
  if (workflow.nodes.find(n => n.data.label === 'Context Assembly')) {
    const contextData = [...(results.memorySearch?.data?.documents || []), 
                        ...(results.webSearch?.data?.citations || [])];
    results.contextAssembly = await testAPIEndpoint('/api/context/assemble', {
      documents: contextData,
      mergeStrategy: 'hybrid'
    });
  }

  // Test GEPA Optimization
  if (workflow.nodes.find(n => n.data.label === 'GEPA Optimize')) {
    results.gepaOptimize = await testAPIEndpoint('/api/gepa/optimize', {
      prompt: query,
      context: JSON.stringify(results.contextAssembly?.data || []),
      iterations: 2
    });
  }

  // Test LangStruct
  if (workflow.nodes.find(n => n.data.label === 'LangStruct')) {
    results.langstruct = await testAPIEndpoint('/api/langstruct/process', {
      text: query,
      useRealLangStruct: true
    });
  }

  // Test Custom Agent
  if (workflow.nodes.find(n => n.data.label === 'Custom Agent')) {
    results.agent = await testAPIEndpoint('/api/agent/chat', {
      messages: [{ role: 'user', content: query }],
      taskDescription: 'Analyze and provide insights',
      systemPrompt: 'You are a helpful AI assistant'
    });
  }

  // Test Generate Answer
  if (workflow.nodes.find(n => n.data.label === 'Generate Answer')) {
    const documents = results.contextAssembly?.data?.context || [];
    results.answer = await testAPIEndpoint('/api/answer', {
      query: results.gepaOptimize?.data?.optimizedPrompt || query,
      documents,
      preferredModel: 'claude-3-haiku'
    });
  }

  return results;
}

async function runTests() {
  console.log('🧪 WORKFLOW TESTING SUITE');
  console.log('=' .repeat(50));

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n📋 Test ${i + 1}: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log('-'.repeat(50));

    const results = await testWorkflowExecution(scenario.workflow, scenario.testQuery);
    
    // Summary
    console.log('\n📊 RESULTS SUMMARY:');
    Object.entries(results).forEach(([key, result]) => {
      if (result !== null) {
        console.log(`  ${result.success ? '✅' : '❌'} ${key}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.success && result.data) {
          console.log(`     Response size: ${JSON.stringify(result.data).length} chars`);
        }
      }
    });

    console.log('\n' + '='.repeat(50));
  }

  console.log('\n🎉 Testing completed!');
}

// Wait for server to start, then run tests
setTimeout(() => {
  runTests().catch(console.error);
}, 3000);
