/**
 * Enhanced ACE Framework API
 * Generator-Reflector-Curator Pattern
 * Inspired by: https://github.com/jmanhype/ace-playbook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedACEFramework } from '../../../../lib/ace-enhanced-framework';

export async function POST(req: NextRequest) {
  try {
    const { query, domain } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('🚀 Enhanced ACE API: Processing query with Generator-Reflector-Curator pattern...');
    
    const enhancedACE = getEnhancedACEFramework();
    const result = await enhancedACE.processQuery(query, domain);

    return NextResponse.json({
      success: true,
      message: 'Enhanced ACE processing complete',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Enhanced ACE API failed:', error);
    return NextResponse.json({
      error: 'Enhanced ACE processing failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const insightType = searchParams.get('insight_type') as 'helpful' | 'harmful' | 'neutral' | null;
    const action = searchParams.get('action') || 'stats';

    console.log(`🔍 Enhanced ACE API: Getting ${action} for domain: ${domain}`);

    const enhancedACE = getEnhancedACEFramework();

    switch (action) {
      case 'insights':
        const insights = await enhancedACE.getInsights(domain || undefined, insightType || undefined);
        return NextResponse.json({
          success: true,
          message: 'Insights retrieved',
          insights,
          count: insights.length,
          timestamp: new Date().toISOString()
        });

      case 'playbook':
        const playbookStats = await enhancedACE.getPlaybookStats(domain || undefined);
        const curatedBullets = await enhancedACE.getCuratedBullets(domain || 'general', 50);
        return NextResponse.json({
          success: true,
          message: 'Playbook data retrieved',
          stats: playbookStats,
          bullets: curatedBullets,
          timestamp: new Date().toISOString()
        });

      case 'stats':
      default:
        const stats = await enhancedACE.getPlaybookStats(domain || undefined);
        const insightsCount = (await enhancedACE.getInsights(domain || undefined)).length;
        return NextResponse.json({
          success: true,
          message: 'Enhanced ACE statistics',
          data: {
            playbook_stats: stats,
            insights_count: insightsCount,
            domain: domain || 'all',
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error: any) {
    console.error('❌ Enhanced ACE API GET failed:', error);
    return NextResponse.json({
      error: 'Failed to retrieve Enhanced ACE data',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
