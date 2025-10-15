import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify the API is working
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Simple test endpoint called');
    
    return NextResponse.json({
      message: 'Simple test successful',
      timestamp: new Date().toISOString(),
      test: 'API is working'
    });
    
  } catch (error: any) {
    console.error('❌ Simple test error:', error);
    return NextResponse.json(
      { error: `Simple test failed: ${error.message}` },
      { status: 500 }
    );
  }
}
