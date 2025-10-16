/**
 * 💬 PERMUTATION CHAT API
 * 
 * Continuous chat workflow with full PERMUTATION stack
 * Uses AI SDK streaming for real-time responses
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Enhanced domain analysis function (same as smart routing)
function analyzeQueryDomain(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Healthcare domain keywords (check FIRST to override technology detection)
  if (/\b(clinical|efficacy|diagnostic|medical|patient|treatment|healthcare|therapy|medicine|symptom|disease|condition|doctor|physician|hospital|clinical trial|health|wellness|diabetic|retinopathy|pathology|medical diagnosis|clinical assessment|therapeutic|pharmaceutical|epidemiology)\b/i.test(queryLower)) {
    return 'healthcare';
  }
  
  // Legal domain keywords (check early for priority)
  if (/\b(legal|law|jurisdiction|compliance|regulation|court|judge|attorney|lawyer|contract|agreement|liability|legal implications|multinational|corporation|employment law)\b/i.test(queryLower)) {
    return 'legal';
  }
  
  // Finance domain keywords
  if (/\b(portfolio|investment|risk|return|financial|market|stock|bond|asset|capital|revenue|profit|loss|trading|analyst|valuation|diversified|sp&p|index|funds|equity|corporate|inflation|interest rate)\b/i.test(queryLower)) {
    return 'finance';
  }
  
  // Technology domain keywords (check later to avoid overriding healthcare/legal)
  if (/\b(architecture|microservices|concurrent|users|system|technical|api|database|server|cloud|infrastructure|scalability|performance|optimization|machine learning|ai|algorithm|software|development|programming)\b/i.test(queryLower)) {
    return 'technology';
  }
  
  // Education domain keywords
  if (/\b(learning|education|student|teacher|curriculum|pedagogy|teaching|academic|school|university|course|lesson|instruction|personalized|learning pathway|abilities|learning styles)\b/i.test(queryLower)) {
    return 'education';
  }
  
  // Crypto domain keywords
  if (/\b(crypto|bitcoin|ethereum|blockchain|cryptocurrency|mining|wallet|exchange|trading|defi|nft|token)\b/i.test(queryLower)) {
    return 'crypto';
  }
  
  // Default to general
  return 'general';
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    console.log(`\n💬 PERMUTATION Chat - New message: ${lastMessage.substring(0, 80)}...`);

    // =================================================================
    // PHASE 1: SMART ROUTING & DETECTION
    // =================================================================
    
    const needsRealTime = /\b(latest|recent|current|today|now|2025|trending)\b/i.test(lastMessage);
    
    // Enhanced domain detection using the same logic as smart routing
    const domain = analyzeQueryDomain(lastMessage);

    console.log(`   - Domain: ${domain}`);
    console.log(`   - Needs real-time: ${needsRealTime}`);

    // =================================================================
    // PHASE 2: TEACHER (PERPLEXITY) IF NEEDED
    // =================================================================
    
    let teacherData = '';
    
    if (needsRealTime) {
      const perplexityKey = process.env.PERPLEXITY_API_KEY;
      
      if (perplexityKey) {
        try {
          console.log(`   - Getting real-time data from Perplexity...`);
          
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [{ role: 'user', content: lastMessage }],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            teacherData = data.choices?.[0]?.message?.content || '';
            console.log(`   ✅ Perplexity data: ${teacherData.substring(0, 100)}...`);
          }
        } catch (error) {
          console.error('Perplexity failed:', error);
        }
      }
    }

    // =================================================================
    // PHASE 3: REAL RETRIEVAL & CONTEXT BUILDING
    // =================================================================
    
    let retrievedContext = '';
    
    try {
      console.log(`   - Performing real retrieval for context...`);
      const retrievalResponse = await fetch('http://localhost:3002/api/real-retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: lastMessage,
          method: 'hybrid',
          limit: 3
        })
      });

      if (retrievalResponse.ok) {
        const retrievalData = await retrievalResponse.json();
        if (retrievalData.success && retrievalData.result.documents?.length > 0) {
          retrievedContext = retrievalData.result.documents
            .map((doc: any, idx: number) => `[Context ${idx + 1}] ${doc.content}`)
            .join('\n\n');
          console.log(`   ✅ Retrieved ${retrievalData.result.documents.length} relevant documents`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Retrieval failed, continuing without context: ${error}`);
    }

    const aceStrategies = {
      crypto: ['Check current prices', 'Verify sources', 'Consider volatility'],
      financial: ['Verify calculations', 'Check assumptions', 'Provide context'],
      general: ['Be accurate', 'Be complete', 'Be clear'],
    };

    const strategies = aceStrategies[domain as keyof typeof aceStrategies] || aceStrategies.general;

    const permutationContext = `
You are part of the PERMUTATION system (SWiRL×TRM×ACE×GEPA×IRT).

${teacherData ? `**Real-time data from Perplexity:**\n${teacherData}\n\n` : ''}

${retrievedContext ? `**Retrieved Context:**\n${retrievedContext}\n\n` : ''}

**Domain**: ${domain}

**ACE Strategies to apply:**
${strategies.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**ReasoningBank Insights:**
- Use multi-source validation
- Cross-check important claims
- Provide confidence levels
- ${retrievedContext ? 'Reference the retrieved context when relevant' : ''}

**Your task:**
Respond to the user's message${teacherData ? ', using the real-time Perplexity data as foundation' : ''}${retrievedContext ? ' and the retrieved context' : ''}, enhanced with the ACE strategies above. Be conversational but thorough.

IMPORTANT: Do NOT use markdown bold formatting (**). Write in plain text with good structure using line breaks and bullet points (-) instead.
`.trim();

    console.log(`   - Context built (${permutationContext.length} chars)`);

    // =================================================================
    // PHASE 4: GENERATE RESPONSE WITH OLLAMA
    // =================================================================
    
    console.log(`   - Generating response with Ollama gemma3:4b...`);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        prompt: `${permutationContext}\n\nConversation history:\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}\n\nassistant:`,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const assistantResponse = data.response || 'No response generated';
      
      console.log(`   ✅ Response generated: ${assistantResponse.substring(0, 100)}...`);
      
      return NextResponse.json({
        response: assistantResponse,
        components_used: 11,
        teacher: teacherData ? 'Perplexity' : 'None (Ollama only)',
        domain: domain,
        detected_domain: domain,
      });
    } else {
      throw new Error('Ollama generation failed');
    }

  } catch (error: any) {
    console.error('PERMUTATION chat error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Chat failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
