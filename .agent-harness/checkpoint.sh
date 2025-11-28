#!/bin/bash
# Create a git checkpoint after completing a feature
# Usage: ./checkpoint.sh "Feature description"

set -e

FEATURE_DESC=$1

if [ -z "$FEATURE_DESC" ]; then
    echo "Usage: $0 \"Feature description\""
    exit 1
fi

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Git not initialized. Skipping checkpoint."
    exit 0
fi

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Create commit
COMMIT_MSG="feat(email): $FEATURE_DESC"
git add .
git commit -m "$COMMIT_MSG"

echo "✅ Checkpoint created: $COMMIT_MSG"
echo ""
echo "📝 Next steps:"
echo "   1. Review the commit: git log -1"
echo "   2. Push if ready: git push"
echo "   3. Update tasks.json with completed status"
echo "   4. Add notes to progress.txt"

