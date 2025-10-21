import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SQLExecutionRequest {
  query: string;
  connectionParams?: {
    url?: string;
    key?: string;
  };
}

interface SQLExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount: number;
  executionTime: number;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER' | 'OTHER';
  affectedRows?: number;
}

// Initialize Supabase client
function createSupabaseClient(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Detect query type
function detectQueryType(query: string): SQLExecutionResult['queryType'] {
  const trimmedQuery = query.trim().toUpperCase();
  
  if (trimmedQuery.startsWith('SELECT')) return 'SELECT';
  if (trimmedQuery.startsWith('INSERT')) return 'INSERT';
  if (trimmedQuery.startsWith('UPDATE')) return 'UPDATE';
  if (trimmedQuery.startsWith('DELETE')) return 'DELETE';
  if (trimmedQuery.startsWith('CREATE')) return 'CREATE';
  if (trimmedQuery.startsWith('DROP')) return 'DROP';
  if (trimmedQuery.startsWith('ALTER')) return 'ALTER';
  
  return 'OTHER';
}

// Validate query safety (basic protection against malicious queries)
function validateQuery(query: string): { valid: boolean; error?: string } {
  const trimmedQuery = query.trim();
  
  // Empty query
  if (!trimmedQuery) {
    return { valid: false, error: 'Query cannot be empty' };
  }
  
  // Check for multiple statements (basic protection)
  const semicolonCount = (trimmedQuery.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    return { valid: false, error: 'Multiple statements not allowed for security' };
  }
  
  // Check for potentially dangerous operations (basic protection)
  const dangerousPatterns = [
    /\bDROP\s+DATABASE\b/i,
    /\bDROP\s+SCHEMA\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bCREATE\s+USER\b/i,
    /\bALTER\s+USER\b/i,
    /\bDROP\s+USER\b/i,
    /pg_/i, // PostgreSQL system functions
    /\bCOPY\s+FROM\b/i,
    /\bCOPY\s+TO\b/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedQuery)) {
      return { valid: false, error: 'This operation is not allowed for security reasons' };
    }
  }
  
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: SQLExecutionRequest = await request.json();
    const { query, connectionParams } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate query
    const validation = validateQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const queryType = detectQueryType(query);

    console.log(`🔍 SQL Execution: ${queryType} query`);
    console.log(`   Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

    // Create Supabase client
    const supabase = createSupabaseClient(connectionParams?.url, connectionParams?.key);

    let result: SQLExecutionResult;

    try {
      // Execute query based on type
      if (queryType === 'SELECT') {
        // Use RPC for SELECT queries
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: query
        });

        if (error) {
          throw error;
        }

        result = {
          success: true,
          data: data || [],
          rowCount: Array.isArray(data) ? data.length : 0,
          executionTime: Date.now() - startTime,
          queryType
        };
      } else {
        // For other query types, we need to use a different approach
        // This is a simplified implementation - in production you'd want more sophisticated handling
        
        // Try using RPC first
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: query
        });

        if (error) {
          throw error;
        }

        result = {
          success: true,
          data: data || [],
          rowCount: Array.isArray(data) ? data.length : 0,
          executionTime: Date.now() - startTime,
          queryType,
          affectedRows: queryType === 'INSERT' || queryType === 'UPDATE' || queryType === 'DELETE' ? 1 : undefined
        };
      }

      console.log(`   ✅ Success: ${result.rowCount} rows, ${result.executionTime}ms`);

      return NextResponse.json(result);

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      console.log(`   ❌ Error: ${error.message}`);

      result = {
        success: false,
        error: error.message || 'Unknown error occurred',
        rowCount: 0,
        executionTime,
        queryType
      };

      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ SQL Execution API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        rowCount: 0,
        executionTime: 0,
        queryType: 'OTHER'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
