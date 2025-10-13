/**
 * SQL Generation for Structured Data Retrieval
 * 
 * Based on Cursor/Notion production insights:
 * "Spreadsheets: vectors become noise. Generate SQL instead."
 * 
 * Strategy:
 * 1. Detect structured data (spreadsheets, databases, tables)
 * 2. Generate SQL query instead of semantic search
 * 3. Execute query against structured data
 * 4. Return precise results
 * 
 * Expected improvement: +30% accuracy on structured data
 */

export interface StructuredDataSource {
  type: 'spreadsheet' | 'database' | 'table' | 'csv';
  name: string;
  schema: ColumnSchema[];
  connection?: any;  // Database connection or file path
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  description?: string;
}

export interface SQLGenerationConfig {
  max_sql_length: number;
  use_semantic_search_fallback: boolean;
  enable_query_validation: boolean;
  enable_query_explanation: boolean;
}

export interface GeneratedSQL {
  query: string;
  explanation: string;
  confidence: number;
  tables_used: string[];
  estimated_rows: number;
}

export class SQLGenerationRetrieval {
  private config: SQLGenerationConfig;
  private llm?: any;
  private dataSources: Map<string, StructuredDataSource>;

  constructor(config: Partial<SQLGenerationConfig> = {}, llm?: any) {
    this.config = {
      max_sql_length: config.max_sql_length || 1000,
      use_semantic_search_fallback: config.use_semantic_search_fallback ?? true,
      enable_query_validation: config.enable_query_validation ?? true,
      enable_query_explanation: config.enable_query_explanation ?? true
    };
    this.llm = llm;
    this.dataSources = new Map();
  }

  /**
   * Register a structured data source
   */
  registerDataSource(source: StructuredDataSource): void {
    this.dataSources.set(source.name, source);
    console.log(`✅ Registered data source: ${source.name} (${source.type})`);
    console.log(`   Columns: ${source.schema.length}`);
  }

  /**
   * Detect if query should use SQL (vs semantic search)
   */
  shouldUseSQL(query: string, dataType?: string): boolean {
    // Explicit data type
    if (dataType && ['spreadsheet', 'database', 'table', 'csv'].includes(dataType)) {
      return true;
    }

    // Heuristics for structured data queries
    const sqlIndicators = [
      // Aggregation
      /\b(sum|average|total|count|max|min|avg)\b/i,
      // Comparison
      /\b(greater than|less than|equal to|between|more than|under|over)\b/i,
      // Filtering
      /\b(where|with|having|that have|that are|containing)\b/i,
      // Sorting
      /\b(top|bottom|highest|lowest|first|last|ordered by|sorted by)\b/i,
      // Specific columns
      /\b(column|field|row|cell|sheet|table)\b/i,
      // Dates/numbers
      /\b(in \d{4}|on \d{1,2}\/\d{1,2}|between \d+)/i
    ];

    return sqlIndicators.some(pattern => pattern.test(query));
  }

  /**
   * Generate SQL query from natural language
   */
  async generateSQL(
    query: string,
    dataSource: StructuredDataSource
  ): Promise<GeneratedSQL> {
    console.log(`\n🗄️  Generating SQL for structured query`);
    console.log(`   Query: "${query}"`);
    console.log(`   Data source: ${dataSource.name} (${dataSource.type})`);

    if (!this.llm) {
      throw new Error('LLM required for SQL generation');
    }

    // Build schema description
    const schemaDesc = this.buildSchemaDescription(dataSource);

    const prompt = `You are an expert SQL query generator. Generate a SQL query to answer the user's question.

DATA SOURCE: ${dataSource.name}
TYPE: ${dataSource.type}

SCHEMA:
${schemaDesc}

USER QUESTION: "${query}"

Requirements:
1. Generate valid SQL (SELECT statements only, no mutations)
2. Use proper column names from schema
3. Add appropriate WHERE, ORDER BY, LIMIT clauses
4. Use aggregations if needed (SUM, AVG, COUNT, etc.)
5. Keep query efficient and focused

Output format:
SQL:
[your SQL query here]

EXPLANATION:
[brief explanation of what the query does]

CONFIDENCE: [0.0-1.0]

Generate the SQL query now:`;

    try {
      const response = await this.llm.generateText({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,  // Low temp for precise SQL
        max_tokens: 800
      });

      const parsed = this.parseGeneratedSQL(response.text, dataSource);
      
      console.log(`   ✅ Generated SQL (confidence: ${parsed.confidence})`);
      console.log(`   Query: ${parsed.query.substring(0, 100)}...`);

      // Validate if enabled
      if (this.config.enable_query_validation) {
        this.validateSQL(parsed.query, dataSource);
      }

      return parsed;
    } catch (error) {
      console.error('SQL generation failed:', error);
      throw error;
    }
  }

  /**
   * Build schema description for LLM
   */
  private buildSchemaDescription(dataSource: StructuredDataSource): string {
    const lines: string[] = [];

    lines.push(`Table: ${dataSource.name}`);
    lines.push('Columns:');

    for (const col of dataSource.schema) {
      const nullable = col.nullable ? 'NULL' : 'NOT NULL';
      const desc = col.description ? ` -- ${col.description}` : '';
      lines.push(`  - ${col.name} (${col.type}, ${nullable})${desc}`);
    }

    return lines.join('\n');
  }

  /**
   * Parse generated SQL from LLM response
   */
  private parseGeneratedSQL(text: string, dataSource: StructuredDataSource): GeneratedSQL {
    // Extract SQL
    const sqlMatch = text.match(/SQL:\s*\n([\s\S]+?)(?:\n\nEXPLANATION:|EXPLANATION:|\n\nCONFIDENCE:|CONFIDENCE:|$)/i);
    const sql = sqlMatch ? sqlMatch[1].trim() : '';

    // Extract explanation
    const explMatch = text.match(/EXPLANATION:\s*\n([\s\S]+?)(?:\n\nCONFIDENCE:|CONFIDENCE:|$)/i);
    const explanation = explMatch ? explMatch[1].trim() : 'No explanation provided';

    // Extract confidence
    const confMatch = text.match(/CONFIDENCE:\s*([0-9.]+)/i);
    const confidence = confMatch ? parseFloat(confMatch[1]) : 0.7;

    // Extract tables used
    const tables = this.extractTablesFromSQL(sql);

    return {
      query: sql,
      explanation,
      confidence,
      tables_used: tables,
      estimated_rows: 0  // Will be filled after execution
    };
  }

  /**
   * Extract table names from SQL
   */
  private extractTablesFromSQL(sql: string): string[] {
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_,\s]+)/i);
    if (!fromMatch) return [];

    return fromMatch[1]
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  /**
   * Validate SQL query
   */
  private validateSQL(sql: string, dataSource: StructuredDataSource): void {
    // Check for mutations (only SELECT allowed)
    if (/(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+/i.test(sql)) {
      throw new Error('Only SELECT queries allowed');
    }

    // Check that used columns exist
    const usedColumns = this.extractColumnsFromSQL(sql);
    const validColumns = new Set(dataSource.schema.map(c => c.name.toLowerCase()));

    for (const col of usedColumns) {
      if (!validColumns.has(col.toLowerCase())) {
        throw new Error(`Invalid column: ${col}`);
      }
    }

    console.log('   ✅ SQL validation passed');
  }

  /**
   * Extract column names from SQL
   */
  private extractColumnsFromSQL(sql: string): string[] {
    const columns: string[] = [];

    // Simple column extraction (can be enhanced)
    const words = sql.split(/[\s,()]+/);
    
    for (const word of words) {
      if (word && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)) {
        // Skip SQL keywords
        const keywords = new Set(['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER']);
        if (!keywords.has(word.toUpperCase())) {
          columns.push(word);
        }
      }
    }

    return columns;
  }

  /**
   * Execute SQL query (simplified - would use real DB in production)
   */
  async executeSQL(
    generatedSQL: GeneratedSQL,
    dataSource: StructuredDataSource
  ): Promise<any[]> {
    console.log(`\n🗄️  Executing SQL query`);
    console.log(`   Source: ${dataSource.name}`);

    // In production, this would execute against real database
    // For now, return mock results
    console.log(`   ⚠️  Mock execution (implement real DB connection in production)`);
    
    return [
      { note: 'Mock result - implement real DB execution', query: generatedSQL.query }
    ];
  }

  /**
   * Smart retrieval: SQL or semantic search
   */
  async smartRetrieval(
    query: string,
    dataSourceName: string,
    fallbackSearchFn?: (q: string) => Promise<any[]>
  ): Promise<any[]> {
    console.log(`\n🔍 Smart Retrieval`);
    console.log(`   Query: "${query}"`);
    console.log(`   Source: ${dataSourceName}`);

    const dataSource = this.dataSources.get(dataSourceName);
    if (!dataSource) {
      console.log(`   ⚠️  Data source not found, using fallback`);
      return fallbackSearchFn ? await fallbackSearchFn(query) : [];
    }

    // Decide: SQL or semantic search?
    const useSQL = this.shouldUseSQL(query, dataSource.type);

    if (useSQL) {
      console.log(`   ✅ Using SQL (structured data detected)`);
      
      try {
        const generatedSQL = await this.generateSQL(query, dataSource);
        const results = await this.executeSQL(generatedSQL, dataSource);
        
        console.log(`   ✅ Retrieved ${results.length} results via SQL`);
        return results;
      } catch (error) {
        console.error('SQL retrieval failed:', error);
        
        // Fallback to semantic search if enabled
        if (this.config.use_semantic_search_fallback && fallbackSearchFn) {
          console.log(`   ⚠️  Falling back to semantic search`);
          return await fallbackSearchFn(query);
        }
        
        throw error;
      }
    } else {
      console.log(`   ✅ Using semantic search (unstructured query)`);
      return fallbackSearchFn ? await fallbackSearchFn(query) : [];
    }
  }

  /**
   * Batch SQL generation for multiple queries
   */
  async batchGenerateSQL(
    queries: string[],
    dataSource: StructuredDataSource
  ): Promise<GeneratedSQL[]> {
    console.log(`\n🗄️  Batch SQL generation`);
    console.log(`   Queries: ${queries.length}`);
    console.log(`   Source: ${dataSource.name}`);

    const results = await Promise.all(
      queries.map(q => this.generateSQL(q, dataSource).catch(() => ({
        query: '',
        explanation: 'Generation failed',
        confidence: 0,
        tables_used: [],
        estimated_rows: 0
      })))
    );

    const successful = results.filter(r => r.confidence > 0.5);
    console.log(`   ✅ Generated ${successful.length}/${queries.length} SQL queries`);

    return results;
  }

  /**
   * Get registered data sources
   */
  getDataSources(): StructuredDataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * Set LLM client
   */
  setLLM(llm: any): void {
    this.llm = llm;
  }
}

/**
 * Helper: Create SQL generation retrieval
 */
export function createSQLGenerationRetrieval(llm?: any): SQLGenerationRetrieval {
  return new SQLGenerationRetrieval({}, llm);
}

/**
 * Helper: Quick structured data query
 */
export async function queryStructuredData(
  query: string,
  dataSource: StructuredDataSource,
  llm: any
): Promise<any[]> {
  const sqlGen = new SQLGenerationRetrieval({}, llm);
  sqlGen.registerDataSource(dataSource);
  
  const generatedSQL = await sqlGen.generateSQL(query, dataSource);
  return await sqlGen.executeSQL(generatedSQL, dataSource);
}

/**
 * Helper: Detect if query needs SQL
 */
export function needsSQL(query: string): boolean {
  const sqlGen = new SQLGenerationRetrieval();
  return sqlGen.shouldUseSQL(query);
}

