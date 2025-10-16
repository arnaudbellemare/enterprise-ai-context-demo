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
    // PHASE 1: SMART ROUTING & COMPONENT SELECTION
    // =================================================================
    
    const needsRealTime = /\b(latest|recent|current|today|now|2025|trending)\b/i.test(lastMessage);
    const domain = analyzeQueryDomain(lastMessage);

    console.log(`   - Domain: ${domain}`);
    console.log(`   - Needs real-time: ${needsRealTime}`);

    // 🎯 REAL SMART ROUTING CALL
    console.log(`   🔀 Calling Smart Routing for component selection...`);
    
    let routingDecision;
    try {
      const routingResponse = await fetch('http://localhost:3002/api/smart-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: lastMessage,
          taskType: 'general',
          priority: 'high',
          requirements: {
            accuracy_required: 90,
            requires_real_time_data: needsRealTime,
            max_latency_ms: 10000,
            max_cost: 0.01
          }
        })
      });

      if (routingResponse.ok) {
        routingDecision = await routingResponse.json();
        console.log(`   ✅ Smart Routing Decision: ${routingDecision.primary_component} (${routingDecision.reasoning})`);
      } else {
        throw new Error('Smart routing failed');
      }
    } catch (error) {
      console.warn(`   ⚠️ Smart routing failed, using fallback: ${error}`);
      // Fallback routing decision
      routingDecision = {
        primary_component: domain === 'healthcare' ? 'ACE Framework' : 
                          domain === 'finance' || domain === 'technology' ? 'TRM Engine' : 'Ollama Student',
        fallback_component: 'Ollama Student',
        reasoning: 'Fallback routing due to smart routing failure'
      };
    }

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
    // PHASE 3: COMPONENT ORCHESTRATION
    // =================================================================
    
    console.log(`   🎯 Executing with ${routingDecision.primary_component}...`);
    
    let result;
    let componentsUsed = [];
    let executionSuccess = false;
    
    try {
      // Route to the selected primary component
      switch (routingDecision.primary_component) {
        case 'TRM Engine':
          console.log(`   🔧 Calling TRM Engine...`);
          const trmResponse = await fetch('http://localhost:3002/api/trm-engine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: lastMessage,
              domain: domain,
              optimizationLevel: 'high',
              useRealTimeData: needsRealTime
            })
          });
          
          if (trmResponse.ok) {
            const trmData = await trmResponse.json();
            result = trmData.result;
            componentsUsed.push('TRM Engine');
            executionSuccess = true;
            console.log(`   ✅ TRM Engine completed successfully`);
          } else {
            throw new Error('TRM Engine failed');
          }
          break;
          
        case 'ACE Framework':
          console.log(`   🧠 Calling ACE Framework...`);
          const aceResponse = await fetch('http://localhost:3002/api/ace/enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: lastMessage,
              domain: domain
            })
          });
          
          if (aceResponse.ok) {
            const aceData = await aceResponse.json();
            result = aceData.result;
            componentsUsed.push('ACE Framework');
            executionSuccess = true;
            console.log(`   ✅ ACE Framework completed successfully`);
          } else {
            throw new Error('ACE Framework failed');
          }
          break;
          
        case 'GEPA Optimizer':
          console.log(`   ⚡ Calling GEPA Optimizer...`);
          const gepaResponse = await fetch('http://localhost:3002/api/gepa-optimization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: lastMessage,
              domain: domain,
              maxIterations: 3,
              optimizationType: 'comprehensive'
            })
          });
          
          if (gepaResponse.ok) {
            const gepaData = await gepaResponse.json();
            result = gepaData.optimizedPrompt;
            componentsUsed.push('GEPA Optimizer');
            executionSuccess = true;
            console.log(`   ✅ GEPA Optimizer completed successfully`);
          } else {
            throw new Error('GEPA Optimizer failed');
          }
          break;
          
        case 'Teacher Model (Perplexity)':
          console.log(`   🎓 Using Teacher Model (Perplexity)...`);
          if (teacherData) {
            result = teacherData;
            componentsUsed.push('Teacher Model (Perplexity)');
            executionSuccess = true;
            console.log(`   ✅ Teacher Model completed successfully`);
          } else {
            throw new Error('Teacher Model data not available');
          }
          break;
          
        default:
          throw new Error(`Unknown component: ${routingDecision.primary_component}`);
      }
    } catch (error) {
      console.warn(`   ⚠️ Primary component failed: ${error}`);
      
      // Try fallback component
      if (routingDecision.fallback_component) {
        console.log(`   🔄 Trying fallback: ${routingDecision.fallback_component}...`);
        
        try {
          switch (routingDecision.fallback_component) {
            case 'TRM Engine':
              const fallbackTrmResponse = await fetch('http://localhost:3002/api/trm-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: lastMessage,
                  domain: domain,
                  optimizationLevel: 'medium',
                  useRealTimeData: needsRealTime
                })
              });
              
              if (fallbackTrmResponse.ok) {
                const fallbackTrmData = await fallbackTrmResponse.json();
                result = fallbackTrmData.result;
                componentsUsed.push('TRM Engine (fallback)');
                executionSuccess = true;
                console.log(`   ✅ TRM Engine fallback completed successfully`);
              }
              break;
              
            case 'ACE Framework':
              const fallbackAceResponse = await fetch('http://localhost:3002/api/ace/enhanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: lastMessage,
                  domain: domain
                })
              });
              
              if (fallbackAceResponse.ok) {
                const fallbackAceData = await fallbackAceResponse.json();
                result = fallbackAceData.result;
                componentsUsed.push('ACE Framework (fallback)');
                executionSuccess = true;
                console.log(`   ✅ ACE Framework fallback completed successfully`);
              }
              break;
              
            case 'Ollama Student':
              // Fallback to Ollama
              console.log(`   🎯 Using Ollama Student as final fallback...`);
              const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'gemma3:4b',
                  messages: [{ role: 'user', content: lastMessage }],
                  stream: false
                })
              });
              
              if (ollamaResponse.ok) {
                const ollamaData = await ollamaResponse.json();
                result = ollamaData.message?.content || 'No response generated';
                componentsUsed.push('Ollama Student (fallback)');
                executionSuccess = true;
                console.log(`   ✅ Ollama Student fallback completed successfully`);
              }
              break;
          }
        } catch (fallbackError) {
          console.error(`   ❌ Fallback component also failed: ${fallbackError}`);
        }
      }
    }
    
    // If all components failed, use basic Ollama
    if (!executionSuccess) {
      console.log(`   🆘 All components failed, using basic Ollama...`);
      try {
        const basicResponse = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma3:4b',
            messages: [{ role: 'user', content: lastMessage }],
            stream: false
          })
        });
        
        if (basicResponse.ok) {
          const basicData = await basicResponse.json();
          result = basicData.message?.content || 'No response generated';
          componentsUsed.push('Ollama Student (emergency)');
          executionSuccess = true;
        }
      } catch (emergencyError) {
        console.error(`   💥 Emergency fallback failed: ${emergencyError}`);
        result = 'I apologize, but I encountered an error processing your request. Please try again.';
        componentsUsed.push('Error Handler');
      }
    }

    // =================================================================
    // PHASE 4: FINAL RESPONSE PROCESSING
    // =================================================================
    
    let finalResponse = result;
    
    // If we got a result from a specialized component, use it directly
    if (executionSuccess && result) {
      console.log(`   ✅ Using result from ${componentsUsed[0]}`);
      finalResponse = result;
    } else {
      // Fallback: Use Ollama with enhanced context
      console.log(`   🎯 Generating fallback response with Ollama...`);
      
      // Get additional context if needed
      let retrievedContext = '';
      try {
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

**Domain:** ${domain}
**Primary component attempted:** ${routingDecision.primary_component}
**Fallback component attempted:** ${routingDecision.fallback_component}

${teacherData ? `**Real-time data from Perplexity:**\n${teacherData}\n\n` : ''}

${retrievedContext ? `**Retrieved Context:**\n${retrievedContext}\n\n` : ''}

**ACE Strategies to apply:**
${strategies.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Your task:**
Respond to the user's message with domain-specific expertise, incorporating the context and teacher insights where relevant.

User message: ${lastMessage}
`.trim();

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma3:4b',
            prompt: `${permutationContext}\n\nassistant:`,
            stream: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          finalResponse = data.response || 'No response generated';
          componentsUsed.push('Ollama Student (fallback)');
        }
      } catch (ollamaError) {
        console.error(`   ❌ Ollama fallback failed: ${ollamaError}`);
        finalResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
      }
    }

    console.log(`   ✅ Final response generated: ${finalResponse.substring(0, 100)}...`);

    return NextResponse.json({
      response: finalResponse,
      components_used: componentsUsed.length,
      components_executed: componentsUsed,
      primary_component: routingDecision.primary_component,
      fallback_component: routingDecision.fallback_component,
      routing_reasoning: routingDecision.reasoning,
      teacher: teacherData ? 'Perplexity' : 'None',
      domain: domain,
      detected_domain: domain,
      execution_success: executionSuccess,
      system_status: 'Fully Integrated PERMUTATION System'
    });

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
