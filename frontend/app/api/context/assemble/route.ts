import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_query, conversation_history, user_preferences } = await request.json()
    
    // Check if Supabase credentials are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured',
        context: 'No context available - Supabase not configured'
      }, { status: 400 })
    }
    
    // Call Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/assemble-context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_query,
        conversation_history: conversation_history || [],
        user_preferences: user_preferences || {}
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Supabase Edge Function failed: ${response.status}`,
        details: errorText,
        context: 'No context available - Supabase function error'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Context assembly error:', error)
    return NextResponse.json({
      success: false,
      error: 'Context assembly failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      context: 'No context available - Assembly failed'
    }, { status: 500 })
  }
}
