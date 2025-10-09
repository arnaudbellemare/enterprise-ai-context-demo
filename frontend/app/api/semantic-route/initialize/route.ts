import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Agent Embeddings for Semantic Routing
 * Pre-computes embeddings for all agents (run once, then routing is FREE + instant)
 */

// Agent Registry (copy from agents/route.ts for now)
const AGENT_REGISTRY_FOR_EMBEDDING = {
  webSearchAgent: {
    name: 'Web Search Agent',
    capabilities: ['web research', 'real-time data', 'current events', 'up-to-date information'],
    modelPreference: 'perplexity',
    estimatedCost: 0.003
  },
  dspyMarketAgent: {
    name: 'DSPy Market Analyzer',
    capabilities: ['market analysis', 'trend forecasting', 'competitive intelligence', 'self-optimization'],
    modelPreference: 'local',
    estimatedCost: 0
  },
  dspyRealEstateAgent: {
    name: 'DSPy Real Estate Agent',
    capabilities: ['property analysis', 'real estate valuation', 'investment recommendations', 'self-optimization'],
    modelPreference: 'local',
    estimatedCost: 0
  },
  dspyFinancialAgent: {
    name: 'DSPy Financial Analyst',
    capabilities: ['financial analysis', 'ROI calculation', 'risk assessment', 'self-optimization'],
    modelPreference: 'local',
    estimatedCost: 0
  },
  dspyInvestmentReportAgent: {
    name: 'DSPy Investment Report Generator',
    capabilities: ['report generation', 'investment recommendations', 'comprehensive analysis', 'self-optimization'],
    modelPreference: 'local',
    estimatedCost: 0
  },
  dspyDataSynthesizer: {
    name: 'DSPy Data Synthesizer',
    capabilities: ['data synthesis', 'multi-source integration', 'comprehensive analysis', 'self-optimization'],
    modelPreference: 'local',
    estimatedCost: 0
  }
};

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const results = [];
    
    for (const [key, agent] of Object.entries(AGENT_REGISTRY_FOR_EMBEDDING)) {
      // Create text description from capabilities
      const description = agent.capabilities.join(', ');
      
      // Generate embedding
      const embeddingResponse = await fetch('http://localhost:3000/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description })
      });
      
      if (!embeddingResponse.ok) {
        results.push({ agent: key, status: 'failed', error: 'Embedding generation failed' });
        continue;
      }
      
      const { embedding } = await embeddingResponse.json();
      
      // Store in Supabase
      const { error } = await supabase
        .from('agent_embeddings')
        .upsert({
          agent_key: key,
          agent_name: agent.name,
          capabilities: agent.capabilities,
          embedding,
          model_preference: agent.modelPreference,
          estimated_cost: agent.estimatedCost,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        results.push({ agent: key, status: 'failed', error: error.message });
      } else {
        results.push({ agent: key, status: 'success' });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    return NextResponse.json({
      success: true,
      message: `Initialized ${successful} agent embeddings`,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    });
    
  } catch (error: any) {
    console.error('❌ Agent embedding initialization error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

