const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofvbywlqztkgugrkibcp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Supabase database...\n');
  
  // Check collections
  const { data: collections, error: colError } = await supabase
    .from('collections')
    .select('id, name');
  
  if (colError) {
    console.log('❌ Collections table error:', colError.message);
    console.log('⚠️  Table might not exist - migration not run yet\n');
  } else {
    console.log(`✅ Collections: ${collections?.length || 0} found`);
    if (collections && collections.length > 0) {
      collections.forEach(c => console.log(`   - ${c.name}`));
    }
    console.log('');
  }
  
  // Check memories
  const { data: memories, error: memError } = await supabase
    .from('memories')
    .select('id, content')
    .limit(5);
  
  if (memError) {
    console.log('❌ Memories table error:', memError.message);
    console.log('⚠️  Table might not exist - migration not run yet\n');
  } else {
    console.log(`✅ Memories: ${memories?.length || 0} sample records`);
    if (memories && memories.length > 0) {
      memories.forEach(m => console.log(`   - ${m.content.substring(0, 60)}...`));
    }
    console.log('');
  }
  
  // Check documents
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('id, title');
  
  if (docError) {
    console.log('❌ Documents table error:', docError.message);
    console.log('⚠️  Table might not exist - migration not run yet\n');
  } else {
    console.log(`✅ Documents: ${documents?.length || 0} found`);
    if (documents && documents.length > 0) {
      documents.forEach(d => console.log(`   - ${d.title}`));
    }
    console.log('');
  }
  
  // Final verdict
  if (colError || memError || docError) {
    console.log('🔧 VERDICT: Migration NOT run yet');
    console.log('📋 ACTION: Run the SQL migration from supabase/migrations/003_workflow_memory_system_FINAL.sql\n');
  } else if (collections?.length === 0 || memories?.length === 0) {
    console.log('🔧 VERDICT: Tables exist but NO sample data');
    console.log('📋 ACTION: Run the SQL migration to add sample data\n');
  } else {
    console.log('✅ VERDICT: Migration already run - database has data!');
    console.log('🎉 Memory Search should work with real data!\n');
  }
}

checkData();
