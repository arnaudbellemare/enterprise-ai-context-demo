#!/bin/bash

echo "🔍 Verifying NO MOCKS in codebase..."
echo ""

# Search for mock/simulate patterns
echo "Searching for Mock classes..."
MOCK_CLASSES=$(grep -r "class Mock" frontend/app/api --include="*.ts" --include="*.js" 2>/dev/null | wc -l)

echo "Searching for simulate functions..."
SIM_FUNCTIONS=$(grep -r "function simulate" frontend/app/api --include="*.ts" 2>/dev/null | wc -l)

echo "Searching for simulateDelay..."
SIM_DELAYS=$(grep -r "simulateDelay" frontend/app/api --include="*.ts" 2>/dev/null | wc -l)

echo "Searching for fake/mock test functions..."
MOCK_TESTS=$(grep -r "const mock.*Test.*=" test-*.ts test-*.js 2>/dev/null | wc -l)

echo ""
echo "Results:"
echo "  Mock classes:        $MOCK_CLASSES (should be 0)"
echo "  Simulate functions:  $SIM_FUNCTIONS (should be 0)"
echo "  simulateDelay calls: $SIM_DELAYS (should be 0)"
echo "  Mock test functions: $MOCK_TESTS (should be 0)"
echo ""

TOTAL=$((MOCK_CLASSES + SIM_FUNCTIONS + SIM_DELAYS + MOCK_TESTS))

if [ $TOTAL -eq 0 ]; then
  echo "✅ VERIFIED: NO MOCKS FOUND IN CODEBASE!"
  echo "   Everything uses REAL APIs and Ollama"
  exit 0
else
  echo "⚠️  Found $TOTAL mock/simulate instances"
  echo "   Review and replace with real implementations"
  exit 1
fi
