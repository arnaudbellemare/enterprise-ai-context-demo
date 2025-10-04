// Test script to verify real AI integration

async function testRealAI() {
  try {
    console.log('🧪 Testing Real AI Integration...');
    
    const response = await fetch('http://localhost:3000/api/perplexity/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What is the best way to optimize inventory turnover?',
        industry: 'retail',
        context: 'You are a specialized retail AI agent that provides expert assistance with inventory optimization.',
        useRealAI: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Real AI Response Received!');
      console.log('📊 Response Data:', {
        success: data.success,
        isRealAI: data.isRealAI,
        model: data.model,
        responseTime: data.response_time,
        sources: data.sources
      });
      console.log('🤖 AI Content Preview:', data.content?.substring(0, 200) + '...');
    } else {
      console.log('❌ API Call Failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

// Wait a bit for the server to start, then test
setTimeout(testRealAI, 5000);
