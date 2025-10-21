/**
 * Brain Systems Compatibility Verification
 *
 * Verifies that the new brain-skills system doesn't break existing functionality
 * by checking file dependencies and imports
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files that must exist for brain route to work
const requiredFiles = [
  'frontend/app/api/brain/route.ts',
  'frontend/app/api/brain-enhanced/route.ts',
  'frontend/lib/advanced-context-system.ts',
  'frontend/lib/ax-zod-real-integration.ts',
  'frontend/lib/ax-llm-zod-integration.ts',
  'frontend/lib/brain-evaluation-system.ts',
  'frontend/lib/multilingual-business-intelligence.ts',
  'frontend/lib/advanced-rag-techniques.ts',
  'frontend/lib/advanced-reranking-techniques.ts'
];

// New brain-skills files
const newFiles = [
  'frontend/lib/brain-skills/index.ts',
  'frontend/lib/brain-skills/types.ts',
  'frontend/lib/brain-skills/base-skill.ts',
  'frontend/lib/brain-skills/skill-cache.ts',
  'frontend/lib/brain-skills/skill-metrics.ts',
  'frontend/lib/brain-skills/skill-registry.ts',
  'frontend/lib/brain-skills/trm-skill.ts',
  'frontend/lib/brain-skills/gepa-skill.ts',
  'frontend/lib/brain-skills/ace-skill.ts',
  'frontend/lib/brain-skills/kimi-k2-skill.ts'
];

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function checkImports(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return { exists: false, imports: [] };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return { exists: true, imports };
}

function verifyCompatibility() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Brain Systems Compatibility Verification                    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

  let allPassed = true;

  // Check required files for existing brain system
  log('\n📋 Checking required files for existing brain system...', 'blue');

  for (const file of requiredFiles) {
    const exists = checkFileExists(file);
    if (exists) {
      log(`  ✓ ${file}`, 'green');
    } else {
      log(`  ✗ ${file} - MISSING!`, 'red');
      allPassed = false;
    }
  }

  // Check new brain-skills files
  log('\n📋 Checking new brain-skills system files...', 'blue');

  for (const file of newFiles) {
    const exists = checkFileExists(file);
    if (exists) {
      log(`  ✓ ${file}`, 'green');
    } else {
      log(`  ✗ ${file} - MISSING!`, 'red');
      allPassed = false;
    }
  }

  // Check brain route imports
  log('\n🔍 Analyzing brain route imports...', 'blue');

  const brainRoute = checkImports('frontend/app/api/brain/route.ts');
  if (brainRoute.exists) {
    log(`  ✓ Brain route file exists`, 'green');
    log(`  📦 Imports found: ${brainRoute.imports.length}`, 'blue');

    // Check if any imports use the new brain-skills system
    const usesNewSystem = brainRoute.imports.some(imp =>
      imp.includes('brain-skills')
    );

    if (usesNewSystem) {
      log(`  ℹ️  Brain route is using new brain-skills system`, 'yellow');
    } else {
      log(`  ℹ️  Brain route is using original implementation`, 'blue');
      log(`  ℹ️  (This is OK - new system is opt-in)`, 'blue');
    }

    // Verify all required imports exist
    for (const importPath of brainRoute.imports) {
      if (importPath.startsWith('.')) {
        // Relative import - resolve it
        const resolvedPath = path.join(
          'frontend/app/api/brain',
          importPath.replace(/^\.\.\//, '')
        );

        // Check if it's a .ts or directory with index.ts
        const tsPath = `${resolvedPath}.ts`;
        const indexPath = `${resolvedPath}/index.ts`;

        if (checkFileExists(tsPath) || checkFileExists(indexPath)) {
          log(`    ✓ ${importPath}`, 'green');
        } else {
          log(`    ✗ ${importPath} - Cannot resolve!`, 'red');
          allPassed = false;
        }
      }
    }
  } else {
    log(`  ✗ Brain route file not found!`, 'red');
    allPassed = false;
  }

  // Check brain-enhanced route
  log('\n🔍 Analyzing brain-enhanced route...', 'blue');

  const enhancedRoute = checkImports('frontend/app/api/brain-enhanced/route.ts');
  if (enhancedRoute.exists) {
    log(`  ✓ Brain-enhanced route file exists`, 'green');
    log(`  📦 Imports found: ${enhancedRoute.imports.length}`, 'blue');
  } else {
    log(`  ✗ Brain-enhanced route file not found!`, 'red');
    allPassed = false;
  }

  // Check database migration
  log('\n💾 Checking database migration...', 'blue');

  const migrationExists = checkFileExists('supabase/migrations/012_brain_skill_metrics.sql');
  if (migrationExists) {
    log(`  ✓ Migration file exists`, 'green');
  } else {
    log(`  ✗ Migration file not found!`, 'red');
    allPassed = false;
  }

  // Check metrics API endpoint
  log('\n🌐 Checking metrics API endpoint...', 'blue');

  const metricsAPI = checkFileExists('frontend/app/api/brain/metrics/route.ts');
  if (metricsAPI) {
    log(`  ✓ Metrics API endpoint exists`, 'green');
  } else {
    log(`  ⚠️  Metrics API endpoint not found (optional)`, 'yellow');
  }

  // Summary
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                     Verification Summary                         ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

  if (allPassed) {
    log('\n✅ All compatibility checks passed!', 'green');
    log('✅ Existing brain system files are intact', 'green');
    log('✅ New brain-skills system files are present', 'green');
    log('✅ No breaking changes detected', 'green');
    log('\n💡 Next steps:', 'blue');
    log('  1. Run database migration: supabase/migrations/012_brain_skill_metrics.sql', 'blue');
    log('  2. Start server: npm run dev', 'blue');
    log('  3. Test endpoints: node test-brain-systems.js', 'blue');
  } else {
    log('\n❌ Some compatibility checks failed!', 'red');
    log('⚠️  Please review the errors above', 'yellow');
  }

  log('\n');

  return allPassed;
}

// Run verification
const passed = verifyCompatibility();
process.exit(passed ? 0 : 1);
