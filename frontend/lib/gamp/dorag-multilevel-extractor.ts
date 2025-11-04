/**
 * DO-RAG Multi-Level Knowledge Graph Extraction
 * 
 * Implements DO-RAG's hierarchical multi-agent extraction pipeline:
 * - High-Level Agent: Structural elements (chapters, sections, paragraphs)
 * - Mid-Level Agent: Domain-specific entities (components, APIs, parameters)
 * - Low-Level Agent: Fine-grained relationships (operations, behaviors)
 * - Covariate Agent: Attributes (defaults, performance, metadata)
 * 
 * Based on: "DO-RAG: A Domain-Specific QA Framework Using 
 * Knowledge Graph-Enhanced Retrieval-Augmented Generation"
 */

import { embeddingService } from '../embedding-service';

export interface MultiLevelEntity {
  id: string;
  text: string;
  level: 'high' | 'mid' | 'low' | 'covariate';
  type: string;
  attributes?: Record<string, any>;
  confidence: number;
  source?: string;
}

export interface MultiLevelRelation {
  id: string;
  source: string;
  target: string;
  relation: string;
  level: 'high' | 'mid' | 'low' | 'covariate';
  confidence: number;
  attributes?: Record<string, any>;
}

export interface MultiLevelExtractionResult {
  entities: MultiLevelEntity[];
  relations: MultiLevelRelation[];
  graph: {
    nodes: MultiLevelEntity[];
    edges: MultiLevelRelation[];
  };
  statistics: {
    highLevel: number;
    midLevel: number;
    lowLevel: number;
    covariate: number;
  };
}

/**
 * High-Level Agent
 * Extracts structural elements: chapters, sections, paragraphs
 */
class HighLevelAgent {
  private model: string = 'gemma3:4b';
  
  async extract(chunk: string, domain: string): Promise<MultiLevelEntity[]> {
    const prompt = `You are a High-Level Agent extracting structural elements from technical documents.

Document chunk:
${chunk.substring(0, 2000)}

Domain: ${domain}

Identify structural elements:
- Chapters/sections
- Major topics
- Document hierarchy
- High-level concepts

Respond with JSON array of entities:
[
  {"text": "entity name", "type": "chapter|section|topic", "confidence": 0.0-1.0}
]`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a High-Level extraction agent. Respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const entities = this.parseJSON(content);
      
      return entities.map((e: any, i: number) => ({
        id: `high_${Date.now()}_${i}`,
        text: e.text,
        level: 'high' as const,
        type: e.type || 'structural',
        confidence: e.confidence || 0.7,
      }));
    } catch (error) {
      console.warn('High-Level Agent failed:', error);
      return [];
    }
  }
  
  private parseJSON(content: string): any[] {
    try {
      // Try to extract JSON array from markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
}

/**
 * Mid-Level Agent
 * Extracts domain-specific entities: components, APIs, parameters, systems
 */
class MidLevelAgent {
  private model: string = 'gemma3:4b';
  
  async extract(chunk: string, domain: string): Promise<MultiLevelEntity[]> {
    const prompt = `You are a Mid-Level Agent extracting domain-specific entities from technical documents.

Document chunk:
${chunk.substring(0, 2000)}

Domain: ${domain}

Identify domain-specific entities:
- System components
- APIs and functions
- Parameters and configurations
- Domain concepts
- Technical terms

Respond with JSON array:
[
  {"text": "entity name", "type": "component|api|parameter|concept", "confidence": 0.0-1.0}
]`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a Mid-Level extraction agent. Respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const entities = this.parseJSON(content);
      
      return entities.map((e: any, i: number) => ({
        id: `mid_${Date.now()}_${i}`,
        text: e.text,
        level: 'mid' as const,
        type: e.type || 'entity',
        confidence: e.confidence || 0.7,
      }));
    } catch (error) {
      console.warn('Mid-Level Agent failed:', error);
      return [];
    }
  }
  
  private parseJSON(content: string): any[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
}

/**
 * Low-Level Agent
 * Extracts fine-grained relationships: operations, behaviors, dependencies
 */
class LowLevelAgent {
  private model: string = 'gemma3:4b';
  
  async extractRelations(
    chunk: string,
    entities: MultiLevelEntity[],
    domain: string
  ): Promise<MultiLevelRelation[]> {
    const entityList = entities.map(e => e.text).join(', ');
    
    const prompt = `You are a Low-Level Agent extracting fine-grained relationships.

Document chunk:
${chunk.substring(0, 2000)}

Entities found: ${entityList}
Domain: ${domain}

Identify relationships:
- Operations and behaviors
- Dependencies and interactions
- Causal relationships
- Process flows

Respond with JSON array:
[
  {"source": "entity1", "target": "entity2", "relation": "affects|depends_on|triggers", "confidence": 0.0-1.0}
]`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a Low-Level extraction agent. Respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const relations = this.parseJSON(content);
      
      return relations.map((r: any, i: number) => ({
        id: `low_${Date.now()}_${i}`,
        source: r.source,
        target: r.target,
        relation: r.relation || 'related_to',
        level: 'low' as const,
        confidence: r.confidence || 0.7,
      }));
    } catch (error) {
      console.warn('Low-Level Agent failed:', error);
      return [];
    }
  }
  
  private parseJSON(content: string): any[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
}

/**
 * Covariate Agent
 * Attaches attributes: default values, performance metrics, metadata
 */
class CovariateAgent {
  private model: string = 'gemma3:4b';
  
  async attachAttributes(
    entities: MultiLevelEntity[],
    chunk: string,
    domain: string
  ): Promise<MultiLevelEntity[]> {
    if (entities.length === 0) return entities;
    
    const prompt = `You are a Covariate Agent attaching attributes to entities.

Entities:
${entities.map(e => `- ${e.text} (${e.type})`).join('\n')}

Document context:
${chunk.substring(0, 1500)}

Domain: ${domain}

For each entity, identify attributes:
- Default values
- Performance metrics
- Constraints
- Metadata

Respond with JSON object:
{
  "entity_name": {"attribute1": "value1", "attribute2": "value2"}
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a Covariate agent. Respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const attributes = this.parseJSON(content);
      
      // Attach attributes to entities
      return entities.map(entity => {
        const entityAttrs = attributes[entity.text] || attributes[entity.id] || {};
        return {
          ...entity,
          attributes: entityAttrs,
        };
      });
    } catch (error) {
      console.warn('Covariate Agent failed:', error);
      return entities;
    }
  }
  
  private parseJSON(content: string): Record<string, any> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
}

/**
 * Multi-Level Extractor
 * Orchestrates all four agents in hierarchical pipeline
 */
export class DORAGMultiLevelExtractor {
  private highLevelAgent: HighLevelAgent;
  private midLevelAgent: MidLevelAgent;
  private lowLevelAgent: LowLevelAgent;
  private covariateAgent: CovariateAgent;
  
  constructor() {
    this.highLevelAgent = new HighLevelAgent();
    this.midLevelAgent = new MidLevelAgent();
    this.lowLevelAgent = new LowLevelAgent();
    this.covariateAgent = new CovariateAgent();
  }
  
  /**
   * Extract multi-level entities and relations from document chunks
   */
  async extract(
    chunks: Array<{ id: string; content: string; domain?: string }>,
    domain: string = 'general'
  ): Promise<MultiLevelExtractionResult> {
    console.log(`🔬 DO-RAG Multi-Level Extraction: Processing ${chunks.length} chunks...`);
    
    const allEntities: MultiLevelEntity[] = [];
    const allRelations: MultiLevelRelation[] = [];
    
    // Process each chunk through the pipeline
    for (const chunk of chunks) {
      try {
        // Step 1: High-Level extraction (structural)
        const highLevelEntities = await this.highLevelAgent.extract(chunk.content, domain);
        allEntities.push(...highLevelEntities);
        
        // Step 2: Mid-Level extraction (domain entities)
        const midLevelEntities = await this.midLevelAgent.extract(chunk.content, domain);
        allEntities.push(...midLevelEntities);
        
        // Step 3: Low-Level extraction (relationships)
        const chunkEntities = [...highLevelEntities, ...midLevelEntities];
        const lowLevelRelations = await this.lowLevelAgent.extractRelations(
          chunk.content,
          chunkEntities,
          domain
        );
        allRelations.push(...lowLevelRelations);
        
        // Step 4: Covariate attachment (attributes)
        const enrichedEntities = await this.covariateAgent.attachAttributes(
          chunkEntities,
          chunk.content,
          domain
        );
        
        // Update entities with attributes
        enrichedEntities.forEach(enriched => {
          const idx = allEntities.findIndex(e => e.id === enriched.id);
          if (idx >= 0) {
            allEntities[idx] = enriched;
          }
        });
      } catch (error) {
        console.warn(`Failed to process chunk ${chunk.id}:`, error);
        continue;
      }
    }
    
    // Deduplicate entities by text similarity
    const deduplicatedEntities = this.deduplicateEntities(allEntities);
    
    // Build graph structure
    const graph = {
      nodes: deduplicatedEntities,
      edges: allRelations,
    };
    
    const statistics = {
      highLevel: deduplicatedEntities.filter(e => e.level === 'high').length,
      midLevel: deduplicatedEntities.filter(e => e.level === 'mid').length,
      lowLevel: deduplicatedEntities.filter(e => e.level === 'low').length,
      covariate: deduplicatedEntities.filter(e => e.attributes && Object.keys(e.attributes).length > 0).length,
    };
    
    console.log(`✅ Multi-Level Extraction: ${deduplicatedEntities.length} entities, ${allRelations.length} relations`);
    console.log(`   - High: ${statistics.highLevel}, Mid: ${statistics.midLevel}, Low: ${statistics.lowLevel}, Covariate: ${statistics.covariate}`);
    
    return {
      entities: deduplicatedEntities,
      relations: allRelations,
      graph,
      statistics,
    };
  }
  
  /**
   * Deduplicate entities by semantic similarity
   */
  private deduplicateEntities(entities: MultiLevelEntity[]): MultiLevelEntity[] {
    // Simple deduplication by exact text match first
    const seen = new Map<string, MultiLevelEntity>();
    
    for (const entity of entities) {
      const key = entity.text.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, entity);
      } else {
        // Merge attributes if duplicate
        const existing = seen.get(key)!;
        existing.attributes = { ...existing.attributes, ...entity.attributes };
        existing.confidence = Math.max(existing.confidence, entity.confidence);
      }
    }
    
    return Array.from(seen.values());
  }
}

export const doragMultiLevelExtractor = new DORAGMultiLevelExtractor();

