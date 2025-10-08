// ================================================================================================
// SUPABASE CONNECTION TEST
// ================================================================================================
// This script tests if the Supabase connection is working properly

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './frontend/.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Environment Variables:');
  console.log(`  URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env.local');
    return false;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    // Test connection with a simple query
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`❌ Database query failed: ${error.message}`);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Users table accessible`);

    // Test vector functions
    console.log('🔍 Testing vector functions...');
    const { data: functions, error: funcError } = await supabase
      .rpc('match_memories', {
        query_embedding: Array(1536).fill(0.1), // Dummy vector
        match_threshold: 0.5,
        match_count: 1
      });

    if (funcError) {
      console.log(`❌ Vector function test failed: ${funcError.message}`);
      return false;
    }

    console.log('✅ Vector functions working');
    console.log(`📊 match_memories function accessible`);

    // Test collections
    console.log('🔍 Testing collections...');
    const { data: collections, error: collError } = await supabase
      .from('collections')
      .select('id, name, description')
      .limit(5);

    if (collError) {
      console.log(`❌ Collections query failed: ${collError.message}`);
      return false;
    }

    console.log('✅ Collections accessible');
    console.log(`📊 Found ${collections.length} collections`);

    // Test memories
    console.log('🔍 Testing memories...');
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('id, content, source')
      .limit(5);

    if (memError) {
      console.log(`❌ Memories query failed: ${memError.message}`);
      return false;
    }

    console.log('✅ Memories accessible');
    console.log(`📊 Found ${memories.length} memories`);

    console.log('\n🎉 ALL TESTS PASSED! Supabase is fully functional.');
    return true;

  } catch (error) {
    console.log(`❌ Connection test failed: ${error.message}`);
    console.log(`   Error details: ${error.cause?.message || 'No additional details'}`);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Supabase is ready for workflow execution!');
      process.exit(0);
    } else {
      console.log('\n❌ Supabase connection issues detected.');
      console.log('🔧 Troubleshooting:');
      console.log('  1. Check your internet connection');
      console.log('  2. Verify Supabase URL and service key');
      console.log('  3. Ensure Supabase project is active');
      console.log('  4. Run the database migration if not done');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log(`\n💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });
