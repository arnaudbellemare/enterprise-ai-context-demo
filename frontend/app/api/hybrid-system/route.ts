/**
 * Hybrid ACE Playbook + PERMUTATION System API
 * Leverages both systems for optimal performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridACEPermutationSystem } from '../../../lib/hybrid-ace-permutation-system';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      domain = 'general', 
      complexity_threshold = 0.6,
      enable_learning = true,
      user_context 
    } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    console.log(`🔄 Hybrid System API: Processing query for ${domain} domain`);
    
    const hybridQuery = {
      query,
      domain,
      complexity_threshold,
      enable_learning,
      user_context
    };
    
    // Execute hybrid system
    const result = await hybridACEPermutationSystem.execute(hybridQuery);
    
    // Get system metrics
    const metrics = hybridACEPermutationSystem.getSystemMetrics();
    
    return NextResponse.json({
      success: true,
      result,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Hybrid System API error:', error);
    return NextResponse.json({
      error: 'Hybrid system failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'metrics') {
      // Get system metrics
      const metrics = hybridACEPermutationSystem.getSystemMetrics();
      return NextResponse.json({ metrics });
    }
    
    if (action === 'test-simple') {
      // Test with simple query (should use ACE Playbook)
      const testResult = await hybridACEPermutationSystem.execute({
        query: 'What is 2+2?',
        domain: 'general',
        complexity_threshold: 0.6,
        enable_learning: true
      });
      
      return NextResponse.json({
        success: true,
        test_type: 'simple_query',
        expected_system: 'ace_playbook',
        result: testResult,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'test-complex') {
      // Test with complex query (should use PERMUTATION)
      const testResult = await hybridACEPermutationSystem.execute({
        query: 'Analyze the current real estate market trends in Austin, Texas, including price appreciation, inventory levels, and investment opportunities for rental properties under $400k. Consider factors like job growth, population migration, and local economic indicators.',
        domain: 'real_estate',
        complexity_threshold: 0.6,
        enable_learning: true
      });
      
      return NextResponse.json({
        success: true,
        test_type: 'complex_query',
        expected_system: 'permutation',
        result: testResult,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'test-hybrid') {
      // Test with medium complexity query (should use hybrid)
      const testResult = await hybridACEPermutationSystem.execute({
        query: 'What is the best investment strategy for a 30-year-old with moderate risk tolerance? Consider both short-term and long-term goals.',
        domain: 'financial',
        complexity_threshold: 0.5,
        enable_learning: true
      });
      
      return NextResponse.json({
        success: true,
        test_type: 'medium_complexity_query',
        expected_system: 'hybrid',
        result: testResult,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      message: 'Hybrid ACE Playbook + PERMUTATION System API',
      endpoints: {
        'POST /api/hybrid-system': 'Execute hybrid system with custom parameters',
        'GET /api/hybrid-system?action=metrics': 'Get system metrics',
        'GET /api/hybrid-system?action=test-simple': 'Test with simple query (ACE Playbook)',
        'GET /api/hybrid-system?action=test-complex': 'Test with complex query (PERMUTATION)',
        'GET /api/hybrid-system?action=test-hybrid': 'Test with medium complexity (Hybrid)'
      },
      parameters: {
        query: 'The question or task to process',
        domain: 'Domain context (financial, real_estate, etc.)',
        complexity_threshold: 'Threshold for system selection (0.0-1.0)',
        enable_learning: 'Whether to learn from this query (true/false)',
        user_context: 'Additional user context (optional)'
      }
    });
    
  } catch (error) {
    console.error('Hybrid System API error:', error);
    return NextResponse.json({
      error: 'Hybrid System API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
