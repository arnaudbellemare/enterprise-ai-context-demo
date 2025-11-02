/**
 * Test API: Verify PromptMII Examples Loading from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: any = {
    steps: [],
    success: false,
    examplesLoaded: 0,
    loadTime: 0
  };
  
  try {
    // Step 1: Check environment variables
    results.steps.push({
      step: 1,
      name: 'Check Environment Variables',
      status: 'running'
    });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      results.steps[0].status = 'failed';
      results.steps[0].error = 'Missing Supabase credentials';
      return NextResponse.json(results, { status: 500 });
    }
    
    results.steps[0].status = 'success';
    results.steps[0].details = {
      urlSet: !!supabaseUrl,
      keySet: !!supabaseKey
    };
    
    // Step 2: Test Supabase connection
    results.steps.push({
      step: 2,
      name: 'Test Supabase Connection',
      status: 'running'
    });
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    results.steps[1].status = 'success';
    results.steps[1].details = { clientCreated: true };
    
    // Step 3: Check table exists
    results.steps.push({
      step: 3,
      name: 'Check reasoning_bank Table',
      status: 'running'
    });
    
    const { data: testData, error: testError } = await supabase
      .from('reasoning_bank')
      .select('count')
      .limit(1);
    
    if (testError) {
      results.steps[2].status = 'failed';
      results.steps[2].error = testError.message;
      results.steps[2].details = {
        code: testError.code,
        details: testError.details
      };
      return NextResponse.json(results, { status: 500 });
    }
    
    results.steps[2].status = 'success';
    
    // Step 4: Count records
    results.steps.push({
      step: 4,
      name: 'Count Records',
      status: 'running'
    });
    
    const { count, error: countError } = await supabase
      .from('reasoning_bank')
      .select('*', { count: 'exact', head: true });
    
    results.steps[3].status = countError ? 'warning' : 'success';
    results.steps[3].details = {
      totalRecords: count || 0,
      error: countError?.message
    };
    
    // Step 5: Load examples (50 as originally planned)
    results.steps.push({
      step: 5,
      name: 'Load Top 50 Examples',
      status: 'running'
    });
    
    const loadStart = Date.now();
    
    const { data, error } = await supabase
      .from('reasoning_bank')
      .select('id, content, domain, success_count, failure_count, metadata')
      .order('success_count', { ascending: false })
      .limit(50);
    
    const loadTime = Date.now() - loadStart;
    
    if (error) {
      results.steps[4].status = 'failed';
      results.steps[4].error = error.message;
      return NextResponse.json(results, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      results.steps[4].status = 'warning';
      results.steps[4].details = {
        message: 'Table exists but is empty',
        examplesLoaded: 0
      };
      results.examplesLoaded = 0;
      results.loadTime = loadTime;
      return NextResponse.json(results);
    }
    
    results.steps[4].status = 'success';
    results.steps[4].details = {
      examplesLoaded: data.length,
      loadTime: `${loadTime}ms`,
      avgPerRecord: `${(loadTime / data.length).toFixed(2)}ms`
    };
    
    // Step 6: Analyze data
    results.steps.push({
      step: 6,
      name: 'Analyze Loaded Data',
      status: 'running'
    });
    
    const domainCounts: Record<string, number> = {};
    let totalSuccess = 0;
    let totalFailure = 0;
    let hasMetadata = 0;
    
    data.forEach((entry: any) => {
      const domain = entry.domain || 'unknown';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      totalSuccess += entry.success_count || 0;
      totalFailure += entry.failure_count || 0;
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        hasMetadata++;
      }
    });
    
    results.steps[5].status = 'success';
    results.steps[5].details = {
      domainDistribution: domainCounts,
      totalSuccess,
      totalFailure,
      successRate: totalSuccess + totalFailure > 0 
        ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1) + '%'
        : 'N/A',
      recordsWithMetadata: `${hasMetadata}/${data.length} (${(hasMetadata/data.length * 100).toFixed(1)}%)`
    };
    
    // Step 7: Show sample conversions
    results.steps.push({
      step: 7,
      name: 'Sample Conversions',
      status: 'running'
    });
    
    const samples = data.slice(0, 3).map((entry: any, idx: number) => {
      const content = entry.content || '';
      const lines = content.split('\n').filter((l: string) => l.trim());
      const metadata = entry.metadata || {};
      
      const input = metadata.input || lines[0] || content.substring(0, 100);
      const output = metadata.output || lines.slice(1).join('\n') || content.substring(100);
      
      const total = (entry.success_count || 0) + (entry.failure_count || 0);
      const quality = total > 0 ? (entry.success_count || 0) / total : 0.7;
      
      return {
        id: entry.id,
        domain: entry.domain || 'general',
        quality: (quality * 100).toFixed(1) + '%',
        success: entry.success_count || 0,
        failure: entry.failure_count || 0,
        inputPreview: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        outputPreview: output.substring(0, 100) + (output.length > 100 ? '...' : ''),
        hasMetadata: Object.keys(metadata).length > 0
      };
    });
    
    results.steps[6].status = 'success';
    results.steps[6].details = { samples };
    
    // Final summary
    results.success = true;
    results.examplesLoaded = data.length;
    results.loadTime = loadTime;
    results.summary = {
      connectionStatus: '✅ Connected',
      tableAccess: '✅ Accessible',
      recordsFound: count || 0,
      examplesLoaded: data.length,
      loadTime: `${loadTime}ms`,
      performance: loadTime < 500 ? 'FAST' : loadTime < 1000 ? 'ACCEPTABLE' : 'SLOW',
      readyForProduction: true
    };
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    results.error = error.message;
    results.stack = error.stack;
    return NextResponse.json(results, { status: 500 });
  }
}

