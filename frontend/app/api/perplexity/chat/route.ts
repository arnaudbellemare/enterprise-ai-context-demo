import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    console.log('Perplexity Chat request:', messages);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userMessage = messages.find((m: any) => m.role === 'user');
    const userQuery = userMessage?.content || 'How can I help you?';
    
    let mockResponse = '';
    
    if (userQuery.toLowerCase().includes('return policy') || userQuery.toLowerCase().includes('refund')) {
      mockResponse = `**CUSTOMER SERVICE RESPONSE (GEPA-OPTIMIZED)**

Thank you for asking about our return policy! 

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

**GEPA Optimization Impact:**
This response demonstrates how GEPA-optimized customer service prompts enable more helpful, specific guidance tailored to your business needs. The prompt has been evolved to understand your company's specific policies and procedures.`;
    } else if (userQuery.toLowerCase().includes('api') || userQuery.toLowerCase().includes('technical')) {
      mockResponse = `**TECHNICAL SUPPORT RESPONSE (GEPA-OPTIMIZED)**

I can help you with technical issues! 

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

**GEPA Optimization Impact:**
This specialized response shows how GEPA optimization creates more targeted, actionable technical support by understanding your specific technical infrastructure and common issues.`;
    } else if (userQuery.toLowerCase().includes('social media') || userQuery.toLowerCase().includes('content')) {
      mockResponse = `**CONTENT CREATION RESPONSE (GEPA-OPTIMIZED)**

Perfect! Let me help you create engaging social media content for your brand.

**Content Strategy for Your Brand:**
- **Brand Voice**: Professional yet approachable, emphasizing innovation and reliability
- **Target Audience**: Tech-savvy professionals and decision-makers
- **Content Pillars**: Industry insights, product features, customer success stories, thought leadership

**Content Ideas for Your Next Post:**
- **Behind-the-scenes**: "How our AI optimization engine processes 1M+ queries daily"
- **Customer spotlight**: "How [Company] reduced support tickets by 40% with our GEPA-optimized AI"
- **Industry insight**: "Why context engineering is the future of enterprise AI"
- **Product feature**: "Introducing our new GEPA optimization dashboard"

**Best Practices for Your Industry:**
- Use data-driven headlines that highlight ROI
- Include relevant hashtags: #EnterpriseAI #ContextEngineering #GEPA
- Post during business hours (9 AM - 5 PM EST)
- Include clear call-to-actions for demos or trials

**GEPA Optimization Impact:**
This response is powered by GEPA-optimized prompts that understand your specific brand voice, target audience, and industry context. The AI has been trained on your company's content guidelines and successful posts.`;
    } else {
      mockResponse = `**GENERIC RESPONSE (NOT GEPA-OPTIMIZED)**

I understand you're looking for assistance with: "${userQuery}"

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
      response: mockResponse,
      sources: [
        'Company knowledge base',
        'GEPA-optimized response patterns', 
        'Industry-specific guidelines',
        'Brand voice training data'
      ],
      model: 'gepa-optimized-enterprise',
      response_time: '1.0s'
    });

  } catch (error) {
    console.error('Perplexity chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
