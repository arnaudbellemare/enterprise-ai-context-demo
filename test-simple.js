#!/usr/bin/env node

const http = require('http');

async function testAPI(endpoint, payload) {
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, parseError: true });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 TESTING WORKFLOW APIS');
  console.log('========================');
  
  const tests = [
    {
      name: 'Agent Chat API',
      endpoint: '/api/agent/chat',
      payload: {
        messages: [{ role: 'user', content: 'Hello, test the workflow!' }],
        taskDescription: 'Test workflow execution',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        model: 'claude-3-haiku',
        maxTokens: 100
      }
    },
    {
      name: 'Answer Generation API',
      endpoint: '/api/answer',
      payload: {
        query: 'What is artificial intelligence?',
        documents: [],
        preferredModel: 'claude-3-haiku',
        temperature: 0.7,
        maxTokens: 100
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`📍 Endpoint: ${test.endpoint}`);
    
    try {
      const result = await testAPI(test.endpoint, test.payload);
      console.log(`📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        console.log('✅ SUCCESS: API responded correctly');
        if (result.data && typeof result.data === 'object') {
          console.log(`📥 Response keys: ${Object.keys(result.data).join(', ')}`);
        }
      } else {
        console.log(`❌ FAILED: Status ${result.statusCode}`);
        console.log(`📥 Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  console.log('\n🎉 Testing completed!');
  console.log('🔗 Visit http://localhost:3000/workflow to test the visual workflow builder');
}

runTests().catch(console.error);
