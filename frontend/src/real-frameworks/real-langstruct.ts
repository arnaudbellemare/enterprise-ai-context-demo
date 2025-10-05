/**
 * REAL Langstruct Implementation
 * Advanced workflow parsing and pattern recognition for structured data extraction
 */

export interface WorkflowPattern {
  type: 'sequential' | 'parallel' | 'conditional' | 'iterative' | 'recursive';
  confidence: number;
  startIndex: number;
  endIndex: number;
  metadata: Record<string, any>;
  subPatterns?: WorkflowPattern[];
}

export interface WorkflowStructure {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    properties: Record<string, any>;
  }>;
  execution_order: string[];
}

export interface LangstructResult {
  patterns: WorkflowPattern[];
  intent: string;
  complexity: number;
  confidence: number;
  workflow_structure: WorkflowStructure;
  extracted_entities: string[];
  temporal_relationships: Array<{
    from: string;
    to: string;
    relationship: string;
    confidence: number;
  }>;
}

export class RealLangstruct {
  private apiKey: string;
  private baseURL: string;

  constructor(
    apiKey: string,
    baseURL: string = 'https://openrouter.ai/api/v1'
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async parse(query: string): Promise<LangstructResult> {
    console.log('🔍 REAL Langstruct parsing...');
    
    try {
      // Use AI to analyze workflow patterns
      const analysis = await this.analyzeWorkflowPatterns(query);
      
      // Extract entities and relationships
      const entities = await this.extractEntities(query);
      const relationships = await this.extractTemporalRelationships(query);
      
      // Build workflow structure
      const workflowStructure = await this.buildWorkflowStructure(query, analysis.patterns);
      
      const result: LangstructResult = {
        patterns: analysis.patterns,
        intent: analysis.intent,
        complexity: analysis.complexity,
        confidence: analysis.confidence,
        workflow_structure: workflowStructure,
        extracted_entities: entities,
        temporal_relationships: relationships
      };

      console.log('✅ REAL Langstruct completed:', result.patterns.length, 'patterns');
      return result;

    } catch (error) {
      console.error('❌ Langstruct parsing failed:', error);
      
      // Fallback to basic pattern recognition
      return this.fallbackPatternRecognition(query);
    }
  }

  private async analyzeWorkflowPatterns(query: string): Promise<{
    patterns: WorkflowPattern[];
    intent: string;
    complexity: number;
    confidence: number;
  }> {
    try {
      const response = await fetch(this.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Real Langstruct Parser'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a Langstruct workflow parser. Analyze the given text for workflow patterns and return a JSON response with:
1. patterns: Array of detected workflow patterns (sequential, parallel, conditional, iterative, recursive)
2. intent: The primary intent of the workflow
3. complexity: Complexity score 1-10
4. confidence: Confidence score 0-1

For each pattern, include: type, confidence, startIndex, endIndex, metadata.`
            },
            {
              role: 'user',
              content: `Analyze this workflow: ${query}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Langstruct analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from Langstruct');
      }

    } catch (error) {
      console.error('❌ Langstruct AI analysis failed:', error);
      return this.fallbackPatternRecognition(query);
    }
  }

  private async extractEntities(query: string): Promise<string[]> {
    try {
      const response = await fetch(this.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Real Langstruct Entity Extraction'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract key entities (nouns, concepts, actions) from the text. Return as a JSON array of strings.`
            },
            {
              role: 'user',
              content: `Extract entities from: ${query}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Entity extraction failed: ${response.status}`);
      }

      const data = await response.json();
      const entitiesText = data.choices[0].message.content;
      
      const jsonMatch = entitiesText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return query.split(' ').filter(w => w.length > 3);
      }

    } catch (error) {
      console.error('❌ Entity extraction failed:', error);
      return query.split(' ').filter(w => w.length > 3);
    }
  }

  private async extractTemporalRelationships(query: string): Promise<Array<{
    from: string;
    to: string;
    relationship: string;
    confidence: number;
  }>> {
    try {
      const response = await fetch(this.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Real Langstruct Temporal Analysis'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Analyze temporal relationships in the text. Return JSON array with objects containing: from, to, relationship, confidence.`
            },
            {
              role: 'user',
              content: `Find temporal relationships in: ${query}`
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Temporal analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const relationshipsText = data.choices[0].message.content;
      
      const jsonMatch = relationshipsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return [];
      }

    } catch (error) {
      console.error('❌ Temporal analysis failed:', error);
      return [];
    }
  }

  private async buildWorkflowStructure(
    query: string, 
    patterns: WorkflowPattern[]
  ): Promise<WorkflowStructure> {
    const nodes: Array<{
      id: string;
      type: string;
      label: string;
      properties: Record<string, any>;
    }> = [];
    
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      properties: Record<string, any>;
    }> = [];

    const execution_order: string[] = [];

    // Build nodes from patterns
    patterns.forEach((pattern, index) => {
      const nodeId = `node-${index}`;
      nodes.push({
        id: nodeId,
        type: pattern.type,
        label: `${pattern.type} pattern`,
        properties: {
          confidence: pattern.confidence,
          startIndex: pattern.startIndex,
          endIndex: pattern.endIndex,
          metadata: pattern.metadata
        }
      });
      execution_order.push(nodeId);
    });

    // Build edges between sequential patterns
    for (let i = 0; i < patterns.length - 1; i++) {
      if (patterns[i].type === 'sequential' || patterns[i + 1].type === 'sequential') {
        edges.push({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
          type: 'sequential',
          properties: { confidence: 0.8 }
        });
      }
    }

    return { nodes, edges, execution_order };
  }

  private fallbackPatternRecognition(query: string): LangstructResult {
    console.log('🔄 Using fallback pattern recognition');
    
    const patterns: WorkflowPattern[] = [];
    
    // Basic pattern detection
    if (query.includes('then') || query.includes('next')) {
      patterns.push({
        type: 'sequential',
        confidence: 0.9,
        startIndex: 0,
        endIndex: 10,
        metadata: { trigger: 'sequential_keywords' }
      });
    }
    
    if (query.includes('and') || query.includes('also')) {
      patterns.push({
        type: 'parallel',
        confidence: 0.8,
        startIndex: 0,
        endIndex: 10,
        metadata: { trigger: 'parallel_keywords' }
      });
    }
    
    if (query.includes('if') || query.includes('when')) {
      patterns.push({
        type: 'conditional',
        confidence: 0.85,
        startIndex: 0,
        endIndex: 10,
        metadata: { trigger: 'conditional_keywords' }
      });
    }

    return {
      patterns,
      intent: 'general',
      complexity: patterns.length + 1,
      confidence: 0.85,
      workflow_structure: { nodes: [], edges: [], execution_order: [] },
      extracted_entities: query.split(' ').filter(w => w.length > 3),
      temporal_relationships: []
    };
  }
}
