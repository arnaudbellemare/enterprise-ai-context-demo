/**
 * Check Database Setup
 * Verifies email_accounts table exists and is accessible
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('email_accounts')
      .select('id')
      .limit(1);

    if (testError) {
      // Check if error message contains HTML (Supabase is down)
      const errorMessage = testError.message || '';
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html') || errorMessage.includes('Cloudflare') || errorMessage.includes('521')) {
        return NextResponse.json({
          success: false,
          error: 'Supabase server is currently unavailable',
          message: 'Your Supabase instance appears to be down (Cloudflare Error 521). Please check your Supabase project status.',
          code: 'SUPABASE_DOWN',
          fix: '1. Check Supabase Dashboard for project status\n2. Verify your Supabase URL is correct\n3. Wait a few minutes and try again'
        }, { status: 503 });
      }
      
      // Check if table doesn't exist
      if (testError.code === 'PGRST116' || errorMessage.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Table email_accounts does not exist',
          message: 'Please run migration: supabase/migrations/017_email_oauth_tokens.sql',
          migrationFile: 'supabase/migrations/017_email_oauth_tokens.sql',
          fix: 'Go to Supabase Dashboard > SQL Editor and run the migration file'
        });
      }

      return NextResponse.json({
        success: false,
        error: testError.message,
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      });
    }

    // Test 2: Try to insert a test record (then delete it)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('email_accounts')
      .insert({
        user_id: 'test',
        provider: 'outlook',
        email: testEmail,
        access_token: 'test-token',
        is_active: true
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot insert into email_accounts',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      });
    }

    // Clean up test record
    if (insertData?.id) {
      await supabase
        .from('email_accounts')
        .delete()
        .eq('id', insertData.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Database is properly configured',
      tableExists: true,
      canRead: true,
      canWrite: true,
      testRecord: 'Created and deleted successfully'
    });

  } catch (error: any) {
    const errorMessage = error.message || String(error);
    
    // Check if error contains HTML (Supabase is down)
    if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html') || errorMessage.includes('Cloudflare') || errorMessage.includes('521')) {
      return NextResponse.json({
        success: false,
        error: 'Supabase server is currently unavailable',
        message: 'Your Supabase instance appears to be down (Cloudflare Error 521). Please check your Supabase project status.',
        code: 'SUPABASE_DOWN',
        fix: '1. Check Supabase Dashboard for project status\n2. Verify your Supabase URL is correct\n3. Wait a few minutes and try again'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage.length > 500 ? errorMessage.substring(0, 500) + '...' : errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

