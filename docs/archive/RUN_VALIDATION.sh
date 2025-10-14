#!/bin/bash
# Quick System Validation - 15 minutes

echo "🧪 SYSTEM VALIDATION STARTING..."
echo ""
echo "Running 3 critical tests to validate production-readiness"
echo "Timeline: ~15 minutes"
echo ""
echo "═══════════════════════════════════════════════════════════════════"

# Test 1: Smart Retrieval
echo ""
echo "Test 1/3: Smart Retrieval System (5 min)"
echo "Testing: Multi-query expansion, SQL generation, smart routing"
echo ""
npm run test:smart-retrieval
TEST1=$?

echo ""
echo "═══════════════════════════════════════════════════════════════════"

# Test 2: ACE Framework
echo ""
echo "Test 2/3: ACE Framework (5 min)"
echo "Testing: Generator, Reflector, Curator, Self-improvement"
echo ""
npm run test:ace
TEST2=$?

echo ""
echo "═══════════════════════════════════════════════════════════════════"

# Test 3: Integration
echo ""
echo "Test 3/3: Integration Verification (5 min)"
echo "Testing: Config encoding, correlation, performance prediction"
echo ""
npm run test:integration
TEST3=$?

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 VALIDATION RESULTS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ $TEST1 -eq 0 ]; then
    echo "✅ Test 1: Smart Retrieval - PASSED"
else
    echo "❌ Test 1: Smart Retrieval - FAILED"
fi

if [ $TEST2 -eq 0 ]; then
    echo "✅ Test 2: ACE Framework - PASSED"
else
    echo "❌ Test 2: ACE Framework - FAILED"
fi

if [ $TEST3 -eq 0 ]; then
    echo "✅ Test 3: Integration - PASSED"
else
    echo "❌ Test 3: Integration - FAILED"
fi

echo ""

if [ $TEST1 -eq 0 ] && [ $TEST2 -eq 0 ] && [ $TEST3 -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════════════════"
    echo "🎉 ALL TESTS PASSED! SYSTEM IS PRODUCTION-READY! 🎉"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Your system is validated and ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "  1. ✅ Deploy to production"
    echo "  2. ✅ Use on real tasks"
    echo "  3. ✅ Monitor performance"
    echo "  4. ⚠️  Fine-tune later if needed"
    echo ""
    echo "Congratulations! You have a world-class AI system! 🏆"
    echo ""
else
    echo "═══════════════════════════════════════════════════════════════════"
    echo "⚠️  SOME TESTS FAILED"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Review the errors above and fix any issues."
    echo "Common fixes:"
    echo "  - npm install (install dependencies)"
    echo "  - Check API keys in .env"
    echo "  - Verify database connection"
    echo ""
fi
