#!/bin/bash
# Helper script to update task status in tasks.json
# Usage: ./update-task.sh <task-id> <status>
# Status: pending, in_progress, completed, blocked

set -e

TASK_ID=$1
NEW_STATUS=$2

if [ -z "$TASK_ID" ] || [ -z "$NEW_STATUS" ]; then
    echo "Usage: $0 <task-id> <status>"
    echo "Status: pending, in_progress, completed, blocked"
    exit 1
fi

if [ ! -f ".agent-harness/tasks.json" ]; then
    echo "Error: tasks.json not found"
    exit 1
fi

# Update task status using jq if available
if command -v jq &> /dev/null; then
    # Update the task status
    jq --arg id "$TASK_ID" --arg status "$NEW_STATUS" \
       '(.tasks[] | select(.id == $id) | .status) = $status' \
       .agent-harness/tasks.json > .agent-harness/tasks.json.tmp
    
    # Update lastUpdated timestamp
    jq --arg now "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.lastUpdated = $now' \
       .agent-harness/tasks.json.tmp > .agent-harness/tasks.json
    
    rm .agent-harness/tasks.json.tmp
    
    echo "✅ Updated task $TASK_ID to status: $NEW_STATUS"
else
    echo "⚠️  jq not installed. Install with: brew install jq"
    echo "   Or manually edit .agent-harness/tasks.json"
    exit 1
fi

