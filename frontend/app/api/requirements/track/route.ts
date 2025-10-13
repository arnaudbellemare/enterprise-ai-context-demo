import { NextRequest, NextResponse } from 'next/server';
import { RequirementTracker } from '@/lib/requirement-tracker';

// Singleton tracker instance
const tracker = new RequirementTracker();

/**
 * API endpoint for requirement tracking
 * 
 * POST /api/requirements/track
 * - Creates or updates requirement tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, setId, name, requirements, currentValues } = body;
    
    switch (action) {
      case 'create': {
        if (!name || !requirements) {
          return NextResponse.json(
            { error: 'Missing name or requirements' },
            { status: 400 }
          );
        }
        
        const id = await tracker.createRequirementSet(name, requirements);
        
        return NextResponse.json({ 
          success: true, 
          setId: id,
          message: `Created requirement set: ${name}`
        });
      }
      
      case 'update': {
        if (!setId || !currentValues) {
          return NextResponse.json(
            { error: 'Missing setId or currentValues' },
            { status: 400 }
          );
        }
        
        const result = await tracker.updateRequirements(setId, currentValues);
        
        return NextResponse.json({
          success: true,
          ...result
        });
      }
      
      case 'check': {
        if (!setId) {
          return NextResponse.json(
            { error: 'Missing setId' },
            { status: 400 }
          );
        }
        
        const shouldStop = tracker.shouldStopOptimization(setId);
        const report = tracker.getReport(setId);
        
        return NextResponse.json({
          success: true,
          shouldStop,
          report
        });
      }
      
      case 'export': {
        if (!setId) {
          return NextResponse.json(
            { error: 'Missing setId' },
            { status: 400 }
          );
        }
        
        const reportJson = tracker.exportReport(setId);
        
        return NextResponse.json({
          success: true,
          report: JSON.parse(reportJson)
        });
      }
      
      case 'list': {
        const sets = tracker.listSets();
        
        return NextResponse.json({
          success: true,
          sets
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Requirement tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/requirements/track?setId=xxx
 * - Get requirement report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');
    
    if (!setId) {
      // List all sets
      const sets = tracker.listSets();
      return NextResponse.json({ success: true, sets });
    }
    
    const report = tracker.getReport(setId);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Requirement set not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Requirement tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

