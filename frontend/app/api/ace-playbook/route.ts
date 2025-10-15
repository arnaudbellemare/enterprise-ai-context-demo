/**
 * ACE Playbook API Endpoint
 * Tests the complete Generator-Reflector-Curator pattern with GEPA optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { acePlaybookSystem } from '../../../lib/ace-playbook-system';
import { gepaAlgorithms } from '../../../lib/gepa-algorithms';

export async function POST(request: NextRequest) {
  try {
    const { query, domain = 'general', enableGEPA = false } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    console.log(`🚀 ACE Playbook API: Processing query for ${domain} domain`);
    
    // Update system configuration
    acePlaybookSystem.updateConfig({
      enableGEPA,
      performanceBudget: {
        maxPlaybookRetrievalMs: 10,
        maxOverheadPercent: 15
      }
    });
    
    // Execute ACE Playbook system
    const result = await acePlaybookSystem.execute(query, domain);
    
    // Get performance metrics
    const metrics = acePlaybookSystem.getPerformanceMetrics();
    
    return NextResponse.json({
      success: true,
      result,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ACE Playbook API error:', error);
    return NextResponse.json({
      error: 'ACE Playbook system failed',
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
      const metrics = acePlaybookSystem.getPerformanceMetrics();
      return NextResponse.json({ metrics });
    }
    
    if (action === 'gepa-metrics') {
      // Get GEPA metrics
      const gepaMetrics = gepaAlgorithms.getGEPAMetrics();
      return NextResponse.json({ gepaMetrics });
    }
    
    if (action === 'test') {
      // Test the system with a simple query
      const testResult = await acePlaybookSystem.execute(
        'What is the best investment strategy for a 30-year-old with moderate risk tolerance?',
        'financial'
      );
      
      return NextResponse.json({
        success: true,
        test_result: testResult,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      message: 'ACE Playbook API',
      endpoints: {
        'POST /api/ace-playbook': 'Execute ACE Playbook system',
        'GET /api/ace-playbook?action=metrics': 'Get system metrics',
        'GET /api/ace-playbook?action=gepa-metrics': 'Get GEPA metrics',
        'GET /api/ace-playbook?action=test': 'Test system with sample query'
      }
    });
    
  } catch (error) {
    console.error('ACE Playbook API error:', error);
    return NextResponse.json({
      error: 'ACE Playbook API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
