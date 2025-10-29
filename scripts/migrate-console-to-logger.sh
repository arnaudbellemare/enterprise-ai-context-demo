#!/bin/bash
# Console to Logger Migration Script
# Safely migrates console.* calls to structured logger calls
#
# Usage:
#   ./scripts/migrate-console-to-logger.sh [file_or_directory]
#   ./scripts/migrate-console-to-logger.sh frontend/lib/ace-framework.ts
#   ./scripts/migrate-console-to-logger.sh frontend/lib/

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
MODIFIED_FILES=0
TOTAL_REPLACEMENTS=0

# Function to check if logger import exists
has_logger_import() {
    local file="$1"
    grep -q "import.*logger.*from.*@/lib/logger" "$file" 2>/dev/null
}

# Function to add logger import
add_logger_import() {
    local file="$1"

    # Find the last import statement
    local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

    if [ -z "$last_import_line" ]; then
        # No imports found, add at top after initial comments
        last_import_line=$(grep -n "^\s*$" "$file" | head -1 | cut -d: -f1)
        [ -z "$last_import_line" ] && last_import_line=1
    fi

    # Insert logger import after last import
    sed -i '' "${last_import_line}a\\
import { logger } from '@/lib/logger';\\
" "$file"
}

# Function to migrate a single file
migrate_file() {
    local file="$1"
    local count=0

    # Skip if not a TypeScript file
    if [[ ! "$file" =~ \.(ts|tsx)$ ]]; then
        return 0
    fi

    # Skip test files (they're allowed to use console)
    if [[ "$file" =~ \.test\.(ts|tsx)$ ]] || [[ "$file" =~ \.spec\.(ts|tsx)$ ]] || [[ "$file" =~ __tests__ ]]; then
        return 0
    fi

    # Skip if file doesn't contain console calls
    if ! grep -q "console\." "$file" 2>/dev/null; then
        return 0
    fi

    echo -e "${YELLOW}Processing: $file${NC}"

    # Create backup
    cp "$file" "$file.backup"

    # Add logger import if not present
    if ! has_logger_import "$file"; then
        add_logger_import "$file"
        echo "  ✓ Added logger import"
    fi

    # Perform replacements with context preservation
    # console.log(...) -> logger.info(...)
    local log_count=$(grep -c "console\.log(" "$file" 2>/dev/null || echo 0)
    if [ "$log_count" -gt 0 ]; then
        sed -i '' 's/console\.log(/logger.info(/g' "$file"
        count=$((count + log_count))
        echo "  ✓ Replaced $log_count console.log() calls"
    fi

    # console.error(...) -> logger.error(...)
    local error_count=$(grep -c "console\.error(" "$file" 2>/dev/null || echo 0)
    if [ "$error_count" -gt 0 ]; then
        sed -i '' 's/console\.error(/logger.error(/g' "$file"
        count=$((count + error_count))
        echo "  ✓ Replaced $error_count console.error() calls"
    fi

    # console.warn(...) -> logger.warn(...)
    local warn_count=$(grep -c "console\.warn(" "$file" 2>/dev/null || echo 0)
    if [ "$warn_count" -gt 0 ]; then
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
        count=$((count + warn_count))
        echo "  ✓ Replaced $warn_count console.warn() calls"
    fi

    # console.debug(...) -> logger.debug(...)
    local debug_count=$(grep -c "console\.debug(" "$file" 2>/dev/null || echo 0)
    if [ "$debug_count" -gt 0 ]; then
        sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
        count=$((count + debug_count))
        echo "  ✓ Replaced $debug_count console.debug() calls"
    fi

    if [ "$count" -gt 0 ]; then
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
        TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + count))
        echo -e "  ${GREEN}Total replacements in file: $count${NC}"
    else
        # No changes made, remove backup
        rm "$file.backup"
    fi

    TOTAL_FILES=$((TOTAL_FILES + 1))
}

# Function to rollback changes
rollback() {
    echo -e "${RED}Rolling back changes...${NC}"
    find "$TARGET" -name "*.backup" -type f | while read backup; do
        original="${backup%.backup}"
        mv "$backup" "$original"
        echo "  ✓ Restored $original"
    done
    echo -e "${GREEN}Rollback complete${NC}"
    exit 1
}

# Function to cleanup backups
cleanup_backups() {
    find "$TARGET" -name "*.backup" -type f -delete
    echo -e "${GREEN}✓ Removed backup files${NC}"
}

# Trap errors for rollback
trap rollback ERR

# Main execution
main() {
    TARGET="${1:-.}"

    echo -e "${GREEN}=== Console to Logger Migration ===${NC}"
    echo "Target: $TARGET"
    echo ""

    # Check if target exists
    if [ ! -e "$TARGET" ]; then
        echo -e "${RED}Error: Target '$TARGET' does not exist${NC}"
        exit 1
    fi

    # Process files
    if [ -f "$TARGET" ]; then
        # Single file
        migrate_file "$TARGET"
    else
        # Directory
        find "$TARGET" -name "*.ts" -o -name "*.tsx" | while read file; do
            migrate_file "$file"
        done
    fi

    # Summary
    echo ""
    echo -e "${GREEN}=== Migration Summary ===${NC}"
    echo "Files processed: $TOTAL_FILES"
    echo "Files modified: $MODIFIED_FILES"
    echo "Total replacements: $TOTAL_REPLACEMENTS"
    echo ""

    # Ask for confirmation
    if [ "$MODIFIED_FILES" -gt 0 ]; then
        echo -e "${YELLOW}Review the changes carefully.${NC}"
        echo "Backup files created with .backup extension"
        echo ""
        read -p "Keep changes? (y/N): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup_backups
            echo -e "${GREEN}✓ Migration complete!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Run 'npm run lint' to verify no linting errors"
            echo "2. Run 'npm test' to ensure tests pass"
            echo "3. Review git diff to verify changes"
            echo "4. Commit changes if everything looks good"
        else
            rollback
        fi
    else
        echo -e "${YELLOW}No files needed migration${NC}"
    fi
}

main "$@"
