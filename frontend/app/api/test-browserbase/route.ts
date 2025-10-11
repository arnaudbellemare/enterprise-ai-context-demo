import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json();

    // Test Browserbase API connection
    const apiKey = process.env.BROWSERBASE_API_KEY || 'bb_live_T6sBxkEWzTTT-bG7I15sgFk1MmA';
    const projectId = process.env.BROWSERBASE_PROJECT_ID || '4a7f24c2-3889-495a-811b-c68e3837eb08';

    if (!apiKey || !projectId) {
      return NextResponse.json(
        { error: 'Browserbase credentials not configured' },
        { status: 400 }
      );
    }

    // Test API connection by listing projects
    const response = await fetch('https://api.browserbase.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Browserbase API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Verify our project exists
    const ourProject = data.data?.find((project: any) => project.id === projectId);
    
    if (!ourProject) {
      throw new Error('Project not found in Browserbase account');
    }

    return NextResponse.json({
      success: true,
      message: 'Browserbase API connection successful',
      project: {
        id: ourProject.id,
        name: ourProject.name,
        status: ourProject.status
      },
      credentials: {
        apiKey: apiKey.substring(0, 10) + '...',
        projectId: projectId
      }
    });

  } catch (error: any) {
    console.error('Browserbase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      message: 'Browserbase API connection failed - using mock mode'
    }, { status: 200 }); // Return 200 to indicate mock mode is available
  }
}
