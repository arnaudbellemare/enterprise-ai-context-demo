/**
 * List All Email Accounts (Diagnostic)
 * Shows all accounts regardless of userId for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get all accounts without filtering by userId
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('connected_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accounts: data || [],
      count: (data || []).length,
      message: `Found ${(data || []).length} account(s) in database`
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

