#!/usr/bin/env node
/**
 * Automated Logger Migration Script
 *
 * Replaces console.log/error/warn/debug with structured logger
 *
 * Usage: node scripts/migrate-logger.js [file1] [file2] ...
 *        node scripts/migrate-logger.js --all (migrates all lib files)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const ALL_FILES = process.argv.includes('--all');

// Priority files to migrate
const PRIORITY_FILES = [
  'frontend/lib/config.ts',
  'frontend/lib/monitoring.ts',
  'frontend/lib/trm.ts',
  'frontend/lib/verifier.ts',
  'frontend/lib/smart-router.ts',
  'frontend/lib/model-router.ts',
  'frontend/lib/learned-router.ts',
  'frontend/lib/browserbase-client.ts',
  'frontend/lib/prompt-cache.ts',
  'frontend/lib/ace-executor.ts',
  'frontend/lib/aceplaybook-manager.ts',
];

function migrateFile(filePath) {
  console.log(`\n🔄 Migrating: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found, skipping`);
    return { success: false, reason: 'not_found' };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Count current console usage
  const consoleCount = (content.match(/console\.(log|error|warn|debug)/g) || []).length;

  if (consoleCount === 0) {
    console.log(`  ✅ No console statements found`);
    return { success: true, changes: 0 };
  }

  console.log(`  📊 Found ${consoleCount} console statements`);

  // Check if logger is already imported
  const hasLoggerImport = content.includes("from './logger'") ||
                          content.includes('from "@/lib/logger"');

  // Add logger import if not present
  if (!hasLoggerImport) {
    // Find the last import statement
    const importRegex = /^import .* from ['"].*['"];?$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      // Determine relative path to logger
      const fileDir = path.dirname(filePath);
      const loggerPath = path.relative(fileDir, 'frontend/lib/logger.ts')
        .replace(/\\/g, '/')
        .replace('.ts', '');

      const importStatement = `\nimport { logger } from '${loggerPath.startsWith('.') ? loggerPath : './' + loggerPath}';`;

      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      console.log(`  ➕ Added logger import`);
    }
  }

  // Replace console statements
  let changes = 0;

  // console.log(...) → logger.info(...)
  content = content.replace(/console\.log\(/g, () => {
    changes++;
    return 'logger.info(';
  });

  // console.error(...) → logger.error(...)
  content = content.replace(/console\.error\(/g, () => {
    changes++;
    return 'logger.error(';
  });

  // console.warn(...) → logger.warn(...)
  content = content.replace(/console\.warn\(/g, () => {
    changes++;
    return 'logger.warn(';
  });

  // console.debug(...) → logger.debug(...)
  content = content.replace(/console\.debug\(/g, () => {
    changes++;
    return 'logger.debug(';
  });

  if (changes === 0) {
    console.log(`  ℹ️  No changes needed`);
    return { success: true, changes: 0 };
  }

  console.log(`  ✏️  Replaced ${changes} statements`);

  // Write file
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ File updated`);
  } else {
    console.log(`  🔍 Dry run - no changes written`);
  }

  return { success: true, changes, originalContent, newContent: content };
}

function main() {
  console.log('🚀 Logger Migration Script\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  let filesToMigrate = [];

  if (ALL_FILES) {
    // Get all TypeScript files in frontend/lib
    try {
      const allFiles = execSync('find frontend/lib -name "*.ts" -type f', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(f => f && !f.includes('node_modules'));
      filesToMigrate = allFiles;
      console.log(`📂 Found ${allFiles.length} files in frontend/lib\n`);
    } catch (error) {
      console.error('❌ Error finding files:', error.message);
      process.exit(1);
    }
  } else if (process.argv.length > 2 && !process.argv.includes('--dry-run')) {
    // Use files from command line
    filesToMigrate = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  } else {
    // Use priority files
    filesToMigrate = PRIORITY_FILES;
    console.log(`📋 Migrating ${PRIORITY_FILES.length} priority files\n`);
  }

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    totalChanges: 0
  };

  for (const file of filesToMigrate) {
    const result = migrateFile(file);

    if (result.success) {
      if (result.changes > 0) {
        results.success++;
        results.totalChanges += result.changes;
      } else {
        results.skipped++;
      }
    } else {
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully migrated: ${results.success} files`);
  console.log(`⏭️  Skipped (no console): ${results.skipped} files`);
  console.log(`❌ Failed: ${results.failed} files`);
  console.log(`📝 Total replacements: ${results.totalChanges}`);
  console.log('='.repeat(50));

  if (!DRY_RUN && results.success > 0) {
    console.log('\n⚠️  Important: Run tests to verify nothing broke!');
    console.log('   npm run build && npm test');
  }
}

main();
