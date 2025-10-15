import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced PERMUTATION API Endpoint
 * 
 * Tests the complete enhanced system with:
 * - Qdrant Vector Database
 * - Tool Calling System
 * - Mem0 Core Memory Management
 * - Ax LLM Orchestrator
 * - All PERMUTATION components
 */

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  console.log('\n🚀 ===============================================');
  console.log('🚀 ENHANCED PERMUTATION SYSTEM TEST');
  console.log('🚀 ===============================================\n');

  try {
    // Dynamically import to avoid SSR issues
    const { getEnhancedPermutationEngine } = await import('@/lib/enhanced-permutation-engine');

    const enhancedEngine = getEnhancedPermutationEngine();
    
    // Parse request body
    const body = await req.json();
    const { query, domain, requirements } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Testing Enhanced PERMUTATION with query: "${query}"`);
    console.log(`📋 Domain: ${domain || 'auto-detect'}`);
    console.log(`⚙️ Requirements:`, requirements || 'default');

    // Execute enhanced query
    const result = await enhancedEngine.execute({
      query,
      domain,
      requirements: {
        use_tools: true,
        use_memory: true,
        use_vector_search: true,
        max_latency_ms: 30000,
        max_cost: 0.1,
        min_quality_score: 80,
        ...requirements
      }
    });

    const totalTime = Date.now() - startTime;

    console.log('\n\n🎯 ===============================================');
    console.log('🎯 ENHANCED PERMUTATION RESULTS');
    console.log('🎯 ===============================================');
    console.log(`\n📊 Performance Metrics:`);
    console.log(`   Total Duration: ${result.metadata.duration_ms}ms`);
    console.log(`   Quality Score: ${result.metadata.quality_score}%`);
    console.log(`   Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`   Total Cost: $${result.metadata.cost.toFixed(4)}`);
    console.log(`\n🔧 Components Used:`);
    console.log(`   ${result.metadata.components_used.join(', ')}`);
    console.log(`\n🛠️ Tools Executed:`);
    console.log(`   ${result.metadata.tools_executed.join(', ') || 'None'}`);
    console.log(`\n🧠 Memory & Search:`);
    console.log(`   Memories Retrieved: ${result.metadata.memories_retrieved}`);
    console.log(`   Vector Search Results: ${result.metadata.vector_search_results}`);
    console.log(`\n🤖 Model Used: ${result.metadata.model_used}`);
    console.log(`\n📝 Answer Length: ${result.answer.length} characters`);
    console.log(`\n⏱️ API Response Time: ${totalTime}ms`);
    console.log('🎯 ===============================================\n');

    return NextResponse.json({
      success: true,
      result,
      api_metrics: {
        response_time_ms: totalTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Enhanced PERMUTATION test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Enhanced PERMUTATION test failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Dynamically import to avoid SSR issues
    const { getEnhancedPermutationEngine } = await import('@/lib/enhanced-permutation-engine');

    const enhancedEngine = getEnhancedPermutationEngine();
    
    // Get system statistics
    const stats = await enhancedEngine.getSystemStats();

    console.log('\n📊 ===============================================');
    console.log('📊 ENHANCED PERMUTATION SYSTEM STATS');
    console.log('📊 ===============================================');
    console.log(`\n🔍 Qdrant Vector DB:`);
    console.log(`   Total Documents: ${stats.qdrant.total_documents}`);
    console.log(`   BM25 Index Size: ${stats.qdrant.bm25_index_size}`);
    console.log(`\n🔧 Tool Calling System:`);
    console.log(`   Total Tools: ${stats.tools.total_tools}`);
    console.log(`   Total Executions: ${stats.tools.total_executions}`);
    console.log(`   Success Rate: ${stats.tools.success_rate.toFixed(1)}%`);
    console.log(`   Cache Hit Rate: ${stats.tools.cache_hit_rate.toFixed(1)}%`);
    console.log(`\n🧠 Mem0 Core System:`);
    console.log(`   Total Memories: ${stats.mem0.total_memories}`);
    console.log(`   By Type: ${JSON.stringify(stats.mem0.by_type)}`);
    console.log(`   By Domain: ${JSON.stringify(stats.mem0.by_domain)}`);
    console.log(`\n🎯 Ax LLM Orchestrator:`);
    console.log(`   Total Requests: ${stats.ax_llm.total_requests}`);
    console.log(`   Successful Requests: ${stats.ax_llm.successful_requests}`);
    console.log(`   Average Latency: ${stats.ax_llm.avg_latency_ms.toFixed(0)}ms`);
    console.log(`   Total Cost: $${stats.ax_llm.total_cost.toFixed(4)}`);
    console.log('📊 ===============================================\n');

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Failed to get system stats:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get system stats', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
