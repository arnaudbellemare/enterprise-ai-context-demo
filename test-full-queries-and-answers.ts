/**
 * Full Query and Answer Tests
 * 
 * Demonstrates permutation-lite with complete queries and full answers displayed
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { executePermutationLite } from './frontend/lib/permutation-lite/permutation-lite-pipeline';
import * as fs from 'fs';

interface TestCase {
  id: number;
  name: string;
  query: string;
  domain?: string;
  category: string;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'Art Insurance Premium',
    query: 'What should be the insurance premium on a painting of Alec Monopoly valued at $125,000? The painting will be displayed in a private gallery in New York with standard security measures.',
    domain: 'art',
    category: 'Appraisal & Insurance'
  },
  {
    id: 2,
    name: 'Cross-Border Tax Planning',
    query: `The portable asset tax trap

Jewelry, art, and collectibles can trigger tax events the moment they cross a border.

A $2M art collection moves from New York to London. The family's Delaware LLC structure? Worthless to UK tax authorities.

Most ultra-high-net-worth families hold assets everywhere. Their estate plans treat each location like separate islands.

How can we properly plan for cross-border tax exposure when moving high-value portable assets?`,
    domain: 'financial',
    category: 'Tax Planning'
  },
  {
    id: 3,
    name: 'Collection Management',
    query: 'A client has a $10M art collection with 50 pieces stored across 3 locations: New York, London, and Singapore. How should we manage insurance coverage, track valuations, and ensure compliance with tax authorities in all three jurisdictions?',
    domain: 'financial',
    category: 'Collection Management'
  },
  {
    id: 4,
    name: 'Estate Planning Strategy',
    query: 'Create an estate planning strategy for a family with $200M in assets including art collections, real estate, and trust structures. The family has members in the US, UK, and Singapore, and we need to optimize for tax efficiency across all three jurisdictions while planning for three generations.',
    domain: 'financial',
    category: 'Financial Planning'
  },
  {
    id: 5,
    name: 'Insurance Report Generation',
    query: 'Generate a comprehensive insurance report for 25 collectible assets with a total value of $15M. The report should include current valuations, premium analysis, coverage gap identification, and specific renewal recommendations for each asset.',
    domain: 'art',
    category: 'Insurance Reporting'
  },
  {
    id: 6,
    name: 'Art Deco Valuation',
    query: 'What should be the insurance premium for a 1925 Art Deco Cartier platinum bracelet valued at $85,000? The bracelet will be worn regularly and occasionally displayed in museum exhibitions. It has original provenance documentation.',
    domain: 'art',
    category: 'Appraisal & Insurance'
  }
];

async function runTest(testCase: TestCase) {
  console.log('\n' + '='.repeat(100));
  console.log(`TEST ${testCase.id}: ${testCase.name}`);
  console.log(`Category: ${testCase.category}`);
  console.log('='.repeat(100));
  
  console.log('\n📝 QUERY:');
  console.log('-'.repeat(100));
  console.log(testCase.query);
  console.log('-'.repeat(100));

  try {
    const startTime = Date.now();
    
    console.log(`\n🔄 Processing... (Domain: ${testCase.domain || 'auto-detect'})`);
    
    const result = await executePermutationLite(testCase.query, testCase.domain, {
      enableVectorPassing: true,
      vectorPassingProvider: 'ollama'
    });
    
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(100));
    console.log('📋 FULL ANSWER:');
    console.log('='.repeat(100));
    console.log(result.answer);
    console.log('\n' + '='.repeat(100));

    console.log('\n📊 METADATA:');
    console.log('-'.repeat(100));
    console.log(`Domain Detected: ${result.metadata.domain}`);
    console.log(`Difficulty: ${result.metadata.difficulty?.toFixed(3)}`);
    console.log(`Quality Score: ${result.metadata.quality_score?.toFixed(3)}`);
    console.log(`Route: ${result.metadata.routing?.route} (confidence: ${result.metadata.routing?.confidence?.toFixed(2)})`);
    console.log(`Verification: ${result.metadata.verification?.verified ? '✅ Verified' : '❌ Not Verified'} (confidence: ${result.metadata.verification?.confidence?.toFixed(2)})`);
    console.log(`Layers Executed: ${result.metadata.layers_executed?.join(' → ')}`);
    console.log(`Processing Time: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`Cost: $${result.metadata.performance?.cost?.toFixed(4)}`);
    
    if (result.metadata.optimization) {
      console.log(`GEPA Optimization: Quality ${result.metadata.optimization.quality?.toFixed(2)}, ${result.metadata.optimization.generations} generations`);
    }
    
    if (result.metadata.learning) {
      console.log(`Learning: ${result.metadata.learning.memoriesStored || 0} memories stored, ${result.metadata.learning.memoriesUsed || 0} memories used`);
    }

    console.log('-'.repeat(100));

    return {
      testCase,
      result,
      duration,
      success: true
    };

  } catch (error: any) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error(error.stack);
    
    return {
      testCase,
      error: error.message,
      success: false
    };
  }
}

async function runAllTests() {
  console.log('🧪 PERMUTATION-LITE FULL QUERY & ANSWER TEST SUITE');
  console.log('='.repeat(100));
  console.log(`Running ${testCases.length} comprehensive tests...`);
  console.log('='.repeat(100));

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n\n[${i + 1}/${testCases.length}] Starting test: ${testCase.name}`);
    
    const result = await runTest(testCase);
    results.push(result);

    // Brief pause between tests
    if (i < testCases.length - 1) {
      console.log('\n⏸️  Pausing 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const totalDuration = Date.now() - startTime;

  // Summary
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(100));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful Tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed Tests: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgQuality = successful.reduce((sum, r) => sum + (r.result.metadata.quality_score || 0), 0) / successful.length;
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const verifiedCount = successful.filter(r => r.result.metadata.verification?.verified).length;
    const avgCost = successful.reduce((sum, r) => sum + (r.result.metadata.performance?.cost || 0), 0) / successful.length;

    console.log(`\n📈 Performance Metrics:`);
    console.log(`   Average Quality Score: ${avgQuality.toFixed(3)}`);
    console.log(`   Average Response Time: ${(avgDuration / 1000).toFixed(1)}s`);
    console.log(`   Verified Responses: ${verifiedCount}/${successful.length} (${((verifiedCount / successful.length) * 100).toFixed(1)}%)`);
    console.log(`   Average Cost per Query: $${avgCost.toFixed(4)}`);
    console.log(`   Total Suite Time: ${(totalDuration / 1000).toFixed(1)}s`);
  }

  console.log('\n📋 Test Results by Category:');
  const categoryStats: Record<string, { total: number; success: number }> = {};
  results.forEach(r => {
    const category = r.testCase.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, success: 0 };
    }
    categoryStats[category].total++;
    if (r.success) categoryStats[category].success++;
  });

  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`   ${category}: ${stats.success}/${stats.total} successful`);
  });

  console.log('\n' + '='.repeat(100));
  console.log('✅ TEST SUITE COMPLETE');
  console.log('='.repeat(100));

  // Save detailed results
  const outputFile = 'full-query-answer-test-results.json';
  fs.writeFileSync(
    outputFile,
    JSON.stringify({
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        totalDuration: totalDuration,
        timestamp: new Date().toISOString()
      },
      results: results.map(r => ({
        testCase: {
          id: r.testCase.id,
          name: r.testCase.name,
          category: r.testCase.category,
          query: r.testCase.query
        },
        success: r.success,
        answer: r.success ? r.result.answer : undefined,
        metadata: r.success ? r.result.metadata : undefined,
        duration: r.success ? r.duration : undefined,
        error: r.success ? undefined : r.error
      }))
    }, null, 2)
  );

  console.log(`\n📁 Detailed results saved to: ${outputFile}`);
  console.log(`   Each test includes full query and complete answer`);
}

runAllTests().catch(console.error);

