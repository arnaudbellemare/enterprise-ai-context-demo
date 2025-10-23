/**
 * WALT Tools Management API Route
 *
 * GET /api/walt/tools - List tools
 * POST /api/walt/tools - Initialize tools
 * DELETE /api/walt/tools - Delete tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWALTStorage, getWALTToolIntegration } from '@/lib/walt';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');

    const storage = getWALTStorage();

    if (search) {
      // Semantic search
      const tools = await storage.searchTools(search, {
        domain: domain ? [domain] : undefined,
        limit
      });

      return NextResponse.json({
        success: true,
        search_query: search,
        tools_found: tools.length,
        tools
      });
    }

    if (domain) {
      // Get tools for domain
      const tools = await storage.getToolsForDomain(domain, limit);

      return NextResponse.json({
        success: true,
        domain,
        tools_found: tools.length,
        tools
      });
    }

    // Get statistics
    const stats = await storage.getStats();
    const integration = getWALTToolIntegration();
    const registeredTools = integration.getRegisteredTools();

    return NextResponse.json({
      success: true,
      stats,
      registered_tools: registeredTools.length,
      registered_tool_names: registeredTools
    });
  } catch (error: any) {
    console.error('❌ Tools API GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, domain, domains, high_priority_only, max_concurrent } = body;

    const integration = getWALTToolIntegration();

    if (action === 'initialize') {
      if (domain) {
        // Initialize single domain
        const count = await integration.initializeForDomain(domain);

        return NextResponse.json({
          success: true,
          action: 'initialize',
          domain,
          tools_registered: count
        });
      }

      if (domains && Array.isArray(domains)) {
        // Initialize multiple domains
        const results: Record<string, number> = {};

        for (const d of domains) {
          results[d] = await integration.initializeForDomain(d);
        }

        const totalRegistered = Object.values(results).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
          success: true,
          action: 'initialize',
          domains,
          results,
          total_tools_registered: totalRegistered
        });
      }

      // Initialize all domains
      const results = await integration.initializeAll({
        highPriorityOnly: high_priority_only,
        maxConcurrent: max_concurrent
      });

      const totalRegistered = Array.from(results.values()).reduce((sum, count) => sum + count, 0);

      return NextResponse.json({
        success: true,
        action: 'initialize',
        results: Object.fromEntries(results),
        total_tools_registered: totalRegistered
      });
    }

    if (action === 'refresh') {
      const count = await integration.refreshTools(domain);

      return NextResponse.json({
        success: true,
        action: 'refresh',
        domain: domain || 'all',
        tools_refreshed: count
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Supported: initialize, refresh'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Tools API POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const toolName = searchParams.get('tool_name');

    if (!toolName) {
      return NextResponse.json(
        {
          success: false,
          error: 'tool_name parameter is required'
        },
        { status: 400 }
      );
    }

    const storage = getWALTStorage();
    await storage.deleteTool(toolName);

    return NextResponse.json({
      success: true,
      action: 'delete',
      tool_name: toolName
    });
  } catch (error: any) {
    console.error('❌ Tools API DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
