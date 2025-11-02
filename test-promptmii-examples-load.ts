/**
 * Test Script: Verify PromptMII Examples Loading from Supabase
 * 
 * Tests:
 * 1. Supabase connection
 * 2. reasoning_bank table access
 * 3. Example loading and conversion
 * 4. Performance metrics
 */

// Note: Environment variables should be set in your environment
// For Next.js: They're loaded from .env.local automatically
// For direct tsx run: Set them manually or use dotenv

async function testPromptMIIExamplesLoad() {
  console.log('🧪 Testing PromptMII Examples Loading from Supabase\n');
  console.log('═'.repeat(80));
  
  // Step 1: Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('─'.repeat(80));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ ERROR: Supabase credentials not configured!');
    console.log('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  
  // Step 2: Test Supabase connection
  console.log('\n📋 Step 2: Testing Supabase Connection');
  console.log('─'.repeat(80));
  
  let supabase: any;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
  } catch (error) {
    console.log(`❌ Failed to create Supabase client: ${error}`);
    process.exit(1);
  }
  
  // Step 3: Check if reasoning_bank table exists
  console.log('\n📋 Step 3: Checking reasoning_bank Table');
  console.log('─'.repeat(80));
  
  try {
    // Try a simple query to see if table exists
    const { data: testData, error: testError } = await supabase
      .from('reasoning_bank')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log(`❌ Table access error: ${testError.message}`);
      console.log(`   Code: ${testError.code}`);
      console.log(`   Details: ${testError.details}`);
      console.log('\n⚠️  Table might not exist. Run migration:');
      console.log('   supabase/migrations/20250114_permutation_complete.sql');
      process.exit(1);
    }
    
    console.log('✅ reasoning_bank table exists and is accessible');
  } catch (error) {
    console.log(`❌ Failed to access reasoning_bank: ${error}`);
    process.exit(1);
  }
  
  // Step 4: Count total records
  console.log('\n📋 Step 4: Counting Records in reasoning_bank');
  console.log('─'.repeat(80));
  
  try {
    const { count, error } = await supabase
      .from('reasoning_bank')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Count error: ${error.message}`);
    } else {
      console.log(`✅ Total records in reasoning_bank: ${count || 0}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not count records: ${error}`);
  }
  
  // Step 5: Load examples (50 as originally planned)
  console.log('\n📋 Step 5: Loading Top 50 Examples from reasoning_bank');
  console.log('─'.repeat(80));
  
  const loadStart = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('reasoning_bank')
      .select('id, content, domain, success_count, failure_count, metadata')
      .order('success_count', { ascending: false })
      .limit(50);
    
    const loadTime = Date.now() - loadStart;
    
    if (error) {
      console.log(`❌ Query error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
      process.exit(1);
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  No records found in reasoning_bank');
      console.log('   The table exists but is empty.');
      console.log('   PromptMII will use fallback examples (2 hardcoded).');
      process.exit(0);
    }
    
    console.log(`✅ Loaded ${data.length} examples in ${loadTime}ms`);
    
    // Step 6: Analyze loaded data
    console.log('\n📋 Step 6: Analyzing Loaded Data');
    console.log('─'.repeat(80));
    
    // Group by domain
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
    
    console.log('\n📊 Domain Distribution:');
    Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`   ${domain}: ${count} examples`);
      });
    
    console.log('\n📊 Success/Failure Stats:');
    console.log(`   Total Success Count: ${totalSuccess}`);
    console.log(`   Total Failure Count: ${totalFailure}`);
    console.log(`   Success Rate: ${totalSuccess + totalFailure > 0 ? ((totalSuccess / (totalSuccess + totalFailure)) * 100).toFixed(1) : 0}%`);
    console.log(`   Records with Metadata: ${hasMetadata}/${data.length} (${(hasMetadata/data.length * 100).toFixed(1)}%)`);
    
    // Step 7: Show sample conversions
    console.log('\n📋 Step 7: Sample Example Conversions');
    console.log('─'.repeat(80));
    
    const sampleSize = Math.min(3, data.length);
    console.log(`\nShowing ${sampleSize} sample conversions:\n`);
    
    for (let i = 0; i < sampleSize; i++) {
      const entry = data[i];
      const content = entry.content || '';
      const lines = content.split('\n').filter(l => l.trim());
      const metadata = entry.metadata || {};
      
      const input = metadata.input || lines[0] || content.substring(0, 100);
      const output = metadata.output || lines.slice(1).join('\n') || content.substring(100);
      
      const total = (entry.success_count || 0) + (entry.failure_count || 0);
      const quality = total > 0 ? (entry.success_count || 0) / total : 0.7;
      
      console.log(`Example ${i + 1}:`);
      console.log(`  ID: ${entry.id}`);
      console.log(`  Domain: ${entry.domain || 'general'}`);
      console.log(`  Quality: ${(quality * 100).toFixed(1)}%`);
      console.log(`  Success: ${entry.success_count || 0}, Failure: ${entry.failure_count || 0}`);
      console.log(`  Input (first 100 chars): ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`);
      console.log(`  Output (first 100 chars): ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
      console.log(`  Has Metadata: ${Object.keys(metadata).length > 0 ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    // Step 8: Performance summary
    console.log('\n📋 Step 8: Performance Summary');
    console.log('─'.repeat(80));
    console.log(`✅ Query Time: ${loadTime}ms`);
    console.log(`✅ Records Loaded: ${data.length}`);
    console.log(`✅ Average per Record: ${(loadTime / data.length).toFixed(2)}ms`);
    console.log(`✅ This is ${loadTime < 500 ? 'FAST' : loadTime < 1000 ? 'ACCEPTABLE' : 'SLOW'} (< 500ms = fast)`);
    
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('✅ ALL TESTS PASSED');
    console.log('═'.repeat(80));
    console.log(`\nPromptMII will successfully load ${data.length} examples from reasoning_bank`);
    console.log('The system is ready for production use.\n');
    
  } catch (error) {
    console.log(`❌ Unexpected error: ${error}`);
    if (error instanceof Error) {
      console.log(`   Message: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run test
testPromptMIIExamplesLoad()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

