// Simple test to check if the enhanced API is working
const testAPI = async () => {
  console.log('🚀 Testing Enhanced PERMUTATION API...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('📡 Testing server connection...');
    const response = await fetch('http://localhost:3008/api/enhanced-permutation', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ Server is running and API endpoint exists!');
      const data = await response.json();
      console.log('📊 System Stats:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Server responded with status:', response.status);
    }
    
    // Test 2: Test POST endpoint
    console.log('\n🎯 Testing POST endpoint...');
    const postResponse = await fetch('http://localhost:3008/api/enhanced-permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "Calculate 15% of $2,500",
        domain: "general",
        requirements: {
          use_tools: true,
          use_memory: false,
          use_vector_search: false
        }
      })
    });
    
    if (postResponse.ok) {
      console.log('✅ POST endpoint working!');
      const result = await postResponse.json();
      console.log('🎯 Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ POST failed with status:', postResponse.status);
      const error = await postResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('💡 Make sure the server is running on port 3008');
  }
};

testAPI();
