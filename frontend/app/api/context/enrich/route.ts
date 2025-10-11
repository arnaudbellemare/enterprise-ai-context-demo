/**
 * Context Enrichment API - Enhanced context engineering with memory network
 * Enrich agent context with real-time user data and previous interactions
 * NOW WITH ARKTYPE RUNTIME VALIDATION
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContextEnrichRequest, validateRequest, type ContextEnrichRequestType } from '@/lib/validators';

interface ContextSource {
  name: string;
  weight: number;
  enabled: boolean;
}

const CONTEXT_SOURCES: ContextSource[] = [
  { name: 'memory_network', weight: 0.9, enabled: true },
  { name: 'conversation_history', weight: 0.8, enabled: true },
  { name: 'user_preferences', weight: 0.7, enabled: true },
  { name: 'knowledge_graph', weight: 0.85, enabled: true },
  { name: 'real_time_data', weight: 0.6, enabled: true }
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ArkType validation
    const validation = validateRequest<ContextEnrichRequestType>(ContextEnrichRequest, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.error,
          details: validation.details 
        },
        { status: 400 }
      );
    }
    
    const {
      query,
      userId,
      conversationHistory = [],
      userPreferences = {},
      includeSources = ['memory_network', 'conversation_history', 'knowledge_graph']
    } = validation.data as { 
      query: string; 
      userId: string; 
      conversationHistory?: any[]; 
      userPreferences?: any; 
      includeSources?: string[] 
    };

    const startTime = Date.now();
    const enrichedContext: any[] = [];
    const sourcesUsed: string[] = [];

    // 1. Get instant answer context from memory network
    if (includeSources.includes('memory_network')) {
      try {
        const memoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/instant-answer`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              userId,
              includeContext: true
            })
          }
        );

        if (memoryResponse.ok) {
          const memoryData = await memoryResponse.json();
          enrichedContext.push({
            source: 'memory_network',
            weight: 0.9,
            items: memoryData.context || [],
            instant_answer: memoryData.answer,
            confidence: memoryData.confidence,
            metadata: {
              entities_used: memoryData.entities_used,
              relationships_used: memoryData.relationships_used
            }
          });
          sourcesUsed.push('memory_network');
        }
      } catch (error) {
        console.error('Memory network error:', error);
      }
    }

    // 2. Process conversation history
    if (includeSources.includes('conversation_history') && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5); // Last 5 messages
      enrichedContext.push({
        source: 'conversation_history',
        weight: 0.8,
        items: recentHistory.map((msg: any, idx: number) => ({
          content: typeof msg === 'string' ? msg : msg.content,
          role: msg.role || 'user',
          timestamp: msg.timestamp || new Date().toISOString(),
          relevance: 0.9 - (idx * 0.1)
        })),
        metadata: {
          total_messages: conversationHistory.length,
          included_messages: recentHistory.length
        }
      });
      sourcesUsed.push('conversation_history');
    }

    // 3. User preferences context
    if (includeSources.includes('user_preferences') && Object.keys(userPreferences).length > 0) {
      enrichedContext.push({
        source: 'user_preferences',
        weight: 0.7,
        items: Object.entries(userPreferences).map(([key, value]) => ({
          preference: key,
          value: value,
          type: typeof value
        })),
        metadata: {
          preference_count: Object.keys(userPreferences).length
        }
      });
      sourcesUsed.push('user_preferences');
    }

    // 4. Knowledge graph entities and relationships
    if (includeSources.includes('knowledge_graph')) {
      // Extract entities from query
      const entities = extractKeyEntities(query);
      if (entities.length > 0) {
        enrichedContext.push({
          source: 'knowledge_graph',
          weight: 0.85,
          items: entities.map(entity => ({
            entity: entity,
            type: detectEntityType(entity),
            relevance: 0.8
          })),
          metadata: {
            entity_count: entities.length
          }
        });
        sourcesUsed.push('knowledge_graph');
      }
    }

    // 5. Real-time contextual data
    if (includeSources.includes('real_time_data')) {
      enrichedContext.push({
        source: 'real_time_data',
        weight: 0.6,
        items: [
          {
            type: 'timestamp',
            value: new Date().toISOString(),
            context: 'current_time'
          },
          {
            type: 'session',
            value: userId,
            context: 'active_user'
          }
        ],
        metadata: {
          real_time: true
        }
      });
      sourcesUsed.push('real_time_data');
    }

    // Calculate overall context quality
    const totalWeight = enrichedContext.reduce((sum, ctx) => sum + ctx.weight, 0);
    const avgWeight = totalWeight / enrichedContext.length;
    const contextQuality = Math.min(1.0, avgWeight * 1.1);

    // Build structured context for LLM
    const structuredContext = buildStructuredContext(enrichedContext, query);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      enriched_context: enrichedContext,
      structured_context: structuredContext,
      sources_used: sourcesUsed,
      context_quality: contextQuality,
      total_items: enrichedContext.reduce((sum, ctx) => sum + (ctx.items?.length || 0), 0),
      processing_time_ms: processingTime,
      metadata: {
        query_length: query.length,
        sources_requested: includeSources.length,
        sources_delivered: sourcesUsed.length
      }
    });

  } catch (error: any) {
    console.error('Context enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich context' },
      { status: 500 }
    );
  }
}

function extractKeyEntities(text: string): string[] {
  const entities: string[] = [];
  
  // Extract capitalized phrases (potential named entities)
  const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = text.match(namePattern);
  if (matches) {
    entities.push(...matches.filter(m => m.length > 2 && !['The', 'This', 'That'].includes(m)));
  }
  
  // Extract technical terms
  const techTerms = ['AI', 'ML', 'API', 'LLM', 'RAG', 'GPT', 'GEPA', 'workflow', 'optimization'];
  for (const term of techTerms) {
    if (text.includes(term)) {
      entities.push(term);
    }
  }
  
  return [...new Set(entities)]; // Remove duplicates
}

function detectEntityType(entity: string): string {
  const techTerms = ['AI', 'ML', 'API', 'LLM', 'RAG', 'GPT', 'GEPA', 'workflow', 'optimization'];
  if (techTerms.includes(entity)) {
    return 'concept';
  }
  
  if (entity.includes('project') || entity.includes('system')) {
    return 'project';
  }
  
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(entity)) {
    return 'person';
  }
  
  return 'unknown';
}

/**
 * Build structured context following Grok Principle #4
 * Use clear Markdown sections with descriptive headings
 */
function buildStructuredContext(enrichedContext: any[], query: string): string {
  const sections: string[] = [];
  
  // SECTION 1: User Query (always first, highest priority)
  sections.push(`# User Query`);
  sections.push(`${query}\n`);
  sections.push(`---\n`);
  
  // SECTION 2: Instant Context (if available)
  const memoryContext = enrichedContext.find(c => c.source === 'memory_network');
  if (memoryContext?.instant_answer) {
    sections.push(`## Instant Context from Memory Network`);
    sections.push(`> ${memoryContext.instant_answer}\n`);
    sections.push(`*Confidence: ${(memoryContext.metadata?.confidence * 100 || 0).toFixed(0)}% | ` +
                  `Entities: ${memoryContext.metadata?.entities_used || 0} | ` +
                  `Relationships: ${memoryContext.metadata?.relationships_used || 0}*\n`);
  }
  
  // SECTION 3: Referenced Entities (Knowledge Graph)
  const kgContext = enrichedContext.find(c => c.source === 'knowledge_graph');
  if (kgContext && kgContext.items?.length > 0) {
    sections.push(`## Detected Entities`);
    kgContext.items.forEach((item: any) => {
      sections.push(`- **${item.entity}** (${item.type}) - relevance: ${(item.relevance * 100).toFixed(0)}%`);
    });
    sections.push('');
  }
  
  // SECTION 4: Conversation History (recent context)
  const historyContext = enrichedContext.find(c => c.source === 'conversation_history');
  if (historyContext && historyContext.items?.length > 0) {
    sections.push(`## Recent Conversation`);
    historyContext.items.slice(0, 3).forEach((item: any, idx: number) => {
      const role = item.role || 'user';
      const content = typeof item === 'string' ? item : item.content;
      sections.push(`### ${idx + 1}. ${role.toUpperCase()}`);
      sections.push(`${content}\n`);
    });
  }
  
  // SECTION 5: User Preferences (personalization)
  const prefsContext = enrichedContext.find(c => c.source === 'user_preferences');
  if (prefsContext && prefsContext.items?.length > 0) {
    sections.push(`## User Preferences`);
    prefsContext.items.forEach((item: any) => {
      sections.push(`- **${item.preference}**: ${JSON.stringify(item.value)}`);
    });
    sections.push('');
  }
  
  // SECTION 6: Summary Statistics
  sections.push(`## Context Summary`);
  sections.push(`- **Total Sources**: ${enrichedContext.length}`);
  sections.push(`- **Total Items**: ${enrichedContext.reduce((sum, ctx) => sum + (ctx.items?.length || 0), 0)}`);
  sections.push(`- **Sources Used**: ${enrichedContext.map(c => c.source).join(', ')}`);
  sections.push('');
  
  return sections.join('\n');
}

// GET endpoint for available context sources
export async function GET(req: NextRequest) {
  return NextResponse.json({
    available_sources: CONTEXT_SOURCES,
    total_sources: CONTEXT_SOURCES.length,
    enabled_sources: CONTEXT_SOURCES.filter(s => s.enabled).length,
    description: 'Context enrichment API with memory network integration'
  });
}

