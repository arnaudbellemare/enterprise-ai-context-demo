import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_query, conversation_history, user_preferences } = await request.json()
    
    // Check if Supabase credentials are available and not placeholder
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      
      // Return mock context when Supabase is not available
      const mockContext = `Mock Context Assembly for: ${user_query}

Based on the provided query and conversation history, here's a consolidated context:

📊 **Query Analysis**: ${user_query}
🔄 **Conversation History**: ${conversation_history?.length || 0} previous messages
⚙️ **User Preferences**: ${JSON.stringify(user_preferences || {})}

💡 **Mock Context**: This would normally assemble context from your Supabase database, including:
- Relevant memories and documents
- Previous conversation context
- User preferences and settings
- Related indexed content

🔧 **To enable real context assembly**: Configure your Supabase credentials in .env.local

📋 **Consolidated Information**: ${user_query} - Ready for analysis by AI agents.`

      return NextResponse.json({
        success: true,
        context: mockContext,
        sources: ['mock-context-assembly'],
        metadata: {
          type: 'mock',
          note: 'Using mock context - configure Supabase for real assembly'
        }
      })
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
