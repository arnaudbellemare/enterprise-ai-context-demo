/**
 * Test Supabase Connection
 * Use this to verify Supabase is configured correctly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const checks = {
    supabaseUrl: {
      set: !!supabaseUrl,
      value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET'
    },
    supabaseKey: {
      set: !!supabaseKey,
      value: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET'
    },
    connection: null as any,
    tableExists: null as any
  };

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      message: 'Supabase environment variables not configured',
      checks
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection by querying email_accounts table
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id')
      .limit(1);

    checks.connection = {
      success: !error,
      error: error?.message || null
    };

    checks.tableExists = {
      success: !error || error.code !== 'PGRST116', // PGRST116 = table not found
      error: error?.code === 'PGRST116' ? 'Table email_accounts does not exist. Run migration 017_email_oauth_tokens.sql' : null
    };

    return NextResponse.json({
      success: !error,
      message: error ? 'Supabase connection failed' : 'Supabase connection successful',
      checks,
      recommendation: error?.code === 'PGRST116' 
        ? 'Run migration: supabase/migrations/017_email_oauth_tokens.sql in Supabase SQL Editor'
        : null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Supabase',
      error: error.message,
      checks
    });
  }
}

