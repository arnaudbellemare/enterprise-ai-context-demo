/**
 * Test: Portable Asset Tax Trap Query
 * 
 * Complex cross-border estate planning and tax question
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';

async function testPortableAssetQuery() {
  console.log('🧪 Testing Portable Asset Tax Trap Query\n');
  console.log('='.repeat(80));

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

Your domestic estate plan might look flawless on paper. But one undocumented portable asset crossing borders can trigger disasters you never saw coming.`;

  const domain = 'financial'; // This is clearly a financial/legal/tax domain question

  console.log(`Query: ${query.substring(0, 200)}...`);
  console.log(`Domain: ${domain}`);
  console.log(`Config: Vector-passing enabled (Ollama - free)\n`);
  console.log('='.repeat(80) + '\n');

  try {
    const startTime = Date.now();
    
    const result = await executePermutationLite(query, domain, {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📋 ANSWER');
    console.log('='.repeat(80));
    console.log(result.answer || 'No answer returned');
    console.log('\n' + '='.repeat(80));
    
    console.log('\n📊 METADATA');
    console.log('-'.repeat(80));
    if (result.metadata) {
      console.log(`Domain: ${result.metadata.domain || 'N/A'}`);
      console.log(`Difficulty: ${result.metadata.difficulty?.toFixed(3) || 'N/A'}`);
      console.log(`Quality Score: ${result.metadata.quality_score?.toFixed(3) || 'N/A'}`);
      if (result.metadata.performance) {
        console.log(`Total Time: ${result.metadata.performance.total_time_ms || 'N/A'}ms`);
        console.log(`Cost: $${result.metadata.performance.cost?.toFixed(4) || '0.0000'}`);
      }
      if (result.metadata.layers_executed) {
        console.log(`Layers Executed: ${result.metadata.layers_executed.join(' → ')}`);
      }
      
      if (result.metadata.routing) {
        console.log(`\nRouting: ${result.metadata.routing.route} (confidence: ${result.metadata.routing.confidence?.toFixed(2) || 'N/A'})`);
      }
      
      if (result.metadata.optimization) {
        console.log(`Optimization: Quality ${result.metadata.optimization.quality?.toFixed(2) || 'N/A'}, ${result.metadata.optimization.generations || 0} generations`);
      }
      
      if (result.metadata.verification) {
        console.log(`Verification: ${result.metadata.verification.verified ? '✅ Verified' : '❌ Not verified'} (confidence: ${result.metadata.verification.confidence?.toFixed(2) || 'N/A'})`);
      }
    } else {
      console.log('No metadata available');
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Test completed in ${duration}ms`);
    console.log('='.repeat(80));

    // Save result
    const fs = require('fs');
    fs.writeFileSync(
      'portable-asset-tax-result.json',
      JSON.stringify({ query, domain, result, timestamp: new Date().toISOString() }, null, 2)
    );
    console.log('\n📁 Full result saved to: portable-asset-tax-result.json');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testPortableAssetQuery().catch(console.error);

