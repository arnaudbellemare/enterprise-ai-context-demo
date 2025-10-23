#!/bin/bash
# Check status of WALT Redis Queue Workers

echo "📊 WALT Redis Workers Status"
echo "=" * 60

if [ ! -d ".walt-workers" ]; then
    echo "❌ No workers directory found"
    echo "   Run ./scripts/start-walt-redis-workers.sh to start workers"
    exit 1
fi

RUNNING=0
STOPPED=0

for PID_FILE in .walt-workers/*.pid; do
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        WORKER_ID=$(basename "$PID_FILE" .pid)

        if ps -p $PID > /dev/null 2>&1; then
            # Worker is running
            UPTIME=$(ps -p $PID -o etime= | tr -d ' ')
            MEM=$(ps -p $PID -o rss= | awk '{printf "%.1fMB", $1/1024}')

            echo "✅ $WORKER_ID (PID: $PID)"
            echo "   Uptime: $UPTIME"
            echo "   Memory: $MEM"

            # Show last few log lines
            LOG_FILE=".walt-workers/${WORKER_ID}.log"
            if [ -f "$LOG_FILE" ]; then
                LAST_LINE=$(tail -n 1 "$LOG_FILE" 2>/dev/null)
                if [ -n "$LAST_LINE" ]; then
                    echo "   Last: $LAST_LINE"
                fi
            fi

            RUNNING=$((RUNNING + 1))
        else
            echo "❌ $WORKER_ID (not running, stale PID file)"
            STOPPED=$((STOPPED + 1))
        fi
        echo ""
    fi
done

# Check Redis queue stats
if command -v redis-cli &> /dev/null; then
    REDIS_URL=${REDIS_URL:-redis://localhost:6379}

    echo "📊 Queue Statistics:"
    echo ""

    QUEUE_NAME=${WALT_QUEUE_NAME:-walt:discovery:queue}
    QUEUE_LEN=$(redis-cli LLEN $QUEUE_NAME 2>/dev/null || echo "0")
    PROCESSING=$(redis-cli GET ${QUEUE_NAME}:processing 2>/dev/null || echo "0")
    COMPLETED=$(redis-cli GET ${QUEUE_NAME}:completed 2>/dev/null || echo "0")
    FAILED=$(redis-cli GET ${QUEUE_NAME}:failed 2>/dev/null || echo "0")

    echo "   Queue length: $QUEUE_LEN"
    echo "   Processing: $PROCESSING"
    echo "   Completed: $COMPLETED"
    echo "   Failed: $FAILED"
    echo ""
fi

echo "Summary:"
echo "   Running workers: $RUNNING"
echo "   Stopped workers: $STOPPED"
echo ""

if [ $RUNNING -eq 0 ]; then
    echo "⚠️ No workers running"
    echo "   Start with: ./scripts/start-walt-redis-workers.sh"
fi
