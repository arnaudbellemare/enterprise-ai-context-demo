#!/bin/bash
# Helper script to add a note to progress.txt
# Usage: ./add-note.sh "Your note here"

set -e

NOTE=$1

if [ -z "$NOTE" ]; then
    echo "Usage: $0 \"Your note here\""
    exit 1
fi

if [ ! -f ".agent-harness/progress.txt" ]; then
    echo "Error: progress.txt not found"
    exit 1
fi

# Add note with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "" >> .agent-harness/progress.txt
echo "[$TIMESTAMP] $NOTE" >> .agent-harness/progress.txt

echo "✅ Note added to progress.txt"

