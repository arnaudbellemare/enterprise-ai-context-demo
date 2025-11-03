/**
 * Test Service Platform Queries
 * 
 * Demonstrates permutation-lite handling various service platform requests:
 * - Tax optimization
 * - Collection management
 * - Insurance reporting
 * - Financial planning
 * - Report generation
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';

interface ServiceQuery {
  name: string;
  query: string;
  domain: string;
  expectedCapabilities: string[];
}

const serviceQueries: ServiceQuery[] = [
  {
    name: 'Tax Optimization',
    query: 'Optimize tax filing for a client with $50M in assets across US, UK, and Singapore. They hold art collections, real estate, and trust structures. Generate a comprehensive tax strategy.',
    domain: 'financial',
    expectedCapabilities: ['cross-border planning', 'multi-jurisdictional compliance', 'tax optimization']
  },
  {
    name: 'Collection Management',
    query: 'Manage a $10M art collection with 50 pieces across 3 locations. Optimize insurance coverage, track valuations, and generate compliance reports for US and UK tax authorities.',
    domain: 'financial',
    expectedCapabilities: ['collection management', 'insurance optimization', 'compliance reporting']
  },
  {
    name: 'Insurance Reporting',
    query: 'Generate annual insurance reports for 25 collectible assets totaling $15M. Include valuations, premium analysis, coverage gaps, and renewal recommendations.',
    domain: 'art',
    expectedCapabilities: ['insurance reporting', 'valuation analysis', 'coverage optimization']
  },
  {
    name: 'Financial Planning',
    query: 'Create a 10-year financial plan for a family office managing $200M. Include estate planning, tax optimization, and succession planning for 3 generations.',
    domain: 'financial',
    expectedCapabilities: ['long-term planning', 'estate planning', 'succession planning']
  },
  {
    name: 'Report Generation',
    query: 'Build a comprehensive quarterly report for Client XYZ showing asset valuations, tax exposure, insurance coverage, and compliance status across all jurisdictions.',
    domain: 'financial',
    expectedCapabilities: ['consolidated reporting', 'multi-domain aggregation', 'compliance tracking']
  }
];

async function testServiceQuery(query: ServiceQuery) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 SERVICE: ${query.name}`);
  console.log('='.repeat(80));
  console.log(`Query: ${query.query.substring(0, 150)}...`);
  console.log(`Domain: ${query.domain}`);
  console.log(`Expected: ${query.expectedCapabilities.join(', ')}`);
  console.log('='.repeat(80) + '\n');

  try {
    const startTime = Date.now();
    
    const result = await executePermutationLite(query.query, query.domain, {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('✅ RESPONSE GENERATED');
    console.log('-'.repeat(80));
    console.log(result.answer.substring(0, 500) + '...');
    console.log('\n📊 METRICS:');
    console.log(`   Domain: ${result.metadata.domain}`);
    console.log(`   Difficulty: ${result.metadata.difficulty?.toFixed(3)}`);
    console.log(`   Quality: ${result.metadata.quality_score?.toFixed(3)}`);
    console.log(`   Route: ${result.metadata.routing?.route}`);
    console.log(`   Verified: ${result.metadata.verification?.verified ? '✅' : '❌'}`);
    console.log(`   Time: ${duration}ms`);
    console.log(`   Cost: $${result.metadata.performance?.cost?.toFixed(4)}`);

    // Check if expected capabilities are addressed
    const answerLower = result.answer.toLowerCase();
    const capabilitiesFound = query.expectedCapabilities.filter(cap => 
      answerLower.includes(cap.toLowerCase())
    );

    console.log(`\n✅ Capabilities Addressed: ${capabilitiesFound.length}/${query.expectedCapabilities.length}`);
    capabilitiesFound.forEach(cap => console.log(`   ✓ ${cap}`));
    
    if (capabilitiesFound.length < query.expectedCapabilities.length) {
      const missing = query.expectedCapabilities.filter(cap => !capabilitiesFound.includes(cap));
      console.log(`\n⚠️  Missing Capabilities: ${missing.join(', ')}`);
    }

    return {
      name: query.name,
      success: true,
      duration,
      quality: result.metadata.quality_score,
      verified: result.metadata.verification?.verified,
      capabilitiesFound: capabilitiesFound.length,
      capabilitiesTotal: query.expectedCapabilities.length
    };

  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    return {
      name: query.name,
      success: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 PERMUTATION-LITE SERVICE PLATFORM DEMONSTRATION');
  console.log('='.repeat(80));
  console.log('Testing 5 service platform use cases...\n');

  const results = [];

  for (const query of serviceQueries) {
    const result = await testServiceQuery(query);
    results.push(result);
    
    // Brief pause between queries
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgQuality = successful.reduce((sum, r) => sum + (r.quality || 0), 0) / successful.length;
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const verified = successful.filter(r => r.verified).length;
    const avgCapabilities = successful.reduce((sum, r) => sum + (r.capabilitiesFound || 0) / (r.capabilitiesTotal || 1), 0) / successful.length;
    
    console.log(`\n📈 Average Quality Score: ${avgQuality.toFixed(3)}`);
    console.log(`⏱️  Average Response Time: ${(avgDuration / 1000).toFixed(1)}s`);
    console.log(`✅ Verified Responses: ${verified}/${successful.length}`);
    console.log(`🎯 Capabilities Coverage: ${(avgCapabilities * 100).toFixed(1)}%`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ SERVICE PLATFORM DEMONSTRATION COMPLETE');
  console.log('='.repeat(80));

  // Save results
  const fs = require('fs');
  fs.writeFileSync(
    'service-platform-results.json',
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log('\n📁 Results saved to: service-platform-results.json');
}

runAllTests().catch(console.error);

