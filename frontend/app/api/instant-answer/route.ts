/**
 * Instant Answer API - Knowledge graph-powered instant answers
 * GET grounded answers from user's memory network
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in production, use Supabase)
interface Entity {
  id: string;
  type: 'person' | 'project' | 'concept' | 'organization' | 'event' | 'document' | 'task';
  name: string;
  properties: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  confidence: number;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: 'works_on' | 'related_to' | 'created_by' | 'mentioned_in' | 'depends_on' | 'collaborates_with' | 'belongs_to';
  strength: number;
  created_at: string;
}

interface MemoryNetwork {
  entities: Map<string, Entity>;
  relationships: Map<string, Relationship>;
  conversations: Array<{
    id: string;
    user_message: string;
    ai_response: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  // Grok Principle #3: Track refinement iterations
  refinements: Array<{
    id: string;
    original_query: string;
    refined_query: string;
    iteration: number;
    improvement: string;
    timestamp: string;
  }>;
}

// Global memory networks per user
const userNetworks = new Map<string, MemoryNetwork>();

function getMemoryNetwork(userId: string): MemoryNetwork {
  if (!userNetworks.has(userId)) {
    userNetworks.set(userId, {
      entities: new Map(),
      relationships: new Map(),
      conversations: [],
      refinements: []  // Track iterative improvements
    });
  }
  return userNetworks.get(userId)!;
}

/**
 * Detect if current query is a refinement of previous query
 * Grok Principle #3: Continually refine based on results
 */
function detectRefinement(
  currentQuery: string,
  previousConversations: any[]
): { isRefinement: boolean; originalQuery?: string; improvement?: string } {
  if (previousConversations.length === 0) {
    return { isRefinement: false };
  }

  const lastConv = previousConversations[previousConversations.length - 1];
  const queryLower = currentQuery.toLowerCase();
  const lastQueryLower = lastConv.user_message.toLowerCase();

  // Refinement indicators
  const refinementKeywords = [
    'previous', 'last', 'instead', 'rather', 'actually', 'better',
    'not', "didn't", "doesn't", 'improve', 'fix', 'change'
  ];

  const hasRefinementKeyword = refinementKeywords.some(keyword => 
    queryLower.includes(keyword)
  );

  // Check if queries share significant words
  const currentWords = new Set(queryLower.split(/\s+/));
  const lastWords = new Set(lastQueryLower.split(/\s+/));
  const overlap = Array.from(currentWords).filter(w => lastWords.has(w)).length;
  const overlapRatio = overlap / Math.min(currentWords.size, lastWords.size);

  const isRefinement = hasRefinementKeyword && overlapRatio > 0.3;

  if (isRefinement) {
    // Detect what improved
    let improvement = 'refined request';
    if (queryLower.includes('instead') || queryLower.includes('rather')) {
      improvement = 'alternative approach specified';
    } else if (queryLower.includes('not') || queryLower.includes("didn't")) {
      improvement = 'constraint added';
    } else if (queryLower.includes('improve') || queryLower.includes('better')) {
      improvement = 'quality improvement requested';
    }

    return {
      isRefinement: true,
      originalQuery: lastConv.user_message,
      improvement
    };
  }

  return { isRefinement: false };
}

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  const words = text.split(/\s+/);
  
  // Detect people (capitalized words that aren't at sentence start)
  const namePatterns = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = namePatterns.exec(text)) !== null) {
    const name = match[1];
    if (name.length > 2 && !['The', 'This', 'That', 'What', 'When', 'Where', 'Why', 'How'].includes(name)) {
      entities.push({
        id: `entity-${Date.now()}-${Math.random()}`,
        type: 'person',
        name: name,
        properties: {},
        metadata: { extracted_from: 'text' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence: 0.7
      });
    }
  }
  
  // Detect projects
  const projectKeywords = ['project', 'initiative', 'campaign', 'program', 'system'];
  for (const keyword of projectKeywords) {
    const regex = new RegExp(`(\\w+\\s+)?${keyword}(\\s+\\w+)?`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        id: `entity-${Date.now()}-${Math.random()}`,
        type: 'project',
        name: match[0].trim(),
        properties: { keyword: keyword },
        metadata: { extracted_from: 'text' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence: 0.8
      });
    }
  }
  
  // Detect concepts
  const conceptKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'optimization', 'workflow', 'automation', 'efficiency', 'analytics',
    'data', 'algorithm', 'model', 'neural network', 'rag', 'llm'
  ];
  
  for (const concept of conceptKeywords) {
    if (text.toLowerCase().includes(concept)) {
      entities.push({
        id: `entity-${Date.now()}-${Math.random()}`,
        type: 'concept',
        name: concept,
        properties: {},
        metadata: { extracted_from: 'text' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confidence: 0.9
      });
    }
  }
  
  return entities;
}

function generateInstantAnswer(
  query: string,
  entities: Entity[],
  relationships: Relationship[],
  conversations: any[],
  network: MemoryNetwork
): string {
  // Build context-aware answer
  const relevantEntities = Array.from(network.entities.values())
    .filter(e => query.toLowerCase().includes(e.name.toLowerCase()))
    .slice(0, 5);
  
  if (relevantEntities.length === 0) {
    return "I don't have enough context from your previous interactions to provide an instant answer. Share more about what you're working on, and I'll build my understanding!";
  }
  
  // Categorize entities
  const people = relevantEntities.filter(e => e.type === 'person');
  const projects = relevantEntities.filter(e => e.type === 'project');
  const concepts = relevantEntities.filter(e => e.type === 'concept');
  
  const answerParts: string[] = [];
  
  // Build answer from known context
  if (people.length > 0) {
    answerParts.push(`I know about ${people.map(p => p.name).join(', ')}`);
  }
  
  if (projects.length > 0) {
    answerParts.push(`working on ${projects.map(p => p.name).join(' and ')}`);
  }
  
  if (concepts.length > 0) {
    answerParts.push(`involving ${concepts.map(c => c.name).join(', ')}`);
  }
  
  // Add relationship context
  const relevantRelationships = Array.from(network.relationships.values())
    .filter(r => 
      relevantEntities.some(e => e.id === r.source_id || e.id === r.target_id)
    );
  
  if (relevantRelationships.length > 0) {
    answerParts.push(`I see ${relevantRelationships.length} connections between these elements`);
  }
  
  // Add conversation context
  if (conversations.length > 0) {
    const latestConv = conversations[0];
    answerParts.push(`Based on our recent conversation about "${latestConv.user_message.substring(0, 50)}..."`);
  }
  
  if (answerParts.length > 0) {
    return answerParts.join('. ') + '. What specific aspect would you like to explore?';
  }
  
  return 'I have some context about this. What would you like to know specifically?';
}

export async function POST(req: NextRequest) {
  try {
    const { query, userId, includeContext = true, processInteraction = false, userMessage, aiResponse } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const network = getMemoryNetwork(userId);
    const startTime = Date.now();
    
    // Grok Principle #3: Detect and track refinements
    const refinementInfo = detectRefinement(query, network.conversations);
    
    if (refinementInfo.isRefinement) {
      console.log(`🔄 Detected refinement: ${refinementInfo.improvement}`);
      
      // Track refinement
      const existingRefinements = network.refinements.filter(r => 
        r.original_query === refinementInfo.originalQuery
      );
      
      network.refinements.push({
        id: `ref-${Date.now()}`,
        original_query: refinementInfo.originalQuery!,
        refined_query: query,
        iteration: existingRefinements.length + 1,
        improvement: refinementInfo.improvement!,
        timestamp: new Date().toISOString()
      });
    }
    
    // If processing a new interaction, extract entities and relationships
    if (processInteraction && userMessage && aiResponse) {
      const fullText = `${userMessage} ${aiResponse}`;
      const extractedEntities = extractEntities(fullText);
      
      // Add entities to network
      for (const entity of extractedEntities) {
        // Check for duplicates
        const existing = Array.from(network.entities.values())
          .find(e => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type);
        
        if (existing) {
          // Update confidence
          existing.confidence = Math.min(1.0, existing.confidence + 0.1);
          existing.updated_at = new Date().toISOString();
        } else {
          network.entities.set(entity.id, entity);
        }
      }
      
      // Create relationships between consecutive entities
      for (let i = 0; i < extractedEntities.length - 1; i++) {
        const rel: Relationship = {
          id: `rel-${Date.now()}-${Math.random()}`,
          source_id: extractedEntities[i].id,
          target_id: extractedEntities[i + 1].id,
          type: 'related_to',
          strength: 0.7,
          created_at: new Date().toISOString()
        };
        network.relationships.set(rel.id, rel);
      }
      
      // Store conversation
      network.conversations.push({
        id: `conv-${Date.now()}`,
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        metadata: { entities_extracted: extractedEntities.length }
      });
    }
    
    // Get instant answer
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required for instant answer' },
        { status: 400 }
      );
    }
    
    // Extract entities from query
    const queryEntities = extractEntities(query);
    
    // Search conversation history
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/));
    
    const scoredConversations = network.conversations
      .map(conv => {
        const convText = `${conv.user_message} ${conv.ai_response}`.toLowerCase();
        const convWords = new Set(convText.split(/\s+/));
        const overlap = Array.from(queryWords).filter(w => convWords.has(String(w))).length;
        const score = overlap / queryWords.size;
        return { score, conv };
      })
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.conv);
    
    // Get relevant entities
    const relevantEntities = Array.from(network.entities.values())
      .filter(e => queryLower.includes(e.name.toLowerCase()))
      .slice(0, 10);
    
    // Get relevant relationships
    const relevantRelationships = Array.from(network.relationships.values())
      .filter(r => 
        relevantEntities.some(e => e.id === r.source_id || e.id === r.target_id)
      );
    
    // Generate answer
    const answer = generateInstantAnswer(
      query,
      queryEntities,
      relevantRelationships,
      scoredConversations,
      network
    );
    
    // Build context items
    const contextItems = [];
    
    if (includeContext) {
      for (const entity of relevantEntities) {
        contextItems.push({
          type: 'entity',
          content: `${entity.type}: ${entity.name}`,
          properties: entity.properties,
          confidence: entity.confidence
        });
      }
      
      for (const rel of relevantRelationships) {
        const source = network.entities.get(rel.source_id);
        const target = network.entities.get(rel.target_id);
        if (source && target) {
          contextItems.push({
            type: 'relationship',
            content: `${source.name} ${rel.type.replace('_', ' ')} ${target.name}`,
            strength: rel.strength
          });
        }
      }
      
      for (const conv of scoredConversations) {
        contextItems.push({
          type: 'conversation',
          content: conv.user_message,
          response: conv.ai_response,
          timestamp: conv.timestamp
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      answer,
      context: contextItems,
      entities_used: relevantEntities.length,
      relationships_used: relevantRelationships.length,
      conversations_used: scoredConversations.length,
      sources: ['memory_network', 'knowledge_graph', 'conversation_history'],
      confidence: relevantEntities.length > 0 ? 0.85 : 0.3,
      processing_time_ms: processingTime,
      instant: true,
      network_stats: {
        total_entities: network.entities.size,
        total_relationships: network.relationships.size,
        total_conversations: network.conversations.length
      }
    });
    
  } catch (error: any) {
    console.error('Instant answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate instant answer' },
      { status: 500 }
    );
  }
}

// GET endpoint for network stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const network = getMemoryNetwork(userId);
    
    // Calculate entity breakdown
    const entityBreakdown: Record<string, number> = {};
    for (const entity of network.entities.values()) {
      entityBreakdown[entity.type] = (entityBreakdown[entity.type] || 0) + 1;
    }
    
    // Calculate relationship breakdown
    const relationshipBreakdown: Record<string, number> = {};
    for (const rel of network.relationships.values()) {
      relationshipBreakdown[rel.type] = (relationshipBreakdown[rel.type] || 0) + 1;
    }
    
    return NextResponse.json({
      total_entities: network.entities.size,
      total_relationships: network.relationships.size,
      total_conversations: network.conversations.length,
      entity_breakdown: entityBreakdown,
      relationship_breakdown: relationshipBreakdown,
      network_density: network.relationships.size / Math.max(network.entities.size, 1),
      memory_network_active: true
    });
    
  } catch (error: any) {
    console.error('Network stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get network stats' },
      { status: 500 }
    );
  }
}

