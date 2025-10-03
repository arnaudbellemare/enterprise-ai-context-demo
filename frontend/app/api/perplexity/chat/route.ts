import { NextResponse } from 'next/server';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    console.log('Perplexity Chat request:', { messages });

    // Simulate Perplexity AI response
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

    // Mock Perplexity response - in real implementation, this would call Supabase Edge Function
    const systemMessage = messages.find((m: Message) => m.role === 'system');
    const userMessage = messages.find((m: Message) => m.role === 'user');
    
    // Extract just the user's actual query, not the system prompt
    const userQuery = userMessage?.content || 'How can I help you?';
    
    // Generate contextual responses based on the query
    let mockResponse = '';
    
    if (userQuery.toLowerCase().includes('return policy') || userQuery.toLowerCase().includes('refund')) {
      mockResponse = `Thank you for asking about our return policy! 

**Our Return Policy:**
- 30-day return window for most products
- Items must be in original condition with tags
- Free return shipping for orders over $50
- Refunds processed within 3-5 business days

**Next Steps:**
1. Visit our returns portal at returns.yourcompany.com
2. Enter your order number and email
3. Print the prepaid return label
4. Drop off at any authorized location

This response demonstrates how our GEPA-optimized customer service prompt enables more helpful, specific guidance tailored to your needs.`;
    } else if (userQuery.toLowerCase().includes('api') || userQuery.toLowerCase().includes('technical')) {
      mockResponse = `I can help you with technical issues! 

**Common API Solutions:**
- Check your API key configuration
- Verify endpoint URLs and parameters
- Review rate limiting settings
- Test with our API playground

**Troubleshooting Steps:**
1. Check API documentation at docs.yourcompany.com
2. Verify authentication headers
3. Test with curl or Postman
4. Contact technical support if issues persist

**Resources:**
- API Documentation: docs.yourcompany.com
- Status Page: status.yourcompany.com
- Support: tech@yourcompany.com

This specialized response shows how GEPA optimization creates more targeted, actionable technical support.`;
    } else if (userQuery.toLowerCase().includes('social media') || userQuery.toLowerCase().includes('content')) {
      mockResponse = `Great! Let me help you create engaging social media content.

**Content Strategy:**
- Use compelling visuals and clear messaging
- Include relevant hashtags for your industry
- Post at optimal times for your audience
- Engage with comments and mentions

**Content Ideas:**
- Behind-the-scenes company culture
- Product feature highlights
- Customer success stories
- Industry insights and tips

**Best Practices:**
- Keep posts concise and scannable
- Use high-quality images or videos
- Include clear call-to-actions
- Maintain consistent brand voice

This response demonstrates how GEPA optimization creates more specialized, industry-aware content guidance.`;
    } else {
      mockResponse = `I understand you're looking for assistance with: "${userQuery}"

**How I Can Help:**
- Provide specific guidance based on your query
- Offer actionable solutions and next steps
- Connect you with relevant resources
- Ensure you get the most helpful response

**What Makes This Response Special:**
This response is powered by GEPA-optimized prompts that have been specifically tuned for your use case, resulting in more relevant and helpful assistance.

**Next Steps:**
- Let me know if you need more specific information
- I can provide detailed guidance on any topic
- Feel free to ask follow-up questions`;
    }

    return NextResponse.json({
      success: true,
      content: mockResponse,
      sources: [
        'Internal knowledge base',
        'GEPA-optimized response patterns', 
        'Context-aware assistance guidelines'
      ],
      model: 'perplexity-optimized',
      response_time: '1.5s'
    });

  } catch (error) {
    console.error('Perplexity chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
