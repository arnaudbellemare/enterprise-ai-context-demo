require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
  console.log('📋 Active Learning Queue Status\n');
  
  // Check pending items
  const { data: pending, error: pendingError } = await supabase
    .from('email_labeling_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(20);
  
  if (pendingError) {
    console.error('Error:', pendingError);
    return;
  }
  
  console.log(`Pending items: ${pending?.length || 0}\n`);
  
  if (pending && pending.length > 0) {
    console.log('Top items by priority:');
    pending.forEach((item, i) => {
      const conf = ((item.confidence || 0) * 100).toFixed(1);
      const unc = ((item.uncertainty || 0) * 100).toFixed(1);
      const div = ((item.diversity || 0) * 100).toFixed(1);
      const pri = (item.priority || 0).toFixed(3);
      
      console.log(`\n${i + 1}. ${item.predicted_template_name || 'Unknown'}`);
      console.log(`   Confidence: ${conf}% | Uncertainty: ${unc}% | Diversity: ${div}% | Priority: ${pri}`);
      console.log(`   Preview: ${item.email_text?.substring(0, 100)}...`);
      
      // Explain why it was flagged
      const reasons = [];
      if (item.confidence < 0.4) reasons.push('Very low confidence');
      if (item.confidence >= 0.3 && item.confidence < 0.75) reasons.push('Low confidence');
      if (item.diversity > 0.7) reasons.push('High diversity');
      if (reasons.length > 0) {
        console.log(`   Flagged because: ${reasons.join(', ')}`);
      }
    });
  } else {
    console.log('No pending items in queue.');
    console.log('\n💡 The system will flag emails when:');
    console.log('   - Confidence < 75% AND >= 30% (low confidence)');
    console.log('   - Confidence < 40% (very low confidence)');
    console.log('   - Multiple intents detected');
    console.log('   - High semantic diversity (>70%) from existing examples');
  }
  
  // Check labeled examples count
  const { count: labeledCount } = await supabase
    .from('email_labeled_examples')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Labeled Examples: ${labeledCount || 0}`);
  
  if (labeledCount === 0) {
    console.log('\n⚠️  No labeled examples in database yet.');
    console.log('   Import your existing labeled examples to enable semantic diversity calculation.');
  }
}

checkQueue().catch(console.error);
