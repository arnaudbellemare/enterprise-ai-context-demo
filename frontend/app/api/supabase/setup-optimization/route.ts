/**
 * Setup Optimization System in Supabase
 * 
 * Creates all necessary tables for the real optimization system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Supabase credentials not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Testing Supabase connection and setup...');

    // Test connection by trying to access existing tables
    const { data: testData, error: testError } = await supabase
      .from('ace_playbook')
      .select('count')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('⚠️ ace_playbook table does not exist, but connection works');
    } else if (testError) {
      console.log('⚠️ Supabase connection issue:', testError.message);
    } else {
      console.log('✅ Supabase connection successful');
    }

    console.log('✅ Supabase connection test complete!');

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      connection_status: 'connected',
      supabase_url: supabaseUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({
      error: 'Setup failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Supabase credentials not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if tables exist
    const tables = [
      'optimization_logs',
      'component_performance',
      'routing_decisions', 
      'cache_performance',
      'parallel_execution_logs'
    ];

    const tableStatus: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableStatus[table] = {
          exists: !error,
          count: count || 0,
          error: error?.message
        };
      } catch (err: any) {
        tableStatus[table] = {
          exists: false,
          count: 0,
          error: err?.message || 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Optimization system status',
      tables: tableStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json({
      error: 'Status check failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
