/**
 * WALT Tool Execution API Route
 *
 * POST /api/walt/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWALTToolIntegration } from '@/lib/walt';
import { getWALTACEIntegration } from '@/lib/walt/ace-integration';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_name, parameters, context } = body;

    if (!tool_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'tool_name is required'
        },
        { status: 400 }
      );
    }

    const integration = getWALTToolIntegration();
    const aceIntegration = getWALTACEIntegration();

    // Create tool call
    const toolCall = {
      tool_name,
      parameters: parameters || {},
      call_id: `call_${Date.now()}`,
      timestamp: Date.now(),
      domain: context?.domain
    };

    // Execute tool
    const result = await integration.executeWALTTool(toolCall, {
      query: context?.query,
      domain: context?.domain,
      user_id: context?.user_id,
      session_id: context?.session_id
    });

    // Learn from execution
    if (result.success && context) {
      await aceIntegration.learnFromSuccess(
        tool_name,
        {
          success: true,
          tool_name,
          parameters: toolCall.parameters,
          result: result.result,
          execution_time_ms: result.execution_time_ms,
          steps_executed: 0
        },
        {
          query: context.query || '',
          domain: context.domain || '',
          why_successful: context.why_successful
        }
      );
    } else if (!result.success && context) {
      await aceIntegration.learnFromFailure(
        tool_name,
        {
          success: false,
          tool_name,
          parameters: toolCall.parameters,
          error: result.error,
          execution_time_ms: result.execution_time_ms,
          steps_executed: 0
        },
        {
          query: context.query || '',
          domain: context.domain || '',
          why_failed: result.error
        }
      );
    }

    return NextResponse.json({
      success: result.success,
      tool_name,
      result: result.result,
      error: result.error,
      execution_time_ms: result.execution_time_ms,
      cost: result.cost,
      cached: result.cached
    });
  } catch (error: any) {
    console.error('❌ Execution API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
