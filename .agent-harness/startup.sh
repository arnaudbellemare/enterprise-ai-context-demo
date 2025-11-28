#!/bin/bash
# Agent Harness Startup Protocol
# Based on Anthropic's learnings for long-running agents

set -e

echo "🔍 Agent Harness Startup Protocol"
echo "=================================="
echo ""

# Step 1: Verify location
echo "1️⃣  Verifying location..."
pwd
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root. package.json not found."
    exit 1
fi
echo "✅ Location verified"
echo ""

# Step 2: Read git logs + progress files
echo "2️⃣  Reading git history and progress..."
if [ -f ".agent-harness/progress.txt" ]; then
    echo "📝 Recent progress notes:"
    tail -20 .agent-harness/progress.txt
    echo ""
fi

echo "📜 Recent git commits:"
git log --oneline -10 2>/dev/null || echo "⚠️  Git not initialized or no commits yet"
echo ""

# Step 3: Read task list
echo "3️⃣  Reading task list..."
if [ -f ".agent-harness/tasks.json" ]; then
    echo "📋 Task summary:"
    # Extract key stats using jq if available, otherwise use grep
    if command -v jq &> /dev/null; then
        echo "   Total tasks: $(jq '.statistics.totalTasks' .agent-harness/tasks.json)"
        echo "   Completed: $(jq '.statistics.completedTasks' .agent-harness/tasks.json)"
        echo "   In progress: $(jq '.statistics.inProgressTasks' .agent-harness/tasks.json)"
        echo "   Pending: $(jq '.statistics.pendingTasks' .agent-harness/tasks.json)"
        echo "   Completion rate: $(jq '.statistics.completionRate' .agent-harness/tasks.json)"
    else
        echo "   (Install jq for better task summary)"
    fi
    echo ""
    
    # Find highest priority incomplete task
    if command -v jq &> /dev/null; then
        echo "🎯 Highest priority incomplete task:"
        jq -r '.tasks[] | select(.status != "completed") | "   [\(.priority)] \(.id): \(.title) (\(.status))"' .agent-harness/tasks.json | sort -rn | head -1
    fi
else
    echo "⚠️  tasks.json not found"
fi
echo ""

# Step 4: Check dev server status
echo "4️⃣  Checking dev server status..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Dev server running on port 3000"
else
    echo "⚠️  Dev server not running (start with: npm run dev)"
fi
echo ""

# Step 5: Run integration tests (if available)
echo "5️⃣  Running integration tests..."
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test 2>&1 | tail -20 || echo "⚠️  Tests failed or not configured"
else
    echo "⚠️  No test script found in package.json"
fi
echo ""

# Step 6: Summary
echo "6️⃣  Ready to proceed"
echo "==================="
echo ""
echo "📌 Next steps:"
echo "   1. Review progress notes above"
echo "   2. Check git log for recent changes"
echo "   3. Pick highest priority incomplete task"
echo "   4. Work on ONE feature per session"
echo "   5. Commit after completing feature"
echo ""
echo "🚫 Remember:"
echo "   - Do NOT remove or edit tests"
echo "   - Work on ONE feature at a time"
echo "   - Commit frequently"
echo "   - Update progress.txt with notes"
echo ""

