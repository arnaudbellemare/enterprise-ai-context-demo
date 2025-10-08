#!/usr/bin/env node

const http = require('http');

// Test workflow execution scenarios
const testScenarios = [
  {
    name: "Example Workflow - Memory Search → Agent → Answer",
    description: "Tests the basic workflow: search memory, analyze with agent, generate final answer",
    steps: [
      {
        step: 1,
        name: "Memory Search",
        endpoint: "/api/search/indexed",
        payload: {
          query: "What are the latest trends in AI development?",
          matchThreshold: 0.8,
          matchCount: 5,
          collection: "test"
        },
        expectedResult: "documents array or empty array"
      },
      {
        step: 2,
        name: "Custom Agent Analysis", 
        endpoint: "/api/agent/chat",
        payload: {
          messages: [
            {
              role: "user",
              content: "What are the latest trends in AI development?"
            }
          ],
          taskDescription: "Analyze customer sentiment and extract key topics",
          systemPrompt: "You are an expert sentiment analyzer. Analyze the provided text and return sentiment (positive/negative/neutral) and key topics.",
          temperature: 0.3,
          model: "claude-3-haiku",
          maxTokens: 1024
        },
        expectedResult: "AI response with sentiment analysis"
      },
      {
        step: 3,
        name: "Generate Final Answer",
        endpoint: "/api/answer",
        payload: {
          query: "What are the latest trends in AI development?",
          documents: [],
          preferredModel: "claude-3-haiku",
          temperature: 0.7,
          maxTokens: 2048
        },
        expectedResult: "Final comprehensive answer"
      }
    ]
  },
  {
    name: "Multi-Source Workflow - Memory + Web → Context → Agent → Answer",
    description: "Tests complex workflow with multiple data sources",
    steps: [
      {
        step: 1,
        name: "Memory Search",
        endpoint: "/api/search/indexed",
        payload: {
          query: "How is AI being used in healthcare?",
          matchThreshold: 0.7,
          matchCount: 3,
          collection: "research"
        }
      },
      {
        step: 2,
        name: "Web Search (Perplexity)",
        endpoint: "/api/perplexity/chat", 
        payload: {
          messages: [
            {
              role: "user",
              content: "How is AI being used in healthcare?"
            }
          ],
          searchRecencyFilter: "week"
        }
      },
      {
        step: 3,
        name: "Context Assembly",
        endpoint: "/api/context/assemble",
        payload: {
          documents: [
            {
              content: "AI is transforming healthcare with diagnostic tools.",
              source: "Memory Search",
              relevance: 0.9
            },
            {
              content: "Recent studies show AI improving patient outcomes.",
              source: "Web Search", 
              relevance: 0.8
            }
          ],
          mergeStrategy: "hybrid",
          maxResults: 10
        }
      },
      {
        step: 4,
        name: "Custom Agent Synthesis",
        endpoint: "/api/agent/chat",
        payload: {
          messages: [
            {
              role: "user",
              content: "Synthesize information about AI in healthcare"
            }
          ],
          taskDescription: "Synthesize information from multiple sources",
          systemPrompt: "You are a research synthesis expert.",
          temperature: 0.5,
          model: "claude-3-sonnet"
        }
      },
      {
        step: 5,
        name: "Generate Answer",
        endpoint: "/api/answer",
        payload: {
          query: "How is AI being used in healthcare?",
          documents: [],
          preferredModel: "claude-3-haiku",
          temperature: 0.7,
          maxTokens: 1500
        }
      }
    ]
  },
  {
    name: "GEPA Optimization Workflow",
    description: "Tests workflow with prompt optimization",
    steps: [
      {
        step: 1,
        name: "GEPA Optimization",
        endpoint: "/api/gepa/optimize",
        payload: {
          prompt: "Explain quantum computing",
          context: "The user is interested in understanding quantum computing basics for a business audience.",
          iterations: 2,
          goal: "clarity"
        }
      },
      {
        step: 2,
        name: "LangStruct Processing",
        endpoint: "/api/langstruct/process",
        payload: {
          text: "Explain quantum computing",
          useRealLangStruct: true,
          refine: true
        }
      },
      {
        step: 3,
        name: "Custom Agent Processing",
        endpoint: "/api/agent/chat",
        payload: {
          messages: [
            {
              role: "user",
              content: "Process structured data about quantum computing"
            }
          ],
          taskDescription: "Process structured data from LangStruct",
          systemPrompt: "You are a data processing specialist.",
          temperature: 0.2
        }
      }
    ]
  }
];

function makeRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
            rawData: data
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testWorkflowScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const step of scenario.steps) {
    console.log(`\n📋 Step ${step.step}: ${step.name}`);
    console.log(`🔗 Endpoint: ${step.endpoint}`);
    console.log(`📤 Payload: ${JSON.stringify(step.payload, null, 2)}`);
    
    try {
      const result = await makeRequest(step.endpoint, step.payload);
      
      console.log(`📊 Status: ${result.statusCode}`);
      console.log(`📥 Response: ${JSON.stringify(result.data, null, 2)}`);
      
      if (result.statusCode === 200 && result.data) {
        console.log(`✅ SUCCESS: ${step.name} completed successfully`);
        results.push({
          step: step.step,
          name: step.name,
          success: true,
          result: result.data
        });
      } else {
        console.log(`❌ FAILED: ${step.name} returned status ${result.statusCode}`);
        results.push({
          step: step.step,
          name: step.name,
          success: false,
          error: `Status ${result.statusCode}`,
          result: result.data
        });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${step.name} failed with error: ${error.message}`);
      results.push({
        step: step.step,
        name: step.name,
        success: false,
        error: error.message
      });
    }
    
    console.log('-'.repeat(40));
  }
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📊 SUMMARY for ${scenario.name}:`);
  console.log(`✅ Successful steps: ${successCount}/${totalCount}`);
  console.log(`❌ Failed steps: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log(`🎉 ALL TESTS PASSED for ${scenario.name}!`);
  } else {
    console.log(`⚠️  Some tests failed for ${scenario.name}`);
  }
  
  return results;
}

async function runAllTests() {
  console.log('🚀 WORKFLOW EXECUTION TESTING SUITE');
  console.log('=====================================');
  console.log('Testing real API endpoints with actual workflow scenarios');
  console.log('This simulates what happens when you click "Execute" in the workflow builder');
  
  const allResults = [];
  
  for (const scenario of testScenarios) {
    const scenarioResults = await testWorkflowScenario(scenario);
    allResults.push({
      scenario: scenario.name,
      results: scenarioResults
    });
    
    console.log('\n' + '='.repeat(80));
  }
  
  // Final summary
  console.log('\n🎯 FINAL SUMMARY');
  console.log('================');
  
  let totalSteps = 0;
  let totalSuccess = 0;
  
  allResults.forEach(({ scenario, results }) => {
    const successCount = results.filter(r => r.success).length;
    totalSteps += results.length;
    totalSuccess += successCount;
    
    console.log(`${successCount}/${results.length} ✅ ${scenario}`);
  });
  
  console.log(`\n📈 OVERALL: ${totalSuccess}/${totalSteps} steps successful`);
  
  if (totalSuccess === totalSteps) {
    console.log('🎉 ALL WORKFLOW TESTS PASSED! The workflow builder is working perfectly!');
  } else {
    console.log(`⚠️  ${totalSteps - totalSuccess} workflow steps failed. Check the API implementations.`);
  }
  
  console.log('\n🔗 Next steps:');
  console.log('1. Visit http://localhost:3000/workflow');
  console.log('2. Click "Load Example" to see the pre-built workflow');
  console.log('3. Click "Execute" to run the workflow');
  console.log('4. Watch the execution log for real-time results');
}

// Run tests
runAllTests().catch(console.error);
