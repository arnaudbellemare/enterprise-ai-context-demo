/**
 * Supabase SQL Execution API
 * Safely execute SQL queries for structured data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { query, domain, parameters } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'SQL query required' }, { status: 400 });
    }

    // Security: Only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return NextResponse.json({
        error: 'Only SELECT queries are allowed for security reasons'
      }, { status: 403 });
    }

    // Security: Block dangerous keywords
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
    if (dangerousKeywords.some(keyword => trimmedQuery.includes(keyword))) {
      return NextResponse.json({
        error: 'Query contains dangerous keywords'
      }, { status: 403 });
    }

    const startTime = Date.now();

    // Execute the query
    const { data, error } = await supabase.rpc('execute_safe_sql', {
      sql_query: query,
      query_domain: domain || 'general'
    });

    const executionTime = Date.now() - startTime;

    if (error) {
      console.error('SQL execution error:', error);
      
      // Return mock data as fallback
      return NextResponse.json({
        success: false,
        error: error.message,
        rows: [],
        executionTime,
        note: 'SQL execution failed, returning empty result'
      });
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
      rowCount: data?.length || 0,
      executionTime,
      domain
    });

  } catch (error: any) {
    console.error('SQL API error:', error);
    return NextResponse.json({
      error: 'Failed to execute SQL query',
      details: error.message
    }, { status: 500 });
  }
}

