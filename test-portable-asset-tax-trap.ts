/**
 * Test: Portable Asset Tax Trap Query
 * 
 * Full query and answer for cross-border tax planning scenario
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';
import * as fs from 'fs';

async function testPortableAssetTaxTrap() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 PORTABLE ASSET TAX TRAP - FULL TEST');
  console.log('='.repeat(100));

  const query = `The portable asset tax trap

Jewelry, art, and collectibles can trigger tax events the moment they cross a border.

I've tracked this pattern in family office operations for years. Pristine domestic plans that unravel at customs because no one mapped situs and ownership properly.

Picture this scenario:

A $2M art collection moves from New York to London. The family's Delaware LLC structure? Worthless to UK tax authorities.

Most ultra-high-net-worth families hold assets everywhere. Their estate plans treat each location like separate islands.

→ Singapore has automatic cremation policies without explicit instructions
→ Children lack recognized guardians when US will provisions go missing
→ Portable assets become perfect storms crossing borders

Only 580,000 people globally cross the $30M threshold.

Yet most maintain international assets without cross-border planning.

Families spend $3.2M annually running their offices... still lack proper international reporting frameworks. The planning gaps create total chaos.

Here's what happens:

Traditional approaches miss how interconnected everything really is. When you hold assets through multiple entities across different jurisdictions, consolidated reporting becomes nearly impossible.

Unless you have independence.

Regular reviews when residence changes. Tax strategies that actually address multi-jurisdictional exposure. Independent reporting that shows everything without conflicts of interest.

Cross-border enforcement costs countries $492B annually.

Scrutiny keeps getting tighter.

Your domestic estate plan might look flawless on paper. But one undocumented portable asset crossing borders can trigger disasters you never saw coming.

How can we properly plan for cross-border tax exposure when moving high-value portable assets? What strategies should families implement to avoid the tax trap?`;

  console.log('\n📝 FULL QUERY:');
  console.log('-'.repeat(100));
  console.log(query);
  console.log('-'.repeat(100));

  try {
    const startTime = Date.now();
    
    console.log('\n🔄 Processing with Permutation-Lite...');
    console.log('   Domain: financial');
    console.log('   Vector-passing: enabled (Ollama)');
    console.log('   Config: Full pipeline (routing → optimization → learning → verification)\n');
    
    const result = await executePermutationLite(query, 'financial', {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(100));
    console.log('📋 FULL ANSWER:');
    console.log('='.repeat(100));
    console.log(result.answer);
    console.log('='.repeat(100));

    console.log('\n📊 RESPONSE METADATA:');
    console.log('-'.repeat(100));
    console.log(`Domain: ${result.metadata.domain}`);
    console.log(`Difficulty: ${result.metadata.difficulty?.toFixed(3)}`);
    console.log(`Quality Score: ${result.metadata.quality_score?.toFixed(3)}`);
    console.log(`Route: ${result.metadata.routing?.route} (confidence: ${result.metadata.routing?.confidence?.toFixed(2)})`);
    console.log(`Verification: ${result.metadata.verification?.verified ? '✅ Verified' : '❌ Not Verified'}`);
    console.log(`   Confidence: ${result.metadata.verification?.confidence?.toFixed(2)}`);
    console.log(`   Iterations: ${result.metadata.verification?.iterations}`);
    console.log(`Layers Executed: ${result.metadata.layers_executed?.join(' → ')}`);
    console.log(`Processing Time: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`Cost: $${result.metadata.performance?.cost?.toFixed(4)}`);
    
    if (result.metadata.optimization) {
      console.log(`\nGEPA Optimization:`);
      console.log(`   Quality: ${result.metadata.optimization.quality?.toFixed(2)}`);
      console.log(`   Generations: ${result.metadata.optimization.generations}`);
    }
    
    if (result.metadata.learning) {
      console.log(`\nLearning System:`);
      console.log(`   Memories Stored: ${result.metadata.learning.memoriesStored || 0}`);
      console.log(`   Memories Used: ${result.metadata.learning.memoriesUsed || 0}`);
      if (result.metadata.learning.alitaG) {
        console.log(`   Tools Synthesized: ${result.metadata.learning.alitaG.toolsSynthesized || 0}`);
      }
    }

    if (result.metadata.routing) {
      console.log(`\nRouting Details:`);
      console.log(`   Detected Domain: ${result.metadata.routing.domain}`);
      console.log(`   Difficulty Assessment: ${result.metadata.routing.difficulty?.toFixed(3)}`);
      console.log(`   Route Selected: ${result.metadata.routing.route}`);
    }
    
    console.log('-'.repeat(100));

    console.log('\n✅ TEST COMPLETE');
    console.log('='.repeat(100));

    // Save to file
    fs.writeFileSync(
      'portable-asset-tax-trap-result.json',
      JSON.stringify({
        query,
        answer: result.answer,
        metadata: result.metadata,
        duration,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    console.log('\n📁 Full result saved to: portable-asset-tax-trap-result.json');
    
    // Show answer word count and key topics
    const wordCount = result.answer.split(/\s+/).length;
    console.log(`\n📊 Answer Statistics:`);
    console.log(`   Word Count: ${wordCount.toLocaleString()}`);
    console.log(`   Character Count: ${result.answer.length.toLocaleString()}`);
    
    // Check if answer covers key topics
    const keyTopics = [
      'situs',
      'cross-border',
      'jurisdiction',
      'Delaware',
      'UK',
      'tax',
      'planning',
      'compliance',
      'reporting'
    ];
    
    const answerLower = result.answer.toLowerCase();
    const topicsCovered = keyTopics.filter(topic => answerLower.includes(topic.toLowerCase()));
    
    console.log(`\n🎯 Key Topics Covered: ${topicsCovered.length}/${keyTopics.length}`);
    topicsCovered.forEach(topic => console.log(`   ✓ ${topic}`));
    if (topicsCovered.length < keyTopics.length) {
      const missing = keyTopics.filter(t => !topicsCovered.includes(t));
      console.log(`\n⚠️  Topics Not Explicitly Mentioned: ${missing.join(', ')}`);
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testPortableAssetTaxTrap().catch(console.error);

