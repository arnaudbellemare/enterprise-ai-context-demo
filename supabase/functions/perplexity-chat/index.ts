/**
 * Perplexity Chat Edge Function
 * Heavy AI processing with Perplexity API in Supabase
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, model = 'llama-3.1-sonar-large-128k-online' } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call Perplexity API
    const perplexity_response = await callPerplexityAPI(messages, model)

    // Store conversation in database
    const { error } = await supabaseClient
      .from('context_items')
      .insert({
        content: JSON.stringify(messages),
        source: 'perplexity_chat',
        relevance_score: 1.0,
        metadata: {
          model: model,
          response: perplexity_response
        }
      })

    if (error) {
      console.error('Database error:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: perplexity_response.choices[0].message.content,
        sources: perplexity_response.citations || [],
        model: perplexity_response.model,
        usage: perplexity_response.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function callPerplexityAPI(messages: any[], model: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    })
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`)
  }

  return await response.json()
}
