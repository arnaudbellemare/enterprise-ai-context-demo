/**
 * WALT Tool Discovery API Route
 *
 * POST /api/walt/discover
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryOrchestrator } from '@/lib/walt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, url, goal, force } = body;

    const orchestrator = getDiscoveryOrchestrator();

    // Discover by domain
    if (domain) {
      const tools = await orchestrator.discoverForDomain(domain, {
        force,
        maxToolsPerSite: body.maxTools || 10
      });

      return NextResponse.json({
        success: true,
        domain,
        tools_discovered: tools.length,
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          domain: tool.domain,
          cost: tool.cost,
          latency_ms: tool.latency_ms
        }))
      });
    }

    // Discover by URL
    if (url) {
      const result = await orchestrator.discoverWithGoal(url, goal || '', domain);

      return NextResponse.json({
        success: true,
        url,
        goal,
        tools_discovered: result.length,
        tools: result.map(tool => ({
          name: tool.name,
          description: tool.description,
          domain: tool.domain,
          cost: tool.cost,
          latency_ms: tool.latency_ms
        }))
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Either domain or url must be provided'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Discovery API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const orchestrator = getDiscoveryOrchestrator();
    const stats = orchestrator.getStats();

    return NextResponse.json({
      success: true,
      stats,
      cache_size: orchestrator.getCacheSize()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
