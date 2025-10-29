#!/bin/bash
# TypeScript Type Safety Checker
# Analyzes and reports on 'any' type usage across the codebase

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== TypeScript Type Safety Analysis ===${NC}"
echo ""

# Function to count 'any' usage in a file
count_any_usage() {
    local file="$1"
    local count=0

    # Count different patterns of 'any' usage
    count=$((count + $(grep -c ":\s*any\b" "$file" 2>/dev/null || echo 0)))
    count=$((count + $(grep -c "any\[\]" "$file" 2>/dev/null || echo 0)))
    count=$((count + $(grep -c "<any>" "$file" 2>/dev/null || echo 0)))
    count=$((count + $(grep -c "as any" "$file" 2>/dev/null || echo 0)))

    echo "$count"
}

# Analyze directory
TARGET="${1:-frontend/lib}"

if [ ! -d "$TARGET" ]; then
    echo -e "${RED}Error: Directory '$TARGET' not found${NC}"
    exit 1
fi

echo "Target: $TARGET"
echo ""

# Collect statistics
declare -A file_any_count
total_files=0
total_any=0
files_with_any=0

echo "📊 Analyzing TypeScript files..."

# Find all TypeScript files
while IFS= read -r file; do
    ((total_files++))
    count=$(count_any_usage "$file")
    
    if [ "$count" -gt 0 ]; then
        file_any_count["$file"]=$count
        ((files_with_any++))
        ((total_any += count))
    fi
done < <(find "$TARGET" -name "*.ts" -o -name "*.tsx")

# Report results
echo ""
echo -e "${YELLOW}=== Type Safety Report ===${NC}"
echo ""
echo "📁 Files analyzed: $total_files"
echo "⚠️  Files with 'any': $files_with_any"
echo "🔢 Total 'any' occurrences: $total_any"
echo ""

if [ "$total_any" -gt 0 ]; then
    # Calculate percentage
    percentage=$(awk "BEGIN {printf \"%.1f\", ($files_with_any / $total_files) * 100}")
    echo "📊 Type safety score: $(awk "BEGIN {printf \"%.1f\", 100 - $percentage}")%"
    echo ""

    # Show top offenders
    echo -e "${YELLOW}Top 10 files with 'any' usage:${NC}"
    echo ""
    
    for file in "${!file_any_count[@]}"; do
        echo "${file_any_count[$file]} $file"
    done | sort -rn | head -10 | while read count file; do
        echo "  $count occurrences: $file"
    done
    
    echo ""
    
    # Recommendations
    echo -e "${GREEN}💡 Recommendations:${NC}"
    echo ""
    echo "1. Start with files having the most 'any' usage"
    echo "2. Replace 'any' with proper interfaces or types:"
    echo ""
    echo "   ❌ function process(data: any): any"
    echo "   ✅ function process(data: ProcessData): ProcessResult"
    echo ""
    echo "3. Use 'unknown' as a safer alternative when type is truly unknown:"
    echo ""
    echo "   ❌ function parse(input: any)"
    echo "   ✅ function parse(input: unknown)"
    echo ""
    echo "4. Create shared type definitions in lib/types/"
    echo ""
    echo "5. Run ESLint to find remaining issues:"
    echo "   cd frontend && npm run lint"
    echo ""
else
    echo -e "${GREEN}✅ No 'any' types found! Excellent type safety!${NC}"
fi

# Generate improvement script
if [ "$total_any" -gt 0 ]; then
    echo ""
    read -p "Generate type improvement script? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        improvement_script="scripts/generated-type-improvements.sh"
        
        cat > "$improvement_script" << 'IMPROVE_EOF'
#!/bin/bash
# Auto-generated Type Improvement Script
# Created by type-safety-checker.sh

echo "🔧 Type Improvement Suggestions"
echo ""
echo "This script provides specific improvements for files with 'any' usage."
echo "Review each suggestion and apply manually for safety."
echo ""

IMPROVE_EOF

        for file in "${!file_any_count[@]}"; do
            count=${file_any_count[$file]}
            if [ "$count" -gt 5 ]; then
                echo "echo \"📝 $file ($count 'any' occurrences)\"" >> "$improvement_script"
                echo "echo \"   Priority: HIGH - Review immediately\"" >> "$improvement_script"
                echo "echo \"\"" >> "$improvement_script"
            fi
        done
        
        chmod +x "$improvement_script"
        echo "✅ Created improvement script: $improvement_script"
    fi
fi
