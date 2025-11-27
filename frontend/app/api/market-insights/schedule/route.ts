/**
 * Market Insights Scheduler API Route
 * 
 * Manages scheduled market insights generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketInsightsScheduler } from '@/lib/market-insights/market-insights-scheduler';
import type { ScheduleConfig } from '@/lib/market-insights/market-insights-scheduler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'add':
        const config: ScheduleConfig = {
          category: body.category,
          frequency: body.frequency || 'weekly',
          time: body.time,
          enabled: body.enabled !== false,
        };
        const id = marketInsightsScheduler.addSchedule(config);
        return NextResponse.json({
          success: true,
          scheduleId: id,
          message: 'Schedule added successfully',
        });

      case 'remove':
        const removed = marketInsightsScheduler.removeSchedule(body.scheduleId);
        return NextResponse.json({
          success: removed,
          message: removed ? 'Schedule removed' : 'Schedule not found',
        });

      case 'generate':
        const results = await marketInsightsScheduler.generateDueReports();
        return NextResponse.json({
          success: true,
          generated: results.length,
          results,
        });

      case 'toggle':
        const toggled = marketInsightsScheduler.setScheduleEnabled(
          body.scheduleId,
          body.enabled
        );
        return NextResponse.json({
          success: toggled,
          message: toggled ? 'Schedule updated' : 'Schedule not found',
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be: add, remove, generate, toggle',
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const schedules = marketInsightsScheduler.getAllSchedules();

  return NextResponse.json({
    success: true,
    schedules,
    count: schedules.length,
  });
}







