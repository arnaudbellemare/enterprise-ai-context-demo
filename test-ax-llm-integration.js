/**
 * Test Ax LLM Integration with Perplexity + Ollama Fallback
 * 
 * Tests the real Ax LLM integration with Perplexity as primary
 * and Ollama Gemma3:4b as fallback (no mocks!)
 */

const testAxLLMIntegration = async () => {
  console.log('🧪 Testing Ax LLM Integration...\n');

  const testCases = [
    {
      name: 'Simple Query Test',
      query: 'What is artificial intelligence?',
      expectedResponse: 'AI response'
    },
    {
      name: 'Complex Legal Query',
      query: 'Analyze the legal implications of data privacy regulations in the EU',
      expectedResponse: 'Legal analysis'
    },
    {
      name: 'Manufacturing Optimization',
      query: 'How can we optimize production efficiency in automotive manufacturing?',
      expectedResponse: 'Manufacturing insights'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`Query: ${testCase.query}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/simple-brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: testCase.query,
          domain: 'general'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Response received (${data.response?.length || 0} chars)`);
      console.log(`📊 Processing time: ${data.processingTime || 'N/A'}ms`);
      console.log(`🧠 Model used: ${data.modelUsed || 'N/A'}`);
      
      if (data.response && data.response.length > 50) {
        console.log(`📝 Preview: ${data.response.substring(0, 100)}...`);
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n🎯 Testing Ax LLM Direct Integration...');
  
  try {
    // Test the Ax LLM integration directly
    const response = await fetch('http://localhost:3000/api/gepa-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompts: ['Analyze market trends', 'Optimize business processes'],
        objectives: ['accuracy', 'efficiency']
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ax LLM GEPA optimization working');
      console.log(`📊 Optimized prompts: ${data.optimizedPrompts?.length || 0}`);
    } else {
      console.log(`⚠️ GEPA optimization endpoint: HTTP ${response.status}`);
    }

  } catch (error) {
    console.log(`❌ Ax LLM test failed: ${error.message}`);
  }

  console.log('\n🏁 Ax LLM Integration Test Complete!');
};

// Run the test
testAxLLMIntegration().catch(console.error);








