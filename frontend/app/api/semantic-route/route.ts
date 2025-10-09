import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * SEMANTIC ROUTING API
 * Uses vector embeddings for instant, FREE agent routing
 * 
 * Benefits over keyword/LLM routing:
 * - Instant (no LLM call needed)
 * - FREE (pre-computed embeddings)
 * - Semantic understanding (handles paraphrasing, synonyms)
 * - More accurate than keywords
 */

// Initialize Supabase
let supabase: any = null;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
} catch (error) {
  console.error('❌ Supabase initialization failed:', error);
}

/**
 * POST: Route query using semantic similarity
 */
export async function POST(req: NextRequest) {
  try {
    const { query, threshold = 0.6, returnCount = 3 } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }
    
    // Generate embedding for query
    const embeddingResponse = await fetch('http://localhost:3000/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });
    
    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }
    
    const { embedding } = await embeddingResponse.json();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured - semantic routing unavailable' },
        { status: 503 }
      );
    }
    
    // Find matching agents using vector similarity
    const { data: matches, error } = await supabase.rpc('match_agents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: returnCount
    });
    
    if (error) throw error;
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No matching agents found',
        fallbackToLLM: true
      });
    }
    
    // Return best match
    const bestMatch = matches[0];
    
    return NextResponse.json({
      success: true,
      routing: {
        method: 'semantic',
        confidence: bestMatch.similarity > 0.8 ? 'high' : 
                   bestMatch.similarity > 0.6 ? 'medium' : 'low',
        similarity: bestMatch.similarity
      },
      selectedAgent: {
        key: bestMatch.agent_key,
        name: bestMatch.agent_name,
        capabilities: bestMatch.capabilities,
        modelPreference: bestMatch.model_preference,
        estimatedCost: bestMatch.estimated_cost
      },
      alternatives: matches.slice(1).map((m: any) => ({
        key: m.agent_key,
        name: m.agent_name,
        similarity: m.similarity
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Semantic routing error:', error);
    return NextResponse.json(
      { 
        error: 'Semantic routing failed',
        details: error.message,
        fallbackToLLM: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Initialize/update agent embeddings
 * Pre-computes embeddings for all agents in AGENT_REGISTRY
 */
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }
    
    // Import AGENT_REGISTRY (would need to export it from agents/route.ts)
    // For now, return status
    return NextResponse.json({
      success: true,
      message: 'Use POST /api/semantic-route/initialize to compute agent embeddings',
      status: 'ready'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

