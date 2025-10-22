#!/usr/bin/env tsx

/**
 * Cache Warming Script
 *
 * Pre-populates the brain skills cache with common production queries
 * to improve initial response times and cache hit rates.
 *
 * Usage:
 *   npm run warm-cache
 *   tsx scripts/warm-cache.ts
 *   tsx scripts/warm-cache.ts --parallel --concurrency=5
 */

interface WarmingOptions {
  baseUrl: string;
  parallel: boolean;
  concurrency: number;
  verbose: boolean;
}

async function warmCache(options: WarmingOptions) {
  const { baseUrl, parallel, concurrency, verbose } = options;

  console.log('🔥 Starting Cache Warming...');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Mode: ${parallel ? 'Parallel' : 'Sequential'}`);
  console.log(`   Concurrency: ${concurrency}`);
  console.log();

  try {
    // Check current cache status
    console.log('📊 Checking current cache status...');
    const statusResponse = await fetch(`${baseUrl}/api/brain/cache/warm`, {
      method: 'GET'
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to get cache status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (verbose) {
      console.log('   Current Cache Stats:');
      console.log(`   - Size: ${statusData.status.cacheSize}/${statusData.status.maxSize}`);
      console.log(`   - Hit Rate: ${(statusData.status.hitRate * 100).toFixed(1)}%`);
      console.log(`   - Utilization: ${statusData.status.utilizationPercent.toFixed(1)}%`);
      console.log();
    }

    if (!statusData.status.recommendWarmup) {
      console.log('✅ Cache is already well-populated (>20% utilization)');
      console.log('   Skipping warmup. Use --force to override.');
      return;
    }

    // Start warming
    console.log('🔥 Warming cache with default queries...');
    console.log(`   Loading ${statusData.defaultQueries.length} common queries...`);
    console.log();

    const startTime = Date.now();

    const warmResponse = await fetch(`${baseUrl}/api/brain/cache/warm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parallel,
        maxConcurrency: concurrency,
        skipExisting: true
      })
    });

    if (!warmResponse.ok) {
      throw new Error(`Failed to warm cache: ${warmResponse.statusText}`);
    }

    const warmData = await warmResponse.json();
    const duration = Date.now() - startTime;

    console.log('✅ Cache Warming Complete!');
    console.log();
    console.log('📊 Results:');
    console.log(`   Queries Warmed: ${warmData.queriesWarmed}`);
    console.log(`   Queries Skipped: ${warmData.queriesSkipped}`);
    console.log(`   Queries Failed: ${warmData.queriesFailed}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log();
    console.log('📈 Cache Stats:');
    console.log(`   Size: ${warmData.cacheStats.size}/${warmData.cacheStats.maxSize}`);
    console.log(`   Hit Rate: ${(warmData.cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`   Utilization: ${warmData.cacheStats.utilizationPercent.toFixed(1)}%`);

    if (warmData.errors && warmData.errors.length > 0) {
      console.log();
      console.log('⚠️ Errors encountered:');
      warmData.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }

    console.log();
    console.log('🎯 Cache is now ready for production workloads!');

  } catch (error: any) {
    console.error('❌ Cache Warming Failed:', error.message);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): WarmingOptions {
  const args = process.argv.slice(2);

  const options: WarmingOptions = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    parallel: true,
    concurrency: 3,
    verbose: false
  };

  args.forEach(arg => {
    if (arg === '--sequential') {
      options.parallel = false;
    } else if (arg === '--parallel') {
      options.parallel = true;
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Cache Warming Script

Usage:
  npm run warm-cache
  tsx scripts/warm-cache.ts [options]

Options:
  --parallel              Enable parallel warming (default)
  --sequential            Disable parallel warming
  --concurrency=<n>       Set max concurrent queries (default: 3)
  --base-url=<url>        Set base URL (default: http://localhost:3000)
  --verbose, -v           Enable verbose output
  --help, -h              Show this help message

Examples:
  tsx scripts/warm-cache.ts
  tsx scripts/warm-cache.ts --parallel --concurrency=5
  tsx scripts/warm-cache.ts --sequential --verbose
  tsx scripts/warm-cache.ts --base-url=https://production.example.com
      `);
      process.exit(0);
    }
  });

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log('═══════════════════════════════════════════');
  console.log('   PERMUTATION Brain Cache Warming System');
  console.log('═══════════════════════════════════════════');
  console.log();

  await warmCache(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { warmCache, parseArgs };
