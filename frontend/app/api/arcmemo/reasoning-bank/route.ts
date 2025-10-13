/**
 * ArcMemo ReasoningBank API
 * 
 * Endpoints for ReasoningBank-enhanced memory system
 */

import { NextRequest, NextResponse } from 'next/server';
import ArcMemoReasoningBank, { Experience } from '@/lib/arcmemo-reasoning-bank';

// Global instance (in production, use database persistence)
const reasoningBank = new ArcMemoReasoningBank();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'retrieve':
        return await handleRetrieve(params);
        
      case 'extract':
        return await handleExtract(params);
        
      case 'consolidate':
        return await handleConsolidate(params);
        
      case 'matts_parallel':
        return await handleMaTTSParallel(params);
        
      case 'matts_sequential':
        return await handleMaTTSSequential(params);
        
      case 'stats':
        return await handleStats();
        
      case 'evolution':
        return await handleEvolution();
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('ReasoningBank API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleRetrieve(params: any) {
  const { query, domain, topK = 5 } = params;
  
  const memories = await reasoningBank.retrieveRelevantMemories(
    query,
    domain,
    topK
  );
  
  return NextResponse.json({
    success: true,
    memories,
    count: memories.length
  });
}

async function handleExtract(params: any) {
  const { experience } = params as { experience: Experience };
  
  const memories = await reasoningBank.extractMemoryFromExperience(experience);
  
  return NextResponse.json({
    success: true,
    memories,
    extracted: memories.length
  });
}

async function handleConsolidate(params: any) {
  const { memories } = params;
  
  await reasoningBank.consolidateMemories(memories);
  
  return NextResponse.json({
    success: true,
    consolidated: memories.length
  });
}

async function handleMaTTSParallel(params: any) {
  const { query, domain, k = 3 } = params;
  
  console.log(`🔄 MaTTS Parallel: k=${k}, query="${query}"`);
  
  const result = await reasoningBank.mattsParallelScaling(query, domain, k);
  
  return NextResponse.json({
    success: true,
    method: 'parallel',
    k,
    bestResult: result.bestResult,
    memoriesExtracted: result.newMemories.length,
    trajectories: result.allExperiences.length
  });
}

async function handleMaTTSSequential(params: any) {
  const { query, domain, k = 3 } = params;
  
  console.log(`🔄 MaTTS Sequential: k=${k}, query="${query}"`);
  
  const result = await reasoningBank.mattsSequentialScaling(query, domain, k);
  
  return NextResponse.json({
    success: true,
    method: 'sequential',
    k,
    finalResult: result.finalResult,
    memoriesExtracted: result.newMemories.length,
    refinementSteps: result.allExperiences.length
  });
}

async function handleStats() {
  const stats = reasoningBank.getMemoryStats();
  const allMemories = reasoningBank.getMemoryBank();
  
  return NextResponse.json({
    success: true,
    stats: {
      ...stats,
      recentMemories: allMemories.slice(-5).map(m => ({
        title: m.title,
        domain: m.domain,
        source: m.createdFrom,
        level: m.abstractionLevel
      }))
    }
  });
}

async function handleEvolution() {
  const evolutions = await reasoningBank.trackEmergentEvolution();
  
  return NextResponse.json({
    success: true,
    evolutions,
    count: evolutions.length
  });
}

export async function GET(request: NextRequest) {
  // GET: Return current memory bank stats
  const stats = reasoningBank.getMemoryStats();
  const evolutions = await reasoningBank.trackEmergentEvolution();
  
  return NextResponse.json({
    success: true,
    stats,
    evolutions,
    timestamp: new Date().toISOString()
  });
}

