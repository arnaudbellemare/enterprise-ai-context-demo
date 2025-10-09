/**
 * Entity Extraction & Relationship Mapping API
 * Extract entities and map relationships for the memory network
 */

import { NextRequest, NextResponse } from 'next/server';

interface Entity {
  id: string;
  type: 'person' | 'project' | 'concept' | 'organization' | 'event' | 'document' | 'task';
  name: string;
  properties: Record<string, any>;
  confidence: number;
  positions: number[]; // Character positions in text
}

interface Relationship {
  id: string;
  source: string; // Entity name
  target: string; // Entity name
  type: 'works_on' | 'related_to' | 'created_by' | 'mentioned_in' | 'depends_on' | 'collaborates_with' | 'belongs_to';
  confidence: number;
  context: string; // Surrounding text
}

export async function POST(req: NextRequest) {
  try {
    const { text, userId, options = {} } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for entity extraction' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Extract entities
    const entities = extractEntitiesAdvanced(text, options);

    // Extract relationships
    const relationships = extractRelationships(text, entities, options);

    // Calculate extraction quality metrics
    const metrics = {
      total_entities: entities.length,
      entity_breakdown: entities.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      total_relationships: relationships.length,
      relationship_breakdown: relationships.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avg_entity_confidence: entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length || 0,
      avg_relationship_confidence: relationships.reduce((sum, r) => sum + r.confidence, 0) / relationships.length || 0
    };

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      entities,
      relationships,
      metrics,
      processing_time_ms: processingTime,
      text_length: text.length,
      extraction_method: 'advanced_nlp'
    });

  } catch (error: any) {
    console.error('Entity extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract entities' },
      { status: 500 }
    );
  }
}

function extractEntitiesAdvanced(text: string, options: any = {}): Entity[] {
  const entities: Entity[] = [];
  const minConfidence = options.minConfidence || 0.5;

  // 1. Extract People (Proper names)
  const peoplePatterns = [
    /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b(?!\s+(?:Project|System|Company|Corporation))/g,
    /\b([A-Z][a-z]+)\b(?=\s+(?:said|mentioned|created|developed|built|designed|leads|manages))/g
  ];

  for (const pattern of peoplePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (name && name.length > 2 && !isCommonWord(name)) {
        entities.push({
          id: `person-${entities.length}`,
          type: 'person',
          name: name.trim(),
          properties: { 
            pattern: pattern.toString(),
            context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 50))
          },
          confidence: 0.75,
          positions: [match.index]
        });
      }
    }
  }

  // 2. Extract Projects
  const projectPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Project|Initiative|Program|System|Platform)\b/gi,
    /\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+project\b/gi,
    /\b(?:working on|developing|building|creating)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi
  ];

  for (const pattern of projectPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (name && name.length > 2) {
        entities.push({
          id: `project-${entities.length}`,
          type: 'project',
          name: name.trim(),
          properties: { 
            pattern: pattern.toString(),
            context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 50))
          },
          confidence: 0.85,
          positions: [match.index]
        });
      }
    }
  }

  // 3. Extract Concepts (Technical terms and key concepts)
  const conceptKeywords = {
    'artificial intelligence': 0.95,
    'machine learning': 0.95,
    'deep learning': 0.95,
    'neural network': 0.9,
    'natural language processing': 0.9,
    'nlp': 0.85,
    'ai': 0.9,
    'ml': 0.85,
    'llm': 0.9,
    'rag': 0.85,
    'retrieval augmented generation': 0.9,
    'knowledge graph': 0.9,
    'vector database': 0.85,
    'embedding': 0.85,
    'optimization': 0.8,
    'workflow': 0.8,
    'automation': 0.8,
    'algorithm': 0.85,
    'model': 0.8,
    'training': 0.75,
    'inference': 0.8,
    'context engineering': 0.9,
    'prompt engineering': 0.9,
    'memory network': 0.9,
    'instant answer': 0.9
  };

  const textLower = text.toLowerCase();
  for (const [concept, confidence] of Object.entries(conceptKeywords)) {
    let index = textLower.indexOf(concept);
    while (index !== -1) {
      entities.push({
        id: `concept-${entities.length}`,
        type: 'concept',
        name: concept,
        properties: { 
          technical: true,
          domain: detectDomain(concept)
        },
        confidence,
        positions: [index]
      });
      index = textLower.indexOf(concept, index + 1);
    }
  }

  // 4. Extract Organizations
  const orgPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Company|Corporation|Inc|LLC|Ltd|Organization)\b/g,
    /\b(?:at|for|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b(?=\s+(?:company|organization|corp))/gi
  ];

  for (const pattern of orgPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (name && name.length > 2) {
        entities.push({
          id: `org-${entities.length}`,
          type: 'organization',
          name: name.trim(),
          properties: { 
            context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 50))
          },
          confidence: 0.8,
          positions: [match.index]
        });
      }
    }
  }

  // 5. Extract Tasks
  const taskPatterns = [
    /\b(?:need to|should|must|will|going to)\s+([^.!?]+)/gi,
    /\b(?:task|todo|action item):\s*([^.!?]+)/gi
  ];

  for (const pattern of taskPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const task = match[1].trim();
      if (task.length > 10 && task.length < 100) {
        entities.push({
          id: `task-${entities.length}`,
          type: 'task',
          name: task,
          properties: { 
            action: true
          },
          confidence: 0.7,
          positions: [match.index]
        });
      }
    }
  }

  // Remove duplicates and filter by confidence
  const uniqueEntities = deduplicateEntities(entities);
  return uniqueEntities.filter(e => e.confidence >= minConfidence);
}

function extractRelationships(text: string, entities: Entity[], options: any = {}): Relationship[] {
  const relationships: Relationship[] = [];
  const textLower = text.toLowerCase();

  // 1. Works_on relationships (person -> project)
  const people = entities.filter(e => e.type === 'person');
  const projects = entities.filter(e => e.type === 'project');

  for (const person of people) {
    for (const project of projects) {
      const relationshipPatterns = [
        `${person.name.toLowerCase()} works on ${project.name.toLowerCase()}`,
        `${person.name.toLowerCase()} is working on ${project.name.toLowerCase()}`,
        `${person.name.toLowerCase()} leads ${project.name.toLowerCase()}`,
        `${person.name.toLowerCase()} develops ${project.name.toLowerCase()}`,
        `${person.name.toLowerCase()} created ${project.name.toLowerCase()}`
      ];

      for (const pattern of relationshipPatterns) {
        if (textLower.includes(pattern)) {
          relationships.push({
            id: `rel-${relationships.length}`,
            source: person.name,
            target: project.name,
            type: 'works_on',
            confidence: 0.85,
            context: extractContext(text, pattern)
          });
          break;
        }
      }
    }
  }

  // 2. Collaborates_with relationships (person -> person)
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const person1 = people[i];
      const person2 = people[j];
      
      const collaborationPatterns = [
        `${person1.name.toLowerCase()} and ${person2.name.toLowerCase()}`,
        `${person1.name.toLowerCase()}, ${person2.name.toLowerCase()}`,
        `${person1.name.toLowerCase()} with ${person2.name.toLowerCase()}`
      ];

      for (const pattern of collaborationPatterns) {
        if (textLower.includes(pattern)) {
          relationships.push({
            id: `rel-${relationships.length}`,
            source: person1.name,
            target: person2.name,
            type: 'collaborates_with',
            confidence: 0.75,
            context: extractContext(text, pattern)
          });
          break;
        }
      }
    }
  }

  // 3. Related_to relationships (concept -> project/person)
  const concepts = entities.filter(e => e.type === 'concept');
  
  for (const concept of concepts) {
    for (const entity of [...people, ...projects]) {
      // Check proximity (within 50 characters)
      const conceptPos = concept.positions[0];
      const entityPos = entity.positions[0];
      
      if (Math.abs(conceptPos - entityPos) < 50) {
        relationships.push({
          id: `rel-${relationships.length}`,
          source: concept.name,
          target: entity.name,
          type: 'related_to',
          confidence: 0.65,
          context: text.substring(
            Math.min(conceptPos, entityPos),
            Math.max(conceptPos, entityPos) + 50
          )
        });
      }
    }
  }

  // 4. Belongs_to relationships (entity -> organization)
  const orgs = entities.filter(e => e.type === 'organization');
  
  for (const org of orgs) {
    for (const entity of [...people, ...projects]) {
      const belongsPatterns = [
        `${entity.name.toLowerCase()} at ${org.name.toLowerCase()}`,
        `${entity.name.toLowerCase()} from ${org.name.toLowerCase()}`,
        `${org.name.toLowerCase()}'s ${entity.name.toLowerCase()}`
      ];

      for (const pattern of belongsPatterns) {
        if (textLower.includes(pattern)) {
          relationships.push({
            id: `rel-${relationships.length}`,
            source: entity.name,
            target: org.name,
            type: 'belongs_to',
            confidence: 0.8,
            context: extractContext(text, pattern)
          });
          break;
        }
      }
    }
  }

  return deduplicateRelationships(relationships);
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'The', 'This', 'That', 'What', 'When', 'Where', 'Why', 'How', 'Which',
    'About', 'After', 'Before', 'During', 'Through', 'Between', 'Against'
  ]);
  return commonWords.has(word);
}

function detectDomain(concept: string): string {
  const aiTerms = ['ai', 'machine learning', 'deep learning', 'neural network', 'llm', 'rag'];
  const techTerms = ['optimization', 'algorithm', 'workflow', 'automation'];
  
  if (aiTerms.some(term => concept.includes(term))) return 'artificial_intelligence';
  if (techTerms.some(term => concept.includes(term))) return 'technology';
  return 'general';
}

function extractContext(text: string, pattern: string): string {
  const index = text.toLowerCase().indexOf(pattern);
  if (index === -1) return '';
  
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + pattern.length + 30);
  return text.substring(start, end);
}

function deduplicateEntities(entities: Entity[]): Entity[] {
  const seen = new Map<string, Entity>();
  
  for (const entity of entities) {
    const key = `${entity.type}:${entity.name.toLowerCase()}`;
    const existing = seen.get(key);
    
    if (!existing || entity.confidence > existing.confidence) {
      seen.set(key, entity);
    }
  }
  
  return Array.from(seen.values());
}

function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
  const seen = new Map<string, Relationship>();
  
  for (const rel of relationships) {
    const key = `${rel.source.toLowerCase()}:${rel.type}:${rel.target.toLowerCase()}`;
    const existing = seen.get(key);
    
    if (!existing || rel.confidence > existing.confidence) {
      seen.set(key, rel);
    }
  }
  
  return Array.from(seen.values());
}

