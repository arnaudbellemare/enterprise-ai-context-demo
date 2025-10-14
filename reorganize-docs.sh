#!/bin/bash

# Documentation Reorganization Script
# Moves files to appropriate directories

cd "$(dirname "$0")"

echo "Starting documentation reorganization..."

# Keep these core files in root
KEEP_IN_ROOT=(
  "README.md"
  "ARCHITECTURE.md"
  "QUICK_START.md"
  "CONTRIBUTING.md"
  "BENCHMARKS.md"
  "LICENSE"
)

# Move all remaining .md files to archive (except the ones we want to keep)
echo "Moving documentation files to archive..."
for file in *.md; do
  if [[ ! " ${KEEP_IN_ROOT[@]} " =~ " ${file} " ]] && [ "$file" != "README.new.md" ]; then
    mv "$file" docs/archive/ 2>/dev/null || true
  fi
done

# Move JSON result files to archive
echo "Moving JSON results to archive..."
mv *-results.json docs/archive/ 2>/dev/null || true
mv *.json docs/archive/ 2>/dev/null || true

# Move shell scripts to archive (except this one and important ones)
echo "Moving old scripts to archive..."
for script in *.sh; do
  if [ "$script" != "reorganize-docs.sh" ] && [ "$script" != "deploy-supabase.sh" ]; then
    mv "$script" docs/archive/ 2>/dev/null || true
  fi
done

# Move test files to root (they can stay for now)
echo "Test files remain in root for now..."

echo "Reorganization complete!"
echo ""
echo "Root directory now contains:"
ls -1 *.md 2>/dev/null | head -20
echo ""
echo "Archived files: $(ls -1 docs/archive/ | wc -l)"

