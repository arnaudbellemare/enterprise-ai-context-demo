import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ARCMEMO: Concept-Level Memory System
 * Inspired by: https://github.com/matt-seb-ho/arc_memo
 * 
 * Instead of storing exact query/response pairs, we store:
 * - Abstract concepts learned from workflow executions
 * - Reusable patterns and insights
 * - Modular takeaways that apply across domains
 */

interface ConceptMemory {
  id: string;
  concept: string; // Abstract, reusable insight
  domain: string; // e.g., 'real_estate', 'finance', 'general'
  abstractionLevel: 'specific' | 'general' | 'universal'; // How broadly applicable
  sourceWorkflows: string[]; // Which workflows contributed to this
  applicationCount: number; // How often it's been reused
  successRate: number; // How useful it's been
  embedding?: number[]; // For semantic retrieval
  createdAt: Date;
  lastUsed: Date;
  metadata: {
    keyTriggers: string[]; // Keywords that should retrieve this
    relatedConcepts: string[]; // Other concepts this relates to
    examples: string[]; // Specific instances where it applied
  };
}

// Initialize Supabase client
let supabase: any = null;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client initialized for ArcMemo');
  } else {
    console.warn('⚠️ Supabase not configured - using in-memory fallback');
  }
} catch (error) {
  console.error('❌ Error initializing Supabase:', error);
}

// In-memory fallback if Supabase not configured
const conceptMemoryFallback: Map<string, ConceptMemory> = new Map();

/**
 * ABSTRACT concepts from workflow execution
 * Extracts reusable insights from successful workflows
 */
async function abstractConcepts(workflow: {
  name: string;
  domain: string;
  nodes: any[];
  results: any;
  userQuery: string;
  success: boolean;
}): Promise<ConceptMemory[]> {
  
  if (!workflow.success) return []; // Only learn from successes
  
  console.log('🧠 ArcMemo: Abstracting concepts from workflow:', workflow.name);
  
  // Use LLM to extract abstract, reusable concepts
  const abstractionPrompt = `Analyze this successful workflow execution and extract 2-3 ABSTRACT, REUSABLE concepts.

WORKFLOW:
- Domain: ${workflow.domain}
- Query: ${workflow.userQuery}
- Agents Used: ${workflow.nodes.map(n => n.role).join(' → ')}
- Results Summary: ${JSON.stringify(workflow.results).substring(0, 500)}

Extract concepts at different abstraction levels:
1. SPECIFIC: Applies to this exact domain (e.g., "For real estate analysis, always verify property tax records")
2. GENERAL: Applies across similar domains (e.g., "Multi-source validation improves accuracy")
3. UNIVERSAL: Applies to all workflows (e.g., "Research before analysis yields better insights")

Respond in JSON:
{
  "concepts": [
    {
      "concept": "Clear, actionable insight in natural language",
      "abstractionLevel": "specific|general|universal",
      "keyTriggers": ["keyword1", "keyword2"],
      "applicability": "When this concept should be applied",
      "relatedConcepts": ["concept_id1", "concept_id2"]
    }
  ]
}`;

  try {
    const response = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: abstractionPrompt,
        systemPrompt: 'You are a meta-learning system that extracts reusable concepts from AI workflow executions.',
        temperature: 0.3 // Lower temp for consistent abstraction
      })
    });
    
    const data = await response.json();
    const parsed = JSON.parse(data.response || '{"concepts":[]}');
    
    // Store concepts with embeddings
    const newConcepts: ConceptMemory[] = [];
    
    for (const concept of parsed.concepts) {
      // Generate embedding for semantic search
      const embeddingResponse = await fetch('http://localhost:3000/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: concept.concept })
      });
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.embedding;
      
      const conceptData = {
        concept: concept.concept,
        domain: workflow.domain,
        abstraction_level: concept.abstractionLevel || 'general',
        source_workflows: [workflow.name],
        application_count: 0,
        success_rate: 1.0,
        embedding: embedding,
        key_triggers: concept.keyTriggers || [],
        related_concepts: [],
        examples: [workflow.userQuery],
        metadata: {
          applicability: concept.applicability || '',
          createdFrom: workflow.name
        }
      };
      
      if (supabase) {
        // Store in Supabase
        const { data, error } = await supabase
          .from('concept_memory')
          .insert(conceptData)
          .select()
          .single();
        
        if (error) {
          console.error('Error storing concept in Supabase:', error);
          // Fallback to in-memory
          const fallbackConcept: ConceptMemory = {
            id: data?.id || Date.now().toString(),
            concept: conceptData.concept,
            domain: conceptData.domain,
            abstractionLevel: conceptData.abstraction_level as 'specific' | 'general' | 'universal',
            sourceWorkflows: conceptData.source_workflows,
            applicationCount: conceptData.application_count,
            successRate: conceptData.success_rate,
            embedding: conceptData.embedding,
            createdAt: new Date(),
            lastUsed: new Date(),
            metadata: conceptData.metadata as any
          };
          conceptMemoryFallback.set(fallbackConcept.id, fallbackConcept);
        } else {
          console.log('✅ Stored concept in Supabase:', concept.concept);
          const storedConcept: ConceptMemory = {
            id: data.id,
            concept: conceptData.concept,
            domain: conceptData.domain,
            abstractionLevel: conceptData.abstraction_level as 'specific' | 'general' | 'universal',
            sourceWorkflows: conceptData.source_workflows,
            applicationCount: conceptData.application_count,
            successRate: conceptData.success_rate,
            embedding: conceptData.embedding,
            createdAt: new Date(data.created_at),
            lastUsed: new Date(data.last_used),
            metadata: conceptData.metadata as any
          };
          newConcepts.push(storedConcept);
        }
      } else {
        // In-memory fallback
        const id = Date.now().toString();
        const conceptMemory: ConceptMemory = {
          id,
          concept: concept.concept,
          domain: workflow.domain,
          abstractionLevel: concept.abstractionLevel || 'general',
          sourceWorkflows: [workflow.name],
          applicationCount: 0,
          successRate: 1.0,
          embedding,
          createdAt: new Date(),
          lastUsed: new Date(),
          metadata: {
            keyTriggers: concept.keyTriggers || [],
            relatedConcepts: [],
            examples: [workflow.userQuery]
          }
        };
        conceptMemoryFallback.set(id, conceptMemory);
        newConcepts.push(conceptMemory);
        console.log('✅ Stored concept in memory:', concept.concept);
      }
    }
    
    return newConcepts;
    
  } catch (error) {
    console.error('Error abstracting concepts:', error);
    return [];
  }
}

/**
 * RETRIEVE relevant concepts for new query
 * Semantic search (vector) + keyword matching
 */
async function retrieveRelevantConcepts(query: {
  userRequest: string;
  domain: string;
  workflowType?: string;
  maxConcepts?: number;
}): Promise<ConceptMemory[]> {
  
  const { userRequest, domain, maxConcepts = 5 } = query;
  
  console.log('🔍 ArcMemo: Retrieving concepts for:', userRequest);
  
  if (supabase) {
    // SEMANTIC SEARCH using vector embeddings
    try {
      // Generate embedding for the query
      const embeddingResponse = await fetch('http://localhost:3000/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userRequest })
      });
      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.embedding;
      
      // Use Supabase vector search function
      const { data, error } = await supabase.rpc('match_concepts', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7, // 70% similarity minimum
        match_count: maxConcepts,
        filter_domain: domain
      });
      
      if (error) {
        console.error('Error in vector search:', error);
        throw error;
      }
      
      const concepts: ConceptMemory[] = data.map((row: any) => ({
        id: row.id,
        concept: row.concept,
        domain: row.domain,
        abstractionLevel: row.abstraction_level,
        sourceWorkflows: [],
        applicationCount: row.application_count,
        successRate: row.success_rate,
        createdAt: new Date(),
        lastUsed: new Date(),
        metadata: {
          keyTriggers: row.key_triggers || [],
          relatedConcepts: [],
          examples: row.examples || []
        }
      }));
      
      console.log(`✅ Retrieved ${concepts.length} concepts via semantic search (avg similarity: ${data.length > 0 ? (data.reduce((sum: number, c: any) => sum + c.similarity, 0) / data.length * 100).toFixed(1) : 0}%)`);
      
      return concepts;
      
    } catch (error) {
      console.error('Vector search failed, falling back to keyword matching:', error);
    }
  }
  
  // FALLBACK: Keyword-based matching (in-memory)
  const concepts = Array.from(conceptMemoryFallback.values());
  const scoredConcepts = concepts.map(concept => {
    let score = 0;
    
    // Domain match
    if (concept.domain === domain) score += 3;
    else if (concept.abstractionLevel === 'universal') score += 2;
    else if (concept.abstractionLevel === 'general') score += 1;
    
    // Keyword match
    const requestLower = userRequest.toLowerCase();
    concept.metadata.keyTriggers.forEach(trigger => {
      if (requestLower.includes(trigger.toLowerCase())) score += 2;
    });
    
    // Success rate boost
    score *= concept.successRate;
    
    // Recency boost
    const daysSinceUsed = (Date.now() - concept.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUsed < 7) score *= 1.2;
    
    // Usage frequency boost
    score += Math.log(concept.applicationCount + 1) * 0.5;
    
    return { concept, score };
  });
  
  const topConcepts = scoredConcepts
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxConcepts)
    .map(s => s.concept);
  
  console.log(`✅ Retrieved ${topConcepts.length} concepts via keyword matching`);
  
  return topConcepts;
}

/**
 * APPLY concepts to workflow planning
 * Inject relevant concepts into agent prompts
 */
function enrichPromptWithConcepts(
  basePrompt: string,
  concepts: ConceptMemory[]
): string {
  
  if (concepts.length === 0) return basePrompt;
  
  const conceptSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 LEARNED CONCEPTS (from previous workflows):

${concepts.map((c, i) => 
  `${i + 1}. [${c.abstractionLevel.toUpperCase()}] ${c.concept}
     • Applied successfully ${c.applicationCount} times (${(c.successRate * 100).toFixed(0)}% success rate)
     • Domain: ${c.domain}`
).join('\n\n')}

Use these insights to improve your analysis and avoid common pitfalls.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  return conceptSection + '\n\n' + basePrompt;
}

/**
 * UPDATE concept after application
 * Track success and refine over time
 */
async function updateConceptFeedback(
  conceptId: string,
  wasSuccessful: boolean,
  newExample?: string
) {
  
  const concept = conceptMemoryFallback.get(conceptId);
  if (!concept) return;
  
  // Update metrics
  concept.applicationCount += 1;
  concept.successRate = (
    (concept.successRate * (concept.applicationCount - 1) + (wasSuccessful ? 1 : 0)) 
    / concept.applicationCount
  );
  concept.lastUsed = new Date();
  
  if (newExample) {
    concept.metadata.examples.push(newExample);
  }
  
  // Prune if consistently unsuccessful
  if (concept.applicationCount > 10 && concept.successRate < 0.3) {
    conceptMemoryFallback.delete(conceptId);
    console.log('🗑️  Removed low-performing concept:', concept.concept);
  } else {
    conceptMemoryFallback.set(conceptId, concept);
    console.log('✅ Updated concept:', concept.concept, `(${(concept.successRate * 100).toFixed(0)}% success)`);
  }
}

/**
 * GET memory statistics
 */
function getMemoryStats() {
  const concepts = Array.from(conceptMemoryFallback.values());
  
  return {
    totalConcepts: concepts.length,
    byAbstractionLevel: {
      specific: concepts.filter(c => c.abstractionLevel === 'specific').length,
      general: concepts.filter(c => c.abstractionLevel === 'general').length,
      universal: concepts.filter(c => c.abstractionLevel === 'universal').length
    },
    byDomain: concepts.reduce((acc, c) => {
      acc[c.domain] = (acc[c.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalApplications: concepts.reduce((sum, c) => sum + c.applicationCount, 0),
    averageSuccessRate: concepts.reduce((sum, c) => sum + c.successRate, 0) / concepts.length || 0,
    mostUsedConcepts: concepts
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 5)
      .map(c => ({ concept: c.concept, uses: c.applicationCount }))
  };
}

/**
 * API Routes
 */
export async function POST(request: Request) {
  try {
    const { action, ...params } = await request.json();
    
    switch (action) {
      case 'abstract':
        const newConcepts = await abstractConcepts(params.workflow);
        return NextResponse.json({ success: true, concepts: newConcepts });
        
      case 'retrieve':
        const concepts = await retrieveRelevantConcepts(params.query);
        return NextResponse.json({ success: true, concepts });
        
      case 'update':
        await updateConceptFeedback(params.conceptId, params.wasSuccessful, params.newExample);
        return NextResponse.json({ success: true });
        
      case 'stats':
        const stats = getMemoryStats();
        return NextResponse.json({ success: true, stats });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('ArcMemo error:', error);
    return NextResponse.json({ error: 'Memory operation failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Get all concepts or memory stats
  const stats = getMemoryStats();
  const recentConcepts = Array.from(conceptMemoryFallback.values())
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, 10);
  
  return NextResponse.json({
    success: true,
    stats,
    recentConcepts: recentConcepts.map(c => ({
      concept: c.concept,
      domain: c.domain,
      abstractionLevel: c.abstractionLevel,
      applicationCount: c.applicationCount,
      successRate: c.successRate
    }))
  });
}

