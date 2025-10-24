/**
 * Unified Permutation Powerhouse API Route
 * 
 * Powers the entire Permutation AI workflow with:
 * 1. Open Source API Data (free, public APIs)
 * 2. Perplexity Research Data (AI-powered real-time research)
 * 
 * Leverages the full Permutation AI stack:
 * - Teacher-Student-Judge
 * - MoE (Mixture of Experts)
 * - ACE (Adaptive Context Enhancement)
 * - GEPA (Genetic-Pareto Prompt Evolution)
 * - DSPy (Declarative Self-improving)
 * - SWiRL (Self-Improving Workflow Reinforcement Learning)
 * - TRM (Tiny Recursive Model)
 * - GraphRAG (Graph Retrieval-Augmented Generation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedDataPowerhouse } from '../../../../lib/unified-data-powerhouse';

export async function POST(request: NextRequest) {
  try {
    const body: { 
      artist: string; 
      medium: string[]; 
      year: string; 
      itemType?: string;
    } = await request.json();
    
    console.log('🚀 Unified Permutation Powerhouse starting...', {
      artist: body.artist,
      medium: body.medium,
      year: body.year,
      itemType: body.itemType || 'art'
    });

    // Power the entire Permutation AI workflow with unified data
    const result = await unifiedDataPowerhouse.powerPermutationWorkflow(
      body.artist,
      body.medium,
      body.year,
      body.itemType || 'art'
    );
    
    console.log('✅ Unified Permutation Powerhouse completed', {
      artist: body.artist,
      openSourceDataPoints: result.openSourceData.length,
      perplexityDataPoints: result.perplexityData.length,
      totalDataPoints: result.openSourceData.length + result.perplexityData.length,
      finalValuation: result.finalValuation.estimatedValue
    });

    return NextResponse.json({
      success: true,
      data: {
        artist: body.artist,
        medium: body.medium,
        year: body.year,
        itemType: body.itemType || 'art',
        dataSources: {
          openSource: {
            dataPoints: result.openSourceData.length,
            sources: result.openSourceData.map(item => item.source),
            confidence: result.openSourceData.length * 0.1
          },
          perplexity: {
            dataPoints: result.perplexityData.length,
            sources: result.perplexityData.map(item => item.auctionHouse),
            confidence: result.perplexityData.length * 0.2
          },
          combined: {
            totalDataPoints: result.openSourceData.length + result.perplexityData.length,
            combinedConfidence: result.combinedAnalysis.confidence
          }
        },
        analysis: result.combinedAnalysis,
        permutationAI: result.permutationAI,
        finalValuation: result.finalValuation,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Unified Permutation Powerhouse failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Unified Permutation Powerhouse failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
