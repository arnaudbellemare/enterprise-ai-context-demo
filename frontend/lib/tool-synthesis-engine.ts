/**
 * Tool Synthesis Engine - Alita-G Inspired
 * 
 * Synthesizes tools from successful agent trajectories and abstracts them
 * into reusable, parameterized primitives stored in domain-specific repositories.
 * 
 * Based on: Alita-G: Self-Evolving Generative Agent for Agent GENERATION
 * Paper: https://arxiv.org/pdf/2510.23601
 * 
 * Key Concepts:
 * 1. Extract tools from successful trajectories
 * 2. Abstract concrete usage → parameterized primitives
 * 3. Store in domain-specific repositories (MCP Box equivalent)
 * 4. Retrieve-augmented tool selection at inference
 */

import { ArcMemoReasoningBank, type Experience } from './arcmemo-reasoning-bank';

export interface ToolPrimitive {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
    default?: any;
  }>;
  useCases: string[]; // When to use this tool
  domain: string;
  abstractionLevel: 'concrete' | 'parameterized' | 'primitive';
  
  // Success metrics
  successRate: number;
  usageCount: number;
  
  // Tool metadata
  toolType: 'api' | 'function' | 'composite' | 'mcp';
  invocationPattern: string; // How it was used in trajectory
  
  // Relationships
  derivedFrom?: string[]; // Parent tool IDs
  evolvedInto?: string[]; // Child tool IDs
  
  // Embedding for retrieval
  embedding?: number[];
  
  // Timestamps
  createdAt: Date;
  lastUsed: Date;
  
  // FastMCP metadata (optional)
  metadata?: {
    fastMCPCompatible?: boolean;
    code?: string;
    interface?: string;
  };
}

export interface DomainToolRepository {
  domain: string;
  tools: Map<string, ToolPrimitive>;
  supabase: any;
}

/**
 * Tool Synthesis Engine
 * 
 * Synthesizes tools from successful trajectories (Alita-G style)
 */
export class ToolSynthesisEngine {
  private repositories: Map<string, DomainToolRepository> = new Map();
  private reasoningBank: ArcMemoReasoningBank;
  
  constructor(reasoningBank: ArcMemoReasoningBank) {
    this.reasoningBank = reasoningBank;
  }
  
  /**
   * Extract tools from successful trajectory (Alita-G Step 1)
   */
  async extractToolsFromTrajectory(experience: Experience): Promise<ToolPrimitive[]> {
    /**
     * Extract tool usage patterns from trajectory steps
     * 
     * Example trajectory step:
     * {
     *   thought: "I need to search for quantum computing hardware",
     *   action: "web_search",
     *   observation: "Found IBM quantum processors..."
     * }
     * 
     * Extracted tool:
     * {
     *   name: "domain_research",
     *   parameters: { domain: "{{domain}}", query_type: "{{type}}" },
     *   invocationPattern: "web_search"
     * }
     */
    
    const extractedTools: ToolPrimitive[] = [];
    
    if (!experience.steps || experience.steps.length === 0) {
      console.log('ℹ️ No trajectory steps found in experience');
      return [];
    }
    
    console.log(`🔍 Extracting tools from ${experience.steps.length} trajectory steps...`);
    
    let toolsDetected = 0;
    let toolsCreated = 0;
    let toolsFailed = 0;
    
    for (const step of experience.steps) {
      // Detect tool usage in step.action or step.observation
      const toolUsage = this.detectToolUsage(step);
      
      if (toolUsage) {
        toolsDetected++;
        console.log(`   🔧 Detected tool usage: ${toolUsage.toolType}`);
        
        try {
          const tool = await this.createToolPrimitive(
            toolUsage,
            experience,
            step
          );
          
          if (tool) {
            extractedTools.push(tool);
            toolsCreated++;
          } else {
            toolsFailed++;
          }
        } catch (error) {
          toolsFailed++;
          console.warn(`   ⚠️ Failed to create tool from ${toolUsage.toolType}:`, error);
        }
      }
    }
    
    if (toolsDetected === 0) {
      console.log(`ℹ️ No tool usage patterns detected in ${experience.steps.length} steps`);
      console.log('   (This is normal for queries that use reasoning/calculations rather than external tools)');
    } else {
      console.log(`✅ Tool extraction: ${toolsDetected} detected → ${toolsCreated} created (${toolsFailed} failed)`);
    }
    
    return extractedTools;
  }
  
  /**
   * Detect tool usage from trajectory step
   */
  private detectToolUsage(step: any): any | null {
    // Detect common tool patterns
    const toolPatterns = {
      web_search: /(?:search|lookup|find|query|research).*web/i,
      calculator: /(?:calculate|compute|solve|math|formula)/i,
      sql: /(?:sql|database|query|select|from|where)/i,
      api_call: /(?:api|endpoint|call|request|fetch)/i,
      data_analysis: /(?:analyze|process|extract|transform)/i
    };
    
    const action = step.action || '';
    const thought = step.thought || '';
    const observation = step.observation || '';
    
    const combined = `${action} ${thought} ${observation}`;
    
    for (const [toolType, pattern] of Object.entries(toolPatterns)) {
      if (pattern.test(combined)) {
        return {
          toolType,
          invocation: action,
          context: { thought, observation }
        };
    }
    }
    
    return null;
  }
  
  /**
   * Create tool primitive from concrete usage (Alita-G abstraction)
   */
  private async createToolPrimitive(
    toolUsage: any,
    experience: Experience,
    step: any
  ): Promise<ToolPrimitive | null> {
    /**
     * Abstract concrete tool usage → parameterized primitive
     * 
     * Example abstraction:
     * Concrete: "web_search('quantum computing financial risk')"
     * Abstracted: "domain_research({ domain: '{{domain}}', research_type: '{{type}}' })"
     */
    
    const tool = await this.abstractToolUsage(toolUsage, experience, step);
    
    if (!tool) return null;
    
    // Generate embedding for retrieval (Alita-G: contextm = descriptionm ⊕ use_casem)
    // Paper uses concatenation of description + use case for RAG
    const contextText = `${tool.description} ${tool.useCases.join(' ')}`;
    const embedding = await this.generateEmbedding(contextText);
    
    return {
      ...tool,
      embedding,
      createdAt: new Date(),
      lastUsed: new Date()
    };
  }
  
  /**
   * Abstract concrete tool usage to parameterized primitive (Alita-G key step)
   */
  private async abstractToolUsage(
    toolUsage: any,
    experience: Experience,
    step: any
  ): Promise<Omit<ToolPrimitive, 'embedding' | 'createdAt' | 'lastUsed'> | null> {
    /**
     * Use LLM to abstract concrete usage → parameterized primitive
     * Similar to ReasoningBank's memory extraction
     */
    
    const abstractionPrompt = `Extract and abstract a reusable tool from this agent execution step following Alita-G's 4-step abstraction process:

Concrete Usage:
Action: ${step.action}
Thought: ${step.thought}
Observation: ${step.observation}
Context: ${experience.domain}
Success: ${experience.success}

Perform ALL 4 abstraction steps:
1. PARAMETER GENERALIZATION: Replace hard-coded values with configurable parameters (use {{placeholder}} syntax)
2. CONTEXT REMOVAL: Eliminate task-specific references while preserving core functionality
3. INTERFACE STANDARDIZATION: Ensure compatibility with FastMCP protocol (standardized MCP interface)
4. DOCUMENTATION ENHANCEMENT: Generate comprehensive docstrings and type annotations

Abstract this into a parameterized tool primitive:
- Tool name (generalized, not task-specific)
- Parameters (all hard-coded values → {{placeholders}})
- Description (general, reusable description)
- Use cases (when to use this tool)
- Tool type (api|function|composite|mcp)

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "name": "generalized_tool_name",
  "description": "What this tool does (general, reusable description without task-specific context)",
  "parameters": {
    "param1": { "type": "string", "description": "...", "required": true, "default": null }
  },
  "useCases": ["general use case 1", "general use case 2"],
  "toolType": "api|function|composite|mcp",
  "abstractionLevel": "parameterized",
  "interface": "FastMCP",
  "fastMCPCompatible": true,
  "code": "def tool_name(params): ..."
}

CRITICAL: Return ONLY the JSON object, nothing else. No markdown code blocks, no explanations, no text before or after.

IMPORTANT: The generated code MUST follow FastMCP protocol:
- Function signature with type hints (def tool_name(param: str) -> dict)
- FastMCP decorator/compatible structure
- Proper error handling (try/except blocks)
- Standardized parameter types (str, int, float, bool, dict, list)`;

    try {
      // Use local Ollama for cost-effectiveness (tool synthesis doesn't need recent data)
      // Improved JSON repair handles Ollama's imperfect JSON generation
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          messages: [
            { 
              role: "system", 
              content: "You are an expert at abstracting concrete tool usage into reusable primitives. CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no explanations, no text before or after the JSON. Just the raw JSON object."
            },
            { role: "user", content: abstractionPrompt }
          ],
          temperature: 0.0, // Deterministic abstraction
          // Increase max tokens to prevent truncation (Ollama uses num_predict)
          num_predict: 4000, // Increased from default to handle full JSON responses
          // Force JSON mode if supported (some Ollama versions support this)
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.message?.content || '';
      
      // Extract JSON with improved error handling
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try finding JSON between markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        }
      }
      
      if (jsonMatch) {
        let jsonText = jsonMatch[0];
        
        // Try to fix common JSON issues from LLMs (multi-pass repair)
        try {
          // Pass 1: Remove trailing commas before closing braces/brackets
          jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
          
          // Pass 2: Fix unquoted keys (but preserve already-quoted keys)
          jsonText = jsonText.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, (match: string, prefix: string, key: string) => {
            // Only quote if not already quoted
            if (!key.startsWith('"') && !key.startsWith("'")) {
              return `${prefix}"${key}":`;
            }
            return match;
          });
          
          // Pass 3: Fix single quotes to double quotes (careful - only JSON delimiters)
          // Fix keys: 'key': → "key":
          jsonText = jsonText.replace(/([{,]\s*)'([^']+)':/g, '$1"$2":');
          // Fix string values: : 'value' → : "value"
          jsonText = jsonText.replace(/:\s*'([^']*)'(?=\s*[,}\]])/g, ': "$1"');
          
          // Pass 4: Remove comments and extra whitespace
          jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Line comments
          jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments
          
          // Pass 5: Fix common JSON issues from local LLMs
          // Remove any text before first { or after last }
          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          }
          
          // Pass 6: Fix unescaped newlines in strings (replace with \n)
          // This is tricky, so we'll be conservative
          jsonText = jsonText.replace(/(:\s*"[^"]*)\n([^"]*")/g, '$1\\n$2');
          
          // Pass 7: Handle truncated JSON (when Ollama hits token limits)
          // Check if JSON looks incomplete (missing closing braces)
          const openBraces = (jsonText.match(/{/g) || []).length;
          const closeBraces = (jsonText.match(/}/g) || []).length;
          if (openBraces > closeBraces) {
            // JSON is truncated - try to close it gracefully
            const missingBraces = openBraces - closeBraces;
            // Close any open string values first
            if (jsonText.match(/":\s*"[^"]*$/)) {
              jsonText = jsonText.replace(/":\s*"([^"]*)$/, '": "$1"');
            }
            // Close any open arrays/objects
            for (let i = 0; i < missingBraces; i++) {
              if (jsonText.endsWith(',')) {
                jsonText = jsonText.slice(0, -1); // Remove trailing comma
              }
              jsonText += '}';
            }
          }
          
          // Pass 8: Fix Python code leaking into JSON strings (especially in "code" field)
          // Remove Python type hints like ": str", ": int", ": dict", etc. from string values
          jsonText = jsonText.replace(/("code"\s*:\s*"[^"]*?)(:\s*str|:\s*int|:\s*float|:\s*bool|:\s*dict|:\s*list)([^"]*")/g, (match: string, prefix: string, typeHint: string, suffix: string) => {
            // Only remove if it's clearly a Python type hint in a string value
            return prefix + suffix;
          });
          
          // Pass 9: Fix incomplete Python function signatures in code strings
          // Handle cases like: "code": "...refinement_details": str" where Python syntax leaks in
          jsonText = jsonText.replace(/"code"\s*:\s*"([^"]*?)"([^,}\]]*?)"/g, (match: string, codeContent: string, leakedContent: string) => {
            // If we see leaked Python syntax after a closing quote, try to fix it
            if (leakedContent && leakedContent.match(/:\s*(str|int|float|bool|dict|list|Any)/)) {
              // Remove the leaked content (it's outside the JSON string)
              return `"code": "${codeContent}"`;
            }
            return match;
          });
          
          // Pass 10: Validate and parse with retry logic
          let abstracted: any;
          let parseAttempts = 0;
          const maxAttempts = 3;
          
          while (parseAttempts < maxAttempts) {
            try {
              abstracted = JSON.parse(jsonText);
              break; // Success!
            } catch (parseError) {
              parseAttempts++;
              
              if (parseAttempts < maxAttempts) {
                // Try more aggressive fixes
                // Fix trailing commas (more aggressive)
                jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
                // Try to fix missing quotes around keys (aggressive)
                jsonText = jsonText.replace(/([{,]\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                // Remove any remaining Python syntax in strings
                jsonText = jsonText.replace(/:\s*"([^"]*?)(:\s*(str|int|float|bool|dict|list))([^"]*?)"/g, ': "$1$3"');
              } else {
                // Final attempt failed - log and throw
                console.warn('⚠️ JSON parsing failed after', maxAttempts, 'repair attempts');
                console.warn('   Original JSON text (first 800 chars):', jsonText.substring(0, 800));
                console.warn('   Parse error:', parseError instanceof Error ? parseError.message : parseError);
                
                // Try one last time with very aggressive cleanup
                try {
                  // Remove everything after the last complete property
                  const lastCompleteProp = jsonText.lastIndexOf('"');
                  if (lastCompleteProp > 0) {
                    const truncated = jsonText.substring(0, lastCompleteProp + 1);
                    // Find matching brace
                    const openCount = (truncated.match(/{/g) || []).length;
                    const closeCount = (truncated.match(/}/g) || []).length;
                    let finalJson = truncated;
                    if (openCount > closeCount && truncated.match(/"[^"]*"\s*[,}]/)) {
                      // We have a complete property, try to close the JSON
                      finalJson = truncated.replace(/,\s*$/, '');
                      for (let i = 0; i < openCount - closeCount; i++) {
                        finalJson += '}';
                      }
                      abstracted = JSON.parse(finalJson);
                      console.warn('   ✅ Successfully parsed truncated JSON');
                      break;
                    }
                  }
                } catch (finalError) {
                  // Give up
                  throw parseError;
                }
                
                throw parseError;
              }
            }
          }
          
          // Validate required fields
          if (!abstracted.name || !abstracted.description) {
            throw new Error('Missing required fields: name or description');
          }
          
          // Verify FastMCP compatibility
          const fastMCPCompatible = this.verifyFastMCPCompatibility(abstracted);
          
          return {
            id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: abstracted.name,
            description: abstracted.description,
            parameters: abstracted.parameters || {},
            useCases: abstracted.useCases || [],
            domain: experience.domain,
            abstractionLevel: abstracted.abstractionLevel || 'parameterized',
            successRate: experience.success ? 1.0 : 0.0,
            usageCount: 1,
            toolType: abstracted.toolType || 'function',
            invocationPattern: step.action,
            derivedFrom: [],
            evolvedInto: [],
            // Store FastMCP metadata if provided
            metadata: abstracted.code || fastMCPCompatible ? {
              fastMCPCompatible: fastMCPCompatible,
              code: abstracted.code || undefined,
              interface: abstracted.interface || 'FastMCP'
            } : undefined
          };
        } catch (parseError) {
          // If JSON parsing still fails, log the actual content for debugging
          console.warn('⚠️ Tool abstraction JSON parse failed:', parseError);
          console.warn('   Attempted to parse:', jsonText.substring(0, 500));
          console.warn('   Full LLM response:', content.substring(0, 1000));
          return null;
        }
      } else {
        console.warn('⚠️ Tool abstraction: No JSON found in LLM response');
        console.warn('   Response preview:', content.substring(0, 500));
      }
    } catch (error) {
      console.warn('⚠️ Tool abstraction failed:', error);
      if (error instanceof Error) {
        console.warn('   Error details:', error.message);
      }
    }
    
    return null;
  }
  
  /**
   * Synthesize tools from multiple executions (Alita-G multi-execution)
   */
  async synthesizeToolsFromMultipleExecutions(
    experiences: Experience[],
    domain: string
  ): Promise<ToolPrimitive[]> {
    /**
     * Alita-G: Synthesize diverse tools from multiple task executions
     * 
     * 1. Extract tools from all successful trajectories
     * 2. Consolidate similar tools
     * 3. Abstract to primitives
     * 4. Return consolidated tool set
     */
    
    console.log(`🔧 Synthesizing tools from ${experiences.length} executions...`);
    
    const allTools: ToolPrimitive[] = [];
    
    // Extract tools from each experience
    for (const experience of experiences) {
      if (experience.success) {
        const tools = await this.extractToolsFromTrajectory(experience);
        allTools.push(...tools);
      }
    }
    
    // Consolidate similar tools
    const consolidated = await this.consolidateTools(allTools);
    
    console.log(`✅ Synthesized ${consolidated.length} unique tools from ${experiences.length} executions`);
    
    return consolidated;
  }
  
  /**
   * Consolidate similar tools (Alita-G style: preserve diversity, only merge highly similar)
   * Paper: "preserve the diversity of MCP implementations to maximize coverage"
   */
  private async consolidateTools(tools: ToolPrimitive[]): Promise<ToolPrimitive[]> {
    if (tools.length === 0) return [];
    
    // Use semantic similarity instead of exact name matching (preserves diversity)
    const consolidated: ToolPrimitive[] = [];
    const similarityThreshold = 0.95; // Only merge if >95% similar (very high threshold)
    
    for (const tool of tools) {
      let merged = false;
      
      // Check semantic similarity against existing tools
      for (const existing of consolidated) {
        if (existing.domain !== tool.domain) continue;
        
        // Calculate semantic similarity using embeddings if available
        const similarity = await this.calculateToolSimilarity(tool, existing);
        
        if (similarity >= similarityThreshold) {
          // Highly similar - merge (update metrics, preserve more abstract version)
          existing.successRate = (existing.successRate * existing.usageCount + tool.successRate) / (existing.usageCount + 1);
          existing.usageCount += tool.usageCount;
          
          // Merge use cases (preserve diversity)
          const combinedUseCases = [...new Set([...existing.useCases, ...tool.useCases])];
          existing.useCases = combinedUseCases;
          
          // Track evolution if more abstract
          if (this.isMoreAbstract(tool.abstractionLevel, existing.abstractionLevel)) {
            tool.derivedFrom = [existing.id];
            existing.evolvedInto = [...(existing.evolvedInto || []), tool.id];
            // Replace with more abstract version
            const index = consolidated.indexOf(existing);
            consolidated[index] = tool;
          }
          
          merged = true;
          break;
        }
      }
      
      // Not similar enough - preserve as separate tool (maintains diversity)
      if (!merged) {
        consolidated.push(tool);
      }
    }
    
    console.log(`🔧 Tool consolidation: ${tools.length} → ${consolidated.length} (preserved diversity)`);
    return consolidated;
  }
  
  /**
   * Calculate semantic similarity between two tools (using embeddings)
   */
  private async calculateToolSimilarity(tool1: ToolPrimitive, tool2: ToolPrimitive): Promise<number> {
    // If embeddings available, use cosine similarity
    if (tool1.embedding && tool2.embedding && tool1.embedding.length === tool2.embedding.length) {
      return this.cosineSimilarity(tool1.embedding, tool2.embedding);
    }
    
    // Fallback: simple text similarity on name + description
    const text1 = `${tool1.name} ${tool1.description}`.toLowerCase();
    const text2 = `${tool2.name} ${tool2.description}`.toLowerCase();
    
    // Jaccard similarity on words
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Verify FastMCP compatibility (basic checks)
   */
  private verifyFastMCPCompatibility(tool: any): boolean {
    // FastMCP requires:
    // 1. Function signature with type hints
    // 2. Standardized parameter types
    // 3. Proper error handling
    
    if (!tool.parameters || typeof tool.parameters !== 'object') {
      return false;
    }
    
    // Check if parameters have type information
    const hasTypes = Object.values(tool.parameters).every((param: any) => 
      param && typeof param === 'object' && param.type
    );
    
    // If code provided, check for function signature
    if (tool.code) {
      const hasFunctionDef = /def\s+\w+\s*\(/.test(tool.code);
      const hasTypeHints = /:\s*(str|int|float|bool|dict|list)/.test(tool.code);
      return hasFunctionDef && hasTypeHints;
    }
    
    return hasTypes;
  }
  
  private isMoreAbstract(level1: string, level2: string): boolean {
    const levels: Record<string, number> = {
      concrete: 1,
      parameterized: 2,
      primitive: 3
    };
    return (levels[level1] || 1) > (levels[level2] || 1);
  }
  
  /**
   * Get or create domain tool repository (Alita-G MCP Box)
   */
  async getDomainToolRepository(domain: string): Promise<DomainToolRepository> {
    if (!this.repositories.has(domain)) {
      const repo: DomainToolRepository = {
        domain,
        tools: new Map(),
        supabase: null
      };
      
      // Initialize Supabase connection
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          repo.supabase = createClient(supabaseUrl, supabaseKey);
          // Load existing tools from database
          await this.loadToolsFromSupabase(repo);
        }
      } catch (error) {
        console.warn('⚠️ Supabase not available for tool repository');
      }
      
      this.repositories.set(domain, repo);
    }
    
    return this.repositories.get(domain)!;
  }
  
  /**
   * Add tools to domain repository
   */
  async addToolsToRepository(
    domain: string,
    tools: ToolPrimitive[]
  ): Promise<void> {
    const repo = await this.getDomainToolRepository(domain);
    
    for (const tool of tools) {
      repo.tools.set(tool.id, tool);
      
      // Persist to Supabase if available
      if (repo.supabase) {
        await this.persistToolToSupabase(repo, tool);
      }
    }
    
    console.log(`✅ Added ${tools.length} tools to ${domain} repository`);
  }
  
  /**
   * Retrieval-augmented tool selection (Alita-G inference-time selection)
   */
  async selectTools(
    query: string,
    domain: string,
    topK: number = 5
  ): Promise<ToolPrimitive[]> {
    /**
     * Alita-G: Retrieval-augmented MCP selection using tool descriptions + use cases
     * 
     * Uses vector similarity search on tool descriptions and use cases
     */
    
    const repo = await this.getDomainToolRepository(domain);
    
    // If Supabase available, use vector search
    if (repo.supabase) {
      try {
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Use RPC function for vector search (similar to ReasoningBank)
        // Alita-G uses threshold-based selection with τ = 0.7 (paper Section 4.1, Table 3: optimal threshold)
        const { data, error } = await repo.supabase.rpc('find_similar_tools', {
          query_embedding: queryEmbedding,
          target_domain: domain,
          similarity_threshold: 0.7, // Alita-G paper: τ = 0.7 (optimal from Table 3)
          match_count: topK
        });
        
        if (data && !error) {
          return data.map((record: any) => this.toolFromSupabaseRecord(record));
        }
      } catch (error) {
        console.warn('⚠️ Vector search failed, using fallback:', error);
      }
    }
    
    // Fallback: simple similarity matching
    const tools = Array.from(repo.tools.values());
    const queryLower = query.toLowerCase();
    
    return tools
      .map(tool => ({
        tool,
        score: this.calculateToolRelevance(tool, queryLower)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.tool);
  }
  
  private calculateToolRelevance(tool: ToolPrimitive, query: string): number {
    let score = 0;
    
    // Match in description
    if (tool.description.toLowerCase().includes(query)) score += 0.4;
    
    // Match in use cases
    const useCaseMatches = tool.useCases.filter(uc => 
      uc.toLowerCase().includes(query)
    ).length;
    score += useCaseMatches * 0.3;
    
    // Success rate bonus
    score += tool.successRate * 0.2;
    
    // Usage count bonus (popular tools)
    score += Math.min(0.1, tool.usageCount / 100);
    
    return score;
  }
  
  /**
   * Generate embedding for tool/text using local embeddings
   * Uses @xenova/transformers (Xenova/bge-small-en-v1.5) - 384 dimensions
   * Better quality than all-MiniLM, 100% local, $0 cost
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use local embeddings (@xenova/transformers)
      const { createLocalEmbeddings } = await import('./local-embeddings');
      const embedder = createLocalEmbeddings();
      
      // Initialize if needed (will cache model after first load)
      await embedder.initialize();
      
      // Generate embedding (384 dimensions from BGE-small-en-v1.5)
      const embedding = await embedder.embed(text);
      
      return embedding; // 384 dimensions from BGE-small-en-v1.5
    } catch (error) {
      console.warn('⚠️ Local embedding generation failed:', error);
      // Fallback: zero vector (384 dimensions to match local model)
      return new Array(384).fill(0);
    }
  }
  
  /**
   * Persist tool to Supabase
   */
  private async persistToolToSupabase(
    repo: DomainToolRepository,
    tool: ToolPrimitive
  ): Promise<void> {
    try {
      const { error } = await repo.supabase
        .from('tool_primitives') // Would need to create this table
        .upsert({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          use_cases: tool.useCases,
          domain: tool.domain,
          abstraction_level: tool.abstractionLevel,
          success_rate: tool.successRate,
          usage_count: tool.usageCount,
          tool_type: tool.toolType,
          invocation_pattern: tool.invocationPattern,
          derived_from: tool.derivedFrom,
          evolved_into: tool.evolvedInto,
          embedding: tool.embedding,
          created_at: tool.createdAt.toISOString(),
          last_used: tool.lastUsed.toISOString()
        });
      
      if (error) {
        console.error('❌ Failed to persist tool:', error);
      }
    } catch (error) {
      console.error('❌ Error persisting tool:', error);
    }
  }
  
  /**
   * Load tools from Supabase
   */
  private async loadToolsFromSupabase(repo: DomainToolRepository): Promise<void> {
    if (!repo.supabase) return;
    
    try {
      const { data, error } = await repo.supabase
        .from('tool_primitives')
        .select('*')
        .eq('domain', repo.domain)
        .order('success_rate', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('❌ Failed to load tools:', error);
        return;
      }
      
      if (data) {
        for (const record of data) {
          const tool = this.toolFromSupabaseRecord(record);
          repo.tools.set(tool.id, tool);
        }
        
        console.log(`✅ Loaded ${data.length} tools for ${repo.domain}`);
      }
    } catch (error) {
      console.error('❌ Error loading tools:', error);
    }
  }
  
  private toolFromSupabaseRecord(record: any): ToolPrimitive {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      parameters: record.parameters || {},
      useCases: record.use_cases || [],
      domain: record.domain,
      abstractionLevel: record.abstraction_level || 'parameterized',
      successRate: record.success_rate || 0,
      usageCount: record.usage_count || 0,
      toolType: record.tool_type || 'function',
      invocationPattern: record.invocation_pattern || '',
      derivedFrom: record.derived_from || [],
      evolvedInto: record.evolved_into || [],
      embedding: record.embedding,
      createdAt: new Date(record.created_at),
      lastUsed: new Date(record.last_used)
    };
  }
  
  /**
   * Format tools for agent use (Alita-G tool injection)
   */
  formatToolsForAgent(tools: ToolPrimitive[]): string {
    if (tools.length === 0) return '';
    
    return `## Available Tools:

${tools.map(tool => `
### ${tool.name}
**Description**: ${tool.description}
**Parameters**: ${Object.entries(tool.parameters).map(([name, param]) => 
  `- ${name} (${param.type}): ${param.description}${param.required ? ' [required]' : ''}`
).join('\n')}
**Use Cases**: ${tool.useCases.join(', ')}
**Success Rate**: ${(tool.successRate * 100).toFixed(0)}%
`).join('\n')}

Use these tools when appropriate for the task.`;
  }
}

// Note: toolSynthesisEngine should be instantiated with an existing ReasoningBank instance
// This is a factory function for convenience
export function createToolSynthesisEngine(reasoningBank?: ArcMemoReasoningBank): ToolSynthesisEngine {
  return new ToolSynthesisEngine(reasoningBank || new ArcMemoReasoningBank());
}

