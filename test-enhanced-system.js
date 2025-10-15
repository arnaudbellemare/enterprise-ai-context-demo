/**
 * Test Enhanced PERMUTATION System
 * 
 * Tests the complete enhanced system with all new capabilities
 */

const testEnhancedSystem = async () => {
  console.log('🚀 Testing Enhanced PERMUTATION System...\n');

  try {
    // Test 1: System Stats
    console.log('📊 Test 1: Getting System Stats...');
    const statsResponse = await fetch('http://localhost:3007/api/enhanced-permutation', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ System Stats Retrieved:');
      console.log(`   Qdrant Documents: ${stats.stats.qdrant.total_documents}`);
      console.log(`   Tools Available: ${stats.stats.tools.total_tools}`);
      console.log(`   Memories Stored: ${stats.stats.mem0.total_memories}`);
      console.log(`   LLM Requests: ${stats.stats.ax_llm.total_requests}`);
    } else {
      console.log('❌ Failed to get system stats');
    }

    // Test 2: Enhanced Query Execution
    console.log('\n🎯 Test 2: Enhanced Query Execution...');
    const queryResponse = await fetch('http://localhost:3007/api/enhanced-permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "Calculate the ROI on a $500K rental property in Austin with 8% annual return",
        domain: "financial",
        requirements: {
          use_tools: true,
          use_memory: true,
          use_vector_search: true,
          max_latency_ms: 30000,
          max_cost: 0.1
        }
      })
    });

    if (queryResponse.ok) {
      const result = await queryResponse.json();
      console.log('✅ Enhanced Query Executed:');
      console.log(`   Duration: ${result.result.metadata.duration_ms}ms`);
      console.log(`   Quality Score: ${result.result.metadata.quality_score}%`);
      console.log(`   Confidence: ${(result.result.metadata.confidence * 100).toFixed(1)}%`);
      console.log(`   Cost: $${result.result.metadata.cost.toFixed(4)}`);
      console.log(`   Components: ${result.result.metadata.components_used.join(', ')}`);
      console.log(`   Tools: ${result.result.metadata.tools_executed.join(', ') || 'None'}`);
      console.log(`   Memories: ${result.result.metadata.memories_retrieved}`);
      console.log(`   Vector Results: ${result.result.metadata.vector_search_results}`);
      console.log(`   Model: ${result.result.metadata.model_used}`);
      console.log(`   Answer Length: ${result.result.answer.length} chars`);
    } else {
      console.log('❌ Failed to execute enhanced query');
    }

    // Test 3: Tool-Only Query
    console.log('\n🔧 Test 3: Tool-Only Query...');
    const toolResponse = await fetch('http://localhost:3007/api/enhanced-permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "What is 15% of $2,500?",
        domain: "general",
        requirements: {
          use_tools: true,
          use_memory: false,
          use_vector_search: false
        }
      })
    });

    if (toolResponse.ok) {
      const result = await toolResponse.json();
      console.log('✅ Tool Query Executed:');
      console.log(`   Tools Used: ${result.result.metadata.tools_executed.join(', ')}`);
      console.log(`   Duration: ${result.result.metadata.duration_ms}ms`);
      console.log(`   Answer: ${result.result.answer.substring(0, 200)}...`);
    } else {
      console.log('❌ Failed to execute tool query');
    }

    // Test 4: Memory-Only Query
    console.log('\n🧠 Test 4: Memory-Only Query...');
    const memoryResponse = await fetch('http://localhost:3007/api/enhanced-permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "What did we discuss about real estate investments?",
        domain: "financial",
        requirements: {
          use_tools: false,
          use_memory: true,
          use_vector_search: true
        }
      })
    });

    if (memoryResponse.ok) {
      const result = await memoryResponse.json();
      console.log('✅ Memory Query Executed:');
      console.log(`   Memories Retrieved: ${result.result.metadata.memories_retrieved}`);
      console.log(`   Vector Results: ${result.result.metadata.vector_search_results}`);
      console.log(`   Duration: ${result.result.metadata.duration_ms}ms`);
    } else {
      console.log('❌ Failed to execute memory query');
    }

    console.log('\n🎉 Enhanced PERMUTATION System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testEnhancedSystem();
