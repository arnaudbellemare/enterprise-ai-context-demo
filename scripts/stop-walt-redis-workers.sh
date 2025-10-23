#!/bin/bash
# Stop WALT Redis Queue Workers

set -e

echo "🛑 Stopping WALT Redis Workers..."

if [ ! -d ".walt-workers" ]; then
    echo "❌ No workers directory found"
    exit 1
fi

STOPPED=0
for PID_FILE in .walt-workers/*.pid; do
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        WORKER_ID=$(basename "$PID_FILE" .pid)

        if ps -p $PID > /dev/null 2>&1; then
            echo "🛑 Stopping $WORKER_ID (PID: $PID)..."
            kill -TERM $PID

            # Wait for graceful shutdown (max 10 seconds)
            for i in {1..10}; do
                if ! ps -p $PID > /dev/null 2>&1; then
                    echo "   ✅ Stopped gracefully"
                    break
                fi
                sleep 1
            done

            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                echo "   ⚠️ Force killing..."
                kill -9 $PID
            fi

            STOPPED=$((STOPPED + 1))
        else
            echo "⚠️ $WORKER_ID not running (stale PID file)"
        fi

        rm -f "$PID_FILE"
    fi
done

if [ $STOPPED -eq 0 ]; then
    echo "⚠️ No workers were running"
else
    echo ""
    echo "✅ Stopped $STOPPED worker(s)"
fi

# Clean up logs older than 7 days
find .walt-workers -name "*.log" -mtime +7 -delete 2>/dev/null || true

echo ""
