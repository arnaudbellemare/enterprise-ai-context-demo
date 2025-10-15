#!/usr/bin/env node

/**
 * 🧪 Simple API Test
 * 
 * Tests if the multi-domain evolution endpoint is accessible
 */

console.log('\n🧪 ===============================================');
console.log('🧪 SIMPLE API TEST');
console.log('🧪 ===============================================\n');

async function testAPI() {
  try {
    console.log('🚀 Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/benchmark/multi-domain-evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Response keys:', Object.keys(data));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the dev server is running:');
    console.log('   cd frontend && npm run dev');
  }
}

testAPI();
