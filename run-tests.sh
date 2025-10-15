#!/bin/bash

echo "🚀 Testing Enhanced PERMUTATION System..."

# Test 1: Check if we're in the right directory
echo "📁 Current directory: $(pwd)"

# Test 2: Check if frontend directory exists
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
else
    echo "❌ Frontend directory not found"
    exit 1
fi

# Test 3: Check if package.json exists
if [ -f "frontend/package.json" ]; then
    echo "✅ Package.json exists"
else
    echo "❌ Package.json not found"
    exit 1
fi

# Test 4: Check if enhanced system files exist
echo "🔍 Checking enhanced system files..."

files=(
    "frontend/lib/qdrant-vector-db.ts"
    "frontend/lib/tool-calling-system.ts"
    "frontend/lib/mem0-core-system.ts"
    "frontend/lib/ax-llm-orchestrator.ts"
    "frontend/lib/enhanced-permutation-engine.ts"
    "frontend/app/api/enhanced-permutation/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Test 5: Check if dependency was added
echo "📦 Checking package.json dependency..."
if grep -q "@qdrant/js-client-rest" frontend/package.json; then
    echo "✅ @qdrant/js-client-rest dependency found"
else
    echo "❌ @qdrant/js-client-rest dependency missing"
fi

# Test 6: Try to run build
echo "🔨 Attempting to run build..."
cd frontend
if npm run build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed"
fi

echo "🎉 Test complete!"
